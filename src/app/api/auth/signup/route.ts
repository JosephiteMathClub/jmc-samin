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
    const { email, password, fullName } = await req.json();

    if (!email || !password || !fullName) {
      return NextResponse.json({ error: 'All fields (email, password, full name) are required.' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Create the user with email_confirm: true, which acts as pre-verified / auto-verified and suppresses signup confirmation links
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('Error creating user programmatically:', createError.message);
      
      let errorMessage = createError.message;
      if (createError.message.includes('Invalid API key') || createError.message.includes('invalid') || createError.message.includes('API key')) {
        errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
      }
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Upsert the public profile to associate full name and role 'member'
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: fullName,
        role: 'member'
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating user profile:', profileError.message);
      // Log profile error but proceed because account was successfully created
    }

    return NextResponse.json({ success: true, userId: newUser.user.id });
  } catch (err: any) {
    console.error('API Error in Signup Route:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
