"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ZapOff, X, Cpu, Gauge } from 'lucide-react';
import { usePerformance } from '@/hooks/usePerformance';

export const PerformanceControl = () => {
  const { performanceLevel, shouldReduceGfx, toggleOverride, manualOverride } = usePerformance();
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    // Hide when typing on mobile
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsInputFocused(true);
      }
    };
    const handleBlur = () => setIsInputFocused(false);

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  useEffect(() => {
    // Show only if performance is low or medium and hasn't been dismissed
    if ((performanceLevel === 'low' || performanceLevel === 'medium') && !hasDismissed && !isInputFocused) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    } else if (isInputFocused) {
      setIsVisible(false);
    }
  }, [performanceLevel, hasDismissed, isInputFocused]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
  };

  const handleToggle = () => {
    toggleOverride(!shouldReduceGfx);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 100, x: '-50%' }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-md"
        >
          <div className="glass-card p-4 flex items-center gap-4 bg-black/80 backdrop-blur-2xl border-white/10 shadow-2xl overflow-visible">
            <div className={`p-3 rounded-2xl ${shouldReduceGfx ? 'bg-amber-500/10 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
              {shouldReduceGfx ? <ZapOff size={20} /> : <Zap size={20} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
                Performance Optimized
                <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono uppercase tracking-widest ${
                  performanceLevel === 'low' ? 'bg-red-500/20 text-red-500' : 'bg-amber-500/20 text-amber-500'
                }`}>
                  {performanceLevel}
                </span>
              </h4>
              <p className="text-[10px] text-zinc-400 line-clamp-1">Visual effects reduced for smooth experience.</p>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={handleToggle}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-[10px] font-mono font-bold text-white transition-colors"
              >
                {shouldReduceGfx ? "Enable FX" : "Limit FX"}
              </button>
              <button 
                onClick={handleDismiss}
                className="p-2 rounded-xl hover:bg-white/5 text-zinc-500 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Decorative Pulse */}
            <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full blur-[2px] animate-pulse ${
              shouldReduceGfx ? 'bg-amber-500' : 'bg-emerald-500'
            }`} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
