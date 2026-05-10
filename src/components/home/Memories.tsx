"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Zap } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { Reveal } from '../animations/Reveal';
import { resolveImageUrl } from '../../lib/utils';
import gsap from 'gsap';

interface MemoriesProps {
  home: any;
  gallery: string[];
  shouldReduceGfx: boolean;
}

export const Memories: React.FC<MemoriesProps> = ({ home, gallery, shouldReduceGfx }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (gallery.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + gallery.length) % gallery.length);
  };

  return (
    <section id="memories" className="py-32 md:py-64 relative border-b border-white/[0.03] overflow-hidden">
      {/* Dynamic Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[var(--c-2-start)]/5 blur-[150px] opacity-20 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-32 gap-12">
          <div className="max-w-3xl">
            <Reveal direction="up" className="inline-block px-4 py-2 mb-8 rounded-full bg-[var(--c-2-start)]/10 text-[var(--c-2-start)] text-[10px] font-mono font-black tracking-[0.5em] uppercase border border-[var(--c-2-start)]/20 shadow-[0_0_20px_rgba(233,51,180,0.1)]">
              {home?.memoriesTagline || "VISUAL_JOURNEY_LOG"}
            </Reveal>
            <Reveal direction="up" delay={0.1}>
              <h2 className="text-6xl sm:text-8xl md:text-[10rem] font-bold tracking-[-0.07em] text-white font-display leading-[0.8] mb-8">
                {home?.memoriesTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                  <span key={i} className={`block ${i === arr.length - 1 ? "pink-text italic font-serif font-light tracking-tighter" : ""}`}>
                    {word}
                  </span>
                )) || (
                  <>OUR <span className="pink-text italic font-serif font-light tracking-tighter">MEMORIES</span></>
                )}
              </h2>
            </Reveal>
          </div>
          
          <Reveal direction="up" delay={0.3} className="hidden lg:block pb-10">
            <div className="flex items-center gap-10 font-mono text-[10px] tracking-[0.6em] uppercase opacity-40">
              <span className="flex items-center gap-2"><Zap className="w-3 h-3 text-[var(--c-2-start)]" /> Archive_044</span>
              <div className="w-16 h-[px] bg-gradient-to-r from-white/30 to-transparent" />
              <span className="text-[var(--c-2-start)]">{String(currentIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>
            </div>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.2} className="relative group perspective-3000">
          <div 
            ref={containerRef}
            className="aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] min-h-[400px] md:min-h-0 rounded-[2.5rem] md:rounded-[4rem] overflow-hidden glass-card border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.9)] w-full transition-all duration-1000 group-hover:border-white/10"
          >
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 1.1, filter: 'grayscale(1) brightness(0.5)' }}
                animate={{ opacity: 1, scale: 1, filter: 'grayscale(0) brightness(1)' }}
                exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 1.05, filter: 'brightness(1.5)' }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                className="w-full h-full relative"
              >
                <OptimizedImage
                  src={resolveImageUrl(gallery[currentIndex])}
                  alt={`Memory ${currentIndex + 1}`}
                  fill
                  priority={currentIndex === 0}
                  className="object-cover animate-float"
                  style={{ animationDuration: '20s' }}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                />
                
                {/* Cinematic Overlays */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 pointer-events-none" />
                <div className="absolute inset-0 noise opacity-20 pointer-events-none" />
                
                {!shouldReduceGfx && (
                  <motion.div 
                    className="absolute inset-x-0 h-[2px] bg-[var(--c-2-start)]/30 blur-[2px] z-30 pointer-events-none"
                    animate={{ y: ['0%', '1000%'] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {/* Premium Navigation */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-6 md:px-12 z-30 pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.1, x: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={prevImage}
                className="p-4 md:p-6 rounded-full glass border-white/10 text-white pointer-events-auto backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:bg-[var(--c-2-start)]/20 hover:border-[var(--c-2-start)]/50"
              >
                <ChevronLeft className="w-6 h-6 md:w-10 md:h-10" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, x: 5 }}
                whileTap={{ scale: 0.9 }}
                onClick={nextImage}
                className="p-4 md:p-6 rounded-full glass border-white/10 text-white pointer-events-auto backdrop-blur-3xl shadow-2xl transition-all duration-500 hover:bg-[var(--c-2-start)]/20 hover:border-[var(--c-2-start)]/50"
              >
                <ChevronRight className="w-6 h-6 md:w-10 md:h-10" />
              </motion.button>
            </div>

            <div className="absolute bottom-8 left-8 md:bottom-16 md:left-16 z-30">
              <div className="flex flex-col gap-2">
                <div className="mono-label text-[10px] text-zinc-500 tracking-[0.5em]">DATA_STREAM</div>
                <div className="h-1 w-32 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    key={currentIndex}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 6, ease: "linear" }}
                    className="h-full bg-[var(--c-2-start)] origin-left"
                  />
                </div>
              </div>
            </div>

            <div className="absolute bottom-8 right-8 md:bottom-16 md:right-16 glass border-white/10 px-8 py-4 rounded-full flex items-center gap-6 z-30 backdrop-blur-3xl shadow-2xl">
              <div className="flex flex-col items-end">
                <div className="text-[8px] font-mono font-bold tracking-[0.3em] text-zinc-500">FRAME</div>
                <div className="text-xl font-mono text-[var(--c-2-start)] leading-none font-black">{String(currentIndex + 1).padStart(2, '0')}</div>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-start leading-[0.8]">
                <div className="text-[10px] font-mono font-black text-white">READY</div>
                <div className="text-[8px] font-mono text-zinc-500">SYNC_OK</div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

