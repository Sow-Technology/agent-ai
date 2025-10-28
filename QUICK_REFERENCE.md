# Audio Conversion Backend - Quick Reference Card

## What Was Done

Audio format conversion moved from browser (Web Audio API) to server (FFmpeg).

## Files Changed

### Created

- `src/app/api/audio/convert/route.ts` - New backend endpoint

### Updated

- `src/app/dashboard/qa-audit/qa-audit-content.tsx` - Uses backend API
- `src/app/dashboard/manual-audit/manual-audit-content.tsx` - Uses backend API

### Unchanged

- `src/lib/audioConverter.ts` - Still has `needsAudioConversion()` utility

## The Change (Before vs After)

### BEFORE: Client-Side Processing

```typescript
// Old way - in browser
import { convertAudioToWavDataUri } from "@/lib/audioConverter";

const handleAudioFileSelected = (file) => {
  if (needsAudioConversion(file)) {
    convertAudioToWavDataUri(file) // Web Audio API processing
      .then((wavDataUri) => {
        setAudioDataUri(wavDataUri);
      });
  }
};
```

### AFTER: Server-Side Processing

```typescript
// New way - server handles it
const handleAudioFileSelected = (file) => {
  if (needsAudioConversion(file)) {
    const formData = new FormData();
    formData.append("file", file);

    fetch("/api/audio/convert", {
      // Backend does conversion
      method: "POST",
      headers: getAuthHeaders(),
      body: formData,
    })
      .then((res) => res.json())
      .then(({ data }) => {
        setAudioDataUri(data.audioDataUri);
      });
  }
};
```

## Key Benefits

1. ✅ Handles 100-500MB files (was limited by browser memory)
2. ✅ More reliable (FFmpeg is battle-tested)
3. ✅ Faster (offloads from browser)
4. ✅ Better errors (server can provide detailed feedback)
5. ✅ Consistent (all conversions done same way)

## Deployment Steps

```bash
# 1. Install FFmpeg on your VM
sudo apt-get update
sudo apt-get install ffmpeg

# 2. Verify it's installed
ffmpeg -version

# 3. Deploy the code (git pull, npm install, etc.)
# 4. Restart PM2
pm2 restart app-name

# 5. Test it
curl -X POST http://localhost:3000/api/audio/convert \
  -F "file=@test.mp3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## API Reference

### Endpoint

```
POST /api/audio/convert
Content-Type: multipart/form-data
Max Size: 500MB
```

### Request

```javascript
const formData = new FormData();
formData.append("file", audioFile);

fetch("/api/audio/convert", {
  method: "POST",
  headers: getAuthHeaders(),
  body: formData,
});
```

### Response (Success)

```json
{
  "success": true,
  "data": {
    "audioDataUri": "data:audio/wav;base64,UklGRi4A...",
    "fileName": "meeting.mp3",
    "originalType": "audio/mpeg",
    "convertedType": "audio/wav",
    "originalSize": 5242880,
    "convertedSize": 15728640
  }
}
```

### Response (Error)

```json
{
  "success": false,
  "error": "FFmpeg not found. Please install FFmpeg on the server.",
  "details": "..."
}
```

## Common Issues & Fixes

| Issue                  | Fix                                       |
| ---------------------- | ----------------------------------------- |
| "FFmpeg not found"     | `sudo apt-get install ffmpeg`             |
| 413 Payload Too Large  | nginx: `client_max_body_size 500m;`       |
| Timeout on large files | Increase Node.js timeout or use streaming |
| `/tmp` full            | Check disk space, clean up old files      |

## Testing Checklist

- [ ] Verify FFmpeg installed: `ffmpeg -version`
- [ ] Test WAV upload (no conversion needed)
- [ ] Test MP3 upload (convert to WAV)
- [ ] Test OGG upload (convert to WAV)
- [ ] Test large file (100MB+)
- [ ] Check server logs for errors
- [ ] Verify `/tmp` cleanup

## Monitoring

### Check If App Running

```bash
pm2 status
```

### View Logs

```bash
pm2 logs app-name | grep "audio"
```

### Restart If Needed

```bash
pm2 restart app-name
```

## Documentation

- Full details: `AUDIO_MIGRATION_COMPLETE.md`
- Testing guide: `AUDIO_CONVERSION_TESTING.md`
- Technical spec: `AUDIO_CONVERSION_MIGRATION.md`

## Status: ✅ READY FOR DEPLOYMENT

**Last Updated:** 2025-10-29  
**Implementation:** 100% Complete  
**Testing:** Ready to run  
**Dependencies:** FFmpeg (system), fluent-ffmpeg (npm - already installed)

---

**Questions?** See the detailed docs or check PM2 logs for errors.
