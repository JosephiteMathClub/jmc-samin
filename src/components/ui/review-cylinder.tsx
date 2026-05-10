"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { Star, Users, CheckCircle2 } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { resolveImageUrl } from '../../lib/utils';

export interface Review {
  id: string;
  name: string;
  role?: string;
  avatar?: string;
  verified?: boolean;
  rating?: number;
  message: string;
}

interface ReviewCylinderProps {
  reviews: Review[];
  radius?: number;
  cardWidth?: number;
  cardHeight?: number;
  speed?: number; // Speed in degrees per frame
  perspective?: number;
  autoplay?: boolean;
  reverse?: boolean;
  className?: string;
  shouldReduceGfx?: boolean;
}

export const ReviewCylinder: React.FC<ReviewCylinderProps> = ({
  reviews,
  radius = 500,
  cardWidth = 400,
  cardHeight = 250,
  speed = 0.2, // degrees per frame approximately
  perspective = 1200,
  autoplay = true,
  reverse = false,
  className = "",
  shouldReduceGfx = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const rotation = useMotionValue(0);

  const totalReviews = reviews.length;
  const angleStep = 360 / totalReviews;

  useAnimationFrame((time, delta) => {
    if (autoplay && !isHovered) {
      // Normalize delta just in case to avoid huge jumps on tab switch
      const d = Math.min(delta, 50); 
      // Approximate original speed: 0.2 deg per frame is ~12 deg per second at 60fps
      const degPerMs = (speed * 60) / 1000;
      const angleDelta = degPerMs * d;
      const step = reverse ? -angleDelta : angleDelta;
      rotation.set((rotation.get() + step) % 360);
    }
  });

  if (totalReviews === 0) return null;

  return (
    <div 
      className={`relative flex items-center justify-center overflow-visible py-32 ${className}`}
      style={{ perspective: `${perspective}px` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="region"
      aria-label="3D Testimonial Cylinder"
    >
      <motion.div 
        className="relative preserve-3d"
        style={{ 
          width: `${cardWidth}px`,
          height: `${cardHeight}px`,
          transformStyle: 'preserve-3d',
          rotateY: rotation
        }}
      >
        {reviews.map((review, i) => {
          const angle = i * angleStep;
          
          return (
            <CardItem 
              key={review.id || i}
              review={review}
              angle={angle}
              radius={radius}
              cardWidth={cardWidth}
              cardHeight={cardHeight}
              rotation={rotation}
            />
          );
        })}
      </motion.div>
    </div>
  );
};

const CardItem = ({ review, angle, radius, cardWidth, cardHeight, rotation }: any) => {
  // Compute front facing factor safely inside Framer Motion to bypass React render phase
  const transformRelative = useTransform(rotation, (rot: number) => {
    const relativeAngle = (angle + rot) % 360;
    const normalizedAngle = relativeAngle < 0 ? relativeAngle + 360 : relativeAngle;
    const distFromFront = Math.min(
      Math.abs(normalizedAngle - 180),
      Math.abs(normalizedAngle + 180),
      Math.abs(normalizedAngle - 540)
    );
    return distFromFront;
  });

  const isFront = useTransform(transformRelative, (dist: number) => dist < 30);
  const opacity = useTransform(transformRelative, (dist: number) => Math.max(0.1, 1 - (dist / 180)));
  const scale = useTransform(transformRelative, (dist: number) => 0.8 + (1 - (dist / 180)) * 0.4);
  const blur = useTransform(transformRelative, (dist: number) => dist < 30 ? '0px' : '2px');
  const zIndex = useTransform(transformRelative, (dist: number) => dist < 30 ? 10 : 1);
  const filter = useTransform(blur, (b: string) => `blur(${b})`);

  return (
    <motion.div
      className="absolute inset-0"
      style={{
        width: `${cardWidth}px`,
        height: `${cardHeight}px`,
        transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
        opacity: opacity,
        backfaceVisibility: 'hidden',
      }}
      role="article"
      aria-label={`Testimonial from ${review.name}`}
    >
      <motion.div 
        className="w-full h-full p-8 md:p-10 rounded-[2.5rem] glass border border-white/5 bg-zinc-900/90 shadow-xl flex flex-col justify-between group transition-colors duration-500 hover:border-amber-500/30"
        style={{
          scale: scale,
          filter: filter,
          zIndex: zIndex
        }}
      >
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden glass border-white/10 relative shadow-xl">
                {review.avatar ? (
                  <OptimizedImage 
                    src={resolveImageUrl(review.avatar)} 
                    alt={review.name} 
                    fill
                    className="object-cover" 
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                    <Users className="w-6 h-6 text-white/10" />
                  </div>
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-lg font-bold text-white tracking-tight leading-none truncate max-w-[150px]">
                    {review.name}
                  </h4>
                  {review.verified && <CheckCircle2 className="w-3.5 h-3.5 text-amber-500" />}
                </div>
                <p className="text-[10px] font-mono font-black text-white/40 uppercase tracking-widest mt-1">
                  {review.role || "MEMBER"}
                </p>
              </div>
            </div>
            {review.rating && (
              <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-3 h-3 ${i < review.rating! ? 'fill-amber-500 text-amber-500' : 'text-zinc-700'}`} 
                  />
                ))}
              </div>
            )}
          </div>

          <p className="text-zinc-400 text-sm md:text-base leading-relaxed italic font-serif line-clamp-4">
            &quot;{review.message}&quot;
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-white/5">
           <div className="w-12 h-[1px] bg-amber-500/20" />
           <div className="text-[8px] font-mono text-zinc-600 tracking-tighter uppercase">
             AUTH_VERIFIED_JMC
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
