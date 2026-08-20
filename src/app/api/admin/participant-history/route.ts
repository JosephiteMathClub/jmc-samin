import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendEmail } from '@/lib/email';
import { SUPER_ADMIN_EMAILS } from '@/lib/constants';

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

async function verifySuperAdmin(): Promise<{ isSuper: boolean; email?: string; adminName?: string }> {
  try {
    const cookieStore = await cookies();
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonUrl || !anonKey) return { isSuper: false };

    const supabase = createServerClient(
      anonUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet: any) {
            cookiesToSet.forEach(({ name, value, options }: any) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return { isSuper: false };

    const email = (user.email || '').toLowerCase().trim();

    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    if (SUPER_ADMINS.includes(email)) {
      return { isSuper: true, email, adminName: user.user_metadata?.full_name || 'Super Admin' };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role?.trim().toLowerCase() === 'super_admin') {
      return { isSuper: true, email, adminName: profile.full_name || user.user_metadata?.full_name || 'Super Admin' };
    }

    return { isSuper: false, email };
  } catch (err) {
    console.error('Error verifying super admin identity:', err);
    return { isSuper: false };
  }
}

const LIVE_EVENT_TABLES = [
  'primary_events',
  'junior_events',
  'secondary_events',
  'higher_secondary_events'
] as const;

export async function GET() {
  try {
    const auth = await verifySuperAdmin();
    if (!auth.isSuper) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admins can access participant history.' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch live table record counts
    const liveCounts: Record<string, number> = {
      primary_events: 0,
      junior_events: 0,
      secondary_events: 0,
      higher_secondary_events: 0,
      total_live: 0
    };

    for (const tbl of LIVE_EVENT_TABLES) {
      try {
        const { count, error } = await supabaseAdmin
          .from(tbl)
          .select('*', { count: 'exact', head: true });
        if (!error && typeof count === 'number') {
          liveCounts[tbl] = count;
          liveCounts.total_live += count;
        }
      } catch (e) {
        console.error(`Error counting live rows for ${tbl}:`, e);
      }
    }

    // 2. Fetch archived participants from previous_year_participants
    let participants: any[] = [];
    let tableExists = true;

    try {
      const { data, error } = await supabaseAdmin
        .from('previous_year_participants')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) {
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          tableExists = false;
        } else {
          console.error('Error fetching previous_year_participants:', error);
        }
      } else {
        participants = data || [];
      }
    } catch (e) {
      console.error('Catch error fetching previous_year_participants:', e);
      tableExists = false;
    }

    // 3. Compute stats
    const yearsSet = new Set<string>();
    let totalWithEmail = 0;
    let totalWithPhone = 0;

    participants.forEach((p) => {
      if (p.academic_year) yearsSet.add(p.academic_year);
      if (p.email && p.email.trim() && p.email.includes('@')) totalWithEmail++;
      if (p.phone && p.phone.trim()) totalWithPhone++;
    });

    return NextResponse.json({
      success: true,
      tableExists,
      liveCounts,
      participants,
      stats: {
        totalArchived: participants.length,
        totalWithEmail,
        totalWithPhone,
        availableYears: Array.from(yearsSet).sort().reverse(),
      }
    });
  } catch (err: any) {
    console.error('GET /api/admin/participant-history error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await verifySuperAdmin();
    if (!auth.isSuper) {
      return NextResponse.json({ error: 'Unauthorized: Only Super Admins can perform participant history operations.' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;
    const supabaseAdmin = getSupabaseAdmin();

    // ----------------------------------------------------
    // ACTION: ARCHIVE AND CLEAR LIVE EVENT PARTICIPANTS
    // ----------------------------------------------------
    if (action === 'archive_and_clear') {
      const targetTables: string[] = body.targetTables && Array.isArray(body.targetTables) && body.targetTables.length > 0
        ? body.targetTables
        : [...LIVE_EVENT_TABLES];

      const academicYear = (body.academicYear || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`).trim();
      const customNote = (body.note || '').trim();

      // Gather all profiles & members for lookup
      const { data: profiles } = await supabaseAdmin.from('profiles').select('id, email, full_name, phone');
      const { data: members } = await supabaseAdmin.from('member').select('id, email, email_address, phone, full_name, school');

      const profilesMap = new Map<string, any>();
      profiles?.forEach(p => { if (p.id) profilesMap.set(p.id, p); });

      const membersMap = new Map<string, any>();
      members?.forEach(m => { if (m.id) membersMap.set(m.id, m); });

      const archivedRecords: any[] = [];
      const tableResults: Record<string, { read: number; archived: number; deleted: number }> = {};

      for (const tbl of targetTables) {
        tableResults[tbl] = { read: 0, archived: 0, deleted: 0 };
        const { data: rows, error: fetchErr } = await supabaseAdmin.from(tbl).select('*');
        if (fetchErr) {
          console.error(`Error fetching rows from ${tbl}:`, fetchErr);
          continue;
        }

        if (!rows || rows.length === 0) continue;
        tableResults[tbl].read = rows.length;

        for (const row of rows) {
          const profile = row.user_id ? profilesMap.get(row.user_id) : null;
          const member = row.user_id ? membersMap.get(row.user_id) : null;

          const email = (
            row.email ||
            profile?.email ||
            member?.email_address ||
            member?.email ||
            ''
          ).trim().toLowerCase();

          const phone = (
            row.phone ||
            row.bkash_number ||
            profile?.phone ||
            member?.phone ||
            ''
          ).trim();

          const fullName = (
            row.full_name ||
            row.name ||
            profile?.full_name ||
            member?.full_name ||
            'Participant'
          ).trim();

          const school = (
            row.school ||
            row.section ||
            row.institute ||
            member?.school ||
            ''
          ).trim();

          archivedRecords.push({
            original_id: String(row.id || ''),
            user_id: row.user_id || null,
            full_name: fullName,
            email: email,
            phone: phone,
            bkash_number: row.bkash_number || null,
            academic_class: row.class ? String(row.class) : null,
            section: row.section || null,
            roll: row.roll ? String(row.roll) : null,
            school: school,
            source_table: tbl,
            selected_events: row.selected_events || null,
            trxnid: row.trxnid || null,
            amount: typeof row.amount === 'number' ? row.amount : (parseFloat(row.amount) || 0),
            academic_year: academicYear,
            verified: row.verified === 'yes' || row.verified === true ? 'yes' : 'no',
            metadata: {
              original_created_at: row.created_at || null,
              gender: row.gender || null,
              verified_by: row.verified_by || null,
              archived_by: auth.email,
              note: customNote || undefined
            }
          });
        }
      }

      if (archivedRecords.length > 0) {
        // Insert into previous_year_participants in batches of 100
        const BATCH_SIZE = 100;
        for (let i = 0; i < archivedRecords.length; i += BATCH_SIZE) {
          const batch = archivedRecords.slice(i, i + BATCH_SIZE);
          const { error: insErr } = await supabaseAdmin
            .from('previous_year_participants')
            .insert(batch);

          if (insErr) {
            console.error('Error inserting batch into previous_year_participants:', insErr);
            // If table does not exist, return helpful guidance
            if (insErr.code === '42P01' || insErr.message?.includes('does not exist')) {
              return NextResponse.json({
                error: 'The "previous_year_participants" table has not been created in Supabase yet. Please run the SQL migration script from the setup file or instructions in this tab.',
                needsSqlSetup: true
              }, { status: 400 });
            }
            throw new Error(`Failed to archive records into previous_year_participants: ${insErr.message}`);
          }
        }

        // Once successfully archived, clear the records from the live tables
        for (const tbl of targetTables) {
          const { count, error: delErr } = await supabaseAdmin
            .from(tbl)
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Standard trick to delete all rows

          if (delErr) {
            console.error(`Error deleting rows from ${tbl}:`, delErr);
          } else {
            tableResults[tbl].deleted = tableResults[tbl].read;
            tableResults[tbl].archived = tableResults[tbl].read;
          }
        }

        // Audit Log
        try {
          await supabaseAdmin.from('admin_audit_logs').insert({
            admin_name: auth.adminName || 'Super Admin',
            admin_email: auth.email,
            action_type: 'ARCHIVE_EVENT_PARTICIPANTS',
            target: targetTables.join(', '),
            details: JSON.stringify({
              academicYear,
              totalArchived: archivedRecords.length,
              tableBreakdown: tableResults
            })
          });
        } catch (e) {
          // ignore audit fail
        }
      }

      return NextResponse.json({
        success: true,
        message: `Successfully archived and cleared ${archivedRecords.length} participant records into previous_year_participants.`,
        totalArchived: archivedRecords.length,
        tableResults
      });
    }

    // ----------------------------------------------------
    // ACTION: BROADCAST EMAIL
    // ----------------------------------------------------
    if (action === 'broadcast_email') {
      const { 
        subject, 
        htmlTemplate, 
        targetFilter, 
        customParticipantIds, 
        testEmail,
        academicYearFilter 
      } = body;

      if (!subject || !htmlTemplate) {
        return NextResponse.json({ error: 'Subject and HTML Template are required.' }, { status: 400 });
      }

      // If test email mode
      if (testEmail && testEmail.trim()) {
        const sampleRecord = {
          full_name: 'Alex Rahman (Sample Participant)',
          email: testEmail.trim(),
          phone: '01712345678',
          academic_class: 'Class 10',
          school: 'St. Joseph Higher Secondary School',
          academic_year: '2025-2026',
          selected_events: 'Math Olympiad, Rubik\'s Cube, Math Relay',
          source_table: 'secondary_events'
        };

        const renderedHtml = renderParticipantTemplate(htmlTemplate, sampleRecord);
        const emailRes = await sendEmail({
          to: testEmail.trim(),
          subject: `[TEST PREVIEW] ${subject}`,
          html: renderedHtml
        });

        if (!emailRes.success) {
          return NextResponse.json({ error: emailRes.error?.message || 'Failed to send test email' }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          message: `Test email successfully dispatched to ${testEmail.trim()}`
        });
      }

      // Fetch participants from previous_year_participants
      let query = supabaseAdmin.from('previous_year_participants').select('*');

      if (customParticipantIds && Array.isArray(customParticipantIds) && customParticipantIds.length > 0) {
        query = query.in('id', customParticipantIds);
      } else {
        if (academicYearFilter && academicYearFilter !== 'all') {
          query = query.eq('academic_year', academicYearFilter);
        }
        if (targetFilter && targetFilter !== 'all') {
          query = query.eq('source_table', targetFilter);
        }
      }

      const { data: participants, error: pErr } = await query;
      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 });
      }

      if (!participants || participants.length === 0) {
        return NextResponse.json({ error: 'No participants matched the selected broadcast filters.' }, { status: 400 });
      }

      // Filter for valid emails and deduplicate by email
      const validTargets: any[] = [];
      const seenEmails = new Set<string>();

      for (const p of participants) {
        const em = (p.email || '').trim().toLowerCase();
        if (em && em.includes('@') && !em.endsWith('@example.com') && !seenEmails.has(em)) {
          seenEmails.add(em);
          validTargets.push(p);
        }
      }

      if (validTargets.length === 0) {
        return NextResponse.json({ error: 'None of the selected participants possess valid email addresses.' }, { status: 400 });
      }

      let sentCount = 0;
      let failedCount = 0;
      const failedDetails: string[] = [];

      // Send in controlled concurrency batches (5 at a time)
      const CONCURRENCY = 5;
      for (let i = 0; i < validTargets.length; i += CONCURRENCY) {
        const chunk = validTargets.slice(i, i + CONCURRENCY);
        await Promise.all(
          chunk.map(async (target) => {
            try {
              const customizedSubject = replaceParticipantTags(subject, target);
              const customizedHtml = renderParticipantTemplate(htmlTemplate, target);

              const res = await sendEmail({
                to: target.email,
                subject: customizedSubject,
                html: customizedHtml
              });

              if (res.success) {
                sentCount++;
              } else {
                failedCount++;
                failedDetails.push(`${target.email}: ${res.error?.message || 'Unknown'}`);
              }
            } catch (err: any) {
              failedCount++;
              failedDetails.push(`${target.email}: ${err.message}`);
            }
          })
        );
      }

      // Log broadcast audit
      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_name: auth.adminName || 'Super Admin',
          admin_email: auth.email,
          action_type: 'BROADCAST_PREV_PARTICIPANTS_EMAIL',
          target: `${validTargets.length} historical participants`,
          details: JSON.stringify({
            subject,
            sentCount,
            failedCount,
            totalTargeted: validTargets.length
          })
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        totalTargeted: validTargets.length,
        sentCount,
        failedCount,
        failedDetails: failedDetails.slice(0, 10)
      });
    }

    // ----------------------------------------------------
    // ACTION: BROADCAST SMS
    // ----------------------------------------------------
    if (action === 'broadcast_sms') {
      const { messageText, targetFilter, academicYearFilter, customParticipantIds } = body;
      if (!messageText || !messageText.trim()) {
        return NextResponse.json({ error: 'SMS Message text is required.' }, { status: 400 });
      }

      let query = supabaseAdmin.from('previous_year_participants').select('*');
      if (customParticipantIds && Array.isArray(customParticipantIds) && customParticipantIds.length > 0) {
        query = query.in('id', customParticipantIds);
      } else {
        if (academicYearFilter && academicYearFilter !== 'all') {
          query = query.eq('academic_year', academicYearFilter);
        }
        if (targetFilter && targetFilter !== 'all') {
          query = query.eq('source_table', targetFilter);
        }
      }

      const { data: participants, error: pErr } = await query;
      if (pErr) {
        return NextResponse.json({ error: pErr.message }, { status: 500 });
      }

      // Collect valid unique phone numbers
      const phoneList: { phone: string; name: string }[] = [];
      const seenPhones = new Set<string>();

      participants?.forEach((p) => {
        const rawPhone = (p.phone || p.bkash_number || '').replace(/[^0-9+]/g, '');
        if (rawPhone.length >= 10 && !seenPhones.has(rawPhone)) {
          seenPhones.add(rawPhone);
          phoneList.push({ phone: rawPhone, name: p.full_name });
        }
      });

      // Audit Log the SMS broadcast preparation / queue
      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          admin_name: auth.adminName || 'Super Admin',
          admin_email: auth.email,
          action_type: 'BROADCAST_PREV_PARTICIPANTS_SMS',
          target: `${phoneList.length} numbers`,
          details: JSON.stringify({
            messageSnippet: messageText.slice(0, 100),
            recipientCount: phoneList.length
          })
        });
      } catch (e) {
        // ignore
      }

      return NextResponse.json({
        success: true,
        totalRecipients: phoneList.length,
        phoneList: phoneList.map(p => p.phone),
        message: `Prepared SMS broadcast payload for ${phoneList.length} unique phone contacts.`
      });
    }

    // ----------------------------------------------------
    // ACTION: ADD INDIVIDUAL HISTORICAL PARTICIPANT
    // ----------------------------------------------------
    if (action === 'add_participant') {
      const { full_name, email, phone, academic_class, school, academic_year, selected_events } = body;
      if (!full_name || !email) {
        return NextResponse.json({ error: 'Full Name and Email are required.' }, { status: 400 });
      }

      const { data, error } = await supabaseAdmin
        .from('previous_year_participants')
        .insert([{
          full_name: full_name.trim(),
          email: email.trim().toLowerCase(),
          phone: (phone || '').trim(),
          academic_class: (academic_class || '').trim(),
          school: (school || '').trim(),
          academic_year: (academic_year || `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`).trim(),
          selected_events: (selected_events || '').trim(),
          source_table: 'manual',
          verified: 'yes'
        }])
        .select()
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, participant: data });
    }

    // ----------------------------------------------------
    // ACTION: DELETE INDIVIDUAL HISTORICAL PARTICIPANT
    // ----------------------------------------------------
    if (action === 'delete_participant') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Participant ID is required' }, { status: 400 });

      const { error } = await supabaseAdmin
        .from('previous_year_participants')
        .delete()
        .eq('id', id);

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ success: true, message: 'Participant record deleted.' });
    }

    // ----------------------------------------------------
    // ACTION: ARCHIVE ON SINGLE RECORD DELETION FROM LIVE TABLE
    // ----------------------------------------------------
    if (action === 'archive_and_delete_single') {
      const { tableName, rowId } = body;
      if (!tableName || !rowId) {
        return NextResponse.json({ error: 'Table name and Row ID are required.' }, { status: 400 });
      }

      // Fetch the single row first
      const { data: row, error: fErr } = await supabaseAdmin
        .from(tableName)
        .select('*')
        .eq('id', rowId)
        .maybeSingle();

      if (fErr || !row) {
        return NextResponse.json({ error: fErr?.message || 'Record not found in live table.' }, { status: 404 });
      }

      // Fetch profile/member if user_id exists
      let profile: any = null;
      let member: any = null;
      if (row.user_id) {
        const { data: p } = await supabaseAdmin.from('profiles').select('email, full_name, phone').eq('id', row.user_id).maybeSingle();
        const { data: m } = await supabaseAdmin.from('member').select('email_address, phone, full_name, school').eq('id', row.user_id).maybeSingle();
        profile = p;
        member = m;
      }

      const email = (row.email || profile?.email || member?.email_address || '').trim().toLowerCase();
      const phone = (row.phone || row.bkash_number || profile?.phone || member?.phone || '').trim();
      const fullName = (row.full_name || row.name || profile?.full_name || member?.full_name || 'Participant').trim();
      const school = (row.school || row.section || row.institute || member?.school || '').trim();

      // Insert into previous_year_participants
      await supabaseAdmin
        .from('previous_year_participants')
        .insert([{
          original_id: String(row.id),
          user_id: row.user_id || null,
          full_name: fullName,
          email: email,
          phone: phone,
          bkash_number: row.bkash_number || null,
          academic_class: row.class ? String(row.class) : null,
          section: row.section || null,
          roll: row.roll ? String(row.roll) : null,
          school: school,
          source_table: tableName,
          selected_events: row.selected_events || null,
          trxnid: row.trxnid || null,
          amount: typeof row.amount === 'number' ? row.amount : (parseFloat(row.amount) || 0),
          academic_year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
          verified: row.verified === 'yes' || row.verified === true ? 'yes' : 'no',
          metadata: {
            deleted_single_at: new Date().toISOString(),
            deleted_by: auth.email
          }
        }]);

      // Delete from live table
      const { error: dErr } = await supabaseAdmin
        .from(tableName)
        .delete()
        .eq('id', rowId);

      if (dErr) {
        return NextResponse.json({ error: dErr.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: `Record ${rowId} deleted from ${tableName} and preserved in previous_year_participants.`
      });
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('POST /api/admin/participant-history error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

function replaceParticipantTags(str: string, p: any): string {
  if (!str) return '';
  return str
    .replace(/{{fullName}}/g, p.full_name || 'Participant')
    .replace(/{{name}}/g, p.full_name || 'Participant')
    .replace(/{{email}}/g, p.email || '')
    .replace(/{{phone}}/g, p.phone || '')
    .replace(/{{school}}/g, p.school || '')
    .replace(/{{institution}}/g, p.school || '')
    .replace(/{{category}}/g, formatCategory(p.source_table))
    .replace(/{{class}}/g, p.academic_class || '')
    .replace(/{{events}}/g, p.selected_events || '')
    .replace(/{{year}}/g, p.academic_year || 'Previous Year')
    .replace(/{{academicYear}}/g, p.academic_year || 'Previous Year');
}

function formatCategory(sourceTable?: string): string {
  switch (sourceTable) {
    case 'primary_events': return 'Primary Category (Classes 3-5)';
    case 'junior_events': return 'Junior Category (Classes 6-8)';
    case 'secondary_events': return 'Secondary Category (Classes 9-10)';
    case 'higher_secondary_events': return 'Higher Secondary Category (Classes 11-12)';
    default: return 'Mathematics Championship';
  }
}

function renderParticipantTemplate(template: string, p: any): string {
  let content = replaceParticipantTags(template, p);
  return content;
}
