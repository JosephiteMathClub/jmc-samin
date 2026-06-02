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
      
      const subject = `Registration Request Received - Josephite Math Club`;
      const htmlContent = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6; padding: 20px; border: 1px solid #e5e7eb; rounded-2xl;">
          <h2 style="color: #0c4a6e; border-bottom: 2px solid #0c4a6e; padding-bottom: 10px;">Hello ${m.fullName},</h2>
          <p>Thank you for registering with the Josephite Math Club!</p>
          <p style="background: #fffbeb; padding: 15px; border-left: 4px solid #f59e0b; font-weight: 500; font-size: 15px; color: #b45309;">
            Your registration request has been sent to administration. Please wait for a few hours until verified.
          </p>
          <p>Once our administrative team verifies your payment details, you will receive another email containing your Unique Member ID and access instructions.</p>
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
