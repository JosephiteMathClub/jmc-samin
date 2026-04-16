"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  User, 
  Mail, 
  Shield, 
  LogOut, 
  Settings, 
  Edit3, 
  Camera,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import ScrollReveal from '../components/ScrollReveal';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl } from '../lib/utils';

const Profile = () => {
  const { user, profile, loading: authLoading, isAdmin, signOut, refreshProfile } = useAuth();
  const { content } = useContent();
  const router = useRouter();
  const { shouldReduceGfx } = usePerformance();
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [verified, setVerified] = useState('no');
  const [checkingMember, setCheckingMember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkMemberStatus = React.useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('member')
        .select('id, verified')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setIsMember(true);
        setVerified(data.verified || 'no');
      }
    } catch (err) {
      console.error('Error checking member status:', err);
    } finally {
      setCheckingMember(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
    if (profile) {
      setFullName(profile.full_name || '');
      checkMemberStatus();
    }

    // Refresh profile when window gains focus (e.g. after returning from registration tab)
    const handleFocus = () => {
      refreshProfile();
      checkMemberStatus();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, authLoading, router, profile, checkMemberStatus, refreshProfile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <Loader2 className="w-10 h-10 text-[var(--c-6-start)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar */}
            <div className="lg:col-span-4 space-y-8">
              <ScrollReveal direction="left">
                <div className="p-8 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl relative overflow-hidden text-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--c-6-start)]/5 rounded-full blur-3xl -mr-16 -mt-16" />
                  
                  <div className="relative mb-8 inline-block group">
                    <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/10 group-hover:border-[var(--c-6-start)]/50 transition-all relative">
                      {profile?.avatar_url ? (
                        <Image 
                          src={resolveImageUrl(profile.avatar_url)} 
                          alt={profile.full_name || "User Avatar"} 
                          fill
                          className="object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                          <User className="w-16 h-16" />
                        </div>
                      )}
                    </div>
                    <button className={`absolute bottom-0 right-0 p-3 rounded-full bg-[var(--c-6-start)] text-white shadow-xl ${!shouldReduceGfx && 'hover:scale-110 transition-transform'}`}>
                      <Camera className="w-4 h-4" />
                    </button>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">{fullName || profile?.full_name || 'Josephite'}</h2>
                  <p className="text-sm text-zinc-500 font-medium mb-6">{user.email}</p>
                  
                  {isAdmin && (
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--c-6-start)]/10 border border-[var(--c-6-start)]/20 text-[var(--c-6-start)] text-xs font-bold uppercase tracking-widest mb-8">
                      <Shield className="w-3 h-3" />
                      Administrator
                    </div>
                  )}

                  <div className="space-y-3">
                    {isAdmin && (
                      <button 
                        onClick={() => router.push('/admin')}
                        className="w-full py-4 btn-metallic-blue flex items-center justify-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4" />
                        Admin Dashboard
                      </button>
                    )}
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Edit Profile
                    </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-8 space-y-8">
              <ScrollReveal direction="right" delay={0.2}>
                <div className="p-8 md:p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.form
                        key="edit"
                        initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 10 }}
                        animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: -10 }}
                        onSubmit={handleUpdateProfile}
                        className="space-y-6"
                      >
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
                          <button 
                            type="button"
                            onClick={() => setIsEditing(false)}
                            className="text-sm font-bold text-zinc-500 hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                          <input 
                            type="text"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all text-white"
                          />
                        </div>

                        {error && (
                          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-red-500 text-sm font-medium">
                            <AlertCircle className="w-5 h-5" />
                            {error}
                          </div>
                        )}

                        <button 
                          type="submit"
                          disabled={loading}
                          className="w-full py-5 btn-metallic-blue flex items-center justify-center gap-2"
                        >
                          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Save Changes'}
                        </button>
                      </motion.form>
                    ) : (
                      <motion.div
                        key="view"
                        initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 10 }}
                        animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: -10 }}
                        className="space-y-12"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address</p>
                            <p className="text-white font-medium">{user.email}</p>
                          </div>
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Member Status</p>
                            <p className={isMember ? "text-[var(--c-6-start)] font-bold" : "text-zinc-500 font-medium"}>
                              {isMember ? "Verified Member" : "Not Registered"}
                            </p>
                          </div>
                          {isMember && (
                            <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Payment Status</p>
                              <p className={`font-bold ${verified === 'yes' ? 'text-green-500' : 'text-[var(--c-6-start)]'}`}>
                                {verified === 'yes' ? 'Paid' : 'Verifying'}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Registration Link */}
                {!isMember && !checkingMember && content?.registration?.registrationOpen !== false && (
                  <div className="p-8 md:p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl mt-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--c-6-start)]/5 rounded-full blur-[80px] -mr-32 -mt-32 group-hover:bg-[var(--c-6-start)]/10 transition-colors duration-700" />
                    
                    <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-3xl bg-[var(--c-6-start)]/10 flex items-center justify-center text-[var(--c-6-start)] border border-[var(--c-6-start)]/20">
                          <Edit3 className="w-8 h-8" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-white mb-2">Join Intra-Events</h3>
                          <p className="text-sm text-zinc-500 font-medium max-w-md">Complete your registration to participate in exclusive club activities and competitions.</p>
                        </div>
                      </div>
                      
                      <a 
                        href="/register-member" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="px-8 py-5 btn-metallic-blue flex items-center gap-3 group/btn whitespace-nowrap"
                      >
                        Register Now
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </a>
                    </div>
                  </div>
                )}

                {isMember && (
                  <div className="p-8 md:p-12 rounded-[40px] bg-[var(--c-6-start)]/5 border border-[var(--c-6-start)]/10 backdrop-blur-xl mt-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-full bg-[var(--c-6-start)] flex items-center justify-center text-white">
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">Verified Member</h3>
                        <p className="text-sm text-zinc-500 font-medium">You are successfully registered for club activities and intra-events.</p>
                      </div>
                    </div>
                  </div>
                )}
              </ScrollReveal>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
