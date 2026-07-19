import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { DEFAULT_ADMINS } from '../../../../lib/constants';
import { sendEmail } from '@/lib/email';

// Helper function to get the admin client
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
    const { email, password, fullName, usePhoneAsLogin, useGivenNameAsLogin } = await req.json();

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }
    if (!usePhoneAsLogin && !useGivenNameAsLogin && !email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Initialize admin client safely
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Verify the requester is an admin
    const cookieStore = await cookies();
    
    // Ensure we have values to prevent crash during build time evaluation
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

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

    // Check if user is admin
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    const ADMIN_EMAILS = Array.from(new Set([
      ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
      ...DEFAULT_ADMINS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    const userEmail = (user.email || "").toLowerCase();
    
    let isDbAdmin = false;
    try {
      const { data: userProfile } = await supabaseAdmin
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      if (userProfile && (userProfile.role?.trim().toLowerCase() === 'admin' || userProfile.role?.trim().toLowerCase() === 'super_admin')) {
        isDbAdmin = true;
      }
    } catch (e) {
      console.error("Error checking db admin status:", e);
    }
    
    if (!ADMIN_EMAILS.includes(userEmail) && !isDbAdmin) {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const cleanEmail = (usePhoneAsLogin || useGivenNameAsLogin) ? null : (email ? email.trim().toLowerCase() : null);
    
    // Assign the unique id
    let virtualEmail;
    if (usePhoneAsLogin) {
      virtualEmail = `${password.trim()}@josephitre.club`;
    } else if (useGivenNameAsLogin) {
      const givenName = fullName.trim().split(/\s+/)[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
      virtualEmail = `${givenName}@josephitre.club`;
    } else {
      const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
      virtualEmail = `${slug}@josephitre.club`;
    }

    // 2. Create the new user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: virtualEmail,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName,
        real_email: cleanEmail,
        phone: password.trim()
      }
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 3. Create profile for the new user (or update if trigger already ran)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: newUser.user.id,
        full_name: fullName,
        role: 'member',
        email: cleanEmail
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      // We don't rollback user creation, but we log the error
    }

    // 4. Send Welcome Email in background
    if (cleanEmail && !cleanEmail.endsWith('@josephitre.club')) {
      sendEmail({
        to: cleanEmail,
        subject: 'Your Account Creation Has Been Successful!',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0c4a6e; margin-bottom: 20px;">Account Creation Successful, ${fullName}!</h1>
            <p style="font-size: 16px; line-height: 1.5;">Your account has been successfully created for Josephite Math Club event registration.</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="font-size: 14px; color: #0369a1; margin-top: 0;">Login Credentials:</h2>
              <p style="margin: 5px 0;"><strong>Username / Full Name:</strong> ${fullName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${cleanEmail}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> Your provided phone number (${password})</p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;"><em>Note: You can sign in using either your Full Name (as Username) or your email.</em></p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5;">You can now sign in to your dashboard to view your profile and participate in upcoming events using your phone number as password.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/auth?mode=login" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign In Now</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Josephite Math Club Automated System</p>
          </div>
        `,
        text: `Your Account Creation Has Been Successful!\n\nWelcome to Josephite Math Club, ${fullName}!\n\nYour account has been successfully created. We are excited to have you.\n\nLogin Credentials:\nEmail: ${cleanEmail}\nPassword: Your provided phone number (${password})\n\nYou can sign in at: ${process.env.NEXT_PUBLIC_APP_URL || ''}/auth?mode=login`,
      }).catch(emailErr => {
        console.error('Failed to send welcome email in background:', emailErr);
      });
    }

    return NextResponse.json({ userId: newUser.user.id });
  } catch (err: any) {
    console.error('API Error:', err);
    let errorMessage = err.message || 'Internal Server Error';
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid') || errorMessage.includes('API key')) {
      errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
