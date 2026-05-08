"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";
import { useContent } from "@/context/ContentContext";
import { useAuth } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import BackgroundFormulas from "@/components/BackgroundFormulas";
import MathVisualizations from "@/components/MathVisualizations";
import StarField from "@/components/StarField";
import SplashScreen from "@/components/SplashScreen";
import FloatingSidebar from "@/components/FloatingSidebar";
import ErrorBoundary from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import MaintenanceView from "@/components/MaintenanceView";
import { usePerformance } from "@/hooks/usePerformance";
import { PerformanceControl } from "@/components/PerformanceControl";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading, content } = useContent();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [splashFinished, setSplashFinished] = useState(false);
  const { shouldReduceGfx, shouldStopFormulas } = usePerformance();

  // Allow access to login and password reset pages even in maintenance mode
  const isAuthPage = pathname?.startsWith('/login') || 
                     pathname?.startsWith('/forgot-password') || 
                     pathname?.startsWith('/reset-password');

  const isMaintenance = content?.site?.maintenanceMode && !isAdmin && !isAuthPage;

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
        <motion.div
          key="content"
          initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: shouldReduceGfx ? 0.3 : 1 }}
          className="min-h-screen flex flex-col relative overflow-hidden"
        >
          {/* Global Scanline Overlay */}
          {!shouldReduceGfx && <div className="scanline fixed inset-0 z-50 pointer-events-none opacity-[0.01]" />}

          {/* Atmospheric Background */}
          <div className="fixed inset-0 pointer-events-none -z-10">
            <div className="noise absolute inset-0 opacity-[0.015]" />
            {!shouldReduceGfx && (
              <>
                <motion.div 
                  className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_70%)]"
                  animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.1, 1] }}
                  transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent,rgba(0,0,0,0.4),transparent)] opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-indigo-500/10" />
              </>
            )}
            
            {/* Background Components - Rendered above the base gradients but behind content */}
            <StarField reduced={shouldReduceGfx} />
            <MathVisualizations reduced={shouldReduceGfx} />
            <BackgroundFormulas reduced={shouldStopFormulas} />
            
            {/* Sci-fi Scanning Grid (Subtle) */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] mix-blend-overlay" />
          </div>

          <Navbar />
          <FloatingSidebar />
          <PerformanceControl />
          <main className="flex-grow relative z-10">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </main>
          
          <Footer />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
