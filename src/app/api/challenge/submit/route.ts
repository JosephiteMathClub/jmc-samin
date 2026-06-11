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

export async function POST(req: Request) {
  try {
    const { fullName, email, memberId, answers, challengeId } = await req.json();

    if (!fullName || !email) {
      return NextResponse.json({ error: 'Full name and email are required to submit.' }, { status: 400 });
    }

    const finalChallengeId = challengeId || 'active';
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch current challenge paper config to auto-grade
    let challengePaper = { title: '', description: '', questions: [], deadline: '', published: false };
    let fetchedFromNewTable = false;

    try {
      const { data: chalRow, error: chalError } = await supabaseAdmin
        .from('challenges')
        .select('*')
        .eq('id', finalChallengeId)
        .maybeSingle();
      
      if (!chalError && chalRow) {
        challengePaper = {
          title: chalRow.title || '',
          description: chalRow.description || '',
          questions: chalRow.questions || [],
          deadline: chalRow.deadline || '',
          published: !!chalRow.published
        };
        fetchedFromNewTable = true;
      }
    } catch (err) {
      console.warn('New challenges table query failed, falling back:', err);
    }

    if (!fetchedFromNewTable && finalChallengeId === 'active') {
      const { data: mainContent, error: mainError } = await supabaseAdmin
        .from('site_content')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();

      if (mainError) {
        return NextResponse.json({ error: 'Failed to retrieve challenge configurations.' }, { status: 500 });
      }

      const paperData = mainContent?.data?.challengePaper;
      if (paperData) {
        challengePaper = {
          title: paperData.title || '',
          description: paperData.description || '',
          questions: paperData.questions || [],
          deadline: paperData.deadline || '',
          published: !!paperData.published
        };
      }
    }

    // Check if deadline is defined and past-due
    if (challengePaper.deadline) {
      const deadlineDate = new Date(challengePaper.deadline);
      const currentDate = new Date();
      if (currentDate > deadlineDate) {
        return NextResponse.json({ error: 'The deadline for this math challenge has passed. No further submissions are accepted.' }, { status: 400 });
      }
    }

    const questions = challengePaper.questions || [];

    // 2. Perform auto-grading
    let autoScore = 0;
    const gradedBreakdown = questions.map((q: any) => {
      const userAnswerStr = String(answers[q.id] || '').trim();
      const correctAnswerStr = String(q.answer || '').trim();
      
      const isCorrect = userAnswerStr !== '' && Number(userAnswerStr) === Number(correctAnswerStr);
      if (isCorrect) {
        autoScore++;
      }

      return {
        questionId: q.id,
        userAnswer: userAnswerStr,
        isCorrect
      };
    });

    // 3. Fetch submissions list
    const { data: subRow, error: subError } = await supabaseAdmin
      .from('site_content')
      .select('data')
      .eq('id', 'challenge_submissions')
      .maybeSingle();

    let currentSubmissionsList = [];
    if (subRow && subRow.data && Array.isArray(subRow.data.submissions)) {
      currentSubmissionsList = subRow.data.submissions;
    }

    // Prepare answers object including metadata
    const finalAnswers = {
      ...answers,
      _challengeId: finalChallengeId
    };

    // Prepare new submission record
    const targetEmail = email.toLowerCase().trim();
    // Composite ID to prevent duplicate submissions for the same challenge
    const submissionId = `${finalChallengeId}___${targetEmail}`;
    const newSubmission = {
      id: submissionId,
      fullName,
      email: targetEmail,
      memberId: (memberId || '').toUpperCase().trim(),
      answers: finalAnswers,
      autoScore,
      totalQuestions: questions.length,
      gradedBreakdown,
      status: 'pending', // pending admin final check
      finalScore: autoScore, // default to auto-graded score, admin can change this
      feedback: '',
      submittedAt: new Date().toISOString(),
      publishedAt: null
    };

    // Save to the new challenge_submissions table
    try {
      const { error: insertRowError } = await supabaseAdmin
        .from('challenge_submissions')
        .upsert({
          id: submissionId,
          full_name: fullName,
          email: targetEmail,
          member_id: (memberId || '').toUpperCase().trim(),
          answers: finalAnswers,
          auto_score: autoScore,
          total_questions: questions.length,
          graded_breakdown: gradedBreakdown,
          status: 'pending',
          final_score: autoScore,
          feedback: '',
          submitted_at: new Date().toISOString(),
          published_at: null
        });
      
      if (insertRowError) {
        console.error('Failed to write to challenge_submissions table:', insertRowError);
      }
    } catch (dbErr) {
      console.error('Error upserting to challenge_submissions table:', dbErr);
    }

    // Filter out previous submission from this email & challenge combination to prevent duplicates/spam and record the latest one
    const filteredSubmissions = currentSubmissionsList.filter(
      (sub: any) => !(sub.email === targetEmail && (sub.answers?._challengeId === finalChallengeId || (!sub.answers?._challengeId && finalChallengeId === 'active')))
    );

    filteredSubmissions.push(newSubmission);

    // 4. Save list back to database
    const { error: upsertError } = await supabaseAdmin
      .from('site_content')
      .upsert({
        id: 'challenge_submissions',
        data: { submissions: filteredSubmissions },
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      return NextResponse.json({ error: 'Failed to record student submission: ' + upsertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, submission: newSubmission });

  } catch (error: any) {
    console.error('Submit API Error:', error);
    return NextResponse.json({ error: error.message || 'Server error occurred ' }, { status: 500 });
  }
}
