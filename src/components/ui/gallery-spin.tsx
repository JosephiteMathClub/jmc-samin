"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimationFrame, useMotionValue, useTransform } from 'framer-motion';
import { Maximize2, X, ChevronLeft, ChevronRight, Share2, Info } from 'lucide-react';
import { OptimizedImage } from '../OptimizedImage';
import { resolveImageUrl } from '../../lib/utils';

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  description?: string;
  category?: string;
}

interface GallerySpinProps {
  items: GalleryItem[];
  rings?: number;
  radius?: number;
  tilt?: number;
  speed?: number;
  perspective?: number;
  reverse?: boolean;
  autoplay?: boolean;
  shouldReduceGfx?: boolean;
}

export const GallerySpin: React.FC<GallerySpinProps> = ({
  items,
  rings = 2,
  radius = 600,
  tilt = -15,
  speed = 0.1,
  perspective = 2000,
  reverse = false,
  autoplay = true,
  shouldReduceGfx = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  
  const rotation = useMotionValue(0);

  useAnimationFrame((time, delta) => {
    if (autoplay && !isHovered && !selectedItem) {
      const d = Math.min(delta, 50); 
      const degPerMs = (speed * 60) / 1000;
      const angleDelta = degPerMs * d;
      const step = reverse ? -angleDelta : angleDelta;
      rotation.set((rotation.get() + step) % 360);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedItem(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  if (items.length === 0) return null;

  const itemsPerRing = Math.ceil(items.length / rings);
  const angleStep = 360 / itemsPerRing;

  return (
    <div className="relative w-full h-[80vh] flex items-center justify-center overflow-hidden bg-black/0">
      <div 
        className="relative w-full h-full flex items-center justify-center select-none"
        style={{ perspective: `${perspective}px` }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        role="region"
        aria-label="3D Rotating Gallery"
      >
        <motion.div 
          className="relative preserve-3d"
          style={{ 
            transformStyle: 'preserve-3d',
            rotateX: tilt,
            rotateY: rotation
          }}
        >
          {items.map((item, index) => {
            const ringIndex = Math.floor(index / itemsPerRing);
            const indexInRing = index % itemsPerRing;
            const angle = indexInRing * angleStep;
            const yOffset = (ringIndex - (rings - 1) / 2) * 200;
            const ringRadius = radius + (ringIndex * 50);

            return (
              <GalleryCardItem 
                key={item.id || index}
                item={item}
                angle={angle}
                yOffset={yOffset}
                ringRadius={ringRadius}
                rotation={rotation}
                onClick={() => setSelectedItem(item)}
              />
            );
          })}
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/10 to-transparent blur-[2px]" />
        <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[150px] opacity-20" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[150px] opacity-20" />
      </div>

      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-12 bg-black/95 backdrop-blur-xl"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-6xl w-full h-full flex flex-col items-center justify-center gap-8"
              onClick={e => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedItem(null)}
                className="absolute top-0 right-0 p-4 text-zinc-500 hover:text-white transition-colors"
              >
                <X className="w-8 h-8" />
              </button>

              <div className="relative w-full aspect-[4/3] md:aspect-[16/9] rounded-3xl overflow-hidden glass border-white/10 shadow-3xl">
                <OptimizedImage
                  src={resolveImageUrl(selectedItem.url)}
                  alt={selectedItem.title}
                  fill
                  className="object-contain"
                />
              </div>

              <div className="w-full max-w-3xl text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                   <div className="h-px w-12 bg-white/10" />
                   <p className="text-xs font-mono font-black text-amber-500 uppercase tracking-[0.3em]">
                     {selectedItem.category || "EVENT_SHOWCASE"}
                   </p>
                   <div className="h-px w-12 bg-white/10" />
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-white tracking-tighter uppercase italic">
                  {selectedItem.title}
                </h2>
                {selectedItem.description && (
                  <p className="text-zinc-400 text-sm md:text-lg leading-relaxed max-w-2xl mx-auto font-medium">
                    {selectedItem.description}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-4 pt-6">
                  <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-xs font-bold text-white hover:bg-white/10 transition-all uppercase tracking-widest">
                    <Share2 className="w-4 h-4" />
                    Share Asset
                  </button>
                  <button className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-black rounded-full text-xs font-bold hover:bg-amber-400 transition-all uppercase tracking-widest shadow-lg shadow-amber-500/20">
                    <Maximize2 className="w-4 h-4" />
                    Full Screen
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const GalleryCardItem = ({ item, angle, yOffset, ringRadius, rotation, onClick }: any) => {
  const transformRelative = useTransform(rotation, (rot: number) => {
    const currentAngle = (angle + rot) % 360;
    const normalizedAngle = currentAngle < 0 ? currentAngle + 360 : currentAngle;
    return Math.abs(normalizedAngle - 180) / 180;
  });

  const opacity = useTransform(transformRelative, (dist: number) => Math.max(0.1, 1 - Math.pow(dist, 2)));
  const scale = useTransform(transformRelative, (dist: number) => 0.6 + (1 - dist) * 0.4);
  const blur = useTransform(transformRelative, (dist: number) => `${dist * 4}px`);
  const zIndex = useTransform(transformRelative, (dist: number) => Math.floor((1 - dist) * 1000));
  const filter = useTransform(blur, (b: string) => `blur(${b})`);

  return (
    <motion.div
      className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ease-out"
      style={{
        width: '300px',
        height: '400px',
        transform: `rotateY(${angle}deg) translateZ(${ringRadius}px) translateY(${yOffset}px)`,
        opacity,
        filter,
        backfaceVisibility: 'hidden',
        zIndex
      }}
      onClick={onClick}
      role="button"
      aria-label={`View ${item.title}`}
      tabIndex={0}
      onKeyDown={(e: any) => {
        if (e.key === 'Enter' || e.key === ' ') {
          onClick();
        }
      }}
    >
      <motion.div 
        className="w-full h-full rounded-2xl overflow-hidden glass border-white/5 bg-zinc-900/60 shadow-2xl group relative"
        style={{ scale }}
      >
        <OptimizedImage
          src={resolveImageUrl(item.url)}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        
        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <p className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest mb-1">
            {item.category || "GALLERY_ASSET"}
          </p>
          <h4 className="text-white font-bold tracking-tight truncate">
            {item.title}
          </h4>
          <div className="mt-4 flex items-center justify-between">
             <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-mono text-zinc-400">STATUS_SECURE</span>
             </div>
             <Maximize2 className="w-4 h-4 text-white/50" />
          </div>
        </div>

        <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-white/0 via-white/[0.05] to-white/0" />
      </motion.div>
    </motion.div>
  );
};
