import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail, sendSMS, isRealEmail, hasOnlyPhone } from '@/lib/email';
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

export async function POST(req: Request) {
  try {
    const adminDetails = await getCallerSuperAdminDetails();
    if (!adminDetails.isSuper) {
      return NextResponse.json({ error: 'Unauthorized. Only Super Admins can manually send email announcements.' }, { status: 403 });
    }

    const { subject, body, targetType = 'all', individualEmail } = await req.json();

    if (!subject || !body) {
      return NextResponse.json({ error: 'Subject and Body are required.' }, { status: 400 });
    }

    if (targetType === 'individual' && (!individualEmail || !individualEmail.includes('@'))) {
      return NextResponse.json({ error: 'A valid individual email address is required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const adminEmail = adminDetails.email || 'Super Admin';
    let emailList: Array<{ email: string; name: string; class?: string; section?: string; roll?: string; phone?: string }> = [];

    if (targetType === 'individual') {
      const cleanTargetEmail = individualEmail.trim().toLowerCase();
      
      // Look up profile, member and ec_member to build the recipient list with rich metadata
      let fullName = 'Recipient';
      let rClass = '';
      let rSection = '';
      let rRoll = '';
      let rPhone = '';

      // 1. Try profiles
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('email', cleanTargetEmail)
        .maybeSingle();

      if (profile?.full_name) {
        fullName = profile.full_name;
      }

      // 2. Try member
      const { data: member } = await supabaseAdmin
        .from('member')
        .select('full_name, class, section, roll, phone')
        .or(`email.eq.${cleanTargetEmail},email_address.eq.${cleanTargetEmail}`)
        .maybeSingle();

      if (member) {
        if ((fullName === 'Recipient' || !fullName) && member.full_name) {
          fullName = member.full_name;
        }
        rClass = String(member.class || '');
        rSection = String(member.section || '');
        rRoll = String(member.roll || '');
        if (member.phone) rPhone = member.phone;
      }

      // 3. Try ec_member
      const { data: ecMember } = await supabaseAdmin
        .from('ec_member')
        .select('full_name, class, section, roll, phone')
        .or(`email.eq.${cleanTargetEmail},email_address.eq.${cleanTargetEmail}`)
        .maybeSingle();

      if (ecMember) {
        if ((fullName === 'Recipient' || !fullName) && ecMember.full_name) {
          fullName = ecMember.full_name;
        }
        if (!rClass && ecMember.class) rClass = String(ecMember.class);
        if (!rSection && ecMember.section) rSection = String(ecMember.section);
        if (!rRoll && ecMember.roll) rRoll = String(ecMember.roll);
        if (ecMember.phone && !rPhone) rPhone = ecMember.phone;
      }

      emailList = [{
        email: cleanTargetEmail,
        name: fullName,
        class: rClass,
        section: rSection,
        roll: rRoll,
        phone: rPhone
      }];
    } else {
      // Fetch all unique emails from profiles, member & ec_member tables and merge them
      const mergedMap = new Map<string, { email: string; name: string; class: string; section: string; roll: string; phone: string }>();

      // Profiles
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name');
      
      if (profiles) {
        profiles.forEach(p => {
          const email = (p.email || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            mergedMap.set(email, {
              email,
              name: (p.full_name || '').trim() || 'JMC Member',
              class: '',
              section: '',
              roll: '',
              phone: ''
            });
          }
        });
      }

      // Members
      const { data: members } = await supabaseAdmin
        .from('member')
        .select('email, email_address, full_name, class, section, roll, phone');
      
      if (members) {
        members.forEach(m => {
          const email = (m.email || m.email_address || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            const existing = mergedMap.get(email);
            mergedMap.set(email, {
              email,
              name: existing?.name && existing.name !== 'JMC Member' && existing.name !== 'Recipient'
                ? existing.name
                : ((m.full_name || '').trim() || existing?.name || 'JMC Member'),
              class: String(m.class || existing?.class || ''),
              section: String(m.section || existing?.section || ''),
              roll: String(m.roll || existing?.roll || ''),
              phone: m.phone || existing?.phone || ''
            });
          }
        });
      }

      // EC Members
      const { data: ecMembers } = await supabaseAdmin
        .from('ec_member')
        .select('email, email_address, full_name, class, section, roll, phone');
      
      if (ecMembers) {
        ecMembers.forEach(ec => {
          const email = (ec.email || ec.email_address || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            const existing = mergedMap.get(email);
            mergedMap.set(email, {
              email,
              name: existing?.name && existing.name !== 'JMC Member' && existing.name !== 'Recipient'
                ? existing.name
                : ((ec.full_name || '').trim() || existing?.name || 'JMC Member'),
              class: String(ec.class || existing?.class || ''),
              section: String(ec.section || existing?.section || ''),
              roll: String(ec.roll || existing?.roll || ''),
              phone: ec.phone || existing?.phone || ''
            });
          }
        });
      }

      emailList = Array.from(mergedMap.values());
    }

    if (emailList.length === 0) {
      return NextResponse.json({ error: 'No valid recipient email addresses found.' }, { status: 404 });
    }

    let successCount = 0;
    let failCount = 0;
    const errors: string[] = [];

    // Send emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < emailList.length; i += batchSize) {
      const batch = emailList.slice(i, i + batchSize);
      
      const results = await Promise.all(
        batch.map(async (recipient) => {
          const personalizedBody = body
            .replace(/\{\{name\}\}/gi, recipient.name || 'JMC Member')
            .replace(/\{\{email\}\}/gi, recipient.email);

          const hasRealEmail = isRealEmail(recipient.email);
          const isPhoneOnly = hasOnlyPhone(recipient.phone, recipient.email);

          if (!hasRealEmail && !isPhoneOnly) {
            return { success: false, error: 'Recipient has no valid email or phone number.' };
          }

          if (hasRealEmail) {
            const htmlContent = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
                <div style="text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 25px;">
                  <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Josephite Math Club</h1>
                  <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Official Announcement</p>
                </div>
                
                <div style="white-space: pre-wrap; font-size: 16px;">${personalizedBody}</div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p>You received this email because you are a registered member of Josephite Math Club.</p>
                  <p>&copy; ${new Date().getFullYear()} Josephite Math Club. All rights reserved.</p>
                </div>
              </div>
            `;

            try {
              const res = await sendEmail({
                to: recipient.email,
                subject: subject,
                text: personalizedBody,
                html: htmlContent,
              });

              if (res.success) {
                // Log sent announcement in email_confirmations_sent
                try {
                  await supabaseAdmin
                    .from('email_confirmations_sent')
                    .insert([{
                      recipient_email: recipient.email,
                      recipient_name: recipient.name || '',
                      recipient_class: recipient.class ? String(recipient.class) : '',
                      recipient_section: recipient.section ? String(recipient.section) : '',
                      recipient_roll: recipient.roll ? String(recipient.roll) : '',
                      subject: subject,
                      body_text: personalizedBody,
                      verified_by: adminEmail,
                      status: 'sent'
                    }]);
                } catch (dbErr) {
                  console.error('[DB] Failed to log sent manual announcement:', dbErr);
                }
                return { success: true };
              } else {
                const errMsg = res.error?.message || 'Unknown error';
                // Log failed announcement in email_confirmations_sent
                try {
                  await supabaseAdmin
                    .from('email_confirmations_sent')
                    .insert([{
                      recipient_email: recipient.email,
                      recipient_name: recipient.name || '',
                      recipient_class: recipient.class ? String(recipient.class) : '',
                      recipient_section: recipient.section ? String(recipient.section) : '',
                      recipient_roll: recipient.roll ? String(recipient.roll) : '',
                      subject: subject,
                      body_text: personalizedBody,
                      verified_by: adminEmail,
                      status: 'failed',
                      error_message: errMsg
                    }]);
                } catch (dbErr) {
                  console.error('[DB] Failed to log failed manual announcement:', dbErr);
                }
                return { success: false, error: errMsg };
              }
            } catch (err: any) {
              const errMsg = err.message || 'Unknown execution error';
              // Log fatal exception in sending process
              try {
                await supabaseAdmin
                  .from('email_confirmations_sent')
                  .insert([{
                    recipient_email: recipient.email,
                    recipient_name: recipient.name || '',
                    recipient_class: recipient.class ? String(recipient.class) : '',
                    recipient_section: recipient.section ? String(recipient.section) : '',
                    recipient_roll: recipient.roll ? String(recipient.roll) : '',
                    subject: subject,
                    body_text: personalizedBody,
                    verified_by: adminEmail,
                    status: 'failed',
                    error_message: errMsg
                  }]);
              } catch (dbErr) {
                console.error('[DB] Failed to log fatal manual announcement:', dbErr);
              }
              return { success: false, error: errMsg };
            }
          } else {
            // SMS routing for phone-only users
            const smsMessage = `Josephite Math Club - ${subject}\n\n${personalizedBody}`;
            try {
              const res = await sendSMS(recipient.phone!, smsMessage);
              if (res.success) {
                try {
                  await supabaseAdmin
                    .from('email_confirmations_sent')
                    .insert([{
                      recipient_email: recipient.email,
                      recipient_name: recipient.name || '',
                      recipient_class: recipient.class ? String(recipient.class) : '',
                      recipient_section: recipient.section ? String(recipient.section) : '',
                      recipient_roll: recipient.roll ? String(recipient.roll) : '',
                      subject: `[SMS] ${subject}`,
                      body_text: smsMessage,
                      verified_by: adminEmail,
                      status: 'sent'
                    }]);
                } catch (dbErr) {
                  console.error('[DB] Failed to log sent manual announcement SMS:', dbErr);
                }
                return { success: true };
              } else {
                const errMsg = res.error?.message || 'Unknown error';
                try {
                  await supabaseAdmin
                    .from('email_confirmations_sent')
                    .insert([{
                      recipient_email: recipient.email,
                      recipient_name: recipient.name || '',
                      recipient_class: recipient.class ? String(recipient.class) : '',
                      recipient_section: recipient.section ? String(recipient.section) : '',
                      recipient_roll: recipient.roll ? String(recipient.roll) : '',
                      subject: `[SMS] ${subject}`,
                      body_text: smsMessage,
                      verified_by: adminEmail,
                      status: 'failed',
                      error_message: errMsg
                    }]);
                } catch (dbErr) {
                  console.error('[DB] Failed to log failed manual announcement SMS:', dbErr);
                }
                return { success: false, error: errMsg };
              }
            } catch (err: any) {
              const errMsg = err.message || 'Unknown execution error';
              try {
                await supabaseAdmin
                  .from('email_confirmations_sent')
                  .insert([{
                    recipient_email: recipient.email,
                    recipient_name: recipient.name || '',
                    recipient_class: recipient.class ? String(recipient.class) : '',
                    recipient_section: recipient.section ? String(recipient.section) : '',
                    recipient_roll: recipient.roll ? String(recipient.roll) : '',
                    subject: `[SMS] ${subject}`,
                    body_text: smsMessage,
                    verified_by: adminEmail,
                    status: 'failed',
                    error_message: errMsg
                  }]);
              } catch (dbErr) {
                console.error('[DB] Failed to log fatal manual announcement SMS:', dbErr);
              }
              return { success: false, error: errMsg };
            }
          }
        })
      );

      for (const res of results) {
        if (res.success) {
          successCount++;
        } else {
          failCount++;
          if (res.error && !errors.includes(res.error)) {
            errors.push(res.error);
          }
        }
      }
    }

    if (successCount === 0 && emailList.length > 0) {
      return NextResponse.json({ 
        error: `Failed to deliver email: ${errors.join(', ') || 'Unknown email delivery / SMTP relay error.'}` 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      sentCount: successCount,
      failedCount: failCount,
      errors: errors.slice(0, 5),
    });

  } catch (err: any) {
    console.error('Unhandled internal error in manual email announcements route:', err);
    return NextResponse.json({ error: `Internal Server Error: ${err.message || err}` }, { status: 500 });
  }
}
