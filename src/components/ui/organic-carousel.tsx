"use client";
import React, { useRef, useState } from "react";
import { OptimizedImage } from "../OptimizedImage";
import { resolveImageUrl } from "../../lib/utils";
import { Star, Users, CheckCircle2 } from "lucide-react";

interface Review {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  verified?: boolean;
  rating?: number;
  message: string;
}

interface OrganicCarouselProps {
  reviews: Review[];
  speed?: number; // base pixels per second
  pauseOnHover?: boolean;
  reverse?: boolean;
}

export const OrganicCarousel: React.FC<OrganicCarouselProps> = ({
  reviews,
  speed = 40,
  pauseOnHover = true,
  reverse = false,
}) => {
  if (reviews.length === 0) return null;

  return (
    <div 
      className="w-full relative overflow-hidden py-6 group"
    >
      {/* Edge Gradients */}
      <div className="absolute top-0 left-0 bottom-0 w-12 md:w-48 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-12 md:w-48 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

      <div 
        className={`flex gap-6 min-w-max hover:[animation-play-state:paused]`}
        style={{
           animation: `scroll ${reviews.length * 15}s linear infinite ${reverse ? 'reverse' : 'normal'}`
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-50% - 12px)); }
          }
        `}} />
        {[...reviews, ...reviews].map((review, i) => (
          <div 
            key={`${review.id}-${i}`}
            className="w-80 sm:w-96 flex-shrink-0 flex flex-col justify-between p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-white/[0.04] hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500 cursor-grab active:cursor-grabbing"
          >
            <div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-full overflow-hidden bg-white/5 relative border border-white/10 shrink-0">
                  {review.avatar ? (
                    <OptimizedImage
                      src={resolveImageUrl(review.avatar)}
                      alt={review.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="overflow-hidden">
                  <div className="flex items-center gap-1.5">
                    <h4 className="font-bold text-white text-base truncate">
                      {review.name}
                    </h4>
                    {review.verified && <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0" />}
                  </div>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 truncate">
                    {review.role || "MEMBER"}
                  </p>
                </div>
              </div>

              {review.rating && (
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, idx) => (
                    <Star 
                      key={idx} 
                      className={`w-3.5 h-3.5 ${idx < (review.rating || 5) ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'}`} 
                    />
                  ))}
                </div>
              )}

              <p className="text-zinc-400 text-sm leading-relaxed line-clamp-4 font-serif italic">
                "{review.message}"
              </p>
            </div>
            
            <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
               <div className="w-8 h-[1px] bg-amber-500/20" />
               <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">
                 Verified Review
               </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
