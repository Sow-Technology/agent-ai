# AssureQAI - AI-Powered Call Center QA Platform

AssureQAI is a Next.js application that uses Google's Gemini AI to automatically audit call center recordings, generate transcriptions, and provide detailed quality assessments.

## 🚀 Features

- **Real Audio Processing** - Analyzes actual call recordings using Gemini's multimodal AI
- **Multi-language Support** - Transcribes calls in original language, English, and custom languages
- **Automated QA Scoring** - Evaluates calls against customizable audit parameters
- **Interactive Chat** - Ask questions about completed audits
- **SOP-to-Parameters** - Automatically generate QA parameters from SOPs
- **Grammar Checking** - AI-powered text correction
- **Dashboard UI** - Modern, responsive interface with dark mode

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Google AI API Key ([Get one here](https://ai.google.dev/))

## 🛠️ Setup

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd agent-ai
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Google AI API Key (Required for AI features)
   GOOGLE_GENAI_API_KEY=your_api_key_here

   # MongoDB (Required for user management and data storage)
   MONGODB_URI=your_mongodb_connection_string

   # JWT Secret (Required for authentication)
   JWT_SECRET=your_secret_key_here
   ```

4. **Run development server**

   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

## 📁 Project Structure

```
src/
├── ai/
│   ├── genkit.ts                    # AI configuration
│   └── flows/                       # AI flow implementations
│       ├── qa-audit-flow.ts         # Main audit flow
│       ├── audit-chat-flow.ts       # Chat about audits
│       ├── explain-ai-flow.ts       # Concept explanations
│       ├── grammar-check-flow.ts    # Grammar correction
│       ├── generate-parameters-from-sop-flow.ts
│       ├── generate-audit-comment-flow.ts
│       └── README.md                # Detailed AI flows documentation
├── app/
│   ├── api/                         # API routes
│   │   ├── ai/                      # AI endpoints
│   │   ├── auth/                    # Authentication
│   │   └── ...
│   ├── dashboard/                   # Dashboard pages
│   └── ...
├── components/                      # React components
└── lib/                            # Utilities
```

## 🎯 Key Features Explained

### Real Audio Processing

The QA Audit flow now processes **real audio files**, not mock data. When you provide an actual audio recording:

1. ✅ **Real transcription** - AI listens to the audio and generates accurate transcriptions
2. ✅ **Speaker identification** - Identifies agent and customer speakers
3. ✅ **Accurate scoring** - Evaluates based on actual call content
4. ✅ **Multi-language** - Supports Hindi, Tamil, English, and more

**Supported formats:** WAV, MP3, FLAC, OGG

### How to Use Real Audio

**Option 1: File Upload**

```javascript
// In your frontend component
const handleFileUpload = async (file) => {
  const reader = new FileReader();
  reader.onload = async (e) => {
    const audioDataUri = e.target.result;

    const response = await fetch("/api/ai/qa-audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agentUserId: "AGENT001",
        audioDataUri: audioDataUri,
        callLanguage: "English",
        auditParameters: [
          /* your parameters */
        ],
      }),
    });

    const result = await response.json();
    console.log("Audit complete:", result);
  };
  reader.readAsDataURL(file);
};
```

**Option 2: Audio Recording**

```javascript
// Record audio directly in the browser
const mediaRecorder = new MediaRecorder(stream);
const chunks = [];

mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
mediaRecorder.onstop = async () => {
  const blob = new Blob(chunks, { type: "audio/wav" });
  const reader = new FileReader();
  reader.onload = async (e) => {
    const audioDataUri = e.target.result;
    // Send to API...
  };
  reader.readAsDataURL(blob);
};
```

### Mock vs Real Data

- **Without audio:** If no `audioDataUri` is provided, the AI generates a simulated audit for testing
- **With real audio:** The AI processes the actual recording and generates real transcriptions and scores

## 🔧 API Endpoints

### QA Audit

```
POST /api/ai/qa-audit
```

Analyzes call recordings and generates comprehensive audits.

### Audit Chat

```
POST /api/ai/audit-chat
```

Chat interface to ask questions about completed audits.

### Explain Concept

```
POST /api/ai/explain-concept
```

Explains AI/QA concepts in simple terms.

### Grammar Check

```
POST /api/ai/grammar-check
```

Corrects grammar and spelling in text.

### Generate Parameters

```
POST /api/ai/generate-parameters
```

Converts SOPs into QA audit parameters.

### Text-to-Speech

```
POST /api/ai/text-to-speech
```

⚠️ Currently returns placeholder audio. Requires dedicated TTS service integration.

## 🔐 Authentication

The app uses JWT-based authentication with the following endpoints:

- `POST /api/auth/login` - User login
- `GET /api/auth/status` - Check auth status
- `POST /api/auth/logout` - User logout
- `GET /api/auth/user` - Get current user details

## 📚 Documentation

- [AI Flows Documentation](./src/ai/flows/README.md) - Detailed guide on AI flows
- [Blueprint](./docs/blueprint.md) - Project architecture and design

## � Deployment

### Netlify (Recommended)
AssureQAI is fully compatible with Netlify's serverless functions!

**Quick Deploy:**
1. Connect your GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Deploy!

**Netlify Configuration:**
- ✅ 15-minute function timeout for AI processing
- ✅ Handles audio files via cloud storage integration
- ✅ Optimized for serverless architecture

**See full guide:** [`docs/NETLIFY_DEPLOYMENT.md`](docs/NETLIFY_DEPLOYMENT.md)

### Other Platforms
- **Vercel:** Standard Next.js deployment
- **Railway:** Full control over compute resources
- **AWS:** Maximum scalability and customization

## �🚧 Build & Deploy

**Build for production:**

```bash
npm run build
```

**Start production server:**

```bash
npm start
```

## 🐛 Troubleshooting

### API Key Issues

- Ensure `GOOGLE_GENAI_API_KEY` is set in `.env`
- Restart the dev server after adding environment variables

### Audio Not Processing

- Verify audio is properly encoded as base64
- Check data URI format: `data:audio/wav;base64,...`
- Ensure file size is under 10MB for optimal performance

### Build Errors

- Clear `.next` folder: `rm -rf .next`
- Reinstall dependencies: `rm -rf node_modules && npm install`

## 🎨 Technology Stack

- **Framework:** Next.js 14.2.4
- **AI:** Google Gemini 2.0 Flash
- **UI:** React, Tailwind CSS, shadcn/ui
- **Database:** MongoDB (Mongoose)
- **Auth:** JWT, bcryptjs
- **TypeScript:** Full type safety

## 📝 License

[Your License Here]

## 🤝 Contributing

Contributions are welcome! Please read the contributing guidelines before submitting PRs.

## 📧 Support

For issues and questions, please open a GitHub issue or contact support.

---

**Note:** This project was migrated from Firebase Genkit to Google AI SDK for better compatibility with Next.js serverless architecture.
