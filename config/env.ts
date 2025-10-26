// Environment configuration
export const config = {
  assemblyai: {
    apiKey: process.env.ASSEMBLYAI_API_KEY || '',
    baseUrl: process.env.ASSEMBLYAI_BASE_URL || 'https://api.assemblyai.com/v2',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  aws: {
    s3: {
      bucketName: process.env.AWS_S3_BUCKET_NAME || '',
      region: process.env.AWS_S3_REGION || 'us-east-1',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  },
  app: {
    audioStoragePath: process.env.AUDIO_STORAGE_PATH || './audio-recordings',
  },
} as const;
