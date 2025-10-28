# Audio Conversion Backend - Testing & Deployment Guide

## Quick Deployment Checklist

### 1. Install FFmpeg on VM
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install ffmpeg

# Verify installation
ffmpeg -version
```

### 2. Verify Backend Route
- New endpoint: `POST /api/audio/convert`
- Accepts: multipart/form-data with `file` field
- Max size: 500MB
- Returns: Base64 data URI for processed WAV

### 3. Test the Endpoint

#### Using cURL (from server)
```bash
# Test with an audio file
curl -X POST http://localhost:3000/api/audio/convert \
  -F "file=@/path/to/audio.mp3" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Using JavaScript/Node.js
```javascript
const formData = new FormData();
formData.append('file', audioFile);

const response = await fetch('/api/audio/convert', {
  method: 'POST',
  headers: getAuthHeaders(), // includes Authorization header
  body: formData
});

const { success, data } = await response.json();
if (success) {
  console.log('Converted WAV:', data.audioDataUri);
  console.log('File size:', data.convertedSize);
}
```

## Frontend Integration Status

### QA Audit Page (`/dashboard/qa-audit`)
- ✅ Uses new backend `/api/audio/convert`
- ✅ Shows conversion feedback to user
- ✅ Displays converted file size
- ✅ Error handling with user messages

### Manual Audit Page (`/dashboard/manual-audit`)
- ✅ Uses new backend `/api/audio/convert`
- ✅ Shows conversion feedback to user
- ✅ Displays converted file size
- ✅ Error handling with user messages

## Supported File Formats

### Direct Pass-Through (No Conversion)
- `audio/wav` - WAV files (already correct format)

### Converted via FFmpeg
- `audio/mpeg` - MP3 files
- `audio/ogg` - OGG/Vorbis files
- `audio/flac` - FLAC files
- `audio/mp4` - AAC in MP4 container
- `audio/x-m4a` - M4A files
- `audio/x-aac` - Raw AAC files
- `audio/webm` - WebM audio files
- `audio/x-wav` - Alternate WAV format

### Video with Audio
- `video/mp4` - MP4 video (audio extracted)

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "audioDataUri": "data:audio/wav;base64,UklGRi4A...",
    "fileName": "meeting_recording.mp3",
    "originalType": "audio/mpeg",
    "convertedType": "audio/wav",
    "sizes": {
      "original": 5242880,
      "converted": 15728640
    }
  }
}
```

### Error Response (400/500)
```json
{
  "success": false,
  "error": "FFmpeg not found. Please install FFmpeg on the server.",
  "details": {
    "fileName": "audio.mp3",
    "fileSize": "5.0MB",
    "fileType": "audio/mpeg"
  }
}
```

## Performance Considerations

### File Size Impact
- **Original:** 5MB MP3 file
- **Converted:** ~15MB WAV file (uncompressed PCM)
- **Ratio:** ~3x size increase (normal for WAV format)

### Processing Time
- Small files (<10MB): ~1-2 seconds
- Medium files (10-100MB): ~5-15 seconds
- Large files (100-500MB): ~30-120 seconds

### Recommendations
- Show "Converting..." indicator to user during processing
- Consider timeout of 2-3 minutes for very large files
- Monitor `/tmp` disk space for buffered files

## Troubleshooting

### Issue: "FFmpeg not found"
**Solution:** Install FFmpeg on server
```bash
sudo apt-get install ffmpeg
sudo systemctl restart pm2  # Restart PM2 apps
```

### Issue: Conversion timeout
**Solution:** Increase Node.js timeout for large files
```javascript
// In route.ts, can add timeout handling
```

### Issue: Out of disk space
**Solution:** Check `/tmp` directory
```bash
df -h /tmp
# Clean up old temp files if needed
rm -rf /tmp/ffmpeg-* 
```

### Issue: File too large (413 error)
**Solution:** Verify nginx body_client_max_size is >= 500MB
```nginx
client_max_body_size 500m;
```

## Nginx Configuration (Already Done)
The deployment already has proper nginx settings:
- `client_max_body_size 500m` - Allows 500MB uploads
- Proper proxy settings configured

## PM2 Monitoring

### Check if app is running
```bash
pm2 status
```

### View logs
```bash
pm2 logs app-name
```

### Restart if needed
```bash
pm2 restart app-name
```

## Files Modified
- `src/app/dashboard/qa-audit/qa-audit-content.tsx` - Now uses `/api/audio/convert`
- `src/app/dashboard/manual-audit/manual-audit-content.tsx` - Now uses `/api/audio/convert`
- `src/app/api/audio/convert/route.ts` - NEW: Backend conversion endpoint

## Files NOT Modified
- `src/lib/audioConverter.ts` - Still used for `needsAudioConversion()` utility
  - `convertAudioToWavDataUri()` is now deprecated (no longer called)
  - Safe to keep for now; can be removed in future cleanup

## Deployment Steps
1. ✅ Backend endpoint created and ready
2. ✅ Frontend components updated
3. ⏳ Next: Deploy to production VM and test

## Post-Deployment Testing
After deploying, test these scenarios:
1. Upload WAV file → should pass through directly
2. Upload MP3 file → should convert to WAV
3. Upload large file (100MB+) → should handle without timeout
4. Upload invalid format → should return helpful error message
5. Check `/tmp` directory → should be cleaned after conversions
