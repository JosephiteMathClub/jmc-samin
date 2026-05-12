"use client";
import React, { useEffect, useRef, useState } from "react";
import { OptimizedImage } from "../OptimizedImage";
import { resolveImageUrl } from "../../lib/utils";
import { Star, Users, CheckCircle2 } from "lucide-react";
import { motion, useAnimationFrame, useMotionValue, useTransform, wrap } from "framer-motion";

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
  speed?: number;
  pauseOnHover?: boolean;
}

export const OrganicCarousel: React.FC<OrganicCarouselProps> = ({
  reviews,
  speed = 1,
  pauseOnHover = true,
}) => {
  const baseX = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [contentWidth, setContentWidth] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Duplicate reviews to create infinite effect
  // Depending on screen width, we might need 3 or 4 sets, usually 3 is safe
  const duplicationCount = 3;
  const displayReviews = Array(duplicationCount).fill(reviews).flat();

  useEffect(() => {
    const calculateWidth = () => {
      if (containerRef.current && scrollRef.current && scrollRef.current.children.length > 0) {
        // Measure first element
        const firstChild = scrollRef.current.children[0] as HTMLElement;
        const itemWidth = firstChild.getBoundingClientRect().width;
        
        // Measure gap
        const style = window.getComputedStyle(scrollRef.current);
        const gap = parseFloat(style.gap) || 0;

        // One complete set is (item + gap) * reviews.length
        setContentWidth((itemWidth + gap) * reviews.length);
      }
    };
    
    // Slight delay to ensure layout is computed
    setTimeout(calculateWidth, 100);
    window.addEventListener("resize", calculateWidth);
    return () => window.removeEventListener("resize", calculateWidth);
  }, [reviews, duplicationCount]);

  useAnimationFrame((t, delta) => {
    if (!contentWidth) return;
    
    if (isHovered && pauseOnHover && !isDragging) {
      return;
    }
    
    if (isDragging) {
      return;
    }

    let moveBy = speed * (delta / 16);
    
    // Move left continuously
    let newX = baseX.get() - moveBy;
    
    // If we have scrolled left past one entire set, reset x forward by one set
    if (newX <= -contentWidth) {
       newX += contentWidth;
    } else if (newX > 0) {
       // If dragging backward beyond start, reset backward by one set
       newX -= contentWidth;
    }
    
    baseX.set(newX);
  });

  if (reviews.length === 0) return null;

  return (
    <div className="w-full relative py-6" ref={containerRef}>
      {/* Edge Gradients */}
      <div className="absolute top-0 left-0 bottom-0 w-12 md:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 bottom-0 w-12 md:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

      <div 
        className="overflow-hidden hide-scrollbar cursor-grab active:cursor-grabbing"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <motion.div 
          ref={scrollRef}
          className="flex gap-4 sm:gap-6 w-max items-stretch"
          style={{ x: baseX, paddingLeft: "1.5rem", paddingRight: "1.5rem" }}
          drag="x"
          dragConstraints={{ left: -10000, right: 10000 }} // Arbitrary large constraints
          dragElastic={0}
          onDragStart={() => setIsDragging(true)}
          onDragEnd={(e, info) => {
            setIsDragging(false);
          }}
          onDrag={(e, info) => {
             if (!contentWidth) return;
             let newX = baseX.get();
             if (newX <= -contentWidth) {
                baseX.set(newX + contentWidth);
             } else if (newX > 0) {
                baseX.set(newX - contentWidth);
             }
          }}
        >
          {displayReviews.map((review, i) => {
            // we use the first set to measure exactly one block
            const isFirstBlockLastItem = i === reviews.length - 1;
            return (
            <div 
              key={`${review.id}-${i}`}
              className="w-[85vw] sm:w-[400px] snap-center flex-shrink-0 flex flex-col justify-between p-8 rounded-[2.5rem] bg-zinc-900 border border-white/10 hover:border-white/30 transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-white/10 relative border border-white/20 shrink-0 pointer-events-none">
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
                    <div className="flex items-center gap-1.5 pointer-events-none">
                      <h4 className="font-bold text-white text-base truncate">
                        {review.name}
                      </h4>
                      {review.verified && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </div>
                    <p className="text-[10px] sm:text-xs font-medium text-white/40 uppercase tracking-widest mt-0.5 truncate pointer-events-none">
                      {review.role || "MEMBER"}
                    </p>
                  </div>
                </div>

                {review.rating && (
                  <div className="flex gap-1 mb-4 pointer-events-none">
                    {[...Array(5)].map((_, idx) => (
                      <Star 
                        key={idx} 
                        className={`w-3.5 h-3.5 ${idx < (review.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} 
                      />
                    ))}
                  </div>
                )}

                <p className="text-zinc-300 text-[15px] leading-relaxed line-clamp-4 font-serif italic pointer-events-none">
                  "{review.message}"
                </p>
              </div>
              
              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between relative z-10 pointer-events-none">
                 <div className="w-8 h-[2px] bg-white/20 rounded-full" />
                 <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                   Verified Review
                 </div>
              </div>
            </div>
          )})}
        </motion.div>
      </div>
    </div>
  );
};
