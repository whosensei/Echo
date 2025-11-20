import { NextRequest, NextResponse } from 'next/server';
import { config } from '@/config/env';
import { db } from '@/lib/db';
import { subscription, webhookEvent, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import DodoPayments from 'dodopayments';

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = config.dodo?.webhookSecret || '';
  if (!secret) {
    console.error('DODO_WEBHOOK_SECRET not configured');
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
  }

  // Read raw body for signature verification
  const rawBody = await req.text();
  
  // Get Standard Webhooks headers
  const webhookId = req.headers.get('webhook-id');
  const webhookTimestamp = req.headers.get('webhook-timestamp');
  const signature = req.headers.get('webhook-signature');

  console.log('Webhook received:', {
    webhookId,
    webhookTimestamp,
    hasSignature: !!signature,
    bodyLength: rawBody.length,
  });

  // Use Dodo SDK's built-in webhook verification
  let event: any;
  try {
    // SDK requires bearerToken even for webhook verification
    const apiKey = config.dodo?.apiKey || '';
    if (!apiKey) {
      console.error('DODO_API_KEY not configured - required for webhook verification');
      return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 });
    }
    
    const environment = config.dodo?.environment || 'test_mode';
    const clientConfig: any = {
      bearerToken: apiKey,
      webhookKey: secret,
      environment,
    };

    // Some SDK versions may require explicit baseUrl, especially in live mode
    const baseUrl = process.env.DODO_BASE_URL;
    if (baseUrl) {
      clientConfig.baseUrl = baseUrl;
    } else if (environment === 'live') {
      // Default live API endpoint (adjust if DodoPayments uses different URL)
      clientConfig.baseUrl = 'https://api.dodopayments.com';
    }
    // For test_mode, SDK usually handles baseUrl internally

    const dodoClient = new (DodoPayments as any)(clientConfig);

    // Verify signature using SDK's unwrap method
    // This will throw if signature is invalid
    const webhookHeaders = {
      'webhook-id': webhookId || '',
      'webhook-signature': signature || '',
      'webhook-timestamp': webhookTimestamp || '',
    };

    const unwrappedWebhook = dodoClient.webhooks.unwrap(rawBody, { headers: webhookHeaders });
    console.log('Webhook signature verified successfully');
    
    // The unwrapped webhook should contain the parsed event
    // If it's already parsed, use it; otherwise parse the raw body
    if (unwrappedWebhook && typeof unwrappedWebhook === 'object') {
      event = unwrappedWebhook;
      console.log('Using unwrapped webhook event:', event);
    } else {
      // Fallback to parsing raw body if unwrap doesn't return parsed event
      event = JSON.parse(rawBody);
      console.log('Parsed event from raw body:', event);
    }
  } catch (verifyError: any) {
    console.error('Webhook signature verification failed:', verifyError);
    console.error('Error details:', {
      message: verifyError?.message,
      stack: verifyError?.stack,
    });
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Normalize event type
  const eventType = event?.type || event?.event_type || event?.name || 'unknown';
  const eventId = webhookId || event?.id || event?.event_id || event?.eventId || `evt_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  console.log('Processing webhook event:', { eventType, eventId });

  // Extract subscription and customer data from event
  // Dodo webhook payload structure: { data: { customer: { customer_id }, subscription_id, ... } }
  const subscriptionData = event?.data || event?.subscription || event;
  
  // Customer ID can be in multiple locations
  const customerId = subscriptionData?.customer?.customer_id || 
                     subscriptionData?.customer_id || 
                     subscriptionData?.customer?.id ||
                     event?.customer?.customer_id ||
                     event?.customer_id ||
                     event?.data?.customer_id;
  
  // Subscription ID can be in multiple locations
  const subscriptionId = subscriptionData?.subscription_id || 
                         subscriptionData?.id || 
                         event?.subscription_id || 
                         event?.data?.subscription_id ||
                         event?.id;

  console.log('Extracted webhook data:', { 
    customerId, 
    subscriptionId, 
    eventType,
    hasSubscriptionData: !!subscriptionData,
    subscriptionDataKeys: subscriptionData ? Object.keys(subscriptionData) : [],
  });

  // Log webhook event first (for audit trail and idempotency)
  let webhookLogId: string | null = null;
  try {
    // Check if we've already processed this event (idempotency)
    const existingEvent = await db.query.webhookEvent.findFirst({
      where: eq(webhookEvent.eventId, eventId),
    });

    if (existingEvent) {
      console.log(`Webhook event ${eventId} already processed, skipping`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }

    // Insert webhook event log
    const [inserted] = await db.insert(webhookEvent).values({
      eventId,
      eventType,
      dodoCustomerId: customerId || null,
      dodoSubscriptionId: subscriptionId || null,
      payload: event,
      processed: false,
    }).returning({ id: webhookEvent.id });

    webhookLogId = inserted.id;
  } catch (logError: any) {
    // If it's a duplicate key error, event was already processed
    if (logError?.code === '23505' || logError?.message?.includes('unique')) {
      console.log(`Webhook event ${eventId} already logged, skipping`);
      return NextResponse.json({ received: true, duplicate: true }, { status: 200 });
    }
    console.error('Failed to log webhook event:', logError);
    // Continue processing even if logging fails
  }

  try {
    // Process subscription events
    if (eventType.startsWith('subscription.')) {
      await handleSubscriptionEvent(eventType, subscriptionData, customerId, subscriptionId, event);
    }

    // Mark webhook as processed
    if (webhookLogId) {
      await db.update(webhookEvent)
        .set({ 
          processed: true, 
          processedAt: new Date() 
        })
        .where(eq(webhookEvent.id, webhookLogId));
    }

    // Always 200 to acknowledge receipt once processed
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error('Webhook handler error:', err);
    
    if (webhookLogId) {
      try {
        await db.update(webhookEvent)
          .set({ 
            errorMessage: err?.message || 'Processing failed' 
          })
          .where(eq(webhookEvent.id, webhookLogId));
      } catch (updateError) {
        console.error('Failed to update webhook error status:', updateError);
      }
    }
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }
}


//Handle subscription-related webhook events
async function handleSubscriptionEvent(
  eventType: string,
  subscriptionData: any,
  customerId: string | undefined,
  subscriptionId: string | undefined,
  event: any
) {
  if (!subscriptionData || !customerId || !subscriptionId) {
    console.warn('Missing subscription data in webhook event:', { eventType, customerId, subscriptionId });
    return;
  }

  // Find user by Dodo customer ID
  // Try multiple ways to find the user (in order of reliability):
  // 1. Check metadata.app_user_id (most reliable - set during checkout)
  // 2. Check existing subscription by customer_id
  // 3. Check customer email lookup
  
  const customerEmail = subscriptionData?.customer?.email || 
                        subscriptionData?.email || 
                        event?.data?.customer?.email ||
                        event?.customer?.email ||
                        event?.email;
  
  // Check metadata for app_user_id (set during checkout)
  const metadata = subscriptionData?.metadata || event?.data?.metadata || event?.metadata;
  const appUserId = metadata?.app_user_id;
  
  console.log('Looking up user:', { customerId, customerEmail, appUserId });
  
  let userId: string | null = null;
  
  // First, try metadata.app_user_id (most reliable - set during checkout)
  if (appUserId) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.id, appUserId),
    });
    if (userRecord) {
      userId = userRecord.id;
      console.log('Found user by app_user_id from metadata:', userId);
    }
  }
  
  // Second, try to find existing subscription by customer_id to get userId
  if (!userId && customerId) {
    const existingSubscription = await db.query.subscription.findFirst({
      where: eq(subscription.dodoCustomerId, customerId),
    });
    if (existingSubscription) {
      userId = existingSubscription.userId;
      console.log('Found existing subscription, userId:', userId);
    }
  }
  
  // Third, try email lookup (fallback)
  if (!userId && customerEmail) {
    const userRecord = await db.query.user.findFirst({
      where: eq(user.email, customerEmail),
    });
    userId = userRecord?.id || null;
    console.log('Found user by email:', userId);
  }

  if (!userId) {
    console.error(`Could not find user for Dodo customer ${customerId}, email: ${customerEmail}`);
    console.error('Subscription data:', JSON.stringify(subscriptionData, null, 2));
    throw new Error(`User not found for customer ${customerId}. Email: ${customerEmail || 'N/A'}`);
  }

  // Determine plan from product_id
  const productId = subscriptionData?.product_id || 
                   subscriptionData?.product?.id || 
                   subscriptionData?.product?.product_id ||
                   event?.product_id;
  let plan: 'free' | 'pro' | 'enterprise' = 'free';
  if (productId === config.dodo?.proProductId || productId === process.env.DODO_PRO_PRODUCT_ID) {
    plan = 'pro';
  } else if (productId === config.dodo?.enterpriseProductId || productId === process.env.DODO_ENTERPRISE_PRODUCT_ID) {
    plan = 'enterprise';
  }

  // Determine status - normalize status values
  const rawStatus = subscriptionData?.status || event?.status || 'inactive';
  const status = rawStatus.toLowerCase();
  
  // Handle timestamp conversion - Dodo may send Unix timestamps (seconds) or ISO strings
  const parseDate = (value: any): Date | null => {
    if (!value) return null;
    if (typeof value === 'number') {
      return new Date(value * 1000);
    }
    if (typeof value === 'string') {
      return new Date(value);
    }
    return null;
  };
  
  const currentPeriodStart = parseDate(
    subscriptionData?.current_period_start || 
    subscriptionData?.period_start ||
    subscriptionData?.currentPeriodStart
  );
  const currentPeriodEnd = parseDate(
    subscriptionData?.current_period_end || 
    subscriptionData?.period_end ||
    subscriptionData?.currentPeriodEnd
  );
  const cancelAtPeriodEnd = subscriptionData?.cancel_at_period_end || subscriptionData?.cancelAtPeriodEnd || false;
  const canceledAt = parseDate(subscriptionData?.canceled_at || subscriptionData?.canceledAt);

  console.log('Subscription data to save:', {
    subscriptionId,
    customerId,
    userId,
    plan,
    status,
    productId,
    currentPeriodStart,
    currentPeriodEnd,
  });

  // Upsert subscription
  const existing = await db.query.subscription.findFirst({
    where: eq(subscription.dodoSubscriptionId, subscriptionId),
  });

  if (existing) {
    // Update existing subscription
    const result = await db.update(subscription)
      .set({
        status,
        plan,
        currentPeriodStart,
        currentPeriodEnd,
        cancelAtPeriodEnd,
        canceledAt,
        metadata: subscriptionData,
        updatedAt: new Date(),
      })
      .where(eq(subscription.dodoSubscriptionId, subscriptionId))
      .returning();
    
    console.log(`Updated subscription ${subscriptionId} for user ${userId}, status: ${status}`, result[0]);
  } else {
    // Create new subscription
    const result = await db.insert(subscription).values({
      userId,
      dodoCustomerId: customerId,
      dodoSubscriptionId: subscriptionId,
      productId: productId || '',
      plan,
      status,
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd,
      canceledAt,
      metadata: subscriptionData,
    }).returning();
    
    console.log(`Created subscription ${subscriptionId} for user ${userId}, plan: ${plan}, status: ${status}`, result[0]);
  }

  switch (eventType) {
    case 'subscription.active':
    case 'subscription.renewed': {
      await db.update(subscription)
        .set({ status: 'active' })
        .where(eq(subscription.dodoSubscriptionId, subscriptionId));
      break;
    }
    case 'subscription.on_hold':
    case 'subscription.failed': {
      await db.update(subscription)
        .set({ status: 'on_hold' })
        .where(eq(subscription.dodoSubscriptionId, subscriptionId));
      break;
    }
    case 'subscription.cancelled':
    case 'subscription.expired': {
      await db.update(subscription)
        .set({ 
          status: 'cancelled',
          canceledAt: new Date(),
        })
        .where(eq(subscription.dodoSubscriptionId, subscriptionId));
      break;
    }
  }
}