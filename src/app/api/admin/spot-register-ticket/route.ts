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
      documentType = 'verification_slip',
      autoValidate = true
    } = body;

    const shouldAutoValidate = Boolean(autoValidate);

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
      validated: shouldAutoValidate,
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

    // 5.1 STORE IN SUPABASE TABLE: spot_ticket_participants
    const currentAcademicYear = `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`;
    const spotTicketFee = Number(body.amount || body.ticketFee || 0);

    const isUuid = (str: any) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const safeUserId = isUuid(finalUserId) ? finalUserId : null;

    const spotParticipantRecord = {
      ticket_id: `SPOT-${autoSpotId}`,
      user_id: safeUserId,
      full_name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      academic_class: cleanClass || 'N/A',
      section: cleanSection || 'N/A',
      roll: cleanRoll || 'Spot Reg',
      school: cleanInstitute || 'St. Joseph Higher Secondary School',
      category: category || 'Secondary',
      selected_events: eventsSummary,
      is_team: isTeamEvent,
      team_name: isTeamEvent ? (cleanTeamName || null) : null,
      team_members: isTeamEvent ? (teamMembers || []) : [],
      amount: spotTicketFee,
      trxnid: spotTrxnId,
      payment_method: 'cash',
      verified: 'yes',
      verified_by: verifiedBy || 'Admin',
      verified_by_name: verifiedByName || 'Admin',
      verified_by_email: verifiedByEmail || null,
      validated: shouldAutoValidate,
      snacks_collected: false,
      certificate_collected: false,
      souvenir_collected: false,
      academic_year: currentAcademicYear,
      metadata: {
        registered_at: new Date().toISOString(),
        document_type: documentType,
        account_exists: accountExists,
        account_created: accountCreated,
        events_list: selectedEvents
      },
      updated_at: new Date().toISOString()
    };

    try {
      const { data: spotInsertData, error: spotTableErr } = await supabaseAdmin
        .from('spot_ticket_participants')
        .upsert(spotParticipantRecord, { onConflict: 'ticket_id' })
        .select();

      if (spotTableErr) {
        console.warn('Could not insert into spot_ticket_participants table:', spotTableErr.message);
      } else {
        console.log(`Successfully stored SPOT-${autoSpotId} into spot_ticket_participants table:`, spotInsertData);
      }
    } catch (spotTblErr) {
      console.warn('Catch inserting into spot_ticket_participants:', spotTblErr);
    }

    // 5.2 STORE IN UPDATING HISTORY OF PARTICIPANTS EMAIL (previous_year_participants)
    try {
      // 1. Store main registrant
      const historyMainRecord = {
        original_id: `SPOT-${autoSpotId}`,
        user_id: safeUserId,
        full_name: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        bkash_number: cleanPhone,
        academic_class: cleanClass || null,
        section: cleanSection || null,
        roll: cleanRoll || null,
        school: cleanInstitute || null,
        source_table: 'spot_registration',
        selected_events: eventsSummary,
        trxnid: spotTrxnId,
        amount: spotTicketFee,
        academic_year: currentAcademicYear,
        verified: 'yes',
        metadata: {
          registered_from: 'spot_ticket_counter',
          ticket_id: `SPOT-${autoSpotId}`,
          is_team: isTeamEvent,
          team_name: isTeamEvent ? cleanTeamName : null,
          verified_by: verifiedByEmail || verifiedBy || 'Admin',
          registered_at: new Date().toISOString()
        }
      };

      const { data: existingHist } = await supabaseAdmin
        .from('previous_year_participants')
        .select('id')
        .eq('original_id', `SPOT-${autoSpotId}`)
        .maybeSingle();

      if (existingHist?.id) {
        await supabaseAdmin
          .from('previous_year_participants')
          .update(historyMainRecord)
          .eq('id', existingHist.id);
      } else {
        await supabaseAdmin
          .from('previous_year_participants')
          .insert(historyMainRecord);
      }

      // 2. If team event, also store individual team members into previous_year_participants
      if (isTeamEvent && Array.isArray(teamMembers) && teamMembers.length > 0) {
        for (let tmIdx = 0; tmIdx < teamMembers.length; tmIdx++) {
          const tm = teamMembers[tmIdx];
          const tmName = (tm.name || tm.fullName || '').trim();
          const tmEmail = (tm.email || '').trim().toLowerCase();
          const tmPhone = (tm.phone || '').trim();

          if (tmName || tmEmail || tmPhone) {
            const tmOriginalId = `SPOT-${autoSpotId}-TM${tmIdx + 1}`;
            const tmHistRecord = {
              original_id: tmOriginalId,
              user_id: null,
              full_name: tmName ? `${tmName} [Team: ${cleanTeamName || 'Member'}]` : `Team Member [Team: ${cleanTeamName}]`,
              email: tmEmail || cleanEmail,
              phone: tmPhone || cleanPhone,
              bkash_number: null,
              academic_class: tm.class || tm.className || cleanClass || null,
              section: tm.section || cleanSection || null,
              roll: tm.roll || null,
              school: tm.school || cleanInstitute || null,
              source_table: 'spot_registration',
              selected_events: `${selectedEvents.join(', ')} [Team: ${cleanTeamName}]`,
              trxnid: spotTrxnId,
              amount: 0,
              academic_year: currentAcademicYear,
              verified: 'yes',
              metadata: {
                registered_from: 'spot_ticket_team_member',
                ticket_id: `SPOT-${autoSpotId}`,
                team_name: cleanTeamName,
                captain_name: cleanName,
                captain_email: cleanEmail,
                registered_at: new Date().toISOString()
              }
            };

            const { data: exTm } = await supabaseAdmin
              .from('previous_year_participants')
              .select('id')
              .eq('original_id', tmOriginalId)
              .maybeSingle();

            if (exTm?.id) {
              await supabaseAdmin
                .from('previous_year_participants')
                .update(tmHistRecord)
                .eq('id', exTm.id);
            } else {
              await supabaseAdmin
                .from('previous_year_participants')
                .insert(tmHistRecord);
            }
          }
        }
      }
    } catch (historyErr) {
      console.warn('Could not store in previous_year_participants:', historyErr);
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
      const documentTitle = isTicket ? 'OFFICIAL EVENT ENTRY TICKET (ONLINE COPY)' : 'OFFICIAL VERIFICATION SLIP & ENTRY PASS (ONLINE COPY)';
      const documentSubtitle = isTicket 
        ? 'Josephite Mathematics Championship • Intra-School Entry Pass • Official Online Copy' 
        : 'Josephite Mathematics Championship • Official Verification Slip & Entry Pass • Online Copy';
      const badgeText = isTicket ? '🎟️ OFFICIAL TICKET (ONLINE COPY)' : '✓ VERIFIED ON SPOT • ONLINE COPY';
      const scanLabel = isTicket ? 'SCAN AT ENTRANCE / TICKET VALIDATION' : 'SCAN AT TICKET VALIDATION / CHECK-IN';

      // Base application URL for online copy portal access
      let appBaseUrl = 'https://jmc-sjs.org';
      if (process.env.NEXT_PUBLIC_APP_URL && process.env.NEXT_PUBLIC_APP_URL.trim() !== '') {
        const envUrl = process.env.NEXT_PUBLIC_APP_URL.trim();
        appBaseUrl = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;
      } else {
        const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
        if (host) {
          const proto = req.headers.get('x-forwarded-proto') || 'https';
          appBaseUrl = `${proto}://${host}`;
        }
      }
      appBaseUrl = appBaseUrl.replace(/\/$/, '');
      const profileLink = `${appBaseUrl}/profile`;

      const emailSubject = isTicket
        ? `🎟️ Official Event Entry Ticket (Online Copy) [ID: SPOT-${autoSpotId}] - Josephite Math Club`
        : `📄 Official Verification Slip (Online Copy) [ID: SPOT-${autoSpotId}] - Josephite Math Club`;

      // Scannable Online Copy QR Payload
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
        copy: 'online_copy',
        verified: true,
        issued_at: new Date().toISOString(),
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
      const accountInfoHtml = `
        <div style="margin-top: 16px; background-color: #064e3b; padding: 14px 16px; border-radius: 12px; border: 1px solid #059669; color: #ecfdf5;">
          <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 800; color: #34d399; text-transform: uppercase; letter-spacing: 0.05em;">
            🔐 Participant Portal Login & Account Access
          </p>
          <p style="margin: 0 0 10px 0; font-size: 11.5px; color: #d1fae5; line-height: 1.5;">
            ${accountCreated 
              ? 'Your Member Portal Account has been automatically created! You can log in at any time using your registered credentials to view your verification slip online and access your live QR pass:' 
              : 'Your verification slip has been synchronized with your member account! You can log in at any time to view your live QR pass and championship updates:'}
          </p>
          <table style="font-size: 12px; color: #ffffff; width: 100%; border-collapse: collapse; margin-bottom: 10px;">
            <tr>
              <td style="color: #a7f3d0; font-weight: 700; width: 140px; padding: 4px 0;">Login Email:</td>
              <td><strong style="color: #ffffff;">${cleanEmail}</strong></td>
            </tr>
            <tr>
              <td style="color: #a7f3d0; font-weight: 700; width: 140px; padding: 4px 0;">Login Password:</td>
              <td><strong style="color: #ffffff;">${cleanPhone}</strong> (Your Registered Phone Number)</td>
            </tr>
          </table>
          <div style="background-color: rgba(0, 0, 0, 0.25); padding: 9px 12px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #a7f3d0; line-height: 1.45;">
            <p style="margin: 0 0 4px 0;">
              🔑 <strong>Login Note:</strong> You can log in using your registered <strong>email address</strong> and your <strong>phone number as password</strong>.
            </p>
            <p style="margin: 0; color: #6ee7b7;">
              🔄 <strong>Password Reset:</strong> You can also reset or change your password as you wish at any time by clicking <em>&quot;Forgot Password&quot;</em> on the login screen or directly from your Profile settings.
            </p>
          </div>
        </div>
      `;

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 650px; margin: 0 auto; padding: 20px; background-color: #09090b; color: #f4f4f5; border-radius: 20px; border: 1px solid #27272a;">
          
          <!-- Top Digital Online Copy Badge -->
          <div style="text-align: center; margin-bottom: 12px;">
            <span style="display: inline-block; background-color: #18181b; color: #a1a1aa; font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; border: 1px solid #27272a;">
              📄 OFFICIAL ONLINE VERIFICATION SLIP COPY
            </span>
          </div>

          <!-- Header Banner -->
          <div style="text-align: center; padding-bottom: 20px; border-bottom: 1px solid #27272a;">
            <p style="color: ${primaryColor}; font-size: 11px; font-weight: 800; letter-spacing: 0.15em; text-transform: uppercase; margin: 0 0 6px 0;">Josephite Math Club • St. Joseph Higher Secondary School</p>
            <h1 style="color: #ffffff; font-size: 22px; font-weight: 900; margin: 0; letter-spacing: -0.02em;">${documentTitle}</h1>
            <p style="color: #a1a1aa; font-size: 12px; margin: 6px 0 0 0;">${documentSubtitle}</p>
          </div>

          <!-- Main Slip Card -->
          <div style="margin: 20px 0; background-color: #18181b; border: 1px solid #3f3f46; border-radius: 16px; padding: 22px; position: relative;">
            
            <!-- Watermark & Status Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px dashed #27272a; padding-bottom: 12px;">
              <div>
                <span style="display: inline-block; background-color: ${lightBgColor}; color: ${badgeTextColor}; font-size: 10px; font-weight: 800; padding: 5px 12px; border-radius: 9999px; border: 1px solid ${badgeBorderColor}; text-transform: uppercase; letter-spacing: 0.08em;">
                  ${badgeText}
                </span>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; color: #71717a; font-family: monospace; text-transform: uppercase;">COPY: ONLINE DIGITAL</span>
              </div>
            </div>

            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="vertical-align: top; padding-right: 16px;">
                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">${isTeamEvent ? "Team Captain / Registrant" : "Registrant Full Name"}</p>
                    <p style="font-size: 18px; color: #ffffff; font-weight: 800; margin: 0;">${cleanName}</p>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Unique Spot Pass ID</p>
                    <p style="font-size: 16px; color: ${primaryColor}; font-weight: 900; font-family: monospace; margin: 0;">SPOT-${autoSpotId}</p>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Academic Information</p>
                    <p style="font-size: 13px; color: #e4e4e7; margin: 0;">Class <strong>${cleanClass}</strong> • Sec <strong>${cleanSection}</strong> • Roll <strong>${cleanRoll}</strong></p>
                    <p style="font-size: 11px; color: #a1a1aa; margin: 2px 0 0 0;">${cleanInstitute}</p>
                  </div>

                  <div style="margin-bottom: 12px;">
                    <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 2px 0;">Transaction Ledger ID</p>
                    <p style="font-size: 11px; color: #e4e4e7; font-family: monospace; margin: 0;">${spotTrxnId}</p>
                    <p style="font-size: 10px; color: #10b981; font-weight: 700; margin: 2px 0 0 0;">✓ On-Spot Cash / Desk Confirmed</p>
                  </div>
                </td>

                <!-- QR Code Box -->
                <td style="width: 170px; text-align: center; vertical-align: top; background-color: #ffffff; padding: 12px; border-radius: 12px;">
                  <img src="${qrImageUrl}" alt="Validation QR Code" style="width: 140px; height: 140px; display: block; margin: 0 auto;" />
                  <p style="color: #09090b; font-size: 9px; font-weight: 800; font-family: monospace; margin: 8px 0 0 0; letter-spacing: 0.05em;">SPOT-${autoSpotId}</p>
                  <p style="color: #52525b; font-size: 8px; font-weight: 600; margin: 2px 0 0 0;">${scanLabel}</p>
                  <div style="margin-top: 6px; padding: 2px 6px; background-color: #ecfdf5; border-radius: 4px; border: 1px solid #a7f3d0;">
                    <span style="color: #065f46; font-size: 7.5px; font-weight: 800; text-transform: uppercase;">ONLINE COPY VERIFIED</span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- Registered Events List -->
            <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed #3f3f46;">
              <p style="font-size: 10px; color: #71717a; text-transform: uppercase; font-weight: 700; margin: 0 0 6px 0;">Registered Championship Segment(s)</p>
              <div style="background-color: #09090b; padding: 10px 14px; border-radius: 8px; border: 1px solid #27272a; font-size: 12px; color: #e4e4e7; font-weight: 600;">
                ${eventsSummary}
              </div>
            </div>

            <!-- Team Event Roster -->
            ${teamHtml}

            <!-- Online Portal Direct Action Button -->
            <div style="margin-top: 18px; text-align: center; background-color: #09090b; padding: 16px; border-radius: 12px; border: 1px solid #27272a;">
              <p style="font-size: 11px; color: #a1a1aa; margin: 0 0 10px 0;">
                Access your digital slip anytime to display the dynamic QR pass or download your printable PDF:
              </p>
              <a href="${profileLink}" style="display: inline-block; background-color: ${primaryColor}; color: #09090b; text-decoration: none; font-size: 13px; font-weight: 900; padding: 12px 24px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.05em;">
                🌐 View Verification Slip Online (Live Pass)
              </a>
            </div>

            <!-- Account Credentials Box -->
            ${accountInfoHtml}

            <!-- Entitlements Checklist -->
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

            <!-- Notice on Online Copy Usage -->
            <div style="margin-top: 14px; padding: 10px 12px; background-color: rgba(255, 255, 255, 0.03); border: 1px dashed #3f3f46; border-radius: 8px; font-size: 10.5px; color: #a1a1aa; line-height: 1.5;">
              📌 <strong>Online Copy Notice:</strong> This email represents your official Online Copy of the Verification Slip. You can present this digital pass on your smartphone screen at the registration booth and event checkpoints. Physical printing is optional.
            </div>

          </div>

          <!-- Footer -->
          <div style="text-align: center; padding-top: 12px; border-top: 1px solid #27272a; font-size: 11px; color: #71717a; line-height: 1.5;">
            <p style="margin: 0 0 4px 0;">Issued by the <strong>Josephite Math Club Executive Committee</strong>.</p>
            <p style="margin: 0; font-size: 10px;">Authorized Desk Validator: ${verifiedBy} • Online Copy Issued: ${new Date().toLocaleString('en-US', { timeZone: 'Asia/Dhaka' })}</p>
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
        // Log to Supabase email_confirmations_sent table
        try {
          await supabaseAdmin.from('email_confirmations_sent').insert([{
            recipient_email: cleanEmail,
            recipient_name: cleanName,
            recipient_class: String(cleanClass),
            recipient_section: String(cleanSection),
            recipient_roll: String(cleanRoll),
            subject: emailSubject,
            body_text: `Official Verification Slip (Online Copy) dispatched for ${cleanName} (SPOT-${autoSpotId}). Events: ${eventsSummary}. Ledger: ${spotTrxnId}.`,
            verified_by: verifiedBy,
            status: 'sent'
          }]);
        } catch (logErr) {
          console.warn("Could not log spot verification slip email:", logErr);
        }

        // If team event, also dispatch the online copy to teammates if they have email addresses
        if (isTeamEvent && Array.isArray(teamMembers)) {
          for (const tm of teamMembers) {
            const tmEmail = (tm?.email || '').trim().toLowerCase();
            if (tmEmail && tmEmail !== cleanEmail && tmEmail.includes('@')) {
              try {
                await sendEmail({
                  to: tmEmail,
                  subject: isTicket
                    ? `🎟️ Official Event Entry Ticket (Online Copy) [Team: ${cleanTeamName || cleanName}, ID: SPOT-${autoSpotId}] - Josephite Math Club`
                    : `📄 Official Verification Slip (Online Copy) [Team: ${cleanTeamName || cleanName}, ID: SPOT-${autoSpotId}] - Josephite Math Club`,
                  html: htmlContent
                });
                await supabaseAdmin.from('email_confirmations_sent').insert([{
                  recipient_email: tmEmail,
                  recipient_name: tm?.name || 'Team Member',
                  recipient_class: String(tm?.class || cleanClass),
                  recipient_section: String(cleanSection),
                  recipient_roll: String(tm?.roll || 'N/A'),
                  subject: emailSubject,
                  body_text: `Official Verification Slip (Online Copy) dispatched to teammate ${tm?.name || ''} for team ${cleanTeamName || cleanName} (SPOT-${autoSpotId}).`,
                  verified_by: verifiedBy,
                  status: 'sent'
                }]);
              } catch (tmErr) {
                console.warn(`Could not dispatch teammate spot email to ${tmEmail}:`, tmErr);
              }
            }
          }
        }
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
