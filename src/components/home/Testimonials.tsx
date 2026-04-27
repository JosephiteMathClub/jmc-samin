"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Users, Quote, Star } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import ScrollReveal from '../ScrollReveal';
import { resolveImageUrl } from '../../lib/utils';

interface TestimonialsProps {
  home: any;
  duplicatedTestimonials: any[];
  shouldReduceGfx: boolean;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ home, duplicatedTestimonials, shouldReduceGfx }) => {
  return (
    <section id="testimonials" className="py-32 md:py-48 relative overflow-hidden bg-[#0a0a0c]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center">
          <ScrollReveal direction="up" distance={20} className="inline-block px-4 py-1.5 mb-6 rounded-lg bg-[var(--c-1-start)]/10 text-[var(--c-1-start)] text-[10px] font-mono font-black tracking-[0.4em] uppercase border border-[var(--c-1-start)]/20">
            {home?.testimonialsTagline || "Voices of JMC"}
          </ScrollReveal>
          <ScrollReveal direction="up" distance={30} delay={0.1}>
            <h2 className="text-7xl md:text-9xl font-bold tracking-[-0.05em] text-white font-display leading-[0.8]">
              {home?.testimonialsTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                <span key={i} className={`block ${i === arr.length - 1 ? "gold-text italic font-serif font-light" : ""}`}>
                  {word}
                </span>
              )) || (
                <>People About <span className="gold-text italic font-serif font-light">JMC</span></>
              )}
            </h2>
          </ScrollReveal>
        </div>
      </div>

      <div className="relative flex overflow-hidden group py-24 -my-24">
        <div className="absolute inset-y-0 left-0 w-80 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-80 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <div
          className={`flex gap-12 w-max px-6 ${!shouldReduceGfx ? 'animate-marquee marquee-pause' : ''}`}
        >
          {duplicatedTestimonials.map((t: any, i: number) => (
            <motion.div
              key={i}
              whileHover={shouldReduceGfx ? {} : { 
                y: -15, 
                scale: 1.02,
                borderColor: "rgba(255, 184, 0, 0.4)",
                boxShadow: "0 40px 80px -20px rgba(255, 184, 0, 0.2)",
                zIndex: 50
              }}
              className="w-[550px] shrink-0 glass-card p-12 border-white/5 transition-all duration-700 group/card relative rounded-[3rem]"
            >
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--c-1-start)]/5 blur-[120px] group-hover/card:bg-[var(--c-1-start)]/15 transition-colors duration-1000" />
              
              <div className="flex items-start justify-between mb-10 relative z-10">
                <div className="flex items-center gap-8">
                  <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden border-2 border-[var(--c-1-start)]/20 bg-zinc-900 shrink-0 rotate-3 group-hover/card:rotate-0 transition-all duration-700 relative shadow-2xl">
                    {t.imageUrl ? (
                      <OptimizedImage 
                        src={resolveImageUrl(t.imageUrl)} 
                        alt={t.name} 
                        fill
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <Users className="w-12 h-12 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-2xl font-bold text-white tracking-tighter mb-2">{t.name}</h4>
                    <p className="text-[10px] font-mono font-black text-[var(--c-1-start)] uppercase tracking-[0.4em]">{t.role}</p>
                  </div>
                </div>
                <Quote className="w-12 h-12 text-[var(--c-1-start)]/10 group-hover/card:text-[var(--c-1-start)]/40 transition-colors duration-700" />
              </div>
              <p className="text-zinc-400 text-lg leading-relaxed italic font-light relative z-10 tracking-tight font-serif">
                &quot;{t.message}&quot;
              </p>
              
              <div className="mt-10 flex gap-1 relative z-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-4 h-4 fill-[var(--c-1-start)] text-[var(--c-1-start)] opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
