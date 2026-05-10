"use client";
import { useState, useEffect } from 'react';

export function usePerformance() {
  const [isLowPower, setIsLowPower] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('high');

  useEffect(() => {
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    const checkPerformance = () => {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 4;
      const connection = (navigator as any).connection;
      const isSlowNet = connection && (connection.saveData || /2g|3g/.test(connection.effectiveType));
      
      let level: 'high' | 'medium' | 'low' = 'high';

      if (cores <= 4 || memory <= 4 || isSlowNet) {
        level = 'low';
      } else if (cores <= 6 || memory <= 6) {
        level = 'medium';
      }

      setPerformanceLevel(level);
      setIsLowPower(level === 'low');
    };

    checkPerformance();

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const toggleOverride = (value: boolean) => {};

  const shouldReduceGfx = isLowPower || prefersReducedMotion;

  return {
    isLowPower,
    isMobile,
    performanceLevel,
    prefersReducedMotion,
    manualOverride: null, // Removed manual override to force detection
    toggleOverride,
    shouldReduceGfx,
    shouldStopFormulas: shouldReduceGfx
  };
}

