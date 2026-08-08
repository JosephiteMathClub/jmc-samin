import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPER_ADMIN_EMAILS } from '@/lib/constants';

function getSupabaseAdmin() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  
  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing');
  }

  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

async function checkIsAdmin(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!supabaseUrl || !supabaseAnonKey) {
      return { isAdmin: false, user: null };
    }

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {}
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      // Also try authorization bearer header if passed
      const authHeader = req.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user: bearerUser } } = await getSupabaseAdmin().auth.getUser(token);
        if (bearerUser) {
          return verifyUserAdmin(bearerUser);
        }
      }
      return { isAdmin: false, user: null };
    }

    return await verifyUserAdmin(user);
  } catch (err) {
    console.error('Error verifying admin status:', err);
    return { isAdmin: false, user: null };
  }
}

async function verifyUserAdmin(user: any) {
  const email = (user.email || '').toLowerCase().trim();

  const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  const ALLOWED_EMAILS = Array.from(new Set([
    ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
    ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
    ...SUPER_ADMIN_EMAILS,
    'samintausif38@gmail.com',
    'l47idkpro@gmail.com'
  ])).map(e => e.trim().toLowerCase()).filter(Boolean);

  if (ALLOWED_EMAILS.includes(email)) {
    return { isAdmin: true, user };
  }

  const userRole = (user.user_metadata?.role || '').toLowerCase().trim();
  if (userRole === 'admin' || userRole === 'super_admin') {
    return { isAdmin: true, user };
  }

  const supabaseAdmin = getSupabaseAdmin();
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile && ['admin', 'super_admin'].includes((profile.role || '').toLowerCase().trim())) {
    return { isAdmin: true, user };
  }

  return { isAdmin: false, user };
}

export async function POST(req: NextRequest) {
  try {
    const { isAdmin, user } = await checkIsAdmin(req);
    if (!isAdmin || !user) {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Key and value are required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error: upsertError } = await supabaseAdmin
      .from('system_settings')
      .upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });

    if (upsertError) {
      console.error('Error upserting system_settings via admin route:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, key });
  } catch (err: any) {
    console.error('API error in system-settings route:', err);
    return NextResponse.json({ error: err?.message || 'Server error saving system settings' }, { status: 500 });
  }
}
