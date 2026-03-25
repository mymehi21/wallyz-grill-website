import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CLOVER_API = 'https://api.clover.com';

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    const { order_id } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ success: false, error: 'order_id is required' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Load order from DB
    const { data: order, error: orderError } = await supabase
      .from('pickup_orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ success: false, error: 'Order not found' }), {
        status: 404, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // Already paid — idempotent, return success without reprocessing
    if (order.status === 'paid' || order.status === 'paid_clover_sync_failed') {
      return new Response(JSON.stringify({ success: true, already_processed: true, status: order.status }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const creds = getLocationCredentials(order.location_id);
    if (!creds) {
      return new Response(JSON.stringify({ success: false, error: 'Unknown location on order' }), {
        status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    const { merchantId, apiToken, hostedCheckoutToken } = creds;

    // ── Verify payment with Clover ───────────────────────────────────
    // We MUST verify with Clover. We do NOT trust the redirect alone.
    let paymentVerified = false;
    let verificationAttempted = false;

    if (order.clover_checkout_session_id) {
      verificationAttempted = true;

      const sessionRes = await fetch(
        `${CLOVER_API}/invoicingcheckoutservice/v1/checkouts/${order.clover_checkout_session_id}`,
        {
          headers: {
            'Authorization': `Bearer ${hostedCheckoutToken}`,
            'X-Clover-Merchant-Id': merchantId,
          },
        }
      );

      if (sessionRes.ok) {
        const session = await sessionRes.json();
        console.log('Checkout session data:', JSON.stringify(session));

        // Clover marks a completed payment session as CLOSED or with payment.result SUCCESS
        const sessionStatus = session?.status ?? '';
        const paymentResult = session?.payment?.result ?? '';
        paymentVerified = sessionStatus === 'CLOSED' || paymentResult === 'SUCCESS';

        if (!paymentVerified) {
          console.log(`Payment not verified. Session status: "${sessionStatus}", payment result: "${paymentResult}"`);
        }
      } else {
        // Clover session lookup failed — this means we CANNOT verify
        // Do NOT mark as paid. Log it and return unverified.
        const errText = await sessionRes.text();
        console.error(`Clover session lookup failed (${sessionRes.status}): ${errText}`);

        await supabase.from('pickup_orders')
          .update({ status: 'payment_unverifiable' })
          .eq('id', order_id);

        return new Response(JSON.stringify({
          success: false,
          error: 'Could not verify payment with Clover. Payment status is unknown.',
          action: 'contact_restaurant',
        }), {
          status: 402, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
        });
      }
    } else {
      // No session ID stored — we have no way to verify
      // This should not happen in normal flow but if it does, we reject
      console.error('No clover_checkout_session_id on order — cannot verify payment');

      await supabase.from('pickup_orders')
        .update({ status: 'payment_unverifiable' })
        .eq('id', order_id);

      return new Response(JSON.stringify({
        success: false,
        error: 'No checkout session ID found for this order. Cannot verify payment.',
        action: 'contact_restaurant',
      }), {
        status: 402, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (!paymentVerified) {
      await supabase.from('pickup_orders')
        .update({ status: 'payment_failed' })
        .eq('id', order_id);

      return new Response(JSON.stringify({
        success: false,
        error: 'Payment was not completed on Clover checkout page.',
      }), {
        status: 402, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── Payment verified — create the Clover POS order ───────────────
    // This is the ONLY place a POS order is created.
    // Payment is confirmed before this runs.

    const cart = order.order_items as any[];
    const customer_name = order.customer_name;
    const customer_phone = order.customer_phone;
    const pickup_time = order.pickup_time;
    const special_instructions = order.special_instructions;

    let cloverOrderId: string | null = null;
    let cloverSyncFailed = false;

    const orderRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        currency: 'USD',
        title: `Online Order — ${customer_name}`,
        note: [
          `Phone: ${customer_phone}`,
          `Pickup: ${pickup_time || 'ASAP'}`,
          special_instructions ? `Notes: ${special_instructions}` : null,
        ].filter(Boolean).join(' | '),
        state: 'locked',
      }),
    });

    if (!orderRes.ok) {
      const errText = await orderRes.text();
      console.error('Clover POS order creation FAILED:', errText);
      cloverSyncFailed = true;
    } else {
      const cloverOrder = await orderRes.json();
      cloverOrderId = cloverOrder.id;
      console.log('Clover POS order created:', cloverOrderId);

      // Add line items
      for (const item of cart) {
        const note = [
          item.customizations?.add?.length ? `Add: ${item.customizations.add.join(', ')}` : '',
          item.customizations?.remove?.length ? `Remove: ${item.customizations.remove.join(', ')}` : '',
        ].filter(Boolean).join(' | ');

        const lineRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders/${cloverOrderId}/line_items`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            price: Math.round(item.price * 100),
            unitQty: (item.quantity || 1) * 1000,
            ...(note ? { note } : {}),
          }),
        });

        if (!lineRes.ok) {
          console.error(`Line item "${item.name}" failed:`, await lineRes.text());
          cloverSyncFailed = true;
          // Continue adding remaining items even if one fails
        }
      }

      // ── Fire print request ─────────────────────────────────────────
      // /fire is what Clover's own online ordering uses to trigger printing
      const fireRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/orders/${cloverOrderId}/fire`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      if (fireRes.ok) {
        console.log('Fire/print request sent successfully');
      } else {
        // Fallback: try print_event
        const printRes = await fetch(`${CLOVER_API}/v3/merchants/${merchantId}/print_event`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderRef: { id: cloverOrderId } }),
        });
        if (printRes.ok) {
          console.log('Print event sent successfully');
        } else {
          console.error('Both fire and print_event failed:', await printRes.text());
        }
      }
    }

    // ── Set final DB status ─────────────────────────────────────────
    // Payment is verified regardless of POS sync outcome.
    // If POS sync failed, we use a distinct status so the restaurant
    // knows they need to manually check the order.
    const finalStatus = cloverSyncFailed ? 'paid_clover_sync_failed' : 'paid';

    await supabase.from('pickup_orders').update({
      status: finalStatus,
      clover_order_id: cloverOrderId,
      paid_at: new Date().toISOString(),
    }).eq('id', order_id);

    // ── Send confirmation email ──────────────────────────────────────
    // Only sent after verified payment, never on failure paths.
    try {
      await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-order-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'pickup',
          customer_name: order.customer_name,
          customer_email: order.customer_email,
          customer_phone: order.customer_phone,
          location_name: order.location_id === 'location1' ? 'Wallyz Grill - Oak Park' : 'Wallyz Grill - Redford',
          location_address: order.location_id === 'location1'
            ? '25000 Greenfield Rd, Oak Park, MI 48237'
            : '25575 5 Mile Rd, Redford, MI 48239',
          pickup_time: order.pickup_time || 'ASAP',
          order_items: cart.map((item: any) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total_amount: order.total_amount,
          special_instructions: order.special_instructions,
        }),
      });
    } catch (emailErr) {
      // Non-critical — payment already verified and POS order handled
      console.error('Confirmation email failed (non-critical):', emailErr);
    }

    // Return success with clover sync status so frontend can show appropriate message
    return new Response(JSON.stringify({
      success: true,
      status: finalStatus,
      cloverOrderId,
      cloverSyncFailed,
    }), {
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('verify-payment unexpected error:', error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
