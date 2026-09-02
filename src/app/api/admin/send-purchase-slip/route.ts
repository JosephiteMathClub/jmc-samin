import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

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
    const body = await req.json();
    const { 
      recipients, 
      verifiedBy = 'Super Admin',
      documentType: globalDocType
    } = body;

    // Check if single recipient or array
    const targetList = Array.isArray(recipients) ? recipients : [body];

    if (!targetList.length || !targetList[0].recipientEmail) {
      return NextResponse.json({ error: 'Missing recipient email address' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch system default document type if not specified
    let defaultDocType: 'ticket' | 'verification_slip' = 'ticket';
    try {
      const { data: docTypeSetting } = await supabaseAdmin
        .from('system_settings')
        .select('value')
        .eq('key', 'registration_document_type')
        .maybeSingle();

      if (docTypeSetting && docTypeSetting.value) {
        defaultDocType = docTypeSetting.value === 'verification_slip' ? 'verification_slip' : 'ticket';
      }
    } catch (e) {
      console.warn("Could not query system_settings for registration_document_type:", e);
    }

    const results: { email: string; success: boolean; error?: string }[] = [];

    for (const item of targetList) {
      const email = (item.recipientEmail || item.email || item.recipient_email)?.trim();
      const name = item.recipientName || item.fullName || item.full_name || item.name || 'Member';
      const memberId = item.memberId || item.member_id || item.id || 'JMC-VERIFIED';
      const className = item.className || item.class || 'N/A';
      const section = item.section || 'N/A';
      const roll = item.roll || 'N/A';
      const trxnid = item.trxnid || 'VERIFIED';
      const events = item.events || item.selected_events || 'Josephite Math Club Event Pass';
      const school = item.school || item.institution || 'St. Joseph Higher Secondary School';
      const teamName = item.teamName || item.team_name || '';
      const teamMembers = item.teamMembers || item.team_members || [];
      const isTeam = Array.isArray(teamMembers) && teamMembers.length > 0;
      const accountCreated = !!item.accountCreated;
      const accountExists = !!item.accountExists;
      const accountPassword = item.accountPassword || item.phone || '';
      
      const docType: 'ticket' | 'verification_slip' = 
        item.documentType || globalDocType || defaultDocType;

      const isTicket = docType === 'ticket';

      if (!email) {
        results.push({ email: 'unknown', success: false, error: 'No email address' });
        continue;
      }

      // Format QR Code Payload JSON
      const qrPayload = JSON.stringify({
        id: memberId,
        member_id: memberId,
        name: name,
        class: className,
        section: section,
        roll: roll,
        trxnid: trxnid,
        events: events,
        type: isTicket ? 'event_ticket' : 'verification_slip',
        v: '1.0'
      });

      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}&color=000000&bgcolor=ffffff&margin=10`;

      const primaryColor = isTicket ? '#f59e0b' : '#10b981';
      const lightBgColor = isTicket ? '#78350f' : '#064e3b';
      const badgeTextColor = isTicket ? '#fde68a' : '#34d399';
      const badgeBorderColor = isTicket ? '#d97706' : '#059669';
      const documentTitle = isTicket ? 'OFFICIAL EVENT ENTRY TICKET' : 'OFFICIAL VERIFICATION SLIP & ENTRY PASS';
      const documentSubtitle = isTicket 
        ? 'Josephite Mathematics Championship • Intra-School Entry Pass' 
        : 'Keep this digital slip and QR code ready for event entry & item check-in';
      const badgeText = isTicket ? '🎟️ OFFICIAL TICKET PASS' : '✓ VERIFIED & APPROVED SLIP';
      const scanLabel = isTicket ? 'SCAN AT ENTRANCE / TICKET VALIDATION' : 'SCAN AT TICKET VALIDATION';

      const emailSubject = isTicket
        ? `🎟️ Official Event Entry Ticket [ID: ${memberId}] - Josephite Math Club`
        : `📄 Official Verification Slip & Event Pass [ID: ${memberId}] - Josephite Math Club`;

      const logSubject = isTicket
        ? `Official Event Entry Ticket [ID: ${memberId}]`
        : `Official Verification Slip & Event Pass [ID: ${memberId}]`;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #09090b; color: #f4f4f5; border-radius: 20px; border: 1px solid #27272a;">
          
          <!-- Header Banner -->
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #27272a;">
            <p style="color: ${primaryColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 6px 0;">Josephite Math Club</p>
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">${documentTitle}</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin: 6px 0 0 0;">${documentSubtitle}</p>
          </div>

          <!-- Main Slip Card -->
          <div style="margin: 24px 0; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 24px; position: relative;">
            
            <!-- Status Badge -->
            <div style="text-align: right; margin-bottom: 16px;">
              <span style="display: inline-block; background-color: ${lightBgColor}; color: ${badgeTextColor}; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 9999px; border: 1px solid ${badgeBorderColor}; text-transform: uppercase; letter-spacing: 0.08em;">
                ${badgeText}
              </span>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding-right: 16px;">
                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Registrant Full Name</p>
                    <p style="font-size: 18px; color: #ffffff; font-weight: 800; margin: 0;">${name}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Unique Member / Entry ID</p>
                    <p style="font-size: 16px; color: ${primaryColor}; font-weight: 900; font-family: monospace; margin: 0;">${memberId}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Academic Details</p>
                    <p style="font-size: 13px; color: #e4e4e7; margin: 0;">Class <strong>${className}</strong> • Sec <strong>${section}</strong> • Roll <strong>${roll}</strong></p>
                    <p style="font-size: 11px; color: #a1a1aa; margin: 2px 0 0 0;">${school}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Transaction Ledger ID</p>
                    <p style="font-size: 12px; color: #a1a1aa; font-family: monospace; margin: 0;">${trxnid}</p>
                  </div>
                </td>

                <!-- QR Code Box -->
                <td style="width: 170px; text-align: center; vertical-align: top; background-color: #ffffff; padding: 12px; border-radius: 12px;">
                  <img src="${qrImageUrl}" alt="Validation QR Code" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                  <p style="color: #09090b; font-size: 9px; font-weight: 800; font-family: monospace; margin: 8px 0 0 0; letter-spacing: 0.05em;">${memberId}</p>
                  <p style="color: #52525b; font-size: 8px; font-weight: 600; margin: 2px 0 0 0;">${scanLabel}</p>
                </td>
              </tr>
            </table>

            <!-- Events List -->
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #3f3f46;">
              <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0;">Registered Event Segments</p>
              <div style="background-color: #09090b; padding: 10px 14px; border-radius: 8px; border: 1px solid #27272a; font-size: 12px; color: #e4e4e7; font-weight: 600;">
                ${events}
              </div>
            </div>

            ${isTeam && teamMembers && teamMembers.length > 0 ? `
              <!-- Team Event Roster -->
              <div style="margin-top: 16px; background-color: #09090b; padding: 14px; border-radius: 12px; border: 1px solid #3f3f46;">
                <div style="margin-bottom: 8px;">
                  <span style="font-size: 11px; color: #f59e0b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">👥 Team Event Roster ${teamName ? `• Team: ${teamName}` : ''}</span>
                </div>
                <p style="font-size: 10px; color: #a1a1aa; margin: 0 0 8px 0;">Participating in team segment(s): <strong>${events}</strong></p>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px; color: #e4e4e7;">
                  ${teamMembers.map((m: any, idx: number) => `
                    <tr style="border-bottom: 1px solid #27272a;">
                      <td style="padding: 6px 4px; color: #a1a1aa; font-size: 10px; width: 120px;">
                        ${idx === 0 ? '👑 Team Captain' : `• Member ${idx + 1}`}
                      </td>
                      <td style="padding: 6px 4px; font-weight: 700; color: #ffffff;">${m.name || 'Member'}</td>
                      <td style="padding: 6px 4px; color: #a1a1aa; font-size: 11px;">${m.class ? `Class ${m.class}` : ''} ${m.institute ? `• ${m.institute}` : ''}</td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            ` : ''}

            ${accountCreated ? `
              <!-- Account Created Notice -->
              <div style="margin-top: 16px; background-color: #064e3b; padding: 14px; border-radius: 12px; border: 1px solid #059669; color: #ecfdf5;">
                <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #34d399; text-transform: uppercase;">
                  🔐 Your Member Portal Account has been automatically created!
                </p>
                <p style="margin: 0 0 8px 0; font-size: 11px; color: #d1fae5;">
                  You can log into your personal profile at any time to view your registered events, access your digital entry pass & verification slip, and track results:
                </p>
                <table style="font-size: 12px; color: #ffffff; width: 100%;">
                  <tr><td style="color: #a7f3d0; font-weight: 700; width: 130px; padding: 3px 0;">Login Email / Phone:</td><td><strong>${email}</strong> or <strong>${accountPassword}</strong></td></tr>
                  <tr><td style="color: #a7f3d0; font-weight: 700; width: 130px; padding: 3px 0;">Password:</td><td><strong>${accountPassword}</strong> (Your Phone Number)</td></tr>
                </table>
              </div>
            ` : accountExists ? `
              <!-- Account Connected Notice -->
              <div style="margin-top: 16px; background-color: #1e1b4b; padding: 12px 14px; border-radius: 12px; border: 1px solid #4338ca; color: #e0e7ff;">
                <p style="margin: 0; font-size: 11px; color: #c7d2fe;">
                  ✅ <strong>Forwarded to your registered account:</strong> This verification slip has been automatically synced to your existing Josephite profile. Log in anytime to access and download it.
                </p>
              </div>
            ` : ''}

            <!-- Perks Checklist -->
            <div style="margin-top: 16px; background-color: #09090b; padding: 12px 14px; border-radius: 8px; border: 1px solid #27272a;">
              <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 8px 0;">Entitlements included with this pass</p>
              <table style="width: 100%; font-size: 11px; color: #a1a1aa;">
                <tr>
                  <td style="padding: 2px 0;">✓ Event Entry & Participation</td>
                  <td style="padding: 2px 0;">✓ Snacks Token</td>
                  <td style="padding: 2px 0;">✓ Souvenir Gift</td>
                </tr>
              </table>
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">This pass was dispatched by the <strong>Josephite Math Club Executive Committee</strong>.</p>
            <p style="margin: 0; font-size: 10px;">Verified by: ${verifiedBy} • System Ref: ${Date.now()}</p>
          </div>

        </div>
      `;

      try {
        const sendRes = await sendEmail({
          to: email,
          subject: emailSubject,
          html: htmlContent
        });

        if (sendRes.success) {
          // Log email send
          try {
            await supabaseAdmin.from('email_confirmations_sent').insert([{
              recipient_email: email,
              recipient_name: name,
              recipient_class: String(className),
              recipient_section: String(section),
              recipient_roll: String(roll),
              subject: logSubject,
              body_text: `${logSubject} sent for ${name} (${memberId}). Events: ${events}`,
              verified_by: verifiedBy,
              status: 'sent'
            }]);
          } catch (logErr) {
            console.warn("Failed to log purchase slip email dispatch:", logErr);
          }

          results.push({ email, success: true });
        } else {
          results.push({ email, success: false, error: sendRes.error?.message || 'Email dispatch failed' });
        }
      } catch (err: any) {
        results.push({ email, success: false, error: err.message || 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${successCount} of ${targetList.length} passes`,
      results
    });
  } catch (err: any) {
    console.error("Send Purchase Slip API error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
