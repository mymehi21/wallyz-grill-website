import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOVER_CREDENTIALS: Record<string, { merchantId: string; accessToken: string }> = {
  location1: {
    merchantId: Deno.env.get('CLOVER_MERCHANT_ID_OAKPARK') ?? '',
    accessToken: Deno.env.get('CLOVER_API_TOKEN') ?? '',
  },
  location2: {
    merchantId: Deno.env.get('CLOVER_MERCHANT_ID_REDFORD') ?? '',
    accessToken: Deno.env.get('CLOVER_API_TOKEN') ?? '',
  },
};

const CLOVER_API = 'https://api.clover.com';

interface CartItem {
  name: string;
  price: number;
  quantity: number;
  customizations?: { add?: string[]; remove?: string[] };
}

interface CloverOrderPayload {
  location_id: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  pickup_time?: string;
  special_instructions?: string;
  cart: CartItem[];
  total_amount: number;
  order_db_id: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const payload: CloverOrderPayload = await req.json();
    const { location_id, customer_name, customer_phone, customer_email, pickup_time, special_instructions, cart, order_db_id } = payload;

    const creds = CLOVER_CREDENTIALS[location_id];
    if (!creds?.merchantId || !creds?.accessToken) {
      return new Response(JSON.stringify({ success: false, error: 'No Clover credentials for this location' }), {
        status: 400,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { merchantId, accessToken } = creds;

    // Step 1: Create the order on Clover — this makes it appear in their Orders queue and print
    const orderRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currency: 'USD',
        title: `Online Order - ${customer_name}`,
        note: `Phone: ${customer_phone} | Pickup: ${pickup_time || 'ASAP'}${special_instructions ? ' | Notes: ' + special_instructions : ''}`,
        state: 'open',
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      throw new Error(`Clover order creation failed: ${errText}`);
    }

    const cloverOrder = await orderRes.json();
    const cloverOrderId = cloverOrder.id;

    // Step 2: Add each item so kitchen sees exactly what was ordered
    for (const item of cart) {
      const note = [
        item.customizations?.add?.length ? 'Add: ' + item.customizations.add.join(', ') : '',
        item.customizations?.remove?.length ? 'Remove: ' + item.customizations.remove.join(', ') : '',
      ].filter(Boolean).join(' | ');

      await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders/${cloverOrderId}/line_items`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: item.name,
          price: Math.round(item.price * 100),
          unitQty: item.quantity * 1000,
          ...(note ? { note } : {}),
        }),
      });
    }

    // Step 3: Create Clover Hosted Checkout — gives a payment URL, money goes to restaurant
    const checkoutRes = await fetch(`${CLOVER_API}/invoicingcheckoutservice/v1/checkouts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customer: {
          email: customer_email,
          firstName: customer_name.split(' ')[0],
          lastName: customer_name.split(' ').slice(1).join(' ') || '',
          phoneNumber: customer_phone,
        },
        shoppingCart: {
          lineItems: cart.map(item => ({
            name: item.name,
            unitAmount: Math.round(item.price * 100),
            quantity: item.quantity,
          })),
        },
        redirectUrls: {
          success: `https://mymehi21.github.io/wallyz-grill-website?order_success=true&order_id=${order_db_id}`,
          failure: `https://mymehi21.github.io/wallyz-grill-website?order_failed=true`,
        },
      }),
    });

    let checkoutUrl = null;
    if (checkoutRes.ok) {
      const checkoutData = await checkoutRes.json();
      checkoutUrl = checkoutData.href ?? null;
    }

    return new Response(JSON.stringify({ success: true, cloverOrderId, checkoutUrl }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Clover order error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
