import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

// Helper function to get the high-privilege admin client using service role key
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
    const { recordId, tableName, action, emailAddress, verifiedBy } = await req.json();

    if (!recordId || !tableName || !action) {
      return NextResponse.json({ error: 'Missing recordId, tableName, or action' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing in env');
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch the registration record using admin client to bypass RLS
    const { data: record, error: fetchError } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .eq('id', recordId)
      .maybeSingle();

    if (fetchError || !record) {
      const errMsg = fetchError?.message || '';
      if (errMsg.includes('Invalid API key') || errMsg.includes('invalid') || errMsg.includes('API key')) {
        return NextResponse.json({
          error: 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.'
        }, { status: 401 });
      }
      return NextResponse.json({ error: fetchError?.message || 'Record not found' }, { status: 404 });
    }

    // Find all linked teammate records under the same transaction ID space
    const rootTrxnid = (record.trxnid || '').replace(/-T\d+$/, '');
    const isPlaceholder = !rootTrxnid || 
                          rootTrxnid.trim().length < 4 || 
                          ['n/a', 'na', 'none', 'pending', 'null', 'nil', 'test', '0', 'bkash', 'b-kash', 'payment', 'unpaid', 'placeholder'].includes(rootTrxnid.trim().toLowerCase());

    const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
    let allLinkedRecords: any[] = [];
    
    if (!isPlaceholder) {
      for (const tb of tables) {
        const { data, error: linkedFetchError } = await supabaseAdmin
          .from(tb)
          .select('*')
          .or(`trxnid.eq.${rootTrxnid},trxnid.eq.${rootTrxnid}-T2,trxnid.eq.${rootTrxnid}-T3`);
        
        if (linkedFetchError) {
          console.error(`Error fetching linked records for table ${tb}:`, linkedFetchError);
        }
        if (data && data.length > 0) {
          allLinkedRecords = [...allLinkedRecords, ...data.map(d => ({ ...d, tableName: tb }))];
        }
      }
    }

    // Safeguard: Ensure the main record is always included in the list
    const isMainIncluded = allLinkedRecords.some(r => r.id === recordId && r.tableName === tableName);
    if (!isMainIncluded) {
      allLinkedRecords.push({ ...record, tableName });
    }

    if (action === 'reject') {
      // Reject all linked records
      for (const linkedRec of allLinkedRecords) {
        const { error: rejectError } = await supabaseAdmin
          .from(linkedRec.tableName)
          .update({ verified: 'rejected' })
          .eq('id', linkedRec.id);

        if (rejectError) {
          console.error(`Failed to reject registration on ${linkedRec.tableName} for ${linkedRec.full_name}:`, rejectError);
          throw new Error(`Failed to reject registration: ${rejectError.message}`);
        }

        // Send rejection email to anyone with an email
        const { data: prof } = await supabaseAdmin
          .from('profiles')
          .select('email')
          .eq('id', linkedRec.user_id)
          .maybeSingle();

        const linkedEmail = prof?.email || (linkedRec.user_id === record.user_id ? emailAddress : null);

        if (linkedEmail) {
          sendEmail({
            to: linkedEmail,
            subject: 'Event Registration Verification Update - Josephite Math Club',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px; border: 1px solid #f1f5f9; border-radius: 8px;">
                <h1 style="color: #ef4444; font-size: 24px;">Registration Correction Needed</h1>
                <p>Hello <strong>${linkedRec.full_name}</strong>,</p>
                <p>We couldn't verify your group/team bKash payment transaction with TrxID <strong>${rootTrxnid}</strong> for your selected Events (<strong>${linkedRec.selected_events}</strong>).</p>
                <p>Please coordinate with your team captain to verify the bKash Sender wallet phone number and Transaction ID (TrxID) and submit a correction.</p>
                <p>If you have any questions, please reply to this email or submit a help ticket on the platform.</p>
                <br/>
                <p>Best regards,<br/>The Josephite Math Club Admin Panel</p>
              </div>
            `
          }).then(async () => {
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: linkedEmail,
                  recipient_name: linkedRec.full_name || '',
                  recipient_class: String(linkedRec.class || ''),
                  recipient_section: String(linkedRec.section || ''),
                  recipient_roll: String(linkedRec.roll || ''),
                  subject: 'Event Registration Verification Update - Josephite Math Club',
                  body_text: `We couldn't verify your group/team bKash payment transaction with TrxID ${rootTrxnid} for your selected Events (${linkedRec.selected_events}).`,
                  verified_by: verifiedBy || 'Admin',
                  status: 'sent'
                }]);
            } catch (dbErr) {
              console.warn('[DB] Failed to log rejection email confirmation', dbErr);
            }
          }).catch(async (emailErr) => {
            console.warn('Rejection email delivery background error:', emailErr);
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: linkedEmail,
                  recipient_name: linkedRec.full_name || '',
                  recipient_class: String(linkedRec.class || ''),
                  recipient_section: String(linkedRec.section || ''),
                  recipient_roll: String(linkedRec.roll || ''),
                  subject: 'Event Registration Verification Update - Josephite Math Club',
                  body_text: `We couldn't verify your group/team bKash payment transaction with TrxID ${rootTrxnid} for your selected Events (${linkedRec.selected_events}).`,
                  verified_by: verifiedBy || 'Admin',
                  status: 'failed',
                  error_message: String(emailErr?.message || emailErr)
                }]);
            } catch (e) {
              console.warn('[DB] Failed to log failed rejection email', e);
            }
          });
        }
      }

      return NextResponse.json({ success: true, message: 'Team and leader registrations rejected successfully.' });
    }

    if (action === 'approve') {
      for (const linkedRec of allLinkedRecords) {
        // Resolve or Create Member profile for each teammate (only if they have a user_id)
        let memberIdToUse = '';
        let existingMember = null;
        
        const categoryToUse = linkedRec.tableName === 'primary_events' ? 'Primary' :
                              linkedRec.tableName === 'junior_events' ? 'Junior' :
                              linkedRec.tableName === 'secondary_events' ? 'Secondary' : 'Higher Secondary';

        let isEcUser = false;
        if (linkedRec.user_id) {
          // Check if they are in ec_member first
          const { data: ecMem, error: ecMemErr } = await supabaseAdmin
            .from('ec_member')
            .select('*')
            .eq('id', linkedRec.user_id)
            .maybeSingle();

          if (!ecMemErr && ecMem) {
            isEcUser = true;
            existingMember = ecMem;
            memberIdToUse = ecMem.member_id;
            
            // Update ec_member verified status to 'yes'
            await supabaseAdmin
              .from('ec_member')
              .update({ verified: 'yes' })
              .eq('id', ecMem.id);
          } else {
            const { data: memData, error: memErr } = await supabaseAdmin
              .from('member')
              .select('*')
              .eq('id', linkedRec.user_id)
              .maybeSingle();
            if (memErr) {
              console.error("Error checking member profile:", memErr);
            }
            existingMember = memData;
          }
        }

        let linkedEmail = '';
        if (linkedRec.user_id) {
          const { data: prof, error: profErr } = await supabaseAdmin
            .from('profiles')
            .select('email')
            .eq('id', linkedRec.user_id)
            .maybeSingle();
          if (profErr) {
            console.error("Error loading email profile:", profErr);
          }
          linkedEmail = prof?.email || '';
        }

        if (!linkedEmail && linkedRec.user_id === record.user_id) {
          linkedEmail = emailAddress;
        }

        if (isEcUser) {
          // EC user resolved. Sync their 3-digit EC ID to the standard member table to prevent event_participation foreign key violations
          try {
            await supabaseAdmin
              .from('member')
              .upsert({
                id: linkedRec.user_id,
                full_name: existingMember.full_name,
                class: existingMember.class,
                section: existingMember.section,
                roll: existingMember.roll,
                email: linkedEmail || existingMember.email,
                email_address: linkedEmail || existingMember.email,
                phone: existingMember.phone || 'N/A',
                member_id: memberIdToUse, // the 3-digit ID
                verified: 'yes',
                is_ec: true,
                school: 'St Joseph',
                updated_at: new Date().toISOString()
              });
          } catch (syncErr) {
            console.error("Error syncing EC member to member table during event registration verification:", syncErr);
          }
        } else if (existingMember && existingMember.member_id && existingMember.member_id.startsWith('JMC-')) {
          memberIdToUse = existingMember.member_id;
          
          // CRITICAL BUG FIX: Ensure the general member record is marked verified as yes.
          const { error: updateGeneralVerifiedError } = await supabaseAdmin
            .from('member')
            .update({ verified: 'yes' })
            .eq('id', existingMember.id);
            
          if (updateGeneralVerifiedError) {
            console.error("Failed to update general member verification:", updateGeneralVerifiedError);
          }

          // In case they are an EC officer, update ec_member table as well
          const { error: updateEcVerifiedError } = await supabaseAdmin
            .from('ec_member')
            .update({ verified: 'yes' })
            .eq('id', existingMember.id);

          if (updateEcVerifiedError) {
            console.log("No matching EC profile updated (expected for standard members)");
          }
        } else {
          // They are a non-general member. Grant a 5 digit unique ID!
          let resolvedMemberId = '';
          if (existingMember && existingMember.member_id && /^\d{5}$/.test(existingMember.member_id)) {
            resolvedMemberId = existingMember.member_id;
          } else {
            let isUnique = false;
            while (!isUnique) {
              const digits = Math.floor(10000 + Math.random() * 90000).toString();
              const { data: check, error: checkErr } = await supabaseAdmin
                .from('member')
                .select('id')
                .eq('member_id', digits)
                .maybeSingle();
              if (checkErr) {
                console.error("Error verifying unique ID:", checkErr);
              }
              if (!check) {
                resolvedMemberId = digits;
                isUnique = true;
              }
            }
          }
          memberIdToUse = resolvedMemberId;

          if (existingMember) {
            // Update existing member record details to use the 5-digit ID and mark verified as yes
            const { error: updateMemberError } = await supabaseAdmin
              .from('member')
              .update({ member_id: memberIdToUse, verified: 'yes' })
              .eq('id', existingMember.id);
            
            if (updateMemberError) {
              console.error("Failed to update general member verification:", updateMemberError);
              throw new Error(`Failed to update general member verification: ${updateMemberError.message}`);
            }
          } else if (linkedRec.user_id) {
            const { error: insertMemberError } = await supabaseAdmin
              .from('member')
              .insert({
                id: linkedRec.user_id,
                full_name: linkedRec.full_name,
                class: linkedRec.class,
                section: linkedRec.section,
                roll: linkedRec.roll,
                phone: linkedRec.bkash_number,
                email_address: linkedEmail || '',
                school: 'St Joseph Higher Secondary School',
                photo_url: '',
                payment_method: 'bkash',
                trxnid: linkedRec.trxnid,
                bkash_number: linkedRec.bkash_number,
                member_id: memberIdToUse,
                verified: 'yes'
              });

            if (insertMemberError) {
              console.error("Failed to dynamically initialize member entry details for teammate (non-general):", insertMemberError);
              throw new Error(`Failed to insert teammate member entry: ${insertMemberError.message}`);
            }
          }
        }

        // Insert event_participation lines for each linked teammate's selections
        if (memberIdToUse && linkedRec.user_id) {
          const eventsList = linkedRec.selected_events
            ? linkedRec.selected_events.split(',').map((e: string) => e.trim())
            : [];

          for (const eventName of eventsList) {
            if (!eventName) continue;
            
            const { data: dupCheck, error: dupCheckError } = await supabaseAdmin
              .from('event_participation')
              .select('*')
              .eq('member_id', memberIdToUse)
              .eq('event_name', eventName)
              .maybeSingle();

            if (dupCheckError) {
              console.error("Error checking duplicate event participation:", dupCheckError);
            }

            if (!dupCheck) {
              const { error: partError } = await supabaseAdmin
                .from('event_participation')
                .insert({
                  member_id: memberIdToUse,
                  event_name: eventName,
                  category: categoryToUse,
                  position: null
                });

              if (partError) {
                console.warn(`Could not seed event participation row for teammate event ${eventName}:`, partError.message);
                throw new Error(`Failed to create event participation row: ${partError.message}`);
              }
            }
          }
        }

        // Mark as yes in the specific events registration table
        const updatePayload: any = { verified: 'yes' };
        if (verifiedBy) {
          updatePayload.verified_by = verifiedBy;
        }

        let { error: eventUpdateError } = await supabaseAdmin
          .from(linkedRec.tableName)
          .update(updatePayload)
          .eq('id', linkedRec.id);

        if (eventUpdateError && (eventUpdateError.code === '42703' || String(eventUpdateError.message).includes('verified_by'))) {
          console.warn("verified_by column does not exist yet. Falling back to update without it...");
          const fallbackPayload = { verified: 'yes' };
          const retryRes = await supabaseAdmin
            .from(linkedRec.tableName)
            .update(fallbackPayload)
            .eq('id', linkedRec.id);
          eventUpdateError = retryRes.error;
        }

        if (eventUpdateError) {
          console.error(`Failed to verify registration in table ${linkedRec.tableName}:`, eventUpdateError);
          throw new Error(`Failed to verify event registration state: ${eventUpdateError.message}`);
        }

        console.log(`[API] Successfully updated ${linkedRec.tableName} record ${linkedRec.id} to verified='yes'`);

        // Send confirmation email asynchronously (non-blocking)
        if (linkedEmail) {
          sendEmail({
            to: linkedEmail,
            subject: '🎉 Event Registration Approved! - Josephite Math Club',
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 25px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #fafbfc;">
                <h1 style="color: #0284c7; font-size: 26px; margin-bottom: 20px;">Welcome to the Event Arena!</h1>
                <p>Hello <strong>${linkedRec.full_name}</strong>,</p>
                <p>Your team/group registration of <strong>${linkedRec.selected_events}</strong> has been successfully verified and approved!</p>
                <div style="background-color: #f1f5f9; border-left: 4px solid #0284c7; padding: 15px; margin: 20px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 10px 0; color: #0f172a; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">Registered Team Event:</h3>
                  <p style="margin: 0; font-size: 15px; font-weight: bold; color: #334155;">${linkedRec.selected_events}</p>
                  <p style="margin: 8px 0 0 0; font-size: 12px; color: #64748b;">Category: <strong>${categoryToUse} (Class ${linkedRec.class})</strong></p>
                </div>
                <p>This participation is associated with your unique ID: <strong>${memberIdToUse}</strong>. You can view it live on your <strong>Profile Dashboard</strong> anytime.</p>
                <p>Get ready to test your mathematical boundaries and best of luck!</p>
                <br/>
                <hr style="border: 0; border-top: 1px solid #e2e8f0; margin-bottom: 20px;" />
                <p style="font-size: 11px; color: #64748b; line-height: 1.5;">This email was automatically dispatched by the JMC Verification Engine. If you encounter any bugs, please reach out to JMC support.</p>
              </div>
            `
          }).then(async () => {
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: linkedEmail,
                  recipient_name: linkedRec.full_name || '',
                  recipient_class: String(linkedRec.class || ''),
                  recipient_section: String(linkedRec.section || ''),
                  recipient_roll: String(linkedRec.roll || ''),
                  subject: `Event Registration Approved! - ${linkedRec.selected_events}`,
                  body_text: `Your team/group registration of ${linkedRec.selected_events} has been successfully verified and approved!`,
                  verified_by: verifiedBy || 'Admin',
                  status: 'sent'
                }]);
            } catch (dbErr) {
              console.warn('[DB] Failed to log success email confirmation', dbErr);
            }
          }).catch(async (emailErr) => {
            console.warn('Teammate email dispatch background error:', emailErr);
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: linkedEmail,
                  recipient_name: linkedRec.full_name || '',
                  recipient_class: String(linkedRec.class || ''),
                  recipient_section: String(linkedRec.section || ''),
                  recipient_roll: String(linkedRec.roll || ''),
                  subject: `Event Registration Approved! - ${linkedRec.selected_events}`,
                  body_text: `Your team/group registration of ${linkedRec.selected_events} has been successfully verified and approved!`,
                  verified_by: verifiedBy || 'Admin',
                  status: 'failed',
                  error_message: String(emailErr?.message || emailErr)
                }]);
            } catch (e) {
              console.warn('[DB] Failed to log failed success email', e);
            }
          });
        }
      }

      return NextResponse.json({ success: true, message: 'All team and leader registrations approved and cataloged successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action parameter specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Verify Event route error:', err);
    let errorMessage = err.message || 'Internal server error';
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid') || errorMessage.includes('API key')) {
      errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
