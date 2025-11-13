import { db } from '@/lib/db';
import { usage, subscription } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { sql } from 'drizzle-orm';

/**
 * Get or create usage record for the current billing period
 */
async function getOrCreateUsageRecord(
  userId: string,
  periodStart: Date,
  periodEnd: Date
) {
  // Try to find existing usage record for this period
  const existing = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      eq(usage.periodStart, periodStart)
    ),
  });

  if (existing) {
    return existing;
  }

  // Create new usage record if none exists
  const [newUsage] = await db.insert(usage).values({
    userId,
    periodStart,
    periodEnd,
    transcriptionMinutes: 0,
    aiTokens: 0,
  }).returning();

  return newUsage;
}

/**
 * Get user's current subscription period
 */
async function getUserSubscriptionPeriod(userId: string): Promise<{ periodStart: Date; periodEnd: Date } | null> {
  const userSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: [desc(subscription.createdAt)],
  });

  if (!userSubscription || !userSubscription.currentPeriodStart || !userSubscription.currentPeriodEnd) {
    // Default to current month if no subscription
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { periodStart, periodEnd };
  }

  return {
    periodStart: userSubscription.currentPeriodStart,
    periodEnd: userSubscription.currentPeriodEnd,
  };
}

/**
 * Track transcription minutes usage in the database
 */
export async function ingestTranscriptionMinutes(args: {
  userId: string;
  minutes: number;
  recordingId?: string;
  model?: string;
  source?: string;
}) {
  const { userId, minutes } = args;
  if (!userId) throw new Error('userId is required');
  if (!(minutes >= 0)) throw new Error('minutes must be a non-negative number');

  // Get current subscription period
  const period = await getUserSubscriptionPeriod(userId);
  if (!period) {
    throw new Error('Could not determine subscription period');
  }

  // Get or create usage record
  const usageRecord = await getOrCreateUsageRecord(userId, period.periodStart, period.periodEnd);

  // Increment transcription minutes
  await db.update(usage)
    .set({
      transcriptionMinutes: sql`${usage.transcriptionMinutes} + ${minutes}`,
      updatedAt: new Date(),
    })
    .where(eq(usage.id, usageRecord.id));
}

/**
 * Track AI tokens usage in the database
 */
export async function ingestChatTokens(args: {
  userId: string;
  tokens: number;
  sessionId?: string;
  model?: string;
}) {
  const { userId, tokens } = args;
  if (!userId) throw new Error('userId is required');
  if (!(tokens >= 0)) throw new Error('tokens must be a non-negative number');

  // Get current subscription period
  const period = await getUserSubscriptionPeriod(userId);
  if (!period) {
    throw new Error('Could not determine subscription period');
  }

  // Get or create usage record
  const usageRecord = await getOrCreateUsageRecord(userId, period.periodStart, period.periodEnd);

  // Increment AI tokens
  await db.update(usage)
    .set({
      aiTokens: sql`${usage.aiTokens} + ${tokens}`,
      updatedAt: new Date(),
    })
    .where(eq(usage.id, usageRecord.id));
}

/**
 * Plan limits configuration
 */
export const PLAN_LIMITS = {
  free: {
    transcriptionMinutes: 600,
    aiTokens: 200000,
  },
  pro: {
    transcriptionMinutes: 2000,
    aiTokens: 1000000,
  },
  enterprise: {
    transcriptionMinutes: 5000,
    aiTokens: 5000000,
  },
} as const;

/**
 * Check if user can use transcription minutes
 */
export async function checkTranscriptionLimit(
  userId: string,
  minutesNeeded: number
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  // Get user's plan
  const userSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: [desc(subscription.createdAt)],
  });

  const plan = (userSubscription?.plan as 'free' | 'pro' | 'enterprise') || 'free';
  const limit = PLAN_LIMITS[plan].transcriptionMinutes;

  // Get current period usage
  const period = await getUserSubscriptionPeriod(userId);
  if (!period) {
    return { allowed: false, used: 0, limit, remaining: 0 };
  }

  const usageRecord = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      eq(usage.periodStart, period.periodStart)
    ),
  });

  const used = usageRecord?.transcriptionMinutes || 0;
  const remaining = Math.max(0, limit - used);
  const allowed = used + minutesNeeded <= limit;

  return { allowed, used, limit, remaining };
}

/**
 * Check if user can use AI tokens
 */
export async function checkTokenLimit(
  userId: string,
  tokensNeeded: number
): Promise<{ allowed: boolean; used: number; limit: number; remaining: number }> {
  // Get user's plan
  const userSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: [desc(subscription.createdAt)],
  });

  const plan = (userSubscription?.plan as 'free' | 'pro' | 'enterprise') || 'free';
  const limit = PLAN_LIMITS[plan].aiTokens;

  // Get current period usage
  const period = await getUserSubscriptionPeriod(userId);
  if (!period) {
    return { allowed: false, used: 0, limit, remaining: 0 };
  }

  const usageRecord = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      eq(usage.periodStart, period.periodStart)
    ),
  });

  const used = usageRecord?.aiTokens || 0;
  const remaining = Math.max(0, limit - used);
  const allowed = used + tokensNeeded <= limit;

  return { allowed, used, limit, remaining };
}

/**
 * Get current usage for a user
 */
export async function getUserUsage(userId: string): Promise<{
  transcriptionMinutes: { used: number; limit: number };
  aiTokens: { used: number; limit: number };
  periodStart: Date;
  periodEnd: Date;
  plan: 'free' | 'pro' | 'enterprise';
}> {
  // Get user's plan
  const userSubscription = await db.query.subscription.findFirst({
    where: eq(subscription.userId, userId),
    orderBy: [desc(subscription.createdAt)],
  });

  const plan = (userSubscription?.plan as 'free' | 'pro' | 'enterprise') || 'free';
  const limits = PLAN_LIMITS[plan];

  // Get current period
  const period = await getUserSubscriptionPeriod(userId);
  if (!period) {
    // Default period
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return {
      transcriptionMinutes: { used: 0, limit: limits.transcriptionMinutes },
      aiTokens: { used: 0, limit: limits.aiTokens },
      periodStart,
      periodEnd,
      plan,
    };
  }

  // Get usage record
  const usageRecord = await db.query.usage.findFirst({
    where: and(
      eq(usage.userId, userId),
      eq(usage.periodStart, period.periodStart)
    ),
  });

  return {
    transcriptionMinutes: {
      used: usageRecord?.transcriptionMinutes || 0,
      limit: limits.transcriptionMinutes,
    },
    aiTokens: {
      used: usageRecord?.aiTokens || 0,
      limit: limits.aiTokens,
    },
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    plan,
  };
}