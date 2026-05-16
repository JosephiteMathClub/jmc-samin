"use client";
import React from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Loader2, 
  CheckCircle2, 
  ShieldAlert,
  Shield,
  ChevronRight,
  LucideIcon,
  LogOut
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { usePerformance } from '../../hooks/usePerformance';
import { resolveImageUrl } from '../../lib/utils';

interface DashboardLayoutProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSave: () => void;
  onReset?: () => void;
  saving: boolean;
  saveSuccess: boolean;
  isSupabaseConfigured: boolean;
  logoUrl?: string;
  isSuperAdmin?: boolean;
  tabs: { id: string; label: string; icon: LucideIcon }[];
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ 
  activeTab, 
  onTabChange, 
  onSave, 
  onReset,
  saving, 
  saveSuccess, 
  isSupabaseConfigured,
  logoUrl,
  isSuperAdmin,
  tabs,
  children
}) => {
  const router = useRouter();
  const { shouldReduceGfx } = usePerformance();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="flex min-h-screen bg-transparent selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-[70] w-72 lg:w-80 border-r border-white/5 bg-[#080808] flex flex-col transition-transform duration-500 lg:translate-x-0 lg:h-screen
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 lg:p-8 border-b border-white/5 flex items-center justify-between relative overflow-hidden group">
          {!shouldReduceGfx && (
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-amber-500/5 to-amber-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
          )}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-20 lg:w-24 h-10 relative">
              <Image 
                src={resolveImageUrl(logoUrl) || "/images/logo.png"} 
                alt="JMC Logo" 
                fill
                priority
                className="object-contain"
              />
            </div>
            <div>
              <h2 className="text-base lg:text-lg font-bold text-white font-display tracking-tight">
                {isSuperAdmin ? "JMC Root" : "JMC Admin"}
              </h2>
              <p className="text-[9px] lg:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                <span className={`w-1 h-1 rounded-full ${isSuperAdmin ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)]' : 'bg-amber-500'} animate-pulse`} />
                {isSuperAdmin ? "Root Access" : "Control Center"}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-2 text-zinc-500 hover:text-white"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-8 custom-scrollbar relative">
          {/* Subtle noise pattern for background */}
          {!shouldReduceGfx && <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />}
          
          {!isSupabaseConfigured && (
            <motion.div 
              initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
              animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              className="p-5 bg-amber-500/5 border border-amber-500/10 rounded-3xl text-amber-500 text-[11px] leading-relaxed shadow-inner relative z-10"
            >
              <div className="flex items-center gap-2 font-bold mb-2 uppercase tracking-widest">
                <ShieldAlert className="w-4 h-4" />
                Database Offline
              </div>
              Persistence is currently disabled. Changes will not be saved to the cloud.
            </motion.div>
          )}

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6 px-4">
              <h3 className="text-[10px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Management</h3>
              <div className="flex gap-1">
                {[1, 2, 3].map(i => <div key={i} className="w-1 h-1 bg-zinc-800 rounded-full" />)}
              </div>
            </div>
            <nav className="space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`w-full group flex items-center justify-between px-5 py-3.5 rounded-2xl transition-all duration-500 relative overflow-hidden ${
                    activeTab === tab.id 
                      ? 'text-black translate-x-1' 
                      : 'text-zinc-500 hover:bg-white/[0.02] hover:text-zinc-200'
                  }`}
                >
                  {activeTab === tab.id && !shouldReduceGfx && (
                    <motion.div 
                      layoutId="activeTab"
                      className="absolute inset-0 bg-amber-500 z-0 shadow-2xl shadow-amber-500/50"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  {activeTab === tab.id && shouldReduceGfx && (
                    <div className="absolute inset-0 bg-amber-500 z-0" />
                  )}
                  <div className="flex items-center gap-4 relative z-10">
                    <tab.icon className={`w-4 h-4 transition-colors duration-300 ${activeTab === tab.id ? 'text-black' : 'text-zinc-600 group-hover:text-amber-500'}`} />
                    <span className="text-xs font-bold tracking-tight uppercase group-hover:tracking-widest transition-all duration-500">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && <div className="w-1 h-1 bg-black rounded-full relative z-10" />}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="p-6 border-t border-white/5 space-y-4 relative z-10 bg-[#080808]">
          <div className="flex items-center justify-between px-2 mb-2">
            <div className="flex gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/40" />
            </div>
            <span className="text-[8px] font-mono text-zinc-600 tracking-tighter">V4.0.2_STABLE</span>
          </div>
          <div className={`flex items-center gap-4 p-4 rounded-3xl border transition-colors ${
            isSuperAdmin ? 'bg-purple-500/5 border-purple-500/10 group hover:border-purple-500/20' : 'bg-white/[0.03] border-white/5 group hover:border-white/10'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border transition-colors ${
              isSuperAdmin ? 'bg-zinc-900 text-purple-500 border-purple-500/20' : 'bg-zinc-900 text-zinc-600 border-white/5 group-hover:text-amber-500'
            }`}>
              <Shield className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">
                {isSuperAdmin ? "Master_Root" : "Administrator"}
              </p>
              <p className="text-[10px] text-zinc-600 font-medium truncate uppercase tracking-widest flex items-center gap-1.5">
                <span className={`w-1 h-1 rounded-full animate-pulse ${isSuperAdmin ? 'bg-purple-500' : 'bg-emerald-500'}`} />
                {isSuperAdmin ? 'Kernel_Verified' : 'Identity_Verified'}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-zinc-600 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest border border-transparent hover:border-white/5 rounded-2xl"
          >
            <LogOut className="w-3.5 h-3.5" />
            Terminal_Exit
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-[#050505] relative min-w-0 lg:pl-80">
        {/* Top Header Bar */}
        <div className="sticky top-0 z-40 w-full bg-[#050505]/80 backdrop-blur-2xl border-b border-white/5 px-4 lg:px-12 py-4 lg:py-6">
          <div className="max-w-6xl mx-auto flex justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 text-zinc-500 hover:text-white bg-white/5 rounded-xl border border-white/10"
              >
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current mb-1" />
                <div className="w-5 h-0.5 bg-current" />
              </button>
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full bg-amber-500 ${shouldReduceGfx ? '' : 'animate-pulse'}`} />
                <span className="text-[9px] lg:text-[10px] font-bold text-zinc-500 uppercase tracking-[0.4em] hidden sm:inline">Live Editor</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 lg:gap-4">
              {onReset && (
                <button
                  onClick={() => {
                    onReset();
                  }}
                  disabled={saving}
                  className="relative z-[9999] pointer-events-auto px-3 lg:px-6 py-2 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-[10px] lg:text-sm tracking-tight disabled:opacity-30"
                >
                  Discard
                </button>
              )}
              
              <motion.button
                whileHover={shouldReduceGfx ? {} : { scale: 1.02 }}
                whileTap={shouldReduceGfx ? {} : { scale: 0.98 }}
                onClick={() => {
                  onSave();
                }}
                disabled={saving || saveSuccess}
                className={`relative z-[9999] pointer-events-auto flex items-center gap-2 lg:gap-3 px-4 lg:px-10 py-2 lg:py-3.5 rounded-xl lg:rounded-2xl font-bold transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed text-[10px] lg:text-sm tracking-tight ${
                  saveSuccess 
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20' 
                    : 'bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-400'
                }`}
              >
                {saving ? (
                  <>
                    <Loader2 className={`w-4 h-4 lg:w-5 lg:h-5 ${shouldReduceGfx ? '' : 'animate-spin'}`} />
                    <span className="hidden sm:inline">Processing...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5" />
                    <span className="hidden sm:inline">Changes Saved</span>
                    <span className="sm:hidden">Saved</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 lg:w-5 lg:h-5" /> 
                    <span className="hidden sm:inline">Update Content</span>
                    <span className="sm:hidden">Update</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Content Container */}
        <div className="max-w-6xl mx-auto p-6 lg:p-12 pb-32">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, x: 20 }}
              animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, x: -20 }}
              transition={shouldReduceGfx ? { duration: 0.1 } : { duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="mb-8 lg:mb-16">
                <h1 className="text-4xl lg:text-7xl font-bold text-white font-display tracking-tight mb-4 capitalize">
                  {activeTab.replace('_', ' ')}
                </h1>
                <p className="text-zinc-500 text-sm lg:text-lg font-medium leading-relaxed max-w-2xl">
                  Configure and manage the {activeTab.replace('_', ' ')} section of your website. All changes are reflected in real-time.
                </p>
              </div>

              <div className="space-y-8 lg:space-y-12">
                {children}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
