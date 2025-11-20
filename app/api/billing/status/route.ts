import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getDodoClient, ensureDodoCustomer } from '@/lib/billing/client';
import { db } from '@/lib/db';
import { subscription } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, check database for stored subscription (faster and more reliable)
    const dbSubscription = await db.query.subscription.findFirst({
      where: eq(subscription.userId, session.user.id),
      orderBy: [desc(subscription.createdAt)],
    });

    // If we have a stored subscription, use it (webhook should keep it updated)
    if (dbSubscription && (dbSubscription.status === 'active' || dbSubscription.status === 'trialing')) {
      return NextResponse.json({
        plan: dbSubscription.plan as 'free' | 'pro' | 'enterprise',
        status: dbSubscription.status,
        subscriptionId: dbSubscription.dodoSubscriptionId,
        customerId: dbSubscription.dodoCustomerId,
        currentPeriodStart: dbSubscription.currentPeriodStart?.toISOString() || null,
        currentPeriodEnd: dbSubscription.currentPeriodEnd?.toISOString() || null,
        cancelAtPeriodEnd: dbSubscription.cancelAtPeriodEnd,
      });
    }

    // Fallback: Query Dodo API directly (for cases where webhook hasn't fired yet)
    const client = getDodoClient();
    const customerId = await ensureDodoCustomer(
      session.user.email,
      session.user.name || undefined
    );

    // Get all subscriptions for this customer
    let subscriptions: any[] = [];
    try {
      // List subscriptions - filter by customer_id if supported
      if (client.subscriptions?.list) {
        const subsIterator = client.subscriptions.list({ 
          customer_id: customerId,
          page_size: 10 
        } as any);
        
        // Handle both array and async iterator responses
        if (Array.isArray(subsIterator)) {
          subscriptions = subsIterator;
        } else {
          // Handle async iterator
          for await (const sub of subsIterator as any) {
            subscriptions.push(sub);
            // Only get the first active subscription
            if (sub?.status === 'active' || sub?.status === 'trialing') {
              break;
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to list subscriptions from Dodo API:', error);
      // Continue with database result or free plan
    }

    // Find active subscription from Dodo API
    const activeSubscription = subscriptions.find(
      (sub) => 
        sub?.customer_id === customerId && 
        (sub?.status === 'active' || sub?.status === 'trialing')
    );

    // Determine plan from product_id
    let plan: 'free' | 'pro' | 'enterprise' = 'free';
    if (activeSubscription) {
      const productId = activeSubscription.product_id || activeSubscription.product?.product_id;
      if (productId === process.env.DODO_PRO_PRODUCT_ID) {
        plan = 'pro';
      } else if (productId === process.env.DODO_ENTERPRISE_PRODUCT_ID) {
        plan = 'enterprise';
      }
    }

    return NextResponse.json({
      plan,
      status: activeSubscription?.status || dbSubscription?.status || 'inactive',
      subscriptionId: activeSubscription?.subscription_id || activeSubscription?.id || dbSubscription?.dodoSubscriptionId || null,
      customerId,
      currentPeriodStart: activeSubscription?.current_period_start || activeSubscription?.period_start || dbSubscription?.currentPeriodStart?.toISOString() || null,
      currentPeriodEnd: activeSubscription?.current_period_end || activeSubscription?.period_end || dbSubscription?.currentPeriodEnd?.toISOString() || null,
      cancelAtPeriodEnd: activeSubscription?.cancel_at_period_end || dbSubscription?.cancelAtPeriodEnd || false,
    });
  } catch (error: any) {
    console.error('Failed to get billing status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get billing status',
        details: error?.message 
      },
      { status: 500 }
    );
  }
}

