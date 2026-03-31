import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOVER_API = 'https://api.clover.com';

// All credentials from Supabase secrets — never hardcoded
function getLocationCredentials(locationId: string) {
  if (locationId === 'location1') {
    return {
      merchantId: Deno.env.get('CLOVER_MERCHANT_ID_OAKPARK')!,
      apiToken: Deno.env.get('CLOVER_API_TOKEN_OAKPARK')!,
      hostedCheckoutToken: Deno.env.get('CLOVER_ECOMM_TOKEN_OAKPARK')!,
    };
  }
  if (locationId === 'location2') {
    return {
      merchantId: Deno.env.get('CLOVER_MERCHANT_ID_REDFORD')!,
      apiToken: Deno.env.get('CLOVER_API_TOKEN_REDFORD')!,
      hostedCheckoutToken: Deno.env.get('CLOVER_ECOMM_TOKEN_REDFORD')!,
    };
  }
  return null;
}

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  customizations?: { add?: string[]; remove?: string[] };
}

interface Payload {
  location_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_time?: string;
  special_instructions?: string;
  cart: CartItem[];
  total_amount: number;
  order_db_id: string;
  origin?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const payload: Payload = await req.json();
    const {
      location_id, customer_name, customer_phone, customer_email,
      pickup_time, special_instructions, cart, order_db_id
    } = payload;

    const creds = getLocationCredentials(location_id);
    if (!creds) {
      return new Response(JSON.stringify({ success: false, error: 'Unknown location' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { merchantId, hostedCheckoutToken } = creds;
    const origin = payload.origin || 'https://mymehi21.github.io/wallyz-grill-website';
    const isLocalhost = origin.includes('localhost');

    // ── Create Hosted Checkout session ONLY ─────────────────────────────
    // We do NOT create the Clover order yet.
    // The order is only created after payment succeeds (via verify-payment function).
    // This prevents ghost orders appearing on the device before payment.

    const checkoutBody: any = {
      customer: {
        email: customer_email,
        firstName: customer_name.split(' ')[0],
        lastName: customer_name.split(' ').slice(1).join(' ') || 'Customer',
        phoneNumber: customer_phone,
      },
      shoppingCart: {
        lineItems: cart.map(item => ({
          name: item.name,
          price: Math.round(item.price * 100),
          unitQty: item.quantity || 1,
          ...(
            (item.customizations?.add?.length || item.customizations?.remove?.length) ? {
              note: [
                item.customizations?.add?.length ? `Add: ${item.customizations.add.join(', ')}` : '',
                item.customizations?.remove?.length ? `Remove: ${item.customizations.remove.join(', ')}` : '',
              ].filter(Boolean).join(' | ')
            } : {}
          ),
        })),
      },
    };

    // Clover rejects localhost redirect URLs — only set for live deployments
    if (!isLocalhost) {
      checkoutBody.redirectUrls = {
        success: `${origin}/wallyz-grill-website/?order_success=true&order_id=${order_db_id}`,
        failure: `${origin}/wallyz-grill-website/?order_failed=true&order_id=${order_db_id}`,
        cancel: `${origin}/wallyz-grill-website/?order_failed=true&order_id=${order_db_id}`,
      };
    }

    console.log('Creating checkout session for order:', order_db_id);
    console.log('Merchant ID:', merchantId);
    console.log('Checkout body:', JSON.stringify(checkoutBody));

    const checkoutRes = await fetch(`${CLOVER_API}/invoicingcheckoutservice/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hostedCheckoutToken}`,
        'Content-Type': 'application/json',
        'X-Clover-Merchant-Id': merchantId,
      },
      body: JSON.stringify(checkoutBody),
    });

    console.log('Checkout response status:', checkoutRes.status);

    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      console.error('Checkout session error:', errText);
      return new Response(JSON.stringify({
        success: false,
        error: `Checkout session failed: ${checkoutRes.status}`,
        details: errText,
      }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const checkoutData = await checkoutRes.json();
    console.log('Checkout session created:', JSON.stringify(checkoutData));

    const checkoutUrl = checkoutData.href ?? null;
    const checkoutSessionId = checkoutData.checkoutSessionId ?? null;

    // Store the checkout session ID on the order so verify-payment can look it up
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    await supabase
      .from('pickup_orders')
      .update({ clover_checkout_session_id: checkoutSessionId })
      .eq('id', order_db_id);

    return new Response(JSON.stringify({
      success: true,
      checkoutUrl,
      checkoutSessionId,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
