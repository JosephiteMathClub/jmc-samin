"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import TypewriterText from '../TypewriterText';

interface HeroProps {
  home: any;
  shouldReduceGfx: boolean;
}

const wordVariants: any = {
  hidden: { opacity: 0, y: 50 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.8,
      ease: "easeOut",
    },
  }),
};

export const Hero: React.FC<HeroProps> = ({ home, shouldReduceGfx }) => {
  return (
    <section id="hero" className="relative pt-32 pb-48 md:pt-48 md:pb-64 overflow-hidden border-b border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center relative z-10">
          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center gap-3 px-6 py-2 mb-10 rounded-sm glass border-white/10 shadow-2xl relative hud-bracket hud-bracket-tl hud-bracket-br"
          >
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-[1px] bg-gradient-to-t from-[var(--c-6-start)]/50 to-transparent" />
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--c-6-start)] animate-ping" />
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase text-zinc-400">
              {home?.heroTagline || "Est. 2015 * Excellence in Mathematics"}
            </span>
          </motion.div>
          
          <div className="mb-12 relative group">
            {!shouldReduceGfx && (
              <>
                <motion.div 
                  className="absolute -top-12 -left-12 w-24 h-24 border-l-2 border-t-2 border-[var(--c-6-start)]/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                  animate={{ x: [-10, 0], y: [-10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <motion.div 
                  className="absolute -bottom-12 -right-12 w-24 h-24 border-r-2 border-b-2 border-[var(--c-6-start)]/30 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-1000"
                  animate={{ x: [10, 0], y: [10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                />
                <div className="absolute top-1/2 -left-32 -translate-y-1/2 mono-label text-[8px] text-zinc-600 scale-y-150 [writing-mode:vertical-rl] opacity-40">
                  SCANNING_SEQUENCE // TARGET_LOCKED
                </div>
                <div className="absolute top-1/2 -right-32 -translate-y-1/2 mono-label text-[8px] text-zinc-600 scale-y-150 [writing-mode:vertical-rl] rotate-180 opacity-40">
                  DATA_EXTRACTION // CALCULATING_MODELS
                </div>
              </>
            )}

            <h1 className="text-[12vw] md:text-[14vw] font-bold tracking-[-0.04em] text-white font-display leading-[0.8] flex flex-col items-center select-none perspective-1000">
              {(home?.heroTitle || "Josephite Math Club").split(' ').map((word: string, i: number, arr: string[]) => (
                <motion.span
                  key={i}
                  custom={i}
                  initial={shouldReduceGfx ? { opacity: 1 } : "hidden"}
                  animate="visible"
                  variants={wordVariants}
                  className={`block ${i % 2 === 1 ? "blue-text skew-x-[-12deg]" : "font-black"}`}
                >
                  {word}
                </motion.span>
              ))}
            </h1>
            
            {!shouldReduceGfx && (
              <motion.div 
                className="absolute -top-12 left-1/2 -translate-x-[45vw] w-48 h-[1px] bg-gradient-to-r from-transparent via-[var(--c-6-start)]/50 to-transparent"
                animate={{ scaleX: [0, 1, 0], opacity: [0, 1, 0] }}
                transition={{ duration: 4, repeat: Infinity }}
              />
            )}
          </div>

          <motion.p
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-20 leading-relaxed font-light tracking-wide italic font-serif h-[3em] flex items-center justify-center"
          >
            {shouldReduceGfx ? (
              <span>&quot;{home?.heroSubtitle || "Where logic meets creativity to solve the world's most beautiful problems."}&quot;</span>
            ) : (
              <TypewriterText 
                texts={home?.heroSubtitles || [
                  home?.heroSubtitle || "Where logic meets creativity to solve the world's most beautiful problems.",
                  "Exploring the infinite boundaries of mathematical thought.",
                  "Building a sanctuary for Josephite mathematicians.",
                  "Innovating through the language of the universe."
                ]}
                speed={50}
                delay={4000}
              />
            )}
          </motion.p>

          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row justify-center items-center gap-10"
          >
            <div className="group relative">
              <div className="absolute inset-0 bg-[var(--c-6-start)]/20 blur-2xl rounded-full scale-0 group-hover:scale-150 transition-transform duration-700 pointer-events-none" />
              <Link
                href="/register-member"
                className="btn-metallic-blue relative z-10"
              >
                {home?.joinButtonText || "Join the Club"} 
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Link>
            </div>
            
            <Link
              href="/about"
              className="group flex items-center gap-4 text-xs font-mono font-bold tracking-[0.4em] uppercase text-zinc-500 hover:text-white transition-colors duration-500"
            >
              <span className="w-12 h-[1px] bg-zinc-800 group-hover:w-20 group-hover:bg-[var(--c-6-start)] transition-all duration-500" />
              {home?.storyButtonText || "Our Story"}
            </Link>
          </motion.div>
        </div>
      </div>

      {!shouldReduceGfx && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]">
          <div className="absolute top-[20%] left-[5%] font-mono text-[8vw] select-none uppercase font-black">Math.sqrt(-1)</div>
          <div className="absolute bottom-[20%] right-[5%] font-mono text-[8vw] select-none uppercase font-black">Infinite</div>
        </div>
      )}
    </section>
  );
};
