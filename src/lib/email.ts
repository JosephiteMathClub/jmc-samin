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
export const sendEmail = async (options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: Error }> => {
  const rawFromEmail = process.env.SMTP_FROM_MAIL || process.env.SMTP_FROM_EMAIL || 'mathclub@sjs.edu.bd';
  const fromName = process.env.SMTP_FROM_NAME || 'Josephite Math Club';

  // Helper to extract a pure email address from strings like '"Name" <email@domain.com>' or plain 'email@domain.com'
  const cleanEmailAddress = (emailStr: string): string => {
    const match = emailStr.match(/<([^>]+)>/);
    if (match && match[1]) {
      return match[1].trim();
    }
    return emailStr.replace(/["']/g, '').trim();
  };

  const fromEmail = cleanEmailAddress(rawFromEmail);

  const rawApiKey = process.env.BREVO_API_KEY;
  const hasBrevoApiKey = rawApiKey && 
                         rawApiKey.trim() !== '' && 
                         !rawApiKey.includes('your-brevo-api-key-here') &&
                         !rawApiKey.startsWith('your-');

  // 1. Try Brevo API first (Recommended for serverless/Netlify)
  if (hasBrevoApiKey) {
    console.log(`[Email] Attempting to send via Brevo API to ${options.to}...`);
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': rawApiKey!,
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

        const rawSmtpUser = process.env.SMTP_USER;
        const fallbackSmtpAvailable = rawSmtpUser && 
                                      rawSmtpUser.trim() !== '' && 
                                      !rawSmtpUser.includes('your-smtp-user') &&
                                      !rawSmtpUser.startsWith('your-');

        // Only fallback if we have SMTP credentials and it's not a definitive API failure
        if (!fallbackSmtpAvailable) {
          return { success: false, error: new Error(customError) };
        }
        console.log('Falling back to SMTP due to API error...');
      } else {
        const data = await response.json();
        console.log(`[Email] Successfully sent via Brevo API: ${data.messageId}`);
        return { success: true, messageId: data.messageId };
      }
    } catch (error: any) {
      console.error('Brevo API fetch error:', error);
      const rawSmtpUser = process.env.SMTP_USER;
      const fallbackSmtpAvailable = rawSmtpUser && 
                                    rawSmtpUser.trim() !== '' && 
                                    !rawSmtpUser.includes('your-smtp-user') &&
                                    !rawSmtpUser.startsWith('your-');
      if (!fallbackSmtpAvailable) return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
    }
  } else {
    console.warn('[Email] BREVO_API_KEY is not set or is using placeholder. Falling back to SMTP. WARNING: SMTP is highly prone to IP authorization issues on dynamic hosts like Netlify.');
  }

  const rawSmtpUser = process.env.SMTP_USER;
  const isSmtpUserValid = rawSmtpUser && 
                          rawSmtpUser.trim() !== '' && 
                          !rawSmtpUser.includes('your-smtp-user') &&
                          !rawSmtpUser.startsWith('your-');

  // 2. Fallback to SMTP
  const smtpConfig = {
    host: process.env.SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: rawSmtpUser,
      pass: process.env.SMTP_PASS,
    },
  };

  if (!isSmtpUserValid) {
    return { 
      success: false, 
      error: new Error('Email configuration missing or using invalid placeholder keys. Please provide a valid BREVO_API_KEY (Highly Recommended) or active SMTP_USER & SMTP_PASS in your environment variables via AI Studio Settings.') 
    };
  }

  try {
    const transporter = nodemailer.createTransport(smtpConfig);
    const info = await transporter.sendMail({
      from: {
        name: fromName,
        address: fromEmail
      },
      envelope: {
        from: fromEmail,
        to: options.to
      },
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

/**
 * Sends a transactional SMS using Brevo REST API
 */
export const sendSMS = async (to: string, content: string): Promise<{ success: boolean; data?: any; error?: Error }> => {
  const rawApiKey = process.env.BREVO_API_KEY;
  const hasBrevoApiKey = rawApiKey && 
                         rawApiKey.trim() !== '' && 
                         !rawApiKey.includes('your-brevo-api-key-here') &&
                         !rawApiKey.startsWith('your-');

  if (!hasBrevoApiKey) {
    console.warn('[SMS] BREVO_API_KEY is not set or is using placeholder. SMS cannot be sent via Brevo.');
    return { success: false, error: new Error('BREVO_API_KEY is missing or invalid') };
  }

  // Format phone number for Bangladesh (E.164 with + prefix)
  let cleanPhone = to.replace(/[^0-9+]/g, '');
  if (cleanPhone.startsWith('01') && cleanPhone.length === 11) {
    cleanPhone = '+88' + cleanPhone;
  } else if (cleanPhone.startsWith('1') && cleanPhone.length === 10) {
    cleanPhone = '+880' + cleanPhone;
  } else if (cleanPhone.startsWith('880') && !cleanPhone.startsWith('+')) {
    cleanPhone = '+' + cleanPhone;
  } else if (!cleanPhone.startsWith('+') && cleanPhone.length > 0) {
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '+88' + cleanPhone;
    } else {
      cleanPhone = '+' + cleanPhone;
    }
  }

  console.log(`[SMS] Attempting to send SMS via Brevo API to ${cleanPhone}...`);

  try {
    const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': rawApiKey!,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: 'SJSMathClub', // Max 11 alphanumeric characters
        recipient: cleanPhone,
        content: content,
        type: 'transactional'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Brevo SMS API Error:', errorData);
      return { success: false, error: new Error(`Brevo SMS API Error: ${errorData}`) };
    } else {
      const data = await response.json();
      console.log(`[SMS] Successfully sent SMS via Brevo API:`, data);
      return { success: true, data };
    }
  } catch (error: any) {
    console.error('Brevo SMS API fetch error:', error);
    return { success: false, error: error instanceof Error ? error : new Error(String(error)) };
  }
};

/**
 * Checks if an email address is a real, non-placeholder email.
 */
export function isRealEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return clean.includes('@') && !clean.endsWith('@josephite.club') && !clean.endsWith('@josephitre.club') && !clean.endsWith('@josephitemathclub');
}

/**
 * Checks if a user has only a phone number (meaning they have a phone, and no real email).
 */
export function hasOnlyPhone(phone: string | null | undefined, email: string | null | undefined): boolean {
  const hasPhone = !!(phone && phone.trim() !== '');
  const hasEmail = isRealEmail(email);
  return hasPhone && !hasEmail;
}


