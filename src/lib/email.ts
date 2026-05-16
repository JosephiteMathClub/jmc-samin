import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

/**
 * Sends an email using Brevo REST API or SMTP Fallback
 */
export const sendEmail = async (options: EmailOptions) => {
  const fromEmail = process.env.SMTP_FROM_EMAIL || 'mathclub@sjs.edu.bd';
  const fromName = process.env.SMTP_FROM_NAME || 'Josephite Math Club';

  // 1. Try Brevo API first (Recommended for serverless/Netlify)
  if (process.env.BREVO_API_KEY) {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: options.to }],
          subject: options.subject,
          htmlContent: options.html || options.text,
          textContent: options.text,
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Brevo API Error:', errorData);
        // Do not fallback to SMTP if Brevo API was explicitly provided but failed
        // It usually means the Sender Email is not verified on Brevo.
        return { success: false, error: new Error(`Brevo API Error: ${errorData}`) };
      } else {
        const data = await response.json();
        return { success: true, messageId: data.messageId };
      }
    } catch (error) {
      console.error('Brevo API fetch error:', error);
      return { success: false, error };
    }
  }

  // 2. Fallback to SMTP
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  };

  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('SMTP Error:', error);
    return { success: false, error };
  }
};
