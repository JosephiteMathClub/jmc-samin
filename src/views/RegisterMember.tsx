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
import { resolveImageUrl } from '../lib/utils';

import { usePerformance } from '../hooks/usePerformance';

const RegisterMember = () => {
  const { user, profile, isAdmin, loading: authLoading, refreshProfile } = useAuth();
  const { content } = useContent();
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
  const [membershipType, setMembershipType] = useState<'general' | 'executive'>('general');
  const [photoUrl, setPhotoUrl] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [department, setDepartment] = useState('');
  
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

  const checkMemberStatus = React.useCallback(async () => {
    if (!user) return;
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
        setMembershipType(data.membership_type || '');
        setDepartment(data.department || '');
        setPhotoUrl(data.photo_url || '');
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
    if (profile && !isMember) {
      setFullName(profile.full_name || '');
      setEmailAddress(user?.email || '');
      checkMemberStatus();
    }
  }, [user, authLoading, router, profile, checkMemberStatus, isMember]);

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
      const fileName = `members/${user?.id}-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      setPhotoUrl(publicUrl);
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
    if (!membershipType) {
      showToast('Please select membership type', 'error');
      return;
    }

    setLoading(true);
    setError(null);

    // Basic Input Validation
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
      // 1. Insert into member table
      const { error: memberError } = await supabase
        .from('member')
        .upsert({
          id: user?.id,
          full_name: fullName,
          email: user?.email,
          email_address: emailAddress,
          phone,
          school,
          class: className,
          section,
          roll,
          membership_type: membershipType,
          department,
          photo_url: photoUrl,
          payment_method: paymentMethod,
          trxnid: paymentMethod === 'bkash' ? trxnid : null,
          bkash_number: paymentMethod === 'bkash' ? bkashNumber : null,
          verified: 'no',
          updated_at: new Date().toISOString()
        });

      if (memberError) throw memberError;

      // 2. Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          school,
          class: className,
          section,
          roll,
          phone,
          membership_type: membershipType,
          department,
          intra_events: true,
          intra_events_chosen: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (profileError) throw profileError;

      await refreshProfile();
      setIsMember(true);
      setSuccess(true);
      showToast('Registration successful!', 'success');
    } catch (err: any) {
      setError(err.message);
      showToast('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || checkingMember) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080808]">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] pt-32 pb-24 relative overflow-hidden">
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

            {isMember ? (
              <div className="p-12 rounded-[40px] bg-white/[0.03] border border-white/10 backdrop-blur-xl text-center space-y-8">
                <div className="w-24 h-24 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 mx-auto border border-amber-500/30">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Registration Complete!</h3>
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-zinc-500">You are a member of the Josephite Math Club.</p>
                    
                    <div className="w-full max-w-sm space-y-3">
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
                          {membershipType || 'General'}
                        </span>
                      </div>

                      {paymentMethod === 'bkash' && (
                        <div className="px-6 py-4 rounded-2xl bg-white/5 border border-white/10 space-y-2 text-left">
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">TrxID</span>
                            <span className="text-[10px] font-mono font-bold text-white">{trxnid}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-[8px] font-bold uppercase tracking-widest text-zinc-500">bKash Number</span>
                            <span className="text-[10px] font-mono font-bold text-white">{bkashNumber}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => window.close()}
                    className="px-8 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-all w-full sm:w-auto"
                  >
                    Close This Tab
                  </button>
                </div>
              </div>
            ) : content?.registration?.registrationOpen === false && !isAdmin ? (
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
            ) : (
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
                        placeholder="YOUR FULL NAME"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-white font-bold text-sm tracking-wide"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1 flex items-center gap-2">
                        <Mail className="w-3 h-3" /> Email Address
                      </label>
                      <input 
                        type="email"
                        required
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                        placeholder="YOUR EMAIL"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
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
                        placeholder="01XXXXXXXXX"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
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
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm appearance-none"
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
                        placeholder="e.g. 10"
                        className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
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
                          placeholder="e.g. A"
                          className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
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
                          placeholder="e.g. 42"
                          className="w-full px-6 py-5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-sm"
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

                  <div className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-8">
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
            )}
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
                  membershipType,
                  department,
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
              unoptimized={!logoUrl?.startsWith('http') && !logoUrl?.startsWith('/uploads/')}
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
              unoptimized={!data.photoUrl?.startsWith('http') && !data.photoUrl?.startsWith('/uploads/')}
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
