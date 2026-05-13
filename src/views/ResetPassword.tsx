"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, Loader2, AlertCircle, Sparkles, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePerformance } from '../hooks/usePerformance';

const ResetPassword = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { shouldReduceGfx } = usePerformance();
  
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check if we have a session (Supabase handles the reset token automatically)
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError("Invalid or expired reset link. Please request a new one.");
      }
    };
    checkSession();
  }, []);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });
      
      if (error) throw error;

      setSuccess(true);
      showToast('Password updated successfully!', 'success');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-transparent overflow-hidden flex items-center justify-center p-4 pt-32 pb-24">
      {/* Background Glows */}
      <div className="atmospheric-glow w-[600px] h-[600px] bg-amber-500/10 -top-48 -left-24" />
      <div className="atmospheric-glow w-[700px] h-[700px] bg-indigo-500/5 bottom-0 -right-24" />

      <motion.div 
        initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceGfx ? 0.1 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="p-12 md:p-16 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-amber-500/80">SECURITY</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight tracking-tighter mb-6">
                RESET <span className="gold-text">PASSWORD</span>
              </h1>
              <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.2em]">
                {success ? 'Success! Redirecting to login...' : 'Enter your new password below'}
              </p>
            </div>

            {!success ? (
              <form onSubmit={handleResetPassword} className="space-y-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                    <input 
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="w-full pl-16 pr-14 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">Confirm New Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="********"
                      className="w-full pl-16 pr-14 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-white placeholder:text-zinc-800 font-medium text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-xs font-bold uppercase tracking-widest"
                  >
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </motion.div>
                )}

                  <button 
                    type="submit"
                    disabled={loading}
                    className="w-full py-6 btn-metallic-blue flex items-center justify-center gap-4 group"
                  >
                  {loading ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      Reset Password
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
                <p className="text-zinc-400 font-medium">
                  Your password has been successfully reset. You will be redirected to the login page in a few seconds.
                </p>
                <Link 
                  href="/login"
                  className="inline-block text-[10px] font-bold uppercase tracking-[0.2em] text-amber-500 hover:text-amber-400 transition-colors underline underline-offset-8 decoration-2"
                >
                  Go to Login Now
                </Link>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
