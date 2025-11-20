import { openai } from '@ai-sdk/openai';
import { config } from '@/config/env';

const MODEL_ID = config.app.defaultAiModel || 'gpt-5-mini';

export function getModel(modelId?: string) {
  const modelToUse = modelId || MODEL_ID;
  
  if (!config.openai?.apiKey) {
    throw new Error('OpenAI API key not configured. Set OPENAI_API_KEY in your environment variables.');
  }

  return openai(modelToUse);
}
