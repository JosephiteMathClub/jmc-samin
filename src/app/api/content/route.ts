import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { DEFAULT_CONTENT } from '@/data/default-content';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '@/lib/email';

const CONTENT_FILE = path.join(process.cwd(), 'src/data/site-content.json');

async function sendNoticeNotifications(newlyAddedNotices: any[]) {
  try {
    const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
    const key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    
    if (!url || !key) {
      console.warn('[Notices] Supabase admin environment variables are missing. Skipping notifications.');
      return;
    }

    const supabaseAdmin = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Fetch all unique emails from profiles, member & ec_member tables and merge them
    const mergedMap = new Map<string, { email: string; name: string }>();

    // 1. Profiles
    try {
      const { data: profiles, error } = await supabaseAdmin
        .from('profiles')
        .select('email, full_name');
      
      if (error) {
        console.error('[Notices] Error fetching profiles:', error);
      } else if (profiles) {
        profiles.forEach(p => {
          const email = (p.email || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            mergedMap.set(email, {
              email,
              name: (p.full_name || '').trim() || 'JMC Member',
            });
          }
        });
      }
    } catch (err) {
      console.error('[Notices] Profiles fetch exception:', err);
    }

    // 2. Members
    try {
      const { data: members, error } = await supabaseAdmin
        .from('member')
        .select('email, email_address, full_name');
      
      if (error) {
        console.error('[Notices] Error fetching members:', error);
      } else if (members) {
        members.forEach(m => {
          const email = (m.email || m.email_address || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            const existing = mergedMap.get(email);
            mergedMap.set(email, {
              email,
              name: existing?.name && existing.name !== 'JMC Member'
                ? existing.name
                : ((m.full_name || '').trim() || existing?.name || 'JMC Member'),
            });
          }
        });
      }
    } catch (err) {
      console.error('[Notices] Members fetch exception:', err);
    }

    // 3. EC Members
    try {
      const { data: ecMembers, error } = await supabaseAdmin
        .from('ec_member')
        .select('email, email_address, full_name');
      
      if (error) {
        console.error('[Notices] Error fetching ec_members:', error);
      } else if (ecMembers) {
        ecMembers.forEach(ec => {
          const email = (ec.email || ec.email_address || '').trim().toLowerCase();
          if (email && email.includes('@')) {
            const existing = mergedMap.get(email);
            mergedMap.set(email, {
              email,
              name: existing?.name && existing.name !== 'JMC Member'
                ? existing.name
                : ((ec.full_name || '').trim() || existing?.name || 'JMC Member'),
            });
          }
        });
      }
    } catch (err) {
      console.error('[Notices] EC Members fetch exception:', err);
    }

    const recipientList = Array.from(mergedMap.values());
    if (recipientList.length === 0) {
      console.log('[Notices] No registered emails found to notify.');
      return;
    }

    console.log(`[Notices] Found ${recipientList.length} unique registered email(s). Sending notifications...`);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://josephitemathclub.org';
    const noticeBoardUrl = `${appUrl.replace(/\/$/, '')}/notices`;
    const year = new Date().getFullYear();

    // Send emails for each newly added notice
    for (const notice of newlyAddedNotices) {
      const title = notice.title || 'New Notice Published';
      const type = notice.type || 'General';
      const content = notice.content || '';
      const date = notice.date || new Date().toLocaleDateString();

      // Send emails in parallel batches of 10
      const batchSize = 10;
      for (let i = 0; i < recipientList.length; i += batchSize) {
        const batch = recipientList.slice(i, i + batchSize);
        await Promise.all(
          batch.map(async (recipient) => {
            const subject = `[Josephite Math Club] New Notice: ${title}`;
            
            const plainText = `Dear ${recipient.name},\n\nA new notice has been published on the official Josephite Math Club notice board.\n\nNotice Details:\nTitle: ${title}\nDate: ${date}\nCategory: ${type}\n\nContent:\n${content}\n\nYou can view the full notice board and other bulletins at: ${noticeBoardUrl}\n\nRegards,\nJosephite Math Club`;

            const htmlContent = `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1e293b; line-height: 1.6;">
                <div style="text-align: center; border-bottom: 2px solid #f59e0b; padding-bottom: 20px; margin-bottom: 25px;">
                  <h1 style="color: #0f172a; margin: 0; font-size: 24px;">Josephite Math Club</h1>
                  <p style="color: #64748b; margin: 5px 0 0 0; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">New Notice Board Bulletin</p>
                </div>
                
                <div style="font-size: 16px; color: #0f172a;">
                  <p>Dear ${recipient.name},</p>
                  <p>A new notice has been published on the official Josephite Math Club notice board.</p>
                  
                  <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
                    <h3 style="margin-top: 0; color: #0f172a; font-size: 18px;">${title}</h3>
                    <p style="font-size: 14px; color: #475569; margin-bottom: 5px;"><strong>Date:</strong> ${date}</p>
                    <p style="font-size: 14px; color: #475569; margin-bottom: 5px;"><strong>Category:</strong> ${type}</p>
                    <p style="margin-bottom: 0; color: #334155; white-space: pre-wrap;">${content}</p>
                  </div>

                  <div style="text-align: center; margin: 30px 0;">
                    <a href="${noticeBoardUrl}" style="background-color: #f59e0b; color: #000000; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 8px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">View the Notice Board</a>
                  </div>

                  <p style="font-size: 14px; color: #64748b;">You can read this notice and browse other bulletins at any time on our website.</p>
                </div>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 12px; color: #94a3b8;">
                  <p>You received this email because you are a registered member of Josephite Math Club.</p>
                  <p>&copy; ${year} Josephite Math Club. All rights reserved.</p>
                </div>
              </div>
            `;

            try {
              await sendEmail({
                to: recipient.email,
                subject,
                text: plainText,
                html: htmlContent
              });
            } catch (err) {
              console.error(`[Notices] Failed to send notice email to ${recipient.email}:`, err);
            }
          })
        );
      }
    }
    console.log('[Notices] Notice notifications sent successfully.');
  } catch (error) {
    console.error('[Notices] Exception in sendNoticeNotifications:', error);
  }
}

