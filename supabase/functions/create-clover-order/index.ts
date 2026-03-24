import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOVER_API = 'https://api.clover.com';
const ECOMM_API = 'https://scl.clover.com';

const LOCATIONS: Record<string, {
  merchantId: string;
  apiToken: string;
  ecommerceToken: string;
}> = {
  location1: {
    merchantId: 'JKK2PQSFMZNS1',
    apiToken: '74ced84f-11bc-7103-0bdd-4da52e7e0842',
    ecommerceToken: '3c2489ba-6226-b259-d760-d0236f272373',
  },
  location2: {
    merchantId: 'G6JZKQKPDNT71',
    apiToken: 'b92256f2-54bd-75d3-394e-f13c76b59ae4',
    ecommerceToken: 'e29e4110-7efd-3921-c131-83009ce889ba',
  },
};

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
    const { location_id, customer_name, customer_phone, customer_email, pickup_time, special_instructions, cart, order_db_id } = payload;

    const location = LOCATIONS[location_id];
    if (!location) {
      return new Response(JSON.stringify({ success: false, error: 'Unknown location' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { merchantId, apiToken, ecommerceToken } = location;

    // ── STEP 1: Create order on Clover (triggers printing) ───────────
    const orderRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currency: 'USD',
        title: `Online Order — ${customer_name}`,
        note: [`Phone: ${customer_phone}`, `Pickup: ${pickup_time || 'ASAP'}`, special_instructions ? `Notes: ${special_instructions}` : null].filter(Boolean).join(' | '),
        state: 'open',
      }),
    });

    if (!orderRes.ok) throw new Error(`Order creation failed: ${await orderRes.text()}`);
    const cloverOrder = await orderRes.json();
    const cloverOrderId = cloverOrder.id;

    // ── STEP 2: Add line items ───────────────────────────────────────
    for (const item of cart) {
      const note = [
        item.customizations?.add?.length ? `Add: ${item.customizations.add.join(', ')}` : '',
        item.customizations?.remove?.length ? `Remove: ${item.customizations.remove.join(', ')}` : '',
      ].filter(Boolean).join(' | ');

      await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders/${cloverOrderId}/line_items`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          price: Math.round(item.price * 100),
          unitQty: (item.quantity || 1) * 1000,
          ...(note ? { note } : {}),
        }),
      });
    }

    // ── STEP 3: Create payment session using Clover Ecommerce API ────
    // Uses the correct Clover ecommerce endpoint format
    const origin = payload.origin || 'https://mymehi21.github.io/wallyz-grill-website';
    const isLocalhost = origin.includes('localhost');

    // Calculate total in cents
    const totalInCents = Math.round(cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) * 100);

    // Use Clover's charge/session API which is what ecommerce tokens are actually for
    const chargeBody: any = {
      amount: totalInCents,
      currency: 'usd',
      capture: true,
      description: `Online Order - ${customer_name} | Pickup: ${pickup_time || 'ASAP'}`,
      source: 'hosted_checkout',
      metadata: {
        order_id: order_db_id,
        clover_order_id: cloverOrderId,
        customer_name,
        customer_phone,
      },
    };

    if (!isLocalhost) {
      chargeBody.redirect_url = `${origin}?order_success=true&order_id=${order_db_id}`;
    }

    console.log('Attempting checkout with body:', JSON.stringify(chargeBody));

    // Try the Clover hosted checkout page endpoint
    const checkoutRes = await fetch(`${ECOMM_API}/invoicingcheckoutservice/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ecommerceToken}`,
        'Content-Type': 'application/json',
        'X-Clover-Merchant-Id': merchantId,
      },
      body: JSON.stringify({
        customer: {
          email: customer_email,
          firstName: customer_name.split(' ')[0],
          lastName: customer_name.split(' ').slice(1).join(' ') || 'N/A',
          phoneNumber: customer_phone,
        },
        shoppingCart: {
          lineItems: cart.map(item => ({
            name: item.name,
            unitAmount: Math.round(item.price * 100),
            unitQty: (item.quantity || 1) * 1000,
          })),
        },
        ...(!isLocalhost ? {
          redirectUrls: {
            success: `${origin}?order_success=true&order_id=${order_db_id}`,
            failure: `${origin}?order_failed=true&order_id=${order_db_id}`,
            cancel: `${origin}?order_failed=true&order_id=${order_db_id}`,
          }
        } : {}),
      }),
    });

    console.log('Checkout response status:', checkoutRes.status);

    let checkoutUrl = null;
    if (checkoutRes.ok) {
      const data = await checkoutRes.json();
      console.log('Checkout response:', JSON.stringify(data));
      checkoutUrl = data.href ?? data.url ?? data.checkoutUrl ?? null;
    } else {
      const errText = await checkoutRes.text();
      console.error('Hosted checkout error:', errText);
      
      // Try alternative endpoint
      const altRes = await fetch(`${CLOVER_API}/invoicingcheckoutservice/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ecommerceToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer: {
            email: customer_email,
            firstName: customer_name.split(' ')[0],
            lastName: customer_name.split(' ').slice(1).join(' ') || 'N/A',
            phoneNumber: customer_phone,
          },
          shoppingCart: {
            lineItems: cart.map(item => ({
              name: item.name,
              unitAmount: Math.round(item.price * 100),
              unitQty: (item.quantity || 1) * 1000,
            })),
          },
        }),
      });

      console.log('Alt checkout status:', altRes.status);
      if (altRes.ok) {
        const altData = await altRes.json();
        console.log('Alt checkout response:', JSON.stringify(altData));
        checkoutUrl = altData.href ?? altData.url ?? null;
      } else {
        console.error('Alt checkout error:', await altRes.text());
      }
    }

    return new Response(JSON.stringify({ success: true, cloverOrderId, checkoutUrl }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
