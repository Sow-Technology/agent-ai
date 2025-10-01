# AI Flows Documentation

This directory contains AI-powered flows using Google's Gemini AI API.

## Setup

1. **Required Environment Variable:**
   ```
   GOOGLE_GENAI_API_KEY=your_api_key_here
   ```
   or
   ```
   GOOGLE_AI_API_KEY=your_api_key_here
   ```

2. Get your API key from: https://ai.google.dev/

## Available Flows

### 1. QA Audit Flow (`qa-audit-flow.ts`)

**Purpose:** Analyzes call center recordings and generates comprehensive QA audits.

**Features:**
- ✅ **Real Audio Processing** - Processes actual audio files using Gemini's multimodal capabilities
- ✅ **Multi-language Support** - Transcribes in original language, English, and optional third language
- ✅ **Automated Scoring** - Evaluates calls against custom QA parameters
- ✅ **Root Cause Analysis** - Identifies issues and suggests improvements

**Input Format:**
```typescript
{
  agentUserId: string,
  campaignName?: string,
  audioDataUri: string,  // Format: "data:audio/wav;base64,..." or "data:audio/mp3;base64,..."
  callLanguage: string,  // e.g., "Hindi", "Tamil", "English"
  transcriptionLanguage?: string,
  auditParameters: [
    {
      id: string,
      name: string,
      subParameters: [
        {
          id: string,
          name: string,
          weight: number,  // 0-100
          type: "Fatal" | "Non-Fatal" | "ZTP"
        }
      ]
    }
  ]
}
```

**Supported Audio Formats:**
- WAV (recommended)
- MP3
- FLAC
- OGG

**How to Upload Audio:**

1. **From File Upload:**
```javascript
const file = document.getElementById('audioFile').files[0];
const reader = new FileReader();
reader.onload = async (e) => {
  const audioDataUri = e.target.result; // This is the data URI
  
  const response = await fetch('/api/ai/qa-audit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      agentUserId: "AGENT001",
      audioDataUri: audioDataUri,
      callLanguage: "English",
      auditParameters: [...]
    })
  });
};
reader.readAsDataURL(file);
```

2. **From Recorded Audio:**
```javascript
const mediaRecorder = new MediaRecorder(stream);
const chunks = [];

mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: 'audio/wav' });
  const reader = new FileReader();
  reader.onload = async (e) => {
    const audioDataUri = e.target.result;
    // Send to API...
  };
  reader.readAsDataURL(blob);
};
```

**Mock vs Real Data:**
- If `audioDataUri` is omitted or is the mock placeholder, the AI generates a **simulated audit** based on the parameters
- If real audio is provided, the AI **actually processes the audio** and generates a real transcription and audit

### 2. Audit Chat Flow (`audit-chat-flow.ts`)

**Purpose:** Allows users to ask questions about a completed audit.

**Input:**
```typescript
{
  auditSummary: string,
  auditTranscription: string,
  userMessage: string,
  chatHistory?: ChatMessage[]
}
```

### 3. Explain Concept Flow (`explain-ai-flow.ts`)

**Purpose:** Explains AI/QA concepts in simple terms.

**Input:**
```typescript
{
  prompt: string
}
```

### 4. Grammar Check Flow (`grammar-check-flow.ts`)

**Purpose:** Corrects grammar and spelling in text.

**Input:**
```typescript
{
  text: string
}
```

### 5. Generate Parameters from SOP Flow (`generate-parameters-from-sop-flow.ts`)

**Purpose:** Automatically creates QA audit parameters from Standard Operating Procedures.

**Input:**
```typescript
{
  title: string,
  content: string
}
```

**Output:**
- Generates parameter groups with weights that sum to 100
- Creates specific, measurable audit criteria

### 6. Generate Audit Comment Flow (`generate-audit-comment-flow.ts`)

**Purpose:** Creates constructive feedback comments for individual audit parameters.

**Input:**
```typescript
{
  parameterName: string,
  score: number  // 0-100
}
```

### 7. Text-to-Speech Flow (`text-to-speech-flow.ts`)

**Status:** ⚠️ Currently returns placeholder audio (1 second of silence)

**Note:** Google AI SDK doesn't have built-in TTS. To implement real TTS, you'll need to integrate:
- Google Cloud Text-to-Speech API
- ElevenLabs API
- Amazon Polly
- Microsoft Azure Speech Service

## API Usage Examples

### QA Audit with Real Audio

```bash
curl -X POST http://localhost:3000/api/ai/qa-audit \
  -H "Content-Type: application/json" \
  -d '{
    "agentUserId": "AGENT001",
    "campaignName": "Customer Support Q4",
    "audioDataUri": "data:audio/wav;base64,UklGR...",
    "callLanguage": "English",
    "auditParameters": [
      {
        "id": "greet",
        "name": "Greeting & Professionalism",
        "subParameters": [
          {
            "id": "greet-1",
            "name": "Agent used standard greeting",
            "weight": 20,
            "type": "Fatal"
          }
        ]
      }
    ]
  }'
```

### Grammar Check

```bash
curl -X POST http://localhost:3000/api/ai/grammar-check \
  -H "Content-Type: application/json" \
  -d '{
    "text": "This are a example of text with grammer errors."
  }'
```

## Technical Architecture

### Migration from Genkit to Google AI SDK

This project previously used Firebase Genkit but was migrated to use the Google AI SDK directly due to:
- Genkit's async context requirements incompatible with Next.js serverless functions
- Simpler, more direct API without middleware overhead
- Better control over request/response handling

### Key Files

- `genkit.ts` - Central configuration and model initialization
- `flows/*.ts` - Individual AI flow implementations
- API routes in `src/app/api/ai/*` - HTTP endpoints that call the flows

### Error Handling

All flows include:
- JSON extraction from AI responses (handles markdown code blocks)
- Fallback values for optional fields
- Try-catch blocks in API routes
- Detailed error logging

## Performance Considerations

1. **Audio Processing:**
   - Larger audio files (>10MB) may take 30-60 seconds to process
   - Consider implementing progress indicators in your UI
   - Maximum audio length: ~1 hour (Gemini API limit)

2. **Rate Limits:**
   - Free tier: 60 requests per minute
   - Check Google AI Studio for current limits

3. **Caching:**
   - Consider caching transcriptions to avoid re-processing the same audio
   - Store audit results in your database after generation

## Troubleshooting

### "API Key Not Found" Error
- Check `.env` file has `GOOGLE_GENAI_API_KEY` or `GOOGLE_AI_API_KEY`
- Restart development server after adding environment variables

### "Invalid Audio Format" Error
- Ensure audio is properly base64 encoded
- Verify data URI format: `data:audio/wav;base64,...`
- Try converting to WAV format if using other formats

### Mock Data Being Generated
- Verify `audioDataUri` is being sent in the request
- Check browser console for the actual data being sent
- Ensure the data URI is not the mock placeholder

## Future Enhancements

- [ ] Implement real-time audio transcription
- [ ] Add support for video call analysis
- [ ] Implement sentiment analysis in transcriptions
- [ ] Add multi-speaker diarization improvements
- [ ] Implement TTS with Google Cloud TTS API
- [ ] Add support for batch processing multiple audits
- [ ] Implement caching layer for transcriptions
- [ ] Add WebSocket support for real-time progress updates
