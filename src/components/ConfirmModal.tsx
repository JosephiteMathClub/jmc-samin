"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { usePerformance } from '../hooks/usePerformance';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  type = 'warning'
}) => {
  const { shouldReduceGfx } = usePerformance();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className={`absolute inset-0 bg-black/80 ${shouldReduceGfx ? '' : 'backdrop-blur-sm'}`}
          />
          
          <motion.div
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <button onClick={onCancel} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                type === 'danger' ? 'bg-red-500/10 text-red-500' : 
                type === 'warning' ? 'bg-amber-500/10 text-amber-500' : 
                'bg-blue-500/10 text-blue-500'
              }`}>
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-display font-bold text-white uppercase tracking-tight">{title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{message}</p>
              </div>

              <div className="flex gap-4 w-full pt-4">
                <button
                  onClick={onCancel}
                  className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all border border-white/5"
                >
                  {cancelLabel}
                </button>
                <button
                  onClick={() => {
                    onConfirm();
                    onCancel();
                  }}
                  className={`flex-1 py-4 font-bold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-lg ${
                    type === 'danger' ? 'bg-red-500 hover:bg-red-400 text-white shadow-red-500/20' :
                    type === 'warning' ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' :
                    'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
