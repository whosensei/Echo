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
  // Dodo Payments configuration
  dodo: {
    apiKey: process.env.DODO_API_KEY || '',
    // 'test_mode' for sandbox; 'live' for production (aligns with Dodo client init)
    environment: process.env.DODO_ENV || 'test_mode',
    // Webhook signature verification secret
    webhookSecret: process.env.DODO_WEBHOOK_SECRET || '',
    // Product IDs configured in Dodo for your paid plans
    proProductId: process.env.DODO_PRO_PRODUCT_ID || '',
    enterpriseProductId: process.env.DODO_ENTERPRISE_PRODUCT_ID || '',
  },
  app: {
    audioStoragePath: process.env.AUDIO_STORAGE_PATH || './audio-recordings',
  },
} as const;
