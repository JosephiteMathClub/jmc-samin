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

    // Aggressive heuristic for low-end device
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isLowEnd = 
      (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || // Reverted to 4 cores
      ((navigator as any).deviceMemory && (navigator as any).deviceMemory <= 4) || // Reverted to 4GB
      isMobileDevice ||
      (window.innerWidth < 768); // Reverted to standard mobile width

    setIsLowPower(isLowEnd);
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
