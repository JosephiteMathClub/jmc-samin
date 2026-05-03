import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';

export async function GET() {
  const result = await sendEmail({
    to: 'l47idkpro@gmail.com',
    subject: 'Josephite Math Club - SMTP Demo',
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333; border: 1px solid #e5e7eb; border-radius: 8px;">
        <h1 style="color: #0c4a6e;">SMTP Setup Successful!</h1>
        <p>This is a demo email sent from the <strong>Josephite Math Club</strong> website.</p>
        <p>Your SMTP configuration (Brevo) is now active and ready to handle contact forms and registrations.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280;">Sent via Josephite Math Club Automated System</p>
      </div>
    `,
  });

  if (result.success) {
    return NextResponse.json({ message: 'Demo email sent successfully to l47idkpro@gmail.com', messageId: result.messageId });
  } else {
    return NextResponse.json({ error: 'Failed to send email', details: result.error }, { status: 500 });
  }
}
