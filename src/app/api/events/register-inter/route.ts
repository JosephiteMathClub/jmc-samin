import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

// Helper to get the admin client
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

// Helper to get Table name based on Class Level input
const FREE_INTER_SEGMENTS = new Set([
  "Math Olympiad (Find-based)",
  "Math Olympiad (Proof-based)",
  "Math Memes",
  "Math Article",
  "Math Vision"
]);

function isFreeInterSegment(name: string): boolean {
  if (!name) return false;
  const norm = name.trim().toLowerCase();
  return Array.from(FREE_INTER_SEGMENTS).some(s => s.toLowerCase() === norm);
}

const getTargetTable = (cls: string): string => {
  const norm = cls.trim().toLowerCase();
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0]);
    if (val >= 3 && val <= 5) return 'primary_events';
    if (val >= 6 && val <= 8) return 'junior_events';
    if (val >= 9 && val <= 10) return 'secondary_events';
    if (val >= 11 && val <= 12) return 'higher_secondary_events';
  }
  
  if (norm.includes('xii') || norm.includes('12') || norm.includes('eleven') || norm.includes('twelve') || norm.includes('xi') || norm.includes('11')) {
    return 'higher_secondary_events';
  }
  if (norm.includes('ix') || norm.includes('9') || norm.includes('x') || norm.includes('10')) {
    return 'secondary_events';
  }
  if (norm.includes('vi') || norm.includes('6') || norm.includes('vii') || norm.includes('7') || norm.includes('viii') || norm.includes('8') || norm.includes('junior')) {
    return 'junior_events';
  }
  if (norm.includes('iii') || norm.includes('3') || norm.includes('iv') || norm.includes('4') || norm.includes('v') || norm.includes('5') || norm.includes('primary')) {
    return 'primary_events';
  }
  
  return 'junior_events';
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      gender,
      email,
      phone,
      className,
      institute,
      caCode,
      bkashNumber,
      trxnid,
      amount,
      selectedEvents,
      isProxyRegistration,
      userId,
      teammatesList
    } = body;

    if (!fullName || !gender || !email || !phone || !className || !institute || !bkashNumber || !trxnid || !selectedEvents || selectedEvents.length === 0) {
      return NextResponse.json({ error: 'All general information fields (including gender) and at least one event segment are required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const cleanInstitute = institute.trim();
    const cleanCaCode = caCode ? caCode.trim() : '';
    const targetTable = getTargetTable(className);

    const isFreeRegistration = amount === 0 || (Array.isArray(selectedEvents) && selectedEvents.length > 0 && selectedEvents.every((e: string) => isFreeInterSegment(e)));
    const isVerifiedNow = isFreeRegistration || Boolean(isProxyRegistration);

    // Initialize admin client safely
    const supabaseAdmin = getSupabaseAdmin();

    let finalUserId = null;
    let authEmail = null;
    let isNewUserCreated = false;

    if (userId) {
      finalUserId = userId;
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(userId);
        authEmail = userData?.user?.email;
      } catch (err) {
        console.error("Error fetching user by ID in API:", err);
      }
    } else {
      // Check if profile already exists with this real email
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingProfile) {
        finalUserId = existingProfile.id;
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingProfile.id);
        authEmail = userData?.user?.email;
      } else {
        // Check if a member already exists with this phone number
        const { data: existingMember } = await supabaseAdmin
          .from('member')
          .select('id, full_name, email, phone')
          .eq('phone', cleanPhone)
          .maybeSingle();

        if (existingMember) {
          finalUserId = existingMember.id;
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(existingMember.id);
          authEmail = userData?.user?.email;
        }
      }
    }

    // If no user exists, create a new virtual account for them
    if (!finalUserId) {
      // Replace spaces/special chars in given name for slug
      const nameParts = fullName.trim().split(/\s+/);
      const givenName = nameParts[0] || 'visitor';
      const slug = givenName.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Math.floor(100 + Math.random() * 900);
      const virtualEmail = `${slug}@josephite.club`;
      authEmail = virtualEmail;

      // Create user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: virtualEmail,
        password: cleanPhone,
        email_confirm: true,
        user_metadata: {
          full_name: fullName.trim(),
          real_email: cleanEmail
        }
      });

      if (createError) {
        console.error('Error creating guest user for inter-events:', createError);
        return NextResponse.json({ error: createError.message }, { status: 400 });
      }

      finalUserId = newUser.user.id;
      isNewUserCreated = true;

      // Insert/upsert into profiles table
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
          id: finalUserId,
          full_name: fullName.trim(),
          role: 'member',
          email: cleanEmail
        }, { onConflict: 'id' });

      if (profileError) {
        console.error('Error creating guest profile for inter-events:', profileError);
      }

      // Send Welcome Email
      sendEmail({
        to: cleanEmail,
        subject: 'Welcome to Josephite Math Club - Your Participant Credentials',
        html: `
          <div style="font-family: sans-serif; padding: 25px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
            <div style="text-align: center; margin-bottom: 25px;">
              <span style="font-size: 32px;">📐</span>
              <h1 style="color: #4f46e5; margin: 10px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">Josephite Math Club</h1>
              <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">National Inter-School Mathematics Championship</p>
            </div>
            
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Hello <strong>${fullName}</strong>,</p>
            <p style="font-size: 15px; line-height: 1.6; color: #334155;">Thank you for registering for the National Inter-School Mathematics Championship! An automatic profile has been initialized for you so you can track your registration status and retrieve your verified unique ID.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;">
              <h2 style="font-size: 14px; color: #4f46e5; margin: 0 0 12px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Login Credentials:</h2>
              <table style="width: 100%; font-size: 14px; color: #475569; border-collapse: collapse;">
                <tr>
                  <td style="padding: 4px 0; font-weight: 600; width: 120px;">Email / ID:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-family: monospace;">${cleanEmail}</td>
                </tr>
                <tr>
                  <td style="padding: 4px 0; font-weight: 600;">Password:</td>
                  <td style="padding: 4px 0; color: #0f172a; font-family: monospace;">${cleanPhone}</td>
                </tr>
              </table>
              <p style="margin: 12px 0 0 0; font-size: 11px; color: #64748b; font-style: italic; line-height: 1.4;">Use your real email and your registered phone number to sign in anytime at the JMC portal.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://jmc-sjs.org'}/auth?mode=login" style="background-color: #4f46e5; color: white; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);">Access Dashboard</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
            <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">This email is sent automatically from the Josephite Math Club portal.</p>
          </div>
        `,
        text: `Welcome to Josephite Math Club, ${fullName}!\n\nYour account has been created successfully.\n\nCredentials:\nEmail: ${cleanEmail}\nPassword (Phone): ${cleanPhone}\n\nSign in at: ${process.env.NEXT_PUBLIC_APP_URL || 'https://jmc-sjs.org'}/auth?mode=login`,
      }).catch(emailErr => {
        console.error('Failed to send welcome email for inter-events in background:', emailErr);
      });
    }

    // Register in member table
    let existingMemberId = '';
    const { data: memberCheckData } = await supabaseAdmin
      .from('member')
      .select('member_id')
      .eq('id', finalUserId)
      .maybeSingle();

    if (memberCheckData) {
      existingMemberId = memberCheckData.member_id || '';
      
      // Update member info
      await supabaseAdmin
        .from('member')
        .update({
          full_name: fullName,
          gender: gender,
          class: className,
          section: cleanInstitute, // store school/college
          roll: cleanCaCode, // store CA code
          phone: cleanPhone,
          email_address: cleanEmail,
          school: cleanInstitute
        })
        .eq('id', finalUserId);
    } else {
      // Generate a unique 5-digit ID
      let resolvedMemberId = '';
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 100) {
        attempts++;
        const digits = Math.floor(10000 + Math.random() * 90000).toString();
        const { data: check } = await supabaseAdmin
          .from('member')
          .select('id')
          .eq('member_id', digits)
          .maybeSingle();
        if (!check) {
          resolvedMemberId = digits;
          isUnique = true;
        }
      }
      if (!resolvedMemberId) {
        resolvedMemberId = Math.floor(10000 + Math.random() * 90000).toString();
      }
      existingMemberId = resolvedMemberId;

      const { error: memberInsertError } = await supabaseAdmin
        .from('member')
        .insert({
          id: finalUserId,
          full_name: fullName,
          gender: gender,
          email: authEmail,
          email_address: cleanEmail,
          phone: cleanPhone,
          school: cleanInstitute,
          class: className,
          section: cleanInstitute, // backup
          roll: cleanCaCode, // backup
          photo_url: '',
          payment_method: isProxyRegistration ? 'Manual (Admin)' : 'bkash',
          trxnid: trxnid,
          bkash_number: bkashNumber,
          verified: isVerifiedNow ? 'yes' : 'no',
          member_id: resolvedMemberId
        });

      if (memberInsertError) {
        console.error('Failed to auto-insert member row for inter-events:', memberInsertError);
      }
    }

    // Insert registration payload into events table
    const registrationPayload = {
      user_id: finalUserId,
      full_name: fullName,
      class: className,
      section: cleanInstitute, // maps to section in DB to avoid migration
      roll: cleanCaCode, // maps to roll in DB to avoid migration
      phone: cleanPhone,
      bkash_number: bkashNumber,
      trxnid: trxnid,
      amount: amount,
      selected_events: selectedEvents.join(', '),
      verified: isVerifiedNow ? 'yes' : 'no'
    };

    const { error: regInsertError } = await supabaseAdmin
      .from(targetTable)
      .insert([registrationPayload]);

    if (regInsertError) {
      if (regInsertError.code === '23505') {
        return NextResponse.json({ error: "This Transaction ID (TrxID) has already been submitted for verification." }, { status: 400 });
      }
      console.error('Failed to insert inter-event registration:', regInsertError);
      return NextResponse.json({ error: regInsertError.message }, { status: 500 });
    }

    // Process teammates if provided
    if (teammatesList && Array.isArray(teammatesList) && teammatesList.length > 0) {
      for (let i = 0; i < teammatesList.length; i++) {
        const tm = teammatesList[i];
        if (tm && tm.fullName && tm.fullName.trim()) {
          const tmSuffix = `-T${i + 2}`;
          const tmClass = tm.className || className;
          const tmTargetTable = getTargetTable(tmClass);
          const tmPayload = {
            user_id: null,
            full_name: tm.fullName.trim(),
            class: tmClass,
            section: (tm.institute || cleanInstitute).trim(),
            roll: cleanCaCode,
            phone: cleanPhone,
            bkash_number: bkashNumber,
            trxnid: `${trxnid}${tmSuffix}`,
            amount: 0,
            selected_events: selectedEvents.join(', '),
            verified: isVerifiedNow ? 'yes' : 'no'
          };

          const { error: tmErr } = await supabaseAdmin
            .from(tmTargetTable)
            .insert([tmPayload]);

          if (tmErr) {
            console.error(`Failed to insert teammate ${i + 2} inter registration:`, tmErr);
          }
        }
      }
    }

    // Send Registration Confirmation Email
    sendEmail({
      to: cleanEmail,
      subject: `JMC Inter-School Registration Received (TrxID: ${trxnid})`,
      html: `
        <div style="font-family: sans-serif; padding: 25px; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px; margin: 0 auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <span style="font-size: 32px;">📊</span>
            <h1 style="color: #4f46e5; margin: 10px 0 0 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase;">Registration Confirmed</h1>
            <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Josephite Math Club National Championship</p>
          </div>
          
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">Dear <strong>${fullName}</strong>,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155;">We have successfully received your registration details and payment token for the national scale inter-school events.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin: 24px 0;">
            <h2 style="font-size: 12px; color: #4f46e5; margin: 0 0 12px 0; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Participant Overview:</h2>
            <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Participant ID:</td>
                <td style="padding: 8px 0; font-family: monospace; font-weight: bold; color: #0f172a;">${existingMemberId}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Institution:</td>
                <td style="padding: 8px 0; color: #0f172a;">${cleanInstitute}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Class Level:</td>
                <td style="padding: 8px 0; color: #0f172a;">Class ${className}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Selected Segments:</td>
                <td style="padding: 8px 0; color: #4f46e5; font-weight: 600;">${selectedEvents.join(', ')}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">bKash Sender:</td>
                <td style="padding: 8px 0; color: #0f172a;">${bkashNumber}</td>
              </tr>
              <tr style="border-bottom: 1px solid #f1f5f9;">
                <td style="padding: 8px 0; font-weight: 600;">Transaction ID:</td>
                <td style="padding: 8px 0; font-family: monospace; color: #0f172a; font-weight: 600;">${trxnid}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: 600;">Paid Amount:</td>
                <td style="padding: 8px 0; color: #10b981; font-weight: bold;">${amount} BDT</td>
              </tr>
            </table>
          </div>

          <p style="font-size: 14px; line-height: 1.6; color: #334155;">Your registration is currently <strong>Pending Verification</strong>. Our administrative team will verify your transaction details shortly. Once approved, you can print your official Participant Pass directly from your profile settings on the platform.</p>
          
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 25px 0;" />
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">Need help? Reply to this email or contact us at info@jmc-sjs.org</p>
        </div>
      `,
      text: `Your registration for Inter-School Events has been received!\n\nParticipant ID: ${existingMemberId}\nInstitution: ${cleanInstitute}\nClass: ${className}\nSegments: ${selectedEvents.join(', ')}\nTrxID: ${trxnid}\nAmount: ${amount} BDT`,
    }).catch(emailErr => {
      console.error('Failed to send confirmation email for inter-events in background:', emailErr);
    });

    return NextResponse.json({
      success: true,
      memberId: existingMemberId,
      userId: finalUserId,
      isNewUserCreated
    });

  } catch (error: any) {
    console.error('Error in register-inter API endpoint:', error);
    return NextResponse.json({ error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}
