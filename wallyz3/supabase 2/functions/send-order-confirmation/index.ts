import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const FROM_EMAIL = 'Wallyz Grill <orders@wallyzgrill.com>';
const RESTAURANT_EMAIL = 'wallyzgrill@gmail.com';

interface OrderConfirmationPayload {
  type: 'pickup' | 'catering_tray' | 'catering_truck';
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  location_name?: string;
  location_address?: string;
  pickup_time?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  guest_count?: string;
  order_items?: Array<{ name: string; quantity: number; price: number }>;
  total_amount?: number;
  special_instructions?: string;
}

function formatCurrency(amount: number) {
  return `$${amount.toFixed(2)}`;
}

function buildCustomerEmail(data: OrderConfirmationPayload) {
  const itemsHtml = data.order_items?.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`
  ).join('') ?? '';

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:32px;text-align:center;">
        <h1 style="margin:0;font-size:28px;letter-spacing:2px;">WALLYZ GRILL</h1>
        <p style="margin:8px 0 0;opacity:0.9;">Order Confirmation</p>
      </div>
      <div style="padding:32px;">
        <h2 style="color:#ea580c;margin-top:0;">Hey ${data.customer_name}, your order is confirmed! 🎉</h2>
        <p style="color:#ccc;">We've received your order. Here's your summary:</p>

        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;margin:24px 0;">
          <h3 style="color:#ea580c;margin-top:0;">📍 Pickup Details</h3>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Location:</strong> ${data.location_name}</p>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Address:</strong> ${data.location_address}</p>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Pickup Time:</strong> ${data.pickup_time || 'ASAP'}</p>
        </div>

        ${itemsHtml ? `
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;overflow:hidden;margin:24px 0;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#222;">
                <th style="padding:12px;text-align:left;color:#ea580c;">Item</th>
                <th style="padding:12px;text-align:center;color:#ea580c;">Qty</th>
                <th style="padding:12px;text-align:right;color:#ea580c;">Price</th>
              </tr>
            </thead>
            <tbody style="color:#ccc;">${itemsHtml}</tbody>
            <tfoot>
              <tr style="background:#222;">
                <td colspan="2" style="padding:12px;font-weight:bold;color:#fff;">Total</td>
                <td style="padding:12px;text-align:right;font-weight:bold;color:#ea580c;font-size:18px;">${formatCurrency(data.total_amount ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>` : ''}

        ${data.special_instructions ? `
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;margin:24px 0;">
          <h4 style="color:#ea580c;margin-top:0;">Special Instructions</h4>
          <p style="color:#ccc;margin:0;">${data.special_instructions}</p>
        </div>` : ''}

        <p style="color:#ccc;">Questions? Call us at <a href="tel:2489939330" style="color:#ea580c;">(248) 993-9330</a> or email <a href="mailto:wallyzgrill@gmail.com" style="color:#ea580c;">wallyzgrill@gmail.com</a></p>
      </div>
      <div style="background:#0a0a0a;padding:20px;text-align:center;color:#666;font-size:13px;">
        <p style="margin:0;">© ${new Date().getFullYear()} Wallyz Grill. All rights reserved.</p>
      </div>
    </div>
  `;
}

function buildRestaurantEmail(data: OrderConfirmationPayload) {
  const itemsHtml = data.order_items?.map(item =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #333;">${item.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #333;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
    </tr>`
  ).join('') ?? '';

  const typeLabel = data.type === 'pickup' ? '🛍️ PICKUP ORDER' : data.type === 'catering_tray' ? '🍱 CATERING - PARTY TRAYS' : '🚚 FOOD TRUCK REQUEST';

  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#111;color:#fff;border-radius:12px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#ea580c,#c2410c);padding:24px;text-align:center;">
        <h1 style="margin:0;font-size:22px;">NEW ORDER RECEIVED</h1>
        <p style="margin:8px 0 0;font-size:18px;font-weight:bold;">${typeLabel}</p>
      </div>
      <div style="padding:32px;">
        <div style="background:#1a1a1a;border:1px solid #ea580c;border-radius:8px;padding:20px;margin-bottom:24px;">
          <h3 style="color:#ea580c;margin-top:0;">Customer Info</h3>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Name:</strong> ${data.customer_name}</p>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Phone:</strong> <a href="tel:${data.customer_phone}" style="color:#ea580c;">${data.customer_phone}</a></p>
          <p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Email:</strong> ${data.customer_email}</p>
          ${data.pickup_time ? `<p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Pickup Time:</strong> ${data.pickup_time}</p>` : ''}
          ${data.event_date ? `<p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Event Date:</strong> ${data.event_date} at ${data.event_time}</p>` : ''}
          ${data.event_location ? `<p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Event Location:</strong> ${data.event_location}</p>` : ''}
          ${data.guest_count ? `<p style="margin:4px 0;color:#ccc;"><strong style="color:#fff;">Guest Count:</strong> ${data.guest_count}</p>` : ''}
        </div>

        ${itemsHtml ? `
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;overflow:hidden;margin-bottom:24px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead>
              <tr style="background:#222;">
                <th style="padding:12px;text-align:left;color:#ea580c;">Item</th>
                <th style="padding:12px;text-align:center;color:#ea580c;">Qty</th>
                <th style="padding:12px;text-align:right;color:#ea580c;">Price</th>
              </tr>
            </thead>
            <tbody style="color:#ccc;">${itemsHtml}</tbody>
            <tfoot>
              <tr style="background:#222;">
                <td colspan="2" style="padding:12px;font-weight:bold;color:#fff;">Total</td>
                <td style="padding:12px;text-align:right;font-weight:bold;color:#ea580c;font-size:18px;">${formatCurrency(data.total_amount ?? 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>` : ''}

        ${data.special_instructions ? `
        <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:16px;">
          <h4 style="color:#ea580c;margin-top:0;">Special Instructions</h4>
          <p style="color:#ccc;margin:0;">${data.special_instructions}</p>
        </div>` : ''}
      </div>
    </div>
  `;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const data: OrderConfirmationPayload = await req.json();

    const customerSubject = data.type === 'pickup'
      ? '✅ Your Wallyz Grill Order is Confirmed!'
      : data.type === 'catering_tray'
      ? '✅ Your Wallyz Grill Catering Order is Confirmed!'
      : '✅ Your Food Truck Request Has Been Received!';

    const restaurantSubject = data.type === 'pickup'
      ? `🛍️ New Pickup Order - ${data.customer_name}`
      : data.type === 'catering_tray'
      ? `🍱 New Catering Order - ${data.customer_name}`
      : `🚚 New Food Truck Request - ${data.customer_name}`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: data.customer_email, subject: customerSubject, html: buildCustomerEmail(data) }),
    });

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to: RESTAURANT_EMAIL, subject: restaurantSubject, html: buildRestaurantEmail(data) }),
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
});
