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
    console.log(`[Email] Attempting to send via Brevo API to ${options.to}...`);
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
        
        let customError = `Brevo API Error: ${errorData}`;

        // If it's a sender error
        if (errorData.includes('invalid_parameter') && errorData.includes('sender')) {
          customError = `Sender Error: The email "${fromEmail}" is not a verified sender in your Brevo account. Please add it in Brevo "Senders" settings.`;
        }

        // If it's an IP error
        if (errorData.includes('unauthorized_ip') || errorData.includes('unauthorized IP')) {
          customError = `IP Restriction: This IP address is blocked by Brevo. 1. Go to Brevo Security settings and REMOVE all Authorized IPs. 2. Ensure you are using the correct API Key.`;
        }

        // Only fallback if we have SMTP credentials and it's not a definitive API failure
        if (!process.env.SMTP_USER) {
          return { success: false, error: new Error(customError) };
        }
        console.log('Falling back to SMTP due to API error...');
      } else {
        const data = await response.json();
        console.log(`[Email] Successfully sent via Brevo API: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
    } catch (error) {
      console.error('Brevo API fetch error:', error);
      if (!process.env.SMTP_USER) return { success: false, error };
    }
  } else {
    console.warn('[Email] BREVO_API_KEY is not set. Falling back to SMTP. WARNING: SMTP is highly prone to IP authorization issues on dynamic hosts like Netlify.');
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

  if (!process.env.SMTP_USER) {
    return { 
      success: false, 
      error: new Error('Email configuration missing. Please provide BREVO_API_KEY (Recommended) or SMTP_USER/SMTP_PASS in your environment variables.') 
    };
  }

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
  } catch (error: any) {
    console.error('SMTP Error:', error);
    const errorMsg = error.message || '';
    
    // Clearer error reporting for users
    if (errorMsg.includes('535') || errorMsg.includes('Authentication failed')) {
       return { 
         success: false, 
         error: new Error('Brevo SMTP Authentication Failed. TIP: Ensure you are using your generated SMTP KEY as the password, NOT your account login password. Better yet, use the BREVO_API_KEY variable which bypasses SMTP and IP restrictions entirely.') 
       };
    }

    if (errorMsg.includes('525') || errorMsg.includes('unauthorized IP') || errorMsg.includes('unauthorized_ip')) {
       return { 
         success: false, 
         error: new Error('Brevo SMTP rejected this IP (Unauthorized IP Address). TO FIX: 1. Go to Brevo Security settings and clear Authorized IPs. 2. BEST SOLUTION: Generate a Brevo API Key and use the BREVO_API_KEY environment variable to bypass all IP restrictions.') 
       };
    }
    return { success: false, error: new Error(`SMTP Error: ${errorMsg}`) };
  }
};
