/**
 * AI Model Provider Configuration
 * Supports multiple LLM providers (OpenAI, Anthropic, Google Gemini)
 */

import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';
import { google } from '@ai-sdk/google';
import { config } from '@/config/env';

export interface ModelInfo {
  id: string;
  name: string;
  provider: 'openai' | 'anthropic' | 'google';
  contextWindow: number;
  description: string;
  costPer1MTokens: { input: number; output: number };
}

export const AVAILABLE_MODELS: ModelInfo[] = [
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    contextWindow: 128000,
    description: 'Most capable, multimodal flagship model',
    costPer1MTokens: { input: 2.5, output: 10 },
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    contextWindow: 128000,
    description: 'Affordable and intelligent small model',
    costPer1MTokens: { input: 0.15, output: 0.6 },
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    contextWindow: 128000,
    description: 'Previous generation flagship model',
    costPer1MTokens: { input: 10, output: 30 },
  },
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    contextWindow: 200000,
    description: 'Best for long-form analysis and coding',
    costPer1MTokens: { input: 3, output: 15 },
  },
  {
    id: 'claude-4x`-5-haiku-20241022',
    name: 'Claude 4.5 Haiku',
    provider: 'anthropic',
    contextWindow: 200000,
    description: 'Fastest and most compact model',
    costPer1MTokens: { input: 0.8, output: 4 },
  },
  {
    id: 'gemini-2.5-pro',
    name: 'Gemini 2.5 Pro',
    provider: 'google',
    contextWindow: 1000000,
    description: 'Massive context window, great for transcripts',
    costPer1MTokens: { input: 1.25, output: 5 },
  },
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'google',
    contextWindow: 1000000,
    description: 'Fast and versatile, large context',
    costPer1MTokens: { input: 0.075, output: 0.3 },
  },
];

/**
 * Get the AI model instance for the given model ID
 */
export function getModel(modelId: string) {
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === modelId);
  
  if (!modelInfo) {
    throw new Error(`Unknown model: ${modelId}`);
  }

  switch (modelInfo.provider) {
    case 'openai':
      if (!config.openai?.apiKey) {
        throw new Error('OpenAI API key not configured');
      }
      return openai(modelId);

    case 'anthropic':
      if (!config.anthropic?.apiKey) {
        throw new Error('Anthropic API key not configured');
      }
      return anthropic(modelId);

    case 'google':
      if (!config.gemini?.apiKey) {
        throw new Error('Google API key not configured');
      }
      return google(modelId);

    default:
      throw new Error(`Unsupported provider: ${modelInfo.provider}`);
  }
}

/**
 * Get default model (fallback to Gemini if available, then GPT-4o-mini)
 */
export function getDefaultModel(): string {
  if (config.gemini?.apiKey) {
    return 'gemini-2.5-flash';
  }
  if (config.openai?.apiKey) {
    return 'gpt-4o-mini';
  }
  if (config.anthropic?.apiKey) {
    return 'claude-4-5-haiku-20241022';
  }
  
  // Return first available
  return AVAILABLE_MODELS[0].id;
}

/**
 * Check if a specific model is available (API key configured)
 */
export function isModelAvailable(modelId: string): boolean {
  const modelInfo = AVAILABLE_MODELS.find((m) => m.id === modelId);
  
  if (!modelInfo) {
    return false;
  }

  switch (modelInfo.provider) {
    case 'openai':
      return !!config.openai?.apiKey;
    case 'anthropic':
      return !!config.anthropic?.apiKey;
    case 'google':
      return !!config.gemini?.apiKey;
    default:
      return false;
  }
}

/**
 * Get list of available models (only those with API keys configured)
 */
export function getAvailableModels(): ModelInfo[] {
  return AVAILABLE_MODELS.filter((model) => isModelAvailable(model.id));
}
