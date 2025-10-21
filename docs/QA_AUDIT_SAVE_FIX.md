# QA Audit Save Form Fix - October 21, 2025

## Problem

When users clicked "Save" on the QA audit form after completing an audit, the API returned validation errors even though the audit was successfully saved. The error showed:

```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "code": "unrecognized_keys",
      "keys": [
        "callId",
        "callDate",
        "campaignId",
        "campaignName",
        "auditResults",
        "maxPossibleScore",
        "transcript",
        "auditedBy"
      ],
      "message": "Unrecognized key(s) in object"
    }
  ]
}
```

But the response also showed `"success": true` with the saved audit data, confusing the frontend error handler.

## Root Cause

The `convertSavedAuditItemToCreateAuditFormat()` function in both `qa-audit-content.tsx` and `manual-audit-content.tsx` was:

1. **Sending wrong field names** that didn't match the API schema

   - Sending: `callId`, `campaignName`, `auditResults`, `transcript`, etc.
   - API expects: `interactionId`, `qaParameterSetName`, `parameters` (with nested structure), `callTranscript`, etc.

2. **Looking for data in wrong locations**

   - Looking for: `savedAudit.auditData.transcriptionInOriginalLanguage`
   - Data was actually at: `savedAudit.transcript` (at the root level)
   - Looking for: `savedAudit.auditData.auditResults`
   - Data was actually at: `savedAudit.auditResults` (at the root level)

3. **Not handling both data structures**
   - The API returns audits with flat structure (callId, transcript, auditResults at root)
   - But the code expected nested structure (inside auditData)

## Solution Implemented

### 1. **Fixed Field Mapping in Conversion Function**

Updated `convertSavedAuditItemToCreateAuditFormat()` to:

```typescript
return {
  // API expects: interactionId, not callId
  interactionId: (savedAudit as any).callId || savedAudit.id,

  // Map all other required fields
  agentName: savedAudit.agentName,
  customerName: (savedAudit as any).customerName || "Unknown Customer",
  qaParameterSetId: savedAudit.campaignName || "default",
  qaParameterSetName: savedAudit.campaignName || "Unknown Parameter Set",

  // API expects: callTranscript, not transcript
  callTranscript: transcript,

  // Map auditResults to parameters structure
  parameters: [
    {
      id: "audit-results",
      name: "Audit Results",
      subParameters: auditResults.map((result: any) => ({
        id: result.parameterId || result.id || "unknown",
        name: result.parameterName || result.name || "Unknown",
        weight: result.maxScore || result.weight || 100,
        type: result.type || "Non-Fatal",
        score: result.score || 0,
        comments: result.comments || "",
      })),
    },
  ],
};
```

### 2. **Made Data Extraction Flexible**

Data can come from both API response format and internal SavedAuditItem format:

```typescript
// Extract auditResults from either location
const auditResults =
  (savedAudit as any).auditResults || savedAudit.auditData?.auditResults || [];

// Extract transcript from either location
const transcript =
  (savedAudit as any).transcript ||
  savedAudit.auditData?.transcriptionInOriginalLanguage ||
  "";
```

### 3. **Improved Error Handling**

Added better error logging to see what the API actually returned:

```typescript
const responseData = await response.json();

if (!response.ok || !responseData.success) {
  const errorDetails = responseData.details
    ? JSON.stringify(responseData.details, null, 2)
    : responseData.error || "Failed to save audit";
  console.error("API Error:", errorDetails);
  throw new Error(responseData.error || "Failed to save audit");
}
```

## Changes Made

### Files Modified

1. **`src/app/dashboard/qa-audit/qa-audit-content.tsx`**

   - Lines 221-268: Rewrote `convertSavedAuditItemToCreateAuditFormat()`
   - Lines 528-548: Improved error handling in save function
   - Added console logging of sent data for debugging

2. **`src/app/dashboard/manual-audit/manual-audit-content.tsx`**
   - Lines 117-164: Rewrote `convertSavedAuditItemToCreateAuditFormat()`
   - Lines 393-421: Improved error handling in save function
   - Added console logging of sent data for debugging

## API Schema Reference

The `/api/audits` POST endpoint expects:

```typescript
{
  // Required minimum
  agentName: string;
  interactionId: string;

  // Optional but recommended
  auditName?: string;
  customerName?: string;
  qaParameterSetId?: string;
  qaParameterSetName?: string;
  callTranscript?: string;
  overallScore?: number;
  auditType?: "manual" | "ai";
  auditorId?: string;
  auditorName?: string;
  auditDate?: string (ISO 8601);

  // Parameters structure
  parameters?: Array<{
    id: string;
    name: string;
    subParameters: Array<{
      id: string;
      name: string;
      weight: number;
      type: "Non-Fatal" | "Fatal" | "ZTP";
      score: number;
      comments?: string;
    }>;
  }>;
}
```

## Testing the Fix

### Before Fix

- User completes QA audit
- Clicks "Save"
- Sees "Failed to save audit" error
- But audit is actually saved in the database ❌

### After Fix

- User completes QA audit
- Clicks "Save"
- Audit successfully saves with correct data
- "Audit Saved" success message shows ✅
- No validation errors in console ✅

## Monitoring

Watch the browser console for:

```
Sending audit data to API: {
  agentName: "...",
  interactionId: "...",
  callTranscript: "...",
  parameters: [...]
}
```

This confirms the correct data format is being sent.

## Impact

- ✅ Users now see success messages when audits save correctly
- ✅ No more false error messages
- ✅ Audits continue to save with correct data structure
- ✅ Both QA and manual audit forms use the same correct format
- ✅ Backend API validation passes without issues

## Deployment

This fix is backward compatible:

- Existing saved audits are not affected
- The conversion function handles both old and new data formats
- No database migrations needed

## Future Improvements

1. Add real-time validation feedback on the form
2. Show partial validation results before saving
3. Add audit preview before saving
4. Implement audit versioning/history
5. Add success animation/confirmation dialog
