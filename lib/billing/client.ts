import DodoPayments from 'dodopayments';
import { config } from '@/config/env';

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

export function extractCheckoutUrl(session: any): string | undefined {
  return session?.checkout_url ?? session?.link ?? session?.url;
}

export function extractPortalUrl(portal: any): string | undefined {
  return portal?.url ?? portal?.link;
}

export async function ensureDodoCustomer(email: string, name?: string, phone?: string): Promise<string> {
  const client = getDodoClient();

  try {
    if (client?.customers?.list) {
      const iterator = client.customers.list({ email, page_size: 1 } as any);
      for await (const c of iterator as any) {
        if (c?.email === email && c?.customer_id) {
          return c.customer_id as string;
        }
        break;
      }
    }
  } catch (e) {
    console.warn('Dodo customers.list failed, falling back to create:', e);
  }

  const created = await client.customers.create({
    email,
    name,
    phone_number: phone,
  });
  return created.customer_id as string;
}