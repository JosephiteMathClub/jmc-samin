'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechSupport } from '@/context/TechSupportContext';
import { 
  AlertCircle, 
  X, 
  Send, 
  Bug, 
  ShieldAlert, 
  ChevronRight,
  Terminal,
  Activity,
  History
} from 'lucide-react';

export const SupportModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { lastError, sendSupportTicket, isSending } = useTechSupport();
  const [message, setMessage] = useState('');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    const success = await sendSupportTicket(message);
    if (success) {
      setMessage('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-xl bg-zinc-900 border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-r from-amber-500/10 to-indigo-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">Report a Problem</h3>
                <p className="text-xs text-zinc-400">Our admins will fix it as soon as possible.</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-full transition-colors text-zinc-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mb-2 block">What happened?</span>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe the issue you encountered..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 py-3 h-32 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 transition-all resize-none"
                />
              </label>

              {lastError && (
                <div className="p-4 bg-red-500/5 border border-red-500/10 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-red-400">
                      <Bug className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Recent Error Detected</span>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                      className="text-[10px] text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      {showTechnicalDetails ? 'Hide' : 'View'} Details
                      <ChevronRight className={`w-3 h-3 transition-transform ${showTechnicalDetails ? 'rotate-90' : ''}`} />
                    </button>
                  </div>
                  
                  <p className="text-[10px] text-zinc-400 font-mono leading-relaxed truncate">
                    {lastError.message}
                  </p>

                  <AnimatePresence>
                    {showTechnicalDetails && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-2 pt-2 border-t border-red-500/10 grid grid-cols-1 gap-2">
                          <div className="flex items-center gap-2 text-[8px] font-mono text-zinc-500 uppercase">
                            <Terminal className="w-2.5 h-2.5" />
                            <span>Stack Trace:</span>
                          </div>
                          <pre className="text-[9px] text-zinc-600 font-mono bg-black/30 p-3 rounded-xl overflow-x-auto max-h-40 scrollbar-thin">
                            {lastError.error}
                          </pre>
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center gap-1.5">
                              <History className="w-3 h-3 text-zinc-600" />
                              <span className="text-[8px] text-zinc-500 font-mono">{lastError.timestamp}</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                              <Activity className="w-3 h-3 text-zinc-600" />
                              <span className="text-[8px] text-zinc-500 font-mono truncate">{lastError.url}</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 pt-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[8px] text-red-500/80 font-bold uppercase tracking-wider">Technical context will be attached automatically</span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 px-6 bg-white/5 border border-white/5 rounded-2xl text-[10px] uppercase tracking-widest font-black text-zinc-400 hover:text-white hover:bg-white/10 transition-all"
              >
                Cancel
              </button>
              <button
                disabled={isSending || !message.trim()}
                type="submit"
                className="flex-1 py-3 px-6 bg-amber-500 border border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)] rounded-2xl text-[10px] uppercase tracking-widest font-black text-black hover:bg-amber-400 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {isSending ? (
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    Send Request
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
