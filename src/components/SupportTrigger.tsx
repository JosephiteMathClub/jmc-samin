'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, HelpCircle } from 'lucide-react';
import { SupportModal } from './SupportModal';
import { useAuth } from '@/context/AuthContext';

export const SupportTrigger: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  return (
    <>
      <div className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-[9999]">
        <motion.button
          onClick={() => setIsOpen(true)}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Glowing Aura */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-indigo-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="relative flex items-center gap-3">
            <div className="p-1.5 bg-amber-500/20 rounded-lg">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
            </div>
            <span className="hidden sm:inline-block text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
              Report Issue
            </span>
            <HelpCircle className="w-4 h-4 text-zinc-600 sm:hidden" />
          </div>
        </motion.button>

        {/* Unseen count indicator could go here if admins have unread messages */}
      </div>

      <SupportModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};
