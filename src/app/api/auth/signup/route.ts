import { createClient } from '@supabase/supabase-js';
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

export async function POST(req: Request) {
  try {
    const { email, password, fullName, phone } = await req.json();

    if (!password || !fullName || !phone) {
      return NextResponse.json({ error: 'Password, given name, and phone number are required.' }, { status: 400 });
    }

    if (/\s/.test(fullName)) {
      return NextResponse.json({ error: 'Please type in your name without spaces or just type in your surname' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const cleanEmail = email && email.trim() ? email.trim().toLowerCase() : null;
    const cleanPhone = phone.trim();
    
    // Assign the unique id to the provided name not to the provided email address
    const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
    const virtualEmail = `${slug}@josephitre.club`;

    // 1. Proactively check if this given name or virtual email slug is already set by another user
    const { data: profileCheck } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name');

    if (profileCheck) {
      const conflictingUser = profileCheck.find(p => {
        const otherSlug = (p.full_name || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
        return otherSlug === slug;
      });
      if (conflictingUser) {
        return NextResponse.json({ 
          error: 'This given name is already set by another user. Please choose a different one.' 
        }, { status: 400 });
      }
    }

    // 2. Create the user with email_confirm: true, which acts as pre-verified / auto-verified and suppresses signup confirmation links
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        real_email: cleanEmail,
        phone: cleanPhone
      }
    });

    if (createError) {
      console.error('Error creating user programmatically:', createError.message);
      
      let errorMessage = createError.message;
      if (createError.message.includes('already exists') || createError.message.includes('registered') || createError.message.includes('unique')) {
        errorMessage = 'This given name is already set by another user. Please choose a different one.';
      } else if (createError.message.includes('Invalid API key') || createError.message.includes('invalid') || createError.message.includes('API key')) {
        errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Upsert the public profile to associate full name, role 'member', and email
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: fullName,
        role: 'member',
        email: cleanEmail
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // Log profile error but proceed because account was successfully created
    }

    // Generate a unique 5-digit ID for the member record
    let resolvedMemberId = '';
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 100) {
      attempts++;
      const digits = Math.floor(10000 + Math.random() * 90000).toString();
      const { data: check } = await supabaseAdmin
        .from('member')
        .select('id')
        .eq('member_id', digits)
        .maybeSingle();
      if (!check) {
        resolvedMemberId = digits;
        isUnique = true;
      }
    }
    if (!resolvedMemberId) {
      resolvedMemberId = Math.floor(10000 + Math.random() * 90000).toString();
    }

    // Insert a base record in the member table so login-by-phone and profile settings find it
    const { error: memberError } = await supabaseAdmin
      .from('member')
      .insert({
        id: newUser.user.id,
        full_name: fullName,
        email: virtualEmail,
        email_address: cleanEmail,
        phone: cleanPhone,
        verified: 'no',
        member_id: resolvedMemberId
      });

    if (memberError) {
      console.error('Error creating member table row:', memberError.message);
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (err: any) {
    console.error('API Error in Signup Route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
