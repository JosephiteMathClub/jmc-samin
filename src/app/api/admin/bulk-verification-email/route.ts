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
      
      const subject = `Registration Pending - Action Required for Josephite Math Club!`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h1 style="color: #0c4a6e;">Hello ${m.fullName},</h1>
          <p>Thank you for registering with the Josephite Math Club!</p>
          <p>This is a reminder that your registration is currently <strong>PENDING</strong> verification.</p>
          <p>Please ensure you have completed the payment process as per the instructions on the website. Once our team confirms your payment, your membership will be activated and you will receive your Unique Member ID.</p>
          <br/>
          <p><strong>Member ID (Temporary):</strong> ${m.memberId || 'Calculating...'}</p>
          <p>If you have already paid, please ignore this email and allow 24-48 hours for verification.</p>
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
    console.error('Verification Email API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
