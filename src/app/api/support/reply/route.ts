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
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized user session' }, { status: 401 });
    }

    // Verify admin or super admin privilege
    const email = (user.email || '').toLowerCase().trim();
    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    const isSuperByEmail = SUPER_ADMINS.includes(email);
    const supabaseAdmin = getSupabaseAdmin();
    
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    const role = profile?.role?.trim().toLowerCase() || '';
    const isAuthorized = isSuperByEmail || role === 'super_admin' || role === 'admin';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Forbidden: Admins or Super Admins only' }, { status: 403 });
    }

    const { ticketId, userEmail, userName, subject, originalMessage, replyMessage, adminName, designation } = await req.json();

    if (!ticketId || !userEmail || !replyMessage) {
      return NextResponse.json({ error: 'Missing required reply details' }, { status: 400 });
    }

    // Update the database record using the admin client
    const { error: updateError } = await supabaseAdmin
      .from('support_tickets')
      .update({
        admin_reply: replyMessage,
        status: 'resolved',
        updated_at: new Date().toISOString()
      })
      .eq('id', ticketId);

    if (updateError) {
      console.error('Error updating support ticket in DB:', updateError);
      return NextResponse.json({ error: 'Failed to update ticket status in database' }, { status: 500 });
    }

    // Construct reply HTML Email with a highly professional layout
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://josephitemathclub.org';
    const finalDesignation = designation || 'Executive Committee Member';
    const finalAdminName = adminName || 'Josephite Math Club Administration';

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937; line-height: 1.6; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e5e7eb;">
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 28px; text-align: center; color: white; border-bottom: 4px solid #f59e0b;">
          <img src="https://picsum.photos/seed/mathclub/120/120" alt="JMC Seal" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid #f59e0b; margin-bottom: 8px; object-fit: cover;" />
          <h1 style="margin: 4px 0 0 0; font-size: 18px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b;">Official Resolution Notice</h1>
          <p style="margin: 4px 0 0 0; font-size: 11px; opacity: 0.8; text-transform: uppercase; letter-spacing: 0.1em;">Office of the Executive Committee • Josephite Math Club</p>
        </div>
        
        <div style="padding: 28px; background-color: #fbfbfb;">
          <p style="margin-top: 0; font-size: 14px; font-weight: bold; color: #111827;">Dear ${userName || 'Member'},</p>
          <p style="font-size: 14px; color: #4b5563;">
            We are writing to inform you that the issue you reported on our tech support platform has been fully investigated and resolved. 
            On behalf of the executive administration of the **Josephite Math Club**, we sincerely appreciate you bringing this matter to our attention.
          </p>
          
          <div style="margin: 24px 0; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="background-color: #f3f4f6; padding: 12px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #4b5563; tracking-wider; border-bottom: 1px solid #e5e7eb;">
              Reported Issue Summary
            </div>
            <div style="padding: 16px; font-size: 13px; color: #6b7280;">
              <p style="margin: 0 0 8px 0;"><strong>Subject:</strong> ${subject || 'Technical Problem'}</p>
              <p style="margin: 0;"><strong>Your Message:</strong></p>
              <blockquote style="margin: 8px 0 0 0; padding: 10px 14px; background-color: #fafafa; border-left: 3px solid #9ca3af; border-radius: 4px; font-style: italic; color: #4b5563;">
                "${originalMessage || 'N/A'}"
              </blockquote>
            </div>
          </div>

          <div style="margin: 24px 0; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.02);">
            <div style="background-color: #fef3c7; padding: 12px 16px; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #b45309; tracking-wider; border-bottom: 1px solid #fde68a;">
              Resolution & Reply
            </div>
            <div style="padding: 20px; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-line;">
${replyMessage}
            </div>
          </div>

          <p style="font-size: 14px; color: #4b5563; margin-top: 24px;">
            If you continue to experience any difficulties, please feel free to report a new problem, or reply directly to this notification. Thank you for your continued dedication to excellence within the math club community.
          </p>
          
          <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="margin: 0; font-size: 13px; font-weight: bold; color: #111827;">Sincerely,</p>
            <p style="margin: 4px 0 0 0; font-size: 14px; font-weight: 800; color: #111827;">${finalAdminName}</p>
            <p style="margin: 2px 0 0 0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #f59e0b;">${finalDesignation}</p>
            <p style="margin: 1px 0 0 0; font-size: 11px; color: #9ca3af; font-weight: bold;">Josephite Math Club Executive Committee</p>
          </div>
        </div>
        
        <div style="background-color: #0f172a; padding: 20px; text-align: center; font-size: 11px; color: #64748b;">
          <p style="margin: 0 0 4px 0;">St. Joseph Higher Secondary School</p>
          <p style="margin: 0;">97 Asad Avenue, Mohammadpur, Dhaka-1207, Bangladesh</p>
        </div>
      </div>
    `;

    // Send the email to the reporter
    const mailResult = await sendEmail({
      to: userEmail,
      subject: `[JMC Resolution] Regarding: ${subject || 'Technical Issue'}`,
      html: emailHtml,
    });

    if (!mailResult.success) {
      console.warn('DB updated, but resolution email failed to send:', mailResult.error);
      return NextResponse.json({ 
        success: true, 
        warning: 'Ticket marked resolved in DB, but email dispatch failed. Please verify your Brevo configuration.' 
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Support reply API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
