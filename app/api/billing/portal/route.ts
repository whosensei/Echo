import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { getDodoClient, extractPortalUrl } from '@/lib/billing/client';
import { ensureDodoCustomer } from '@/lib/billing/client';

function getReturnUrl(req: NextRequest, fallbackPath = '/settings') {
  const origin = req.headers.get('origin') || req.headers.get('x-forwarded-origin') || '';
  if (!origin) return fallbackPath;
  try {
    return new URL(fallbackPath, origin).toString();
  } catch {
    return fallbackPath;
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const returnUrl: string =
      typeof body?.returnUrl === 'string' && body.returnUrl.length > 0
        ? body.returnUrl
        : getReturnUrl(req, '/settings');

    // Ensure a Dodo customer exists for this user
    const customerId = await ensureDodoCustomer(session.user.email, session.user.name || undefined);

    const client = getDodoClient();

    // Create portal session (Node SDK exposes customers.customerPortal.create)
    const portalSession = await client.customers.customerPortal.create(customerId, {
      return_url: returnUrl,
    });

    const url = extractPortalUrl(portalSession);
    if (!url) {
      return NextResponse.json(
        { error: 'Failed to create customer portal session: URL missing' },
        { status: 502 }
      );
    }

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error('Customer portal creation failed:', error);
    return NextResponse.json(
      { error: 'Failed to create customer portal session' },
      { status: 500 }
    );
  }
}