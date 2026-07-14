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

async function isCallerSuperAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonUrl || !anonKey) return false;

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
    if (authError || !user) return false;

    const email = (user.email || '').toLowerCase().trim();

    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    if (SUPER_ADMINS.includes(email)) {
      return true;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role?.trim().toLowerCase() === 'super_admin') {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error verifying super admin identity:', err);
    return false;
  }
}

// GET all submissions (admin only)
export async function GET(req: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    let submissions: any[] = [];
    let fetchedFromNewTable = false;

    const submissionsMap = new Map<string, any>();

    // 1. Try fetching from the official challenge_submissions table
    try {
      const { data: dbRows, error: dbError } = await supabaseAdmin
        .from('challenge_submissions')
        .select('*');

      if (!dbError && dbRows) {
        dbRows.forEach((row: any) => {
          submissionsMap.set(row.id, {
            id: row.id,
            fullName: row.full_name,
            email: row.email,
            memberId: row.member_id,
            answers: row.answers || {},
            autoScore: row.auto_score,
            totalQuestions: row.total_questions,
            gradedBreakdown: row.graded_breakdown || [],
            status: row.status,
            finalScore: row.final_score,
            feedback: row.feedback,
            submittedAt: row.submitted_at,
            publishedAt: row.published_at
          });
        });
      } else if (dbError) {
        console.warn('New challenge_submissions table query error:', dbError.message);
      }
    } catch (err) {
      console.warn('New challenge_submissions table query failed:', err);
    }

    // 2. Fetch and merge from site_content fallback
    try {
      const { data: subRow, error: subError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'challenge_submissions')
        .maybeSingle();

      if (!subError && subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
        subRow.data.submissions.forEach((sub: any) => {
          if (!submissionsMap.has(sub.id)) {
            submissionsMap.set(sub.id, {
              id: sub.id,
              fullName: sub.fullName,
              email: sub.email,
              memberId: sub.memberId,
              answers: sub.answers || {},
              autoScore: sub.autoScore,
              totalQuestions: sub.totalQuestions,
              gradedBreakdown: sub.gradedBreakdown || [],
              status: sub.status,
              finalScore: sub.finalScore,
              feedback: sub.feedback,
              submittedAt: sub.submittedAt,
              publishedAt: sub.publishedAt
            });
          } else {
            // Unify: If already present, let's keep status and final score if published
            const existing = submissionsMap.get(sub.id);
            const mergeFinalScore = sub.finalScore !== undefined ? sub.finalScore : existing.finalScore;
            const mergeStatus = (sub.status === 'published' || existing.status === 'published') ? 'published' : 'pending';
            
            submissionsMap.set(sub.id, {
              ...existing,
              finalScore: mergeFinalScore,
              status: mergeStatus,
              feedback: sub.feedback || existing.feedback,
              publishedAt: sub.publishedAt || existing.publishedAt
            });
          }
        });
      }
    } catch (fallbackErr) {
      console.warn('Submissions fallback merger failed:', fallbackErr);
    }

    submissions = Array.from(submissionsMap.values());

    // Return descending by timestamp
    submissions.sort((a: any, b: any) => {
      const dateA = a.submittedAt ? new Date(a.submittedAt).getTime() : 0;
      const dateB = b.submittedAt ? new Date(b.submittedAt).getTime() : 0;
      return dateB - dateA;
    });

    return NextResponse.json({ success: true, submissions });

  } catch (error: any) {
    console.error('Get Submissions API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST update submission: Final Check & Publish (admin only)
export async function POST(req: Request) {
  try {
    const { submissionId, finalScore, feedback, publish } = await req.json();

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Update the record in the dedicated challenge_submissions table
    try {
      const { error: dbUpdateError } = await supabaseAdmin
        .from('challenge_submissions')
        .update({
          ...(finalScore !== undefined ? { final_score: Number(finalScore) } : {}),
          ...(feedback !== undefined ? { feedback } : {}),
          ...(publish ? { status: 'published', published_at: new Date().toISOString() } : {})
        })
        .eq('id', submissionId);
      
      if (dbUpdateError) {
        console.error('Failed to update challenge_submissions table row:', dbUpdateError.message);
      }
    } catch (err) {
      console.error('Error on challenge_submissions table update:', err);
    }

    // 2. Fetch current submissions list from site_content
    const { data: subRow, error: subError } = await supabaseAdmin
      .from('site_content')
      .select('data')
      .eq('id', 'challenge_submissions')
      .maybeSingle();

    if (subError || !subRow) {
      return NextResponse.json({ error: 'Failed to find submissions row.' }, { status: 500 });
    }

    let submissionsList = [];
    if (subRow.data && Array.isArray(subRow.data.submissions)) {
      submissionsList = subRow.data.submissions;
    }

    // 3. Locate targeted submission in legacy list
    const targetIdx = submissionsList.findIndex((s: any) => s.id === submissionId);
    if (targetIdx === -1) {
      return NextResponse.json({ error: 'Submission not found in the records.' }, { status: 404 });
    }

    const sub = submissionsList[targetIdx];

    // 4. Update fields
    if (finalScore !== undefined) {
      sub.finalScore = Number(finalScore);
    }
    if (feedback !== undefined) {
      sub.feedback = feedback;
    }
    if (publish) {
      sub.status = 'published';
      sub.publishedAt = new Date().toISOString();
    }

    submissionsList[targetIdx] = sub;

    // 5. Save list back to site_content
    const { error: upsertError } = await supabaseAdmin
      .from('site_content')
      .upsert({
        id: 'challenge_submissions',
        data: { submissions: submissionsList },
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to update record in DB: ' + upsertError.message }, { status: 500 });
    }

    // 6. Send Email and SMS Announcement to student if publishing results
    if (publish) {
      let registeredPhone = '';
      if (sub.email) {
        try {
          const supabaseAdmin = getSupabaseAdmin();
          const { data: memberData } = await supabaseAdmin
            .from('member')
            .select('phone')
            .eq('email', sub.email)
            .maybeSingle();
          if (memberData?.phone) {
            registeredPhone = memberData.phone;
          } else {
            const { data: ecData } = await supabaseAdmin
              .from('ec_member')
              .select('phone')
              .eq('email', sub.email)
              .maybeSingle();
            if (ecData?.phone) {
              registeredPhone = ecData.phone;
            }
          }
        } catch (dbErr) {
          console.error('Error fetching student phone for result SMS dispatch:', dbErr);
        }
      }

      const hasRealEmail = isRealEmail(sub.email);
      let phone = registeredPhone;
      if (!phone && sub.email && (sub.email.endsWith('@josephitre.club') || sub.email.endsWith('@josephite.club'))) {
        phone = sub.email.split('@')[0];
      }
      const isPhoneOnly = hasOnlyPhone(phone, sub.email);

      // Send SMS dispatch notification if user only has phone number
      if (isPhoneOnly && phone) {
        const smsMessage = `Hello ${sub.fullName}, your Math Challenge result is published! Score: ${sub.finalScore}/${sub.totalQuestions}. Check details on the Josephite Math Club portal. - Josephite Math Club`;
        try {
          const smsRes = await sendSMS(phone, smsMessage);
          if (smsRes.success) {
            console.log(`[SMS DISPATCH] Successfully sent challenge result SMS via Brevo to phone: ${phone}`);
            
            // Log sent SMS in email_confirmations_sent
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: phone,
                  recipient_name: sub.fullName || '',
                  recipient_class: '',
                  recipient_section: '',
                  recipient_roll: '',
                  subject: `[SMS] Math Challenge Result`,
                  body_text: smsMessage,
                  verified_by: 'System / Challenge Publish',
                  status: 'sent'
                }]);
            } catch (logErr) {
              console.error('[SMS LOG] Failed to log sent challenge SMS to DB:', logErr);
            }
          } else {
            const errMsg = smsRes.error?.message || 'Unknown error';
            console.error(`[SMS DISPATCH] Failed to send challenge result SMS to phone: ${phone}. Error:`, smsRes.error);
            
            // Log failed SMS in email_confirmations_sent
            try {
              await supabaseAdmin
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: phone,
                  recipient_name: sub.fullName || '',
                  recipient_class: '',
                  recipient_section: '',
                  recipient_roll: '',
                  subject: `[SMS] Math Challenge Result`,
                  body_text: smsMessage,
                  verified_by: 'System / Challenge Publish',
                  status: 'failed',
                  error_message: errMsg
                }]);
            } catch (logErr) {
              console.error('[SMS LOG] Failed to log failed challenge SMS to DB:', logErr);
            }
          }
        } catch (smsErr: any) {
          const errMsg = smsErr.message || smsErr;
          console.error(`[SMS DISPATCH] Exception sending challenge result SMS to phone: ${phone}. Error:`, smsErr);
          
          // Log failed SMS in email_confirmations_sent
          try {
            await supabaseAdmin
              .from('email_confirmations_sent')
              .insert([{
                recipient_email: phone,
                recipient_name: sub.fullName || '',
                recipient_class: '',
                recipient_section: '',
                recipient_roll: '',
                subject: `[SMS] Math Challenge Result`,
                body_text: smsMessage,
                verified_by: 'System / Challenge Publish',
                status: 'failed',
                error_message: errMsg
              }]);
          } catch (logErr) {
            console.error('[SMS LOG] Failed to log exception challenge SMS to DB:', logErr);
          }
        }
      }

      // Send Email if user has a real email address
      if (hasRealEmail && sub.email) {
        try {
          const subject = `Your Math Challenge Result has been Published!`;
          const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
              <div style="background: #18181b; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                <h2 style="color: #f59e0b; margin: 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px;">Josephite Math Club</h2>
              </div>
              <div style="padding: 30px; border: 1px border border-white/10; border-top: none; border-radius: 0 0 10px 10px; background: #fafafa;">
                <h3 style="color: #0f172a; margin-top: 0;">Hello ${sub.fullName},</h3>
                <p>The administrators have completed the final verification checks on your recent math challenge submission!</p>
                
                <div style="background: #f1f5f9; padding: 20px; border-radius: 12px; margin: 24px 0; text-align: center;">
                  <p style="font-size: 14px; color: #64748b; margin: 0 0 8px 0; uppercase; tracking: 0.1em;">Final Published Score</p>
                  <p style="font-size: 36px; font-weight: bold; color: #0d9488; margin: 0;">${sub.finalScore} / ${sub.totalQuestions}</p>
                </div>

                ${sub.feedback ? `
                  <div style="margin-bottom: 24px;">
                    <strong style="color: #0f172a;">Review Feedback & Comments:</strong>
                    <p style="font-style: italic; color: #475569; background: #fff; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; box-shadow: 0 1px 2px rgba(0,0,0,0.05);">${sub.feedback}</p>
                  </div>
                ` : ''}

                <p>You can now open the <strong>Challenge Problems</strong> portal at any time to view your fully corrected paper, feedback, and question answer keys.</p>
                
                <div style="text-align: center; margin: 32px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL ? `https://${process.env.NEXT_PUBLIC_APP_URL}/challenge-problems` : '#'}" style="background: #0f172a; color: #ffffff; padding: 12px 30px; border-radius: 9999px; text-decoration: none; font-size: 14px; font-weight: bold;">View Detailed Solutions</a>
                </div>

                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
                <p style="font-size: 12px; color: #94a3b8; margin: 0; text-align: center;">
                  This is an automated result dispatch system. Please do not reply directly to this email.
                </p>
              </div>
            </div>
          `;

          await sendEmail({
            to: sub.email,
            subject,
            html: htmlContent
          });
        } catch (emailErr) {
          console.error('Failed to dispatch result email to student:', emailErr);
        }
      }
    }

    return NextResponse.json({ success: true, submission: sub });

  } catch (error: any) {
    console.error('Update Submission API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE submission (super admin only)
export async function DELETE(req: Request) {
  try {
    const isSuperAdmin = await isCallerSuperAdmin();
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Permission denied. Only Super Admins can delete student submissions.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId');

    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID is required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Delete from dedicated challenge_submissions table
    try {
      const { error: dbDeleteError } = await supabaseAdmin
        .from('challenge_submissions')
        .delete()
        .eq('id', submissionId);
      
      if (dbDeleteError) {
        console.error('Failed to delete from challenge_submissions table:', dbDeleteError.message);
      }
    } catch (err) {
      console.error('Error on challenge_submissions table delete:', err);
    }

    // 2. Fetch current submissions list from site_content
    const { data: subRow, error: subError } = await supabaseAdmin
      .from('site_content')
      .select('data')
      .eq('id', 'challenge_submissions')
      .maybeSingle();

    if (subError || !subRow) {
      return NextResponse.json({ error: 'Failed to access submissions.' }, { status: 500 });
    }

    let submissionsList = [];
    if (subRow.data && Array.isArray(subRow.data.submissions)) {
      submissionsList = subRow.data.submissions;
    }

    // 3. Filter out targeted submission
    const updatedList = submissionsList.filter((s: any) => s.id !== submissionId);

    if (submissionsList.length === updatedList.length) {
      return NextResponse.json({ error: 'Submission not found in the records.' }, { status: 404 });
    }

    // 4. Save list back to database
    const { error: upsertError } = await supabaseAdmin
      .from('site_content')
      .upsert({
        id: 'challenge_submissions',
        data: { submissions: updatedList },
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to delete record in DB: ' + upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'Submission deleted successfully.' });

  } catch (error: any) {
    console.error('Delete Submission API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
