"use client";
import { useState, useEffect } from 'react';

export function usePerformance() {
  const [isLowPower, setIsLowPower] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [performanceLevel, setPerformanceLevel] = useState<'high' | 'medium' | 'low'>('high');
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [manualOverride, setManualOverride] = useState<boolean | null>(null);

  useEffect(() => {
    // Check localStorage for manual override
    const savedOverride = localStorage.getItem('performance_gfx_reduction');
    if (savedOverride !== null) {
      setManualOverride(savedOverride === 'true');
    }

    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    // Precise mobile detection
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);

    // Advanced Hardware Analysis
    const checkPerformance = () => {
      const cores = navigator.hardwareConcurrency || 4;
      const memory = (navigator as any).deviceMemory || 4;
      const connection = (navigator as any).connection;
      const isSlowNet = connection && (connection.saveData || /2g|3g/.test(connection.effectiveType));
      const width = window.innerWidth;
      const isSmallScreen = width < 768;
      
      // Determine level
      let level: 'high' | 'medium' | 'low' = 'high';

      if (isMobileDevice) {
        // Even high spec mobiles can struggle with battery/heat if animations are too heavy
        // or if the screen resolution is too low to make them look good.
        if (cores <= 4 || memory <= 2 || isSlowNet || width < 480) {
          level = 'low';
        } else if (cores <= 6 || memory <= 4 || isSmallScreen) {
          level = 'medium';
        }
      } else {
        if (cores <= 2 || memory <= 2) {
          level = 'low';
        } else if (cores <= 4 || memory <= 4) {
          level = 'medium';
        }
      }

      setPerformanceLevel(level);
      setIsLowPower(level === 'low');
    };

    checkPerformance();

    // FPS Diagnostic
    let frames = 0;
    let start = performance.now();
    const checkFps = () => {
      frames++;
      const now = performance.now();
      if (now - start < 1000) {
        requestAnimationFrame(checkFps);
      } else {
        const fps = frames;
        if (fps < 40 && manualOverride === null) {
          setPerformanceLevel('low');
          setIsLowPower(true);
        }
      }
    };
    requestAnimationFrame(checkFps);

    return () => mediaQuery.removeEventListener('change', listener);
  }, [manualOverride]);

  const toggleOverride = (value: boolean) => {
    setManualOverride(value);
    localStorage.setItem('performance_gfx_reduction', String(value));
  };

  return {
    isLowPower,
    isMobile,
    performanceLevel,
    prefersReducedMotion,
    manualOverride,
    toggleOverride,
    shouldReduceGfx: manualOverride !== null ? manualOverride : (isLowPower || prefersReducedMotion || performanceLevel === 'low'),
    // Aggressive limiter: stop background formulas unless on high-spec PC or high-spec Mobile
    shouldStopFormulas: manualOverride !== null ? manualOverride : (
      isMobile 
        ? performanceLevel !== 'high' || prefersReducedMotion 
        : performanceLevel === 'low' || prefersReducedMotion
    )
  };
}
