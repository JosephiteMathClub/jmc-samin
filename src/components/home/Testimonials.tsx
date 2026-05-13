"use client";
import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Reveal } from '../animations/Reveal';
import { usePerformance } from '../../hooks/usePerformance';
import { cn } from "@/lib/utils";
import { Marquee } from "@/components/ui/marquee";
import Image from "next/image";

interface TestimonialsProps {
  home: any;
  duplicatedTestimonials: any[];
  shouldReduceGfx: boolean;
}

const ReviewCard = ({
  avatar,
  name,
  role,
  message,
}: {
  avatar: string;
  name: string;
  role: string;
  message: string;
}) => {
  return (
    <figure
      style={{
        transform: "rotateY(-15deg) rotateX(10deg) scale(0.9)",
        transformStyle: "preserve-3d",
      }}
      className={cn(
        "relative h-full w-64 cursor-pointer overflow-hidden rounded-xl border p-6 mx-2 transition-all duration-500 md:w-80",
        // dark styles
        "border-white/10 bg-black/40 backdrop-blur-md shadow-lg",
        "hover:bg-black/60 hover:border-white/30 hover:z-50 hover:shadow-2xl",
        "hover:![transform:rotateY(0deg)_rotateX(0deg)_scale(1.1)]"
      )}
    >
      <div className="flex flex-row items-center gap-4">
        {avatar ? (
          <Image className="rounded-full object-cover" width={48} height={48} alt="" src={avatar} />
        ) : (
          <div className="rounded-full w-12 h-12 bg-white/10 flex items-center justify-center text-white text-xl font-bold">
            {name.charAt(0)}
          </div>
        )}
        <div className="flex flex-col">
          <figcaption className="text-sm font-bold text-white">
            {name}
          </figcaption>
          <p className="text-xs font-medium text-[var(--c-6-start)] tracking-widest uppercase">{role}</p>
        </div>
      </div>
      <blockquote className="mt-4 text-sm text-zinc-300 leading-relaxed font-light">{message}</blockquote>
    </figure>
  );
};

export const Testimonials: React.FC<TestimonialsProps> = ({ home, duplicatedTestimonials }) => {
  const { shouldReduceGfx } = usePerformance();
  
  const reviews = useMemo(() => {
    // Generate a good list of items for the slider
    const base = home?.testimonials || duplicatedTestimonials.slice(0, duplicatedTestimonials.length / 2);
    return base.map((t: any, i: number) => ({
      id: t.id || `review-${i}`,
      name: t.name || 'Anonymous',
      role: t.role || 'Member',
      avatar: t.imageUrl,
      message: t.message || 'No message provided.'
    }));
  }, [home?.testimonials, duplicatedTestimonials]);

  const expandedReviews = useMemo(() => {
    // We need enough reviews to fill 4 rows.
    let arr = [...reviews];
    while (arr.length < 16) {
      arr = [...arr, ...reviews];
    }
    return arr;
  }, [reviews]);

  const firstRow = expandedReviews.slice(0, Math.ceil(expandedReviews.length / 4));
  const secondRow = expandedReviews.slice(Math.ceil(expandedReviews.length / 4), Math.ceil(expandedReviews.length / 2));
  const thirdRow = expandedReviews.slice(Math.ceil(expandedReviews.length / 2), Math.ceil((expandedReviews.length * 3) / 4));
  const fourthRow = expandedReviews.slice(Math.ceil((expandedReviews.length * 3) / 4));

  return (
    <section id="testimonials" className="py-32 relative overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 mb-16 text-center relative z-20">
        <Reveal direction="up" className="inline-flex items-center gap-3 px-4 py-1.5 mb-10 rounded-full bg-white/5 border border-white/10">
           <Sparkles className="w-3 h-3 text-[var(--c-6-start)]" />
           <span className="text-[10px] font-mono font-black text-zinc-500 tracking-[0.4em] uppercase">{home?.testimonialsTagline || "PEOPLE ABOUT JMC"}</span>
        </Reveal>
        
        <Reveal direction="up" delay={0.2}>
          <h2 className="text-6xl md:text-8xl font-bold text-white font-display tracking-tight uppercase leading-[0.9]">
             {home?.testimonialsTitle || "Visions of the Future"}
          </h2>
        </Reveal>
      </div>

      <div className="relative z-10 w-full py-12">
        <div className="relative flex h-[600px] w-full flex-row items-center justify-center gap-4 overflow-hidden [perspective:1000px]">
          <div
            className="flex flex-row items-center gap-4"
            style={{
              transform: "translateX(-40px)",
            }}
          >
            <Marquee pauseOnHover vertical className="[--duration:30s]">
              {firstRow.map((review, i) => (
                <ReviewCard key={`r1-${i}`} {...review} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:30s]" vertical>
              {secondRow.map((review, i) => (
                <ReviewCard key={`r2-${i}`} {...review} />
              ))}
            </Marquee>
            <Marquee reverse pauseOnHover className="[--duration:30s]" vertical>
              {thirdRow.map((review, i) => (
                <ReviewCard key={`r3-${i}`} {...review} />
              ))}
            </Marquee>
            <Marquee pauseOnHover className="[--duration:30s]" vertical>
              {fourthRow.map((review, i) => (
                <ReviewCard key={`r4-${i}`} {...review} />
              ))}
            </Marquee>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-0 h-[15%] bg-gradient-to-b from-[#050505] to-transparent"></div>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[15%] bg-gradient-to-t from-[#050505] to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 left-0 w-[15%] bg-gradient-to-r from-[#050505] to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-[15%] bg-gradient-to-l from-[#050505] to-transparent"></div>
        </div>
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
            <p className="text-[9px] font-mono font-black text-zinc-600 tracking-widest mb-2 group-hover:text-[var(--c-6-start)] transition-colors uppercase">{stat.label}</p>
            <p className="text-sm font-bold text-white font-mono tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

