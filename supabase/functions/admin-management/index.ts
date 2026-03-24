import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPER_ADMIN_EMAIL = 'testnetwork61@gmail.com';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  try {
    // Create admin client with service role — can delete auth users
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify the requester is the super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');
    if (user.email !== SUPER_ADMIN_EMAIL) throw new Error('Only the super admin can perform this action');

    const { action, email, userId } = await req.json();

    if (action === 'delete_admin') {
      // Remove from approved_admins
      await supabaseAdmin.from('approved_admins').delete().eq('email', email.toLowerCase());

      // Find and delete from auth if they have an account
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (adminUser?.id) {
        await supabaseAdmin.auth.admin.deleteUser(adminUser.id);
        await supabaseAdmin.from('admin_users').delete().eq('id', adminUser.id);
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'reset_password') {
      // Send password reset email via Supabase Auth
      const { error } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email.toLowerCase(),
      });

      if (error) throw error;

      // Also send via regular reset email so it goes to their inbox
      await supabaseAdmin.auth.resetPasswordForEmail(email.toLowerCase(), {
        redirectTo: `${req.headers.get('origin') || 'https://mymehi21.github.io/wallyz-grill-website'}/admin`,
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
