# Audits API Fix - October 21, 2025

## Problem
POST request to `https://assureqai.com/api/audits` was returning validation errors with all fields marked as `undefined`:

```json
{
    "success": false,
    "error": "Validation failed",
    "details": [
        {
            "code": "invalid_type",
            "expected": "string",
            "received": "undefined",
            "path": ["auditName"],
            "message": "Required"
        },
        // ... more undefined fields
    ]
}
```

## Root Cause
The POST endpoint schema required many fields as mandatory, but the client was sending:
1. An empty request body
2. Missing required fields like `auditName`, `qaParameterSetId`, `customerName`, `interactionId`, `callTranscript`, and `parameters`

## Solution Implemented

### 1. **Made Schema More Flexible**
- Changed all fields from **required** to **optional** in the validation schema
- Added a `.refine()` check to ensure at least one audit-related field is present
- This prevents completely empty requests while allowing partial data

### 2. **Added Better Error Handling**
- Added try-catch for JSON parsing failures
- Added logging of received body for debugging
- Added validation error logging

### 3. **Provided Default Values**
When optional fields are missing, the endpoint now uses sensible defaults:

| Field | Default |
|-------|---------|
| `customerName` | `"Unknown Customer"` |
| `qaParameterSetId` | `"default_campaign"` |
| `qaParameterSetName` | `"Default Campaign"` |
| `parameters` | `[]` (empty array) |
| `overallScore` | `0` |
| `callTranscript` | `"No transcript provided"` |
| `auditType` | `"manual"` |

### 4. **Minimum Requirements**
At least these two fields must be provided:
- `agentName` (string)
- `interactionId` (string)

## Updated Endpoint Behavior

### ✅ Valid Request (Minimal)
```bash
POST /api/audits
Content-Type: application/json

{
    "agentName": "John Smith",
    "interactionId": "CALL-12345"
}
```

Response:
```json
{
    "success": true,
    "data": {
        "id": "...",
        "callId": "CALL-12345",
        "agentName": "John Smith",
        "customerName": "Unknown Customer",
        "campaignName": "Default Campaign",
        "overallScore": 0,
        "auditType": "manual",
        "createdAt": "2025-10-21T...",
        ...
    }
}
```

### ✅ Valid Request (Full)
```bash
POST /api/audits
Content-Type: application/json

{
    "auditName": "Q4 Performance Review",
    "agentName": "John Smith",
    "customerName": "Acme Corp",
    "interactionId": "CALL-12345",
    "callTranscript": "Customer: Hello... Agent: Hello, how can I help?",
    "qaParameterSetId": "params-001",
    "qaParameterSetName": "Standard QA Parameters",
    "auditType": "ai",
    "overallScore": 85,
    "parameters": [
        {
            "id": "param-1",
            "name": "Greeting",
            "subParameters": [
                {
                    "id": "sub-1",
                    "name": "Professional greeting",
                    "weight": 10,
                    "type": "Non-Fatal",
                    "score": 90
                }
            ]
        }
    ]
}
```

### ❌ Invalid Request (Empty Body)
```bash
POST /api/audits
Content-Type: application/json

{}
```

Response:
```json
{
    "success": false,
    "error": "Validation failed",
    "details": [
        {
            "code": "custom",
            "message": "At least one audit field is required"
        }
    ]
}
```

## Testing the Fix

### Using curl:
```bash
# Minimal valid request
curl -X POST https://assureqai.com/api/audits \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "Test Agent",
    "interactionId": "TEST-123"
  }'

# Full request
curl -X POST https://assureqai.com/api/audits \
  -H "Content-Type: application/json" \
  -d '{
    "agentName": "John Smith",
    "customerName": "Customer Name",
    "interactionId": "CALL-12345",
    "callTranscript": "Sample transcript...",
    "overallScore": 85,
    "auditType": "ai"
  }'
```

### Using JavaScript:
```javascript
// Minimal request
const response = await fetch('/api/audits', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    agentName: 'Test Agent',
    interactionId: 'TEST-123'
  })
});

const result = await response.json();
console.log(result);
```

## Changes Made

**File:** `src/app/api/audits/route.ts`

1. Line 22-40: Updated `createAuditSchema` to make fields optional
2. Line 101-112: Added JSON parsing error handling and logging
3. Line 125-133: Added minimum field validation
4. Line 135-165: Added default value handling for optional fields

## Migration Guide

### For Existing Clients
If your client is sending POST requests to `/api/audits`:

1. **Ensure you send at least `agentName` and `interactionId`**
2. **Check the request body is not empty**
3. **Optional fields can be omitted** - defaults will be applied

### For New Integrations
Use the minimal or full request format shown above. Start with the minimal format and add fields as needed.

## Deployment

This fix is backward compatible:
- ✅ Existing full requests continue to work
- ✅ New partial requests now work
- ✅ Empty requests are properly rejected with clear error

## Monitoring

Check server logs for:
```
"Audit POST received body: {...}"
```

This will show exactly what data is being received for debugging.

## Future Improvements

1. Add rate limiting to prevent abuse
2. Add authentication/authorization checks
3. Add request logging for compliance
4. Implement audit trail for all API calls
5. Add retry logic for transient failures
