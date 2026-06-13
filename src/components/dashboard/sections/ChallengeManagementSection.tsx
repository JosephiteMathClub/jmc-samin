import React, { useState, useEffect } from 'react';
import { HelpCircle, Plus, Trash, Save, CheckCircle, XCircle, Clock, Search, Filter, Mail, Award, Edit3, Loader2, Sparkles, Send, ShieldCheck, ArrowLeft, Eye } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { MathJaxNode } from '../../MathJaxNode';
import { useAuth } from '../../../context/AuthContext';
import { LatexCheatsheetTrigger } from '../../LatexCheatsheetTrigger';
import { useMathJax } from '../../../hooks/useMathJax';

interface ChallengeManagementSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  shouldReduceGfx?: boolean;
}

export const ChallengeManagementSection: React.FC<ChallengeManagementSectionProps> = ({
  data,
  updateField,
  shouldReduceGfx = false
}) => {
  const { isSuperAdmin } = useAuth();
  
  useMathJax();
  
  // List of all challenges in DB
  const [challengesList, setChallengesList] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [savingChallenge, setSavingChallenge] = useState(false);

  // Selected/Editing challenge state
  // If editing is active, this is the challenge object we are mutating.
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);

  // Submissions list
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Reviewing single submission state
  const [reviewingSub, setReviewingSub] = useState<any>(null);
  const [reviewScore, setReviewScore] = useState<number>(0);
  const [reviewFeedback, setReviewFeedback] = useState<string>('');
  const [publishingResult, setPublishingResult] = useState<boolean>(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [challengeFilter, setChallengeFilter] = useState('all');

  const fetchChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const res = await fetch('/api/challenges');
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.challenges)) {
        setChallengesList(resData.challenges);
      }
    } catch (err) {
      console.error('Failed to query challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const fetchSubmissions = async () => {
    setLoadingSubmissions(true);
    try {
      const res = await fetch('/api/challenge/submissions');
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.submissions)) {
        setSubmissions(resData.submissions);
      }
    } catch (err) {
      console.error('Failed to query submissions:', err);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Fetch data on load
  useEffect(() => {
    fetchChallenges();
    fetchSubmissions();
  }, []);

  // Update challenge filter when selectedChallenge changes
  useEffect(() => {
    if (selectedChallenge && selectedChallenge.id) {
      setChallengeFilter(selectedChallenge.id);
    } else {
      setChallengeFilter('all');
    }
  }, [selectedChallenge]);

  const handleInitNewChallenge = () => {
    setSelectedChallenge({
      id: `new-${Date.now()}`,
      title: 'New Math Competition Paper',
      description: 'Solve these math problems and write your exact answers.',
      questions: [
        { id: `q_${Date.now()}_1`, text: '', answer: '' }
      ],
      published: false,
      deadline: ''
    });
  };

  const handleAddQuestion = () => {
    if (!selectedChallenge) return;
    const nextNum = (selectedChallenge.questions || []).length + 1;
    const newId = `q_${Date.now()}_${nextNum}`;
    setSelectedChallenge((prev: any) => ({
      ...prev,
      questions: [
        ...(prev.questions || []),
        { id: newId, text: '', answer: '' }
      ]
    }));
  };

  const handleUpdateQuestion = (id: string, text: string, answer: string) => {
    if (!selectedChallenge) return;
    setSelectedChallenge((prev: any) => ({
      ...prev,
      questions: (prev.questions || []).map((q: any) => 
        q.id === id ? { ...q, text, answer } : q
      )
    }));
  };

  const handleRemoveQuestion = (id: string) => {
    if (!selectedChallenge) return;
    setSelectedChallenge((prev: any) => ({
      ...prev,
      questions: (prev.questions || []).filter((q: any) => q.id !== id)
    }));
  };

  const handleSaveChallenge = async (publish: boolean) => {
    if (!selectedChallenge) return;
    setSavingChallenge(true);
    try {
      const payload = {
        id: selectedChallenge.id,
        title: selectedChallenge.title || 'Math Competition Paper',
        description: selectedChallenge.description || '',
        questions: (selectedChallenge.questions || []).map((q: any) => ({
          ...q,
          answer: String(q.answer).trim()
        })),
        published: publish,
        deadline: selectedChallenge.deadline || null
      };

      const res = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const resData = await res.json();
      
      if (resData.success) {
        alert(publish ? 'Challenge successfully PUBLISHED live!' : 'Challenge saved as UNPUBLISHED draft!');
        setSelectedChallenge(null);
        fetchChallenges();
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (err) {
      alert('Failed to save challenge paper.');
    } finally {
      setSavingChallenge(false);
    }
  };

  const handleDeleteChallenge = async (id: string, title: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete "${title}"? This will permanently purge this challenge paper.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/challenges?id=${id}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        alert('Challenge deleted successfully.');
        if (selectedChallenge?.id === id) {
          setSelectedChallenge(null);
        }
        if (id === 'active') {
          updateField('challengePaper', null);
        }
        fetchChallenges();
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (err) {
      alert('Failed to delete challenge.');
    }
  };

  const handleStartReview = (sub: any) => {
    setReviewingSub(sub);
    setReviewScore(sub.finalScore !== undefined ? sub.finalScore : sub.autoScore);
    setReviewFeedback(sub.feedback || '');
  };

  const handlePublishResult = async () => {
    if (!reviewingSub) return;
    setPublishingResult(true);
    try {
      const res = await fetch('/api/challenge/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submissionId: reviewingSub.id,
          finalScore: reviewScore,
          feedback: reviewFeedback,
          publish: true
        })
      });
      const resData = await res.json();
      if (resData.success) {
        // Update local state list
        setSubmissions(prev =>
          prev.map(s => s.id === reviewingSub.id ? resData.submission : s)
        );
        setReviewingSub(resData.submission);
        alert('Results successfully verified and published! Notification email dispatched.');
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (err) {
      alert('Connection lost. Please try again.');
    } finally {
      setPublishingResult(false);
    }
  };

  const [deletingSubmission, setDeletingSubmission] = useState(false);

  const handleDeleteSubmission = async () => {
    if (!isSuperAdmin) {
      alert("Permission denied. Only Super Admins can delete student submissions.");
      return;
    }
    if (!reviewingSub) return;
    if (!window.confirm(`Are you absolutely sure you want to delete ${reviewingSub.fullName}'s submission? This action is IRREVERSIBLE.`)) {
      return;
    }
    setDeletingSubmission(true);
    try {
      const res = await fetch(`/api/challenge/submissions?submissionId=${reviewingSub.id}`, {
        method: 'DELETE'
      });
      const resData = await res.json();
      if (resData.success) {
        setSubmissions(prev => prev.filter(s => s.id !== reviewingSub.id));
        setReviewingSub(null);
        alert('Student submission deleted/purged successfully!');
      } else {
        alert('Error: ' + resData.error);
      }
    } catch (err) {
      alert('Network error. Failed to delete submission.');
    } finally {
      setDeletingSubmission(false);
    }
  };

  const [clearingBoard, setClearingBoard] = useState(false);

  const handleClearLeaderboard = async (mode: 'unpublish' | 'delete') => {
    if (mode === 'delete' && !isSuperAdmin) {
      alert("Permission denied. Only Super Admins can reset/delete challenge submissions.");
      return;
    }
    const paperName = challengeFilter === 'active' ? 'Active/Legacy Paper' : (challengesList.find(c => c.id === challengeFilter)?.title || challengeFilter);
    const confirmMsg = mode === 'delete'
      ? `WARNING: This will PERMANENTLY DELETE all student submissions/attempts for challenge "${paperName}"! This is IRREVERSIBLE. Proceed?`
      : `This will unpublish all submissions for challenge "${paperName}" and set them back to pending, removing them from the public standings. Proceed?`;

    if (!window.confirm(confirmMsg)) return;

    setClearingBoard(true);
    try {
      const res = await fetch(`/api/challenge/leaderboard?challengeId=${challengeFilter}&mode=${mode}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Leaderboard cleared successfully.');
        fetchSubmissions(); // reload entries list
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Connection lost. Please try again.');
    } finally {
      setClearingBoard(false);
    }
  };

  // Filter submissions list based on query, status, and active paper selection
  const filteredSubmissions = submissions.filter((sub: any) => {
    const matchesSearch =
      sub.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.memberId?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      sub.status === statusFilter;

    // Filter submissions for the active challenge
    const subChallengeId = sub.answers?._challengeId || 'active';
    const matchesChallenge =
      challengeFilter === 'all' ||
      subChallengeId === challengeFilter;

    return matchesSearch && matchesStatus && matchesChallenge;
  });

  return (
    <div className="space-y-12">
      <DashboardSection
        icon={HelpCircle}
        title="Challenge Board Manager"
        description="Write and publish math challenge question papers manually, set correct solutions, and audit student answers."
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* Column 1: Configurator / Designer */}
          <div className="glass-card p-6 md:p-8 space-y-8 animate-fadeIn">
            
            {selectedChallenge ? (
              // B. Challenge Composer/Editor View
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <button
                    onClick={() => setSelectedChallenge(null)}
                    className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>BACK TO LIST</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {selectedChallenge.published ? (
                      <span className="text-[9px] font-mono font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                        🟢 Published
                      </span>
                    ) : (
                      <span className="text-[9px] font-mono font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase">
                        🔴 Draft
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold uppercase tracking-tight text-white flex items-center gap-2">
                    <Edit3 className="w-5 h-5 text-amber-500" />
                    Challenge Composer
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-mono uppercase">MANUALLY WRITE HEURISTIC PROBLEMS</p>
                </div>

                <div className="space-y-4">
                  <DashboardFormField label="Challenge Paper Title" description="e.g. Weekly Olympiad Round 1">
                    <input
                      type="text"
                      value={selectedChallenge.title}
                      onChange={(e) => setSelectedChallenge({ ...selectedChallenge, title: e.target.value })}
                      placeholder="Enter title..."
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-semibold"
                    />
                  </DashboardFormField>

                  <DashboardFormField label="Invitation / Instructions" description="Instructions, context notes, or math tips. Supports MathJax.">
                    <textarea
                      rows={3}
                      value={selectedChallenge.description}
                      onChange={(e) => setSelectedChallenge({ ...selectedChallenge, description: e.target.value })}
                      placeholder="Type guidelines..."
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm min-h-[100px]"
                    />
                    {selectedChallenge.description?.trim() && (
                      <div className="mt-3 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl">
                        <p className="text-[9px] font-mono font-black uppercase text-amber-500 mb-2">Live Typeset Preview</p>
                        <MathJaxNode content={selectedChallenge.description} className="text-zinc-300 text-xs font-light leading-relaxed" />
                      </div>
                    )}
                  </DashboardFormField>

                  <DashboardFormField label="Submission Deadline" description="Student portal blocks attempts after this deadline.">
                    <input
                      type="datetime-local"
                      value={selectedChallenge.deadline ? selectedChallenge.deadline.substring(0, 16) : ''}
                      onChange={(e) => setSelectedChallenge({ ...selectedChallenge, deadline: e.target.value })}
                      className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-mono"
                    />
                  </DashboardFormField>
                </div>

                {/* Questions Composer List */}
                <div className="space-y-6 pt-6 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-mono font-black uppercase text-zinc-400">QUESTIONS LIST ({(selectedChallenge.questions || []).length})</h4>
                      <p className="text-[10px] text-zinc-500">Provide exact digital answers (must be numeric values)</p>
                    </div>
                    <button
                      onClick={handleAddQuestion}
                      className="p-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-wider rounded-xl flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-black" />
                      <span>ADD_Q</span>
                    </button>
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {(selectedChallenge.questions || []).length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 border border-dashed border-white/10 rounded-2xl text-xs font-mono">
                        NO QUESTIONS INITIALIZED.
                      </div>
                    ) : (
                      (selectedChallenge.questions || []).map((q: any, idx: number) => (
                        <div key={q.id} className="p-5 bg-black/60 border border-white/5 rounded-2xl space-y-4 relative group">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-mono font-black text-amber-500/80">PROBLEM {idx + 1}</span>
                            <button
                              onClick={() => handleRemoveQuestion(q.id)}
                              className="p-2 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 rounded-lg transition-all"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="space-y-2">
                            <input
                              type="text"
                              value={q.text}
                              onChange={(e) => handleUpdateQuestion(q.id, e.target.value, q.answer)}
                              placeholder="Describe question scenario, equation, etc..."
                              className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-amber-500/40 text-xs"
                            />
                            {q.text?.trim() && (
                              <div className="mt-1.5 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
                                <p className="text-[8px] font-mono font-black uppercase text-zinc-500 mb-1">Live Math Preview</p>
                                <MathJaxNode content={q.text} className="text-zinc-300 text-xs font-light" />
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <input
                                type="number"
                                value={q.answer}
                                onChange={(e) => handleUpdateQuestion(q.id, q.text, e.target.value)}
                                placeholder="Core digital solution value (e.g. 42)..."
                                className="w-full px-4 py-3 bg-black/40 border border-white/5 rounded-xl text-white outline-none focus:border-amber-500/40 text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="pt-6 border-t border-white/5 space-y-3">
                    <button
                      onClick={() => handleSaveChallenge(true)}
                      disabled={savingChallenge}
                      className="w-full h-14 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-mono font-black uppercase tracking-[0.25em] rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 active:scale-95 disabled:opacity-50"
                    >
                      {savingChallenge ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>PUBLISHING LIVE...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4 text-black" />
                          <span>PUBLISH LIVE FOR USERS</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleSaveChallenge(false)}
                      disabled={savingChallenge}
                      className="w-full h-11 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 text-white text-xs font-mono font-black uppercase tracking-[0.2em] rounded-xl flex items-center justify-center gap-2 transition-all transition-colors duration-300 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4" />
                      <span>SAVE AS UNPUBLISHED DRAFT</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              // A. Challenge Lists Grid View (Default)
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-display font-bold uppercase tracking-tight text-white">
                      Challenge Papers
                    </h3>
                    <p className="text-zinc-500 text-[10px] font-mono uppercase">MANAGE ACTIVE AND PREVIOUS TESTS</p>
                  </div>

                  <button
                    onClick={handleInitNewChallenge}
                    className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 text-black text-xs font-mono font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>NEW_CHALLENGE</span>
                  </button>
                </div>

                {loadingChallenges ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-xs font-mono text-zinc-500 uppercase">LOADING CHALLENGES...</span>
                  </div>
                ) : challengesList.length === 0 ? (
                  <div className="text-center py-16 text-zinc-600 text-xs font-mono uppercase border border-dashed border-white/10 rounded-2xl">
                    NO CHALLENGE PAPERS ADDED YET. CLICK "NEW_CHALLENGE" TO START.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto pr-2">
                    {challengesList.map((chal: any) => (
                      <div
                        key={chal.id}
                        className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-col justify-between gap-4 relative group"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <h4 className="font-display font-medium text-white text-base truncate pr-5">{chal.title}</h4>
                            <p className="text-zinc-500 text-[11px] leading-relaxed line-clamp-2">
                              {chal.description || 'No description provided.'}
                            </p>
                          </div>
                      
                          <div className="absolute top-5 right-5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => {
                                // Close reviewing Sub and edit this challenge
                                setReviewingSub(null);
                                setSelectedChallenge(chal);
                              }}
                              className="p-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-amber-500 rounded-lg transition-colors"
                              title="Edit challenge"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteChallenge(chal.id, chal.title)}
                              className="p-2 bg-white/5 hover:bg-red-500/10 text-zinc-300 hover:text-red-500 rounded-lg transition-colors"
                              title="Delete challenge"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono border-t border-white/5 pt-4">
                          <div className="flex gap-4">
                            <div>QUESTIONS: <span className="text-white font-bold">{(chal.questions || []).length}</span></div>
                            {chal.deadline && (
                              <div className="text-zinc-400">
                                DUE: <span className="text-rose-400">{new Date(chal.deadline).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>

                          <div>
                            {chal.published ? (
                              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 px-2 py-0.5 rounded text-[8px] uppercase font-bold">PUBLISHED LIVE</span>
                            ) : (
                              <span className="bg-amber-500/10 text-amber-500 border border-amber-500/10 px-2 py-0.5 rounded text-[8px] uppercase font-bold">UNPUBLISHED DRAFT</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Column 2: Student Submissions Grid */}
          <div className="space-y-6">
            <div className="glass-card p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-bold uppercase tracking-tight text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Submissions ({filteredSubmissions.length})
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-mono uppercase">REVIEW STUDENT TEST GRADES</p>
                </div>
                <button
                  onClick={fetchSubmissions}
                  className="p-2 rounded-lg bg-black/40 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                >
                  {loadingSubmissions ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Filters list */}
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by student details..."
                      className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-white/5 rounded-xl text-white placeholder-zinc-500 text-xs outline-none focus:border-amber-500/40"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-zinc-500 shrink-0" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="bg-black/60 border border-white/5 text-zinc-300 text-xs rounded-xl px-4 py-2.5 outline-none focus:border-amber-500/40"
                    >
                      <option value="all">ALL STATUSES</option>
                      <option value="pending">PENDING CHECK</option>
                      <option value="published">PUBLISHED</option>
                    </select>
                  </div>
                </div>

                {/* Challenge filter */}
                <div className="flex flex-col gap-3.5 border-t border-white/5 pt-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono uppercase text-zinc-500 font-bold">Paper Filter:</span>
                    <select
                      value={challengeFilter}
                      onChange={(e) => setChallengeFilter(e.target.value)}
                      className="flex-1 bg-black/60 border border-white/5 text-zinc-300 text-xs rounded-xl px-4 py-2 outline-none focus:border-amber-500/40 font-mono"
                    >
                      <option value="all">All Challenge Submissions</option>
                      <option value="active">Active/Legacy Paper</option>
                      {challengesList.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>

                  {challengeFilter !== 'all' && (
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleClearLeaderboard('unpublish')}
                        disabled={clearingBoard}
                        className="flex-1 h-9 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        Unpublish All (Clear Board)
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleClearLeaderboard('delete')}
                          disabled={clearingBoard}
                          className="flex-1 h-9 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/40 text-red-400 hover:text-red-300 text-[10px] font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                        >
                          Reset / Purge Attempts
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {loadingSubmissions ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                    <span className="text-xs font-mono text-zinc-500 uppercase">SYNCHRONIZING ATTEMPTS...</span>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-16 text-zinc-650 text-xs font-mono uppercase">
                    NO ATTEMPTS MATCHING THE ACTIVE FILTER
                  </div>
                ) : (
                  filteredSubmissions.map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => handleStartReview(sub)}
                      className={`p-4 md:p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        reviewingSub?.id === sub.id
                          ? 'border-amber-500 bg-amber-500/5'
                          : 'border-white/5 bg-black/30 hover:bg-black/50'
                      }`}
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-white truncate">{sub.fullName}</span>
                          {sub.memberId && (
                            <span className="text-[8px] font-mono font-bold text-zinc-500 bg-white/5 px-2 py-0.5 rounded-full shrink-0">
                              {sub.memberId}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-500 truncate font-mono">
                          <Mail className="w-3 h-3 shrink-0" />
                          <span className="truncate">{sub.email}</span>
                        </div>
                        <div className="text-[8px] font-mono text-zinc-600 truncate">
                          ID: {sub.answers?._challengeId || 'active'}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold text-amber-400">
                          SCORE: {sub.status === 'published' ? sub.finalScore : sub.autoScore}/{sub.totalQuestions}
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 justify-end">
                          {sub.status === 'published' ? (
                            <>
                              <span className="text-[8px] font-mono font-black uppercase text-emerald-400">PUBLISHED</span>
                              <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                            </>
                          ) : (
                            <>
                              <span className="text-[8px] font-mono font-black uppercase text-amber-500">PENDING</span>
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Verification Detail Review Modal/Panel */}
            {reviewingSub && (
              <div className="glass-card p-6 md:p-8 space-y-6 border-amber-500/25 bg-amber-950/5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h4 className="text-xs font-mono font-bold text-amber-500 uppercase tracking-widest">VERIFYING ATTEMPT</h4>
                    <h3 className="text-xl font-display font-bold text-white truncate">{reviewingSub.fullName}</h3>
                  </div>
                  <button
                    onClick={() => setReviewingSub(null)}
                    className="p-2 hover:bg-white/5 text-zinc-400 hover:text-white rounded-lg text-xs font-mono"
                  >
                    [CLOSE]
                  </button>
                </div>

                {/* Visual student answers review list */}
                <div className="space-y-3 bg-black/45 border border-white/5 rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest block font-bold">
                      STUDENT SUBMISSION AUDIT
                    </span>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">
                      VERIFY SUBMITTED ANSWERS
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                    {(() => {
                      const subChallengeId = reviewingSub.answers?._challengeId || 'active';
                      const matchingChallenge = challengesList.find((c: any) => c.id === subChallengeId);
                      const questionsList = matchingChallenge?.questions || [];

                      if (questionsList.length > 0) {
                        return questionsList.map((q: any, idx: number) => {
                          const studentAnswer = reviewingSub.answers?.[q.id];
                          const isCorrect = studentAnswer !== undefined && String(studentAnswer).trim() !== '' && 
                            String(studentAnswer).trim().toLowerCase() === String(q.answer).trim().toLowerCase();
                          return (
                            <div key={q.id} className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-2">
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className="text-zinc-500 uppercase font-extrabold">Problem {idx + 1}</span>
                                {isCorrect ? (
                                  <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3 text-emerald-400" /> Auto Correct
                                  </span>
                                ) : (
                                  <span className="bg-rose-500/15 text-rose-400 px-2 py-0.5 rounded text-[8px] font-bold uppercase flex items-center gap-1">
                                    <XCircle className="w-3 h-3 text-rose-400" /> Incorrect / Unmatched
                                  </span>
                                )}
                              </div>

                              <div className="text-zinc-300 text-xs">
                                <MathJaxNode content={q.text} />
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-white/[0.03] pt-1.5">
                                <div className="text-zinc-500 uppercase">
                                  EXPECTED: <span className="text-emerald-400 font-bold">{q.answer}</span>
                                </div>
                                <div className="text-zinc-500 uppercase text-right">
                                  SUBMITTED: <span className={isCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {studentAnswer !== undefined && studentAnswer !== '' ? studentAnswer : '[ BLANK ]'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        });
                      } else {
                        // Fallback: Loop over graded breakdown or raw answers key-value map
                        return (reviewingSub.gradedBreakdown && reviewingSub.gradedBreakdown.length > 0) ? (
                          reviewingSub.gradedBreakdown.map((b: any, idx: number) => (
                            <div key={b.questionId || idx} className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl space-y-1">
                              <div className="flex items-center justify-between text-[9px] font-mono">
                                <span className="text-zinc-500 uppercase font-extrabold text-[8px]">Problem {idx + 1}</span>
                                {b.isCorrect ? (
                                  <span className="text-emerald-400 font-bold">Auto Correct</span>
                                ) : (
                                  <span className="text-rose-400 font-bold">Incorrect</span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono">
                                <div className="text-zinc-500 uppercase max-w-full truncate">Q_ID: {b.questionId}</div>
                                <div className="text-zinc-500 uppercase text-right">
                                  SUBMITTED: <span className={b.isCorrect ? "text-emerald-400 font-bold" : "text-rose-400 font-bold"}>
                                    {b.userAnswer || '[ BLANK ]'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          Object.entries(reviewingSub.answers || {}).filter(([k]) => !k.startsWith('_')).map(([qId, val]: any, idx: number) => (
                            <div key={qId} className="p-2.5 bg-zinc-950/40 border border-white/5 rounded-xl flex items-center justify-between gap-2 text-[10px] font-mono">
                              <span className="text-zinc-500">PROBLEM_{idx + 1} ({qId})</span>
                              <span className="text-zinc-300 font-bold">{val || '[ BLANK ]'}</span>
                            </div>
                          ))
                        );
                      }
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block font-bold">verified final score</label>
                    <input
                      type="number"
                      value={reviewScore}
                      min={0}
                      max={reviewingSub.totalQuestions}
                      onChange={(e) => setReviewScore(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 font-mono font-black text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block font-bold">system auto-grade</label>
                    <div className="w-full px-4 py-3.5 bg-black/30 border border-white/5 rounded-xl text-zinc-500 font-mono text-xs font-bold">
                      {reviewingSub.autoScore} / {reviewingSub.totalQuestions} correct
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest block font-bold">MODERATOR_REMARKS</label>
                  <textarea
                    rows={2}
                    value={reviewFeedback}
                    onChange={(e) => setReviewFeedback(e.target.value)}
                    placeholder="Constructive feedback or scoring insights..."
                    className="w-full px-4 py-3 bg-black/60 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500/50 min-h-[60px]"
                  />
                </div>

                <div className="space-y-2.5 pt-2">
                  <button
                    onClick={handlePublishResult}
                    disabled={publishingResult || deletingSubmission}
                    className="w-full h-12 bg-white hover:bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 duration-300 active:scale-95 disabled:opacity-50 transition-colors"
                  >
                    {publishingResult ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-black" />
                        <span>DISPATCHING VERDICT...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 text-black" />
                        <span>{reviewingSub.status === 'published' ? 'UPDATE & DISPATCH NEW VERDICT' : 'PUBLISH VERDICT (NOTIFY STUDENT)'}</span>
                      </>
                    )}
                  </button>

                  {isSuperAdmin && (
                    <button
                      onClick={handleDeleteSubmission}
                      disabled={publishingResult || deletingSubmission}
                      className="w-full h-12 bg-red-500/10 hover:bg-red-650 border border-red-500/20 hover:border-red-500 hover:text-white text-red-400 text-xs font-mono font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 duration-300 active:scale-95 disabled:opacity-50 transition-all font-bold"
                    >
                      {deletingSubmission ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-red-00" />
                          <span>PURGING STUDENT ATTEMPT...</span>
                        </>
                      ) : (
                        <>
                          <Trash className="w-4 h-4" />
                          <span>DELETE SUBMISSION (SUPER ADMIN ONLY)</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {selectedChallenge && <LatexCheatsheetTrigger />}
        </div>
      </DashboardSection>
    </div>
  );
};
