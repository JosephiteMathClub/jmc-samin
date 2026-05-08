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
  const constraintsRef = React.useRef(null);

  return (
    <section id="testimonials" className="py-16 md:py-48 relative overflow-hidden bg-[#0a0a0c]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 md:mb-24">
        <div className="text-center">
          <ScrollReveal direction="up" distance={20} className="inline-block px-4 py-1.5 mb-6 rounded-lg bg-[var(--c-1-start)]/10 text-[var(--c-1-start)] text-[10px] font-mono font-black tracking-[0.4em] uppercase border border-[var(--c-1-start)]/20">
            {home?.testimonialsTagline || "Voices of JMC"}
          </ScrollReveal>
          <ScrollReveal direction="up" distance={30} delay={0.1}>
            <h2 className="text-4xl md:text-9xl font-bold tracking-tight md:tracking-[-0.05em] text-white font-display leading-[1.1] md:leading-[0.8]">
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

      <div className="relative flex overflow-hidden group py-12 md:py-24 -my-12 md:-my-24" ref={constraintsRef}>
        <div className="absolute inset-y-0 left-0 w-24 md:w-80 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-24 md:w-80 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

        <motion.div
          drag="x"
          dragConstraints={constraintsRef}
          animate={!shouldReduceGfx ? {
            x: ["0%", "-50%"],
          } : {}}
          transition={!shouldReduceGfx ? {
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 40,
              ease: "linear",
            },
          } : {}}
          className="flex gap-4 md:gap-12 w-max px-6 cursor-grab active:cursor-grabbing items-center"
        >
          {duplicatedTestimonials.map((t: any, i: number) => (
            <motion.div
              key={i}
              whileHover={shouldReduceGfx ? {} : { 
                y: -10, 
                scale: 1.01,
                borderColor: "rgba(255, 184, 0, 0.3)",
                zIndex: 50
              }}
              whileTap={shouldReduceGfx ? {} : { scale: 0.98 }}
              className="w-[280px] md:w-[500px] shrink-0 glass-card p-6 md:p-12 border-white/5 transition-all duration-500 group/card relative rounded-[2rem] md:rounded-[3rem] bg-black/40"
            >
              <div className="absolute -top-32 -right-32 w-80 h-80 bg-[var(--c-1-start)]/5 blur-[120px] group-hover/card:bg-[var(--c-1-start)]/10 transition-colors duration-1000" />
              
              <div className="flex items-start justify-between mb-6 md:mb-10 relative z-10">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className="w-12 h-12 md:w-24 md:h-24 rounded-xl md:rounded-[1.5rem] overflow-hidden border border-[var(--c-1-start)]/20 bg-zinc-900 shrink-0 group-hover/card:scale-110 transition-transform duration-700 relative">
                    {t.imageUrl ? (
                      <OptimizedImage 
                        src={resolveImageUrl(t.imageUrl)} 
                        alt={t.name} 
                        fill
                        className="object-cover" 
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                        <Users className="w-6 h-6 md:w-12 md:h-12 text-zinc-600" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-lg md:text-2xl font-bold text-white tracking-tight mb-1 md:mb-2 truncate">{t.name}</h4>
                    <p className="text-[7px] md:text-[10px] font-mono font-black text-[var(--c-1-start)] uppercase tracking-[0.2em] md:tracking-[0.4em]">{t.role}</p>
                  </div>
                </div>
                <Quote className="w-6 h-6 md:w-12 md:h-12 text-[var(--c-1-start)]/10 group-hover/card:text-[var(--c-1-start)]/40 transition-colors duration-700 shrink-0" />
              </div>
              <p className="text-zinc-400 text-sm md:text-lg leading-relaxed italic font-light relative z-10 tracking-tight font-serif line-clamp-4 md:line-clamp-none mb-4 md:mb-0">
                &quot;{t.message}&quot;
              </p>
              
              <div className="mt-4 md:mt-10 flex gap-1 relative z-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-2 md:w-4 h-2 md:h-4 fill-[var(--c-1-start)] text-[var(--c-1-start)] opacity-30 group-hover:opacity-100 transition-opacity duration-700" />
                ))}
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
