import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/email';

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
      .select('member_id, full_name, email, email_address')
      .in('member_id', memberIds);

    if (memError) {
      return NextResponse.json({ error: memError.message }, { status: 500 });
    }

    if (!members) {
      return NextResponse.json({ error: 'No member data found' }, { status: 500 });
    }

    // Create a map of member_id to email
    const memberMap = new Map();
    members.forEach(m => memberMap.set(m.member_id, {
      full_name: m.full_name,
      email: m.email_address || m.email
    }));

    // 3. Process each participant and send email
    let sentCount = 0;
    const errors: string[] = [];

    // Since sending emails sequentially might take a bit, we use Promise.all locally with chunking,
    // but for simplicity we will do a simple sequential sending or Promise.all directly.
    const emailPromises = participations.map(async (p) => {
      const memberInfo = memberMap.get(p.member_id);
      if (!memberInfo || !memberInfo.email) return;

      let subject = '';
      let htmlContent = '';

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
      }

      try {
        await sendEmail({
          to: memberInfo.email,
          subject,
          html: htmlContent
        });
        sentCount++;
      } catch (e: any) {
        errors.push(`Failed to send to ${memberInfo.email}: ${e.message}`);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, sentCount, errors });
  } catch (error: any) {
    console.error('Announce Results API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
