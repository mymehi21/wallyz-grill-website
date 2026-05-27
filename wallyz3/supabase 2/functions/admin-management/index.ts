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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Verify caller is super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('Unauthorized');

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    if (authError || !user) throw new Error('Unauthorized');
    if (user.email !== SUPER_ADMIN_EMAIL) throw new Error('Only the super admin can perform this action');

    const body = await req.json();
    const { action } = body;

    // ── CREATE ADMIN ─────────────────────────────────────────────────
    // Creates the auth account with a temp password you set
    // First login forces them to change their password
    if (action === 'create_admin') {
      const { email, full_name, temp_password } = body;

      // Create auth user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase().trim(),
        password: temp_password,
        email_confirm: true, // Skip email confirmation
        user_metadata: { full_name, must_change_password: true },
      });

      if (createError) throw createError;

      // Save to admin_users table
      await supabaseAdmin.from('admin_users').upsert({
        id: newUser.user.id,
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        must_change_password: true,
        created_at: new Date().toISOString(),
      });

      // Also ensure they're in approved_admins
      await supabaseAdmin.from('approved_admins').upsert({
        email: email.toLowerCase().trim(),
        full_name: full_name.trim(),
        is_active: true,
      }, { onConflict: 'email' });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── RESET PASSWORD ───────────────────────────────────────────────
    // You set a new temp password for them
    if (action === 'reset_password') {
      const { email, new_password } = body;

      // Find user by email
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('email', email.toLowerCase())
        .maybeSingle();

      if (!adminUser?.id) throw new Error('Admin account not found');

      // Update their password
      const { error } = await supabaseAdmin.auth.admin.updateUserById(adminUser.id, {
        password: new_password,
        user_metadata: { must_change_password: true },
      });

      if (error) throw error;

      // Mark as must change password
      await supabaseAdmin.from('admin_users')
        .update({ must_change_password: true })
        .eq('id', adminUser.id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE ADMIN ─────────────────────────────────────────────────
    if (action === 'delete_admin') {
      const { email } = body;

      // Remove from approved_admins
      await supabaseAdmin.from('approved_admins').delete().eq('email', email.toLowerCase());

      // Find and delete auth user
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

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Admin management error:', error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
  }
});
