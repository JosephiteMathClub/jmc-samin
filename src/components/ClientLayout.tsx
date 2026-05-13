"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname, useRouter } from "next/navigation";
import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import StarField from "@/components/StarField";
import SplashScreen from "@/components/SplashScreen";
import FloatingSidebar from "@/components/FloatingSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import MaintenanceView from "@/components/MaintenanceView";
import { SupportTrigger } from "@/components/SupportTrigger";
import { usePerformance } from "@/hooks/usePerformance";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading, content } = useContent();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [splashFinished, setSplashFinished] = useState(false);
  const { shouldReduceGfx, shouldStopFormulas } = usePerformance();
  const restoredRef = useRef(false);

  // Allow access to login and password reset pages even in maintenance mode
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password');

  const isMaintenance = content?.site?.maintenanceMode && !isAdmin && !isAuthPage;

  // Restore path if PWA was killed by OS (e.g., during file picking)
  useEffect(() => {
    if (typeof window !== 'undefined' && !restoredRef.current) {
      restoredRef.current = true;
      try {
        const savedPath = localStorage.getItem('jmc_last_path');
        const savedTime = localStorage.getItem('jmc_last_path_time');
        
        if (savedPath && savedTime) {
          const timeDiff = Date.now() - parseInt(savedTime, 10);
          // Only restore if less than 2 hours have passed
          // AND only if they are landing on the root page (to allow deep links like /reset-password to work)
          if (timeDiff < 2 * 60 * 60 * 1000 && window.location.pathname === '/') {
            // Prevent redirect loops
            localStorage.removeItem('jmc_last_path');
            localStorage.removeItem('jmc_last_path_time');
            // Check if saved path wasn't root before pushing
            const savedPathname = savedPath.split('?')[0].split('#')[0];
            if (savedPathname !== '/') {
              router.push(savedPath);
            }
          }
        }
      } catch (e) {
        console.error("Failed to restore path", e);
      }
    }
  }, [router]);

  // Keep track of the current path for crash recovery
  useEffect(() => {
    if (typeof window !== 'undefined' && pathname && splashFinished) {
      try {
        localStorage.setItem('jmc_last_path', window.location.pathname + window.location.search);
        localStorage.setItem('jmc_last_path_time', Date.now().toString());
      } catch (e) {
        // Ignore quota or access errors
      }
    }
  }, [pathname, splashFinished]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && pathname) {
        try {
          localStorage.setItem('jmc_last_path', window.location.pathname + window.location.search);
          localStorage.setItem('jmc_last_path_time', Date.now().toString());
        } catch (e) {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [pathname]);

  return (
    <AnimatePresence mode="wait">
      {!splashFinished ? (
        <SplashScreen 
          key="splash" 
          isLoaded={!loading} 
          logoUrl={content?.site?.logoUrl}
          onFinish={() => setSplashFinished(true)} 
        />
      ) : isMaintenance ? (
        <MaintenanceView 
          key="maintenance"
          message={content?.site?.maintenanceMessage}
          logoUrl={content?.site?.logoUrl}
        />
      ) : (
        <>
          {/* Atmospheric Background */}
          <StarField reduced={shouldReduceGfx} />
          
          <motion.div
            key="content"
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: shouldReduceGfx ? 0.3 : 1 }}
            className="min-h-screen flex flex-col relative overflow-hidden bg-transparent"
            style={{ position: 'relative', zIndex: 1 }}
          >
            <Navbar />
            <FloatingSidebar />
            <main className="flex-grow relative z-10">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
            </main>
            
            <SupportTrigger />
            <Footer />
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
