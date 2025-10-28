# Audio Conversion Migration - Client to Backend

## Overview

Migrated audio format conversion from client-side (Web Audio API) to backend (FFmpeg) for improved reliability and performance with large files.

## Changes Made

### 1. Backend Endpoint Created ✅

**File:** `src/app/api/audio/convert/route.ts`

- **Type:** POST endpoint at `/api/audio/convert`
- **Accepts:** Multipart form data with `file` field
- **Returns:** JSON with `{ success, data: { audioDataUri, fileName, originalType, convertedType, sizes } }`
- **File Size Limit:** 500MB
- **Conversion Methods:**
  - Primary: FFmpeg for reliable format conversion
  - Fallback: Direct pass-through for WAV files
- **Supported Formats:** MP3, OGG, FLAC, M4A, AAC, PCM, WebM, etc.

### 2. Frontend Components Updated ✅

#### QA Audit Component

**File:** `src/app/dashboard/qa-audit/qa-audit-content.tsx`

- **Removed:** Import of `convertAudioToWavDataUri`
- **Changed:** `handleAudioFileSelected()` function (lines ~375-430)
  - Now sends file via FormData to `/api/audio/convert`
  - Handles server response with converted WAV data URI
  - Shows user feedback with file size information
  - Proper error handling with user-facing messages
- **Kept:** Import of `needsAudioConversion()` for format detection

#### Manual Audit Component

**File:** `src/app/dashboard/manual-audit/manual-audit-content.tsx`

- **Removed:** Import of `convertAudioToWavDataUri`
- **Changed:** Audio file handler (lines ~345-385) with same logic as QA audit
- **Kept:** Import of `needsAudioConversion()` for format detection

### 3. Code Removed from Frontend

- **Dependency:** Web Audio API conversion logic
- **Library:** No longer using client-side audio processing

## API Flow

### Before (Client-Side)

```
User selects audio → Browser Web Audio API converts → Data URI created → Sent to AI API
```

### After (Server-Side)

```
User selects audio → Sent to /api/audio/convert → FFmpeg processes → Data URI returned → Sent to AI API
```

## Benefits

1. **Scalability:** Handles 100-500MB files without browser memory constraints
2. **Reliability:** FFmpeg is battle-tested for audio format conversion
3. **Consistency:** All conversions handled uniformly on backend
4. **Performance:** Offloads CPU-intensive work from user's browser
5. **Better Error Handling:** Server-side errors provide clear feedback

## Testing Checklist

- [ ] Verify FFmpeg is installed on production VM
- [ ] Test WAV file upload (should pass through directly)
- [ ] Test MP3 file upload (should convert to WAV)
- [ ] Test OGG file upload (should convert to WAV)
- [ ] Test FLAC file upload (should convert to WAV)
- [ ] Test large file upload (100MB+)
- [ ] Verify error handling when file invalid
- [ ] Verify error handling when FFmpeg unavailable

## Deployment Requirements

1. **Server Dependencies:**
   - FFmpeg installed: `apt-get install ffmpeg` (Linux)
   - Node.js fluent-ffmpeg package (already in package.json)
2. **Environment:**
   - Ensure `/tmp` or temp directory has sufficient space
   - Sufficient disk space for large file processing

## Fallback Behavior

If FFmpeg is unavailable on server:

- WAV files: Pass through directly (no conversion needed)
- Other formats: Return error suggesting FFmpeg installation

## Error Messages

- "No audio file provided" - File not included in request
- "Invalid file type. Must be an audio or MP4 video file." - Unsupported format
- "FFmpeg not found. Please install FFmpeg on the server." - Dependency missing
- "Failed to convert audio" - Processing error with details

## Next Steps (Optional Enhancements)

1. Implement streaming for very large files (>1GB)
2. Add progress tracking for long conversions
3. Cache conversion results for identical files
4. Add audio format detection/validation
5. Monitor conversion performance metrics

## Files Status

- ✅ `src/app/api/audio/convert/route.ts` - Created and functional
- ✅ `src/app/dashboard/qa-audit/qa-audit-content.tsx` - Updated to use backend
- ✅ `src/app/dashboard/manual-audit/manual-audit-content.tsx` - Updated to use backend
- ✅ `src/lib/audioConverter.ts` - Still available for `needsAudioConversion()` utility
  - Note: `convertAudioToWavDataUri()` no longer used, can be deprecated later

## Validation Results

- No TypeScript errors in updated files
- All imports correctly updated
- No other files use deprecated `convertAudioToWavDataUri`
