import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

let supabaseAdminClient: any = null;

function getSupabaseAdmin() {
  if (!supabaseAdminClient) {
    let url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim().replace(/^['"]|['"]$/g, '');
    let key = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim().replace(/^['"]|['"]$/g, '');
    if (!url || !key) {
      throw new Error('Database service keys are not configured on server');
    }

    if (!url.startsWith('http')) {
      url = `https://${url}`;
    }
    url = url.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

    supabaseAdminClient = createClient(url, key);
  }
  return supabaseAdminClient;
}

export async function POST(req: Request) {
  try {
    const { trxnid, bkash_number, targetTable, event_name, teammates } = await req.json();

    if (!trxnid || !bkash_number || !targetTable || !event_name || !teammates || !Array.isArray(teammates)) {
      return NextResponse.json({ error: 'Missing required teammate registration fields' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const insertedRows = [];

    // Loop through teammates and insert them using service role
    for (let i = 0; i < teammates.length; i++) {
      const teammate = teammates[i];
      const suffix = `-T${i + 2}`; // -T2, -T3
      const teammateTrxnId = `${trxnid}${suffix}`;

      const payload = {
        user_id: teammate.id,
        full_name: teammate.name,
        class: teammate.class || '',
        section: teammate.section || '',
        roll: teammate.roll || '',
        bkash_number: bkash_number,
        trxnid: teammateTrxnId,
        amount: 0, // teammate cost is covered by leader
        selected_events: event_name,
        verified: 'no'
      };

      const { data, error } = await supabaseAdmin
        .from(targetTable)
        .insert([payload])
        .select('*');

      if (error) {
        console.error(`Error inserting teammate ${i + 2} record:`, error);
        // If there's a unique constraint on teammate's transaction ID, it might be a double submission.
        // We can ignore or return error. Let's return error to notify front-end.
        return NextResponse.json({ 
          error: `Failed to insert team member record for ${teammate.name}. ${error.message}` 
        }, { status: 500 });
      }

      if (data && data.length > 0) {
        insertedRows.push(data[0]);
      }
    }

    return NextResponse.json({ success: true, count: insertedRows.length, records: insertedRows });
  } catch (err: any) {
    console.error('teammate register route error:', err);
    let errorMessage = err.message || 'Internal Server Error';
    if (errorMessage.includes('Invalid API key') || errorMessage.includes('invalid') || errorMessage.includes('API key')) {
      errorMessage = 'Invalid SUPABASE_SERVICE_ROLE_KEY setup on the server. TIP: Go to your Supabase Dashboard -> Project Settings -> API. Copy the secret "service_role" key (NOT the public "anon" key) and update the SUPABASE_SERVICE_ROLE_KEY environment variable. If you already set it, make sure there are no surrounding quotes.';
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
