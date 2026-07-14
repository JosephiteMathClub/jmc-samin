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

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonUrl || !anonKey) {
      return NextResponse.json({ error: 'Supabase configuration is missing' }, { status: 500 });
    }

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
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    const { subject, message, error_context, user_email, user_name } = await req.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Missing subject or message' }, { status: 400 });
    }

    // Determine the list of super admin emails
    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const superAdminsList = new Set<string>([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ].map(e => e.trim().toLowerCase()).filter(Boolean));

    // Try fetching database profiles with role = 'super_admin'
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('email')
        .eq('role', 'super_admin');

      if (profiles && Array.isArray(profiles)) {
        profiles.forEach(p => {
          if (p.email) {
            superAdminsList.add(p.email.trim().toLowerCase());
          }
        });
      }
    } catch (dbErr) {
      console.warn('Could not query database profiles for super admins:', dbErr);
    }

    const finalSuperAdmins = Array.from(superAdminsList);
    if (finalSuperAdmins.length === 0) {
      // Fallback to SMTP_USER if absolutely no super admins found
      if (process.env.SMTP_USER) {
        finalSuperAdmins.push(process.env.SMTP_USER);
      } else {
        return NextResponse.json({ error: 'No super admins configured to receive email notifications' }, { status: 500 });
      }
    }

    // Format HTML email
    const errorHtml = error_context ? `
      <div style="background-color: #fef2f2; border: 1px solid #fee2e2; padding: 16px; border-radius: 8px; margin-top: 16px; font-family: sans-serif;">
        <h3 style="margin-top: 0; color: #991b1b; font-size: 14px; display: flex; align-items: center; gap: 8px;">
          🤖 Technical Context Attached
        </h3>
        <p style="margin: 6px 0; font-size: 12px; font-family: monospace;"><strong>Message:</strong> ${error_context.message || 'N/A'}</p>
        <p style="margin: 6px 0; font-size: 12px; font-family: monospace;"><strong>Location:</strong> ${error_context.url || 'N/A'}</p>
        <p style="margin: 6px 0; font-size: 12px; font-family: monospace;"><strong>Timestamp:</strong> ${error_context.timestamp || 'N/A'}</p>
        <p style="margin: 12px 0 6px 0; font-size: 12px; font-family: monospace;"><strong>Error Stack / Context:</strong></p>
        <pre style="margin: 0; padding: 12px; background: #f4f4f5; border-radius: 4px; font-size: 11px; overflow-x: auto; font-family: monospace; color: #4b5563;">${error_context.error || 'N/A'}</pre>
      </div>
    ` : '';

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://josephitemathclub.org';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 24px; text-align: center; color: white;">
          <span style="font-size: 24px;">🚨</span>
          <h1 style="margin: 8px 0 0 0; font-size: 20px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">New Issue Reported</h1>
          <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Josephite Math Club Tech Support Desk</p>
        </div>
        
        <div style="padding: 24px; background-color: #fafafa;">
          <p style="margin-top: 0; font-size: 14px; color: #4b5563;">An issue has been submitted by a member of the platform. Please find the details below:</p>
          
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; padding: 20px; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <h3 style="margin-top: 0; margin-bottom: 12px; color: #111827; font-size: 15px; font-weight: 700; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">Issue Details</h3>
            <p style="margin: 6px 0; font-size: 13px; color: #4b5563;"><strong>Reporter:</strong> ${user_name || 'N/A'}</p>
            <p style="margin: 6px 0; font-size: 13px; color: #4b5563;"><strong>Email:</strong> ${user_email || 'N/A'}</p>
            <p style="margin: 6px 0; font-size: 13px; color: #4b5563;"><strong>Subject:</strong> ${subject}</p>
            <p style="margin: 12px 0 6px 0; font-size: 13px; color: #4b5563;"><strong>Problem Statement:</strong></p>
            <blockquote style="margin: 0; padding: 14px; background: #f8fafc; border-left: 4px solid #ef4444; border-radius: 6px; font-size: 13px; font-style: italic; color: #334155;">
              "${message}"
            </blockquote>
          </div>

          ${errorHtml}

          <div style="text-align: center; margin-top: 28px;">
            <a href="${appUrl}/dashboard?tab=support" style="display: inline-block; background-color: #ef4444; color: #ffffff; text-decoration: none; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; padding: 12px 24px; border-radius: 8px; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); transition: all 0.2s;">
              Review Ticket inside Dashboard
            </a>
          </div>
        </div>
        
        <div style="background-color: #f3f4f6; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af;">
          <p style="margin: 0;">This email was automatically dispatched by the Josephite Math Club Server.</p>
        </div>
      </div>
    `;

  // Send to all super admins concurrently
  const sendPromises = finalSuperAdmins.map(adminEmail => 
    sendEmail({
      to: adminEmail,
      subject: `[JMC Support] New Issue: ${subject}`,
      html: emailHtml,
    })
  );

  const results = await Promise.all(sendPromises);
  const successCount = results.filter(r => r.success).length;

  return NextResponse.json({
    success: true,
    recipientsCount: finalSuperAdmins.length,
    successCount
  });

  } catch (error: any) {
    console.error('Support report API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
