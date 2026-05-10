"use client";
import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useMotionValue } from 'framer-motion';
import { OptimizedImage } from '../OptimizedImage';
import { Maximize2 } from 'lucide-react';
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

  // For low-end devices, we might want to skip the complex transforms
  return (
    <div className="relative w-full overflow-hidden py-10 md:py-20">
      
      {/* Scrollable Container */}
      <div 
        ref={containerRef}
        className="flex gap-4 md:gap-12 px-[10vw] md:px-[30vw] overflow-x-auto pb-12 snap-x snap-mandatory hide-scrollbar"
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
  // When scrollX == cardLeft - (window.innerWidth / 2) + (cardWidth / 2), the card is exactly in center.
  const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000;
  const centerPosition = cardLeft - (windowWidth / 2) + (cardWidth / 2);

  // Distance from center: -1 to 1 
  // We use windowWidth as the range for full effect
  const distance = useTransform(scrollX, 
    [centerPosition - windowWidth, centerPosition, centerPosition + windowWidth], 
    [-1, 0, 1]
  );

  // Calculate transforms
  // If reduced gfx, minimal animation
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
        className="w-full h-full relative rounded-3xl overflow-hidden glass border-white/10 group shadow-2xl preserve-3d"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-between p-6 md:p-8">
          <div className="flex justify-between items-start">
             <div className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-[10px] font-mono font-black text-white uppercase tracking-widest">
                  {item.category}
                </p>
             </div>
             <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
                <Maximize2 className="w-4 h-4 text-white" />
             </div>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white tracking-tight leading-tight mb-2">
              {item.title}
            </h3>
            <div className="w-12 h-1 bg-amber-500 rounded-full mb-3" />
            <p className="text-sm text-zinc-300 line-clamp-2">
              {item.description}
            </p>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};
