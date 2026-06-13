import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    return NextResponse.json({ error: 'Supabase URL/Service Role not set in env' });
  }

  const supabaseAdmin = createClient(url, key);
  const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
  const results: any = {};

  for (const table of tables) {
    try {
      const { data, error } = await supabaseAdmin.from(table).select('*');
      results[table] = {
        count: data ? data.length : 0,
        error: error ? error.message : null,
        data: data || []
      };
    } catch (e: any) {
      results[table] = { error: e.message };
    }
  }

  return NextResponse.json(results);
}
