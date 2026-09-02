"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { OptimizedImage } from '../components/OptimizedImage';
import GeometricAvatar from '../components/GeometricAvatar';
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
  Download,
  Calendar,
  Ticket,
  FileText,
  Phone,
  Smartphone,
  Users
} from 'lucide-react';
import { toPng } from 'html-to-image';
import dynamic from 'next/dynamic';
import { 
  getGoogleCalendarAllDaysUrl, 
  downloadIcsCalendar, 
  FESTIVAL_CALENDAR_EVENTS, 
  markFestivalDatesInUserAccount, 
  isFestivalDatesMarked 
} from '../lib/calendar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const QRCode = dynamic(() => import('../components/QRCode'), { ssr: false });
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ScrollReveal from '../components/ScrollReveal';
import confetti from 'canvas-confetti';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl, cleanDisplayEmail, resolveEventNames } from '../lib/utils';
import { useMathJax } from '../hooks/useMathJax';
import { PurchaseSlipModal, PurchaseSlipCandidate } from '../components/dashboard/PurchaseSlipModal';

const isValidClassForTable = (className: string, tableName: string): boolean => {
  if (!className) return false;
  const norm = className.trim().toLowerCase();
  
  // Extract numbers first (e.g., "Class 5" -> 5)
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0], 10);
    if (val >= 3 && val <= 5) return tableName === 'primary_events';
    if (val >= 6 && val <= 8) return tableName === 'junior_events';
    if (val >= 9 && val <= 10) return tableName === 'secondary_events';
    if (val >= 11 && val <= 12) return tableName === 'higher_secondary_events';
  }
  
  // Roman Numerals or words if no digit is found
  if (norm.includes('xii') || norm.includes('twelve')) {
    return tableName === 'higher_secondary_events';
  }
  if (norm.includes('xi') || norm.includes('eleven')) {
    return tableName === 'higher_secondary_events';
  }
  if (norm.includes('ix') || norm.includes('nine')) {
    return tableName === 'secondary_events';
  }
  if (norm.includes('x') || norm.includes('ten')) {
    return tableName === 'secondary_events';
  }
  if (norm.includes('viii') || norm.includes('eight')) {
    return tableName === 'junior_events';
  }
  if (norm.includes('vii') || norm.includes('seven')) {
    return tableName === 'junior_events';
  }
  if (norm.includes('vi') || norm.includes('six')) {
    return tableName === 'junior_events';
  }
  if (norm.includes('iv') || norm.includes('four')) {
    return tableName === 'primary_events';
  }
  if (norm.includes('iii') || norm.includes('three')) {
    return tableName === 'primary_events';
  }
  if (norm.includes('v') || norm.includes('five')) {
    return tableName === 'primary_events';
  }
  
  return tableName === 'primary_events'; // fallback
};

const getTicketCode = (reg: any, isGeneralMember: boolean, isEc: boolean, memberId: string | null): string => {
  if (reg?.isSpotTicket && reg?.member_id) {
    return String(reg.member_id).trim();
  }
  if (reg?.member_id && /^\d{4,6}$/.test(String(reg.member_id).trim())) {
    return String(reg.member_id).trim();
  }
  if (isEc && memberId) {
    // EC members see their 3 digit UNIQUE ID in the ticket
    const cleanId = String(memberId).replace('JMC-', '').trim();
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly.length >= 3) {
      return digitsOnly.slice(-3);
    }
    return digitsOnly.padStart(3, '0');
  }
  
  if (isGeneralMember) {
    // General members see their own unique 6 digit unique code
    if (memberId) {
      const cleanId = String(memberId).replace('JMC-', '').trim();
      const digitsOnly = cleanId.replace(/\D/g, '');
      if (digitsOnly.length === 5) {
        return digitsOnly.padStart(6, '1');
      } else if (digitsOnly.length >= 6) {
        return digitsOnly.slice(-6);
      }
    }
    // Fallback: unique 6-digit hashed code
    if (reg) {
      const str = String(reg.id || "") + (reg.trxnid || "");
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const code = Math.abs(hash % 900000) + 100000;
      return String(code);
    }
    return "110101"; // default 6 digit code for general member without member ID record yet
  }
  
  if (!reg) return "73812";
  
  // Non-general member standard ticket code: 5-digit code or fallback
  const str = String(reg.id || "") + (reg.trxnid || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = Math.abs(hash % 90000) + 10000;
  return String(code);
};

const formatSegments = (eventsStr: string | null) => {
  if (!eventsStr) return "—";
  const resolved = resolveEventNames(eventsStr);
  const events = resolved.split(',').map(e => e.trim());
  if (events.length <= 4) return events.join(', ');
  // Group first 4 events, and the rest on the second line
  const firstFour = events.slice(0, 4).join(', ');
  const remaining = events.slice(4).join(', ');
  return (
    <>
      {firstFour},
      <br />
      {remaining}
    </>
  );
};

