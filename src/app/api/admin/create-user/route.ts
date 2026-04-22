import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_ADMINS } from '../../../../lib/constants';

// We create a supabase client with the service role key to perform administrative actions
// This client MUST NOT be exposed to the browser
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

export async function POST(req: Request) {
  try {
    const { email, password, fullName } = await req.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    // 1. Verify the requester is an admin
    const cookieStore = await cookies();
    
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // Check if user is admin
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    const ADMIN_EMAILS = Array.from(new Set([
      ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
      ...DEFAULT_ADMINS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    const userEmail = (user.email || "").toLowerCase();
    if (!ADMIN_EMAILS.includes(userEmail)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // 2. Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 3. Create profile for the new user
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: email,
        full_name: fullName,
        role: 'member'
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // We don't rollback user creation, but we log the error
    }

    return NextResponse.json({ userId: newUser.user.id });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
