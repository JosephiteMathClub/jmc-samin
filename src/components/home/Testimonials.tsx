"use client";
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Reveal } from '../animations/Reveal';
import { OrganicCarousel } from '../ui/organic-carousel';
import { usePerformance } from '../../hooks/usePerformance';

interface TestimonialsProps {
  home: any;
  duplicatedTestimonials: any[];
  shouldReduceGfx: boolean;
}

export const Testimonials: React.FC<TestimonialsProps> = ({ home, duplicatedTestimonials }) => {
  const { shouldReduceGfx } = usePerformance();
  
  const reviews = useMemo(() => {
    // Generate a good list of items for the slider
    const base = home?.testimonials || duplicatedTestimonials.slice(0, duplicatedTestimonials.length / 2);
    return base.map((t: any, i: number) => ({
      id: t.id || `review-${i}`,
      name: t.name,
      role: t.role,
      avatar: t.imageUrl,
      verified: true,
      rating: 5,
      message: t.message
    }));
  }, [home?.testimonials, duplicatedTestimonials]);

  return (
    <section id="testimonials" className="py-32 relative overflow-hidden bg-transparent">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-20">
         <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,var(--c-6-start)_0%,transparent_70%)] blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 text-center relative z-20">
        <Reveal direction="up" className="inline-flex items-center gap-3 px-4 py-1.5 mb-10 rounded-full bg-white/5 border border-white/10">
           <Sparkles className="w-3 h-3 text-[var(--c-6-start)]" />
           <span className="text-[10px] font-mono font-black text-zinc-500 tracking-[0.4em] uppercase">{home?.testimonialsTagline || "SYSTEM_FEEDBACK"}</span>
        </Reveal>
        
        <Reveal direction="up" delay={0.2}>
          <h2 className="text-6xl md:text-8xl font-bold text-white font-display tracking-tight uppercase leading-[0.9]">
             {home?.testimonialsTitle || "Visions of the Future"}
          </h2>
        </Reveal>
      </div>

      <div className="relative z-10 w-full py-12">
        <OrganicCarousel reviews={reviews} />
      </div>

      {/* Trust Badges / Stats Footer */}
      <div className="max-w-4xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 mt-24 opacity-30 relative z-20">
        {[
          { label: "VERIFIED_USERS", value: "2.4K+" },
          { label: "POSITIVE_SENTIMENT", value: "98.2%" },
          { label: "AVG_RATING", value: "4.9/5.0" },
          { label: "CORE_UPTIME", value: "99.9%" },
        ].map((stat, i) => (
          <div key={i} className="text-center group">
            <p className="text-[9px] font-mono font-black text-zinc-600 tracking-widest mb-2 group-hover:text-amber-500 transition-colors uppercase">{stat.label}</p>
            <p className="text-sm font-bold text-white font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

