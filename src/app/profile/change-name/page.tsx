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
        // Default the given name to the first word of their full name if they have spaces
        const firstWord = (profile.full_name || '').trim().split(/\s+/)[0] || '';
        setGivenName(firstWord);
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
      setError("Please enter a valid given name.");
      return;
    }

    // Validation: Check if it contains spaces (i.e. is multi-word)
    if (trimmedName.split(/\s+/).length > 1) {
      setError("Given Name must be a single-word name only (no spaces allowed).");
      return;
    }

    setLoading(true);

    try {
      // 1. Update the profiles table
      const { error: profileErr } = await supabase
        .from('profiles')
        .update({
          full_name: trimmedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileErr) throw profileErr;

      // 2. Update member tables if applicable
      if (isMember) {
        const { error: memberErr } = await supabase
          .from('member')
          .update({
            full_name: trimmedName,
          })
          .eq('id', user?.id);

        if (memberErr) throw memberErr;

        if (isEc) {
          const { error: ecErr } = await supabase
            .from('ec_member')
            .update({
              full_name: trimmedName,
            })
            .eq('id', user?.id);

          if (ecErr) throw ecErr;
        }
      }

      await refreshProfile();
      setSuccess(true);
      showToast("Name updated to given name successfully!", "success");
      
      // Delay redirect slightly so user sees the success state
      setTimeout(() => {
        router.push('/profile');
      }, 2000);

    } catch (err: any) {
      console.error("Name correction error:", err);
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
                <Sparkles className="w-3 h-3 animate-pulse" /> Official database cleanup
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight leading-none">
                Given Name Correction
              </h1>
              <p className="text-xs text-zinc-400 mt-2 font-medium leading-relaxed">
                We are standardizing JMC's olympiad registration rosters. Please update your registered profile name to your <strong>given name</strong> (single word) only.
              </p>
            </div>

            {/* Clear Visual Guidelines with Requested Example */}
            <div className="bg-amber-500/5 border border-amber-500/15 p-5 rounded-2xl space-y-3">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4" /> Name Standards Rulebook
              </h4>
              <p className="text-[11px] leading-relaxed text-zinc-400 font-medium">
                Your registered name must be your single-word given name. Multi-word full names must be simplified.
              </p>
              
              {/* Literal example box as specified */}
              <div className="bg-black/40 border border-white/5 p-3 rounded-xl space-y-1.5 font-mono text-[10px]">
                <p className="text-zinc-500 font-bold uppercase tracking-widest">Standard Example:</p>
                <div className="text-zinc-300">
                  <p>• Full Name Registered: <span className="text-rose-400 font-extrabold line-through">Samin Tausif</span></p>
                  <p>• Given Name Allowed: <span className="text-emerald-400 font-extrabold">Samin</span></p>
                </div>
              </div>
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
                  Corrected Given Name
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    required
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value.replace(/\s+/g, ''))} // Strips spaces automatically
                    placeholder="e.g. Samin"
                    className="w-full pl-12 pr-4 py-3.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-700 outline-none focus:border-rose-500/50 transition-all font-bold tracking-wide"
                  />
                </div>
                <p className="text-[9.5px] text-zinc-500 font-medium leading-normal">
                  * Note: Spaces and special symbols are blocked to enforce a single-word given name.
                </p>
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
