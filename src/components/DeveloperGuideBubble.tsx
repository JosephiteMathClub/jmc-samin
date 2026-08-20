"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Code2, Sparkles, X, ArrowRight, ArrowUp, Terminal } from "lucide-react";

export default function DeveloperGuideBubble() {
  const pathname = usePathname();
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    // Do not show if already on developers page or admin dashboard
    if (pathname?.startsWith("/developers") || pathname?.startsWith("/admin")) {
      setIsVisible(false);
      return;
    }

    // Check if previously dismissed in this session
    if (typeof window !== "undefined") {
      const dismissed = sessionStorage.getItem("jmc_dev_guide_dismissed");
      if (dismissed === "true") {
        setHasDismissed(true);
        return;
      }

      // Show after a brief delay so the initial page render & splash feel natural
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [pathname]);

  const handleDismiss = () => {
    setIsVisible(false);
    setHasDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("jmc_dev_guide_dismissed", "true");
    }
  };

  const handleNavigate = () => {
    handleDismiss();
    router.push("/developers");
  };

  if (hasDismissed || pathname?.startsWith("/developers") || pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed z-[100] inset-x-0 top-16 sm:top-20 md:top-24 flex justify-center md:justify-end px-4 sm:px-6 md:pr-16 lg:pr-32 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, y: -25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="relative pointer-events-auto max-w-sm w-full"
          >
            {/* Animated Pointer Arrow pointing towards the Top Navbar / Developers */}
            <div className="absolute -top-10 right-10 sm:right-16 md:right-24 flex flex-col items-center pointer-events-none">
              <motion.div
                animate={{
                  y: [-3, -10, -3],
                }}
                transition={{
                  repeat: Infinity,
                  duration: 1.6,
                  ease: "easeInOut",
                }}
                className="flex flex-col items-center"
              >
                {/* Glowing Comic Arrow Head */}
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-b from-cyan-400 to-indigo-600 flex items-center justify-center shadow-[0_0_20px_rgba(0,180,219,0.8)] border border-white">
                    <ArrowUp className="w-5 h-5 text-black stroke-[3]" />
                  </div>
                  {/* Ripple Ring */}
                  <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-50 pointer-events-none" />
                </div>
                {/* Arrow stem */}
                <div className="w-1 h-3 bg-gradient-to-b from-indigo-500 to-white/40 rounded-full -mt-0.5 shadow-[0_0_8px_rgba(0,180,219,0.5)]" />
              </motion.div>
            </div>

            {/* Speech / Text Bubble Container */}
            <div className="relative bg-[#0a0a10]/95 backdrop-blur-2xl border-2 border-cyan-400/60 rounded-3xl p-5 shadow-[0_15px_40px_rgba(0,0,0,0.85),0_0_30px_rgba(0,180,219,0.2)] text-white overflow-hidden group">
              {/* Subtle Ambient HUD Glows */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/10 rounded-full blur-2xl pointer-events-none" />

              {/* Speech Bubble Little Tail pointer pointing up */}
              <div className="absolute -top-2.5 right-12 sm:right-18 md:right-26 w-5 h-5 bg-[#0a0a10] border-t-2 border-l-2 border-cyan-400/60 transform rotate-45" />

              {/* Header row */}
              <div className="flex items-center justify-between gap-3 relative z-10 pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                    <Terminal className="w-3.5 h-3.5" />
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-cyan-400">
                      SYS_NOTICE
                    </span>
                    <span className="w-1 h-1 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-wider text-pink-400">
                      MEET THE BUILDERS
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Dismiss notice"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Text Body Content */}
              <div className="py-3.5 space-y-2 relative z-10">
                <p className="text-xs font-bold text-zinc-100 leading-relaxed font-sans flex items-start gap-2">
                  <span className="text-base leading-none">👨‍💻</span>
                  <span>
                    Look at the <strong className="text-cyan-300 underline decoration-cyan-400 underline-offset-2">developers</strong> of this website! Explore the creators & platform architects behind Josephite Math Club.
                  </span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 pt-1 relative z-10">
                <button
                  type="button"
                  onClick={handleNavigate}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-400 via-teal-400 to-indigo-500 hover:from-cyan-300 hover:to-indigo-400 text-black font-black text-[10px] uppercase tracking-widest transition-all shadow-[0_0_20px_rgba(0,180,219,0.35)] flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>View Developers</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
