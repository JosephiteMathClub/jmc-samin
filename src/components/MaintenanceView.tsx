"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Settings, ShieldAlert, Clock, LogIn } from 'lucide-react';
import Link from 'next/link';

interface MaintenanceViewProps {
  message?: string;
  logoUrl?: string;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ 
  message = "The application is currently undergoing maintenance. Please check back later.",
  logoUrl 
}) => {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-amber-500/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/10 rounded-full blur-[120px] opacity-20" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl text-center space-y-8 relative z-10"
      >
        <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto border border-red-500/30">
          <Settings className="w-10 h-10 text-red-500 animate-spin-slow" />
        </div>

        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-[0.3em]">
            <ShieldAlert className="w-3 h-3" />
            Maintenance Mode
          </div>
          <h1 className="text-3xl font-display font-bold text-white tracking-tighter uppercase">
            WE&apos;LL BE <span className="text-red-500">BACK SOON</span>
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed font-medium">
            {message}
          </p>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-6">
          <div className="flex items-center justify-center gap-3 text-zinc-600">
            <Clock className="w-4 h-4" />
            <span className="text-[10px] font-bold uppercase tracking-widest">Estimated downtime: 2 hours</span>
          </div>

          <div className="flex flex-col gap-3">
            <Link 
              href="/login" 
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all group"
            >
              <LogIn className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
              Admin Login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MaintenanceView;
