"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Trophy, Calendar, Zap, BrainCircuit, Globe } from 'lucide-react';
import ChallengeProblems from './ChallengeProblems';
import ScrollReveal from '../components/ScrollReveal';
import { usePerformance } from '../hooks/usePerformance';

const OnlineEvents = () => {
  const [activeSubtab, setActiveSubtab] = useState<'online_quiz' | 'info'>('online_quiz');
  const { shouldReduceGfx } = usePerformance();

  return (
    <div className="relative min-h-screen bg-[#050505] text-white overflow-hidden pb-32">
      {/* Background glow ambiance */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-6-start)]/5 -top-40 right-0" />
          <div className="atmospheric-glow w-[500px] h-[500px] bg-amber-500/5 bottom-0 left-0" />
        </>
      )}

      <div className="pt-40 max-w-5xl mx-auto px-6 relative z-10">
        
        {/* Title Block */}
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-5 h-5 text-[var(--c-6-start)] animate-pulse" />
            <span className="text-[10px] uppercase tracking-[0.40em] font-black text-[var(--c-6-start)] font-mono">
              Virtual Arena
            </span>
          </div>
          <h1 className="text-5xl md:text-8xl font-display font-black leading-[0.9] tracking-tighter mb-8 uppercase">
            ONLINE<br />
            <span className="bg-gradient-to-r from-[var(--c-6-start)] via-cyan-200 to-amber-500 bg-clip-text text-transparent">EVENTS</span>
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl leading-relaxed mb-16 font-light">
            Step into the virtual mathematical domain of Josephite Math Club. Engage in our monthly quizzes, speed-solving challenges, and interactive digital events.
          </p>
        </ScrollReveal>

        {/* Custom Subtab Controls */}
        <div className="flex justify-center sm:justify-start mb-12">
          <div className="inline-flex p-1.5 rounded-full bg-zinc-950/60 border border-white/5 backdrop-blur-xl relative z-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden">
            <button
              onClick={() => setActiveSubtab('online_quiz')}
              className={`px-6 py-2.5 rounded-full font-display text-xs font-black uppercase tracking-wider transition-all relative z-10 shrink-0 flex items-center gap-2 cursor-pointer ${
                activeSubtab === 'online_quiz'
                  ? 'text-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeSubtab === 'online_quiz' && (
                <motion.div
                  layoutId="onlineSubtabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <BrainCircuit className={`w-3.5 h-3.5 ${activeSubtab === 'online_quiz' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Online Quiz</span>
            </button>

            <button
              onClick={() => setActiveSubtab('info')}
              className={`px-6 py-2.5 rounded-full font-display text-xs font-black uppercase tracking-wider transition-all relative z-10 shrink-0 flex items-center gap-2 cursor-pointer ${
                activeSubtab === 'info'
                  ? 'text-black font-black'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {activeSubtab === 'info' && (
                <motion.div
                  layoutId="onlineSubtabPill"
                  className="absolute inset-0 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 shadow-[0_4px_20px_rgba(245,158,11,0.35)]"
                  style={{ zIndex: -1 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <Calendar className={`w-3.5 h-3.5 ${activeSubtab === 'info' ? 'text-black' : 'text-zinc-400'}`} />
              <span>Rules & Information</span>
            </button>
          </div>
        </div>

        {/* Subtab Contents */}
        <div>
          {activeSubtab === 'online_quiz' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <ChallengeProblems embedded={true} />
            </motion.div>
          )}

          {activeSubtab === 'info' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="glass p-8 md:p-12 rounded-[2.5rem] border border-white/5 space-y-8"
            >
              <div>
                <h3 className="text-2xl font-display font-black uppercase text-amber-400 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  Olympiad Quiz Guidelines
                </h3>
                <p className="text-zinc-400 font-light leading-relaxed">
                  The online quiz portal is designed to hone your problem-solving speeds and analytical rigor. Here are some key guidelines to ensure a fair and competitive ecosystem:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-zinc-300">
                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="font-mono font-bold text-white mb-2 uppercase text-xs tracking-wider">[ 01. Honest Submissions ]</h4>
                    <p className="text-sm text-zinc-400 font-light">
                      Users are expected to solve the mathematical problems independently without the assistance of AI tools or online math solvers.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="font-mono font-bold text-white mb-2 uppercase text-xs tracking-wider">[ 02. Submission Windows ]</h4>
                    <p className="text-sm text-zinc-400 font-light">
                      New sets of questions are published weekly. Be sure to submit your answers before the active paper closes on the designated weekend.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="font-mono font-bold text-white mb-2 uppercase text-xs tracking-wider">[ 03. Global Standings ]</h4>
                    <p className="text-sm text-zinc-400 font-light">
                      Points are awarded based on accuracy and submission speed. Standings are automatically refreshed on the public leaderboard.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5">
                    <h4 className="font-mono font-bold text-white mb-2 uppercase text-xs tracking-wider">[ 04. LaTeX Integration ]</h4>
                    <p className="text-sm text-zinc-400 font-light">
                      Standard LaTeX structures are fully supported. Learn math notations to present neat, formal proofs and structured derivations.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
};

export default OnlineEvents;
