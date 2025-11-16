import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const redis = Redis.fromEnv();

export const rateLimiters = {
  upload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '60 m'),
    prefix: 'ratelimit:upload',
    analytics: true,
  }),

  transcribe: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '60 m'),
    prefix: 'ratelimit:transcribe',
    analytics: true,
  }),

  apiDefault: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '15 m'),
    prefix: 'ratelimit:api',
    analytics: true,
  }),
};

export const RATE_LIMITS = {
  UPLOAD: {
    limit: 10,
    windowMs: 60 * 60 * 1000,
  },
  TRANSCRIBE: {
    limit: 20,
    windowMs: 60 * 60 * 1000,
  },
  API_DEFAULT: {
    limit: 100,
    windowMs: 15 * 60 * 1000,
  },
} as const;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export async function rateLimit(
  identifier: string,
  config: { limit: number; windowMs: number }
): Promise<RateLimitResult> {
  let limiter: Ratelimit;

  if (identifier.startsWith('upload:')) {
    limiter = rateLimiters.upload;
  } else if (identifier.startsWith('transcribe:')) {
    limiter = rateLimiters.transcribe;
  } else {
    limiter = rateLimiters.apiDefault;
  }

  try {
    const result = await limiter.limit(identifier);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.reset,
      limit: result.limit,
    };
  } catch (error) {
    console.error('Rate limiting error:', error);

    return {
      success: true,
      remaining: config.limit,
      resetTime: Date.now() + config.windowMs,
      limit: config.limit,
    };
  }
}

export function formatResetTime(resetTime: number): string {
  return new Date(resetTime).toISOString();
}

export function getRateLimiter(
  type: 'upload' | 'transcribe' | 'apiDefault'
): Ratelimit {
  return rateLimiters[type];
}

export { redis };

export default {
  rateLimit,
  rateLimiters,
  RATE_LIMITS,
  formatResetTime,
  getRateLimiter,
  redis,
};
