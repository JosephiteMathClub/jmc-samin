"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Calculator, Info } from "lucide-react";
import { LatexCheatsheetModal } from "./LatexCheatsheetModal";

export const LatexCheatsheetTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <div className="fixed bottom-40 right-6 sm:bottom-24 sm:right-8 z-[9999]">
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
          title="LaTeX Formatter Cheatsheet"
        >
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="relative flex items-center gap-3">
            <div className="p-1.5 bg-emerald-500/20 rounded-lg">
              <Calculator className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              LaTeX Cheatsheet
            </span>
            <Info className="w-4 h-4 text-zinc-600 sm:hidden" />
          </div>
        </motion.button>
      </div>

      <LatexCheatsheetModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
