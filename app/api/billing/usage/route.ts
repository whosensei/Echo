/**
 * GET /api/billing/usage
 * Returns the current user's usage statistics and quota limits for the current billing period.
 *
 * Returns:
 * {
 *   transcriptionMinutes: { used: number, limit: number, included: number },
 *   aiTokens: { used: number, limit: number, included: number },
 *   periodStart: string,
 *   periodEnd: string,
 *   plan: string,
 * }
 */
import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getUserUsage } from '@/lib/billing/usage';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get usage from database
    const usageData = await getUserUsage(session.user.id);

    return NextResponse.json({
      transcriptionMinutes: {
        used: usageData.transcriptionMinutes.used,
        included: usageData.transcriptionMinutes.limit,
        limit: usageData.transcriptionMinutes.limit,
      },
      aiTokens: {
        used: usageData.aiTokens.used,
        included: usageData.aiTokens.limit,
        limit: usageData.aiTokens.limit,
      },
      periodStart: usageData.periodStart.toISOString(),
      periodEnd: usageData.periodEnd.toISOString(),
      plan: usageData.plan,
    });
  } catch (error: any) {
    console.error('Failed to get usage:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get usage information',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

