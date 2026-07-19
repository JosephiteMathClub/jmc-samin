"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Edit3, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Copy,
  Printer,
  Download,
  User,
  Phone,
  Mail,
  School as SchoolIcon,
  BookOpen,
  Hash,
  Layers,
  Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import ScrollReveal from '../components/ScrollReveal';
import { DashboardFileUpload } from '../components/dashboard/DashboardFileUpload';
import Image from 'next/image';
import { resolveImageUrl, cleanDisplayEmail } from '../lib/utils';
import GeometricAvatar from '../components/GeometricAvatar';

import { usePerformance } from '../hooks/usePerformance';

const RegisterMember = () => {
  const { user, profile, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const { content, loading: contentLoading } = useContent();
  const router = useRouter();
  const { showToast } = useToast();
  const { shouldReduceGfx } = usePerformance();
  
  const [fullName, setFullName] = useState('');
  const [school, setSchool] = useState('St Joseph');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [roll, setRoll] = useState('');
  const [phone, setPhone] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [memberId, setMemberId] = useState('');
  const [agreed, setAgreed] = useState(false);
  
  const [paymentMethod, setPaymentMethod] = useState<'bkash' | 'cash' | ''>('');
  const [trxnid, setTrxnid] = useState('');
  const [bkashNumber, setBkashNumber] = useState('');
  const [verified, setVerified] = useState('no');
  const [isMember, setIsMember] = useState(false);
  const [checkingMember, setCheckingMember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPrintView, setShowPrintView] = useState(false);
  
  // Admin-specific registration states
  const [registerFor, setRegisterFor] = useState<'self' | 'other' | null>(null);
  const [hasAccount, setHasAccount] = useState<boolean | null>(null);
  const [searchEmail, setSearchEmail] = useState('');
  const [searching, setSearching] = useState(false);
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [existingProfile, setExistingProfile] = useState<any>(null);

  // New proxy state variables for General / EC Member Registration
  const [isProxyRegistration, setIsProxyRegistration] = useState(false);
  const [proxyMethod, setProxyMethod] = useState<'email' | 'phone'>('email');
  const [proxyEmail, setProxyEmail] = useState('');
  const [proxyPhoneNumber, setProxyPhoneNumber] = useState('');
  const [proxyVerified, setProxyVerified] = useState(false);
  const [proxyUserExists, setProxyUserExists] = useState(false);
  const [proxyResolvedUserId, setProxyResolvedUserId] = useState<string | null>(null);
  const [checkingProxyEmail, setCheckingProxyEmail] = useState(false);
  const [proxyNameEditable, setProxyNameEditable] = useState(true);
  const [proxyClassEditable, setProxyClassEditable] = useState(true);
  const [proxySectionEditable, setProxySectionEditable] = useState(true);
  const [proxyRollEditable, setProxyRollEditable] = useState(true);

  const handleToggleProxy = (enable: boolean) => {
    setIsProxyRegistration(enable);
    if (enable) {
      setRegisterFor('other');
      setProxyMethod('email');
      setProxyEmail('');
      setProxyPhoneNumber('');
      setProxyVerified(false);
      setProxyUserExists(false);
      setProxyResolvedUserId(null);
      setFullName('');
      setEmailAddress('');
      setPhone('');
      setClassName('');
      setSection('');
      setRoll('');
    } else {
      setRegisterFor('self');
      resetForm();
    }
  };

  const handleVerifyProxyEmail = async () => {
    const searchVal = proxyMethod === 'email' ? proxyEmail.trim() : proxyPhoneNumber.trim();
    if (!searchVal) {
      showToast("Please provide a search identifier", "error");
      return;
    }

    setCheckingProxyEmail(true);
    setError(null);

    try {
      let finalEmail = searchVal;
      if (proxyMethod === 'phone') {
        const { data: memberData } = await supabase
          .from('member')
          .select('email')
          .eq('phone', searchVal)
          .maybeSingle();

        if (memberData?.email) {
          finalEmail = memberData.email;
        } else {
          const { data: ecData } = await supabase
            .from('ec_member')
            .select('email')
            .eq('phone', searchVal)
            .maybeSingle();

          if (ecData?.email) {
            finalEmail = ecData.email;
          } else {
            finalEmail = `${searchVal}@josephitre.club`;
          }
        }
      } else {
        finalEmail = finalEmail.toLowerCase();
      }

      const { data: profiles, error: searchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', finalEmail)
        .maybeSingle();

      if (searchError) throw searchError;

      if (profiles) {
        setProxyUserExists(true);
        setProxyVerified(true);
        setProxyResolvedUserId(profiles.id);
        setFullName(profiles.full_name || '');
        setEmailAddress(profiles.email || '');
        
        const { data: memberData } = await supabase
          .from('member')
          .select('*')
          .eq('id', profiles.id)
          .maybeSingle();

        if (memberData) {
          setPhone(memberData.phone || '');
          setSchool(memberData.school || 'St Joseph');
          setClassName(memberData.class || '');
          setSection(memberData.section || '');
          setRoll(memberData.roll || '');
          setPhotoUrl(memberData.photo_url || '');
          setProxyNameEditable(false);
          setProxyClassEditable(false);
          setProxySectionEditable(false);
          setProxyRollEditable(false);
        } else {
          setPhone(profiles.phone || '');
          setProxyNameEditable(false);
          setProxyClassEditable(true);
          setProxySectionEditable(true);
          setProxyRollEditable(true);
        }
        showToast("Registered account found!", "success");
      } else {
        setProxyUserExists(false);
        setProxyVerified(true);
        setProxyResolvedUserId(null);
        setProxyNameEditable(true);
        setProxyClassEditable(true);
        setProxySectionEditable(true);
        setProxyRollEditable(true);
        setFullName('');
        if (proxyMethod === 'email') {
          setEmailAddress(finalEmail);
          setPhone('');
        } else {
          setPhone(searchVal);
          setEmailAddress(finalEmail);
        }
        showToast("No account found. Ready for unregistered spot creation.", "info");
      }
    } catch (err: any) {
      console.error("Proxy verify error:", err);
      showToast("Verification failed: " + err.message, "error");
    } finally {
      setCheckingProxyEmail(false);
    }
  };

  const resetForm = () => {
    setFullName('');
    setEmailAddress('');
    setPhone('');
    setClassName('');
    setSection('');
    setRoll('');
    setPhotoUrl('');
    setPaymentMethod('');
    setTrxnid('');
    setBkashNumber('');
    setFoundUserId(null);
    setHasAccount(null);
    setSearchEmail('');
    setAgreed(false);
    setError(null);
  };

  const checkMemberStatus = React.useCallback(async () => {
    if (!user) {
      setCheckingMember(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('member')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (data) {
        setIsMember(true);
        setVerified(data.verified || 'no');
        setPaymentMethod(data.payment_method || 'cash');
        setTrxnid(data.trxnid || '');
        setBkashNumber(data.bkash_number || '');
        setFullName(data.full_name || '');
        setSchool(data.school || 'St Joseph');
        setClassName(data.class || '');
        setSection(data.section || '');
        setRoll(data.roll || '');
        setPhone(data.phone || '');
        setEmailAddress(data.email_address || user.email || '');
        setPhotoUrl(data.photo_url || '');
        setMemberId(data.member_id || '');
      }
    } catch (err) {
      console.error('Error checking member status:', err);
    } finally {
      setCheckingMember(false);
    }
  }, [user]);

  useEffect(() => {
    // Safety timeout: resolve loading state if it takes too long
    const timer = setTimeout(() => {
      if (checkingMember) {
        console.warn('Registration: Member check timed out, proceeding anyway.');
        setCheckingMember(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [checkingMember]);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setCheckingMember(false);
      const currentPath = window.location.pathname + window.location.search;
      router.push('/login?redirect=' + encodeURIComponent(currentPath));
      return;
    }

    // Set default mode for normal users (not admin)
    if (!isAdmin && registerFor === null) {
      setRegisterFor('self');
    }

    // Check member status as soon as we have a user
    if (checkingMember) {
      checkMemberStatus();
    }

    // Pre-fill profile info if registering for self and we have a profile
    if (profile && registerFor === 'self' && fullName === '') {
      setFullName(profile.full_name || '');
      setEmailAddress(user?.email || '');
    }
  }, [user, authLoading, isAdmin, router, profile, checkMemberStatus, registerFor, checkingMember, fullName]);

  const handleSearchUser = async () => {
    if (!searchEmail) return;
    setSearching(true);
    setError(null);
    try {
      let finalSearch = searchEmail.trim();
      const isPhoneInput = !finalSearch.includes('@') && /^[0-9+\s\-()]+$/.test(finalSearch);
      const isEmailInput = finalSearch.includes('@');
      const isNameInput = !isPhoneInput && !isEmailInput;
      
      if (isPhoneInput) {
        try {
          const { data: memberData } = await supabase
            .from('member')
            .select('email')
            .eq('phone', finalSearch)
            .maybeSingle();
          if (memberData?.email) {
            finalSearch = memberData.email;
          } else {
            const { data: ecData } = await supabase
              .from('ec_member')
              .select('email')
              .eq('phone', finalSearch)
              .maybeSingle();
            if (ecData?.email) {
              finalSearch = ecData.email;
            } else {
              finalSearch = `${finalSearch}@josephitre.club`;
            }
          }
        } catch (e) {
          console.error("Error resolving email from phone:", e);
          finalSearch = `${finalSearch}@josephitre.club`;
        }
      } else {
        finalSearch = finalSearch.toLowerCase();
      }

      if (isNameInput) {
        const slug = finalSearch.replace(/[^a-z0-9]/g, '_').replace(/__+/g, '_').replace(/^_+|_+$/g, '');
        const virtualEmail = `${slug}@josephitre.club`;
        
        const { data: profiles, error: searchError } = await supabase
          .from('profiles')
          .select('*')
          .or(`full_name.ilike.%${searchEmail.trim()}%,email.eq.${virtualEmail}`);
        
        if (searchError) throw searchError;
        
        if (profiles && profiles.length > 0) {
          const matched = profiles[0];
          setFoundUserId(matched.id);
          setExistingProfile(matched);
          setFullName(matched.full_name || '');
          setEmailAddress(matched.email || '');
          showToast('User found!', 'success');
        } else {
          setError('No user found with this Full Name or virtual email.');
          setFoundUserId(null);
          setExistingProfile(null);
        }
      } else {
        const { data: profiles, error: searchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', finalSearch);
        
        if (searchError) throw searchError;
        
        if (profiles && profiles.length > 1) {
          showToast(`Multiple profiles found with this email. Please search by their Full Name to verify specifically.`, "info");
          const matched = profiles[0];
          setFoundUserId(matched.id);
          setExistingProfile(matched);
          setFullName(matched.full_name || '');
          setEmailAddress(matched.email || '');
        } else if (profiles && profiles.length === 1) {
          const matched = profiles[0];
          setFoundUserId(matched.id);
          setExistingProfile(matched);
          setFullName(matched.full_name || '');
          setEmailAddress(matched.email || '');
          showToast('User found!', 'success');
        } else {
          setError('No user found with this email or phone number.');
          setFoundUserId(null);
          setExistingProfile(null);
        }
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSearching(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      showToast("File is too large. Maximum size is 2MB.", "error");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Only .jpg, .png, and .webp formats are allowed.", "error");
      return;
    }

    setUploading('photo');

    try {
      const extension = file.name.split('.').pop() || 'png';
      const fileName = `${user?.id}-${Date.now()}.${extension}`;
      const filePath = `members/${fileName}`;

      let uploadError = null;
      let finalPath = '';

      // Try 'images' bucket
      try {
        const { error } = await supabase.storage
          .from('images')
          .upload(filePath, file, { upsert: true });
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('images').getPublicUrl(filePath);
          finalPath = publicUrl;
        } else {
          uploadError = error;
        }
      } catch (e) {
        uploadError = e;
      }

      // Fallback to 'avatars' bucket
      if (!finalPath) {
        try {
          const { error } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, { upsert: true });
          if (!error) {
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            finalPath = publicUrl;
            uploadError = null;
          }
        } catch (e) {}
      }

      if (!finalPath && uploadError) throw uploadError;

      setPhotoUrl(finalPath);
      showToast("Photo uploaded successfully!", "success");
    } catch (error: any) {
      console.error("Upload error:", error);
      showToast(`Upload failed: ${error.message}`, "error");
    } finally {
      setUploading(null);
    }
  };

  const handleRegisterMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      showToast('Please agree to the declaration', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    // Basic Input Validation
    if (!isProxyRegistration && /\s/.test(fullName)) {
      const spaceError = 'Please type in your name without spaces or just type in your surname';
      setError(spaceError);
      showToast(spaceError, 'error');
      setLoading(false);
      return;
    }
    if (fullName.length > 100) {
      showToast('Full name is too long', 'error');
      setLoading(false);
      return;
    }
    if (phone.length > 20) {
      showToast('Phone number is too long', 'error');
      setLoading(false);
      return;
    }
    if (roll.length > 20) {
      showToast('Roll number is too long', 'error');
      setLoading(false);
      return;
    }

    try {
      let finalUserId = user?.id;

      // If admin registering for someone else using old hasAccount/foundUserId
      if (isAdmin && registerFor === 'other' && !isProxyRegistration) {
        if (!foundUserId) {
          showToast('Please find an existing user first', 'error');
          setLoading(false);
          return;
        }
        finalUserId = foundUserId;
      }

      // If admin registering via the new proxy/spot mode
      if (isAdmin && isProxyRegistration) {
        if (!proxyVerified) {
          showToast("Please search and verify student identity first", "error");
          setLoading(false);
          return;
        }

        const resolvedPhone = proxyPhoneNumber.trim();
        const resolvedEmail = proxyMethod === 'phone' ? `${resolvedPhone}@josephitre.club` : emailAddress.trim();

        if (!resolvedPhone) {
          showToast("Student's Phone Number is required for proxy registration", "error");
          setLoading(false);
          return;
        }

        if (!proxyUserExists || !proxyResolvedUserId) {
          // Create new user account via admin endpoint
          showToast("Creating spot registration account...", "info");
          const createRes = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: resolvedEmail,
              password: resolvedPhone,
              fullName: fullName.trim(),
              usePhoneAsLogin: proxyMethod === 'phone'
            })
          });

          const createData = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createData.error || "Failed to create spot registration user account.");
          }

          if (!createData.userId) {
            throw new Error("No user ID returned from spot account creation.");
          }

          finalUserId = createData.userId;
          showToast("Spot registration account created successfully!", "success");
        } else {
          finalUserId = proxyResolvedUserId;
        }
      }

      const finalEmailAddress = isProxyRegistration 
        ? (proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : emailAddress.trim())
        : (registerFor === 'self' ? user?.email : emailAddress);

      // 1. Insert into member table
      const { error: memberError } = await supabase
        .from('member')
        .upsert({
          id: finalUserId,
          full_name: fullName,
          email: finalEmailAddress,
          email_address: finalEmailAddress,
          phone: isProxyRegistration ? proxyPhoneNumber.trim() : phone,
          school,
          class: className,
          section,
          roll,
          photo_url: photoUrl,
          payment_method: isProxyRegistration ? 'cash' : paymentMethod,
          trxnid: isProxyRegistration ? ('PROXY-' + Math.floor(100000 + Math.random() * 900000)) : (paymentMethod === 'bkash' ? trxnid : null),
          bkash_number: isProxyRegistration ? ('PROXY: ' + (user?.email || 'Admin')) : (paymentMethod === 'bkash' ? bkashNumber : null),
          verified: isProxyRegistration ? 'yes' : 'no'
        });

      if (memberError) throw memberError;

      // 2. Update profile (only necessary info)
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName
        })
        .eq('id', finalUserId);

      if (profileError) throw profileError;

      if (registerFor === 'self') {
        await refreshProfile();
        setIsMember(true);
      } else {
        // Form is cleared on "Register Another" click or we can clear it here too
      }
      
      setSuccess(true);
      showToast('Registration successful!', 'success');

      // Send automatic notification email for pending member registration
      const targetEmail = finalEmailAddress;
      if (targetEmail) {
        fetch('/api/admin/bulk-verification-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            members: [{
              email: targetEmail,
              fullName: fullName,
              memberId: isProxyRegistration ? 'Registered Spot (Auto)' : 'Pending Verification'
            }]
          })
        }).catch(err => console.error("Failed to send automatic verification email:", err));
      }
    } catch (err: any) {
      setError(err.message);
      showToast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingMember || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-transparent pt-32 pb-24 relative">
      {/* Background Elements */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[600px] h-[600px] bg-amber-500/5 -top-48 -left-24" />
          <div className="atmospheric-glow w-[700px] h-[700px] bg-indigo-500/5 bottom-0 -right-24" />
        </>
      )}

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto">
          <ScrollReveal direction="up">
            <div className="mb-12 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
                <Sparkles className="w-3 h-3" />
                Member Registration
              </div>
              <h1 className="text-5xl font-display font-bold text-white mb-4 tracking-tighter uppercase">
                JOIN THE <span className="gold-text">INTRA-EVENTS</span>
              </h1>
              <p className="text-zinc-500 font-medium">Complete your details to access exclusive club activities.</p>
            </div>

            {isAdmin && !success && (
              <div className="mb-12 flex flex-col items-center gap-6">
                {/* Proxy/Spot Registration Block */}
                <div className="w-full flex flex-col p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5 text-left">
                      <h4 className="text-xs font-black uppercase tracking-wider text-amber-500">Proxy / Spot Registration Mode</h4>
                      <p className="text-[10px] text-zinc-400">Bypass payment gateway and manually register any participant instantly.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleProxy(!isProxyRegistration)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer shrink-0 ${
                        isProxyRegistration 
                          ? 'bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20' 
                          : 'bg-zinc-900 hover:bg-zinc-800 border-white/5 text-zinc-400 hover:text-white'
                      }`}
                    >
                      {isProxyRegistration ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {isProxyRegistration && (
                    <div className="pt-4 border-t border-white/5 space-y-4 w-full text-left">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Search & Register Student using:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProxyMethod('email');
                              setProxyEmail('');
                              setProxyVerified(false);
                              setProxyUserExists(false);
                              setProxyResolvedUserId(null);
                              setFullName('');
                              setPhone('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proxyMethod === 'email'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-md'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProxyMethod('phone');
                              setProxyEmail('');
                              setProxyVerified(false);
                              setProxyUserExists(false);
                              setProxyResolvedUserId(null);
                              setFullName('');
                              setEmailAddress('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proxyMethod === 'phone'
                                ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-md'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Phone Number
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proxyMethod === 'email' ? (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Email Address (User ID)</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="email"
                                  placeholder="student@example.com"
                                  value={proxyEmail}
                                  onChange={(e) => {
                                    setProxyEmail(e.target.value);
                                    setEmailAddress(e.target.value);
                                    setProxyVerified(false);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleVerifyProxyEmail}
                                disabled={checkingProxyEmail}
                                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {checkingProxyEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Search
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Phone Number (User ID & Password)</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="text"
                                  placeholder="017XXXXXXXX"
                                  value={proxyPhoneNumber}
                                  onChange={(e) => {
                                    setProxyPhoneNumber(e.target.value);
                                    setPhone(e.target.value);
                                    setProxyVerified(false);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleVerifyProxyEmail}
                                disabled={checkingProxyEmail}
                                className="px-4 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {checkingProxyEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Search
                              </button>
                            </div>
                          </div>
                        )}

                        {proxyMethod === 'email' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              Student's Contact Phone Number {proxyVerified && !proxyUserExists && <span className="text-amber-500 font-bold">(Password)</span>}
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="017XXXXXXXX"
                                value={proxyPhoneNumber}
                                onChange={(e) => {
                                  setProxyPhoneNumber(e.target.value);
                                  setPhone(e.target.value);
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {!isProxyRegistration && (
                  <>
                    <div className="flex flex-col items-center gap-4">
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.3em]">Select Registration Mode</p>
                      <div className="flex gap-4 p-1 rounded-2xl bg-white/5 border border-white/10">
                        <button 
                          onClick={() => {
                            setRegisterFor('self');
                            if (profile) {
                              setFullName(profile.full_name || '');
                              setEmailAddress(user?.email || '');
                            }
                          }}
                          className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${registerFor === 'self' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                          Registering for Myself
                        </button>
                        <button 
                          onClick={() => {
                            setRegisterFor('other');
                            resetForm();
                            setRegisterFor('other'); // Restore after resetForm clears it
                          }}
                          className={`px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${registerFor === 'other' ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' : 'text-zinc-500 hover:text-white'}`}
                        >
                          Registering for Someone Else
                        </button>
                      </div>
                    </div>

                    {registerFor === 'other' && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full space-y-6"
                      >
                        <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                          <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] text-center">Account Verification</p>
                          <h4 className="text-sm font-bold text-white text-center">Does the user have an existing account on this website?</h4>
                          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                            <button 
                              onClick={() => setHasAccount(true)}
                              className={`flex-1 px-8 py-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${hasAccount === true ? 'bg-white/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/10' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                              Yes, Link Existing
                            </button>
                            <button 
                              onClick={() => setHasAccount(false)}
                              className={`flex-1 px-8 py-4 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all ${hasAccount === false ? 'bg-white/10 border-amber-500/50 text-white shadow-lg shadow-amber-500/10' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                            >
                              No, they don't have
                            </button>
                          </div>
                        </div>

                        {hasAccount === true && (
                          <div className="space-y-6">
                            {!foundUserId ? (
                              <div className="flex gap-4">
                                <input 
                                  type="text"
                                  placeholder="Enter user's account email, phone, or Full Name"
                                  value={searchEmail}
                                  onChange={(e) => setSearchEmail(e.target.value)}
                                  className="flex-1 px-6 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 text-white font-bold text-sm"
                                />
                                <button 
                                  onClick={handleSearchUser}
                                  disabled={searching}
                                  className="px-8 py-4 bg-white/10 border border-white/10 rounded-2xl text-white font-bold text-xs uppercase tracking-widest hover:bg-white/20 transition-all disabled:opacity-50"
                                >
                                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                                </button>
                              </div>
                            ) : (
                              <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 flex items-center gap-6"
                              >
                                <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                                  {existingProfile?.avatar_url ? (
                                    <Image 
                                      src={resolveImageUrl(existingProfile.avatar_url)} 
                                      alt={existingProfile.full_name || 'User'}
                                      fill
                                      className="object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <GeometricAvatar name={existingProfile?.full_name || 'User'} size="100%" className="!rounded-2xl" />
                                  )}
                                </div>
                                <div className="flex-grow min-w-0">
                                  <div className="text-zinc-500 text-[8px] md:text-[9px] font-mono tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                                    <CheckCircle2 className="w-3 h-3 text-green-500" />
                                    Authenticated_Record
                                  </div>
                                  <h4 className="text-lg md:text-xl font-display font-medium text-white mb-1 truncate">{existingProfile?.full_name}</h4>
                                  <p className="text-zinc-500 text-xs truncate">{cleanDisplayEmail(existingProfile?.email)}</p>
                                </div>
                                <button 
                                  onClick={() => {
                                    setFoundUserId(null);
                                    setHasAccount(null);
                                    setExistingProfile(null);
                                    setSearchEmail('');
                                    setFullName('');
                                    setEmailAddress('');
                                  }}
                                  className="p-3 rounded-xl bg-white/5 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 transition-all border border-transparent hover:border-red-500/20"
                                  title="Change User"
                                >
                                  <Edit3 className="w-5 h-5" />
                                </button>
                              </motion.div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            )}

            {(content?.registration?.registrationOpen === false && !isAdmin) ? (
              <div className="p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center space-y-8">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto border border-amber-500/30">
                  <AlertCircle className="w-10 h-10 text-amber-500" />
                </div>
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-white uppercase tracking-tight">Registration Closed</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed max-w-sm mx-auto">
                    {content?.registration?.registrationClosedMessage || "Registration for the current intra-events is currently closed. Please stay tuned for future updates."}
                  </p>
                </div>
                <div className="pt-8 border-t border-white/5">
                  <button 
                    onClick={() => router.push('/')}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white text-xs font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                  >
                    Return Home
                  </button>
                </div>
              </div>
            ) : (isMember && registerFor === 'self' && !success) || (isAdmin && registerFor === null && !success) ? (
              <div className="p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center space-y-8">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mx-auto border border-amber-500/30">
                  <User className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {isAdmin ? 'Choose Registration Mode' : 'Already a Member'}
                  </h3>
                  <p className="text-zinc-500 max-w-sm mx-auto">
                    {isAdmin 
                      ? 'Please select whether you are registering for yourself or enrolling another member into the system.' 
                      : 'You are already registered and verified in our system. You can view your credentials in your profile.'}
                  </p>
                </div>
                {!isAdmin && (
                  <div className="pt-8 border-t border-white/5">
                    <button 
                      onClick={() => router.push('/profile')}
                      className="px-8 py-4 rounded-2xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all"
                    >
                      View My Profile
                    </button>
                  </div>
                )}
              </div>
            ) : success ? (
              <div className="p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center space-y-8">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mx-auto border border-amber-500/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {registerFor === 'self' ? 'Registration Complete!' : 'Member Registered!'}
                  </h3>
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-zinc-500">
                      {registerFor === 'self' 
                        ? 'You are a member of the Josephite Math Club.' 
                        : 'The member has been successfully added to the database.'}
                    </p>
                    
                    <div className="w-full max-w-sm space-y-3">
                      {registerFor === 'self' && (
                        <>
                          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payment Status</span>
                            <span className={`text-xs font-bold uppercase tracking-widest ${
                              verified === 'yes' ? 'text-green-500' : 'text-amber-500'
                            }`}>
                              {verified === 'yes' ? 'Paid' : 'Verifying'}
                            </span>
                          </div>

                          <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Membership</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-white">
                              General Member
                            </span>
                          </div>
                        </>
                      )}

                      {memberId && registerFor === 'self' && (
                        <div className="px-6 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">Member ID</span>
                          <span className="text-sm font-mono font-bold text-white tracking-widest">
                            {memberId}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {registerFor === 'self' && success ? (
                    <button 
                      onClick={() => window.close()}
                      className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all w-full sm:w-auto"
                    >
                      Close This Tab
                    </button>
                  ) : registerFor === 'other' && success ? (
                    <button 
                      onClick={() => {
                        setSuccess(false);
                        resetForm();
                      }}
                      className="px-8 py-4 rounded-2xl bg-amber-500 text-black font-bold hover:bg-amber-400 transition-all w-full sm:w-auto uppercase tracking-widest text-xs"
                    >
                      Register Another
                    </button>
                  ) : (
                    <button 
                      onClick={() => router.push('/')}
                      className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all w-full sm:w-auto"
                    >
                      Return Home
                    </button>
                  )}
                </div>
              </div>
            ) : (registerFor === 'self') || (isProxyRegistration ? proxyVerified : (registerFor === 'other' && (hasAccount === false || (hasAccount === true && foundUserId)))) ? (
              <div className="p-8 md:p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl">
                <form onSubmit={handleRegisterMember} className="space-y-10">
                  {/* Photo Upload Section */}
                  <div className="flex flex-col items-center gap-6 pb-8 border-b border-white/5">
                    <DashboardFileUpload 
                      label="Passport Size Photo"
                      value={photoUrl}
                      uploading={uploading === 'photo'}
                      onUpload={handleFileUpload}
                      onDelete={() => setPhotoUrl('')}
                      description="Recommended for the membership card"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <User className="w-3 h-3" /> Full Name
                      </label>
                      <input 
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyNameEditable)}
                        placeholder="John"
                        autoComplete="off"
                        className={`w-full px-6 py-5 bg-white/5 border ${/\s/.test(fullName) ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/10'} rounded-2xl focus:outline-none focus:ring-4 transition-all text-white font-medium text-sm tracking-wide disabled:opacity-60`}
                      />
                      {/\s/.test(fullName) && (
                        <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider ml-1 mt-1">
                          Please type in your name without spaces or just type in your surname
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address or Phone Number
                      </label>
                      <input 
                        type="text"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        disabled={isProxyRegistration && (proxyMethod === 'email' || !proxyVerified)}
                        placeholder="name@example.com or phone number"
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <Phone className="w-3 h-3" /> Phone Number
                      </label>
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        disabled={isProxyRegistration && (proxyMethod === 'phone' || !proxyVerified)}
                        placeholder="01XXXXXXXXX"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm disabled:opacity-60"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <SchoolIcon className="w-3 h-3" /> School
                      </label>
                      <select 
                        required
                        value={school}
                        onChange={(e) => setSchool(e.target.value)}
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm appearance-none"
                      >
                        <option value="St Joseph" className="bg-zinc-900">ST JOSEPH</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Class
                      </label>
                      <input 
                        type="text"
                        required
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyClassEditable)}
                        placeholder="e.g. 10"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm disabled:opacity-60"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                          <Layers className="w-3 h-3" /> Section
                        </label>
                        <input 
                          type="text"
                          required
                          value={section}
                          onChange={(e) => setSection(e.target.value)}
                          disabled={isProxyRegistration && (!proxyVerified || !proxySectionEditable)}
                          placeholder="e.g. A"
                          className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm disabled:opacity-60"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                          <Hash className="w-3 h-3" /> Roll
                        </label>
                        <input 
                          type="text"
                          required
                          value={roll}
                          onChange={(e) => setRoll(e.target.value)}
                          disabled={isProxyRegistration && (!proxyVerified || !proxyRollEditable)}
                          placeholder="e.g. 42"
                          className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-medium text-sm disabled:opacity-60"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Membership Type Info */}
                  <div className="space-y-4 pt-4 border-t border-white/5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Membership Type</label>
                    <div className="p-6 rounded-3xl border bg-amber-500/10 border-amber-500/30 text-white relative group">
                      <div className="text-xs font-bold uppercase tracking-widest mb-1">General Member</div>
                      <div className="text-[10px] text-zinc-500">FEE: 200tk</div>
                      <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-amber-500" />
                    </div>
                  </div>

                  {isProxyRegistration ? (
                    <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/20 space-y-4 text-left">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-white">Proxy Mode Active</h4>
                          <p className="text-[10px] text-zinc-400">Payment details and verification are bypassed. This registration will be immediately marked as fully verified in the system.</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-8 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white uppercase tracking-widest">Payment Details</h3>
                        <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-bold uppercase tracking-widest">
                          Status: Pending
                        </div>
                      </div>

                      <div className="space-y-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('bkash')}
                            className={`py-4 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${
                              paymentMethod === 'bkash' 
                                ? 'bg-amber-500 border-amber-500 text-black' 
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            bKash
                          </button>
                          <button
                            type="button"
                            onClick={() => setPaymentMethod('cash')}
                            className={`py-4 rounded-2xl border transition-all font-bold text-xs uppercase tracking-widest ${
                              paymentMethod === 'cash' 
                                ? 'bg-amber-500 border-amber-500 text-black' 
                                : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                            }`}
                          >
                            Cash
                          </button>
                        </div>
                      </div>

                      {paymentMethod === 'bkash' && (
                        <motion.div 
                          initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 10 }}
                          animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Send Money To (bKash)</span>
                              <button 
                                type="button"
                                onClick={() => {
                                  navigator.clipboard.writeText(content?.registration?.bkashNumber || '01712345678');
                                  showToast('Number copied to clipboard', 'success');
                                }}
                                className="flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all"
                              >
                                <Copy className="w-3 h-3" />
                                Copy
                              </button>
                            </div>
                            <div className="text-xl font-mono font-bold text-white tracking-wider">{content?.registration?.bkashNumber || '01712345678'}</div>
                            <div className="space-y-1">
                              <p className="text-xs text-zinc-300 font-bold uppercase tracking-widest mb-2">
                                Fee: {content?.registration?.fee || '200 BDT'}
                              </p>
                              {(content?.registration?.instructions || [
                                "Go to your bKash app or dial *247#",
                                "Select \"Send Money\" and enter the number above",
                                "Enter the registration fee amount",
                                "Copy the Transaction ID (TrxID) and enter it below"
                              ]).map((step: string, i: number) => (
                                <p key={i} className="text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                                  {i + 1}. {step}
                                </p>
                              ))}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">TrxID</label>
                              <input 
                                type="text"
                                required
                                value={trxnid}
                                onChange={(e) => setTrxnid(e.target.value)}
                                placeholder="TRANSACTION ID"
                                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Your bKash Number</label>
                              <input 
                                type="text"
                                required
                                value={bkashNumber}
                                onChange={(e) => {
                                  const val = e.target.value.replace(/\D/g, '');
                                  if (val.length <= 11) setBkashNumber(val);
                                }}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all text-white font-bold text-sm"
                              />
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {paymentMethod === 'cash' && (
                        <motion.div 
                          initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 10 }}
                          animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
                          className="p-4 rounded-2xl bg-[var(--c-6-start)]/10 border border-[var(--c-6-start)]/20"
                        >
                          <p className="text-[10px] text-[var(--c-6-start)] font-bold uppercase tracking-widest text-center">
                            {content?.registration?.cashInstructions || "Please pay your registration fee to the club treasurer."}
                          </p>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Declaration */}
                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="pt-1">
                        <input 
                          type="checkbox"
                          id="declaration"
                          required
                          checked={agreed}
                          onChange={(e) => setAgreed(e.target.checked)}
                          className="w-5 h-5 rounded bg-white/5 border-white/10 text-[var(--c-6-start)] focus:ring-[var(--c-6-start)]/20"
                        />
                      </div>
                      <label htmlFor="declaration" className="text-[11px] text-zinc-400 font-medium leading-relaxed uppercase tracking-wider">
                        I, <span className="text-white font-bold">{fullName || '_______'}</span>, {content?.registration?.declaration || "am willing to join the Josephite Math Club, I promise to perform my duties with honesty, respect the club values, and work for its development"}
                      </label>
                    </div>
                  </div>

                  {error && (
                    <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-xs font-bold uppercase tracking-widest">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      {error}
                    </div>
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
                        Complete Registration
                        <CheckCircle2 className={`w-5 h-5 ${!shouldReduceGfx && 'group-hover:scale-110 transition-transform'}`} />
                      </>
                    )}
                  </button>
                </form>
              </div>
            ) : null}
          </ScrollReveal>
        </div>
      </div>

      {/* Printable Form Modal */}
      <AnimatePresence>
        {showPrintView && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="max-w-4xl w-full bg-white rounded-lg p-8 shadow-2xl relative">
              <button 
                onClick={() => setShowPrintView(false)}
                className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-black transition-colors print:hidden"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              
              <div className="flex justify-end mb-6 print:hidden">
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-xl font-bold text-sm hover:bg-black transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download / Print
                </button>
              </div>

                  <PrintableForm 
                    data={{
                      fullName,
                      school,
                      className,
                      section,
                      roll,
                      phone,
                      emailAddress,
                      photoUrl
                    }}
                    declaration={content?.registration?.declaration}
                    logoUrl={content?.site?.logoUrl}
                  />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const PrintableForm = ({ data, declaration, logoUrl }: { data: any, declaration?: string, logoUrl?: string }) => {
  return (
    <div className="text-black font-serif p-4 space-y-8 print:p-0">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-content, .print-content * {
            visibility: visible;
          }
          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
      
      <div className="print-content space-y-12">
        {/* Administrative Copy */}
        <FormSection type="Administrative Copy" data={data} declaration={declaration} logoUrl={logoUrl} />
        
        {/* Divider */}
        <div className="border-t-2 border-dashed border-black relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-4 text-[10px] font-bold uppercase tracking-widest">
            Cut Here
          </div>
        </div>
        
        {/* Student's Copy */}
        <FormSection type="Student's Copy" data={data} isStudentCopy declaration={declaration} logoUrl={logoUrl} />
      </div>
    </div>
  );
};

const FormSection = ({ type, data, isStudentCopy = false, declaration, logoUrl }: { type: string, data: any, isStudentCopy?: boolean, declaration?: string, logoUrl?: string }) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-black pb-4">
        <div className="w-20 h-20 relative flex items-center justify-center border border-black/10">
          {logoUrl ? (
            <Image 
              src={resolveImageUrl(logoUrl)} 
              alt="JMC" 
              fill 
              className="object-contain" 
            />
          ) : (
            <span className="text-[10px] font-bold">JMC LOGO</span>
          )}
        </div>
        <div className="text-center flex-1">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Josephite Math Club</h1>
          <h2 className="text-lg font-bold">St. Joseph Higher Secondary School</h2>
          <p className="text-[10px]">97, Asad Avenue, Mohammadpur, Dhaka-1207, Bangladesh</p>
          <p className="text-[10px]">Telephone no. +88-02-41022469; EIIN: 108259; sjs.edu.bd</p>
        </div>
        <div className="w-20 h-20 relative flex items-center justify-center border border-black/10">
          <span className="text-[10px] font-bold">SCHOOL LOGO</span>
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-1">
        <h3 className="text-xl font-bold underline decoration-2 underline-offset-4">
          Membership Form
        </h3>
        <p className="text-sm font-medium">{type}</p>
      </div>

      {/* Photo Box */}
      <div className="flex justify-end">
        <div className="w-24 h-28 border-2 border-black flex items-center justify-center text-[10px] font-bold relative">
          {data.photoUrl ? (
            <Image 
              src={resolveImageUrl(data.photoUrl)} 
              alt="Photo" 
              fill 
              className="object-cover" 
            />
          ) : (
            'PHOTO'
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        <div className="flex gap-4">
          <span className="font-bold whitespace-nowrap">NAME:</span>
          <span className="flex-1 border-b border-black font-medium uppercase">{data.fullName}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-8">
          <div className="flex gap-2">
            <span className="font-bold">CLASS:</span>
            <span className="flex-1 border-b border-black font-medium">{data.className}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">SECTION:</span>
            <span className="flex-1 border-b border-black font-medium">{data.section}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold">ROLL:</span>
            <span className="flex-1 border-b border-black font-medium">{data.roll}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div className="flex gap-2">
            <span className="font-bold">PHONE:</span>
            <span className="flex-1 border-b border-black font-medium">{data.phone}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-bold whitespace-nowrap">EMAIL ADDRESS:</span>
            <span className="flex-1 border-b border-black font-medium">{data.emailAddress}</span>
          </div>
        </div>

        <div className="flex gap-8 pt-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border border-black flex items-center justify-center bg-black">
              <div className="w-2 h-2 bg-white" />
            </div>
            <span className="text-xs font-bold">GENERAL MEMBER( FEE-200tk)</span>
          </div>
        </div>

        <div className="pt-4 leading-relaxed text-sm">
          I, <span className="font-bold underline px-2">{data.fullName || '____________________'}</span>, {declaration || "am willing to join the Josephite Math Club, I promise to perform my duties with honesty, respect the club values, and work for its development"}
        </div>
      </div>

      {/* Signatures */}
      <div className="flex justify-between pt-12">
        <div className="text-center">
          <div className="w-48 border-b border-black mb-1"></div>
          <p className="text-xs font-bold">{isStudentCopy ? 'Moderator\'s Signature' : 'Student\'s Sign'}</p>
        </div>
        <div className="text-center">
          <div className="w-48 border-b border-black mb-1"></div>
          <p className="text-xs font-bold">{isStudentCopy ? 'Student\'s Signature' : 'Collector\'s Signature'}</p>
        </div>
      </div>
    </div>
  );
};

export default RegisterMember;
