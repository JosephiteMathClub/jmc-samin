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

const ADMIN_EMAILS = [
  'admin@josephite.club',
  'superadmin@josephite.club',
  'president@josephite.club',
  'moderator@josephite.club'
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      className,
      section = 'N/A',
      roll = 'N/A',
      school,
      category = 'Secondary',
      selectedEvents = [],
      teamName,
      teamMembers,
      verifiedBy = 'Admin',
      verifiedByName,
      verifiedByEmail,
      documentType = 'verification_slip'
    } = body;

    const cleanName = (fullName || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();
    const cleanClass = (className || '').trim();
    const cleanSection = (section || 'N/A').trim();
    const cleanRoll = (roll || 'N/A').trim();
    const cleanInstitute = (school || 'St. Joseph Higher Secondary School').trim();
    const cleanTeamName = (teamName || '').trim();
    const isTeamEvent = Array.isArray(teamMembers) && teamMembers.length > 0;

    if (!cleanName || !cleanEmail || !cleanPhone) {
      return NextResponse.json({ error: 'Full name, valid email, and phone number are required.' }, { status: 400 });
    }

    if (!Array.isArray(selectedEvents) || selectedEvents.length === 0) {
      return NextResponse.json({ error: 'At least one event segment must be selected.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Generate unique 5-digit spot ID
    const rawDigits = Math.floor(10000 + Math.random() * 90000).toString();
    const autoSpotId = rawDigits;
    const spotTicketId = `spot-${autoSpotId}`;
    const spotTrxnId = `SPOT-TICKET-${autoSpotId}`;

    // 2. CHECK IF ACCOUNT ALREADY EXISTS IN THE DATABASE
    // We check:
    // A) profiles table by email or phone
    // B) member table by email, email_address, or phone
    // C) ec_member table by email or phone
    // D) Supabase auth users
    let existingUserId: string | null = null;
    let existingUserEmail: string | null = null;
    let accountExists = false;
    let accountCreated = false;

    const rawPhone = cleanPhone.replace(/\D/g, '');
    const last10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const phoneVariants = Array.from(new Set([
      cleanPhone,
      rawPhone,
      last10,
      `0${last10}`,
      `+880${last10}`,
      `880${last10}`
    ])).filter(Boolean);

    // A. Check profiles table
    const profilePhoneOrs = phoneVariants.map(v => `phone.eq.${v}`).join(',');
    const { data: matchedProfiles } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email, phone')
      .or(`email.ilike.${cleanEmail},${profilePhoneOrs}`);

    if (matchedProfiles && matchedProfiles.length > 0) {
      existingUserId = matchedProfiles[0].id;
      existingUserEmail = matchedProfiles[0].email || cleanEmail;
      accountExists = true;
    }

    // B. Check member table if not found yet
    if (!existingUserId) {
      const memberOrs = [
        `email.ilike.${cleanEmail}`,
        `email_address.ilike.${cleanEmail}`,
        ...phoneVariants.map(v => `phone.eq.${v}`)
      ].join(',');

      const { data: matchedMembers } = await supabaseAdmin
        .from('member')
        .select('id, full_name, email, email_address, phone')
        .or(memberOrs);

      if (matchedMembers && matchedMembers.length > 0) {
        existingUserId = matchedMembers[0].id;
        existingUserEmail = matchedMembers[0].email || matchedMembers[0].email_address || cleanEmail;
        accountExists = true;
      }
    }

    // C. Check ec_member table if not found yet
    if (!existingUserId) {
      const ecOrs = [
        `email.ilike.${cleanEmail}`,
        ...phoneVariants.map(v => `phone.eq.${v}`)
      ].join(',');

      const { data: matchedEcs } = await supabaseAdmin
        .from('ec_member')
        .select('id, full_name, email, phone')
        .or(ecOrs);

      if (matchedEcs && matchedEcs.length > 0) {
        existingUserId = matchedEcs[0].id;
        existingUserEmail = matchedEcs[0].email || cleanEmail;
        accountExists = true;
      }
    }

    let finalUserId = existingUserId;

    // 3. IF NO ACCOUNT EXISTS, CREATE A NEW ACCOUNT USING EMAIL & PHONE AS PASSWORD
    // For team event: ONLY team captain's account is created (the registrant).
    if (!finalUserId) {
      try {
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: cleanEmail,
          password: cleanPhone, // Phone number as password!
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: cleanName,
            phone: cleanPhone,
            real_email: cleanEmail,
            role: 'member',
            is_spot_registered: true
          }
        });

        if (createError) {
          console.warn('createUser with real email warning:', createError.message);
          // If email is already in auth.users under another case, attempt finding or fallback
          if (createError.message?.toLowerCase().includes('already') || createError.message?.toLowerCase().includes('exists')) {
            // Find existing user in auth
            try {
              const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
              const found = authUsers?.users?.find(u => 
                u.email?.toLowerCase() === cleanEmail.toLowerCase() || 
                u.user_metadata?.phone === cleanPhone ||
                u.user_metadata?.real_email?.toLowerCase() === cleanEmail.toLowerCase()
              );
              if (found) {
                finalUserId = found.id;
                accountExists = true;
              }
            } catch (listErr) {
              console.warn("Could not list users to resolve existing user:", listErr);
            }
          }
          
          // If still no user id, try virtual email fallback
          if (!finalUserId) {
            const slug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '') || 'member';
            const virtualEmail = `${slug}_${autoSpotId}@josephitre.club`;
            const { data: fallbackUser, error: fallbackError } = await supabaseAdmin.auth.admin.createUser({
              email: virtualEmail,
              password: cleanPhone,
              email_confirm: true,
              user_metadata: {
                full_name: cleanName,
                phone: cleanPhone,
                real_email: cleanEmail,
                role: 'member',
                is_spot_registered: true
              }
            });

            if (fallbackError) {
              console.error("Fallback createUser failed:", fallbackError);
            } else if (fallbackUser?.user) {
              finalUserId = fallbackUser.user.id;
              accountCreated = true;
            }
          }
        } else if (newUser?.user) {
          finalUserId = newUser.user.id;
          accountCreated = true;
        }

        // Upsert into profiles table
        if (finalUserId) {
          await supabaseAdmin
            .from('profiles')
            .upsert({
              id: finalUserId,
              full_name: cleanName,
              email: cleanEmail,
              phone: cleanPhone,
              role: 'member'
            }, { onConflict: 'id' });

          // Also insert into member table for full club member sync
          await supabaseAdmin
            .from('member')
            .upsert({
              id: finalUserId,
              full_name: cleanName,
              email: cleanEmail,
              email_address: cleanEmail,
              phone: cleanPhone,
              class: cleanClass,
              section: cleanSection,
              roll: cleanRoll,
              institution: cleanInstitute,
              member_id: autoSpotId,
              verified: 'yes'
            }, { onConflict: 'id' });
        }
      } catch (authErr) {
        console.error("Error creating new account for registrant:", authErr);
      }
    }

    // 4. PREPARE EVENT RECORD AND SYNC TO TARGET CATEGORY TABLE
    let targetTable = 'secondary_events';
    if (category === 'Primary') targetTable = 'primary_events';
    else if (category === 'Junior') targetTable = 'junior_events';
    else if (category === 'Secondary') targetTable = 'secondary_events';
    else if (category === 'Higher Secondary') targetTable = 'higher_secondary_events';

    const eventsSummary = selectedEvents.join(', ') + 
      (isTeamEvent && cleanTeamName ? ` [Team: ${cleanTeamName}]` : '');

    const eventRecord: any = {
      user_id: finalUserId || null,
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      bkash_number: cleanPhone,
      class: cleanClass,
      section: cleanSection,
      roll: cleanRoll,
      school: cleanInstitute,
      selected_events: selectedEvents.join(', '),
      trxnid: spotTrxnId,
      member_id: `SPOT-${autoSpotId}`,
      verified: 'yes',
      verified_by: verifiedByEmail || verifiedBy || 'Admin',
      team_name: isTeamEvent ? (cleanTeamName || null) : null,
      team_members: isTeamEvent ? teamMembers : null
    };

    try {
      await supabaseAdmin.from(targetTable).insert(eventRecord);
    } catch (insertErr) {
      console.warn(`Could not insert into ${targetTable}:`, insertErr);
    }

    // 5. SYNC TICKET TO SITE_CONTENT (ticket_purchases)
    const newSpotPurchase: any = {
      id: spotTicketId,
      userId: finalUserId || undefined,
      fullName: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      memberId: autoSpotId,
      class: cleanClass,
      section: cleanSection,
      roll: cleanRoll,
      school: cleanInstitute,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: verifiedByEmail || verifiedBy || 'Admin',
      confirmedByName: verifiedByName,
      confirmedByEmail: verifiedByEmail,
      validated: false,
      snacks: false,
      certificate: false,
      souvenir: false,
      candidateType: 'spot',
      category: category,
      eventsList: selectedEvents,
      teamName: isTeamEvent ? (cleanTeamName || undefined) : undefined,
      teamMembers: isTeamEvent ? teamMembers : undefined,
      accountExists: accountExists,
      accountCreated: accountCreated
    };

    try {
      const { data: existingContent } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'ticket_purchases')
        .maybeSingle();

      const spotTickets = existingContent?.data?.spotTickets || {};
      spotTickets[autoSpotId] = newSpotPurchase;

      await supabaseAdmin
        .from('site_content')
        .upsert({
          id: 'ticket_purchases',
          data: {
            ...(existingContent?.data || {}),
            spotTickets: spotTickets,
            lastUpdated: new Date().toISOString()
          }
        }, { onConflict: 'id' });
    } catch (scErr) {
      console.warn("Could not sync ticket to site_content:", scErr);
    }

    // 6. DISPATCH OFFICIAL VERIFICATION SLIP / EVENT TICKET EMAIL
    let emailDispatched = false;
    let emailError: string | null = null;
    try {
      const emailPayload = {
        recipientEmail: cleanEmail,
        recipientName: cleanName,
        memberId: `SPOT-${autoSpotId}`,
        className: cleanClass,
        section: cleanSection,
        roll: cleanRoll,
        school: cleanInstitute,
        trxnid: spotTrxnId,
        events: eventsSummary,
        phone: cleanPhone,
        teamName: cleanTeamName,
        teamMembers: isTeamEvent ? teamMembers : undefined,
        accountExists: accountExists,
        accountCreated: accountCreated,
        accountPassword: cleanPhone,
        documentType: documentType,
        verifiedBy: verifiedBy
      };

      // Call our internal send-purchase-slip helper directly or via fetch
      const isTicket = documentType === 'ticket';
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
        ? `🎟️ Official Event Entry Ticket [ID: SPOT-${autoSpotId}] - Josephite Math Club`
        : `📄 Official Verification Slip & Event Pass [ID: SPOT-${autoSpotId}] - Josephite Math Club`;

      // QR Payload
      const qrPayload = JSON.stringify({
        id: `SPOT-${autoSpotId}`,
        member_id: `SPOT-${autoSpotId}`,
        name: cleanName,
        class: cleanClass,
        section: cleanSection,
        roll: cleanRoll,
        trxnid: spotTrxnId,
        events: eventsSummary,
        type: isTicket ? 'event_ticket' : 'verification_slip',
        v: '1.0'
      });

      const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}&color=000000&bgcolor=ffffff&margin=10`;

      // Build Team Members HTML Section if team event
      let teamHtml = '';
      if (isTeamEvent && teamMembers && teamMembers.length > 0) {
        teamHtml = `
          <div style="margin-top: 16px; background-color: #09090b; padding: 14px; border-radius: 12px; border: 1px solid #3f3f46;">
            <div style="margin-bottom: 8px;">
              <span style="font-size: 11px; color: #f59e0b; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em;">👥 Team Event Roster ${cleanTeamName ? `• Team: ${cleanTeamName}` : ''}</span>
            </div>
            <p style="font-size: 10px; color: #a1a1aa; margin: 0 0 8px 0;">Participating in team segment(s): <strong>${selectedEvents.join(', ')}</strong></p>
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
        `;
      }

      // Build Account Information Box
      let accountInfoHtml = '';
      if (accountCreated) {
        accountInfoHtml = `
          <div style="margin-top: 16px; background-color: #064e3b; padding: 14px; border-radius: 12px; border: 1px solid #059669; color: #ecfdf5;">
            <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #34d399; text-transform: uppercase;">
              🔐 Your Member Portal Account has been automatically created!
            </p>
            <p style="margin: 0 0 8px 0; font-size: 11px; color: #d1fae5;">
              You can log into your account at any time to view your verification slip, access your entry ticket, and check results:
            </p>
            <table style="font-size: 12px; color: #ffffff; width: 100%;">
              <tr><td style="color: #a7f3d0; font-weight: 700; width: 130px; padding: 3px 0;">Login Email / Phone:</td><td><strong>${cleanEmail}</strong> or <strong>${cleanPhone}</strong></td></tr>
              <tr><td style="color: #a7f3d0; font-weight: 700; width: 130px; padding: 3px 0;">Password:</td><td><strong>${cleanPhone}</strong> (Your Phone Number)</td></tr>
            </table>
          </div>
        `;
      } else if (accountExists) {
        accountInfoHtml = `
          <div style="margin-top: 16px; background-color: #1e1b4b; padding: 12px 14px; border-radius: 12px; border: 1px solid #4338ca; color: #e0e7ff;">
            <p style="margin: 0; font-size: 11px; color: #c7d2fe;">
              ✅ <strong>Forwarded to your registered account:</strong> This verification slip has been automatically linked to your existing Josephite profile. Log in anytime to access and download it.
            </p>
          </div>
        `;
      }

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
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">${isTeamEvent ? "Team Captain's Name" : "Registrant Full Name"}</p>
                    <p style="font-size: 18px; color: #ffffff; font-weight: 800; margin: 0;">${cleanName}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Unique Spot Ticket ID</p>
                    <p style="font-size: 16px; color: ${primaryColor}; font-weight: 900; font-family: monospace; margin: 0;">SPOT-${autoSpotId}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Academic Details</p>
                    <p style="font-size: 13px; color: #e4e4e7; margin: 0;">Class <strong>${cleanClass}</strong> • Sec <strong>${cleanSection}</strong> • Roll <strong>${cleanRoll}</strong></p>
                    <p style="font-size: 11px; color: #a1a1aa; margin: 2px 0 0 0;">${cleanInstitute}</p>
                  </div>

                  <div style="margin-bottom: 14px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Transaction Ledger ID</p>
                    <p style="font-size: 12px; color: #a1a1aa; font-family: monospace; margin: 0;">${spotTrxnId}</p>
                  </div>
                </td>

                <!-- QR Code Box -->
                <td style="width: 170px; text-align: center; vertical-align: top; background-color: #ffffff; padding: 12px; border-radius: 12px;">
                  <img src="${qrImageUrl}" alt="Validation QR Code" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                  <p style="color: #09090b; font-size: 9px; font-weight: 800; font-family: monospace; margin: 8px 0 0 0; letter-spacing: 0.05em;">SPOT-${autoSpotId}</p>
                  <p style="color: #52525b; font-size: 8px; font-weight: 600; margin: 2px 0 0 0;">${scanLabel}</p>
                </td>
              </tr>
            </table>

            <!-- Events List -->
            <div style="margin-top: 16px; padding-top: 16px; border-top: 1px dashed #3f3f46;">
              <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0;">Registered Event Segments</p>
              <div style="background-color: #09090b; padding: 10px 14px; border-radius: 8px; border: 1px solid #27272a; font-size: 12px; color: #e4e4e7; font-weight: 600;">
                ${eventsSummary}
              </div>
            </div>

            <!-- Team Event Roster -->
            ${teamHtml}

            <!-- Account Credentials Box -->
            ${accountInfoHtml}

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
            <p style="margin: 0 0 4px 0;">This pass was issued by the <strong>Josephite Math Club Executive Committee</strong>.</p>
            <p style="margin: 0; font-size: 10px;">Authorized by: ${verifiedBy} • Reference: ${Date.now()}</p>
          </div>

        </div>
      `;

      const sendRes = await sendEmail({
        to: cleanEmail,
        subject: emailSubject,
        html: htmlContent
      });

      if (sendRes.success) {
        emailDispatched = true;
      } else {
        emailError = sendRes.error?.message || 'Email delivery failed';
      }
    } catch (mailErr: any) {
      console.warn("Could not dispatch spot ticket email:", mailErr);
      emailError = mailErr.message;
    }

    return NextResponse.json({
      success: true,
      message: accountCreated 
        ? `Spot Ticket registered & new account created for ${cleanName}! Password set to phone number (${cleanPhone}). Verification slip emailed to ${cleanEmail}.`
        : `Spot Ticket registered & linked to existing account for ${cleanName}! Verification slip forwarded to profile and emailed to ${cleanEmail}.`,
      accountExists,
      accountCreated,
      userId: finalUserId,
      memberId: autoSpotId,
      ticketId: spotTicketId,
      emailDispatched,
      emailError,
      purchase: newSpotPurchase,
      candidate: {
        id: spotTicketId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        memberId: autoSpotId,
        class: cleanClass,
        section: cleanSection,
        roll: cleanRoll,
        school: cleanInstitute,
        candidateType: 'spot',
        eventsList: selectedEvents,
        teamName: isTeamEvent ? (cleanTeamName || undefined) : undefined,
        teamMembers: isTeamEvent ? teamMembers : undefined,
        category: category
      }
    });
  } catch (err: any) {
    console.error("Spot Register Ticket API error:", err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
