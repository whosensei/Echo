# 🎙️ Meeting Assistant - AI-Powered Meeting Management

A modern, full-stack meeting assistant with AI transcription, automatic summaries, Gmail integration, Google Calendar sync, and comprehensive authentication.

## ✨ Features

### 🔐 Authentication
- **Email/Password Login** - Secure authentication with Better Auth
- **Google OAuth** - Single sign-on with Google account  
- **Session Management** - Persistent sessions with automatic refresh

### � AI Chat Assistant
- **Multi-Model Support** - Choose from GPT-4o, Claude 3.5, Gemini 1.5, and more
- **Transcript Context** - Attach meeting transcripts to provide context
- **Streaming Responses** - Real-time token-by-token AI responses
- **Chat History** - Persistent conversation sessions
- **Model Switching** - Change AI models on the fly
- **Markdown Support** - Rich text formatting with code highlighting

### �📧 Gmail Integration
- Send meeting transcripts via email
- Share AI-generated summaries
- Email action points to participants
- Track email delivery status

### 📅 Google Calendar Integration  
- View upcoming 5 meetings
- Auto-sync calendar events
- Link transcriptions to calendar meetings
- Display meeting details and participants

### 🎤 Meeting Transcription
- **Lossless Audio Recording** - High-quality WAV audio using Web Audio API
- **AI Transcription** - Powered by AssemblyAI with advanced features:
  - Speaker diarization and identification
  - Entity detection (people, organizations, locations, dates)
  - Sentiment analysis
  - IAB topic categorization
  - Auto-generated summaries
- Multiple language support
- Named entity recognition

### 🤖 AI Summaries
- **Intelligent Summaries** - Generated using AssemblyAI
- Extract action points automatically
- Identify key topics with IAB categories
- Participant tracking
- Sentiment analysis

### 🎨 Modern UI
- Clean, minimal design with shadcn/ui
- Responsive layout (mobile-first)
- Professional dashboard
- Smooth animations and transitions
- **Real-time Processing**: Live recording controls with pause/resume functionality
- **Transcript Management**: Sidebar showing all previous transcriptions
- **Local Storage**: Audio files saved locally for privacy and reliability

## Getting Started

### 1. Clone and Install

```bash
git clone <repository-url>
cd prototype
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```bash
# AssemblyAI API Configuration
ASSEMBLYAI_API_KEY=your_assemblyai_api_key_here
ASSEMBLYAI_BASE_URL=https://api.assemblyai.com/v2

# Google Gemini API Configuration (optional - for AI chat models)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI API Configuration (optional - for AI chat)
OPENAI_API_KEY=your_openai_api_key_here

# Anthropic API Configuration (optional - for AI chat)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# AWS S3 Configuration
AWS_S3_BUCKET_NAME=your_bucket_name
AWS_S3_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# Application Configuration
AUDIO_STORAGE_PATH=./audio-recordings
```

### 3. Get API Keys

**AssemblyAI API Key:**
- Visit [AssemblyAI](https://www.assemblyai.com)
- Sign up for an account
- Navigate to your dashboard to get your API key

**Google Gemini API Key (Optional - for chat models):**
- Go to [Google AI Studio](https://aistudio.google.com)
- Create a new project or select existing one
- Generate an API key for Gemini

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to use the application.

## How It Works

1. **Record Audio**: Click "Start Recording" to begin capturing lossless WAV audio
2. **Encrypt & Upload**: Audio is encrypted client-side and uploaded directly to AWS S3 via presigned URLs
3. **Transcription**: AssemblyAI provides:
   - Transcription with speaker diarization
   - Entity detection (people, organizations, locations)
   - Sentiment analysis
   - Topic categorization (IAB)
   - Auto-generated summary
4. **View Results**: See transcripts with speaker identification, comprehensive summaries, topics, and entities

## Project Structure

```
├── app/
│   ├── api/                 # Backend API routes
│   │   ├── s3-presigned-url/  # Generate presigned URLs for direct S3 uploads
│   │   ├── transcribe/      # AssemblyAI transcription
│   │   ├── summarize/       # Optional Gemini summary
│   │   └── transcriptions/  # List all transcriptions
│   ├── page.tsx            # Main application page
│   └── layout.tsx          # App layout with providers
├── components/
│   ├── audio-recorder-component.tsx  # Recording interface
│   ├── tabbed-transcript-display.tsx # Transcript & summary display
│   ├── transcription-sidebar.tsx     # Transcript history sidebar
│   └── ui/                          # Shadcn UI components
├── lib/
│   ├── audio-recorder.ts      # Web Audio API implementation
│   ├── assemblyai-service.ts  # AssemblyAI API integration
│   ├── s3-service.ts          # AWS S3 integration
│   └── openai-summary-service.ts  # OpenAI summary generation
├── config/
│   └── env.ts              # Environment configuration
└── audio-recordings/       # Local audio storage directory
```

## API Integration

### AssemblyAI Features Used
- Audio file upload
- Advanced transcription with all features in one request:
  - Speaker diarization and identification
  - Entity detection (people, organizations, locations, dates)
  - Sentiment analysis
  - IAB topic categorization
  - Auto-generated summaries
  - Text formatting and punctuation
- Transcription status polling
- Multi-language support with auto-detection

### AI Chat Features
- Multi-model support (OpenAI, Anthropic, Google Gemini)
- Context-aware conversations
- Attach transcripts for context

## Technical Specifications

- **Frontend**: Next.js 15 with TypeScript
- **UI Components**: Shadcn UI with Tailwind CSS
- **Audio Recording**: Web Audio API (lossless WAV format)
- **Backend**: Next.js API routes (serverless functions)
- **AI Services**: AssemblyAI for transcription and analysis
- **Storage**: AWS S3 for audio files, PostgreSQL for metadata
- **Database**: Drizzle ORM with PostgreSQL

## Browser Requirements

- Modern browser with Web Audio API support
- Microphone access permissions
- JavaScript enabled

## Troubleshooting

**Microphone Access Issues:**
- Ensure browser has microphone permissions
- Check system audio settings
- Try refreshing the page

**API Errors:**
- Verify API keys are correctly set in `.env.local`
- Check API key permissions and quotas
- Ensure network connectivity

**Audio Quality Issues:**
- Use a good quality microphone
- Record in a quiet environment
- Ensure stable internet connection for upload
