"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import ScrollReveal from '../ScrollReveal';
import { resolveImageUrl } from '../../lib/utils';

interface MemoriesProps {
  home: any;
  gallery: string[];
  shouldReduceGfx: boolean;
}

export const Memories: React.FC<MemoriesProps> = ({ home, gallery, shouldReduceGfx }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (gallery.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + gallery.length) % gallery.length);
  };

  return (
    <section id="memories" className="py-32 md:py-48 relative border-b border-white/[0.03]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-end justify-between mb-24 gap-12">
          <div className="max-w-2xl">
            <ScrollReveal direction="up" distance={20} className="inline-block px-4 py-1.5 mb-6 rounded-lg bg-[var(--c-2-start)]/10 text-[var(--c-2-start)] text-[10px] font-mono font-black tracking-[0.4em] uppercase border border-[var(--c-2-start)]/20">
              {home?.memoriesTagline || "Visual Journey"}
            </ScrollReveal>
            <ScrollReveal direction="up" distance={30} delay={0.1}>
              <h2 className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-[-0.05em] text-white font-display leading-[0.8] mb-8">
                {home?.memoriesTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                  <span key={i} className={`block ${i === arr.length - 1 ? "pink-text italic font-serif font-light lowercase" : ""}`}>
                    {word}
                  </span>
                )) || (
                  <>Our <span className="pink-text italic font-serif font-light lowercase">Memories</span></>
                )}
              </h2>
            </ScrollReveal>
          </div>
          
          <ScrollReveal direction="up" distance={20} delay={0.3} className="hidden lg:block pb-4">
            <div className="flex items-center gap-6 font-mono text-[10px] tracking-[0.5em] uppercase opacity-30">
              <span>Ref: Archive_098</span>
              <div className="w-12 h-[1px] bg-white/30" />
              <span>Page {currentIndex + 1}/{gallery.length}</span>
            </div>
          </ScrollReveal>
        </div>

        <ScrollReveal direction="up" distance={50} delay={0.2} className="relative group perspective-2000">
          <div className="aspect-[4/3] sm:aspect-[16/9] md:aspect-[21/9] min-h-[300px] md:min-h-0 rounded-[2rem] md:rounded-[3rem] overflow-hidden glass-card border-white/5 shadow-[0_0_150px_rgba(0,0,0,0.8)] w-full transform group-hover:rotate-x-1 transition-transform duration-1000">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 1.15 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 1.05 }}
                transition={{ duration: shouldReduceGfx ? 0.1 : 1.2, ease: [0.22, 1, 0.36, 1] }}
                className="w-full h-full relative"
              >
                <OptimizedImage
                  src={resolveImageUrl(gallery[currentIndex])}
                  alt={`Memory ${currentIndex + 1}`}
                  fill
                  priority={currentIndex === 0}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1400px"
                />
                
                {!shouldReduceGfx && (
                  <motion.div 
                    className="absolute inset-x-0 h-[2px] bg-white/20 blur-sm z-30 pointer-events-none"
                    style={{ willChange: 'transform' }}
                    animate={{ y: [0, 400] }} // Approximate height of the container
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-8 z-30 pointer-events-none">
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(233, 51, 180, 0.9)' }}
                onClick={prevImage}
                className="p-3 md:p-5 rounded-full glass border-white/10 text-white pointer-events-auto backdrop-blur-3xl shadow-2xl transition-colors duration-500"
              >
                <ChevronLeft className="w-5 h-5 md:w-8 md:h-8" />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(233, 51, 180, 0.9)' }}
                onClick={nextImage}
                className="p-3 md:p-5 rounded-full glass border-white/10 text-white pointer-events-auto backdrop-blur-3xl shadow-2xl transition-colors duration-500"
              >
                <ChevronRight className="w-5 h-5 md:w-8 md:h-8" />
              </motion.button>
            </div>

            <div className="absolute bottom-6 right-6 md:bottom-12 md:right-12 glass border-white/10 px-4 py-2 md:px-6 md:py-3 rounded-full flex items-center gap-3 md:gap-4 z-30 backdrop-blur-3xl">
              <div className="text-[8px] md:text-[10px] font-mono font-bold tracking-[0.2em] text-white">Capture_Index</div>
              <div className="text-sm md:text-lg font-mono text-[var(--c-2-start)] leading-none">{String(currentIndex + 1).padStart(2, '0')}</div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
};
