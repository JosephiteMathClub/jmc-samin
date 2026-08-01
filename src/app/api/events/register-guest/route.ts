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
const getTargetTable = (cls: string): string => {
  const norm = cls.trim().toLowerCase();
  
  // Parse digits
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0]);
    if (val >= 3 && val <= 5) return 'primary_events';
    if (val >= 6 && val <= 8) return 'junior_events';
    if (val >= 9 && val <= 10) return 'secondary_events';
    if (val >= 11 && val <= 12) return 'higher_secondary_events';
  }
  
  // Fallback parsing roman numerals or names
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
  
  return 'junior_events'; // Fallback
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      className,
      section,
      roll,
      bkashNumber,
      trxnid,
      amount,
      selectedEvents,
      eventTab,
      teammatesList
    } = body;

    if (!fullName || !email || !phone || !className || !section || !roll || !bkashNumber || !trxnid || !selectedEvents) {
      return NextResponse.json({ error: 'All registration form fields are required.' }, { status: 400 });
    }

    if (/\s/.test(fullName)) {
      return NextResponse.json({ error: 'Please type in your name without spaces or just type in your surname' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanPhone = phone.trim();
    const targetTable = getTargetTable(className);

    // 1. Initialize admin client safely
    const supabaseAdmin = getSupabaseAdmin();

    let finalUserId = null;
    let authEmail = null;
    let isNewUserCreated = false;

    // 2. Check if a profile already exists with this real email
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, email')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (existingProfile) {
      finalUserId = existingProfile.id;
      // Fetch their virtual email from auth.users
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

    // 3. If no user exists, let's create a new one!
    if (!finalUserId) {
      const slug = fullName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
      const virtualEmail = `${slug}@josephitre.club`;
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
        console.error('Error creating guest user:', createError);
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
        console.error('Error creating guest profile:', profileError);
      }

      // Send Welcome Email in background
      sendEmail({
        to: cleanEmail,
        subject: 'Welcome to Josephite Math Club - Your Account Credentials',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0c4a6e; margin-bottom: 20px;">Welcome to Josephite Math Club, ${fullName}!</h1>
            <p style="font-size: 16px; line-height: 1.5;">Thank you for registering for our events. An account has been automatically generated for you using your email and phone number.</p>
            
            <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
              <h2 style="font-size: 14px; color: #0369a1; margin-top: 0;">Login Credentials:</h2>
              <p style="margin: 5px 0;"><strong>Username / Full Name:</strong> ${fullName}</p>
              <p style="margin: 5px 0;"><strong>Email / Username:</strong> ${cleanEmail}</p>
              <p style="margin: 5px 0;"><strong>Password:</strong> ${cleanPhone}</p>
              <p style="margin: 5px 0; font-size: 12px; color: #666;"><em>Note: You can sign in using either your Full Name (as Username), Email, or Phone Number.</em></p>
            </div>
            
            <p style="font-size: 16px; line-height: 1.5;">You can now sign in to your dashboard to view your profile, manage your registrations, and check out announcements!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth?mode=login" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign In Now</a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #6b7280; text-align: center;">Josephite Math Club Automated System</p>
          </div>
        `,
        text: `Welcome to Josephite Math Club, ${fullName}!\n\nAn account has been automatically generated for you using your email and phone number.\n\nLogin Credentials:\nUsername / Full Name: ${fullName}\nEmail: ${cleanEmail}\nPassword: ${cleanPhone}\n\nYou can sign in at: ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth?mode=login`,
      }).catch(emailErr => {
        console.error('Failed to send welcome email to guest in background:', emailErr);
      });
    }

    // 4. Verify/Register in member table to automatically generate their unique 5-digit ticket/member ID
    let existingMemberId = '';
    const { data: memberCheckData } = await supabaseAdmin
      .from('member')
      .select('member_id')
      .eq('id', finalUserId)
      .maybeSingle();

    if (memberCheckData) {
      existingMemberId = memberCheckData.member_id || '';
      
      // Update their member details just in case
      await supabaseAdmin
        .from('member')
        .update({
          full_name: fullName,
          class: className,
          section: section,
          roll: roll,
          phone: cleanPhone,
          email_address: cleanEmail
        })
        .eq('id', finalUserId);
    } else {
      // Generate unique 5-digit ID
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
          email: authEmail,
          email_address: cleanEmail,
          phone: cleanPhone,
          school: 'St Joseph Higher Secondary School',
          class: className,
          section: section,
          roll: roll,
          photo_url: '',
          payment_method: 'bkash',
          trxnid: trxnid,
          bkash_number: bkashNumber,
          verified: 'no',
          member_id: resolvedMemberId
        });

      if (memberInsertError) {
        console.error('Failed to auto-insert member row:', memberInsertError);
      }
    }

    // 5. Insert registration payload into correct events table
    const isOnlyFreeMathOlympiad = selectedEvents.length === 1 && selectedEvents[0]?.trim().toLowerCase() === "math olympiad" && amount === 0;

    const registrationPayload = {
      user_id: finalUserId,
      full_name: fullName,
      class: className,
      section: section,
      roll: roll,
      phone: cleanPhone,
      bkash_number: bkashNumber,
      trxnid: trxnid,
      amount: amount,
      selected_events: selectedEvents.join(', '),
      verified: isOnlyFreeMathOlympiad ? 'yes' : 'no'
    };

    const { error: regInsertError } = await supabaseAdmin
      .from(targetTable)
      .insert([registrationPayload]);

    if (regInsertError) {
      if (regInsertError.code === '23505') {
        return NextResponse.json({ error: "This Transaction ID (TrxID) has already been submitted for verification." }, { status: 400 });
      }
      console.error('Failed to insert event registration:', regInsertError);
      return NextResponse.json({ error: regInsertError.message }, { status: 500 });
    }

    // 6. Send Registration Confirmation Email
    sendEmail({
      to: cleanEmail,
      subject: `Josephite Math Club - Registration Received (TrxID: ${trxnid})`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #0c4a6e; margin-bottom: 20px;">Event Registration Received!</h1>
          <p style="font-size: 16px; line-height: 1.5;">Dear ${fullName},</p>
          <p style="font-size: 16px; line-height: 1.5;">We have successfully received your registration request for the following events:</p>
          
          <div style="background-color: #f7fee7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #84cc16;">
            <p style="margin: 5px 0;"><strong>Selected Events:</strong> ${selectedEvents.join(', ')}</p>
            <p style="margin: 5px 0;"><strong>Class:</strong> Class ${className} | <strong>Section:</strong> ${section} | <strong>Roll:</strong> ${roll}</p>
            <p style="margin: 5px 0;"><strong>Total Paid Amount:</strong> ${amount} BDT</p>
            <p style="margin: 5px 0;"><strong>Transaction ID:</strong> ${trxnid}</p>
            <p style="margin: 5px 0;"><strong>Your Ticket ID:</strong> ${existingMemberId}</p>
          </div>

          <p style="font-size: 16px; line-height: 1.5;">Please allow up to a few hours for JMC administrators to verify your payment transaction ID with the Bkash statement. Once verified, your unique ID will be activated and viewable on your Profile Dashboard!</p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/profile" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Profile Page</a>
          </div>

          <p style="font-size: 14px; color: #ef4444;"><strong>Important Note:</strong> Your auto-generated account password is <strong>${cleanPhone}</strong>. Keep it safe to log in later.</p>

          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #6b7280; text-align: center;">Josephite Math Club Event Operations</p>
        </div>
      `,
      text: `Dear ${fullName},\n\nWe have successfully received your registration request!\n\nDetails:\nSelected Events: ${selectedEvents.join(', ')}\nTransaction ID: ${trxnid}\nTotal Amount: ${amount} BDT\nTicket ID: ${existingMemberId}\n\nYour account auto-login password is: ${cleanPhone}\n\nPlease allow a few hours for verification.\n\nJosephite Math Club.`,
    }).catch(emailErr => {
      console.error('Failed to send registration confirmation email:', emailErr);
    });

    return NextResponse.json({
      success: true,
      userId: finalUserId,
      virtualEmail: authEmail,
      username: fullName,
      password: cleanPhone,
      isNewUserCreated,
      memberId: existingMemberId
    });

  } catch (err: any) {
    console.error('Guest register endpoint error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
