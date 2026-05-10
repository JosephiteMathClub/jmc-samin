import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_ADMINS } from '@/lib/constants';

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing');
  }
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function POST(req: Request) {
  try {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const cookieStore = await cookies();
    
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const supabase = createServerClient(
      anonUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Admin check
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    const ADMIN_EMAILS = Array.from(new Set([
      ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
      ...DEFAULT_ADMINS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    if (!ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 1. List all users from Auth
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    if (listError) throw listError;

    // 2. Fetch all existing profiles
    const { data: existingProfiles, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('id');
    
    if (fetchError) throw fetchError;
    const profileIds = new Set(existingProfiles?.map(p => p.id) || []);

    // 3. Find missing profiles
    const missingUsers = users.filter(u => !profileIds.has(u.id));
    
    if (missingUsers.length === 0) {
      return NextResponse.json({ message: 'All users already have profiles.', count: 0 });
    }

    // 4. Batch insert missing profiles
    const profilesToInsert = missingUsers.map(u => ({
      id: u.id,
      full_name: u.user_metadata?.full_name || u.user_metadata?.name || 'Anonymous User',
      role: ADMIN_EMAILS.includes(u.email?.toLowerCase() || '') ? 'admin' : 'member'
    }));

    const { error: insertError } = await supabaseAdmin
      .from('profiles')
      .insert(profilesToInsert);

    if (insertError) throw insertError;

    return NextResponse.json({ 
      message: `Successfully synced ${profilesToInsert.length} profiles.`, 
      count: profilesToInsert.length 
    });

  } catch (err: any) {
    console.error('Sync Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
