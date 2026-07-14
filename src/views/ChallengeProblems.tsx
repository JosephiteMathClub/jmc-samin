"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, HelpCircle, ArrowRight, Loader2, Save, CheckCircle, XCircle, Clock, Send, Award, Mail, User, ShieldCheck, Trophy, Search, RefreshCw, ArrowLeft, Eye } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components/Skeleton';
import { usePerformance } from '../hooks/usePerformance';
import { MathJaxNode } from '../components/MathJaxNode';

const PageSkeleton = ({ embedded = false }: { embedded?: boolean }) => (
  <div className={embedded ? "py-8" : "min-h-screen bg-[#050505] pt-40"}>
    <div className={embedded ? "max-w-4xl mx-auto" : "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"}>
      <Skeleton className="h-6 w-32 mb-4 bg-white/5" />
      <Skeleton className="h-16 w-3/4 mb-6 bg-white/5" />
      <Skeleton className="h-32 w-full rounded-[2.5rem] mb-8 bg-white/5" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-3xl bg-white/5 animate-pulse" />
        ))}
      </div>
    </div>
  </div>
);

interface ChallengeProblemsProps {
  embedded?: boolean;
}

const ChallengeProblems = ({ embedded = false }: ChallengeProblemsProps) => {
  const { content, loading } = useContent();
  const { user, profile, isAdmin, isSuperAdmin } = useAuth();
  const { shouldReduceGfx } = usePerformance();

  const [activeTab, setActiveTab] = useState<'portal' | 'leaderboard'>('portal');

  // List of all challenges the user can select
  const [publishedChallenges, setPublishedChallenges] = useState<any[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<any | null>(null);

  // Leaderboard states
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);
  const [leaderboardSearch, setLeaderboardSearch] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [leaderboardChallengeId, setLeaderboardChallengeId] = useState<string>('active');
  const [isClearing, setIsClearing] = useState(false);

  const handleClearLeaderboard = async (mode: 'unpublish' | 'delete') => {
    if (mode === 'delete' && !isSuperAdmin) {
      alert("Permission denied. Only Super Admins can reset/delete leaderboard submissions.");
      return;
    }
    const chal = publishedChallenges.find((c: any) => c.id === leaderboardChallengeId);
    const paperName = leaderboardChallengeId === 'active' ? 'Active/Legacy Paper' : (chal?.title || leaderboardChallengeId);
    
    const confirmMsg = mode === 'delete' 
      ? `WARNING: This will PERMANENTLY DELETE all student submissions/attempts for challenge "${paperName}"! This is irreversible. Proceed?`
      : `This will unpublish all submissions for challenge "${paperName}" and set them back to pending, removing them from the public standings. Proceed?`;
    
    if (!window.confirm(confirmMsg)) return;

    setIsClearing(true);
    try {
      const res = await fetch(`/api/challenge/leaderboard?challengeId=${leaderboardChallengeId}&mode=${mode}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Leaderboard cleared successfully.');
        fetchLeaderboard(leaderboardChallengeId);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Failed to connect to server.');
    } finally {
      setIsClearing(false);
    }
  };

  // Student Profile entered/preloaded
  const [studentDetails, setStudentDetails] = useState({
    fullName: '',
    email: '',
    memberId: ''
  });
  const [hasEntered, setHasEntered] = useState(false);
  const [fetchingSub, setFetchingSub] = useState(false);
  const [submittingAnswers, setSubmittingAnswers] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Active student submission (if found in database for selectedChallenge)
  const [mySubmission, setMySubmission] = useState<any>(null);

  // Student's answer inputs: questionId -> answer string
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const fetchPublishedChallenges = async () => {
    setLoadingChallenges(true);
    try {
      const res = await fetch('/api/challenges');
      const resData = await res.json();
      if (resData.success && Array.isArray(resData.challenges)) {
        // Only display published challenges to students
        const pub = resData.challenges.filter((c: any) => c.published);
        setPublishedChallenges(pub);
        
        // Sync default leaderboard selection
        if (pub.length > 0) {
          setLeaderboardChallengeId(pub[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load active challenges:', err);
    } finally {
      setLoadingChallenges(false);
    }
  };

  const fetchLeaderboard = async (chalId = leaderboardChallengeId, silent = false) => {
    if (!silent) setLoadingLeaderboard(true);
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/challenge/leaderboard?challengeId=${chalId}`);
      const data = await response.json();
      if (data.success && Array.isArray(data.leaderboard)) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to update leaderboard:', err);
    } finally {
      setLoadingLeaderboard(false);
      setIsRefreshing(false);
      setLastRefreshed(new Date());
    }
  };

  // Fetch initial challenges and select default leaderboard
  useEffect(() => {
    fetchPublishedChallenges();
  }, []);

  // Sync leaderboard when challenge select box updates
  useEffect(() => {
    fetchLeaderboard(leaderboardChallengeId);
  }, [leaderboardChallengeId]);

  // Periodic refresher for standings
  useEffect(() => {
    const interval = setInterval(() => {
      fetchLeaderboard(leaderboardChallengeId, true);
    }, 15000); 
    return () => clearInterval(interval);
  }, [leaderboardChallengeId]);

  // Prefill student details if logged in
  useEffect(() => {
    if (profile) {
      setStudentDetails({
        fullName: profile.full_name || '',
        email: profile.email || user?.email || '',
        memberId: profile.member_id || ''
      });
    }
  }, [profile, user]);

  // Poll or fetch student's latest submission on entering challenge
  const fetchSubmissionDetails = async (emailToFetch: string, challengeId: string) => {
    setFetchingSub(true);
    setErrorMessage('');
    try {
      const response = await fetch(`/api/challenge/my-submission?email=${encodeURIComponent(emailToFetch)}&challengeId=${challengeId}`);
      const resData = await response.json();
      if (resData.success && resData.submission) {
        setMySubmission(resData.submission);
        // Prefill their answer inputs
        if (resData.submission.answers) {
          setAnswers(resData.submission.answers);
        }
      } else {
        setMySubmission(null);
      }
    } catch (err: any) {
      setErrorMessage('Failed to query paper status. Please check your network.');
    } finally {
      setFetchingSub(false);
    }
  };

  const handleEnterChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallenge) return;
    if (!studentDetails.fullName.trim() || !studentDetails.email.trim()) {
      setErrorMessage('Please fill in your name and email to proceed.');
      return;
    }
    
    setFetchingSub(true);
    setErrorMessage('');
    let subExists = false;
    
    try {
      const response = await fetch(`/api/challenge/my-submission?email=${encodeURIComponent(studentDetails.email)}&challengeId=${selectedChallenge.id}`);
      const resData = await response.json();
      if (resData.success && resData.submission) {
        setMySubmission(resData.submission);
        subExists = true;
        if (resData.submission.answers) {
          setAnswers(resData.submission.answers);
        }
      } else {
        setMySubmission(null);
      }
      
      const isDeadlinePassed = selectedChallenge.deadline ? new Date() > new Date(selectedChallenge.deadline) : false;
      if (!subExists && isDeadlinePassed) {
        setErrorMessage(`The competition deadline for this round expired on ${new Date(selectedChallenge.deadline).toLocaleString()}. No new submissions are accepted.`);
        setFetchingSub(false);
        return;
      }
      
      setHasEntered(true);
    } catch (err: any) {
      setErrorMessage('Failed to query system status. Please try again.');
    } finally {
      setFetchingSub(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!selectedChallenge) return;
    setSubmittingAnswers(true);
    setErrorMessage('');
    try {
      const response = await fetch('/api/challenge/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: studentDetails.fullName,
          email: studentDetails.email,
          memberId: studentDetails.memberId,
          challengeId: selectedChallenge.id,
          answers
        })
      });
      const resData = await response.json();
      if (resData.success) {
        setMySubmission(resData.submission);
        setShowConfirmModal(false);
      } else {
        setErrorMessage(resData.error || 'Failed to submit answers.');
      }
    } catch (err) {
      setErrorMessage('Network connection lost. Please verify your connection.');
    } finally {
      setSubmittingAnswers(false);
    }
  };

  const totalQuestions = selectedChallenge?.questions ? selectedChallenge.questions.length : 0;
  const answeredCount = selectedChallenge?.questions 
    ? selectedChallenge.questions.filter((q: any) => {
        const val = answers[q.id];
        return val !== undefined && val !== null && String(val).trim() !== '';
      }).length 
    : 0;

  if (loading || loadingChallenges) return <PageSkeleton embedded={embedded} />;

  return (
    <div className={embedded ? "w-full" : "relative min-h-screen bg-[#050505] text-white overflow-hidden pb-32"}>
      {/* Background glow ambiance */}
      {!embedded && !shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[600px] h-[600px] bg-amber-500/5 -top-40 right-0" />
          <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 bottom-0 left-0" />
        </>
      )}

      <div className={embedded ? "w-full mx-auto relative z-10" : "pt-40 max-w-4xl mx-auto px-6 relative z-10"}>
        
        {/* Title Block */}
        {!embedded && (
          <ScrollReveal>
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] uppercase tracking-[0.40em] font-black text-amber-400 font-mono">
                COMPETE & EXCEL
              </span>
            </div>
            <h1 className="text-5xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 uppercase">
              CHALLENGE<br />
              <span className="bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 bg-clip-text text-transparent">PROBLEMS</span>
            </h1>
            <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed mb-16 font-light">
              Welcome to the official math challenge room. Put your problem-solving skills to the ultimate test. Solve, type in, and wait for verified results.
            </p>
          </ScrollReveal>
        )}

        {/* Tab Controls */}
        <div className="flex justify-center sm:justify-start mb-12">
          <div className="inline-flex p-1.5 rounded-full bg-zinc-950/60 border border-white/5 backdrop-blur-xl relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            <button
              onClick={() => setActiveTab('portal')}
              className={`px-6 py-2.5 rounded-full font-display text-xs font-black uppercase tracking-wider transition-all relative z-10 shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'portal'
                  ? 'text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeTab === 'portal' && (
                <motion.div
                  layoutId="challengeTabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <HelpCircle className={`w-3.5 h-3.5 ${activeTab === 'portal' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Challenge Portal</span>
            </button>

            <button
              onClick={() => setActiveTab('leaderboard')}
              className={`px-6 py-2.5 rounded-full font-display text-xs font-black uppercase tracking-wider transition-all relative z-10 shrink-0 flex items-center gap-2 cursor-pointer ${
                activeTab === 'leaderboard'
                  ? 'text-black font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeTab === 'leaderboard' && (
                <motion.div
                  layoutId="challengeTabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Trophy className={`w-3.5 h-3.5 ${activeTab === 'leaderboard' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Standings Leaderboard</span>
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
            </button>
          </div>
        </div>

        {/* Outer State Controller */}
        <AnimatePresence mode="wait">
          {activeTab === 'leaderboard' ? (
            <motion.div
              key="leaderboard-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              <div className="flex flex-col sm:flex-row gap-4 justify-between sm:items-center bg-zinc-950/40 border border-white/5 p-5 rounded-2xl">
                {/* Board dropdown indicator */}
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-[10px] font-mono text-zinc-500 font-black uppercase shrink-0">ROUND HIGHLIGHT:</span>
                  <select
                    value={leaderboardChallengeId}
                    onChange={(e) => setLeaderboardChallengeId(e.target.value)}
                    className="bg-black/60 border border-white/5 text-zinc-300 text-xs rounded-xl px-4 py-2 outline-none focus:border-amber-500/40 font-mono text-xs font-bold w-full max-w-sm"
                  >
                    {publishedChallenges.some(c => c.id === 'active') ? (
                      <option value="active">Active/Legacy Paper</option>
                    ) : publishedChallenges.length === 0 ? (
                      <option value="active">No active challenges</option>
                    ) : null}
                    {publishedChallenges.filter(c => c.id !== 'active').map((c) => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs font-mono text-zinc-400 self-end sm:self-auto flex-wrap">
                  <span className="text-[10px]">RELOAD INTERVAL: 15S</span>
                  <button
                    type="button"
                    onClick={() => fetchLeaderboard(leaderboardChallengeId)}
                    disabled={isRefreshing}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-300 hover:text-white transition-all disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                  </button>
                  {isAdmin && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleClearLeaderboard('unpublish')}
                        disabled={isClearing}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/25 hover:border-amber-500/50 text-amber-400 rounded-lg hover:text-amber-300 transition-all text-[9px] uppercase font-bold tracking-wider cursor-pointer disabled:opacity-50"
                        title="Set all published scores back to pending / unpublish"
                      >
                        Unpublish All
                      </button>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleClearLeaderboard('delete')}
                          disabled={isClearing}
                          className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/25 hover:border-red-500/50 text-red-400 rounded-lg hover:text-red-300 transition-all text-[9px] uppercase font-bold tracking-wider cursor-pointer disabled:opacity-50"
                          title="Delete all attempts for this challenge"
                        >
                          Reset Board
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {loadingLeaderboard ? (
                <div className="space-y-4 py-12">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : leaderboard.length === 0 ? (
                <div className="glass-card p-16 text-center space-y-6">
                  <Trophy className="w-12 h-12 text-zinc-500 mx-auto opacity-50" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-display font-medium uppercase text-zinc-300">Leaderboard is empty</h3>
                    <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                      No verified student submission results have been published for this particular round yet. Once scores are marked, rankings will instantly sync!
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* Top 3 Podium Highlights */}
                  {leaderboard.length > 0 && leaderboardSearch.trim() === '' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end pt-8">
                      {/* 2nd place */}
                      {leaderboard[1] && (
                        <div className="glass-card p-6 border-zinc-800 bg-zinc-950/20 flex flex-col items-center text-center relative order-2 md:order-1 h-[220px] justify-center overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-zinc-400 to-zinc-200" />
                          <span className="text-2xl mb-1">🥈</span>
                          <p className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase mb-2">RUNNER UP</p>
                          <h4 className="text-lg font-display font-black leading-tight text-white mb-1 truncate max-w-full px-2">
                            {leaderboard[1].fullName}
                          </h4>
                          {leaderboard[1].memberId && (
                            <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full mb-3">
                              {leaderboard[1].memberId}
                            </span>
                          )}
                          <p className="text-3xl font-display font-black text-slate-300 font-mono">
                            {leaderboard[1].score}<span className="text-xs text-zinc-500 font-normal"> / {leaderboard[1].totalQuestions}</span>
                          </p>
                        </div>
                      )}

                      {/* 1st place */}
                      {leaderboard[0] && (
                        <div className="glass-card p-8 border-amber-500/20 bg-amber-950/10 flex flex-col items-center text-center relative order-1 md:order-2 h-[260px] justify-center overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.03)] scale-105 z-10">
                          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
                          <div className="absolute -top-1 right-4 bg-amber-500 text-black text-[9px] font-mono font-black px-2 py-1 uppercase rounded-b-md tracking-wider">
                            CHAMPION
                          </div>
                          <span className="text-4xl mb-2 animate-bounce">👑</span>
                          <p className="text-[10px] font-mono font-black tracking-[0.2em] text-amber-400 uppercase mb-2">RANK_01</p>
                          <h4 className="text-xl font-display font-black leading-tight text-transparent bg-gradient-to-r from-amber-200 to-yellow-400 bg-clip-text mb-1 truncate max-w-full px-2">
                            {leaderboard[0].fullName}
                          </h4>
                          {leaderboard[0].memberId && (
                            <span className="text-[9px] font-mono text-amber-500/80 bg-amber-500/5 border border-amber-500/10 px-2.5 py-0.5 rounded-full mb-3">
                              {leaderboard[0].memberId}
                            </span>
                          )}
                          <p className="text-4xl font-display font-black text-amber-400 font-mono">
                            {leaderboard[0].score}<span className="text-sm text-zinc-500 font-normal"> / {leaderboard[0].totalQuestions}</span>
                          </p>
                        </div>
                      )}

                      {/* 3rd place */}
                      {leaderboard[2] && (
                        <div className="glass-card p-6 border-amber-800/10 bg-amber-950/5 flex flex-col items-center text-center relative order-3 h-[200px] justify-center overflow-hidden">
                          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-700 to-amber-600" />
                          <span className="text-2xl mb-1">🥉</span>
                          <p className="text-[10px] font-mono font-bold tracking-widest text-amber-600 uppercase mb-2">3RD PLACE</p>
                          <h4 className="text-lg font-display font-black leading-tight text-white mb-1 truncate max-w-full px-2">
                            {leaderboard[2].fullName}
                          </h4>
                          {leaderboard[2].memberId && (
                            <span className="text-[9px] font-mono text-zinc-500 bg-white/5 px-2.5 py-0.5 rounded-full mb-3">
                              {leaderboard[2].memberId}
                            </span>
                          )}
                          <p className="text-3xl font-display font-black text-amber-600 font-mono">
                            {leaderboard[2].score}<span className="text-xs text-zinc-500 font-normal"> / {leaderboard[2].totalQuestions}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Search bar inside Leaderboard tab */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      value={leaderboardSearch}
                      onChange={(e) => setLeaderboardSearch(e.target.value)}
                      placeholder="Filter leaderboard by student name or Member ID..."
                      className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-medium"
                    />
                  </div>

                  {/* Standings list */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest px-6 mb-2">
                      <span>CONTENDER RANKING</span>
                      <span>VERIFIED SCORE</span>
                    </div>

                    <div className="space-y-3">
                      {leaderboard
                        .filter((sub: any) =>
                          sub.fullName.toLowerCase().includes(leaderboardSearch.toLowerCase()) ||
                          sub.memberId?.toLowerCase().includes(leaderboardSearch.toLowerCase())
                        )
                        .map((row: any) => {
                          const isTop3 = row.rank <= 3;
                          return (
                            <div
                              key={row.id}
                              className={`glass-card px-6 py-4 flex items-center justify-between gap-4 transition-all ${
                                isTop3 ? 'border-zinc-800 bg-zinc-950/20 shadow-[0_0_20px_rgba(245,158,11,0.01)]' : ''
                              }`}
                            >
                              <div className="flex items-center gap-4 min-w-0">
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono text-xs font-black shrink-0 ${
                                  row.rank === 1 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  row.rank === 2 ? 'bg-slate-300/10 text-slate-300 border border-slate-300/20' :
                                  row.rank === 3 ? 'bg-amber-850/15 text-amber-600 border border-amber-800/20' :
                                  'bg-black/40 text-zinc-500 border border-white/5'
                                }`}>
                                  {row.rank < 10 ? `0${row.rank}` : row.rank}
                                </div>

                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-bold text-white truncate">{row.fullName}</span>
                                    {row.rank === 1 && <span className="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/25 font-mono px-1.5 py-0.5 rounded font-black tracking-widest">RANK_01</span>}
                                  </div>
                                  {row.memberId && (
                                    <p className="text-[10px] font-mono text-zinc-500 uppercase mt-0.5">{row.memberId}</p>
                                  )}
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="font-mono text-sm font-black text-amber-400 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
                                  {row.score} <span className="text-zinc-500 text-xs font-normal">/ {row.totalQuestions}</span>
                                </span>
                                <p className="text-[8px] font-mono text-zinc-500 mt-1.5 font-bold">
                                  SOLVED: {new Date(row.submittedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          ) : (
            // Tab A: Portal Viewing
            !selectedChallenge ? (
              // 1. Selector view Grid (The "Hidden" challenge papers list)
              <motion.div
                key="challenges-list"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                <div className="border border-white/5 rounded-3xl bg-zinc-950/20 p-6 md:p-8 space-y-4">
                  <h3 className="font-display font-bold uppercase text-lg text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Available Competitions
                  </h3>
                  <p className="text-zinc-500 text-xs leading-relaxed max-w-2xl font-light">
                    The questions are concealed within the panels below. Select a competition round to unlock the identity verification system and start your secure attempt.
                  </p>
                </div>

                {publishedChallenges.length === 0 ? (
                  <div className="glass-card py-20 text-center space-y-6">
                    <Clock className="w-12 h-12 text-zinc-500 mx-auto animate-pulse" />
                    <div className="space-y-1">
                      <h3 className="text-zinc-400 font-display font-medium text-lg uppercase">All Quizzes Wrapped</h3>
                      <p className="text-zinc-500 text-xs max-w-md mx-auto font-mono">
                        No competition papers are available at this moment. Stay tuned for notices!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {publishedChallenges.map((chal) => {
                      const isPastDeadline = chal.deadline ? new Date() > new Date(chal.deadline) : false;
                      return (
                        <div
                          key={chal.id}
                          onClick={() => {
                            setSelectedChallenge(chal);
                            setAnswers({});
                            setMySubmission(null);
                            setHasEntered(false);
                            setErrorMessage('');
                            // If profile is prefilled, prefetch details
                            if (profile && profile.email) {
                              fetchSubmissionDetails(profile.email, chal.id);
                            }
                          }}
                          className="glass-card p-6 md:p-8 flex flex-col justify-between hover:border-amber-500/30 transition-all cursor-pointer group relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-500/[0.02] to-transparent" />
                          <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold tracking-widest text-zinc-500 uppercase">QUIZ PAPER</span>
                              {isPastDeadline ? (
                                <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded text-[8px] uppercase font-mono font-black shrink-0">CLOSED / EXPIRED</span>
                              ) : (
                                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[8px] uppercase font-mono font-black shrink-0">ACTIVE ROUND</span>
                              )}
                            </div>

                            <h4 className="text-lg md:text-xl font-display font-bold text-white group-hover:text-amber-400 transition-colors uppercase leading-snug">
                              {chal.title}
                            </h4>

                            <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed">
                              {chal.description || 'Manually written math challenge paper. Test your problem-solving bounds.'}
                            </p>
                          </div>

                          <div className="flex items-center justify-between border-t border-white/5 pt-5 text-[10px] font-mono text-zinc-500">
                            <div>
                              PROBLEMS: <span className="text-white font-black">{(chal.questions || []).length}</span>
                            </div>
                            <div className="flex items-center gap-1 text-amber-500 hover:text-amber-400 font-bold transition-all group-hover:translate-x-1.5 uppercase font-mono">
                              <span>Reveal questions</span>
                              <ArrowRight className="w-3 h-3 text-amber-500" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            ) : !hasEntered ? (
              // 2. Identity Verification Form for Selected Challenge
              <motion.div
                key="enter-form"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="glass-card p-8 md:p-12 relative overflow-hidden"
              >
                {/* Back button */}
                <button
                  onClick={() => setSelectedChallenge(null)}
                  className="absolute top-6 left-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500 hover:text-white transition-colors tracking-wider"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>BACK TO CHOICE</span>
                </button>

                <div className="max-w-md mx-auto space-y-8 pt-6">
                  <div className="space-y-2 text-center md:text-left">
                    <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">[ LOCKED PAPER ]</span>
                    <h3 className="text-2xl font-display font-medium text-white uppercase mt-2">{selectedChallenge.title}</h3>
                    <p className="text-zinc-500 text-[10px] font-mono uppercase">ENTER MEMBER INFO TO CHECK ATTEMPTS OR BEGIN</p>

                    {selectedChallenge.deadline && (
                      <div className="mt-3 inline-flex items-center gap-2 text-rose-500 bg-rose-500/5 px-3.5 py-1.5 rounded-xl text-[10px] font-mono uppercase font-black tracking-wider border border-rose-500/10">
                        <Clock className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                        <span>Deadline: {new Date(selectedChallenge.deadline).toLocaleString()}</span>
                      </div>
                    )}
                  </div>

                  {errorMessage && (
                    <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono flex items-center gap-3">
                      <XCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleEnterChallenge} className="space-y-6">
                    {/* Name field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          required
                          value={studentDetails.fullName}
                          onChange={(e) => setStudentDetails(prev => ({ ...prev, fullName: e.target.value }))}
                          placeholder="e.g. Tawsif Samin"
                          className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-medium"
                        />
                      </div>
                    </div>

                    {/* Email field */}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          required
                          value={studentDetails.email}
                          onChange={(e) => setStudentDetails(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="you@email.com"
                          className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-medium font-mono"
                        />
                      </div>
                    </div>

                    {/* Member ID field */}
                    <div className="space-y-2 block">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block font-mono">Member ID (Optional)</label>
                      <div className="relative">
                        <Award className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={studentDetails.memberId}
                          onChange={(e) => setStudentDetails(prev => ({ ...prev, memberId: e.target.value.toUpperCase() }))}
                          placeholder="JMC-123456"
                          className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-sm font-bold font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={fetchingSub}
                      className="w-full h-14 bg-white text-black hover:bg-amber-400 group relative flex items-center justify-center gap-3 text-xs font-mono font-black uppercase tracking-[0.25em] rounded-2xl active:scale-95 duration-300 transition-all border border-transparent shadow-[0_0_30px_rgba(255,255,255,0.05)] disabled:opacity-50"
                    >
                      {fetchingSub ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-black" />
                          <span>UNLOCKING SECURE ATTEMPT...</span>
                        </>
                      ) : (
                        <>
                          <span>UNVEIL_PROBLEMS</span>
                          <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </motion.div>
            ) : (
              // 3. Active Quiz Question Solver Room
              <motion.div
                key="active-room"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="space-y-12"
              >
                {/* Back selector button */}
                <button
                  onClick={() => {
                    setHasEntered(false);
                    setSelectedChallenge(null);
                  }}
                  className="inline-flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-xs font-mono font-black uppercase tracking-widest bg-zinc-950/20 px-4 py-2 border border-white/5 rounded-xl"
                >
                  ← LEAF COMPETITION PORTAL
                </button>

                {errorMessage && (
                  <div className="p-4 bg-red-950/20 border border-red-500/20 text-red-400 text-xs rounded-xl font-mono flex items-center gap-3">
                    <XCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* A. If a submission ALREADY exists */}
                {mySubmission ? (
                  <div className="space-y-8">
                    {/* Submission Status Alert */}
                    <div className={`p-8 md:p-10 rounded-[2.5rem] glass border ${mySubmission.status === 'published' ? 'border-emerald-500/20 bg-emerald-950/5' : 'border-amber-500/20 bg-amber-950/5'}`}>
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            {mySubmission.status === 'published' ? (
                              <>
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-mono font-black uppercase text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full tracking-wider">
                                  System result published
                                </span>
                              </>
                            ) : (
                              <>
                                <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
                                <span className="text-[10px] font-mono font-black uppercase text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full tracking-wider">
                                  Attempt received / Pending Final Review
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="text-2xl font-display font-medium text-white uppercase mt-2">
                            {studentDetails.fullName}
                          </h3>
                          <p className="text-zinc-500 text-xs font-mono">
                            SUBMIT_TIMESTAMP: {new Date(mySubmission.submittedAt).toLocaleDateString()} at {new Date(mySubmission.submittedAt).toLocaleTimeString()}
                          </p>
                        </div>

                        <div className="bg-black/40 border border-white/5 p-6 rounded-3xl text-center min-w-[140px]">
                          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-500 mb-1">SCORE CARD</p>
                          <p className="text-4xl font-display font-black text-amber-400 font-mono">
                            {mySubmission.status === 'published' ? mySubmission.finalScore : mySubmission.autoScore}
                            <span className="text-zinc-600 text-lg font-light"> / {mySubmission.totalQuestions}</span>
                          </p>
                        </div>
                      </div>

                      {/* Admin custom feedback comments */}
                      {mySubmission.status === 'published' && mySubmission.feedback && (
                        <div className="mt-8 pt-6 border-t border-white/5 space-y-2">
                          <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">MODERATOR_REMARKS:</h4>
                          <p className="text-zinc-300 text-sm font-medium italic bg-black/20 p-5 rounded-2xl border border-white/5">
                            "{mySubmission.feedback}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Submission Breakdown Key */}
                    <div className="space-y-6">
                      <h3 className="text-xl font-display font-black uppercase tracking-wider">Question Attempt Summary</h3>
                      
                      <div className="space-y-4">
                        {(selectedChallenge.questions || []).map((q: any, i: number) => {
                          const savedAns = mySubmission.answers?.[q.id] || '';
                          const parsedGradedObj = mySubmission.gradedBreakdown?.find((item: any) => item.questionId === q.id);
                          const isUserCorrect = parsedGradedObj?.isCorrect;

                          return (
                            <div key={q.id} className="glass-card p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                              <div className="space-y-3 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-zinc-500 text-xs font-mono font-black uppercase">QUESTION {i + 1}</span>
                                </div>
                                <MathJaxNode content={q.text} className="text-zinc-300 text-sm leading-relaxed" />
                              </div>

                              <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4 border-t md:border-t-0 p-4 md:p-0 border-white/5">
                                <div className="space-y-1">
                                  <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block font-bold">your answer</p>
                                  <span className="font-mono text-sm font-black text-white bg-black/40 px-4 py-2 rounded-xl border border-white/5 inline-block font-bold">
                                    {savedAns || 'None'}
                                  </span>
                                </div>

                                {mySubmission.status === 'published' ? (
                                  <div className="space-y-1 text-right">
                                    <p className="text-[9px] font-mono font-bold text-zinc-500 uppercase tracking-widest block font-bold">correct answer</p>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm font-black text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/10 inline-block font-bold">
                                        {q.answer}
                                      </span>
                                      {isUserCorrect ? (
                                        <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                                      ) : (
                                        <XCircle className="w-5 h-5 text-red-500 shrink-0" />
                                      )}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-amber-500 bg-amber-500/10 px-4 py-2 rounded-xl text-xs font-mono">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Key locked</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  // B. If NO questions are set in selected paper yet
                  (selectedChallenge.questions || []).length === 0 ? (
                    <div className="glass-card p-12 text-center space-y-6">
                      <HelpCircle className="w-12 h-12 text-zinc-500 mx-auto" />
                      <div className="space-y-2">
                        <h3 className="text-xl font-display font-medium uppercase">Prepping Challenge Questions</h3>
                        <p className="text-zinc-500 text-sm max-w-md mx-auto leading-relaxed">
                          This competition's test paper doesn't have any questions written yet. Please stay up to date with notices!
                        </p>
                      </div>
                    </div>
                  ) : (
                    // C. Render active test solving room
                    <div className="space-y-8 animate-fadeIn">
                      {/* Active paper metadata */}
                      <div className="glass-card p-8 md:p-10 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full" />
                        <div className="space-y-3">
                          <h2 className="text-2xl md:text-3xl font-display font-semibold uppercase">{selectedChallenge.title || 'Official Math Competition Paper'}</h2>
                          <MathJaxNode content={selectedChallenge.description} className="text-zinc-400 text-sm leading-relaxed max-w-2xl" />
                          
                          {selectedChallenge.deadline && (
                            <div className="mt-4 flex items-center gap-2 text-rose-400 bg-rose-500/5 border border-rose-500/10 px-4 py-2.5 rounded-xl text-xs font-mono w-fit">
                              <Clock className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                              <span>SUBMISSION DEADLINE: <span className="text-white font-black">{new Date(selectedChallenge.deadline).toLocaleString()}</span></span>
                            </div>
                          )}

                          <div className="h-[1px] bg-white/5 my-6" />
                          <div className="flex flex-wrap items-center gap-6 text-[10px] uppercase font-mono text-zinc-500 font-bold">
                            <div>QUESTIONS COUNT: <span className="text-white">{(selectedChallenge.questions || []).length}</span></div>
                            <div>PARTICIPANT: <span className="text-amber-400 font-black">{studentDetails.fullName}</span></div>
                            <div>RATING MODE: <span className="text-white">NUMERICAL ANSWERS ONLY</span></div>
                          </div>
                        </div>
                      </div>

                      {/* Question Cards listing */}
                      <div className="space-y-6">
                        {(selectedChallenge.questions || []).map((q: any, index: number) => (
                          <div key={q.id} className="glass-card p-8 space-y-6">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-mono font-black text-zinc-500 uppercase tracking-widest">
                                PROBLEM {index + 1} OF {(selectedChallenge.questions || []).length}
                              </span>
                            </div>
                            
                            <MathJaxNode content={q.text} className="text-zinc-100 text-lg font-light leading-relaxed" />

                            <div className="pt-4 border-t border-white/5 space-y-3 max-w-md">
                              <label className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest block font-bold">your answer</label>
                              <input
                                type="number"
                                value={answers[q.id] || ''}
                                onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                placeholder="Type numerical value answer..."
                                className="w-full px-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono font-black text-sm"
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Submit Section */}
                      <div className="p-8 glass-card flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left space-y-1">
                          <h4 className="font-display font-semibold uppercase">Completed Paper?</h4>
                          <p className="text-zinc-500 text-xs">Verify your inputs carefully. Once turned in, they cannot be modified.</p>
                        </div>

                        <button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={submittingAnswers}
                          className="h-14 px-10 bg-amber-500 hover:bg-amber-400 hover:scale-105 active:scale-95 transition-all text-black text-xs font-mono font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 shrink-0 disabled:opacity-50"
                        >
                          {submittingAnswers ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-black" />
                              <span>SUBMITTING ANSWERS...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-black" />
                              <span>SUBMIT_ANSWERS_SECURELY</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )
                )}
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && selectedChallenge && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !submittingAnswers && setShowConfirmModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-md"
            />
            
            {/* Modal Card */}
            <motion.div
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl z-10 overflow-hidden space-y-6"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500" />
              
              <div className="space-y-2">
                <span className="text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded uppercase font-black tracking-widest block w-fit">
                  CONFIRM ATTEMPT SUBMISSION
                </span>
                <h3 className="text-2xl font-display font-medium text-white uppercase">{selectedChallenge.title}</h3>
                <p className="text-zinc-500 text-[10px] font-mono uppercase">VERIFY YOUR ANSWERS BEFORE SUBMITTING</p>
              </div>

              {/* Progress Summary */}
              <div className="space-y-4">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between font-mono text-xs">
                  <span className="text-zinc-400 uppercase font-black">PROGRESS SUMMARY:</span>
                  <span className="font-mono text-sm font-black text-amber-400">
                    {answeredCount} / {totalQuestions} ANSWERED
                  </span>
                </div>

                <div className="max-h-48 overflow-y-auto space-y-2 pr-1 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                  {(selectedChallenge.questions || []).map((q: any, idx: number) => {
                    const answerVal = answers[q.id]?.trim();
                    const isAnswered = answerVal !== undefined && answerVal !== '';
                    return (
                      <div key={q.id} className="flex items-center justify-between text-xs p-3.5 bg-black/40 border border-white/5 rounded-xl font-mono">
                        <span className="text-zinc-550 uppercase font-bold text-[10px]">Problem {idx + 1}</span>
                        {isAnswered ? (
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> {answerVal}
                          </span>
                        ) : (
                          <span className="text-rose-500/75 font-bold flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-500 shrink-0" /> BLANK
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Deadline Reminder */}
              {selectedChallenge.deadline && (
                <div className="p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl flex items-start gap-3">
                  <Clock className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono font-black text-rose-400 uppercase tracking-widest block">DEADLINE REMINDER</span>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      The window for this olympiad paper closes on <span className="text-rose-400 font-bold">{new Date(selectedChallenge.deadline).toLocaleString()}</span>. No further submissions will be accepted afterwards.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2 font-mono">
                <button
                  type="button"
                  disabled={submittingAnswers}
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 h-12 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all duration-300"
                >
                  [ RESUME EDITING ]
                </button>
                
                <button
                  type="button"
                  disabled={submittingAnswers}
                  onClick={handleSubmitAnswers}
                  className="flex-1 h-12 bg-amber-500 hover:bg-amber-400 hover:scale-[1.02] active:scale-95 text-black text-xs font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all duration-300"
                >
                  {submittingAnswers ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-black" />
                      <span>SUBMITTING...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-black" />
                      <span>SUBMIT ATTEMPT</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengeProblems;