export async function GET() {
  let data;
  let updatedAt = new Date().toISOString();
  
  try {
    const dataStr = await fs.readFile(CONTENT_FILE, 'utf-8');
    if (!dataStr || dataStr.trim() === '') {
      throw new Error('Content file is empty');
    }
    data = JSON.parse(dataStr);
    updatedAt = data.lastUpdated || "1970-01-01T00:00:00Z";
  } catch (error) {
    console.error('Error reading or parsing content file, fallback to default content:', error);
    data = DEFAULT_CONTENT;
    
    // Self-healing: try to write DEFAULT_CONTENT back to disk so future reads succeed
    try {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
      console.log('Successfully self-healed site-content.json on disk with DEFAULT_CONTENT');
    } catch (writeError) {
      console.error('Failed to self-heal site-content.json on disk:', writeError);
    }
  }

  return NextResponse.json({
    data,
    updatedAt
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600'
    }
  });
}

export async function POST(request: Request) {
  try {
    // 1. Rate Limiting
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { success, remaining, reset } = rateLimit(ip, 50, 60000);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      });
    }

    // 2. Auth & Admin Check
    try {
      await requireAdmin();
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const newContent = await request.json();
    
    // 3. Basic validation
    if (!newContent || typeof newContent !== 'object') {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }

    // 4. Detect if a new notice was added
    let oldContent: any = null;
    try {
      const dataStr = await fs.readFile(CONTENT_FILE, 'utf-8');
      if (dataStr && dataStr.trim() !== '') {
        oldContent = JSON.parse(dataStr);
      }
    } catch (err) {
      console.warn('Could not read existing content file for notices diffing:', err);
    }

    const oldNotices = oldContent?.notices?.notices || [];
    const newNotices = newContent?.notices?.notices || [];

    const oldNoticeIds = new Set<string>(oldNotices.map((n: any) => String(n.id || '')));
    const newlyAddedNotices = newNotices.filter((n: any) => n.id && !oldNoticeIds.has(String(n.id)));

    // Send emails if there are new notices
    if (newlyAddedNotices.length > 0) {
      console.log(`[Notices] Detected ${newlyAddedNotices.length} new notice(s). Triggering email notifications...`);
      // Run email sending in the background to avoid blocking the API response
      sendNoticeNotifications(newlyAddedNotices).catch((err) => {
        console.error('[Notices] Background notification sending failed:', err);
      });
    }

    // 5. Attempt to write to file (will fail on Netlify/Serverless)
    try {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(newContent, null, 2), 'utf-8');
    } catch (fsError) {
      console.warn('Note: Could not write to local content file (expected in serverless environments):', fsError);
      // We don't return an error here because the primary source of truth in production is Supabase
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing content file:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
