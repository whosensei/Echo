/**
 * POST /api/billing/checkout
 * Creates a Dodo Payments hosted checkout session for Pro or Enterprise plan.
 *
 * Body:
 *  {
 *    "plan": "pro" | "enterprise",
 *    "returnUrl": "https://your-app.com/redirect" // optional, falls back to Origin/dashboard
 *  }
 *
 * Security:
 * - Requires authenticated user (Better Auth session)
 * - Uses Dodo SDK server-side
 */
import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { config } from '@/config/env';
import { getDodoClient, extractCheckoutUrl } from '@/lib/billing/client';

type Plan = 'pro' | 'enterprise';

function getReturnUrl(req: NextRequest, fallbackPath = '/dashboard') {
  const origin = req.headers.get('origin') || req.headers.get('x-forwarded-origin') || '';
  if (!origin) return fallbackPath;
  try {
    // Ensure no double slashes
    return new URL(fallbackPath, origin).toString();
  } catch {
    return fallbackPath;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Require auth
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const plan: Plan = (body?.plan === 'enterprise' ? 'enterprise' : 'pro');
    const returnUrl: string = typeof body?.returnUrl === 'string' && body.returnUrl.length > 0
      ? body.returnUrl
      : getReturnUrl(req, '/dashboard');

    // Resolve product id from env config
    const productId =
      plan === 'pro' ? config.dodo?.proProductId : config.dodo?.enterpriseProductId;

    if (!productId) {
      return NextResponse.json(
        { error: `Missing product id for plan=${plan}. Set ${plan === 'pro' ? 'DODO_PRO_PRODUCT_ID' : 'DODO_ENTERPRISE_PRODUCT_ID'}` },
        { status: 500 }
      );
    }

    const client = getDodoClient();

    // Validate configuration
    if (!config.dodo?.apiKey) {
      console.error('DODO_API_KEY is not set');
      return NextResponse.json(
        { error: 'Dodo Payments API key not configured' },
        { status: 500 }
      );
    }

    // Log request details (without sensitive data)
    console.log('Creating checkout session:', {
      plan,
      productId,
      customerEmail: session.user.email,
      returnUrl,
      environment: config.dodo.environment,
    });

    // Create hosted checkout session
    const sessionResp = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        },
      ],
      // When email exists on a customer, Dodo will attach to existing by default
      customer: {
        email: session.user.email,
        name: session.user.name || undefined,
      },
      // Minimal billing address — ideally collect from user profile later
      billing_address: {
        country: 'US',
      },
      billing_currency: 'USD',
      allowed_payment_method_types: ['credit', 'debit', 'apple_pay', 'google_pay'],
      show_saved_payment_methods: true,
      return_url: returnUrl,
      metadata: {
        app_plan: plan,
        app_user_id: session.user.id,
      },
    });

    const url = extractCheckoutUrl(sessionResp);
    if (!url) {
      return NextResponse.json(
        { error: 'Failed to create checkout session: URL missing' },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        sessionId: (sessionResp as any)?.session_id ?? (sessionResp as any)?.id ?? null,
        url,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Checkout creation failed:', error);
    
    // Log detailed error information
    const errorMessage = error?.message || 'Unknown error';
    const errorResponse = error?.response?.data || error?.body || error?.data;
    const statusCode = error?.status || error?.statusCode || error?.response?.status;
    
    console.error('Error details:', {
      message: errorMessage,
      statusCode,
      response: errorResponse,
      stack: error?.stack,
    });
    
    // Return more detailed error information in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      { 
        error: 'Failed to create checkout session',
        ...(isDevelopment && {
          details: errorMessage,
          statusCode,
          response: errorResponse,
        }),
      },
      { status: statusCode || 500 }
    );
  }
}