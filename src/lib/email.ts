import nodemailer from 'nodemailer';

// Fallback SMTP configuration
const smtpConfig = {
  host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using SMTP (configured for Brevo, Gmail, etc.)
 */
export const sendEmail = async (options: EmailOptions) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'club@josephite.org';
  const fromName = process.env.SMTP_FROM_NAME || 'Josephite Math Club';

  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    console.log('Email sent successfully via SMTP:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Error:', error);
    return { success: false, error };
  }
};
