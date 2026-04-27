"use client";
import { useState, useEffect } from 'react';

export function usePerformance() {
  const [isLowPower, setIsLowPower] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', listener);

    // Heuristic for low-end device or slow network
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Check for slow connection
    const connection = (navigator as any).connection;
    const isSlowConnection = connection && (connection.saveData || /2g|3g/.test(connection.effectiveType));

    const isLowEnd = 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || 
      ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) || 
      isMobileDevice ||
      isSlowConnection ||
      (window.innerWidth < 768);

    setIsLowPower(!!isLowEnd);
    setIsMobile(isMobileDevice);

    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  return {
    isLowPower,
    isMobile,
    prefersReducedMotion,
    shouldReduceGfx: isLowPower || prefersReducedMotion
  };
}
