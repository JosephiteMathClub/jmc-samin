"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { OptimizedImage } from '../OptimizedImage';
import { Maximize2, ArrowLeft, ArrowRight } from 'lucide-react';
import { GalleryItem } from '../../views/Gallery';

interface Fluid3DGalleryProps {
  items: GalleryItem[];
  onSelect: (item: GalleryItem) => void;
  shouldReduceGfx?: boolean;
}

export const Fluid3DGallery: React.FC<Fluid3DGalleryProps> = ({ 
  items, 
  onSelect,
  shouldReduceGfx = false 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.scrollWidth - containerRef.current.clientWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.scrollWidth - containerRef.current.clientWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]);

  const { scrollX } = useScroll({ container: containerRef });
  const smoothScrollX = useSpring(scrollX, { damping: 25, stiffness: 120, mass: 0.5 }); // Fluid feel

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: -340, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollBy({ left: 340, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full overflow-hidden py-10 md:py-20 flex flex-col items-center">
      
      {/* Immersive halo backdrop glow inside 3D Gallery */}
      {!shouldReduceGfx && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[340px] bg-amber-500/5 blur-[160px] rounded-full pointer-events-none z-0" />
      )}

      {/* Floating Desktop Navigation Controls */}
      <div className="absolute top-[45%] -translate-y-1/2 left-6 md:left-[10vw] z-30 hidden sm:block">
        <button
          onClick={scrollLeft}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900/60 border border-white/5 hover:border-amber-500/30 text-zinc-400 hover:text-white hover:bg-zinc-950 hover:shadow-2xl hover:shadow-amber-500/10 transition-all outline-none backdrop-blur-md"
          title="Scroll Left"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      </div>

      <div className="absolute top-[45%] -translate-y-1/2 right-6 md:right-[10vw] z-30 hidden sm:block">
        <button
          onClick={scrollRight}
          className="w-14 h-14 rounded-full flex items-center justify-center bg-zinc-900/60 border border-white/5 hover:border-amber-500/30 text-zinc-400 hover:text-white hover:bg-zinc-950 hover:shadow-2xl hover:shadow-amber-500/10 transition-all outline-none backdrop-blur-md"
          title="Scroll Right"
        >
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="flex gap-4 md:gap-12 px-[10vw] md:px-[30vw] overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar relative z-10 w-full"
        style={{ scrollBehavior: shouldReduceGfx ? 'smooth' : 'auto' }}
      >
        {items.map((item, index) => {
          return (
            <GalleryCard 
              key={item.id} 
              item={item} 
              index={index} 
              onSelect={() => onSelect(item)} 
              scrollX={shouldReduceGfx ? scrollX : smoothScrollX}
              containerWidth={containerWidth}
              shouldReduceGfx={shouldReduceGfx}
            />
          );
        })}
      </div>

      {/* Aesthetic help-indicator panel focused at center */}
      <div className="flex items-center justify-center gap-1.5 mt-2 relative z-20">
        <div className="flex items-center gap-2.5 bg-zinc-905/85 border border-white/5 py-2 px-4 rounded-full backdrop-blur-xl shadow-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
          <span className="text-[10px] font-mono font-black text-zinc-450 uppercase tracking-widest leading-none">
            DRAG, WHEEL OR USE OVERLAID CONTROLS
          </span>
        </div>
      </div>

    </div>
  );
};

const GalleryCard = ({ item, index, onSelect, scrollX, containerWidth, shouldReduceGfx }: any) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardLeft, setCardLeft] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  useEffect(() => {
    if (cardRef.current) {
      setCardLeft(cardRef.current.offsetLeft);
      setCardWidth(cardRef.current.clientWidth);
    }
  }, [containerWidth]);

  // Viewport center relative to the scroll container
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const centerPosition = cardLeft - (windowWidth / 2) + (cardWidth / 2);

  // Distance from center: -1 to 1 
  const distance = useTransform(scrollX, 
    [centerPosition - windowWidth, centerPosition, centerPosition + windowWidth], 
    [-1, 0, 1]
  );

  // Calculate transforms
  const scale = useTransform(distance, [-1, 0, 1], [shouldReduceGfx ? 1 : 0.75, 1, shouldReduceGfx ? 1 : 0.75]);
  const rotateY = useTransform(distance, [-1, 0, 1], [shouldReduceGfx ? 0 : 35, 0, shouldReduceGfx ? 0 : -35]);
  const brightness = useTransform(distance, [-1, 0, 1], [0.3, 1, 0.3]);
  const blur = useTransform(distance, [-1, 0, 1], [shouldReduceGfx ? '0px' : '8px', '0px', shouldReduceGfx ? '0px' : '8px']);
  const zIndex = useTransform(distance, [-1, 0, 1], [0, 10, 0]);

  return (
    <motion.div
      ref={cardRef}
      className={`shrink-0 cursor-pointer snap-center perspective-1000`}
      style={{ 
        width: 'min(80vw, 400px)',
        height: 'min(120vw, 550px)',
        zIndex 
      }}
      onClick={onSelect}
    >
      <motion.div
        className="w-full h-full relative rounded-3xl overflow-hidden bg-zinc-950 border border-white/10 group shadow-[0_4px_30px_rgba(0,0,0,0.4)] transition-all hover:border-amber-500/30 duration-300 preserve-3d"
        style={{
          scale,
          rotateY,
          filter: shouldReduceGfx ? 'none' : `blur(${blur.get()})`,
        }}
      >
        <motion.div style={{ filter: `brightness(${brightness.get()})` }} className="w-full h-full">
          <OptimizedImage
            src={item.url}
            alt={item.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 80vw, 400px"
          />
        </motion.div>

        {/* Hover / Info Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-6 md:p-8">
          <div className="flex justify-between items-start">
             <div className="px-3 py-1 rounded-full bg-zinc-900/90 backdrop-blur-md border border-white/10">
                <p className="text-[10px] font-mono font-black text-amber-500 uppercase tracking-widest">
                  {item.category}
                </p>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
             </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight mb-2 uppercase">
              {item.title}
            </h3>
            <div className="w-12 h-0.5 bg-amber-500 rounded-full mb-3" />
            <p className="text-xs text-zinc-350 line-clamp-2 leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>

        {/* Static Title Plate for Touch Devices (In Center Position) */}
        <div className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5 flex items-center justify-between pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
          <span className="text-[10px] font-bold text-white uppercase tracking-wider truncate max-w-[80%]">{item.title}</span>
          <Maximize2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
        </div>

      </motion.div>
    </motion.div>
  );
};

