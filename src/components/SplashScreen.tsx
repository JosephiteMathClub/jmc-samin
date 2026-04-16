"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

import { usePerformance } from '../hooks/usePerformance';

import { resolveImageUrl } from '../lib/utils';

interface SplashScreenProps {
  isLoaded: boolean;
  logoUrl?: string;
  onFinish: () => void;
}

const SplashScreen = ({ isLoaded, logoUrl, onFinish }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const { shouldReduceGfx } = usePerformance();

  const resolvedLogoUrl = resolveImageUrl(logoUrl) || "/images/logo.png";

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Faster progress when loaded or on low-end device
        const step = (isLoaded || shouldReduceGfx) ? 10 : 2;
        return Math.min(100, prev + step);
      });
    }, shouldReduceGfx ? 20 : 50);

    return () => clearInterval(interval);
  }, [isLoaded, shouldReduceGfx]);

  useEffect(() => {
    if (progress === 100) {
      const timer = setTimeout(() => {
        setIsExiting(true);
        setTimeout(onFinish, shouldReduceGfx ? 200 : 1000);
      }, shouldReduceGfx ? 100 : 800);
      return () => clearTimeout(timer);
    }
  }, [progress, onFinish, shouldReduceGfx]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: shouldReduceGfx ? 0.3 : 0.8, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center overflow-hidden"
        >
          {/* Background Grid */}
          {!shouldReduceGfx && (
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="h-full w-full" style={{ 
                backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(245, 158, 11, 0.15) 1px, transparent 0)',
                backgroundSize: '40px 40px' 
              }} />
            </div>
          )}

          <div className="relative z-10 flex flex-col items-center max-w-md w-full px-8">
            {/* Logo Animation */}
            <motion.div
              initial={shouldReduceGfx ? { opacity: 1, scale: 1 } : { scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: shouldReduceGfx ? 0.1 : 1, ease: "easeOut" }}
              className="mb-12 relative"
            >
              <div className="w-32 h-32 relative">
                <Image 
                  src={resolvedLogoUrl} 
                  alt="JMC Logo" 
                  fill
                  priority
                  className="object-contain filter drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]"
                />
              </div>
              
              {/* Spinning Ring */}
              {!shouldReduceGfx && (
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  className="absolute -inset-4 border border-amber-500/20 rounded-full border-dashed"
                />
              )}
            </motion.div>

            {/* Progress Bar Container */}
            <div className="w-full space-y-4">
              <div className="flex justify-between items-end">
                <motion.p 
                  initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-500/60"
                >
                  {progress < 100 ? "Initializing mathematical sanctuary..." : "Welcome to the Sanctuary"}
                </motion.p>
                <span className="text-xs font-mono text-amber-500/80">{progress}%</span>
              </div>
              
              <div className="h-[2px] w-full bg-white/5 rounded-full overflow-hidden relative">
                <motion.div 
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: shouldReduceGfx ? 0.1 : 0.3 }}
                />
              </div>
            </div>

            {/* Mathematical Symbols Floating */}
            {!shouldReduceGfx && (
              <div className="absolute inset-0 pointer-events-none">
                {['\u2211', '\u222B', '\u03C0', '\u221E', '\u2207'].map((symbol, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 0.2, 0],
                      scale: [0.5, 1, 0.5],
                      y: [-20, -100],
                      x: (i - 2) * 40
                    }}
                    transition={{ 
                      duration: 3, 
                      repeat: Infinity, 
                      delay: i * 0.5,
                      ease: "linear"
                    }}
                    className="absolute top-1/2 left-1/2 text-amber-500/20 font-handwritten text-2xl"
                  >
                    {symbol}
                  </motion.span>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
