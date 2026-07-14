import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail, sendSMS, isRealEmail, hasOnlyPhone } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { eventName, category } = await req.json();

    if (!eventName || !category) {
      return NextResponse.json({ error: 'Missing eventName or category' }, { status: 400 });
    }

    // 1. Fetch participations for this event and category
    const { data: participations, error: partError } = await supabase
      .from('event_participation')
      .select('member_id, position')
      .eq('event_name', eventName)
      .eq('category', category);

    if (partError) {
      return NextResponse.json({ error: partError.message }, { status: 500 });
    }

    if (!participations || participations.length === 0) {
      return NextResponse.json({ success: true, message: 'No participants found to announce results.' });
    }

    const memberIds = participations.map(p => p.member_id);

    // 2. Fetch member details directly from supabase
    const { data: members, error: memError } = await supabase
      .from('member')
      .select('member_id, full_name, email, email_address, phone')
      .in('member_id', memberIds);

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 500 });
    }

    if (!members) {
      return NextResponse.json({ error: 'No member data found' }, { status: 500 });
    }

    // Create a map of member_id to email and phone
    const memberMap = new Map();
    members.forEach(m => memberMap.set(m.member_id, {
      full_name: m.full_name,
      email: m.email_address || m.email,
      phone: m.phone
    }));

    // 3. Process each participant and send email or SMS in batches of 10
    let sentCount = 0;
    const errors: string[] = [];

    const batchSize = 10;
    for (let i = 0; i < participations.length; i += batchSize) {
      const batch = participations.slice(i, i + batchSize);
      await Promise.all(batch.map(async (p) => {
        const memberInfo = memberMap.get(p.member_id);
        if (!memberInfo) return;

        const hasRealEmail = isRealEmail(memberInfo.email);
        const isPhoneOnly = hasOnlyPhone(memberInfo.phone, memberInfo.email);

        if (!hasRealEmail && !isPhoneOnly) return;

        let subject = '';
        let htmlContent = '';
        let smsContent = '';

        if (p.position && p.position > 0) {
          // Winner
          let posText = p.position === 1 ? '1st' : p.position === 2 ? '2nd' : p.position === 3 ? '3rd' : `${p.position}th`;
          subject = `Congratulations! You got ${posText} place at ${eventName}`;
          htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h1 style="color: #0c4a6e;">Congratulations ${memberInfo.full_name},</h1>
              <p>We are thrilled to let you know that you have secured the <strong>${posText} position</strong> in <strong>${eventName}</strong> (${category} category)!</p>
              <p>Your hard work and dedication have paid off. Stay tuned for further announcements regarding awards and certificates.</p>
              <br/>
              <p>Best regards,<br/>The Josephite Math Club Team</p>
            </div>
          `;
          smsContent = `Congratulations ${memberInfo.full_name}! You secured ${posText} place in ${eventName} (${category} category)! - Josephite Math Club`;
        } else {
          // Not qualified / No position
          subject = `Participation Result for ${eventName}`;
          htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h1 style="color: #0c4a6e;">Hello ${memberInfo.full_name},</h1>
              <p>The results for <strong>${eventName}</strong> (${category} category) are out.</p>
              <p>We are sorry to inform you that you haven't been qualified for a position this time.</p>
              <p>Don't be discouraged! Every competition is a step towards learning. Keep practicing and we hope to see your brilliant performance in upcoming events!</p>
              <br/>
              <p>Best regards,<br/>The Josephite Math Club Team</p>
            </div>
          `;
          smsContent = `Hello ${memberInfo.full_name}, results for ${eventName} (${category} category) are out. Thank you for your participation. Keep practicing! - Josephite Math Club`;
        }

        // If user has both, or only has a real email, send to email only.
        if (hasRealEmail) {
          try {
            const result = await sendEmail({
              to: memberInfo.email,
              subject,
              html: htmlContent
            });
            if (!result.success) {
              throw result.error || new Error('Failed to send email via SMTP provider.');
            }
            sentCount++;
          } catch (e: any) {
            errors.push(`Failed to send email to ${memberInfo.email}: ${e.message}`);
          }
        } 
        // If user only has a phone number (no real email), send to phone via Brevo SMS.
        else if (isPhoneOnly) {
          try {
            const smsRes = await sendSMS(memberInfo.phone, smsContent);
            if (smsRes.success) {
              console.log(`[SMS DISPATCH] Successfully sent result SMS via Brevo to participant phone: ${memberInfo.phone}`);
              sentCount++;

              // Log sent SMS in email_confirmations_sent
              try {
                await supabase
                  .from('email_confirmations_sent')
                  .insert([{
                    recipient_email: memberInfo.phone || 'Unknown Phone',
                    recipient_name: memberInfo.full_name || '',
                    recipient_class: '',
                    recipient_section: '',
                    recipient_roll: '',
                    subject: `[SMS] Event Result: ${eventName}`,
                    body_text: smsContent,
                    verified_by: 'System / Results Announcement',
                    status: 'sent'
                  }]);
              } catch (logErr) {
                console.error('[SMS LOG] Failed to log sent SMS to DB:', logErr);
              }
            } else {
              const errMsg = smsRes.error?.message || 'Unknown error';
              console.error(`[SMS DISPATCH] Failed to send result SMS to participant phone: ${memberInfo.phone}. Error:`, smsRes.error);
              errors.push(`Failed to send SMS to ${memberInfo.phone}: ${errMsg}`);

              // Log failed SMS in email_confirmations_sent
              try {
                await supabase
                  .from('email_confirmations_sent')
                  .insert([{
                    recipient_email: memberInfo.phone || 'Unknown Phone',
                    recipient_name: memberInfo.full_name || '',
                    recipient_class: '',
                    recipient_section: '',
                    recipient_roll: '',
                    subject: `[SMS] Event Result: ${eventName}`,
                    body_text: smsContent,
                    verified_by: 'System / Results Announcement',
                    status: 'failed',
                    error_message: errMsg
                  }]);
              } catch (logErr) {
                console.error('[SMS LOG] Failed to log failed SMS to DB:', logErr);
              }
            }
          } catch (smsErr: any) {
            const errMsg = smsErr.message || smsErr;
            console.error(`[SMS DISPATCH] Exception sending result SMS to participant phone: ${memberInfo.phone}. Error:`, smsErr);
            errors.push(`Failed to send SMS to ${memberInfo.phone}: ${errMsg}`);

            // Log failed SMS in email_confirmations_sent
            try {
              await supabase
                .from('email_confirmations_sent')
                .insert([{
                  recipient_email: memberInfo.phone || 'Unknown Phone',
                  recipient_name: memberInfo.full_name || '',
                  recipient_class: '',
                  recipient_section: '',
                  recipient_roll: '',
                  subject: `[SMS] Event Result: ${eventName}`,
                  body_text: smsContent,
                  verified_by: 'System / Results Announcement',
                  status: 'failed',
                  error_message: errMsg
                }]);
            } catch (logErr) {
              console.error('[SMS LOG] Failed to log failed SMS to DB:', logErr);
            }
          }
        }
      }));
    }

    try {
      const { data: currentSettings } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'announced_results')
        .maybeSingle();

      let announcedList: string[] = [];
      if (currentSettings && currentSettings.value && Array.isArray(currentSettings.value)) {
        announcedList = currentSettings.value as string[];
      }

      const itemToAnnounce = `${eventName} - ${category}`.trim();
      if (!announcedList.some(item => item.toLowerCase() === itemToAnnounce.toLowerCase())) {
        announcedList.push(itemToAnnounce);
        await supabase
          .from('system_settings')
          .upsert({
            key: 'announced_results',
            value: announcedList
          });
      }
    } catch (settingError) {
      console.error('Failed to update system_settings for announced_results:', settingError);
    }

    return NextResponse.json({ success: true, sentCount, errors });
  } catch (error: any) {
    console.error('Announce Results API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
