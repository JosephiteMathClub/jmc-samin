import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

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
    const { email, origin } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Determine target redirect url dynamically
    const targetOrigin = origin || process.env.NEXT_PUBLIC_APP_URL || '';
    const cleanOrigin = targetOrigin.replace(/\/$/, '');
    const redirectUrl = `${cleanOrigin}/reset-password`;

    console.log(`[Forgot Password] Generating recovery link for ${email} with redirect: ${redirectUrl}`);

    // Generate standard password reset recovery link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: {
        redirectTo: redirectUrl
      }
    });

    if (linkError) {
      console.error('[Forgot Password] Supabase link generation error:', linkError.message);
      
      let errorMessage = linkError.message;
      if (linkError.message.includes('Invalid API key') || linkError.message.includes('invalid') || linkError.message.includes('API key')) {
        errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Locate the "service_role" secret token (NOT the "anon" public key) and set it as the SUPABASE_SERVICE_ROLE_KEY in your AI Studio Settings -> Environment Variables.';
      }
      
      // Let's check if user was not found
      if (linkError.message.includes('User not found') || linkError.message.includes('not found') || linkError.status === 404) {
        // Return success to prevent email scanning security vulnerabilities
        return NextResponse.json({ success: true, message: 'If the associated account exists, a reset link has been dispatched.' });
      }
      return NextResponse.json({ error: `Link Generation Failed: ${errorMessage}` }, { status: 400 });
    }

    const actionLink = linkData?.properties?.action_link;
    if (!actionLink) {
      console.error('[Forgot Password] Generated link details are invalid or missing:', linkData);
      return NextResponse.json({ error: 'Could not generate recovery properties.' }, { status: 500 });
    }

    console.log(`[Forgot Password] Directing email delivery via configured SMTP to ${email}...`);

    // Send the custom branded password reset email using the configure SMTP sender
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset your Josephite Math Club account password',
      html: `
        <div style="font-family: inherit, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 40px 20px; color: #f4f4f5; background-color: #09090b; max-width: 600px; margin: 0 auto; border: 1px solid #27272a; border-radius: 24px;">
          <div style="text-align: center; margin-bottom: 32px;">
            <div style="display: inline-block; font-size: 10px; font-weight: bold; letter-spacing: 0.3em; color: #f59e0b; text-transform: uppercase; margin-bottom: 8px;">
              Josephite Math Club
            </div>
            <h1 style="font-size: 28px; font-weight: 800; color: #ffffff; margin: 0; tracking: -0.025em; text-transform: uppercase;">
              Forgot <span style="color: #f59e0b;">Password?</span>
            </h1>
          </div>
          
          <div style="background-color: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.08); padding: 32px; border-radius: 16px; margin-bottom: 24px;">
            <p style="font-size: 14px; line-height: 1.6; color: #a1a1aa; margin: 0 0 24px 0; text-align: center;">
              We received a request to reset your Josephite Math Club account password. Please click the button below to establish a new password:
            </p>
            
            <div style="text-align: center; margin: 32px 0;">
              <a href="${actionLink}" style="background-color: #f59e0b; color: #000000; padding: 14px 28px; text-decoration: none; border-radius: 9999px; font-weight: 900; font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; display: inline-block; box-shadow: 0 4px 12px rgba(245, 158, 11, 0.2); transition: all 0.3s ease;">
                Reset Password
              </a>
            </div>
            
            <p style="font-size: 11px; line-height: 1.5; color: #71717a; margin: 24px 0 0 0; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 24px;">
              <strong>Trouble clicking the button?</strong><br />
              Copy and paste this link in your browser bar:<br />
              <span style="color: #f59e0b; word-break: break-all; font-family: monospace; font-size: 10.5px; display: block; margin-top: 6px;">${actionLink}</span>
            </p>
          </div>
          
          <div style="text-align: center;">
            <p style="font-size: 10px; line-height: 1.5; color: #52525b; text-transform: uppercase; letter-spacing: 0.1em; margin: 0;">
              If you didn't initiate this request, you can safely ignore this email. Your credentials remain completely secure.
            </p>
          </div>
        </div>
      `,
      text: `Reset your JMC account password. Copy and paste the following link in your browser to complete: ${actionLink}`
    });

    if (!emailResult.success) {
      console.error('[Forgot Password] Email transmission failure:', emailResult.error);
      return NextResponse.json({ error: `Email Delivery Failed: ${(emailResult.error as any)?.message || 'SMTP Configuration Issue'}` }, { status: 500 });
    }

    console.log('[Forgot Password] Password recovery email dispatched successfully via custom address!');
    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error('[Forgot Password] Unhandled internal error:', err);
    return NextResponse.json({ error: err?.message || 'Internal Server Error' }, { status: 500 });
  }
}
