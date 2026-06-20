import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

function getSupabaseAdmin() {
  let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
  let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
  
  if (!url || !key) {
    throw new Error('Supabase admin environment variables are missing');
  }

  if (!url.startsWith('http')) {
    url = `https://${url}`;
  }
  url = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

function replacePlaceholders(template: string, row: any, email: string) {
  const category = row.tableName === 'primary_events' ? 'Primary' :
                   row.tableName === 'junior_events' ? 'Junior' :
                   row.tableName === 'secondary_events' ? 'Secondary' :
                   row.tableName === 'higher_secondary_events' ? 'Higher Secondary' : 'General';
  const status = row.verified === 'yes' ? 'Approved' : 'Pending Verification';
  
  return template
    .replace(/{NAME}/g, row.full_name || row.recipient_name || '')
    .replace(/{EVENTS}/g, row.selected_events || '')
    .replace(/{CATEGORY}/g, category)
    .replace(/{CLASS}/g, String(row.class || ''))
    .replace(/{ROLL}/g, String(row.roll || ''))
    .replace(/{TRXNID}/g, row.trxnid || '')
    .replace(/{STATUS}/g, status)
    .replace(/{EMAIL}/g, email || '');
}

export async function POST(req: Request) {
  try {
    const { 
      customRecipients, 
      tableNameFilter, 
      verificationFilter, 
      subject, 
      htmlTemplate, 
      verifiedBy 
    } = await req.json();

    if (!subject || !htmlTemplate) {
      return NextResponse.json({ error: 'Missing subject or template' }, { status: 400 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server configuration error: Service Role Key missing' }, { status: 500 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    let targets: any[] = [];

    // If active rows are chosen and sent from Front-End
    if (customRecipients && Array.isArray(customRecipients) && customRecipients.length > 0) {
      targets = customRecipients;
    } else {
      // Query the database tables based on filter criteria
      // First, get all profiles to map user_id to active email addresses
      const { data: profiles, error: pError } = await supabaseAdmin
        .from('profiles')
        .select('id, email');
      
      if (pError) {
        console.error('Error fetching admin profiles for match:', pError);
      }

      const profilesMap: Record<string, string> = {};
      if (profiles) {
        profiles.forEach((p) => {
          if (p.id && p.email) {
            profilesMap[p.id] = p.email;
          }
        });
      }

      const targetTables = tableNameFilter && tableNameFilter !== 'all' 
        ? [tableNameFilter] 
        : ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];

      for (const table of targetTables) {
        let query = supabaseAdmin.from(table).select('*');
        if (verificationFilter && verificationFilter !== 'all') {
          query = query.eq('verified', verificationFilter);
        }

        const { data, error: tableError } = await query;
        if (tableError) {
          console.error(`Error querying database registrants in table ${table}:`, tableError);
          continue;
        }

        if (data) {
          data.forEach((row: any) => {
            // Find appropriate email for dispatch
            let resolvedEmail = profilesMap[row.user_id] || '';
            if (!resolvedEmail && row.registered_by && row.registered_by.includes('@')) {
              resolvedEmail = row.registered_by;
            }

            if (resolvedEmail && resolvedEmail.trim() !== '') {
              targets.push({
                ...row,
                tableName: table,
                email: resolvedEmail
              });
            }
          });
        }
      }
    }

    if (targets.length === 0) {
      return NextResponse.json({ success: true, sentCount: 0, failedCount: 0, message: 'No registrants with valid email addresses found matching the selected filters.' });
    }

    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    // Send emails
    const emailPromises = targets.map(async (row: any) => {
      const email = row.email || '';
      if (!email || !email.includes('@')) {
        failedCount++;
        return;
      }

      const customizedHtml = replacePlaceholders(htmlTemplate, row, email);
      const customizedSubject = replacePlaceholders(subject, row, email);

      try {
        const result = await sendEmail({
          to: email,
          subject: customizedSubject,
          html: customizedHtml
        });

        // Insert log record to email_confirmations_sent
        const logData = {
          recipient_email: email,
          recipient_name: row.full_name || '',
          recipient_class: String(row.class || ''),
          recipient_section: String(row.section || ''),
          recipient_roll: String(row.roll || ''),
          subject: customizedSubject,
          body_text: `BULK BROADCAST: ${customizedSubject}. (Email body sent in custom template)`,
          verified_by: verifiedBy || 'Admin',
          status: result.success ? 'sent' : 'failed',
          error_message: result.success ? null : (result.error?.message || 'Failed email delivery')
        };

        await supabaseAdmin
          .from('email_confirmations_sent')
          .insert([logData]);

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          errors.push(`Failed for ${email}: ${result.error?.message || 'Unknown delivery failure'}`);
        }
      } catch (e: any) {
        failedCount++;
        errors.push(`System error for ${email}: ${e.message}`);
        
        try {
          // Log even the exception failure
          await supabaseAdmin
            .from('email_confirmations_sent')
            .insert([{
              recipient_email: email,
              recipient_name: row.full_name || '',
              recipient_class: String(row.class || ''),
              recipient_section: String(row.section || ''),
              recipient_roll: String(row.roll || ''),
              subject: customizedSubject,
              body_text: `BULK BROADCAST: ${customizedSubject}`,
              verified_by: verifiedBy || 'Admin',
              status: 'failed',
              error_message: e.message || 'Execution error during sendEmail'
            }]);
        } catch (innerErr) {
          console.error('Failed to log email confirmation exception:', innerErr);
        }
      }
    });

    await Promise.all(emailPromises);

    return NextResponse.json({
      success: true,
      totalTargeted: targets.length,
      sentCount,
      failedCount,
      errors
    });

  } catch (error: any) {
    console.error('Bulk Event Email execution error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error during broadcast.' }, { status: 500 });
  }
}
