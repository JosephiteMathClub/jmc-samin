import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser, isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

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

// GET all challenges
export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const user = await getAuthenticatedUser();
    const userIsAdmin = user ? await isAdmin(user) : false;

    const { data: dbRows, error: dbError } = await supabaseAdmin
      .from('challenges')
      .select('*')
      .order('created_at', { ascending: false });

    if (dbError) {
      return NextResponse.json({ error: 'Failed to query challenges: ' + dbError.message }, { status: 500 });
    }

    let list = dbRows || [];

    // Filter for regular students: only show published challenges
    if (!userIsAdmin) {
      list = list.filter((c: any) => c.published);
    }

    return NextResponse.json({ success: true, challenges: list });
  } catch (error: any) {
    console.error('Challenges GET API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// POST create/update/save a challenge
export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const userIsAdmin = user ? await isAdmin(user) : false;
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized admin access required.' }, { status: 403 });
    }

    const { id, title, description, questions, published, deadline } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Challenge title is required.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const finalId = !id || id.startsWith('new') 
      ? `chal_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
      : id;

    const { data, error } = await supabaseAdmin
      .from('challenges')
      .upsert({
        id: finalId,
        title,
        description: description || '',
        questions: questions || [],
        published: !!published,
        deadline: deadline || null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to write challenge to DB: ' + error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, challenge: data });
  } catch (error: any) {
    console.error('Challenges POST API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE a challenge
export async function DELETE(req: Request) {
  try {
    const user = await getAuthenticatedUser();
    const userIsAdmin = user ? await isAdmin(user) : false;
    
    if (!userIsAdmin) {
      return NextResponse.json({ error: 'Unauthorized admin access required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Challenge ID is required for deletion.' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin
      .from('challenges')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete challenge row: ' + error.message }, { status: 500 });
    }

    // Clean up site_content's challengePaper to prevent it from resurrecting
    if (id === 'active') {
      try {
        const { data: subRow } = await supabaseAdmin
          .from('site_content')
          .select('data')
          .eq('id', 'main')
          .maybeSingle();

        if (subRow && subRow.data) {
          const newData = { ...subRow.data };
          if ('challengePaper' in newData) {
            delete newData.challengePaper;
            await supabaseAdmin
              .from('site_content')
              .upsert({ id: 'main', data: newData });
          }
        }
      } catch (siteContentError) {
        console.warn('Failed to clear challengePaper from site_content on delete:', siteContentError);
      }
    }

    return NextResponse.json({ success: true, message: 'Challenge successfully deleted.' });
  } catch (error: any) {
    console.error('Challenges DELETE API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
