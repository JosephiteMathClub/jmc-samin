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

const cleanEventNames = (evStr: string) => {
  if (!evStr) return "N/A";
  if (evStr.includes("Segment-") || evStr.includes("segment-")) {
    return evStr.split(',').map(s => {
      const trimmed = s.trim();
      if (/^segment-\d+$/i.test(trimmed) || trimmed.startsWith('Segment-')) {
        return "Tic-Tac-Toe";
      }
      return trimmed;
    }).join(', ');
  }
  return evStr;
};

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

    // Find all linked records for team/group registrations sharing the same base transaction ID
    let allLinkedRecords: any[] = [{ ...record, tableName }];
    const baseTrxnId = record.trxnid ? record.trxnid.replace(/-T\d+$/i, '').trim() : '';

    if (baseTrxnId && !baseTrxnId.toUpperCase().startsWith('PROXY-')) {
      const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
      const linkedMap = new Map<string, any>();
      linkedMap.set(`${tableName}:${record.id}`, { ...record, tableName });

      for (const tb of tables) {
        const { data: linkedData } = await supabaseAdmin
          .from(tb)
          .select('*')
          .or(`trxnid.eq.${baseTrxnId},trxnid.ilike.${baseTrxnId}-T%`);

        if (linkedData) {
          linkedData.forEach((item: any) => {
            const itemKey = `${tb}:${item.id}`;
            if (!linkedMap.has(itemKey)) {
              linkedMap.set(itemKey, { ...item, tableName: tb });
            }
          });
        }
      }
      allLinkedRecords = Array.from(linkedMap.values());
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

        // Write to admin_audit_logs
        try {
          await supabaseAdmin.from('admin_audit_logs').insert([{
            admin_name: verifiedBy || 'Admin',
            action_type: 'REJECT_TRANSACTION',
            target: `${linkedRec.tableName}:${linkedRec.id}`,
            details: JSON.stringify({
              trxnid: linkedRec.trxnid,
              full_name: linkedRec.full_name,
              amount: linkedRec.amount,
              selected_events: linkedRec.selected_events,
              verified_by: verifiedBy
            })
          }]);
        } catch (auditErr) {
          console.error("Failed to log rejection to admin_audit_logs:", auditErr);
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
                <p>We couldn't verify your group/team bKash payment transaction with TrxID <strong>${linkedRec.trxnid || 'N/A'}</strong> for your selected Events (<strong>${cleanEventNames(linkedRec.selected_events)}</strong>).</p>
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
                  body_text: `We couldn't verify your group/team bKash payment transaction with TrxID ${linkedRec.trxnid || 'N/A'} for your selected Events (${cleanEventNames(linkedRec.selected_events)}).`,
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
                  body_text: `We couldn't verify your group/team bKash payment transaction with TrxID ${linkedRec.trxnid || 'N/A'} for your selected Events (${cleanEventNames(linkedRec.selected_events)}).`,
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

      return NextResponse.json({ success: true, message: 'Registration rejected successfully.' });
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

        // Automatic insertion into event_participation table is disabled so that admins can manually check in / input unique IDs.

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

        // Write to admin_audit_logs
        try {
          await supabaseAdmin.from('admin_audit_logs').insert([{
            admin_name: verifiedBy || 'Admin',
            action_type: 'APPROVE_TRANSACTION',
            target: `${linkedRec.tableName}:${linkedRec.id}`,
            details: JSON.stringify({
              trxnid: linkedRec.trxnid,
              full_name: linkedRec.full_name,
              amount: linkedRec.amount,
              selected_events: linkedRec.selected_events,
              verified_by: verifiedBy
            })
          }]);
        } catch (auditErr) {
          console.error("Failed to log approval to admin_audit_logs:", auditErr);
        }

        // Send confirmation email asynchronously (non-blocking) with full Verification Slip & QR Code
        if (linkedEmail) {
          const qrPayload = JSON.stringify({
            id: memberIdToUse,
            member_id: memberIdToUse,
            name: linkedRec.full_name || 'Participant',
            class: String(linkedRec.class || 'N/A'),
            section: String(linkedRec.section || 'N/A'),
            roll: String(linkedRec.roll || 'N/A'),
            trxnid: linkedRec.trxnid || 'VERIFIED',
            events: cleanEventNames(linkedRec.selected_events),
            type: 'ticket_slip',
            v: '1.0'
          });

          const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrPayload)}&color=000000&bgcolor=ffffff&margin=10`;
          const profileLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://jmc-mathfest.vercel.app'}/profile`;

          sendEmail({
            to: linkedEmail,
            subject: `🎟️ Official Verification Slip & Event Ticket Pass [ID: ${memberIdToUse}] - Josephite Math Club`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; color: #0f172a; padding: 0; background-color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
                <div style="background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 30px; text-align: center; color: #ffffff;">
                  <p style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 2px; margin: 0 0 6px 0; color: #bae6fd;">Josephite Math Club</p>
                  <h1 style="font-size: 24px; font-weight: 900; margin: 0; letter-spacing: -0.5px;">OFFICIAL VERIFICATION SLIP & ENTRY PASS</h1>
                  <p style="font-size: 13px; margin: 6px 0 0 0; color: #e0f2fe;">Annual Math Festival & Event Participation Ticket</p>
                </div>

                <div style="padding: 30px;">
                  <div style="text-align: center; margin-bottom: 24px;">
                    <span style="display: inline-block; background-color: #dcfce7; color: #15803d; border: 1px solid #86efac; font-size: 12px; font-weight: 800; padding: 6px 16px; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px;">
                      ✓ VERIFIED & APPROVED PASS
                    </span>
                  </div>

                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 24px;">
                    <tr>
                      <td valign="top" style="padding-right: 15px;">
                        <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Registrant Name</p>
                        <p style="font-size: 18px; font-weight: 800; color: #0f172a; margin: 0 0 16px 0;">${linkedRec.full_name || 'Participant'}</p>

                        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 16px;">
                          <tr>
                            <td width="50%" valign="top">
                              <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Unique Entry ID</p>
                              <p style="font-size: 15px; font-family: monospace; font-weight: 900; color: #0284c7; margin: 0;">${memberIdToUse}</p>
                            </td>
                            <td width="50%" valign="top">
                              <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 4px 0;">Transaction ID</p>
                              <p style="font-size: 13px; font-family: monospace; font-weight: 700; color: #334155; margin: 0;">${linkedRec.trxnid || 'VERIFIED'}</p>
                            </td>
                          </tr>
                        </table>

                        <div style="background-color: #f1f5f9; padding: 12px; border-radius: 10px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 12px; color: #334155;">
                          <strong>Class:</strong> ${linkedRec.class || 'N/A'} &nbsp;|&nbsp; 
                          <strong>Section:</strong> ${linkedRec.section || 'N/A'} &nbsp;|&nbsp; 
                          <strong>Roll:</strong> ${linkedRec.roll || 'N/A'}
                        </div>

                        <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 16px 0 4px 0;">Institution</p>
                        <p style="font-size: 13px; color: #334155; margin: 0;">${linkedRec.school || 'St. Joseph Higher Secondary School'}</p>
                      </td>

                      <td width="160" valign="top" align="center" style="background-color: #ffffff; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0;">
                        <img src="${qrImageUrl}" alt="Verification Ticket QR Code" width="140" height="140" style="display: block; width: 140px; height: 140px; border: 0;" />
                        <p style="font-size: 11px; font-family: monospace; font-weight: 800; color: #0f172a; margin: 10px 0 2px 0;">${memberIdToUse}</p>
                        <p style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0;">Scannable Ticket QR</p>
                      </td>
                    </tr>
                  </table>

                  <div style="background-color: #ffffff; padding: 16px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
                    <p style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Registered Event Segments</p>
                    <p style="font-size: 14px; font-weight: 700; color: #0284c7; margin: 0; font-family: monospace;">${cleanEventNames(linkedRec.selected_events)}</p>
                  </div>

                  <div style="background-color: #f0fdf4; padding: 14px; border-radius: 12px; border: 1px solid #bbf7d0; margin-bottom: 24px;">
                    <table width="100%" border="0" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="font-size: 12px; font-weight: 800; color: #166534;">Entitlements Included:</td>
                        <td align="right" style="font-size: 12px; font-weight: 700; color: #15803d;">
                          ✓ Event Entry &nbsp;•&nbsp; ✓ Snacks Token &nbsp;•&nbsp; ✓ Souvenir
                        </td>
                      </tr>
                    </table>
                  </div>

                  <div style="text-align: center; margin-bottom: 24px;">
                    <a href="${profileLink}" style="display: inline-block; background-color: #0284c7; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 800; padding: 14px 28px; border-radius: 12px; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(2,132,199,0.3);">
                      📥 View & Download Slip on Profile
                    </a>
                  </div>

                  <p style="font-size: 12px; color: #64748b; text-align: center; margin: 0; line-height: 1.5;">
                    Please keep this verification slip saved or present your QR Code at the festival entry booth.<br/>
                    Registered using mobile/phone? Access your verification slip anytime on your <a href="${profileLink}" style="color: #0284c7; text-decoration: underline;">Profile Page</a>.
                  </p>
                </div>

                <div style="background-color: #f1f5f9; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0;">
                  <p style="font-size: 11px; color: #94a3b8; margin: 0;">Verified by JMC Admin Engine • St. Joseph Higher Secondary School</p>
                </div>
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
                  subject: `Event Registration Approved! - ${cleanEventNames(linkedRec.selected_events)}`,
                  body_text: `Your team/group registration of ${cleanEventNames(linkedRec.selected_events)} has been successfully verified and approved!`,
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
                  subject: `Event Registration Approved! - ${cleanEventNames(linkedRec.selected_events)}`,
                  body_text: `Your team/group registration of ${cleanEventNames(linkedRec.selected_events)} has been successfully verified and approved!`,
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

      return NextResponse.json({ success: true, message: 'Registration approved successfully.' });
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
