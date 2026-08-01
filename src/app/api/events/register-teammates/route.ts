import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdminClient: any = null;

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
    let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    if (!url || !key) {
      throw new Error('Database service keys are not configured on server');
    }

    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    url = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

    supabaseAdminClient = createClient(url, key);
  }
  return supabaseAdminClient;
}

export async function POST(req: Request) {
  try {
    const { trxnid, bkash_number, targetTable, event_name, teammates } = await req.json();

    if (!trxnid || !bkash_number || !targetTable || !event_name || !teammates || !Array.isArray(teammates)) {
      return NextResponse.json({ error: 'Missing required teammate registration fields' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const insertedRows = [];

    // Loop through teammates and insert them using service role
    for (let i = 0; i < teammates.length; i++) {
      const teammate = teammates[i];
      const suffix = `-T${i + 2}`; // -T2, -T3
      const teammateTrxnId = `${trxnid}${suffix}`;

      let resolvedUserId = teammate.id;
      const teammateEmail = (teammate.email || '').trim().toLowerCase();

      if (teammateEmail) {
        // Double-check if they have a profile/user under this email address
        const { data: profileCheck } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('email', teammateEmail)
          .maybeSingle();

        if (profileCheck) {
          resolvedUserId = profileCheck.id;
        } else {
          // Trigger spot registration-style account creation!
          const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email: teammateEmail,
            password: 'Josephite123',
            email_confirm: true, // Auto-confirm email
            user_metadata: {
              full_name: teammate.name
            }
          });

          if (createError) {
            console.error(`Error auto-creating teammate account for ${teammateEmail}:`, createError);
            return NextResponse.json({ error: `Failed to create teammate account: ${createError.message}` }, { status: 500 });
          }

          if (newUser && newUser.user) {
            resolvedUserId = newUser.user.id;

            // Create profile for teammate
            const { error: profileError } = await supabaseAdmin
              .from('profiles')
              .upsert({
                id: newUser.user.id,
                full_name: teammate.name,
                role: 'member',
                email: teammateEmail
              }, { onConflict: 'id' });

            if (profileError) {
              console.error(`Error creating profile for teammate ${teammateEmail}:`, profileError);
            }

            // Send Welcome Email to the teammate in the background
            sendEmail({
              to: teammateEmail,
              subject: 'Your Account Creation Has Been Successful!',
              html: `
                <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #0c4a6e; margin-bottom: 20px;">Welcome to Josephite Math Club, ${teammate.name}!</h1>
                  <p style="font-size: 16px; line-height: 1.5;">An account has been successfully created for you because your teammate has registered you for an event in Josephite Math Club.</p>
                  
                  <div style="background-color: #f0f9ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                    <h2 style="font-size: 14px; color: #0369a1; margin-top: 0;">Login Credentials:</h2>
                    <p style="margin: 5px 0;"><strong>Email:</strong> ${teammateEmail}</p>
                    <p style="margin: 5px 0;"><strong>Password:</strong> Josephite123</p>
                  </div>
                  
                  <p style="font-size: 16px; line-height: 1.5;">You can now sign in to your dashboard to view your profile and participate in upcoming events. Please make sure to change your password after logging in.</p>
                  
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/auth?mode=login" style="background-color: #0c4a6e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Sign In Now</a>
                  </div>
                  
                  <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #6b7280; text-align: center;">Josephite Math Club Automated System</p>
                </div>
              `,
              text: `Welcome to Josephite Math Club, ${teammate.name}!\n\nAn account has been successfully created for you because your teammate has registered you for an event in Josephite Math Club.\n\nLogin Credentials:\nEmail: ${teammateEmail}\nPassword: Josephite123\n\nYou can sign in at: ${process.env.NEXT_PUBLIC_APP_URL || ''}/auth?mode=login`,
            }).catch(emailErr => {
              console.error(`Failed to send welcome email to teammate ${teammateEmail}:`, emailErr);
            });
          }
        }
      }

      // Check if teammate is registered in member or ec_member tables
      let isTeammateRegisteredGeneral = false;
      if (resolvedUserId) {
        try {
          const { data: ecData } = await supabaseAdmin
            .from('ec_member')
            .select('id')
            .eq('id', resolvedUserId)
            .maybeSingle();

          if (ecData) {
            isTeammateRegisteredGeneral = true;
          } else {
            const { data: memberData } = await supabaseAdmin
              .from('member')
              .select('id')
              .eq('id', resolvedUserId)
              .maybeSingle();
            
            if (memberData) {
              isTeammateRegisteredGeneral = true;
            }
          }
        } catch (err) {
          console.error("Failed to check teammate member status:", err);
        }

        // If they are not registered in the member table at all, automatically register them as a non-general member & provide a 5-digit unique ID
        if (!isTeammateRegisteredGeneral) {
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

          const { error: autoGenError } = await supabaseAdmin
            .from('member')
            .upsert({
              id: resolvedUserId,
              full_name: teammate.name,
              email: teammateEmail,
              email_address: teammateEmail,
              phone: '',
              school: 'St Joseph Higher Secondary School',
              class: teammate.class || '',
              section: teammate.section || '',
              roll: teammate.roll || '',
              photo_url: '',
              payment_method: 'bkash',
              trxnid: teammateTrxnId,
              bkash_number: bkash_number,
              verified: 'no',
              member_id: resolvedMemberId
            });

          if (autoGenError) {
            console.error("Auto teammate member registration error:", autoGenError);
          } else {
            console.log("Successfully auto-enrolled teammate in member table with ID:", resolvedMemberId);
          }
        }
      }

      const payload = {
        user_id: resolvedUserId,
        full_name: teammate.name,
        gender: teammate.gender || '',
        class: teammate.class || '',
        section: teammate.section || teammate.institute || '',
        roll: teammate.roll || '',
        bkash_number: bkash_number,
        trxnid: teammateTrxnId,
        amount: 0, // teammate cost is covered by leader
        selected_events: event_name,
        verified: 'no'
      };

      const { data, error } = await supabaseAdmin
        .from(targetTable)
        .insert([payload])
        .select('*');

      if (error) {
        console.error(`Error inserting teammate ${i + 2} record:`, error);
        // If there's a unique constraint on teammate's transaction ID, it might be a double submission.
        // We can ignore or return error. Let's return error to notify front-end.
        return NextResponse.json({ 
          error: `Failed to insert team member record for ${teammate.name}. ${error.message}` 
        }, { status: 500 });
      }

      if (data && data.length > 0) {
        insertedRows.push(data[0]);
      }
    }

    return NextResponse.json({ success: true, count: insertedRows.length, records: insertedRows });
  } catch (err: any) {
    console.error('teammate register route error:', err);
    let errorMessage = err.message || 'Internal Server Error';
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid') || errorMessage.includes('API key')) {
      errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
