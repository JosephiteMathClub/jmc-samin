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

    // 2. Parse and validate payload
    const { newFullName, phone, memberClass, memberSection, memberRoll } = await req.json();

    const cleanNewName = newFullName ? newFullName.trim() : null;
    const cleanPhone = phone ? phone.trim() : null;

    if (!cleanNewName && !cleanPhone) {
      return NextResponse.json({ error: 'Name or phone number is required' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Preserve real email if user registered with a real email
    const isVirtualEmail = !user.email || user.email.endsWith('@josephitre.club');
    let newAuthEmail = user.email;

    if (cleanNewName && isVirtualEmail) {
      const newSlug = slugifyName(cleanNewName);
      newAuthEmail = `${newSlug}@josephitre.club`;
    }

    // Update user auth metadata
    const userMetadataUpdate: any = {
      ...user.user_metadata,
    };
    if (cleanNewName) userMetadataUpdate.full_name = cleanNewName;
    if (cleanPhone) userMetadataUpdate.phone = cleanPhone;

    const updatePayload: any = {
      user_metadata: userMetadataUpdate
    };
    if (cleanNewName && isVirtualEmail && newAuthEmail) {
      updatePayload.email = newAuthEmail;
    }

    const { error: authUpdateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, updatePayload);

    if (authUpdateError) {
      console.error('Error updating auth metadata:', authUpdateError);
      return NextResponse.json({ 
        error: `Failed to update credentials: ${authUpdateError.message}` 
      }, { status: 500 });
    }

    // Update public.profiles
    const profileUpdatePayload: any = {
      updated_at: new Date().toISOString()
    };
    if (cleanNewName) profileUpdatePayload.full_name = cleanNewName;
    if (cleanPhone) profileUpdatePayload.phone = cleanPhone;

    const { error: profileUpdateError } = await supabaseAdmin
      .from('profiles')
      .update(profileUpdatePayload)
      .eq('id', user.id);

    if (profileUpdateError) {
      console.error('Error updating profiles table:', profileUpdateError);
    }

    // Update public.member
    const memberPayload: any = {
      updated_at: new Date().toISOString()
    };
    if (cleanNewName) memberPayload.full_name = cleanNewName;
    if (cleanPhone) memberPayload.phone = cleanPhone;
    if (memberClass !== undefined) memberPayload.class = memberClass;
    if (memberSection !== undefined) memberPayload.section = memberSection;
    if (memberRoll !== undefined) memberPayload.roll = memberRoll;
    if (cleanNewName && isVirtualEmail && newAuthEmail) {
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
      updated_at: new Date().toISOString()
    };
    if (cleanNewName) ecPayload.full_name = cleanNewName;
    if (cleanPhone) ecPayload.phone = cleanPhone;
    if (memberClass !== undefined) ecPayload.class = memberClass;
    if (memberSection !== undefined) ecPayload.section = memberSection;
    if (memberRoll !== undefined) ecPayload.roll = memberRoll;
    if (cleanNewName && isVirtualEmail && newAuthEmail) {
      ecPayload.email = newAuthEmail;
    }

    const { error: ecUpdateError } = await supabaseAdmin
      .from('ec_member')
      .update(ecPayload)
      .eq('id', user.id);

    if (ecUpdateError) {
      console.error('Error updating ec_member table:', ecUpdateError);
    }

    return NextResponse.json({ success: true, newEmail: newAuthEmail, phone: cleanPhone });

  } catch (err: any) {
    console.error('API Error in update-name Route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
