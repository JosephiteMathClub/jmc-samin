"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Phone, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  User,
  Smartphone,
  ShieldCheck,
  Save,
  LogIn
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function UpdatePhonePage() {
  const { user, refreshProfile } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();

  const [currentPhone, setCurrentPhone] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [givenName, setGivenName] = useState<string>('');
  const [memberClass, setMemberClass] = useState<string>('');
  const [memberSection, setMemberSection] = useState<string>('');
  const [memberRoll, setMemberRoll] = useState<string>('');

  const [updating, setUpdating] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load user data and current registered phone number
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      if (!user) {
        const timer = setTimeout(() => {
          if (isMounted && !user) {
            setCheckingAuth(false);
          }
        }, 1200);
        return () => clearTimeout(timer);
      }

      try {
        setCheckingAuth(true);

        // Fetch profile
        const { data: profData } = await supabase
          .from('profiles')
          .select('phone, full_name')
          .eq('id', user.id)
          .maybeSingle();

        // Fetch member
        const { data: memData } = await supabase
          .from('member')
          .select('phone, full_name, class, section, roll')
          .eq('id', user.id)
          .maybeSingle();

        // Fetch ec_member
        const { data: ecData } = await supabase
          .from('ec_member')
          .select('phone, full_name, class, section, roll')
          .eq('id', user.id)
          .maybeSingle();

        const detectedPhone = 
          ecData?.phone || 
          memData?.phone || 
          profData?.phone || 
          user?.user_metadata?.phone || 
          '';

        const detectedName = 
          ecData?.full_name || 
          memData?.full_name || 
          profData?.full_name || 
          user?.user_metadata?.full_name || 
          '';

        const detectedClass = ecData?.class || memData?.class || '';
        const detectedSection = ecData?.section || memData?.section || '';
        const detectedRoll = ecData?.roll || memData?.roll || '';

        if (isMounted) {
          setCurrentPhone(detectedPhone);
          setPhoneInput(detectedPhone);
          setGivenName(detectedName);
          setMemberClass(detectedClass);
          setMemberSection(detectedSection);
          setMemberRoll(detectedRoll);
          setCheckingAuth(false);
        }
      } catch (err) {
        console.error("Error loading user details:", err);
        if (isMounted) setCheckingAuth(false);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const cleanPhone = phoneInput.trim();
    const cleanName = givenName.trim();

    if (!cleanPhone) {
      setError("Please enter your mobile phone number.");
      return;
    }

    setUpdating(true);

    try {
      const res = await fetch('/api/auth/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          newFullName: cleanName || undefined,
          memberClass: memberClass || undefined,
          memberSection: memberSection || undefined,
          memberRoll: memberRoll || undefined
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update phone number.');
      }

      await refreshProfile();
      setCurrentPhone(cleanPhone);
      setSuccess(true);
      showToast("Phone number updated successfully!", "success");

      setTimeout(() => {
        router.push('/profile');
      }, 2000);
    } catch (err: any) {
      console.error("Error updating phone number:", err);
      setError(err.message || "Failed to update phone number. Please try again.");
    } finally {
      setUpdating(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
        <p className="text-xs font-mono tracking-widest text-zinc-500 uppercase">Verifying Authentication Status...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] pt-32 pb-24 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-xl">
        {/* Navigation back button */}
        <Link
          href="/profile"
          className="group inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white mb-8 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-1" />
          Back to Profile
        </Link>

        {/* Not Logged In State */}
        {!user ? (
          <div className="relative bg-[#09090b] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden text-center space-y-6">
            <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-center justify-center mx-auto text-amber-400">
              <LogIn className="w-8 h-8" />
            </div>
            
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Authentication Required
              </span>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Sign In to Update Phone Number
              </h1>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                You must be logged into your Josephite Math Club account to update your registered phone number.
              </p>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login?redirect=/update-phone"
                className="px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <LogIn className="w-4 h-4" />
                Sign In Now
              </Link>
              <Link
                href="/events"
                className="px-6 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2"
              >
                Explore Events
              </Link>
            </div>
          </div>
        ) : (
          /* Main Phone Update Page Container */
          <div className="relative bg-[#09090b] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-2xl overflow-hidden">
            {/* Top gradient accent */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500" />
            
            <div className="space-y-6">
              {/* Header Title */}
              <div className="text-center md:text-left">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" /> Account Settings
                </span>
                <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                  Update Phone Number
                </h1>
                <p className="text-xs md:text-sm text-zinc-400 mt-2 font-medium leading-relaxed">
                  Update your mobile phone number associated with your account for event registrations and login access.
                </p>
              </div>

              {/* Current Status Box */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between flex-wrap gap-2 text-xs">
                <span className="text-zinc-500 uppercase tracking-widest text-[10px] font-mono">Current Registered Phone</span>
                <span className="font-mono font-bold text-white text-sm">
                  {currentPhone ? (
                    <span className="text-amber-400 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5" /> {currentPhone}
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" /> Not set yet
                    </span>
                  )}
                </span>
              </div>

              {/* Input Phone & Details Form */}
              <form onSubmit={handleUpdate} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" /> Mobile Phone Number
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      type="tel"
                      required
                      value={phoneInput}
                      onChange={(e) => setPhoneInput(e.target.value)}
                      placeholder="e.g. 01712345678"
                      className="w-full pl-12 pr-4 py-4 bg-neutral-900 border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 rounded-2xl text-base text-white font-mono placeholder-zinc-600 outline-none transition-all font-bold tracking-wide"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5">
                    <User className="w-4 h-4 text-zinc-500" /> Full Display Name
                  </label>
                  <input
                    type="text"
                    value={givenName}
                    onChange={(e) => setGivenName(e.target.value)}
                    placeholder="e.g. Samin Tausif"
                    className="w-full px-4 py-3.5 bg-neutral-900 border border-white/10 rounded-xl text-sm text-white placeholder-zinc-700 outline-none focus:border-white/30 transition-all font-semibold"
                  />
                </div>

                {/* Optional Class / Sec / Roll */}
                <div className="grid grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Class</label>
                    <input
                      type="text"
                      value={memberClass}
                      onChange={(e) => setMemberClass(e.target.value)}
                      placeholder="e.g. 11"
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white text-center font-mono outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Section</label>
                    <input
                      type="text"
                      value={memberSection}
                      onChange={(e) => setMemberSection(e.target.value)}
                      placeholder="e.g. A"
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white text-center font-mono outline-none focus:border-white/30"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Roll</label>
                    <input
                      type="text"
                      value={memberRoll}
                      onChange={(e) => setMemberRoll(e.target.value)}
                      placeholder="e.g. 42"
                      className="w-full px-3 py-2.5 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white text-center font-mono outline-none focus:border-white/30"
                    />
                  </div>
                </div>

                {/* Status messages */}
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
                      <span>Phone number updated successfully! Redirecting...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={updating || success}
                  className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2 disabled:bg-amber-500/20 disabled:text-zinc-600 cursor-pointer shadow-xl shadow-amber-500/20 mt-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Phone Number...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Phone Number
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
