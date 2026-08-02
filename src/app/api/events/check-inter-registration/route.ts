import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, phone } = body;

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';

    if (!cleanEmail && !cleanPhone) {
      return NextResponse.json({ registeredEvents: [], isFullyRegistered: false });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Resolve potential profile / member IDs for this email/phone
    const potentialUserIds = new Set<string>();
    let matchedName = '';

    if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.endsWith('@josephitre.club')) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .eq('email', cleanEmail)
        .maybeSingle();
      if (profile) {
        potentialUserIds.add(profile.id);
        if (profile.full_name) matchedName = profile.full_name;
      }
    }

    if (cleanPhone) {
      const { data: member } = await supabaseAdmin
        .from('member')
        .select('id, full_name')
        .eq('phone', cleanPhone)
        .maybeSingle();
      if (member) {
        potentialUserIds.add(member.id);
        if (!matchedName && member.full_name) matchedName = member.full_name;
      }
    }

    // 2. Query all 4 inter-event registration tables
    const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
    const registeredSegmentsSet = new Set<string>();

    for (const table of tables) {
      // Query by phone
      if (cleanPhone) {
        const { data: rowsByPhone } = await supabaseAdmin
          .from(table)
          .select('selected_events, full_name')
          .or(`phone.eq.${cleanPhone},bkash_number.eq.${cleanPhone}`);
        
        if (rowsByPhone && rowsByPhone.length > 0) {
          for (const row of rowsByPhone) {
            if (row.full_name && !matchedName) matchedName = row.full_name;
            if (row.selected_events) {
              row.selected_events.split(',').forEach((ev: string) => {
                const trimmed = ev.trim();
                if (trimmed) registeredSegmentsSet.add(trimmed);
              });
            }
          }
        }
      }

      // Query by user_id
      for (const uid of Array.from(potentialUserIds)) {
        const { data: rowsByUid } = await supabaseAdmin
          .from(table)
          .select('selected_events, full_name')
          .eq('user_id', uid);

        if (rowsByUid && rowsByUid.length > 0) {
          for (const row of rowsByUid) {
            if (row.full_name && !matchedName) matchedName = row.full_name;
            if (row.selected_events) {
              row.selected_events.split(',').forEach((ev: string) => {
                const trimmed = ev.trim();
                if (trimmed) registeredSegmentsSet.add(trimmed);
              });
            }
          }
        }
      }
    }

    const registeredEvents = Array.from(registeredSegmentsSet);

    return NextResponse.json({
      registeredEvents,
      matchedName
    });
  } catch (error: any) {
    console.error('Error checking inter event registration:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
