"use client";
import React, { useLayoutEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Globe, Lock, Cpu } from 'lucide-react';
import Link from 'next/link';
import TypewriterText from '../TypewriterText';
import gsap from 'gsap';

interface HeroProps {
  home: any;
  shouldReduceGfx: boolean;
}

export const Hero: React.FC<HeroProps> = ({ home, shouldReduceGfx }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleWordsRef = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    if (shouldReduceGfx) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Cinematic title reveal
      tl.fromTo(
        titleWordsRef.current,
        {
          y: 150,
          rotateX: -90,
          opacity: 0,
        },
        {
          y: 0,
          rotateX: 0,
          opacity: 1,
          duration: 1.8,
          stagger: 0.15,
          ease: "expo.out",
        },
        0.5
      );

      // Background elements subtle parallax
      gsap.to(".bg-element", {
        y: (i, target) => -target.dataset.speed * 100,
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [shouldReduceGfx]);

  return (
    <section 
      id="hero" 
      ref={containerRef}
      className="relative pt-32 pb-48 md:pt-48 md:pb-64 overflow-hidden border-b border-white/[0.03] perspective-2000"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center relative z-10">
          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -20, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="inline-flex items-center gap-3 px-6 py-2 mb-10 rounded-full glass border-white/10 shadow-2xl relative hud-bracket hud-bracket-tl hud-bracket-br overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--c-6-start)]/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 h-10 w-[1px] bg-gradient-to-t from-[var(--c-6-start)]/50 to-transparent" />
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--c-6-start)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--c-6-start)]"></span>
            </span>
            <span className="text-[10px] font-mono font-black tracking-[0.4em] uppercase text-zinc-300">
              {home?.heroTagline || "EST. 2015 // CENTER OF EXCELLENCE"}
            </span>
          </motion.div>
          
          <div className="mb-12 relative group">
            {!shouldReduceGfx && (
              <>
                <motion.div 
                  className="absolute -top-16 -left-16 w-32 h-32 border-l border-t border-[var(--c-6-start)]/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-90 group-hover:scale-100"
                />
                <motion.div 
                  className="absolute -bottom-16 -right-16 w-32 h-32 border-r border-b border-[var(--c-6-start)]/20 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-1000 scale-90 group-hover:scale-100"
                />
                
                {/* Floating HUD Elements */}
                <div className="hidden lg:block absolute -left-48 top-0 p-4 border border-white/5 bg-black/40 backdrop-blur-xl rounded-2xl scale-75 opacity-40 group-hover:opacity-100 group-hover:scale-90 transition-all duration-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[var(--c-6-start)]/10 text-[var(--c-6-start)]"><Globe className="w-4 h-4" /></div>
                    <div className="mono-label text-[8px]">Global_Network_Active</div>
                  </div>
                  <div className="space-y-1">
                    <div className="h-[2px] w-full bg-white/5 overflow-hidden">
                      <div className="h-full bg-[var(--c-6-start)] w-3/4 animate-pulse" />
                    </div>
                    <div className="flex justify-between text-[6px] font-mono text-zinc-600">
                      <span>SYNCING</span>
                      <span>89%</span>
                    </div>
                  </div>
                </div>

                <div className="hidden lg:block absolute -right-48 bottom-0 p-4 border border-white/5 bg-black/40 backdrop-blur-xl rounded-2xl scale-75 opacity-40 group-hover:opacity-100 group-hover:scale-90 transition-all duration-700">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-[var(--c-2-start)]/10 text-[var(--c-2-start)]"><Cpu className="w-4 h-4" /></div>
                    <div className="mono-label text-[8px]">Processor_Load // OK</div>
                  </div>
                  <div className="grid grid-cols-4 gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className={`h-1 w-full rounded-full ${i < 6 ? 'bg-[var(--c-2-start)]' : 'bg-white/5'}`} />
                    ))}
                  </div>
                </div>
              </>
            )}

            <h1 className="text-[12vw] sm:text-[10vw] md:text-[12vw] font-bold tracking-[-0.06em] text-white font-display leading-[0.85] sm:leading-[0.8] flex flex-col items-center select-none break-words max-w-full overflow-hidden px-2">
              {(home?.heroTitle || "Josephite Math Club").split(' ').map((word: string, i: number) => (
                <span
                  key={i}
                  ref={el => { titleWordsRef.current[i] = el }}
                  className={`block px-4 will-change-transform ${i % 2 === 1 ? "blue-text italic -skew-x-12" : "font-black"}`}
                >
                  {word}
                </span>
              ))}
            </h1>
          </div>

          <motion.p
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
            className="text-base sm:text-lg md:text-xl text-zinc-400 max-w-3xl mx-auto mb-16 md:mb-20 leading-relaxed font-light tracking-wide italic font-serif px-4"
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
                speed={40}
                delay={5000}
              />
            )}
          </motion.p>

          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.8, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row justify-center items-center gap-12"
          >
            <div className="group relative">
              <div className="absolute inset-0 bg-[var(--c-6-start)]/30 blur-[80px] rounded-full scale-0 group-hover:scale-150 transition-transform duration-1000 pointer-events-none" />
              <Link
                href="/register-member"
                className="btn-premium-glow relative z-10"
              >
                {home?.joinButtonText || "Join the Club"} 
                <span className="relative overflow-hidden w-5 h-5 flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-full transition-transform duration-500 absolute" />
                  <ArrowRight className="w-5 h-5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 absolute" />
                </span>
              </Link>
            </div>
            
            <Link
              href="/about"
              className="group flex items-center gap-5 text-xs font-mono font-black tracking-[0.5em] uppercase text-zinc-500 hover:text-white transition-all duration-500"
            >
              <div className="relative w-16 h-[1px] bg-zinc-800 overflow-hidden group-hover:w-24 transition-all duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--c-6-start)] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </div>
              {home?.storyButtonText || "Our Story"}
            </Link>
          </motion.div>
        </div>
      </div>

      {!shouldReduceGfx && (
        <div className="absolute inset-0 pointer-events-none">
          <div 
            data-speed="0.2"
            className="bg-element absolute top-[15%] left-[8%] font-mono text-[6vw] select-none uppercase font-black text-white/[0.02]"
          >
            Limit_As_x_→_∞
          </div>
          <div 
            data-speed="0.4"
            className="bg-element absolute bottom-[15%] right-[8%] font-mono text-[9vw] select-none uppercase font-black text-white/[0.02]"
          >
             ∫_f(x)_dx
          </div>
          
          {/* Cinematic Light Leaks */}
          <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-[var(--c-6-start)]/10 blur-[150px] animate-float opacity-30" />
          <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-[var(--c-2-start)]/10 blur-[150px] animate-float opacity-30" style={{ animationDelay: '-5s' }} />
        </div>
      )}
    </section>
  );
};

