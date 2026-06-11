import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

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

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const challengeId = searchParams.get('challengeId') || 'active';

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required.' }, { status: 400 });
    }

    const targetEmail = email.toLowerCase().trim();
    const supabaseAdmin = getSupabaseAdmin();
    let submission = null;
    let fetchedFromNewTable = false;

    // 1. Try querying the dedicated challenge_submissions table
    try {
      // Look up under composite ID format first: `${challengeId}___${email}`
      const compositeId = `${challengeId}___${targetEmail}`;
      const { data: rowInfo, error: rowError } = await supabaseAdmin
        .from('challenge_submissions')
        .select('*')
        .eq('id', compositeId)
        .maybeSingle();

      let directRow = rowInfo;

      if (rowError || !directRow) {
        // Fallback: If not found or error, query by email, select latest matching challengeId in answers or fallback
        const { data: dbRows, error: dbError } = await supabaseAdmin
          .from('challenge_submissions')
          .select('*')
          .eq('email', targetEmail);

        if (!dbError && dbRows && dbRows.length > 0) {
          // Find row with matching challengeId in answers or fallback to general match if challengeId is 'active'
          const matchingRow = dbRows.find((r: any) => {
            const ansChallengeId = r.answers?._challengeId;
            return ansChallengeId === challengeId || (!ansChallengeId && challengeId === 'active');
          });
          if (matchingRow) {
            directRow = matchingRow;
          }
        }
      }

      if (directRow) {
        submission = {
          id: directRow.id,
          fullName: directRow.full_name,
          email: directRow.email,
          memberId: directRow.member_id,
          answers: directRow.answers || {},
          autoScore: directRow.auto_score,
          totalQuestions: directRow.total_questions,
          gradedBreakdown: directRow.graded_breakdown || [],
          status: directRow.status,
          finalScore: directRow.final_score,
          feedback: directRow.feedback,
          submittedAt: directRow.submitted_at,
          publishedAt: directRow.published_at
        };
        fetchedFromNewTable = true;
      } else {
        fetchedFromNewTable = false; // Allow falling back if not found in table to guarantee backward-compatibility!
      }
    } catch (err) {
      console.warn('my-submission: New challenge_submissions table query failed, falling back:', err);
    }

    // 2. Fallback to site_content
    if (!fetchedFromNewTable) {
      const { data: subRow, error: subError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'challenge_submissions')
        .maybeSingle();

      if (subError) {
        return NextResponse.json({ error: 'Failed to query submissions.' }, { status: 500 });
      }

      let submissions = [];
      if (subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
        submissions = subRow.data.submissions;
      }

      submission = submissions.find((sub: any) => sub.email === targetEmail) || null;
    }

    return NextResponse.json({ success: true, submission });

  } catch (error: any) {
    console.error('My Submission API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
