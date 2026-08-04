"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, Sparkles, Eye, EyeOff, Phone } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

import { usePerformance } from '../hooks/usePerformance';
import { cleanDisplayEmail } from '../lib/utils';

const Auth = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const initialMode = searchParams?.get('mode') === 'signup' ? 'signup' : 'login';
  const { shouldReduceGfx } = usePerformance();
  
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  const [signupMethod, setSignupMethod] = useState<'email_phone' | 'phone_only'>('email_phone');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setCurrentSession(session);
    });
  }, []);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";
  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

  useEffect(() => {
    if (searchParams?.get('mode') === 'signup') {
      setMode('signup');
    } else {
      setMode('login');
    }
  }, [searchParams]);

  useEffect(() => {
    if (!isConfigured) {
      setError("Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.");
    } else if (!supabaseUrl.startsWith('http')) {
      setError("Supabase URL is invalid. It must start with 'https://'. Current value: " + supabaseUrl);
    }
  }, [isConfigured, supabaseUrl]);

  const testConnection = async () => {
    setTestResult("Testing...");
    try {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, {
        headers: { 'apikey': supabaseAnonKey }
      });
      if (res.ok) {
        setTestResult("Connection successful! Supabase is reachable.");
      } else {
        setTestResult(`Connection failed with status: ${res.status} ${res.statusText}`);
      }
    } catch (err: any) {
      setTestResult(`Connection error: ${err.message}`);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setError("Cannot authenticate: Supabase configuration is missing.");
      return;
    }
    if (!supabaseUrl.startsWith('http')) {
      setError("Cannot authenticate: Supabase URL is invalid.");
      return;
    }
    setLoading(true);
    setError(null);

    // Check IP rate limiting for login attempts
    if (mode === 'login') {
      try {
        const limitCheck = await fetch('/api/auth/login-attempt', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!limitCheck.ok) {
          const resData = await limitCheck.json();
          const errMsg = resData.error || 'Too many login attempts. Please try again later.';
          setError(errMsg);
          showToast(errMsg, 'error');
          setLoading(false);
          return;
        }
      } catch (checkErr) {
        console.error('Failed to verify login rate limit:', checkErr);
        // Fallback: proceed to attempt login if rate limit api is offline
      }
    }

    try {
      const slugifyName = (name: string): string => {
        return (name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/__+/g, '_')
          .replace(/^_+|_+$/g, '');
      };

      let finalEmail = email.trim();
      if (mode === 'login') {
        const isPhoneInput = !finalEmail.includes('@') && /^[0-9+\s\-()]+$/.test(finalEmail);
        const isEmailInput = finalEmail.includes('@');

        if (!isPhoneInput && !isEmailInput) {
          const nameLoginErr = 'Logging in using name is no longer supported. Please log in using your Phone Number or Email Address.';
          setError(nameLoginErr);
          showToast(nameLoginErr, 'error');
          setLoading(false);
          return;
        }

        let resolved = false;
        try {
          const res = await fetch('/api/auth/resolve-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ identifier: email.trim() })
          });
          const resData = await res.json();
          if (res.ok && resData.email) {
            finalEmail = resData.email;
            resolved = true;
          } else {
            if (resData?.error) {
              setError(resData.error);
              showToast(resData.error, 'error');
              setLoading(false);
              return;
            }
            console.warn("API resolution failed. Falling back to client-side database query.");
          }
        } catch (err: any) {
          console.error("Error calling resolve-email API. Falling back to client-side resolution:", err);
        }

        if (!resolved) {
          // Client-side fallback for phone/email
          if (isPhoneInput) {
            try {
              let matchedName = '';
              const { data: pData } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('email', finalEmail)
                .maybeSingle();
              if (pData?.full_name) {
                matchedName = pData.full_name;
              }

              if (!matchedName) {
                const { data: memberData } = await supabase
                  .from('member')
                  .select('full_name')
                  .eq('phone', finalEmail)
                  .maybeSingle();
                if (memberData?.full_name) {
                  matchedName = memberData.full_name;
                }
              }

              if (!matchedName) {
                const { data: ecData } = await supabase
                  .from('ec_member')
                  .select('full_name')
                  .eq('phone', finalEmail)
                  .maybeSingle();
                if (ecData?.full_name) {
                  matchedName = ecData.full_name;
                }
              }

              if (matchedName) {
                finalEmail = `${slugifyName(matchedName)}@josephitre.club`;
              } else {
                finalEmail = `${finalEmail}@josephitre.club`;
              }
            } catch (phoneErr) {
              console.error('Error resolving phone on client fallback:', phoneErr);
              finalEmail = `${finalEmail}@josephitre.club`;
            }
          } else if (isEmailInput) {
            if (!finalEmail.endsWith('@josephitre.club')) {
              try {
                let matchedFullName = '';

                // Try profiles table
                const { data: profiles, error: pErr } = await supabase
                  .from('profiles')
                  .select('id, full_name, email')
                  .eq('email', finalEmail.toLowerCase());

                if (!pErr && profiles && profiles.length > 0) {
                  if (profiles.length > 1) {
                    setError(`Multiple accounts are registered with this email (${profiles.map(p => p.full_name).join(', ')}). Please sign in using your Phone Number or primary email.`);
                    setLoading(false);
                    return;
                  } else {
                    matchedFullName = profiles[0].full_name;
                  }
                }

                // Try member table
                if (!matchedFullName) {
                  const { data: members, error: mErr } = await supabase
                    .from('member')
                    .select('full_name')
                    .or(`email.eq.${finalEmail.toLowerCase()},email_address.eq.${finalEmail.toLowerCase()}`);
                  if (!mErr && members && members.length > 0) {
                    matchedFullName = members[0].full_name;
                  }
                }

                // Try ec_member table
                if (!matchedFullName) {
                  const { data: ecMembers, error: eErr } = await supabase
                    .from('ec_member')
                    .select('full_name')
                    .or(`email.eq.${finalEmail.toLowerCase()},email_address.eq.${finalEmail.toLowerCase()}`);
                  if (!eErr && ecMembers && ecMembers.length > 0) {
                    matchedFullName = ecMembers[0].full_name;
                  }
                }

                if (matchedFullName) {
                  finalEmail = `${slugifyName(matchedFullName)}@josephitre.club`;
                }
              } catch (profileErr) {
                console.error('Error checking profiles for login on client fallback:', profileErr);
              }
            }
          }
        }
      }

      if (mode === 'signup') {
        if (/\s/.test(fullName)) {
          const spaceError = 'Please type in your name without spaces or just type in your surname';
          setError(spaceError);
          showToast(spaceError, 'error');
          setLoading(false);
          return;
        }

        const signupRes = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: signupMethod === 'phone_only' ? "" : email.trim(),
            password,
            fullName,
            phone
          })
        });
        
        const signupData = await signupRes.json();
        if (!signupRes.ok) {
          throw new Error(signupData.error || 'Registration failed.');
        }

        // Programmatically sign in immediately on successful signup using the generated name-based virtual email
        const virtualEmail = `${slugifyName(fullName)}@josephitre.club`;
        const { error: signInErr } = await supabase.auth.signInWithPassword({ email: virtualEmail, password });
        if (signInErr) {
          showToast('Registration successful! You can now sign in.', 'success');
          setMode('login');
        } else {
          showToast('Welcome to the Josephite Math Club! Registered successfully.', 'success');
          const redirect = searchParams?.get('redirect') || '/profile';
          router.push(redirect);
        }
      } else {
        let loginRes = await supabase.auth.signInWithPassword({ email: finalEmail, password });
        let loginErr = loginRes.error;

        if (loginErr) {
          const originalInput = email.trim();
          if (originalInput.toLowerCase() !== finalEmail.toLowerCase()) {
            console.log(`Resolved login failed for ${finalEmail}. Retrying with original input ${originalInput}...`);
            const retryRes = await supabase.auth.signInWithPassword({ email: originalInput, password });
            if (!retryRes.error) {
              loginErr = null;
            } else {
              loginErr = retryRes.error;
            }
          }
        }

        if (loginErr) throw loginErr;
        
        const redirect = searchParams?.get('redirect') || '/profile';
        router.push(redirect);
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch') {
        setError("Network error: Failed to connect to Supabase. This usually means your NEXT_PUBLIC_SUPABASE_URL is incorrect or your internet connection is down.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const maskString = (str: string) => {
    if (!str) return "EMPTY";
    if (str.length <= 8) return "****";
    return str.substring(0, 4) + "...." + str.substring(str.length - 4);
  };

  return (
    <div className="relative min-h-[100dvh] bg-transparent flex items-center justify-center p-4 pt-32 pb-24">
      {/* Background Glows */}
      <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-6-start)]/10 -top-48 -left-24" />
      <div className="atmospheric-glow w-[700px] h-[700px] bg-[var(--c-2-start)]/5 bottom-0 -right-24" />

      <motion.div 
        initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: shouldReduceGfx ? 0.1 : 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="p-12 md:p-16 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[var(--c-6-start)]/5 rounded-full blur-[120px] -mr-48 -mt-48" />
          
          <div className="relative z-10">
            <div className="text-center mb-16">
              <div className="flex items-center justify-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-[var(--c-6-start)]" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--c-6-start)]/80">AUTHENTICATION</span>
              </div>
              <h1 className="text-5xl md:text-6xl font-display font-bold leading-tight tracking-tighter mb-6">
                {mode === 'login' ? (
                  <>WELCOME <span className="blue-text">BACK</span></>
                ) : (
                  <>JOIN THE <span className="blue-text">CLUB</span></>
                )}
              </h1>
              <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.2em]">
                {mode === 'login' ? 'Enter your credentials to continue' : 'Create an account to get started'}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-8">
              {mode === 'signup' && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">Registration Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setSignupMethod('email_phone')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        signupMethod === 'email_phone'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Mail className={`w-4 h-4 ${signupMethod === 'email_phone' ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span className="font-display font-extrabold text-[11px] uppercase tracking-wider">Email & Phone</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 lowercase tracking-normal">Requires both email address and phone number.</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSignupMethod('phone_only')}
                      className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 ${
                        signupMethod === 'phone_only'
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                          : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Phone className={`w-4 h-4 ${signupMethod === 'phone_only' ? 'text-amber-400' : 'text-zinc-500'}`} />
                        <span className="font-display font-extrabold text-[11px] uppercase tracking-wider">Phone Only</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 lowercase tracking-normal">Only phone number and given name are required.</p>
                    </button>
                  </div>
                </div>
              )}
              <AnimatePresence mode="wait">
                {mode === 'signup' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4"
                  >
                    <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">Given Name Only</label>
                    <div className="relative group">
                      <User className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Given Name Only (e.g., John)"
                        autoComplete="off"
                        className={`w-full pl-16 pr-8 py-5 bg-white/5 border ${/\s/.test(fullName) ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/10'} rounded-full focus:outline-none focus:ring-4 transition-all text-white placeholder:text-zinc-600 font-medium text-sm`}
                      />
                    </div>
                    {/\s/.test(fullName) && (
                      <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-4 mt-1">
                        Please type in your name without spaces or just type in your surname
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {(mode === 'login' || signupMethod === 'email_phone') && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">
                    {mode === 'login' ? 'Email Address or Phone Number' : 'Email Address'}
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors" />
                    <input 
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={mode === 'login' ? "017XXXXXXXX or name@example.com" : "name@example.com"}
                      autoCapitalize="none"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck="false"
                      className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-white placeholder:text-zinc-600 font-medium text-sm"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600 ml-4">Phone Number</label>
                  <div className="relative group">
                    <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                    <input 
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g., 01712345678"
                      autoComplete="off"
                      className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-white placeholder:text-zinc-600 font-medium text-sm"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between ml-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-600">Password</label>
                  {mode === 'login' && (
                    <Link href="/forgot-password" title="Forgot Password" className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--c-6-start)] hover:text-[var(--c-6-start)]/80 transition-colors">
                      FORGOT?
                    </Link>
                  )}
                </div>
                <div className="relative group">
                  <Lock className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600 group-focus-within:text-[var(--c-6-start)] transition-colors pointer-events-none" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoCapitalize="none"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck="false"
                    className="w-full pl-16 pr-14 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-600 font-medium text-sm"
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

              {error && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex flex-col gap-2 text-red-500 text-xs font-bold uppercase tracking-widest"
                >
                  <div className="flex items-center gap-4">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-col items-center gap-4">
                <button 
                  type="button"
                  onClick={() => setShowDebug(!showDebug)}
                  className="text-[8px] text-zinc-600 hover:text-zinc-400 uppercase tracking-widest"
                >
                  {showDebug ? "Hide Debug Info" : "Show Debug Info"}
                </button>
                
                {showDebug && (
                  <div className="w-full p-4 bg-black/40 rounded-2xl font-mono text-[8px] space-y-1 lowercase tracking-normal text-left">
                    <div>URL: {supabaseUrl || "MISSING"}</div>
                    <div>KEY: {maskString(supabaseAnonKey)}</div>
                    <div>CONFIGURED: {isConfigured ? "YES" : "NO"}</div>
                    <div className="pt-2 flex flex-col gap-1">
                      <div className="text-zinc-500">Logged In: {currentSession ? cleanDisplayEmail(currentSession.user.email) : "NO"}</div>
                      {currentSession && (
                        <div className="text-zinc-500">Verified: {currentSession.user.email_confirmed_at ? "YES" : "NO"}</div>
                      )}
                      <button 
                        type="button"
                        onClick={testConnection}
                        className="text-amber-500 hover:text-amber-400 underline self-start"
                      >
                        TEST CONNECTION
                      </button>
                      {testResult && <div className="text-zinc-400 italic">{testResult}</div>}
                    </div>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-6 btn-metallic-blue flex items-center justify-center gap-4 group"
              >
                {loading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform duration-500" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-16 text-center">
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 hover:text-[var(--c-6-start)] transition-colors"
              >
                {mode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <span className="text-[var(--c-6-start)] underline underline-offset-8 decoration-2">
                  {mode === 'login' ? 'Sign Up' : 'Log In'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
