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

    // Must be a single word (no spaces)
    if (/\s/.test(cleanNewName)) {
      return NextResponse.json({ 
        error: 'Please type in your name without spaces or just type in your surname. Your given name must be a single word.' 
      }, { status: 400 });
    }

    const newSlug = slugifyName(cleanNewName);
    const newVirtualEmail = `${newSlug}@josephitre.club`;

    const supabaseAdmin = getSupabaseAdmin();

    // 3. Ensure uniqueness: check if another user has this name
    // Check profiles
    const { data: profileCheck, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name')
      .ilike('full_name', cleanNewName);

    if (pErr) {
      console.error('Error querying profiles for uniqueness check:', pErr);
    }

    // Exclude current user from uniqueness checks
    const otherProfile = profileCheck?.find(p => p.id !== user.id);
    if (otherProfile) {
      return NextResponse.json({ 
        error: 'This given name is already set by another user. Please choose a different one.' 
      }, { status: 400 });
    }

    // Check member
    const { data: memberCheck, error: mErr } = await supabaseAdmin
      .from('member')
      .select('id, full_name')
      .ilike('full_name', cleanNewName);

    if (mErr) {
      console.error('Error querying member for uniqueness check:', mErr);
    }

    const otherMember = memberCheck?.find(m => m.id !== user.id);
    if (otherMember) {
      return NextResponse.json({ 
        error: 'This given name is already set by another user. Please choose a different one.' 
      }, { status: 400 });
    }

    // Check ec_member
    const { data: ecCheck, error: eErr } = await supabaseAdmin
      .from('ec_member')
      .select('id, full_name')
      .ilike('full_name', cleanNewName);

    if (eErr) {
      console.error('Error querying ec_member for uniqueness check:', eErr);
    }

    const otherEc = ecCheck?.find(ec => ec.id !== user.id);
    if (otherEc) {
      return NextResponse.json({ 
        error: 'This given name is already set by another user. Please choose a different one.' 
      }, { status: 400 });
    }

    // Also check if any profile/member is registered with the email containing this slug
    const { data: emailProfileCheck } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('email', newVirtualEmail);

    const otherEmailProfile = emailProfileCheck?.find(p => p.id !== user.id);
    if (otherEmailProfile) {
      return NextResponse.json({
        error: 'This given name is already set by another user. Please choose a different one.'
      }, { status: 400 });
    }

    const { data: emailMemberCheck } = await supabaseAdmin
      .from('member')
      .select('id, email')
      .eq('email', newVirtualEmail);

    const otherEmailMember = emailMemberCheck?.find(m => m.id !== user.id);
    if (otherEmailMember) {
      return NextResponse.json({
        error: 'This given name is already set by another user. Please choose a different one.'
      }, { status: 400 });
    }

    // 4. Update the user:
    // Update Auth Email in auth.users via admin API
    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email: newVirtualEmail,
      user_metadata: {
        ...user.user_metadata,
        full_name: cleanNewName
      }
    });

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
    const { error: memberUpdateError } = await supabaseAdmin
      .from('member')
      .update({
        full_name: cleanNewName,
        email: newVirtualEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (memberUpdateError) {
      console.error('Error updating member table:', memberUpdateError);
    }

    // Update public.ec_member
    const { error: ecUpdateError } = await supabaseAdmin
      .from('ec_member')
      .update({
        full_name: cleanNewName,
        email: newVirtualEmail,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (ecUpdateError) {
      console.error('Error updating ec_member table:', ecUpdateError);
    }

    return NextResponse.json({ success: true, newEmail: newVirtualEmail });

  } catch (err: any) {
    console.error('API Error in update-name Route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
