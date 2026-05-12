"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { OptimizedImage } from '../components/OptimizedImage';
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
  LayoutDashboard,
  Trophy,
  Medal,
  Star as StarIcon,
  Briefcase,
  QrCode,
  X,
  Upload
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';

const QRCode = dynamic(() => import('../components/QRCode'), { ssr: false });
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ScrollReveal from '../components/ScrollReveal';
import confetti from 'canvas-confetti';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl } from '../lib/utils';

const Profile = () => {
  const { user, profile, loading: authLoading, isAdmin, signOut, refreshProfile } = useAuth();
  const { content } = useContent();
  const { showToast } = useToast();
  const router = useRouter();
  const { shouldReduceGfx } = usePerformance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [verified, setVerified] = useState('no');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [checkingMember, setCheckingMember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const celebratedRef = React.useRef(false);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be less than 2MB', 'error');
      return;
    }

    setUploadingAvatar(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Try 'images' bucket first (common in many setups)
      let uploadError = null;
      try {
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, file, { upsert: true });
        
        if (error) uploadError = error;
      } catch (e: any) {
        uploadError = e;
      }

      // If 'images' failed, try 'avatars' bucket
      let finalPath = `/images/${filePath}`;
      if (uploadError) {
        try {
          const { error: avatarError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });
          
          if (!avatarError) {
            finalPath = `/avatars/${fileName}`;
            uploadError = null;
          }
        } catch (e: any) {
          // Keep original error if this also fails
        }
      }

      if (uploadError) throw uploadError;

      // Update profile with the new avatar URL
      const avatarUrl = finalPath;
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      // Also update member table if they are a member
      if (isMember) {
        await supabase
          .from('member')
          .update({ photo_url: avatarUrl })
          .eq('id', user.id);
      }
      showToast('Profile picture updated successfully!', 'success');
    } catch (err: any) {
      console.error('Error uploading avatar:', err);
      showToast(err.message || 'Failed to upload profile picture', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const triggerCelebration = React.useCallback((topPosition: number) => {
    if (shouldReduceGfx) return;
    
    const duration = 5 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    // Thematic colors based on position
    const colors = topPosition === 1 ? ['#fbbf24', '#f59e0b', '#ffffff'] : // Gold
                   topPosition === 2 ? ['#94a3b8', '#cbd5e1', '#ffffff'] : // Silver
                   ['#b45309', '#d97706', '#ffffff']; // Bronze

    // Initial burst
    confetti({ 
      ...defaults, 
      particleCount: 150, 
      spread: 70, 
      origin: { y: 0.6 },
      colors 
    });

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 40 * (timeLeft / duration);
      // Realistic side bursts
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }, colors });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }, colors });
    }, 450);
  }, [shouldReduceGfx]);

  const fetchAchievements = React.useCallback(async (mId: string) => {
    if (!mId || !isSupabaseConfigured) return;
    setLoadingAchievements(true);
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select('*')
        .eq('member_id', mId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setAchievements(data || []);
      
      // Trigger celebration if there are wins and we haven't celebrated this mount
      const wins = (data || []).filter((a: any) => a.position !== null);
      if (wins.length > 0 && !celebratedRef.current) {
        celebratedRef.current = true;
        const topPosition = Math.min(...wins.map((w: any) => w.position));
        // Add slight delay so content is visible
        setTimeout(() => triggerCelebration(topPosition), 800);
      }
    } catch (err) {
      console.error("Error fetching achievements:", err);
    } finally {
      setLoadingAchievements(false);
    }
  }, [triggerCelebration]);

  const checkMemberStatus = React.useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('member')
        .select('id, verified, member_id')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setIsMember(true);
        setVerified(data.verified || 'no');
        const mId = data.member_id || null;
        setMemberId(mId);
        if (mId) fetchAchievements(mId);
      }
    } catch (err) {
      console.error('Error checking member status:', err);
    } finally {
      setCheckingMember(false);
    }
  }, [user, fetchAchievements]);

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

  const wins = achievements.filter(a => a.position !== null).sort((a, b) => a.position - b.position);
  const pending = achievements.filter(a => a.position === null);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <Loader2 className="w-10 h-10 text-[var(--c-6-start)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24">
      {/* QR ID Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm glass-card p-1 border-[var(--c-6-start)]/30 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-[var(--c-6-start)]/20 to-transparent p-8 text-center space-y-6">
                <button 
                  onClick={() => setShowQrModal(false)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4 text-zinc-400" />
                </button>

                <div className="mx-auto w-48 h-48 p-4 bg-white rounded-3xl shadow-[0_0_50px_rgba(0,180,219,0.3)]">
                  <QRCode 
                    value={JSON.stringify({
                      name: profile?.full_name || fullName,
                      id: memberId,
                      email: user.email,
                      v: '1.0'
                    })}
                    size={160}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div className="space-y-1">
                  <h4 className="text-xl font-bold text-white uppercase tracking-tight">{profile?.full_name || fullName}</h4>
                  <p className="text-zinc-500 text-xs font-mono tracking-widest">{memberId || 'TEMPORARY ID'}</p>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-[var(--c-6-start)]/20 border border-[var(--c-6-start)]/30">
                    <CheckCircle2 className="w-4 h-4 text-[var(--c-6-start)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Verified Josephite</span>
                  </div>
                </div>

                <p className="text-[10px] text-zinc-600 font-medium italic">Scan for digital verification</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                        <OptimizedImage 
                          src={resolveImageUrl(profile.avatar_url)} 
                          alt={profile.full_name || "User Avatar"} 
                          fill
                          sizes="(max-width: 768px) 256px, 256px"
                          className="object-cover" 
                          referrerPolicy="no-referrer" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-600">
                          <User className="w-16 h-16" />
                        </div>
                      )}
                      
                      {uploadingAvatar && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-10">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      )}
                    </div>
                    
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/png, image/jpeg, image/webp" 
                      onChange={handleFileChange} 
                    />

                    <button 
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className={`absolute bottom-0 right-0 p-4 sm:p-3 rounded-full bg-[var(--c-6-start)] text-white shadow-xl ${!shouldReduceGfx && !uploadingAvatar && 'hover:scale-110 transition-transform'} disabled:opacity-50 z-20`}
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Camera className="w-5 h-5 sm:w-4 sm:h-4" />}
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
                        onClick={() => setShowQrModal(true)}
                        className="w-full py-4 rounded-2xl bg-[var(--c-6-start)]/10 border border-[var(--c-6-start)]/20 text-[var(--c-6-start)] font-bold hover:bg-[var(--c-6-start)]/20 transition-all flex items-center justify-center gap-2 group/id"
                      >
                        <QrCode className="w-4 h-4 group-hover/id:rotate-12 transition-transform" />
                        Show ID
                      </button>
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
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Member ID</p>
                            <p className="text-white font-mono font-bold tracking-wider">
                              {memberId || 'PENDING'}
                            </p>
                          </div>
                   
                          {achievements.length > 0 && (
                            <div className="md:col-span-2 space-y-8">
                              {/* Major Achievements (Wins) */}
                              {wins.length > 0 && (
                                <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-6">
                                  <div className="flex items-center gap-4">
                                    <Trophy className="w-6 h-6 text-amber-500" />
                                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Major Achievements</h3>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {wins.map((ach) => (
                                      <motion.div 
                                        key={ach.id}
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                      >
                                        <div className={`p-3 rounded-xl ${
                                          ach.position === 1 ? 'bg-amber-500/10 text-amber-500' :
                                          ach.position === 2 ? 'bg-zinc-400/10 text-zinc-400' :
                                          'bg-amber-800/10 text-amber-800'
                                        }`}>
                                          {ach.position === 1 ? <Trophy className="w-5 h-5" /> : 
                                          ach.position === 2 ? <Medal className="w-5 h-5" /> : 
                                          <StarIcon className="w-5 h-5" />}
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            {ach.position === 1 ? 'First' : ach.position === 2 ? 'Second' : 'Third'} Position
                                          </p>
                                          <p className="text-sm font-bold text-white">{ach.event_name}</p>
                                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{ach.category}</p>
                                        </div>

                                        {ach.position === 1 && (
                                          <motion.div 
                                            animate={{ 
                                              scale: [1, 1.2, 1],
                                              rotate: [0, 5, -5, 0],
                                              opacity: [0.5, 1, 0.5]
                                            }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="absolute -right-4 -bottom-4 text-amber-500/20"
                                          >
                                            <Trophy className="w-24 h-24" />
                                          </motion.div>
                                        )}
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Pending Participations */}
                              {pending.length > 0 && (
                                <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                                  <div className="flex items-center gap-4">
                                    <Briefcase className="w-6 h-6 text-indigo-400" />
                                    <h3 className="text-xl font-bold text-white uppercase tracking-wider">Active Participations</h3>
                                  </div>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {pending.map((ach) => (
                                      <motion.div 
                                        key={ach.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-5 rounded-2xl bg-white/5 border border-white/5 flex items-center gap-4 relative"
                                      >
                                        <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400">
                                          <Loader2 className="w-5 h-5 animate-spin-slow" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">Result Pending</p>
                                          <p className="text-sm font-bold text-white">{ach.event_name}</p>
                                          <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{ach.category}</p>
                                        </div>
                                      </motion.div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
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
