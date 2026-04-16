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

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { loading, content } = useContent();
  const { isAdmin } = useAuth();
  const pathname = usePathname();
  const [splashFinished, setSplashFinished] = useState(false);
  const { shouldReduceGfx } = usePerformance();

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
          {/* Atmospheric Background */}
          <div className="fixed inset-0 pointer-events-none -z-30">
            {!shouldReduceGfx && <div className="noise absolute inset-0 opacity-[0.01]" />}
            <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-indigo-500/5" />
          </div>

          {/* Background Effects - Always rendered but optimized */}
          <StarField reduced={shouldReduceGfx} />
          <MathVisualizations reduced={shouldReduceGfx} />
          <BackgroundFormulas reduced={shouldReduceGfx} />
          
          <Navbar />
          <FloatingSidebar />
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