const Profile = () => {
  const { user, profile, loading: authLoading, isAdmin, signOut, refreshProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  const { content } = useContent();
  const { showToast } = useToast();
  const router = useRouter();
  const { shouldReduceGfx } = usePerformance();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useMathJax();
  
  const [isEditing, setIsEditing] = useState(false);
  const isEditingRef = useRef(isEditing);

  const startEditing = React.useCallback(() => {
    isEditingRef.current = true;
    setIsEditing(true);
    setUserPhone(prev => (prev === 'N/A' || prev === 'n/a' ? '' : prev));
  }, []);

  const stopEditing = React.useCallback(() => {
    isEditingRef.current = false;
    setIsEditing(false);
    setShowPhoneNoticeBanner(false);
  }, []);

  useEffect(() => {
    isEditingRef.current = isEditing;
  }, [isEditing]);

  const [showPhoneNoticeBanner, setShowPhoneNoticeBanner] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'handouts'>('profile');
  const [fullName, setFullName] = useState('');
  const [userPhone, setUserPhone] = useState('');

  // Check URL query params for phone update request
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const edit = params.get('edit');
      const updatePhone = params.get('updatePhone') || params.get('phone_notice');

      if (action === 'update-phone' || action === 'update_phone' || edit === 'true' || updatePhone === 'true') {
        startEditing();
        setShowPhoneNoticeBanner(true);
      }
    }
  }, []);
  const [isMember, setIsMember] = useState(false);
  const [isEc, setIsEc] = useState(false);
  const [verified, setVerified] = useState('no');
  const [memberId, setMemberId] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loadingAchievements, setLoadingAchievements] = useState(false);
  const [registeredEventsList, setRegisteredEventsList] = useState<any[]>([]);
  const [loadingRegisteredEvents, setLoadingRegisteredEvents] = useState(false);
  const [announcedResults, setAnnouncedResults] = useState<string[]>([]);
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
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicketIndex, setSelectedTicketIndex] = useState(0);
  const [downloadingTicket, setDownloadingTicket] = useState(false);
  const [ticketImageFailed, setTicketImageFailed] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);

  const [activeSlipCandidate, setActiveSlipCandidate] = useState<PurchaseSlipCandidate | null>(null);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [profileDocType, setProfileDocType] = useState<'ticket' | 'verification_slip'>('ticket');

  const openSlipForRegistration = (reg: any) => {
    const candidate: PurchaseSlipCandidate = {
      id: reg?.id?.split('-')[0]?.toUpperCase() || reg?.trxnid || 'JMC-SLIP',
      fullName: reg?.full_name || profile?.full_name || fullName || 'Participant',
      email: profile?.email || user?.email || '',
      phone: reg?.bkash_number || profile?.phone || userPhone || '',
      memberId: memberId || reg?.member_id || ('EVT-' + (reg?.id?.split('-')[0]?.toUpperCase() || 'PASS')),
      class: reg?.class || memberClass || 'N/A',
      section: reg?.section || memberSection || 'N/A',
      roll: reg?.roll || memberRoll || 'N/A',
      school: reg?.school || 'St. Joseph Higher Secondary School',
      trxnid: reg?.trxnid || 'VERIFIED',
      eventsList: (reg?.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean),
      teamName: reg?.team_name || reg?.teamName || undefined,
      teamMembers: Array.isArray(reg?.team_members) ? reg.team_members : (Array.isArray(reg?.teamMembers) ? reg.teamMembers : undefined),
      verified: reg?.verified === 'yes',
    };
    setActiveSlipCandidate(candidate);
    setShowSlipModal(true);
  };

  const downloadTicketPng = async () => {
    if (!ticketRef.current || downloadingTicket) return;
    setDownloadingTicket(true);
    try {
      await new Promise((res) => setTimeout(res, 200));
      const dataUrl = await toPng(ticketRef.current, {
        cacheBust: true,
        width: 900,
        height: 320,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left',
          width: '900px',
          height: '320px',
        }
      });
      const link = document.createElement('a');
      const sanitizedName = (profile?.full_name || fullName || 'Participant').trim().replace(/\s+/g, '_');
      link.download = `JMC_Fiesta_Ticket_${sanitizedName}.png`;
      link.href = dataUrl;
      link.click();
      showToast('Digital Entry ticket downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error generating ticket image:', err);
      showToast('Failed to download digital ticket, please try again.', 'error');
    } finally {
      setDownloadingTicket(false);
    }
  };

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

  const handleRemoveAvatar = async () => {
    if (!user) return;
    const confirmRemove = window.confirm("Are you sure you want to remove your profile picture and use a geometric avatar instead?");
    if (!confirmRemove) return;

    setUploadingAvatar(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;
      
      await refreshProfile();
      
      if (isMember) {
        await supabase
          .from('member')
          .update({ photo_url: null })
          .eq('id', user.id);
      }
      showToast('Profile picture removed. Switched to geometric avatar!', 'success');
    } catch (err: any) {
      console.error('Error removing avatar:', err);
      showToast(err.message || 'Failed to remove profile picture', 'error');
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
    } catch (err) {
      console.error("Error fetching achievements:", err);
    } finally {
      setLoadingAchievements(false);
    }
  }, [triggerCelebration]);

  const fetchRegisteredEventsList = React.useCallback(async (resolvedMemberId?: string | null) => {
    if (!user || !isSupabaseConfigured) return;
    setLoadingRegisteredEvents(true);
    try {
      const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
      let allReg: any[] = [];
      let hasOnlyMathOlympiadReg = false;
      let hasAnyVerifiedEvent = false;
      for (const tb of tables) {
        let { data, error } = await supabase
          .from(tb)
          .select('*')
          .or(userPhone ? `user_id.eq.${user.id},bkash_number.eq.${userPhone}` : `user_id.eq.${user.id}`);
        
        if (error) {
          console.error(`Error loading events from ${tb}:`, error);
          throw error;
        }
        
        if (data && data.length > 0) {
          console.log(`[Profile] Fetched ${data.length} records from ${tb}`);
          const mapped = data.map((item: any) => {
            console.log(`[Profile] ${tb} record:`, {id: item.id, verified: item.verified, trxnid: item.trxnid});
            const isOnlyMO = (item.selected_events || '').split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean).length === 1 && 
                             (item.selected_events || '').toLowerCase().includes('math olympiad');
            if (isOnlyMO) {
              hasOnlyMathOlympiadReg = true;
            }

            // Normalize verified to string 'yes', 'no', or 'rejected'
            let normalizedVerified = 'no';
            if (item.verified === true || item.verified === 'yes') {
              normalizedVerified = 'yes';
            } else if (item.verified === 'rejected') {
              normalizedVerified = 'rejected';
            } else if (item.verified === false || item.verified === 'no') {
              normalizedVerified = 'no';
            }

            // CRITICAL FIX: Check if ANY event registration is verified
            if (normalizedVerified === 'yes') {
              console.log(`[Profile] Found verified event in ${tb}:`, item.trxnid);
              hasAnyVerifiedEvent = true;
            }
            return {
              ...item,
              tableName: tb,
              verified: isOnlyMO ? 'yes' : normalizedVerified
            };
          });
          allReg = [...allReg, ...mapped];
        }
      }

      // 2. Also check if user has an autogenerated on-spot ticket in site_content
      try {
        const { data: ticketContent } = await supabase
          .from('site_content')
          .select('data')
          .eq('id', 'ticket_purchases')
          .maybeSingle();

        if (ticketContent?.data?.spotTickets) {
          const spotMap = ticketContent.data.spotTickets;
          const userEmailClean = (user.email || profile?.email || '').trim().toLowerCase();
          const userPhoneClean = (userPhone || profile?.phone || profile?.contact || '').replace(/\D/g, '');

          Object.entries(spotMap).forEach(([spotId, st]: [string, any]) => {
            const stEmail = (st.email || '').trim().toLowerCase();
            const stPhone = (st.phone || '').replace(/\D/g, '');
            const matchEmail = stEmail && userEmailClean && stEmail === userEmailClean;
            const matchPhone = stPhone && userPhoneClean && (stPhone === userPhoneClean || userPhoneClean.endsWith(stPhone) || stPhone.endsWith(userPhoneClean));
            const matchId = st.id === user.id || `spot-${spotId}` === user.id;

            if (matchEmail || matchPhone || matchId) {
              const alreadyAdded = allReg.some(r => r.id === `spot-${spotId}` || r.trxnid === `SPOT-${spotId}` || r.trxnid === `SPOT-TICKET-${spotId}`);
              if (!alreadyAdded) {
                const targetTable = isValidClassForTable(st.class || memberClass || '', 'primary_events') ? 'primary_events' :
                                    isValidClassForTable(st.class || memberClass || '', 'junior_events') ? 'junior_events' :
                                    isValidClassForTable(st.class || memberClass || '', 'secondary_events') ? 'secondary_events' : 'higher_secondary_events';
                
                allReg.push({
                  id: `spot-${spotId}`,
                  user_id: user.id,
                  full_name: st.fullName || profile?.full_name || fullName || 'Participant',
                  email: st.email || user.email,
                  phone: st.phone || userPhone,
                  bkash_number: st.phone || userPhone,
                  class: st.class || memberClass || 'N/A',
                  section: st.section || 'N/A',
                  roll: st.roll || 'N/A',
                  school: st.school || 'St. Joseph Higher Secondary School',
                  selected_events: 'On-Spot Event Pass & Math Olympiad',
                  trxnid: `SPOT-TICKET-${spotId}`,
                  member_id: spotId,
                  amount: 100,
                  verified: 'yes',
                  isSpotTicket: true,
                  tableName: targetTable
                });
                hasAnyVerifiedEvent = true;
              }
            }
          });
        }
      } catch (spotErr) {
        console.warn("Could not check spot tickets in profile:", spotErr);
      }
      setRegisteredEventsList(allReg);
      if (allReg.length > 0) {
        markFestivalDatesInUserAccount(user.email);
      }
      console.log(`[Profile] Total registered events: ${allReg.length}, hasAnyVerifiedEvent: ${hasAnyVerifiedEvent}`);

      const currentMemberId = resolvedMemberId !== undefined ? resolvedMemberId : memberId;
      const isFiveDigit = currentMemberId && /^\d{5}$/.test(String(currentMemberId).trim());

      // CRITICAL FIX: Ensure database member record is synced when events are verified
      if (hasOnlyMathOlympiadReg || hasAnyVerifiedEvent) {
        try {
          // Attempt database synchronization for the member record so it persists as verified
          await supabase
            .from('member')
            .update({ verified: 'yes' })
            .eq('id', user.id);
        } catch (syncErr) {
          console.warn("Could not auto-verify member row in DB:", syncErr);
        }
      } else if (allReg.length === 0 && isFiveDigit) {
        // If they have no registered events, and their member_id is a 5-digit number (inter-school participant),
        // we must revert their verified status in standard member table to 'no' and update UI state immediately.
        try {
          await supabase
            .from('member')
            .update({ verified: 'no' })
            .eq('id', user.id);
        } catch (syncErr) {
          console.warn("Could not reset member verification status in DB:", syncErr);
        }
        setVerified('no');
        setIsMember(false);
      }

      try {
        const { data: systemData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'announced_results')
          .maybeSingle();
        if (systemData && systemData.value && Array.isArray(systemData.value)) {
          setAnnouncedResults(systemData.value as string[]);
        }

        const { data: docTypeData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'registration_document_type')
          .maybeSingle();
        if (docTypeData && docTypeData.value) {
          setProfileDocType(docTypeData.value === 'verification_slip' ? 'verification_slip' : 'ticket');
        }
      } catch (e) {
        console.warn("Could not load announced results list from system_settings", e);
      }
    } catch (err) {
      console.error("Error loading registered events list:", err);
    } finally {
      setLoadingRegisteredEvents(false);
    }
  }, [user, memberId]);

  const checkMemberStatus = React.useCallback(async () => {
    if (!user) return;
    try {
      // Fetch from standard member table
      const { data: memberData } = await supabase
        .from('member')
        .select('id, verified, member_id, is_ec, class, section, roll, phone')
        .eq('id', user.id)
        .maybeSingle();

      // Fetch from ec_member table
      const { data: ecDataRaw } = await supabase
        .from('ec_member')
        .select('id, verified, member_id, class, section, roll, phone')
        .eq('id', user.id)
        .maybeSingle();
      const ecData = ecDataRaw as any;

      // Fetch from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('phone, full_name')
        .eq('id', user.id)
        .maybeSingle();

      const foundPhone = ecData?.phone || memberData?.phone || profileData?.phone || user?.user_metadata?.phone || '';
      if (foundPhone && !isEditingRef.current) {
        setUserPhone(foundPhone === 'N/A' || foundPhone === 'n/a' ? '' : foundPhone);
      }
      
      const isUserEc = (ecData !== null) || 
                       (memberData?.is_ec === true) || 
                       (ecData?.member_id ? /^\d{3}$/.test(ecData.member_id) : false) || 
                       (memberData?.member_id ? /^\d{3}$/.test(memberData.member_id) : false);

      // Store member verification status for use in event list verification
      let memberVerificationStatus = 'no';
      let finalMId: string | null = null;

      if (isUserEc) {
        setIsMember(true);
        setIsEc(true);
        
        let resolvedVerified = 'no';
        if (ecData?.verified === 'yes' || memberData?.verified === 'yes') {
          resolvedVerified = 'yes';
          memberVerificationStatus = 'yes';
        } else if (ecData?.verified === 'rejected' || memberData?.verified === 'rejected') {
          resolvedVerified = 'rejected';
          memberVerificationStatus = 'rejected';
        } else {
          resolvedVerified = 'no';
        }
        setVerified(resolvedVerified);

        const mId = ecData?.member_id || memberData?.member_id || null;
        finalMId = mId;
        setMemberId(mId);
        if (!isEditingRef.current) {
          setMemberClass(ecData?.class || memberData?.class || '');
          setMemberSection(ecData?.section || memberData?.section || '');
          setMemberRoll(ecData?.roll || memberData?.roll || '');
        }
        if (mId) fetchAchievements(mId);
      } else if (memberData) {
        setIsMember(true);
        setIsEc(false);
        
        let resolvedVerified = 'no';
        if (memberData.verified === 'yes') {
          resolvedVerified = 'yes';
          memberVerificationStatus = 'yes';
        } else if (memberData.verified === 'rejected') {
          resolvedVerified = 'rejected';
          memberVerificationStatus = 'rejected';
        } else {
          resolvedVerified = 'no';
        }
        setVerified(resolvedVerified);

        const mId = memberData.member_id || null;
        finalMId = mId;
        setMemberId(mId);
        if (!isEditingRef.current) {
          setMemberClass(memberData.class || '');
          setMemberSection(memberData.section || '');
          setMemberRoll(memberData.roll || '');
        }
        if (mId) fetchAchievements(mId);
      } else {
        // No member record found
        setIsMember(false);
        setIsEc(false);
        setVerified('no');
        setMemberId(null);
        if (!isEditingRef.current) {
          setMemberClass('');
          setMemberSection('');
          setMemberRoll('');
        }
      }
      
      await fetchRegisteredEventsList(finalMId);
    } catch (err) {
      console.error('Error checking member status:', err);
    } finally {
      setCheckingMember(false);
    }
  }, [user, fetchAchievements, fetchRegisteredEventsList]);

  // Real-time listener to sync registration_document_type system settings immediately
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const fetchDocTypeSetting = async () => {
      try {
        const { data: docTypeData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'registration_document_type')
          .maybeSingle();

        if (docTypeData && docTypeData.value) {
          setProfileDocType(docTypeData.value === 'verification_slip' ? 'verification_slip' : 'ticket');
        }
      } catch (e) {
        console.warn("Could not query system_settings for registration_document_type:", e);
      }
    };

    fetchDocTypeSetting();

    const settingsChannel = supabase
      .channel(`profile-system-settings-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'system_settings'
        },
        (payload: any) => {
          if (payload?.new && payload.new.key === 'registration_document_type') {
            setProfileDocType(payload.new.value === 'verification_slip' ? 'verification_slip' : 'ticket');
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
    };
  }, [isSupabaseConfigured]);

  // Real-time listener to sync verification status changes immediately
  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;

    let isMounted = true;

    // Force immediate refresh on mount
    if (isMounted) {
      fetchRegisteredEventsList();
      checkMemberStatus();
    }

    // Listen to changes in standard member table for this user
    const memberChannel = supabase
      .channel(`member-sync-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'member',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (isMounted) {
            console.log('Member table changed:', payload);
            checkMemberStatus();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to member table changes');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Failed to subscribe to member changes, will rely on polling');
        }
      });

    // Listen to changes in ec_member table for this user
    const ecChannel = supabase
      .channel(`ec_member-sync-${user.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ec_member',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          if (isMounted) {
            console.log('EC member table changed:', payload);
            checkMemberStatus();
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to ec_member table changes');
        }
      });

    // Listen to changes in event registration tables for this user
    const eventTables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
    const eventChannels = eventTables.map(tb => {
      return supabase
        .channel(`${tb}-sync-${user.id}-${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: tb,
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            if (isMounted) {
              console.log(`Event table ${tb} changed:`, payload);
              fetchRegisteredEventsList();
              checkMemberStatus();
            }
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${tb} changes`);
          }
        });
    });

    // Polling fallback - check every 5 seconds to ensure updates when not editing
    const fallbackPollInterval = setInterval(() => {
      if (isMounted && !isEditingRef.current) {
        fetchRegisteredEventsList();
        checkMemberStatus();
      }
    }, 5000);

    return () => {
      isMounted = false;
      clearInterval(fallbackPollInterval);
      memberChannel.unsubscribe();
      ecChannel.unsubscribe();
      eventChannels.forEach(ch => ch.unsubscribe());
    };
  }, [user, checkMemberStatus, fetchRegisteredEventsList]);

  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push('/login?redirect=' + encodeURIComponent(currentPath));
    }
    if (user && !isEditingRef.current) {
      fetchRegisteredEventsList();
      checkMemberStatus();
    }
    if (profile && !isEditingRef.current) {
      setFullName(profile.full_name || '');
    }

    // Refresh profile when window gains focus (e.g. after returning from registration tab)
    const handleFocus = () => {
      if (!isEditingRef.current) {
        refreshProfile();
        checkMemberStatus();
        fetchRegisteredEventsList();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [user, authLoading, router, profile, checkMemberStatus, refreshProfile, fetchRegisteredEventsList]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const cleanNewName = fullName.trim();
      const cleanPhone = userPhone.trim();

      if (!cleanPhone) {
        throw new Error('Phone number is required so you can log in using Phone Number + Password.');
      }

      if (cleanNewName && /\s/.test(cleanNewName)) {
        throw new Error('Please type in your name without spaces or just type in your surname. Your given name must be a single word.');
      }

      const res = await fetch('/api/auth/update-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          newFullName: cleanNewName,
          phone: cleanPhone,
          memberClass,
          memberSection,
          memberRoll
        })
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(resData.error || 'Failed to update profile.');
      }

      if (isMember) {
        // Update member table if they have a standard member record
        const { error: memberError } = await supabase
          .from('member')
          .update({
            class: memberClass,
            section: memberSection,
            roll: memberRoll,
            full_name: cleanNewName,
            phone: cleanPhone,
          })
          .eq('id', user?.id);

        // Update ec_member table if they have an EC record
        if (isEc) {
          const { error: ecError } = await supabase
            .from('ec_member')
            .update({
              class: memberClass,
              section: memberSection,
              roll: memberRoll,
              full_name: cleanNewName,
              phone: cleanPhone,
            })
            .eq('id', user?.id);
          
          if (ecError) console.error('Error updating ec_member:', ecError);
        } else {
          if (memberError) console.error('Error updating member:', memberError);
        }
      } else {
        // Even if not a standard club member, update the profiles table
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: cleanNewName,
            phone: cleanPhone,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id);

        if (profileError) console.error('Error updating profiles:', profileError);
      }

      await refreshProfile();
      setSuccess(true);
      stopEditing();

      if (typeof window !== 'undefined' && window.location.search.includes('action=update-phone')) {
        window.history.replaceState({}, '', window.location.pathname);
      }

      showToast('Profile and Phone Number updated successfully!', 'success');
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  const filteredAchievements = React.useMemo(() => {
    return achievements.filter(a => {
      const targetEvent = String(a.event_name || '').toLowerCase().trim();
      return registeredEventsList.some(reg => {
        const eventsStr = String(reg.selected_events || '').toLowerCase();
        return eventsStr.split(',').map((s: string) => s.trim()).includes(targetEvent) || 
               eventsStr.includes(targetEvent);
      });
    });
  }, [achievements, registeredEventsList]);

  const wins = React.useMemo(() => {
    return filteredAchievements
      .filter(a => {
        if (!isActualWin(a.position)) return false;
        const matchText = `${String(a.event_name || '').trim()} - ${String(a.category || '').trim()}`.toLowerCase();
        return announcedResults.some(announced => String(announced || '').trim().toLowerCase() === matchText);
      })
      .sort((a, b) => {
        const pA = getRankInfo(a.position).priority;
        const pB = getRankInfo(b.position).priority;
        return pA - pB;
      });
  }, [filteredAchievements, announcedResults]);

  const pending = React.useMemo(() => {
    return filteredAchievements.filter(a => {
      const matchText = `${String(a.event_name || '').trim()} - ${String(a.category || '').trim()}`.toLowerCase();
      const isAnnounced = announcedResults.some(announced => String(announced || '').trim().toLowerCase() === matchText);
      return !isActualWin(a.position) || !isAnnounced;
    });
  }, [filteredAchievements, announcedResults]);

  // Trigger celebration once both registeredEventsList and achievements are finished loading
  useEffect(() => {
    if (loadingAchievements || loadingRegisteredEvents) return;
    if (wins.length > 0 && !celebratedRef.current) {
      celebratedRef.current = true;
      const bestRank = wins[0].position;
      const timer = setTimeout(() => triggerCelebration(bestRank), 800);
      return () => clearTimeout(timer);
    }
  }, [loadingAchievements, loadingRegisteredEvents, wins, triggerCelebration]);

  const isGeneralMember = React.useMemo(() => {
    // A user is NOT a general member if they have a 5-digit member_id (which is auto-generated for non-general event registrants)
    if (memberId && /^\d{5}$/.test(String(memberId).trim())) {
      return false;
    }

    // Someone is a general member if they have ANY verified event registration and are not a non-general 5-digit member
    const hasVerifiedEvent = registeredEventsList.some(reg => reg.verified === 'yes');
    if (hasVerifiedEvent) {
      return true; // Show ID/Ticket buttons immediately upon approval
    }
    // Also show if they're a verified member in database
    return isMember && (verified === 'yes' || isEc);
  }, [isMember, registeredEventsList, verified, isEc, memberId]);

  const isRealGeneralMember = React.useMemo(() => {
    return isGeneralMember && !isEc;
  }, [isGeneralMember, isEc]);

  const hasGeneralMemberPrivileges = React.useMemo(() => {
    if (isEc || isAdmin) return true;
    return isGeneralMember;
  }, [isEc, isAdmin, isGeneralMember]);

  useEffect(() => {
    if (!hasGeneralMemberPrivileges && activeSubTab === 'handouts') {
      setActiveSubTab('profile');
    }
  }, [hasGeneralMemberPrivileges, activeSubTab]);

  const unverifiedRegistrations = React.useMemo(() => {
    return registeredEventsList;
  }, [registeredEventsList]);

  const allPendingParticipations = React.useMemo(() => {
    const list = [...pending];
    
    // Auto-populate verified registrations if not already in achievements or wins
    registeredEventsList.forEach((reg: any) => {
      const v = String(reg.verified || '').toLowerCase().trim();
      if (v === 'yes') {
        const events = (reg.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean);
        events.forEach((evt: string) => {
          const alreadyInPending = list.some(p => p.event_name?.toLowerCase().trim() === evt.toLowerCase().trim());
          const alreadyInWins = wins.some(w => w.event_name?.toLowerCase().trim() === evt.toLowerCase().trim());
          if (!alreadyInPending && !alreadyInWins) {
            list.push({
              id: `AUTO-VERIFIED-${reg.tableName}-${reg.id}-${evt}`,
              event_name: evt,
              category: reg.tableName === 'primary_events' ? 'Primary' :
                        reg.tableName === 'junior_events' ? 'Junior' :
                        reg.tableName === 'secondary_events' ? 'Secondary' :
                        'Higher Secondary',
            });
          }
        });
      }
    });
    
    return list;
  }, [pending, registeredEventsList, wins]);

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
                <div className="scale-[0.24] xs:scale-[0.28] sm:scale-[0.35] md:scale-[0.45] lg:scale-[0.52] xl:scale-[0.58] origin-center -my-[360px] xs:-my-[320px] sm:-my-[280px] md:-my-[220px] lg:-my-[180px] xl:-my-[140px] select-none">
                  <div 
                    ref={cardRef}
                    id="printable-id-card-modal"
                    className="relative w-[1282px] h-[1012px] rounded-[52px] border border-zinc-800 bg-[#090225] text-center text-white flex items-center overflow-hidden"
                    style={{
                      boxShadow: '0 0 100px rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    {/* FRONT SIDE (LEFT) */}
                    <div 
                      className="relative w-[638px] h-[1012px] overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center flex-shrink-0"
                      style={{
                        borderRadius: '52px',
                        border: '4px solid #F59E0B66',
                      }}
                    >
                      <Image 
                        src="/images/ec_front.png" 
                        alt="EC ID Card Front" 
                        fill
                        className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                        referrerPolicy="no-referrer" 
                      />
                      {/* Overlaid 3-Digit ID */}
                      <div 
                        className="absolute flex items-center justify-center text-center pointer-events-auto font-mono font-black"
                        style={{
                          top: '543px',
                          left: '0',
                          width: '638px',
                          height: '120px',
                        }}
                      >
                        <div className="flex flex-col items-center">
                          <span className="text-[12px] uppercase tracking-[0.25em] text-zinc-400 font-bold mb-1">EC Member ID</span>
                          <span className="text-[52px] font-black text-[#F59E0B] tracking-wider leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                            {(() => {
                              if (!memberId) return '000';
                              const match = String(memberId).match(/\d{3}/);
                              if (match) return match[0];
                              const numStr = String(memberId).replace(/\D/g, '');
                              if (numStr.length >= 3) {
                                return numStr.slice(-3);
                              }
                              return numStr.padStart(3, '0');
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* FOLDING CREASE / GUIDE LINE */}
                    <div className="w-[6px] h-full flex flex-col items-center justify-between py-10 relative z-20">
                      <div className="absolute inset-y-0 left-[2.5px] border-l-2 border-dashed border-amber-500/40" />
                      <span className="text-[8px] font-black tracking-widest text-amber-500/70 uppercase transform -rotate-90 origin-center whitespace-nowrap bg-[#090225] py-2 shrink-0">
                        ✂️ CUT & FOLD GUIDE
                      </span>
                    </div>

                    {/* BACK SIDE (RIGHT) */}
                    <div 
                      className="relative w-[638px] h-[1012px] overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center flex-shrink-0"
                      style={{
                        borderRadius: '52px',
                        border: '4px solid #F59E0B66',
                      }}
                    >
                      <Image 
                        src="/images/ec_back.png" 
                        alt="EC ID Card Back" 
                        fill
                        className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                        referrerPolicy="no-referrer" 
                      />
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

      {/* Digital Ticket Modal */}
      <AnimatePresence>
        {showTicketModal && (registeredEventsList.length > 0) && (() => {
          const currentReg = registeredEventsList[selectedTicketIndex] || registeredEventsList[0] || null;
          const ticketCode = getTicketCode(currentReg, isGeneralMember, isEc, memberId);
          const getCategoryFromClass = (clsStr: string) => {
            const clean = (clsStr || '').trim().toLowerCase();
            if (clean.includes('11') || clean.includes('12') || clean.includes('xi') || clean.includes('xii') || clean.includes('eleven') || clean.includes('twelve') || clean.includes('hsc')) {
              return 'Higher Secondary';
            }
            if (clean.includes('9') || clean.includes('10') || clean.includes('ix') || clean.includes('x') || clean.includes('nine') || clean.includes('ten') || clean.includes('ssc')) {
              return 'Secondary';
            }
            if (clean.includes('6') || clean.includes('7') || clean.includes('8') || clean.includes('vi') || clean.includes('vii') || clean.includes('viii') || clean.includes('six') || clean.includes('seven') || clean.includes('eight')) {
              return 'Junior';
            }
            if (clean.includes('3') || clean.includes('4') || clean.includes('5') || clean.includes('iii') || clean.includes('iv') || clean.includes('v') || clean.includes('three') || clean.includes('four') || clean.includes('five')) {
              return 'Primary';
            }
            
            const num = parseInt(clean.replace(/\D/g, ''));
            if (isNaN(num)) return 'Junior'; // default fallback
            if (num >= 3 && num <= 5) return 'Primary';
            if (num >= 6 && num <= 8) return 'Junior';
            if (num >= 9 && num <= 10) return 'Secondary';
            return 'Higher Secondary';
          };
          const categoryName = currentReg
            ? (currentReg.tableName === 'primary_events' ? 'Primary' :
               currentReg.tableName === 'junior_events' ? 'Junior' :
               currentReg.tableName === 'secondary_events' ? 'Secondary' : 'Higher Secondary')
            : getCategoryFromClass(memberClass);
          const isTeam = currentReg?.selected_events?.toLowerCase().includes('team') || currentReg?.amount >= 200;

          return (
            <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-4 overflow-y-auto py-8">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowTicketModal(false)}
                className="absolute inset-0 bg-black/90 backdrop-blur-md"
              />

              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 15 }}
                className="relative flex flex-col items-center max-w-full z-10"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Selector for multiple tickets */}
                {registeredEventsList.length > 1 && (
                  <div className="flex items-center gap-2 mb-6 bg-white/5 p-1.5 rounded-xl border border-white/10 max-w-full overflow-x-auto no-scrollbar z-10">
                    {registeredEventsList.map((reg, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedTicketIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                          selectedTicketIndex === idx
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        {reg.tableName === 'primary_events' ? 'Primary' :
                         reg.tableName === 'junior_events' ? 'Junior' :
                         reg.tableName === 'secondary_events' ? 'Secondary' : 'Higher Secondary'} Ticket ({idx + 1})
                      </button>
                    ))}
                  </div>
                )}

                {/* Ticket Wrapper scaled for on-screen view */}
                <div className="scale-[0.38] xs:scale-[0.45] sm:scale-[0.58] md:scale-[0.75] lg:scale-[1] origin-center -my-32 xs:-my-24 sm:-my-16 md:-my-10 lg:my-0 select-none">
                  <div 
                    ref={ticketRef}
                    id="printable-ticket-card-modal"
                    className="relative w-[900px] h-[320px] rounded-3xl overflow-hidden bg-[#fafafa] text-black border-2 border-indigo-500/30 flex select-none"
                    style={{
                      boxShadow: '0 0 60px rgba(99, 102, 241, 0.4)',
                    }}
                  >
                    {/* Blank Background Template Image */}
                    <Image 
                      src="/images/Ticket_bg.png" 
                      alt="Ticket Background" 
                      fill
                      className="absolute inset-0 w-full h-full object-fill rounded-[22px] pointer-events-none z-0"
                      onError={() => {
                        setTicketImageFailed(true);
                      }}
                      onLoad={() => {
                        setTicketImageFailed(false);
                      }}
                      referrerPolicy="no-referrer" 
                    />

                    {/* HTML/CSS Fallback Graphics if image fails or is empty */}
                    {ticketImageFailed && (
                      <div className="absolute inset-0 bg-gradient-to-br from-[#f8f6ff] to-[#efecff] p-6 flex items-center pointer-events-none z-0">
                        {/* Diagonal subtle geometric lines */}
                        <div className="absolute inset-0 opacity-[0.03] bg-[repeating-linear-gradient(45deg,#4f46e5,#4f46e5_10px,transparent_10px,transparent_20px)]" />
                        
                        {/* Background glowing orb */}
                        <div className="absolute -top-1/2 -left-1/4 w-[80%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_65%)] rotate-12" />
                        
                        {/* Perforation Line right at 540px */}
                        <div className="absolute top-0 bottom-0 left-[540px] border-r-2 border-dashed border-indigo-200" />
                        
                        {/* Vertical Perforation Band */}
                        <div className="absolute left-[540px] top-0 w-[46px] h-full bg-[#0d0925] flex flex-col items-center justify-center text-white font-black text-[15px] tracking-[0.25em] py-4 leading-none select-none z-10">
                          <span className="block">T</span>
                          <span className="block">I</span>
                          <span className="block">C</span>
                          <span className="block">K</span>
                          <span className="block">E</span>
                          <span className="block">T</span>
                        </div>

                        {/* St. Joseph Crest in Header (Left) */}
                        <div className="absolute top-5 left-5 w-11 h-11 rounded-full border border-black/10 bg-white p-0.5 shadow-sm flex items-center justify-center">
                          <Image 
                            src="/images/logo.png" 
                            alt="St. Joseph Crest" 
                            width={38}
                            height={38}
                            className="object-contain rounded-full" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>

                        {/* JMC logo on right stub */}
                        <div className="absolute top-4 right-4 w-9 h-9 rounded-full border border-black/10 bg-white p-0.5 shadow-sm flex items-center justify-center">
                          <Image 
                            src="/images/logo.png" 
                            alt="St. Joseph Crest" 
                            width={32}
                            height={32}
                            className="object-contain rounded-full" 
                            referrerPolicy="no-referrer" 
                          />
                        </div>
                      </div>
                    )}

                    {/* Absolute Overlays with coordinates mapped precisely to original Ticket_bg.png blueprint layout */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      
                      {/* Left portion: Master card */}
                      
                      {/* Name Overlay block */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left"
                        style={{
                          top: '67px',
                          left: '89px',
                          width: '320px',
                          height: '24px',
                        }}
                      >
                        <span className="font-extrabold uppercase text-[#1e1b4b] tracking-wide text-[13px] leading-none truncate select-all">
                          {currentReg?.full_name || fullName || profile?.full_name || "—"}
                        </span>
                      </div>

                      {/* Unique 5 digit code after name in the same line */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left animate-pulse"
                        style={{
                          top: '67px',
                          left: '435px',
                          width: '95px',
                          height: '24px',
                        }}
                      >
                        <span className="font-mono text-[14px] font-black tracking-widest text-[#dc2626] select-all border border-[#dc2626]/25 bg-[#fef2f2]/70 px-1.5 py-0.5 rounded shadow-sm leading-none">
                          #{ticketCode}
                        </span>
                      </div>

                      {/* Class Overlay */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left"
                        style={{
                          top: '103px',
                          left: '100px',
                          width: '75px',
                          height: '24px',
                        }}
                      >
                        <span className="font-bold uppercase text-[#1e1b4b] text-[12px] leading-none truncate select-all">
                          {currentReg?.class || memberClass || "—"}
                        </span>
                      </div>

                      {/* Section Overlay */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left"
                        style={{
                          top: '103px',
                          left: '230px',
                          width: '125px',
                          height: '24px',
                        }}
                      >
                        <span className="font-bold uppercase text-[#1e1b4b] text-[12px] leading-none truncate select-all">
                          {currentReg?.section || memberSection || "—"}
                        </span>
                      </div>

                      {/* Roll Overlay */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left"
                        style={{
                          top: '103px',
                          left: '445px',
                          width: '80px',
                          height: '24px',
                        }}
                      >
                        <span className="font-bold text-[#1e1b4b] text-[12px] leading-none select-all font-mono">
                          {currentReg?.roll || memberRoll || "—"}
                        </span>
                      </div>

                      {/* Contact No Overlay */}
                      <div 
                        className="absolute flex items-end justify-start pointer-events-auto text-left"
                        style={{
                          top: '142px',
                          left: '167px',
                          width: '365px',
                          height: '24px',
                        }}
                      >
                        <span className="font-bold text-[#1e1b4b] text-[12px] leading-none truncate select-all font-mono">
                          {currentReg?.bkash_number || profile?.contact || "—"}
                        </span>
                      </div>

                      {/* Category Overlay */}
                      <div 
                        className="absolute flex items-center justify-start pointer-events-auto text-left"
                        style={{
                          top: '172px',
                          left: '145px',
                          width: '365px',
                          height: '32px',
                        }}
                      >
                        {categoryName === 'Higher Secondary' ? (
                          <span className="font-black text-rose-600 text-[11px] uppercase tracking-widest select-all border border-rose-500/30 bg-rose-50 px-2.5 py-0.5 rounded-full shadow-sm leading-none flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            {categoryName} Level [HS]
                          </span>
                        ) : (
                          <span className="font-extrabold text-[#1e1b4b] text-[12px] leading-none truncate select-all uppercase tracking-wider">
                            {categoryName} Level
                          </span>
                        )}
                      </div>

                      {/* Segments Overlay */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-auto text-left overflow-visible"
                        style={{
                          top: '210px',
                          left: '140px',
                          width: '385px',
                          height: '42px',
                        }}
                      >
                        <span className="font-bold text-[#1e1b4b] text-[10px] leading-tight select-all whitespace-normal break-words block w-full" title={currentReg?.selected_events || ""}>
                          {currentReg ? formatSegments(currentReg.selected_events) : ""}
                        </span>
                      </div>


                      {/* Right portion: Stub card (x: 586px to 900px) */}

                      {/* Class/Section/Roll Stub Overlay (Rotated -90deg) */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-none"
                        style={{
                          left: '640px',
                          top: '143px',
                          width: '160px',
                          height: '24px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left top',
                        }}
                      >
                        <span className="font-bold text-[#1e1b4b] text-[12px] whitespace-nowrap tracking-wide font-mono select-all">
                          {currentReg?.class || memberClass || "—"} / {currentReg?.section || memberSection || "—"} / {currentReg?.roll || memberRoll || "—"}
                        </span>
                      </div>

                      {/* Active Category Bubble Highlight */}
                      {(() => {
                        const normalizedCat = (categoryName || '').trim().toLowerCase();
                        const bubbleY = 
                          normalizedCat.includes('primary') ? 210 :
                          normalizedCat.includes('junior') ? 163 :
                          normalizedCat.includes('higher') ? 219 :
                          normalizedCat.includes('secondary') ? 117 : 71;
                        
                        const isHigherSecondary = normalizedCat.includes('higher');
                        return (
                          <div 
                            className={`absolute rounded-full flex items-center justify-center pointer-events-none transition-all duration-300 ${
                              isHigherSecondary 
                                ? 'w-5 h-5 bg-rose-600 border-2 border-rose-400 ring-2 ring-rose-500/30 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse' 
                                : 'w-3.5 h-3.5 bg-[#5c21b5] border border-[#5c21b5] shadow-sm'
                            }`}
                            style={{
                              left: isHigherSecondary ? '695px' : '678px',
                              top: `${bubbleY - (isHigherSecondary ? 10 : 7)}px`,
                            }}
                          >
                            <div className={`rounded-full bg-white ${isHigherSecondary ? 'w-2 h-2' : 'w-1.5 h-1.5'}`} />
                          </div>
                        );
                      })()}

                      {/* Category Stub Overlay (Rotated -90deg) */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-none"
                        style={{
                          left: '712px',
                          top: '200px',
                          width: '160px',
                          height: '32px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left top',
                        }}
                      >
                        {categoryName === 'Higher Secondary' ? (
                          <span className="font-black uppercase text-rose-600 text-[10px] whitespace-nowrap tracking-wider select-all border border-rose-500/30 bg-rose-50 px-2.5 py-0.5 rounded-full shadow-sm leading-none flex items-center gap-1.5 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            {categoryName}
                          </span>
                        ) : (
                          <span className="font-extrabold uppercase text-[#1e1b4b] text-[12px] whitespace-nowrap tracking-wide select-all">
                            {categoryName}
                          </span>
                        )}
                      </div>

                      {/* Segments Stub Overlay (Rotated -90deg) */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-none"
                        style={{
                          left: '730px',
                          top: '220px',
                          width: '190px',
                          height: '36px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left top',
                        }}
                      >
                        <span className="font-bold text-[#1e1b4b] text-[8.5px] leading-tight select-all whitespace-normal break-words block w-full uppercase tracking-tight" title={currentReg?.selected_events || ""}>
                          {currentReg ? formatSegments(currentReg.selected_events) : ""}
                        </span>
                      </div>

                      {/* Registration Fee Stub Overlay (Rotated -90deg) */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-none"
                        style={{
                          left: '808px',
                          top: '230px',
                          width: '160px',
                          height: '24px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left top',
                        }}
                      >
                        <span className="font-black text-[#1e1b4b] text-[12px] whitespace-nowrap font-mono select-all">
                          BDT {currentReg?.amount || 100}/-
                        </span>
                      </div>

                      {/* Unique 5 digit code on the stub right next to/after signature section */}
                      <div 
                        className="absolute flex items-start justify-start pointer-events-none"
                        style={{
                          left: '803px',
                          top: '160px',
                          width: '140px',
                          height: '28px',
                          transform: 'rotate(-90deg)',
                          transformOrigin: 'left top',
                        }}
                      >
                        <span className="font-mono text-[13px] font-black tracking-widest text-red-600 select-all border border-red-600/25 bg-red-50/70 px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
                          #{ticketCode}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>

                {/* Below-card action controls */}
                <div className="flex items-center gap-3.5 mt-8 no-print">
                  <button 
                    onClick={downloadTicketPng}
                    disabled={downloadingTicket}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    {downloadingTicket ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-zinc-100" />
                    )}
                    {downloadingTicket ? 'Saving...' : 'Download Ticket'}
                  </button>
                  <button 
                    onClick={() => window.print()}
                    className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 text-white font-heavy text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg hover:bg-white/10"
                  >
                    <Printer className="w-3.5 h-3.5 text-zinc-400" />
                    Print Ticket
                  </button>
                  <button 
                    onClick={() => setShowTicketModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-black font-black text-[10px] uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-indigo-500/10"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>

      {/* Verification Slip / Ticket Pass Modal */}
      <PurchaseSlipModal 
        candidate={activeSlipCandidate} 
        isOpen={showSlipModal} 
        documentType={profileDocType}
        onClose={() => setShowSlipModal(false)} 
      />

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
                        <GeometricAvatar name={profile?.full_name || 'Member'} size="100%" />
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

                    {profile?.avatar_url && (
                      <button 
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className={`absolute bottom-0 left-0 p-4 sm:p-3 rounded-full bg-red-500/90 hover:bg-red-600 text-white shadow-xl ${!shouldReduceGfx && !uploadingAvatar && 'hover:scale-110 transition-transform'} disabled:opacity-50 z-20`}
                        title="Remove profile picture & use geometric avatar"
                      >
                        <X className="w-5 h-5 sm:w-4 sm:h-4" />
                      </button>
                    )}

                    <button 
                      onClick={handleAvatarClick}
                      disabled={uploadingAvatar}
                      className={`absolute bottom-0 right-0 p-4 sm:p-3 rounded-full bg-[var(--c-6-start)] text-white shadow-xl ${!shouldReduceGfx && !uploadingAvatar && 'hover:scale-110 transition-transform'} disabled:opacity-50 z-20`}
                    >
                      {uploadingAvatar ? <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 animate-spin" /> : <Camera className="w-5 h-5 sm:w-4 sm:h-4" />}
                    </button>

                    {/* SHOW ID / SHOW TICKET / VERIFICATION SLIP header pill buttons */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-25">
                      {isGeneralMember && (
                        <button
                          onClick={() => {
                            if (isMember) {
                              setShowQrModal(true);
                            } else {
                              showToast('Please register yourself as a member first.', 'error');
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[var(--c-6-start)] to-[#3A1FF1] text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-[0_4px_20px_rgba(58,31,241,0.4)] active:scale-95 hover:brightness-110 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                        >
                          <QrCode className="w-3 h-3" />
                          Show ID
                        </button>
                      )}
                      {registeredEventsList.length > 0 && (
                        profileDocType === 'ticket' ? (
                          <button
                            onClick={() => {
                              setShowTicketModal(true);
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-[0_4px_20px_rgba(99,102,241,0.4)] active:scale-95 hover:brightness-110 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                          >
                            <Ticket className="w-3 h-3" />
                            Show Ticket
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              openSlipForRegistration(registeredEventsList[0]);
                            }}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-white/20 shadow-[0_4px_20px_rgba(16,185,129,0.4)] active:scale-95 hover:brightness-110 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                          >
                            <FileText className="w-3 h-3" />
                            Verification Slip
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  <h2 className="text-2xl font-bold text-white mb-2">{fullName || profile?.full_name || 'Josephite'}</h2>
                  <p className="text-sm text-zinc-500 font-medium mb-6">{cleanDisplayEmail(user.email)}</p>
                  
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
                    {isGeneralMember && (
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
                    )}
                    {registeredEventsList.length > 0 ? (
                      profileDocType === 'ticket' ? (
                        <button 
                          onClick={() => {
                            setShowTicketModal(true);
                          }}
                          className="w-full py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 group/ticket"
                        >
                          <Ticket className="w-4 h-4 group-hover/ticket:rotate-12 transition-transform" />
                          Show Ticket
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            openSlipForRegistration(registeredEventsList[0]);
                          }}
                          className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group/slip"
                        >
                          <FileText className="w-4 h-4 group-hover/slip:rotate-12 transition-transform" />
                          Verification Slip (QR Code & PDF)
                        </button>
                      )
                    ) : (
                      profileDocType === 'ticket' ? (
                        <button 
                          onClick={() => {
                            showToast('Please register for events first to view your digital ticket.', 'info');
                            router.push('/events');
                          }}
                          className="w-full py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 group/ticket"
                        >
                          <Ticket className="w-4 h-4 group-hover/ticket:rotate-12 transition-transform" />
                          Show Ticket
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            showToast('Please register for events first to view your verification slip.', 'info');
                            router.push('/events');
                          }}
                          className="w-full py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2 group/slip"
                        >
                          <FileText className="w-4 h-4 group-hover/slip:rotate-12 transition-transform" />
                          Verification Slip (QR Code & PDF)
                        </button>
                      )
                    )}
                      <button 
                        type="button"
                        onClick={() => {
                          if (isEditing) {
                            stopEditing();
                          } else {
                            startEditing();
                          }
                        }}
                        className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                        {isEditing ? 'Cancel Editing' : 'Edit Profile'}
                      </button>
                    <button 
                      onClick={handleSignOut}
                      className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
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
                {hasGeneralMemberPrivileges && (
                  <div className="flex border-b border-white/10 gap-8 mb-6">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('profile');
                        stopEditing();
                      }}
                      className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer ${
                        activeSubTab === 'profile'
                          ? 'text-[var(--c-6-start)] border-b-2 border-[var(--c-6-start)]'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      My Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveSubTab('handouts');
                        stopEditing();
                      }}
                      className={`pb-4 text-xs font-bold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                        activeSubTab === 'handouts'
                          ? 'text-[var(--c-6-start)] border-b-2 border-[var(--c-6-start)]'
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      <FileText className="w-4 h-4" />
                      Session handouts
                    </button>
                  </div>
                )}

                {activeSubTab === 'profile' || !hasGeneralMemberPrivileges ? (
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
                            onClick={stopEditing}
                            className="text-sm font-bold text-zinc-500 hover:text-white transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>

                        {(showPhoneNoticeBanner || !userPhone) && (
                          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
                            <Smartphone className="w-6 h-6 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                            <div>
                              <h4 className="text-sm font-bold uppercase tracking-wider text-amber-400 mb-1">
                                Action Required: Contact Phone Number
                              </h4>
                              <p className="text-xs text-amber-200/90 leading-relaxed font-medium">
                                Full name login is now disabled. Please confirm or input your active mobile phone number below so you can sign in anytime using your Phone Number + Password.
                              </p>
                            </div>
                          </div>
                        )}

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-amber-400 ml-1 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Mobile / Phone Number (For Login)
                          </label>
                          <input 
                            type="tel"
                            required
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            placeholder="e.g. 01712345678"
                            className="w-full px-6 py-4 bg-white/5 border border-amber-500/30 focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20 rounded-2xl focus:outline-none transition-all text-white font-mono text-base"
                          />
                          <p className="text-[11px] text-zinc-400 ml-1">
                            Use your active phone number. You can use this number to log in along with your password.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 ml-1">Given Name Only (e.g., John)</label>
                          <input 
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className={`w-full px-6 py-4 bg-white/5 border ${/\s/.test(fullName) ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : 'border-white/10 focus:border-[var(--c-6-start)]/50'} rounded-2xl focus:outline-none transition-all text-white`}
                          />
                          {/\s/.test(fullName) && (
                            <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">
                              Please type in your name without spaces or just type in your surname
                            </p>
                          )}
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
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5 flex justify-between items-center flex-wrap gap-4">
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2 flex items-center gap-1.5">
                                <Phone className="w-3.5 h-3.5 text-amber-400" /> Mobile / Phone Number (Sign-In)
                              </p>
                              <p className="text-white font-mono font-medium text-base">
                                {userPhone ? userPhone : <span className="text-amber-400 font-sans italic text-sm">Not set — Click button to add</span>}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                startEditing();
                                setShowPhoneNoticeBanner(true);
                              }}
                              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              {userPhone ? 'Update' : 'Set Phone Number'}
                            </button>
                          </div>

                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Email Address</p>
                            <p className="text-white font-medium">{cleanDisplayEmail(user.email)}</p>
                          </div>
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Member Status</p>
                            <p className={(() => {
                              const hasVerifiedEvent = registeredEventsList.some(reg => reg.verified === 'yes');
                              if (isMember && verified === 'yes') {
                                return isEc ? 'text-amber-500 font-bold' : 'text-[var(--c-6-start)] font-bold';
                              } else if (hasVerifiedEvent) {
                                return 'text-[var(--c-6-start)] font-bold';
                              } else if (verified === 'rejected' || registeredEventsList.some(reg => reg.verified === 'rejected')) {
                                return 'text-red-500 font-bold';
                              } else if (registeredEventsList.length > 0) {
                                return 'text-amber-400 animate-pulse font-bold';
                              } else {
                                return 'text-zinc-550 font-medium';
                              }
                            })()}>
                              {(() => {
                                const hasVerifiedEvent = registeredEventsList.some(reg => reg.verified === 'yes');
                                if (isMember && verified === 'yes') {
                                  return isEc ? "EC Committee Officer" : "Verified Member";
                                } else if (hasVerifiedEvent) {
                                  return "Verified Member";
                                } else if (verified === 'rejected' || registeredEventsList.some(reg => reg.verified === 'rejected')) {
                                  return "Registration Rejected";
                                } else if (registeredEventsList.length > 0) {
                                  return "Verification Pending";
                                } else {
                                  return "Not Registered";
                                }
                              })()}
                            </p>
                          </div>
                          <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Member ID</p>
                            <p className="text-white font-mono font-bold tracking-wider">
                              {memberId || 'PENDING'}
                            </p>
                          </div>

                          {/* Accessibility Settings & High-Contrast Theme Switcher */}
                          <div className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                            <div className="flex items-center gap-4">
                              <Settings className="w-6 h-6 text-[var(--c-6-start)]" />
                              <div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Accessibility & Theme Preferences</h3>
                                <p className="text-xs text-zinc-500 mt-1">Select a high-contrast mode optimized for your visual preferences and environmental lighting.</p>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                              {/* Option 1: Default */}
                              <button
                                type="button"
                                onClick={() => setTheme("default")}
                                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                                  theme === "default"
                                    ? "bg-white/10 border-[var(--c-6-start)] shadow-[0_0_15px_rgba(0,180,219,0.3)]"
                                    : "bg-black/20 border-white/5 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-white">Cosmic Dark</span>
                                  <span className="w-3.5 h-3.5 rounded-full bg-[#050505] border border-white/30" />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Default deep space aesthetic with subtle teal accents.</p>
                              </button>

                              {/* Option 2: High Contrast Dark */}
                              <button
                                type="button"
                                onClick={() => setTheme("contrast-dark")}
                                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                                  theme === "contrast-dark"
                                    ? "bg-white/10 border-white shadow-[0_0_15px_rgba(255,255,255,0.2)]"
                                    : "bg-black/20 border-white/5 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-white">Contrast Dark</span>
                                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-white" />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Pure black canvas with maximum white text contrast.</p>
                              </button>

                              {/* Option 3: Retro Amber */}
                              <button
                                type="button"
                                onClick={() => setTheme("terminal-amber")}
                                className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
                                  theme === "terminal-amber"
                                    ? "bg-white/10 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                                    : "bg-black/20 border-white/5 hover:border-white/20"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-bold text-white">Retro Amber</span>
                                  <span className="w-3.5 h-3.5 rounded-full bg-black border border-amber-500" />
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-2 font-medium">Nostalgic console amber-on-black for low eye strain.</p>
                              </button>
                            </div>
                          </div>

                          {/* Festival Calendar Schedule Notification */}
                          <div className="md:col-span-2 p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 space-y-6">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl">
                                  <Calendar className="w-6 h-6" />
                                </div>
                                <div>
                                  <h3 className="text-xl font-bold text-white uppercase tracking-wider flex items-center gap-2">
                                    {content?.festivalCalendar?.title || "10th National Math Festival Calendar"}
                                  </h3>
                                  <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-0.5">
                                    ✓ September 24, 25 & 26 Marked in Your Account Calendar
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-2">
                                <a
                                  href={getGoogleCalendarAllDaysUrl(content?.festivalCalendar)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                  <Calendar className="w-4 h-4" /> Sync Google Calendar
                                </a>
                                <button
                                  type="button"
                                  onClick={() => downloadIcsCalendar(content?.festivalCalendar?.events)}
                                  className="px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer border border-white/10"
                                >
                                  <Download className="w-4 h-4" /> iCal (.ics)
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {((Array.isArray(content?.festivalCalendar?.events) && content.festivalCalendar.events.length > 0)
                                ? content.festivalCalendar.events
                                : FESTIVAL_CALENDAR_EVENTS
                              ).map((ev: any, idx: number) => (
                                <div key={idx} className="p-5 rounded-2xl bg-black/60 border border-white/5 space-y-2 relative overflow-hidden group hover:border-indigo-500/30 transition-all">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{ev.day}</span>
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 rounded text-[9px] font-mono font-bold">{ev.dateStr}</span>
                                  </div>
                                  <h4 className="text-sm font-bold text-white leading-tight">{ev.title}</h4>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed font-sans">{ev.description}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {isGeneralMember && unverifiedRegistrations.length > 0 && (
                            <div className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 space-y-6">
                              <div className="flex items-center gap-4">
                                <Calendar className="w-6 h-6 text-amber-500" />
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Registered Event Transactions</h3>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {unverifiedRegistrations.map((reg: any) => {
                                  const events = (reg.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                  return events.map((evt: string, idx: number) => (
                                    <div key={`${reg.tableName}-${reg.id}-${idx}`} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between gap-2 relative">
                                      <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                          {reg.tableName === 'primary_events' ? 'Primary (Class 3-5)' :
                                           reg.tableName === 'junior_events' ? 'Junior (Class 6-8)' :
                                           reg.tableName === 'secondary_events' ? 'Secondary (Class 9-10)' :
                                           'Higher Secondary (Class 11-12)'}
                                        </p>
                                        <p className="text-sm font-bold text-white mt-1">{evt}</p>
                                        <p className="text-[10px] font-mono font-medium text-zinc-400 mt-0.5">TrxID: {reg.trxnid}</p>
                                      </div>
                                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                        <button
                                          onClick={() => {
                                            if (profileDocType === 'ticket') {
                                              setShowTicketModal(true);
                                            } else {
                                              openSlipForRegistration(reg);
                                            }
                                          }}
                                          className={`px-2.5 py-1 rounded-lg border text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer font-bold ${
                                            profileDocType === 'ticket'
                                              ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400'
                                              : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400'
                                          }`}
                                        >
                                          {profileDocType === 'ticket' ? (
                                            <>
                                              <Ticket className="w-3 h-3" />
                                              Event Ticket
                                            </>
                                          ) : (
                                            <>
                                              <FileText className="w-3 h-3" />
                                              Verification Slip (QR)
                                            </>
                                          )}
                                        </button>
                                        <div className="flex flex-col items-end gap-0.5">
                                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                            reg.verified === 'yes' ? 'text-green-400' :
                                            reg.verified === 'rejected' ? 'text-red-400' : 'text-amber-400 animate-pulse'
                                          }`}>
                                            {reg.verified === 'yes' ? 'Verified (Welcome!)' :
                                             reg.verified === 'rejected' ? 'Rejected' : 'Verification Pending'}
                                          </span>
                                          {reg.verified === 'yes' && (() => {
                                            const ach = achievements.find(a => String(a.event_name || '').trim().toLowerCase() === evt.trim().toLowerCase());
                                            if (ach) {
                                              const matchText = `${String(ach.event_name || '').trim()} - ${String(ach.category || '').trim()}`.toLowerCase();
                                              const isAnnounced = announcedResults.some(announced => String(announced || '').trim().toLowerCase() === matchText);
                                              
                                              let resultLabel = "Result Pending";
                                              let resultColorClass = "text-indigo-400";
                                              
                                              if (isAnnounced) {
                                                if (isActualWin(ach.position)) {
                                                  const rank = getRankInfo(ach.position);
                                                  resultLabel = rank.label;
                                                  resultColorClass = "text-amber-400 font-extrabold";
                                                } else {
                                                  resultLabel = "Participation Certificate";
                                                  resultColorClass = "text-emerald-400";
                                                }
                                              }
                                              
                                              return (
                                                <span className={`text-[10px] uppercase font-bold tracking-wider ${resultColorClass}`}>
                                                  {resultLabel}
                                                </span>
                                              );
                                            }
                                            return (
                                              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400/80">
                                                Result Pending
                                              </span>
                                            );
                                          })()}
                                        </div>
                                      </div>
                                    </div>
                                  ));
                                })}
                              </div>
                            </div>
                          )}

                          {!isGeneralMember && unverifiedRegistrations.length > 0 && (
                            <div className="md:col-span-2 p-8 rounded-[2rem] bg-gradient-to-br from-[#0c1220] to-[#05070a] border border-indigo-500/20 space-y-6 relative overflow-hidden shadow-2xl">
                              <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />
                              <div className="flex flex-wrap items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                  <Calendar className="w-6 h-6 text-indigo-400" />
                                  <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-wider">Event Entry Passes</h3>
                                    <p className="text-[10px] font-mono font-medium text-zinc-500 uppercase tracking-widest mt-0.5">External/Teammate Track</p>
                                  </div>
                                </div>
                                <span className="px-3 py-1 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest border border-indigo-500/20">
                                  Non-General Participant
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                                {unverifiedRegistrations.map((reg: any) => {
                                  const eventsList = (reg.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                                  return eventsList.map((evt: string, idx: number) => {
                                    const displayId = 'EVT-' + (reg.id?.split('-')[0]?.toUpperCase() || reg.trxnid || 'PENDING');
                                    return (
                                      <div 
                                        key={`${reg.tableName}-${reg.id}-${idx}`} 
                                        className="relative flex flex-col justify-between p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all duration-300 overflow-hidden group shadow-lg"
                                      >
                                        <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#020202] border-r border-white/10 opacity-70" />
                                        <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#020202] border-l border-white/10 opacity-70" />
                                        
                                        <div className="space-y-4 px-2">
                                          <div className="flex items-center justify-between">
                                            <p className="text-[9px] font-black uppercase tracking-wider text-indigo-400">
                                              {reg.tableName === 'primary_events' ? 'Primary' :
                                               reg.tableName === 'junior_events' ? 'Junior' :
                                               reg.tableName === 'secondary_events' ? 'Secondary' :
                                               'Higher Secondary'}
                                            </p>
                                            <span className="text-[9px] font-mono font-bold text-zinc-505 select-all">{displayId}</span>
                                          </div>
                                          
                                          <div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-wider group-hover:text-indigo-300 transition-colors duration-300">{evt}</h4>
                                            
                                            {(reg.team_name || (Array.isArray(reg.team_members) && reg.team_members.length > 0)) && (
                                              <div className="mt-1.5 p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px]">
                                                <div className="flex items-center gap-1 font-bold text-amber-400">
                                                  <Users className="w-3 h-3" />
                                                  <span>Team: {reg.team_name || 'Team Event'}</span>
                                                </div>
                                                {Array.isArray(reg.team_members) && reg.team_members.length > 0 && (
                                                  <div className="mt-1 space-y-0.5 text-zinc-400 font-sans">
                                                    <span className="text-[9px] uppercase font-bold text-zinc-500 block">Members:</span>
                                                    {reg.team_members.map((m: any, mIdx: number) => (
                                                      <span key={mIdx} className="inline-block mr-2 text-[10px] text-zinc-300">
                                                        {mIdx === 0 ? '👑 ' : '• '}{m.name || m} {m.class ? `(${m.class})` : ''}
                                                      </span>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            )}

                                            <div className="flex gap-4 mt-2 font-mono">
                                              <div>
                                                <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-550 block">TrxID</span>
                                                <span className="block text-[10px] font-bold text-zinc-300 select-all">{reg.trxnid}</span>
                                              </div>
                                              <div>
                                                <span className="text-[8px] uppercase font-bold tracking-wider text-zinc-550 block">Amount</span>
                                                <span className="block text-[10px] font-bold text-zinc-300">BDT {reg.amount}</span>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5 px-2">
                                          <button
                                            onClick={() => {
                                              if (profileDocType === 'ticket') {
                                                setShowTicketModal(true);
                                              } else {
                                                openSlipForRegistration(reg);
                                              }
                                            }}
                                            className={`px-2.5 py-1 rounded-lg border text-[9px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer font-bold ${
                                              profileDocType === 'ticket'
                                                ? 'bg-indigo-500/10 border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-400'
                                                : 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400'
                                            }`}
                                          >
                                            {profileDocType === 'ticket' ? (
                                              <>
                                                <Ticket className="w-3 h-3" />
                                                Event Ticket
                                              </>
                                            ) : (
                                              <>
                                                <FileText className="w-3 h-3" />
                                                Verification Slip (QR)
                                              </>
                                            )}
                                          </button>
                                          <div className="flex flex-col items-end gap-0.5">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                              reg.verified === 'yes' ? 'text-emerald-400' :
                                              reg.verified === 'rejected' ? 'text-rose-400' : 'text-amber-400 animate-pulse'
                                            }`}>
                                              {reg.verified === 'yes' ? 'Verified' :
                                               reg.verified === 'rejected' ? 'Rejected' : 'Pending Approval'}
                                            </span>
                                            {reg.verified === 'yes' && (() => {
                                              const ach = achievements.find(a => String(a.event_name || '').trim().toLowerCase() === evt.trim().toLowerCase());
                                              if (ach) {
                                                const matchText = `${String(ach.event_name || '').trim()} - ${String(ach.category || '').trim()}`.toLowerCase();
                                                const isAnnounced = announcedResults.some(announced => String(announced || '').trim().toLowerCase() === matchText);
                                                
                                              let resultLabel = "Result Pending";
                                              let resultColorClass = "text-indigo-400";
                                              
                                              if (isAnnounced) {
                                                if (isActualWin(ach.position)) {
                                                  const rank = getRankInfo(ach.position);
                                                  resultLabel = rank.label;
                                                  resultColorClass = "text-amber-400 font-extrabold";
                                                } else {
                                                  resultLabel = "Participation Certificate";
                                                  resultColorClass = "text-emerald-400";
                                                }
                                              }
                                                
                                                return (
                                                  <span className={`text-[10px] uppercase font-bold tracking-wider ${resultColorClass}`}>
                                                    {resultLabel}
                                                  </span>
                                                );
                                              }
                                              return (
                                                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400/85">
                                                  Result Pending
                                                </span>
                                              );
                                            })()}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  });
                                })}
                              </div>
                            </div>
                          )}
                   
                          {wins.length > 0 && (
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


                            </div>
                          )}
                          {isMember && (() => {
                            const hasVerifiedEvent = registeredEventsList.some(reg => reg.verified === 'yes');
                            const isPaid = (verified === 'yes') || hasVerifiedEvent;
                            return (
                              <div className="p-8 rounded-3xl bg-white/5 border border-white/5">
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">Payment Status</p>
                                <p className={`font-bold ${isPaid ? 'text-emerald-400 font-bold' : 'text-amber-400 animate-pulse font-bold'}`}>
                                  {isPaid ? 'Paid' : 'Verifying'}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                ) : (
                  <div className="p-8 md:p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                    <div className="space-y-6">
                      <div className="border-b border-white/5 pb-6">
                        <h3 className="text-2xl font-bold text-white mb-2">
                          {content?.handouts?.title || "Session Handouts"}
                        </h3>
                        <p className="text-sm text-zinc-500 font-medium">
                          {content?.handouts?.description || "Access official handouts, session notes, and resources compiled by the club moderators."}
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-6 pt-2">
                        {(!content?.handouts?.sessions || content.handouts.sessions.length === 0) ? (
                          <div className="p-12 text-center rounded-3xl bg-white/[0.01] border border-white/5 text-zinc-500">
                            <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                            <p className="text-sm font-medium">No session handouts have been posted yet.</p>
                            <p className="text-xs text-zinc-700 mt-1">Please check back later or contact a club admin.</p>
                          </div>
                        ) : (
                          content.handouts.sessions.map((session: any) => (
                            <div 
                              key={session.id} 
                              className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-amber-500/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden group"
                            >
                              <div className="space-y-2 max-w-xl">
                                <div className="flex items-center gap-3">
                                  <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider border border-amber-500/10">
                                    {session.name || "Session"}
                                  </span>
                                  {session.date && (
                                    <span className="text-[10px] font-mono text-zinc-500 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {session.date}
                                    </span>
                                  )}
                                </div>
                                <h4 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                                  {session.name || "Untitled Session"}
                                </h4>
                                <p className="text-sm text-zinc-400 leading-relaxed">
                                  {session.description || "No description provided."}
                                </p>
                              </div>

                              <div className="flex-shrink-0 flex items-center">
                                {session.fileUrl ? (
                                  <a 
                                    href={session.fileUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="px-6 py-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 font-bold hover:bg-amber-500/20 transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-widest group/btn cursor-pointer"
                                  >
                                    <Download className="w-4 h-4 group-hover/btn:translate-y-0.5 transition-transform" />
                                    Download Handout
                                  </a>
                                ) : (
                                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-600 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                                    File Pending
                                  </span>
                                )}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Registration Link */}
                {!isMember && !checkingMember && (content?.registration?.registrationOpen !== false || isAdmin) && (
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
