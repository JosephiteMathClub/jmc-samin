import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    BREVO_API_KEY: !!process.env.BREVO_API_KEY,
    SMTP_HOST: !!process.env.SMTP_HOST,
    SMTP_PORT: !!process.env.SMTP_PORT,
    SMTP_USER: !!process.env.SMTP_USER,
    SMTP_PASS: !!process.env.SMTP_PASS,
    SMTP_FROM_EMAIL: !!process.env.SMTP_FROM_EMAIL,
    SMTP_FROM_NAME: !!process.env.SMTP_FROM_NAME,
    current_from_email: process.env.SMTP_FROM_EMAIL || 'mathclub@sjs.edu.bd',
    is_api_mode: !!process.env.BREVO_API_KEY,
    recommendation: !process.env.BREVO_API_KEY ? 'Switch to BREVO_API_KEY to bypass SMTP and IP restrictions.' : 'Using API mode. Ensure sender email is verified in Brevo.'
  });
}
