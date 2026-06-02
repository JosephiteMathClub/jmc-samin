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
      
      const subject = m.isVerification 
        ? `Your registration has been verified - Welcome to Josephite Math Club!`
        : `Registration Successful - Welcome to Josephite Math Club!`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
          <h2 style="color: #0c4a6e; border-bottom: 2px solid #0c4a6e; padding-bottom: 10px;">
            ${m.isVerification ? 'Your registration has been verified!' : `Welcome to JMC, ${m.fullName}!`}
          </h2>
          <p>Your registration for the Josephite Math Club is officially complete.</p>
          <p>We are thrilled to have you on board. Below are your membership details:</p>
          <div style="background: #f0fdf4; padding: 15px; border-left: 4px solid #22c55e; border-radius: 4px; margin: 15px 0;">
            <ul style="list-style: none; padding: 0; margin: 0;">
              <li style="margin-bottom: 6px;"><strong>Name:</strong> ${m.fullName}</li>
              <li><strong>Member ID:</strong> <span style="font-family: monospace; font-size: 16px; color: #15803d; font-weight: bold;">${m.memberId || 'Pending'}</span></li>
            </ul>
          </div>
          <p>Make sure to keep your Member ID handy for upcoming events and competitions.</p>
          <br/>
          <p>Best regards,<br/>The Josephite Math Club Team</p>
        </div>
      `;

      try {
        const result = await sendEmail({
          to: m.email,
          subject,
          html: htmlContent
        });
        if (!result.success) {
          throw result.error || new Error('Failed to send email via SMTP provider.');
        }
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
