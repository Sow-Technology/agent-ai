# Stack Overflow Fix - Audio Upload Form Reset - October 21, 2025

## Problem

When users clicked "Save Audit" after completing a QA audit, the browser console showed:

```
Error saving audit: RangeError: Maximum call stack size exceeded
    at Object.clearFile (...)
```

The audit data was being sent correctly to the API, but the form reset was causing infinite recursion.

## Root Cause

The `resetSingleAuditForm()` function was calling `audioInputRef.current?.clearFile()`, which:

1. Called `clearFile()` on the AudioUploadDropzone component
2. `clearFile()` internally called `onFileSelected(null)` callback
3. This state update triggered re-renders
4. The re-render caused something to call `clearFile()` again
5. Creating infinite recursion → Stack overflow

**Same issue in manual audit:**

- `handleManualAudioFileSelected()` was calling `clearFile()` when file validation failed
- This created a loop since clearing the file also triggers the `onFileSelected` callback

## Solution

**Remove the `clearFile()` calls** since we're already updating the state directly. The state updates alone are sufficient to reset the form.

### Changes Made

**File: `src/app/dashboard/qa-audit/qa-audit-content.tsx` (Line 572-590)**

```diff
  const resetSingleAuditForm = () => {
    setQaAgentUserId("");
    setQaCampaignName("");
    setSelectedAudioFile(null);
    setOriginalAudioDataUri(null);
    setPreviewAudioSrc(null);
    setAudioKey(Date.now().toString());
-   audioInputRef.current?.clearFile();  // ❌ Removed - causes infinite recursion
    setQaCallLanguage(DEFAULT_CALL_LANGUAGE);
    // ... rest of state updates
  };
```

**File: `src/app/dashboard/manual-audit/manual-audit-content.tsx` (Line 334-352)**

```diff
  const handleManualAudioFileSelected = (file: File | null) => {
    setManualSelectedAudioFile(null);
    setManualAudioDataUri(null);
    setManualPreviewAudioSrc(null);
    setAudioAnalysisResult(null);
    setManualAudioKey(Date.now().toString());
    if (!file) {
-     manualAudioInputRef.current?.clearFile();  // ❌ Removed - causes recursion
      return;
    }
    if (!file.type.startsWith("audio/") && file.type !== "video/mp4") {
      toast({ title: "Invalid file type", variant: "destructive" });
-     manualAudioInputRef.current?.clearFile();  // ❌ Removed
      return;
    }
    if (file.size > MAX_AUDIO_FILE_SIZE_BYTES) {
      toast({ title: "File too large", variant: "destructive" });
-     manualAudioInputRef.current?.clearFile();  // ❌ Removed
      return;
    }
    // ... rest of handler
  };
```

## Why This Works

1. **State updates alone are sufficient** - Setting `setSelectedAudioFile(null)` automatically clears the file upload state
2. **No circular dependencies** - We avoid calling the callback that triggered the state update in the first place
3. **Clean form reset** - Changing `setAudioKey(Date.now().toString())` forces the component to re-mount, effectively clearing the UI

## How the Form Reset Now Works

```typescript
// User clicks "Save Audit"
→ Audit is sent to API
→ If successful:
  → resetSingleAuditForm() is called
    → setSelectedAudioFile(null)          // Clear file state
    → setPreviewAudioSrc(null)            // Clear preview
    → setAudioKey(Date.now().toString())  // Force component remount
    → All other form fields reset
    → NO circular clearFile() call
→ Success toast shown
```

## Testing

### Before Fix

```
1. User clicks "Save Audit"
2. Audit sends to API ✓
3. API responds successfully ✓
4. resetSingleAuditForm() called
5. clearFile() triggers infinite recursion ✗
6. Stack overflow error ✗
7. Error toast shown (but audit saved) ✗
```

### After Fix

```
1. User clicks "Save Audit"
2. Audit sends to API ✓
3. API responds successfully ✓
4. resetSingleAuditForm() called
5. All state reset directly ✓
6. No recursion ✓
7. Form cleared ✓
8. Success toast shown ✓
9. Ready for next audit ✓
```

## Impact

✅ No more stack overflow errors
✅ Forms properly reset after saving
✅ Users see success messages (not error messages)
✅ Audio input component properly cleared
✅ Ready to process next audit immediately

## Build Status

- ✅ Build successful
- ✅ No TypeScript errors
- ✅ All routes compiled
- ✅ Ready for production

## Files Modified

1. `src/app/dashboard/qa-audit/qa-audit-content.tsx` - Line 580 (commented out clearFile call)
2. `src/app/dashboard/manual-audit/manual-audit-content.tsx` - Lines 340, 345, 350 (removed clearFile calls)

## Why This Approach is Better

Instead of trying to "sync" the ref with the form state, we simply rely on React's state management:

| Approach                   | Problem                           | Solution                               |
| -------------------------- | --------------------------------- | -------------------------------------- |
| Call `clearFile()` via ref | Creates circular dependency       | Don't call it - use state              |
| Update state only          | File input doesn't visually clear | Changing `audioKey` remounts component |
| Both state + ref clear     | Infinite recursion                | Choose one - state is simpler          |

**Lesson**: When using forwardRef and imperative handles, be careful about circular dependencies with callbacks that update the same state being passed to the component.
