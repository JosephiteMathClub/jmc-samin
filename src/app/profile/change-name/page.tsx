"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ShieldAlert,
  Sparkles,
  HelpCircle,
  Code
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ChangeNamePage() {
  const { user, profile, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [currentFullName, setCurrentFullName] = useState('');
  const [givenName, setGivenName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [isEc, setIsEc] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Parse current user information
  useEffect(() => {
    if (user) {
      setCheckingAuth(false);
      if (profile) {
        setCurrentFullName(profile.full_name || '');
        // Do NOT automatically prefill the suggested name. The user will manually input it.
        setGivenName('');
      }
      
      // Check member status
      const checkMember = async () => {
        try {
          const { data: memberData } = await supabase
            .from('member')
            .select('id, is_ec')
            .eq('id', user.id)
            .maybeSingle();

          const { data: ecData } = await supabase
            .from('ec_member')
            .select('id')
            .eq('id', user.id)
            .maybeSingle();

          if (ecData || memberData?.is_ec) {
            setIsMember(true);
            setIsEc(true);
          } else if (memberData) {
            setIsMember(true);
            setIsEc(false);
          }
        } catch (err) {
          console.error('Error checking member records:', err);
        }
      };

      checkMember();
    } else {
      // Allow a brief moment for context to load before redirecting to login
      const timer = setTimeout(() => {
        if (!user) {
          router.push('/login?redirect=/profile/change-name');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, profile, router]);

  // Handle updates
  const handleNameCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const trimmedName = givenName.trim();

    if (!trimmedName) {
      setError("Please enter a valid name.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newFullName: trimmedName })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update your name.');
      }

      await refreshProfile();
      setSuccess(true);
      showToast("Name updated successfully!", "success");
      
      // Delay redirect slightly so user sees the success state
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (err: any) {
      console.error("Name update error:", err);
      setError(err.message || "Failed to update name. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-rose-500 animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Verifying Authentication state...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-24 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg">
        {/* Back navigation line */}
        <button
          onClick={() => router.push('/profile')}
          className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white mb-8 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to user profile
        </button>

        {/* Content Box Container */}
        <div className="relative bg-white/[0.01] border border-white/5 p-8 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-rose-500 via-amber-500 to-rose-500" />
          
          <div className="space-y-6">
            {/* Header branding */}
            <div className="text-center md:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                <Sparkles className="w-3 h-3 animate-pulse" /> Profile Settings
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none">
                Update Account Name
              </h1>
              <p className="text-xs text-zinc-400 mt-2 font-medium leading-relaxed">
                Update your registered display name for your Josephite Math Club profile.
              </p>
            </div>

            {/* User Profile Info card */}
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex items-center justify-between text-xs font-semibold">
              <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-mono">Current Registered Name</span>
              <span className="text-white truncate max-w-[240px]">{currentFullName || 'Not Set'}</span>
            </div>

            {/* Active Submission Form */}
            <form onSubmit={handleNameCorrection} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">
                  New Display Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    placeholder="e.g. Samin Tausif"
                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-700 outline-none focus:border-rose-500/50 transition-all font-bold tracking-wide"
                  />
                </div>
              </div>

              {/* Status alerts */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>Name corrected successfully! Redirecting you to profile...</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submission Button */}
              <button
                type="submit"
                disabled={loading || success}
                className="w-full py-4 rounded-xl bg-rose-500 hover:bg-rose-400 text-black font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:bg-rose-500/20 disabled:text-zinc-600 cursor-pointer shadow-lg shadow-rose-500/10"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Changes...
                  </>
                ) : (
                  "Update & Save Name"
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
