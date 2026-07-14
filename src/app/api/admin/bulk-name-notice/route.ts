import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
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

async function getCallerSuperAdminDetails(): Promise<{ isSuper: boolean; email?: string }> {
  try {
    const cookieStore = await cookies();
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonUrl || !anonKey) return { isSuper: false };

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
    if (authError || !user) return { isSuper: false };

    const email = (user.email || '').toLowerCase().trim();

    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    if (SUPER_ADMINS.includes(email)) {
      return { isSuper: true, email };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role?.trim().toLowerCase() === 'super_admin') {
      return { isSuper: true, email };
    }

    return { isSuper: false, email };
  } catch (err) {
    console.error('Error verifying super admin identity:', err);
    return { isSuper: false };
  }
}

export async function GET() {
  try {
    const adminDetails = await getCallerSuperAdminDetails();
    if (!adminDetails.isSuper) {
      return NextResponse.json({ error: 'Unauthorized. Only Super Admins can query multi-word names.' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role');

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    // Filter profiles that have a multi-word name (at least one space)
    const targetProfiles = (profiles || []).filter(p => {
      if (!p.full_name || !p.email) return false;
      const trimmed = p.full_name.trim();
      return trimmed.split(/\s+/).length > 1;
    });

    return NextResponse.json({ profiles: targetProfiles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const adminDetails = await getCallerSuperAdminDetails();
    if (!adminDetails.isSuper) {
      return NextResponse.json({ error: 'Unauthorized. Only Super Admins can send this bulk notification.' }, { status: 403 });
    }

    const { subject, htmlTemplate } = await req.json();

    if (!subject || !htmlTemplate) {
      return NextResponse.json({ error: 'Missing subject or HTML template.' }, { status: 400 });
    }

    // Determine absolute dynamic redirect URL based on request headers/origin
    const urlObj = new URL(req.url);
    const origin = urlObj.origin || 'https://jmc-sjs.org';
    const redirectUrl = `${origin}/profile/change-name`;

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profiles, error: pErr } = await supabaseAdmin
      .from('profiles')
      .select('id, email, full_name');

    if (pErr) {
      return NextResponse.json({ error: pErr.message }, { status: 500 });
    }

    const targetProfiles = (profiles || []).filter(p => {
      if (!p.full_name || !p.email) return false;
      const trimmed = p.full_name.trim();
      return trimmed.split(/\s+/).length > 1;
    });

    if (targetProfiles.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, message: 'No registered profiles with multi-word full names found.' });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    const emailPromises = targetProfiles.map(async (p) => {
      const email = p.email || '';
      const originalName = p.full_name || '';
      // Extract the first word as a guess for the given name example
      const guessedGivenName = originalName.trim().split(/\s+/)[0] || '';

      // Replace placeholders including dynamic redirect URL
      const customizedHtml = htmlTemplate
        .replace(/{NAME}/g, originalName)
        .replace(/{GIVEN_NAME}/g, guessedGivenName)
        .replace(/{EMAIL}/g, email)
        .replace(/{REDIRECT_URL}/g, redirectUrl);

      const customizedSubject = subject
        .replace(/{NAME}/g, originalName)
        .replace(/{GIVEN_NAME}/g, guessedGivenName)
        .replace(/{EMAIL}/g, email)
        .replace(/{REDIRECT_URL}/g, redirectUrl);

      try {
        const result = await sendEmail({
          to: email,
          subject: customizedSubject,
          html: customizedHtml
        });

        // Insert log record to email_confirmations_sent
        const logData = {
          recipient_email: email,
          recipient_name: originalName,
          recipient_class: 'N/A',
          recipient_section: 'N/A',
          recipient_roll: 'N/A',
          subject: customizedSubject,
          body_text: `BULK NAME ACTION NOTICE: ${customizedSubject}. (Example: ${originalName}, given name ${guessedGivenName})`,
          verified_by: adminDetails.email || 'Super Admin',
          status: result.success ? 'sent' : 'failed',
          error_message: result.success ? null : (result.error?.message || 'Failed name correction notification')
        };

        await supabaseAdmin
          .from('email_confirmations_sent')
          .insert([logData]);

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          errors.push(`Failed for ${email}: ${result.error?.message || 'Unknown delivery failure'}`);
        }
      } catch (e: any) {
        failedCount++;
        errors.push(`System error for ${email}: ${e.message}`);
        
        try {
          await supabaseAdmin
            .from('email_confirmations_sent')
            .insert([{
              recipient_email: email,
              recipient_name: originalName,
              recipient_class: 'N/A',
              recipient_section: 'N/A',
              recipient_roll: 'N/A',
              subject: customizedSubject,
              body_text: `BULK NAME ACTION NOTICE EXCEPTION: ${customizedSubject}`,
              verified_by: adminDetails.email || 'Super Admin',
              status: 'failed',
              error_message: e.message || 'Execution error during name notice email'
            }]);
        } catch (innerErr) {
          console.error('Failed to log name correction email exception:', innerErr);
        }
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      totalTargeted: targetProfiles.length,
      sentCount,
      failedCount,
      errors
    });

  } catch (error: any) {
    console.error('Bulk Name Notice execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error.' }, { status: 500 });
  }
}
