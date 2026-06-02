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
  Upload,
  Printer,
  Download
} from 'lucide-react';
import { toPng } from 'html-to-image';
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
  const [isEc, setIsEc] = useState(false);
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
  const [memberClass, setMemberClass] = useState('');
  const [memberSection, setMemberSection] = useState('');
  const [memberRoll, setMemberRoll] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const celebratedRef = React.useRef(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [downloadingCard, setDownloadingCard] = useState(false);

  const downloadIdCardPng = async () => {
    if (!cardRef.current || downloadingCard) return;
    setDownloadingCard(true);
    try {
      // Make sure the capture element exists and is fully rendered
      await new Promise((res) => setTimeout(res, 200));
      
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        width: 638,
        height: 1012,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '638px',
          height: '1012px',
        }
      });
      
      const link = document.createElement('a');
      const sanitizedName = (profile?.full_name || fullName || 'Member').trim().replace(/\s+/g, '_');
      link.download = `JMC_ID_Card_${sanitizedName}.png`;
      link.href = dataUrl;
      link.click();
      showToast('ID Card downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error generating card image:', err);
      showToast('Failed to download ID card, please try again.', 'error');
    } finally {
      setDownloadingCard(false);
    }
  };

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

      // Try 'avatars' bucket first as it's more specific
      let uploadStatus = { bucket: 'avatars', path: fileName };
      let uploadError = null;
      
      try {
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, file, { upsert: true });
        
        if (error) {
          // Fallback to 'images' bucket
          const { error: imagesError } = await supabase.storage
            .from('images')
            .upload(filePath, file, { upsert: true });
          
          if (imagesError) throw imagesError;
          uploadStatus = { bucket: 'images', path: filePath };
        }
      } catch (e: any) {
        uploadError = e;
      }

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl: avatarUrl } } = supabase.storage
        .from(uploadStatus.bucket)
        .getPublicUrl(uploadStatus.path);

      // Update profile with the new avatar URL
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

  const isActualWin = (positionVal: any): boolean => {
    if (positionVal === null || positionVal === undefined) return false;
    const pos = String(positionVal).trim().toLowerCase();
    if (pos === '' || pos === 'none' || pos === 'null' || pos.includes('participation') || pos.includes('participant')) {
      return false;
    }
    return true;
  };

  const getRankInfo = (rank: any) => {
    const rLower = String(rank || '').toLowerCase();
    if (rLower.includes('champion') || rLower.includes('1st') || rLower === '1') {
      return { priority: 1, label: rank, colorClass: 'bg-amber-500/10 text-amber-500', isFirst: true };
    }
    if (rLower.includes('runner') || rLower.includes('2nd') || rLower === '2' || rLower.includes('second')) {
      return { priority: 2, label: rank, colorClass: 'bg-zinc-400/10 text-zinc-400', isFirst: false };
    }
    if (rLower.includes('3rd') || rLower === '3' || rLower.includes('third')) {
      return { priority: 3, label: rank, colorClass: 'bg-amber-800/10 text-amber-800', isFirst: false };
    }
    return { priority: 4, label: rank, colorClass: 'bg-indigo-500/10 text-indigo-400', isFirst: false };
  };

  const triggerCelebration = React.useCallback((rank: any) => {
    if (shouldReduceGfx) return;
    
    // Normalize rank to numeric priority for colors
    const rankLower = String(rank || '').toLowerCase();
    let rankPriority = 4;
    if (rankLower.includes('champion') || rankLower.includes('1st') || rankLower === '1') rankPriority = 1;
    else if (rankLower.includes('runner') || rankLower.includes('2nd') || rankLower === '2') rankPriority = 2;
    else if (rankLower.includes('3rd') || rankLower === '3') rankPriority = 3;

    const duration = 6 * 1000;
    const animationEnd = Date.now() + duration;
    
    // Thematic colors based on rank priority
    const colors = rankPriority === 1 ? ['#fbbf24', '#f59e0b', '#fef08a', '#ffffff'] : // Gold theme
                   rankPriority === 2 ? ['#94a3b8', '#cbd5e1', '#e2e8f0', '#ffffff'] : // Silver theme
                   rankPriority === 3 ? ['#b45309', '#d97706', '#fed7aa', '#ffffff'] : // Bronze theme
                   ['#0c4a6e', '#0369a1', '#38bdf8', '#ffffff']; // Club Blue fallback

    const leftCannon = () => {
      confetti({
        particleCount: 140,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.8 },
        colors,
        startVelocity: 45,
        zIndex: 9999
      });
    };

    const rightCannon = () => {
      confetti({
        particleCount: 140,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.8 },
        colors,
        startVelocity: 45,
        zIndex: 9999
      });
    };

    // Fire initial grand lasers/cannons from bottom corners
    leftCannon();
    rightCannon();
    
    // Middle burst for maximum density and coverage
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 120,
        origin: { x: 0.5, y: 0.4 },
        colors,
        startVelocity: 35,
        zIndex: 9999
      });
    }, 150);

    // Continuous fireworks and cannons sequence over 6 seconds
    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const progress = timeLeft / duration;
      
      // Keep firing side cannons at random matching intervals
      if (Math.random() > 0.6) {
        leftCannon();
      }
      if (Math.random() > 0.6) {
        rightCannon();
      }

      // Small secondary bursts over the screen area
      confetti({
        particleCount: Math.floor(35 * progress),
        spread: 100,
        startVelocity: 30,
        origin: { x: Math.random(), y: Math.random() - 0.2 },
        colors,
        zIndex: 9999
      });
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
      
      // Trigger celebration if there are actual wins and we haven't celebrated this mount
      const wins = (data || []).filter((a: any) => isActualWin(a.position));
      if (wins.length > 0 && !celebratedRef.current) {
        celebratedRef.current = true;
        
        // Sort wins to find the best position (lowest number/rank priority)
        const sortedWins = [...wins].sort((a, b) => {
          const pA = getRankInfo(a.position).priority;
          const pB = getRankInfo(b.position).priority;
          return pA - pB;
        });
        
        const bestRank = sortedWins[0].position;
        
        // Add slight delay so content is visible
        setTimeout(() => triggerCelebration(bestRank), 800);
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
      // Fetch from standard member table
      const { data: memberData } = await supabase
        .from('member')
        .select('id, verified, member_id, is_ec, class, section, roll')
        .eq('id', user.id)
        .maybeSingle();

      // Fetch from ec_member table
      const { data: ecData } = await supabase
        .from('ec_member')
        .select('id, verified, member_id')
        .eq('id', user.id)
        .maybeSingle();
      
      const isUserEc = (ecData !== null) || (memberData?.is_ec === true);

      if (ecData) {
        setIsMember(true);
        setIsEc(true);
        setVerified(ecData.verified || 'no');
        const mId = ecData.member_id || null;
        setMemberId(mId);
        setMemberClass('');
        setMemberSection('');
        setMemberRoll('');
        if (mId) fetchAchievements(mId);
      } else if (memberData) {
        setIsMember(true);
        setIsEc(isUserEc);
        setVerified(memberData.verified || 'no');
        const mId = memberData.member_id || null;
        setMemberId(mId);
        setMemberClass(memberData.class || '');
        setMemberSection(memberData.section || '');
        setMemberRoll(memberData.roll || '');
        if (mId) fetchAchievements(mId);
      } else {
        setIsMember(false);
        setIsEc(false);
        setVerified('no');
        setMemberId(null);
        setMemberClass('');
        setMemberSection('');
        setMemberRoll('');
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

      if (isMember) {
        const { error: memberError } = await supabase
          .from('member')
          .update({
            class: memberClass,
            section: memberSection,
            roll: memberRoll,
          })
          .eq('id', user?.id);
        
        if (memberError) throw memberError;
      }

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

  const wins = achievements
    .filter(a => isActualWin(a.position))
    .sort((a, b) => {
      const pA = getRankInfo(a.position).priority;
      const pB = getRankInfo(b.position).priority;
      return pA - pB;
    });
  const pending = achievements.filter(a => !isActualWin(a.position));

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-10 h-10 text-[var(--c-6-start)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="pt-32 pb-24">
      {/* QR ID Modal */}
      <AnimatePresence>
        {showQrModal && (
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 overflow-y-auto py-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQrModal(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            {isEc ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="relative flex flex-col items-center max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ID Card Wrapper scaled for on-screen view */}
                <div className="scale-[0.48] xs:scale-[0.52] sm:scale-[0.58] md:scale-[0.7] lg:scale-[0.75] origin-center -my-48 sm:-my-36 md:-my-24 select-none">
                  <div 
                    ref={cardRef}
                    id="printable-id-card-modal"
                    className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center"
                    style={{
                      borderColor: '#F59E0B66',
                      boxShadow: '0 0 100px rgba(245, 158, 11, 0.35), inset 0 0 30px rgba(245, 158, 11, 0.15)',
                    }}
                  >
                    {/* Blank Background Template Image */}
                    <Image 
                      src="/images/id-card-bg.png" 
                      alt="ID Card Background" 
                      fill
                      className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                      onError={() => {
                        setImageFailed(true);
                      }}
                      onLoad={() => {
                        setImageFailed(false);
                      }}
                      referrerPolicy="no-referrer" 
                    />

                    {/* HTML/CSS Fallback Graphics if image fails */}
                    {imageFailed && (
                      <div className="absolute inset-0 p-10 flex flex-col items-center pointer-events-none z-0">
                        {/* Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.012)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-60" />
                        
                        {/* Ambient light glow */}
                        <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[60%] bg-[radial-gradient(circle_at_center,_rgba(58,31,241,0.25),_transparent_65%)] rotate-[-15deg]" />
                        <div className="absolute bottom-0 right-[-30%] w-[100%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(162,89,255,0.12),_transparent_60%)]" />

                        {/* Header Logo Row */}
                        <div className="w-full flex items-center justify-between z-10 shrink-0">
                          <div className="text-white flex items-center opacity-85 shrink-0">
                            <svg className="h-10 w-auto text-white" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M 10 4 H 36 V 9 H 26 V 20 C 26 24, 23 26, 18 26 H 10 V 21 H 18 C 19.5 21, 21 20.5, 21 19 V 9 H 10 Z" />
                              <path d="M 44 4 H 51 L 58 13 L 65 4 H 72 V 26 H 67 V 11.5 L 59.5 22.5 H 56.5 L 49 11.5 V 26 H 44 Z" />
                              <path d="M 80 4 H 106 V 9 H 90 V 21 H 106 V 26 H 80 Z" />
                            </svg>
                          </div>

                          <div className="relative w-16 h-16 rounded-full border-2 border-red-500/50 p-1 bg-[#090225] shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center shrink-0">
                            <Image 
                              src="/images/logo.png" 
                              alt="St. Joseph Crest" 
                              width={54}
                              height={54}
                              className="object-contain rounded-full" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        </div>

                        {/* Math Fiesta Text Logo */}
                        <div className="w-full flex flex-col items-center z-10 mt-6 shrink-0">
                          <div 
                            className="px-8 py-1.5 text-[15px] font-black tracking-[0.25em] rounded uppercase shadow-lg leading-none mb-3 font-display text-white bg-[#4F39F5]"
                            style={{ boxShadow: '0 0 25px rgba(79, 57, 245, 0.5)' }}
                          >
                            JOSEPHITE
                          </div>

                          <div className="flex items-end justify-center">
                            <span className="text-[64px] font-black tracking-normal text-white leading-none mr-1 italic" style={{ fontStyle: 'oblique' }}>
                              INTR
                            </span>
                            <span className="w-[50px] h-[60px] inline-block text-white mb-[-2px] relative">
                              <svg viewBox="0 0 40 50" fill="currentColor" className="w-full h-full text-white">
                                <circle cx="20" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
                                <rect x="18.5" y="7.5" width="3" height="3" fill="currentColor" />
                                <path d="M19 10 L6 48 L10 48 L20 18.5 Z" fill="currentColor" />
                                <path d="M21 10 L34 48 L30 48 L20 18.5 Z" fill="currentColor" />
                                <path d="M11.5 28 A 12 12 0 0 0 28.5 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="20" cy="30.5" r="2" fill="currentColor" />
                              </svg>
                            </span>
                          </div>

                          <div className="text-[27px] font-black tracking-[0.22em] text-white uppercase text-center mt-1 leading-none flex items-center justify-center gap-1">
                            MATH FI<span className="text-[#A259FF] font-sans drop-shadow-[0_0_8px_rgba(162,180,255,0.6)]">Σ</span>STA
                          </div>

                          <div className="flex items-center justify-between w-full max-w-[400px] mt-4 border-t border-white/15 pt-3 opacity-95">
                            <div className="flex items-center gap-3">
                              <span className="text-[#8B5CF6] text-2xl font-bold leading-none">∞</span>
                              <div className="text-left text-[11px] leading-[1.1] font-black uppercase tracking-wider text-purple-200">
                                <div>Let Infinity</div>
                                <div>Be Your Limit</div>
                              </div>
                            </div>
                            
                            <div className="px-3 py-1 rounded border border-[#8B5CF6] text-[13px] font-black tracking-[0.1em] text-[#A259FF] bg-[#A259FF]/10 select-none">
                              2026
                            </div>
                          </div>
                        </div>

                        {/* Designation Category Header */}
                        <div className="text-center w-full z-10 select-none mt-20 mb-4 shrink-0">
                          <p className="font-display text-[38px] font-black tracking-[0.2em] leading-none uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-[#F59E0B]">
                            EXECUTIVE
                          </p>
                          <p className="font-display text-[38px] font-black tracking-[0.2em] mt-1 uppercase leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-[#F59E0B]">
                            COMMITTEE
                          </p>
                        </div>

                        {/* Personal Details Placeholders */}
                        <div className="absolute inset-0 font-sans text-left pointer-events-none z-0">
                          {/* Name Underline Label */}
                          <div 
                            className="absolute flex items-center text-[18px] leading-none"
                            style={{ top: '825px', left: '50px', right: '50px' }}
                          >
                            <span className="font-bold tracking-[0.1em] w-[120px] uppercase shrink-0 text-zinc-500">NAME:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[20px] -mt-[3px]" />
                          </div>

                          {/* Class Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '50px', width: '150px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Class:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* Section Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '220px', width: '180px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Section:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* Roll Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '420px', width: '130px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Roll:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* ID no. Label */}
                          <div 
                            className="absolute flex items-center text-[18px] leading-none text-[#F59E0B]"
                            style={{ top: '945px', left: '50px', right: '50px' }}
                          >
                            <span className="font-bold tracking-[0.05em] w-[120px] uppercase shrink-0">ID no.:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[20px] -mt-[3px]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      
                      {/* QR Code */}
                      <div 
                        className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                        style={{
                          top: '353px',
                          left: '182px',
                          width: '274px',
                          height: '274px',
                          padding: '17px',
                          boxShadow: '0 0 40px rgba(245, 158, 11, 0.25)'
                        }}
                      >
                        <QRCode 
                          value={JSON.stringify({
                            name: profile?.full_name || fullName,
                            id: memberId,
                            class: memberClass,
                            section: memberSection,
                            roll: memberRoll,
                            role: 'EC Officer',
                            is_ec: true,
                            v: '1.0'
                          })}
                          size={240}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Name */}
                      <div 
                        className="absolute flex items-center justify-start pointer-events-auto"
                        style={{
                          top: '814px',
                          left: '186px',
                          width: '390px',
                          height: '32px',
                        }}
                      >
                        <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                          (profile?.full_name || fullName || "").length > 20 
                            ? 'text-[15px]' 
                            : (profile?.full_name || fullName || "").length > 15 
                              ? 'text-[17px]' 
                              : 'text-[20px]'
                        }`}>
                          {profile?.full_name || fullName || "—"}
                        </span>
                      </div>

                      {/* Class */}
                      <div 
                        className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                        style={{
                          top: '870px',
                          left: '183px',
                          width: '80px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                          {memberClass || "—"}
                        </span>
                      </div>

                      {/* Section */}
                      <div 
                        className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                        style={{
                          top: '870px',
                          left: '423px',
                          width: '60px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                          (memberSection || "").length > 5
                            ? 'text-[12px] tracking-tight'
                            : 'text-[16px]'
                        }`}>
                          {memberSection || "—"}
                        </span>
                      </div>

                      {/* Roll */}
                      <div 
                        className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                        style={{
                          top: '870px',
                          left: '544px',
                          width: '50px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none select-all">
                          {memberRoll || "—"}
                        </span>
                      </div>

                      {/* ID No */}
                      <div 
                        className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                        style={{
                          top: '934px',
                          left: '213px',
                          width: '260px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-white font-black tracking-widest leading-none select-all ${
                          (memberId || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                        }`}>
                          {memberId || "—"}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Below-card action controls */}
                <div className="flex items-center gap-3.5 mt-5 no-print">
                  <button 
                    onClick={downloadIdCardPng}
                    disabled={downloadingCard}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {downloadingCard ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-zinc-100" />
                    )}
                    {downloadingCard ? 'Saving...' : 'Download Card'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-white/10"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    Print ID Card
                  </button>
                  <button 
                    onClick={() => setShowQrModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            ) : (
              /* GENERAL MEMBER CARD */
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="relative flex flex-col items-center max-w-full"
                onClick={(e) => e.stopPropagation()}
              >
                {/* ID Card Wrapper scaled for on-screen view */}
                <div className="scale-[0.48] xs:scale-[0.52] sm:scale-[0.58] md:scale-[0.7] lg:scale-[0.75] origin-center -my-48 sm:-my-36 md:-my-24 select-none">
                  <div 
                    ref={cardRef}
                    id="printable-id-card-modal"
                    className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center"
                    style={{
                      borderColor: '#3A1FF166',
                      boxShadow: '0 0 100px rgba(58, 31, 241, 0.35), inset 0 0 30px rgba(58, 31, 241, 0.15)',
                    }}
                  >
                    {/* Blank Background Template Image */}
                    <Image 
                      src="/images/id-card-bg.png" 
                      alt="ID Card Background" 
                      fill
                      className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                      onError={() => {
                        setImageFailed(true);
                      }}
                      onLoad={() => {
                        setImageFailed(false);
                      }}
                      referrerPolicy="no-referrer" 
                    />

                    {/* HTML/CSS Fallback Graphics if image fails */}
                    {imageFailed && (
                      <div className="absolute inset-0 p-10 flex flex-col items-center pointer-events-none z-0">
                        {/* Grid overlay */}
                        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,_transparent_1px),_linear-gradient(90deg,_rgba(255,255,255,0.012)_1px,_transparent_1px)] bg-[size:20px_20px] opacity-60" />
                        
                        {/* Ambient light glow */}
                        <div className="absolute top-[-10%] left-[-20%] w-[140%] h-[60%] bg-[radial-gradient(circle_at_center,_rgba(58,31,241,0.25),_transparent_65%)] rotate-[-15deg]" />
                        <div className="absolute bottom-0 right-[-30%] w-[100%] h-[50%] bg-[radial-gradient(circle_at_center,_rgba(162,89,255,0.12),_transparent_60%)]" />

                        {/* Header Logo Row */}
                        <div className="w-full flex items-center justify-between z-10 shrink-0">
                          <div className="text-white flex items-center opacity-85 shrink-0">
                            <svg className="h-10 w-auto text-white" viewBox="0 0 120 30" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                              <path d="M 10 4 H 36 V 9 H 26 V 20 C 26 24, 23 26, 18 26 H 10 V 21 H 18 C 19.5 21, 21 20.5, 21 19 V 9 H 10 Z" />
                              <path d="M 44 4 H 51 L 58 13 L 65 4 H 72 V 26 H 67 V 11.5 L 59.5 22.5 H 56.5 L 49 11.5 V 26 H 44 Z" />
                              <path d="M 80 4 H 106 V 9 H 90 V 21 H 106 V 26 H 80 Z" />
                            </svg>
                          </div>

                          <div className="relative w-16 h-16 rounded-full border-2 border-red-500/50 p-1 bg-[#090225] shadow-[0_0_20px_rgba(239,68,68,0.5)] flex items-center justify-center shrink-0">
                            <Image 
                              src="/images/logo.png" 
                              alt="St. Joseph Crest" 
                              width={54}
                              height={54}
                              className="object-contain rounded-full" 
                              referrerPolicy="no-referrer" 
                            />
                          </div>
                        </div>

                        {/* Math Fiesta Text Logo */}
                        <div className="w-full flex flex-col items-center z-10 mt-6 shrink-0">
                          <div 
                            className="px-8 py-1.5 text-[15px] font-black tracking-[0.25em] rounded uppercase shadow-lg leading-none mb-3 font-display text-white bg-[#4F39F5]"
                            style={{ boxShadow: '0 0 25px rgba(79, 57, 245, 0.5)' }}
                          >
                            JOSEPHITE
                          </div>

                          <div className="flex items-end justify-center">
                            <span className="text-[64px] font-black tracking-normal text-white leading-none mr-1 italic" style={{ fontStyle: 'oblique' }}>
                              INTR
                            </span>
                            <span className="w-[50px] h-[60px] inline-block text-white mb-[-2px] relative">
                              <svg viewBox="0 0 40 50" fill="currentColor" className="w-full h-full text-white">
                                <circle cx="20" cy="4.5" r="3.5" stroke="currentColor" strokeWidth="2.5" fill="none" />
                                <rect x="18.5" y="7.5" width="3" height="3" fill="currentColor" />
                                <path d="M19 10 L6 48 L10 48 L20 18.5 Z" fill="currentColor" />
                                <path d="M21 10 L34 48 L30 48 L20 18.5 Z" fill="currentColor" />
                                <path d="M11.5 28 A 12 12 0 0 0 28.5 28" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                                <circle cx="20" cy="30.5" r="2" fill="currentColor" />
                              </svg>
                            </span>
                          </div>

                          <div className="text-[27px] font-black tracking-[0.22em] text-white uppercase text-center mt-1 leading-none flex items-center justify-center gap-1">
                            MATH FI<span className="text-[#A259FF] font-sans drop-shadow-[0_0_8px_rgba(162,180,255,0.6)]">Σ</span>STA
                          </div>

                          <div className="flex items-center justify-between w-full max-w-[400px] mt-4 border-t border-white/15 pt-3 opacity-95">
                            <div className="flex items-center gap-3">
                              <span className="text-[#8B5CF6] text-2xl font-bold leading-none">∞</span>
                              <div className="text-left text-[11px] leading-[1.1] font-black uppercase tracking-wider text-purple-200">
                                <div>Let Infinity</div>
                                <div>Be Your Limit</div>
                              </div>
                            </div>
                            
                            <div className="px-3 py-1 rounded border border-[#8B5CF6] text-[13px] font-black tracking-[0.1em] text-[#A259FF] bg-[#A259FF]/10 select-none">
                              2026
                            </div>
                          </div>
                        </div>

                        {/* Designation Category Header */}
                        <div className="text-center w-full z-10 select-none mt-20 mb-4 shrink-0">
                          <p className="font-display text-[38px] font-black tracking-[0.2em] leading-none uppercase filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-[#8475FF]">
                            GENERAL
                          </p>
                          <p className="font-display text-[38px] font-black tracking-[0.2em] mt-1 uppercase leading-none filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)] text-[#8475FF]">
                            MEMBER
                          </p>
                        </div>

                        {/* Personal Details Placeholders */}
                        <div className="absolute inset-0 font-sans text-left pointer-events-none z-0">
                          {/* Name Underline Label */}
                          <div 
                            className="absolute flex items-center text-[18px] leading-none"
                            style={{ top: '825px', left: '50px', right: '50px' }}
                          >
                            <span className="font-bold tracking-[0.1em] w-[120px] uppercase shrink-0 text-zinc-500">NAME:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[20px] -mt-[3px]" />
                          </div>

                          {/* Class Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '50px', width: '150px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Class:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* Section Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '220px', width: '180px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Section:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* Roll Label */}
                          <div 
                            className="absolute flex items-center text-[17px] leading-none text-zinc-500"
                            style={{ top: '876px', left: '420px', width: '130px' }}
                          >
                            <span className="font-bold tracking-[0.05em] shrink-0">Roll:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[18px] ml-2 -mt-[3px]" />
                          </div>

                          {/* ID no. Label */}
                          <div 
                            className="absolute flex items-center text-[18px] leading-none text-[#8475FF]"
                            style={{ top: '945px', left: '50px', right: '50px' }}
                          >
                            <span className="font-bold tracking-[0.05em] w-[120px] uppercase shrink-0">ID no.:</span>
                            <span className="text-white/10 select-none flex-1 border-b border-white/15 h-[20px] -mt-[3px]" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      
                      {/* QR Code */}
                      <div 
                        className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                        style={{
                          top: '353px',
                          left: '182px',
                          width: '274px',
                          height: '274px',
                          padding: '17px',
                          boxShadow: '0 0 40px rgba(58, 31, 241, 0.25)'
                        }}
                      >
                        <QRCode 
                          value={JSON.stringify({
                            name: profile?.full_name || fullName,
                            id: memberId,
                            class: memberClass,
                            section: memberSection,
                            roll: memberRoll,
                            role: 'General Member',
                            is_ec: false,
                            v: '1.0'
                          })}
                          size={240}
                          level="H"
                          includeMargin={false}
                        />
                      </div>

                      {/* Name */}
                      <div 
                        className="absolute flex items-center justify-start pointer-events-auto"
                        style={{
                          top: '825px',
                          left: '186px',
                          width: '390px',
                          height: '32px',
                        }}
                      >
                        <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                          (profile?.full_name || fullName || "").length > 20 
                            ? 'text-[15px]' 
                            : (profile?.full_name || fullName || "").length > 15 
                              ? 'text-[17px]' 
                              : 'text-[20px]'
                        }`}>
                          {profile?.full_name || fullName || "—"}
                        </span>
                      </div>

                      {/* Class */}
                      <div 
                        className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                        style={{
                          top: '880px',
                          left: '150px',
                          width: '80px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                          {memberClass || "—"}
                        </span>
                      </div>

                      {/* Section */}
                      <div 
                        className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                        style={{
                          top: '880px',
                          left: '390px',
                          width: '60px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                          (memberSection || "").length > 5
                            ? 'text-[12px] tracking-tight'
                            : 'text-[16px]'
                        }`}>
                          {memberSection || "—"}
                        </span>
                      </div>

                      {/* Roll */}
                      <div 
                        className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                        style={{
                          top: '880px',
                          left: '544px',
                          width: '50px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none select-all">
                          {memberRoll || "—"}
                        </span>
                      </div>

                      {/* ID No */}
                      <div 
                        className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                        style={{
                          top: '940px',
                          left: '213px',
                          width: '260px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-white font-black tracking-widest leading-none select-all ${
                          (memberId || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                        }`}>
                          {memberId || "—"}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Below-card action controls */}
                <div className="flex items-center gap-3.5 mt-5 no-print">
                  <button 
                    onClick={downloadIdCardPng}
                    disabled={downloadingCard}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {downloadingCard ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-zinc-100" />
                    )}
                    {downloadingCard ? 'Saving...' : 'Download Card'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-white/10"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    Print ID Card
                  </button>
                  <button 
                    onClick={() => setShowQrModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-95 text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-amber-500/10"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            )}
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
                        onClick={() => {
                          if (isMember) {
                            setShowQrModal(true);
                          } else {
                            showToast('Please register yourself as a member first.', 'error');
                          }
                        }}
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

                        {isMember && (
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Class</label>
                              <input 
                                type="text"
                                value={memberClass}
                                onChange={(e) => setMemberClass(e.target.value)}
                                placeholder="e.g. XI"
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Section</label>
                              <input 
                                type="text"
                                value={memberSection}
                                onChange={(e) => setMemberSection(e.target.value)}
                                placeholder="e.g. A"
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all text-white"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Roll</label>
                              <input 
                                type="text"
                                value={memberRoll}
                                onChange={(e) => setMemberRoll(e.target.value)}
                                placeholder="e.g. 15"
                                className="w-full px-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all text-white"
                              />
                            </div>
                          </div>
                        )}

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
                            <p className={isMember ? `${isEc ? 'text-amber-500' : 'text-[var(--c-6-start)]'} font-bold` : "text-zinc-550 font-medium"}>
                              {isMember ? (isEc ? "EC Committee Officer" : "Verified Member") : "Not Registered"}
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
                                    {wins.map((ach) => {
                                      const rankInfo = getRankInfo(ach.position);
                                      return (
                                        <motion.div 
                                          key={ach.id}
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="p-5 rounded-2xl bg-black/40 border border-white/5 flex items-center gap-4 relative overflow-hidden group"
                                        >
                                          <div className={`p-3 rounded-xl ${rankInfo.colorClass}`}>
                                            {rankInfo.priority === 1 ? <Trophy className="w-5 h-5" /> : 
                                            rankInfo.priority === 2 ? <Medal className="w-5 h-5" /> : 
                                            <StarIcon className="w-5 h-5" />}
                                          </div>
                                          <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                              {rankInfo.label}
                                            </p>
                                            <p className="text-sm font-bold text-white">{ach.event_name}</p>
                                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">{ach.category}</p>
                                          </div>

                                          {rankInfo.priority === 1 && (
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
                                      );
                                    })}
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
                  <div className={`p-8 md:p-12 rounded-[40px] ${isEc ? 'bg-amber-500/5 border border-amber-500/10' : 'bg-[var(--c-6-start)]/5 border border-[var(--c-6-start)]/10'} backdrop-blur-xl mt-8`}>
                    <div className="flex items-center gap-6">
                      <div className={`w-16 h-16 rounded-full ${isEc ? 'bg-amber-500' : 'bg-[var(--c-6-start)]'} flex items-center justify-center text-white`}>
                        <CheckCircle2 className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white">{isEc ? 'Verified EC Officer' : 'Verified Member'}</h3>
                        <p className="text-sm text-zinc-500 font-medium">
                          {isEc ? 'You are successfully registered as an Executive Committee Core Officer.' : 'You are successfully registered for club activities and intra-events.'}
                        </p>
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
