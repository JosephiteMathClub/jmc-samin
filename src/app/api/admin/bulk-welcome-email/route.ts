import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const { members } = await req.json();

    if (!members || !Array.isArray(members)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    let sentCount = 0;
    const errors: string[] = [];

    const emailPromises = members.map(async (m: any) => {
      if (!m.email || !m.fullName) return;
      
      const subject = `Registration Successful - Welcome to Josephite Math Club!`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #0c4a6e;">Welcome to JMC, ${m.fullName}!</h1>
          <p>Your registration for the Josephite Math Club is officially complete.</p>
          <p>We are thrilled to have you on board. Below are your membership details:</p>
          <ul>
            <li><strong>Name:</strong> ${m.fullName}</li>
            <li><strong>Member ID:</strong> ${m.memberId || 'Pending'}</li>
          </ul>
          <p>Make sure to keep your Member ID handy for upcoming events and competitions.</p>
          <br/>
          <p>Best regards,<br/>The Josephite Math Club Team</p>
        </div>
      `;

      try {
        await sendEmail({
          to: m.email,
          subject,
          html: htmlContent
        });
        sentCount++;
      } catch (e: any) {
        errors.push(`Failed to send to ${m.email}: ${e.message}`);
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({ success: true, sentCount, errors });
  } catch (error: any) {
    console.error('Welcome Email API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
