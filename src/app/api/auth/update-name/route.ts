import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

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

const slugifyName = (name: string): string => {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
};

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    // 1. Get the current logged-in user
    const supabase = createServerClient(
      anonUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any) {
            cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate the new name
    const { newFullName } = await req.json();

    if (!newFullName || !newFullName.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const cleanNewName = newFullName.trim();

    const supabaseAdmin = getSupabaseAdmin();

    // Preserve real email if user registered with a real email
    const isVirtualEmail = !user.email || user.email.endsWith('@josephitre.club');
    let newAuthEmail = user.email;

    if (isVirtualEmail) {
      const newSlug = slugifyName(cleanNewName);
      newAuthEmail = `${newSlug}@josephitre.club`;
    }

    // Update user auth metadata
    const updatePayload: any = {
      user_metadata: {
        ...user.user_metadata,
        full_name: cleanNewName
      }
    };
    if (isVirtualEmail && newAuthEmail) {
      updatePayload.email = newAuthEmail;
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updatePayload);

    if (authUpdateError) {
      console.error('Error updating auth email:', authUpdateError);
      return NextResponse.json({ 
        error: `Failed to update credentials: ${authUpdateError.message}` 
      }, { status: 500 });
    }

    // Update public.profiles
    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: cleanNewName,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Error updating profiles table:', profileUpdateError);
    }

    // Update public.member
    const memberPayload: any = {
      full_name: cleanNewName,
      updated_at: new Date().toISOString()
    };
    if (isVirtualEmail && newAuthEmail) {
      memberPayload.email = newAuthEmail;
    }

    const { error: memberUpdateError } = await supabaseAdmin
      .from('member')
      .update(memberPayload)
      .eq('id', user.id);

    if (memberUpdateError) {
      console.error('Error updating member table:', memberUpdateError);
    }

    // Update public.ec_member
    const ecPayload: any = {
      full_name: cleanNewName,
      updated_at: new Date().toISOString()
    };
    if (isVirtualEmail && newAuthEmail) {
      ecPayload.email = newAuthEmail;
    }

    const { error: ecUpdateError } = await supabaseAdmin
      .from('ec_member')
      .update(ecPayload)
      .eq('id', user.id);

    if (ecUpdateError) {
      console.error('Error updating ec_member table:', ecUpdateError);
    }

    return NextResponse.json({ success: true, newEmail: newAuthEmail });

  } catch (err: any) {
    console.error('API Error in update-name Route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
