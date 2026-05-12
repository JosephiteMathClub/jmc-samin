"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { Reveal } from '../animations/Reveal';
import { resolveImageUrl } from '../../lib/utils';

export const Memories: React.FC<any> = ({ home, gallery }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!gallery || gallery.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % gallery.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [gallery]);

  if (!gallery || gallery.length === 0) return null;

  return (
    <section id="memories" className="py-24 relative border-b border-white/[0.03] bg-transparent">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center mb-16 text-center">
          <Reveal direction="up">
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-4">
              {home?.memoriesTitle || "Our Memories"}
            </h2>
          </Reveal>
          <Reveal direction="up" delay={0.1}>
            <p className="text-zinc-400 font-mono text-sm tracking-widest uppercase">
              {home?.memoriesTagline || "Visual Journey"}
            </p>
          </Reveal>
        </div>

        <Reveal direction="up" delay={0.2}>
          <div className="relative group aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shadow-2xl">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full h-full relative"
              >
                <OptimizedImage
                  src={resolveImageUrl(gallery[currentIndex])}
                  alt={`Memory ${currentIndex + 1}`}
                  fill
                  priority={currentIndex === 0}
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 1200px"
                />
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="absolute inset-y-0 left-0 flex items-center px-4 md:px-8">
              <button
                onClick={() => setCurrentIndex((prev) => (prev - 1 + gallery.length) % gallery.length)}
                className="p-3 md:p-4 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            </div>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 md:px-8">
              <button
                onClick={() => setCurrentIndex((prev) => (prev + 1) % gallery.length)}
                className="p-3 md:p-4 rounded-full bg-black/50 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/10"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            {/* Dots */}
            <div className="absolute bottom-6 inset-x-0 flex justify-center gap-2">
              {gallery.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    currentIndex === idx ? 'w-8 bg-white' : 'bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

