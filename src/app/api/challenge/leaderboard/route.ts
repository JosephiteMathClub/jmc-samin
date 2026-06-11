import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
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

async function isCallerSuperAdmin(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const anonUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    if (!anonUrl || !anonKey) return false;

    const supabase = createServerClient(
      anonUrl,
      anonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return false;

    const email = (user.email || '').toLowerCase().trim();

    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    const SUPER_ADMINS = Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);

    if (SUPER_ADMINS.includes(email)) {
      return true;
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    if (profile && profile.role?.trim().toLowerCase() === 'super_admin') {
      return true;
    }

    return false;
  } catch (err) {
    console.error('Error verifying super admin identity:', err);
    return false;
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId') || 'active';

    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch published records from dedicated table
    const { data: dbRows, error: dbError } = await supabaseAdmin
      .from('challenge_submissions')
      .select('*')
      .eq('status', 'published');

    let publishedSubmissions = [];
    const submissionsMap = new Map<string, any>();

    // 1. Process dedicated table records if active
    if (!dbError && dbRows) {
      dbRows.forEach((r: any) => {
        const subChallengeId = r.answers?._challengeId || 'active';
        if (r.status === 'published' && subChallengeId === challengeId) {
          submissionsMap.set(r.id, {
            id: r.id,
            fullName: r.full_name,
            email: r.email,
            memberId: r.member_id,
            answers: r.answers || {},
            autoScore: r.auto_score,
            totalQuestions: r.total_questions,
            gradedBreakdown: r.graded_breakdown || [],
            status: r.status,
            finalScore: r.final_score,
            submittedAt: r.submitted_at
          });
        }
      });
    }

    // 2. Fetch from legacy site_content fallback and merge to ensure no submissions are lost
    try {
      const { data: subRow, error: subError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'challenge_submissions')
        .maybeSingle();

      if (!subError && subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
        subRow.data.submissions.forEach((sub: any) => {
          const subChallengeId = sub.answers?._challengeId || 'active';
          if (sub.status === 'published' && subChallengeId === challengeId) {
            if (!submissionsMap.has(sub.id)) {
              submissionsMap.set(sub.id, {
                id: sub.id,
                fullName: sub.fullName,
                email: sub.email,
                memberId: sub.memberId,
                answers: sub.answers || {},
                autoScore: sub.autoScore,
                totalQuestions: sub.totalQuestions,
                gradedBreakdown: sub.gradedBreakdown || [],
                status: sub.status,
                finalScore: sub.finalScore,
                submittedAt: sub.submittedAt
              });
            } else {
              // If already present, keep the updated finalScore/status
              const existing = submissionsMap.get(sub.id);
              if ((sub.finalScore !== undefined && sub.finalScore > (existing.finalScore ?? -1)) || existing.status !== 'published') {
                submissionsMap.set(sub.id, {
                  ...existing,
                  finalScore: sub.finalScore,
                  status: sub.status,
                  feedback: sub.feedback
                });
              }
            }
          }
        });
      }
    } catch (fallbackErr) {
      console.warn('Leaderboard fallback merge error:', fallbackErr);
    }

    publishedSubmissions = Array.from(submissionsMap.values());

    // Sort: 1st by finalScore descending, 2nd by submittedAt ascending (completed faster is higher rank)
    publishedSubmissions.sort((a: any, b: any) => {
      const scoreDiff = (b.finalScore ?? b.autoScore) - (a.finalScore ?? a.autoScore);
      if (scoreDiff !== 0) return scoreDiff;
      
      const timeA = new Date(a.submittedAt).getTime();
      const timeB = new Date(b.submittedAt).getTime();
      return timeA - timeB;
    });

    // Strip private details like complete emails or detailed answers
    const leaderboardData = publishedSubmissions.map((sub: any, idx: number) => {
      return {
        rank: idx + 1,
        id: sub.id,
        fullName: sub.fullName,
        memberId: sub.memberId || '',
        score: sub.finalScore ?? sub.autoScore,
        totalQuestions: sub.totalQuestions ?? 0,
        submittedAt: sub.submittedAt
      };
    });

    return NextResponse.json({ success: true, leaderboard: leaderboardData });

  } catch (error: any) {
    console.error('Leaderboard API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

// DELETE clear/unpublish leaderboard entries for a given challenge (admin only)
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const challengeId = searchParams.get('challengeId') || 'active';
    const mode = searchParams.get('mode') || 'unpublish'; // 'delete' or 'unpublish'

    // Checking Super Admin condition for deleting submissions
    if (mode === 'delete') {
      const isSuperAdmin = await isCallerSuperAdmin();
      if (!isSuperAdmin) {
        return NextResponse.json({ error: 'Permission denied. Only Super Admins can delete student submissions / reset the leaderboard.' }, { status: 403 });
      }
    }

    const supabaseAdmin = getSupabaseAdmin();

    if (mode === 'delete') {
      // 1. Delete matching submissions from the dedicated challenge_submissions table
      const { data: dbRows, error: dbError } = await supabaseAdmin
        .from('challenge_submissions')
        .select('*');

      if (!dbError && dbRows) {
        const toDeleteIds: string[] = [];
        dbRows.forEach((r: any) => {
          const subChallengeId = r.answers?._challengeId || 'active';
          if (subChallengeId === challengeId) {
            toDeleteIds.push(r.id);
          }
        });

        if (toDeleteIds.length > 0) {
          const { error: dbDeleteError } = await supabaseAdmin
            .from('challenge_submissions')
            .delete()
            .in('id', toDeleteIds);

          if (dbDeleteError) {
            console.error('Failed to clear submissions from challenge_submissions table:', dbDeleteError.message);
          }
        }
      }

      // 2. Fetch and filter from site_content fallback
      const { data: subRow, error: subError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'challenge_submissions')
        .maybeSingle();

      if (!subError && subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
        const updatedList = subRow.data.submissions.filter((sub: any) => {
          const subChallengeId = sub.answers?._challengeId || 'active';
          return subChallengeId !== challengeId;
        });

        const { error: upsertError } = await supabaseAdmin
          .from('site_content')
          .upsert({
            id: 'challenge_submissions',
            data: { submissions: updatedList },
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Failed to update fallback submissions during delete:', upsertError.message);
        }
      }

      return NextResponse.json({ success: true, message: `All student submissions for challenge "${challengeId}" have been permanently deleted and cleared.` });

    } else {
      // mode === 'unpublish'
      // 1. Fetch, find, and update matching submissions to status 'pending' in dedicated table
      const { data: dbRows, error: dbError } = await supabaseAdmin
        .from('challenge_submissions')
        .select('*');

      if (!dbError && dbRows) {
        const toUpdateIds: string[] = [];
        dbRows.forEach((r: any) => {
          const subChallengeId = r.answers?._challengeId || 'active';
          if (subChallengeId === challengeId && r.status === 'published') {
            toUpdateIds.push(r.id);
          }
        });

        for (const targetId of toUpdateIds) {
          const { error: dbUpdateError } = await supabaseAdmin
            .from('challenge_submissions')
            .update({ status: 'pending', published_at: null })
            .eq('id', targetId);

          if (dbUpdateError) {
            console.error(`Failed to unpublish submission ${targetId}:`, dbUpdateError.message);
          }
        }
      }

      // 2. Update site_content fallback
      const { data: subRow, error: subError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'challenge_submissions')
        .maybeSingle();

      if (!subError && subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
        const updatedList = subRow.data.submissions.map((sub: any) => {
          const subChallengeId = sub.answers?._challengeId || 'active';
          if (subChallengeId === challengeId && sub.status === 'published') {
            return {
              ...sub,
              status: 'pending',
              publishedAt: null
            };
          }
          return sub;
        });

        const { error: upsertError } = await supabaseAdmin
          .from('site_content')
          .upsert({
            id: 'challenge_submissions',
            data: { submissions: updatedList },
            updated_at: new Date().toISOString()
          });

        if (upsertError) {
          console.error('Failed to update fallback submissions during unpublish:', upsertError.message);
        }
      }

      return NextResponse.json({ success: true, message: `All published entries for challenge "${challengeId}" have been set back to pending (unpublished).` });
    }

  } catch (error: any) {
    console.error('Leaderboard clear API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

