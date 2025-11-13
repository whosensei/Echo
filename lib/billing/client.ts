import DodoPayments from 'dodopayments';
import { config } from '@/config/env';

/**
 * Returns a singleton Dodo Payments client configured from environment.
 * Requires:
 * - DODO_API_KEY
 * - DODO_ENV = 'test_mode' | 'live'
 */
let _client: any;

export function getDodoClient() {
  if (_client) return _client;

  const apiKey = config.dodo?.apiKey;
  if (!apiKey) {
    throw new Error('Dodo API key not configured. Set DODO_API_KEY.');
  }

  const environment = (config.dodo?.environment || 'test_mode') as 'test_mode' | 'live';

  _client = new (DodoPayments as any)({
    bearerToken: apiKey,
    environment,
  });

  return _client;
}

/**
 * Helper to safely extract a URL from various session shapes across SDK versions.
 */
export function extractCheckoutUrl(session: any): string | undefined {
  return session?.checkout_url ?? session?.link ?? session?.url;
}

/**
 * Helper to safely extract a URL from portal session responses.
 */
export function extractPortalUrl(portal: any): string | undefined {
  return portal?.url ?? portal?.link;
}
/**
 * Ensure a Dodo customer exists for the given email.
 * Tries to find by email; if not found, creates a new customer.
 */
export async function ensureDodoCustomer(email: string, name?: string, phone?: string): Promise<string> {
  const client = getDodoClient();

  // Try to find existing by email (SDK supports basic filters on list)
  try {
    if (client?.customers?.list) {
      // Prefer server-side filter if supported
      const iterator = client.customers.list({ email, page_size: 1 } as any);
      // Some SDKs return AsyncIterable, iterate to first match
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for await (const c of iterator as any) {
        if (c?.email === email && c?.customer_id) {
          return c.customer_id as string;
        }
        // Break after first page item if shape differs
        break;
      }
    }
  } catch (e) {
    // Non-fatal; fall back to create
    console.warn('Dodo customers.list failed, falling back to create:', e);
  }

  // Create if not found
  const created = await client.customers.create({
    email,
    name,
    phone_number: phone,
  });
  return created.customer_id as string;
}