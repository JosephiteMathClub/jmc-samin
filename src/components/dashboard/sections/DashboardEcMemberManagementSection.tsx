"use client";
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trash2, 
  Plus, 
  Search, 
  Award, 
  Loader2, 
  AlertCircle, 
  User as UserIcon, 
  Camera,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Mail,
  Shield,
  QrCode
} from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardButton } from '../DashboardButton';
import Image from 'next/image';
import { resolveImageUrl, matchesSearchWithFuzzy } from '../../../lib/utils';
import GeometricAvatar from '../../GeometricAvatar';
import ConfirmModal from '../../ConfirmModal';
import { BatchMemberUpload } from './BatchMemberUpload';
import { useToast } from '../../../context/ToastContext';
import { supabase } from '../../../lib/supabase';

interface DashboardEcMemberManagementSectionProps {
  members: any[];
  loadingMembers: boolean;
  memberError: string | null;
  fetchMembers: () => Promise<void>;
  toggleVerified: (memberId: string, currentStatus: string) => Promise<void>;
  deleteMember: (member: any) => Promise<void>;
  addMember: (memberData: { 
    full_name: string, 
    class: string, 
    section: string, 
    roll: string,
    email: string,
    phone?: string,
    hasAccount: boolean,
    is_ec?: boolean,
    custom_member_id?: string,
    department?: string,
    register_method?: 'both' | 'phone_only'
  }) => Promise<any>;
  handleMemberPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => Promise<void>;
  uploading: string | null;
  shouldReduceGfx: boolean;
  isDeletingMember: boolean;
  isSuperAdmin?: boolean;
}

export const DashboardEcMemberManagementSection: React.FC<DashboardEcMemberManagementSectionProps> = ({
  members,
  loadingMembers,
  memberError,
  fetchMembers,
  toggleVerified,
  deleteMember,
  addMember,
  handleMemberPhotoUpload,
  uploading,
  shouldReduceGfx,
  isDeletingMember,
  isSuperAdmin = false
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all'); // Filter status
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [addMode, setAddMode] = useState<'single' | 'batch'>('single');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();
  const [successData, setSuccessData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    class: '',
    section: '',
    roll: '',
    email: '',
    phone: '',
    hasAccount: false,
    is_ec: true, // Forcing true in this EC section
    custom_member_id: '',
    department: 'management',
    register_method: 'both' as 'both' | 'phone_only'
  });

  const [matchingProfiles, setMatchingProfiles] = useState<any[]>([]);
  const [isSearchingEmails, setIsSearchingEmails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!formData.hasAccount) {
      setMatchingProfiles([]);
      return;
    }

    const query = formData.email?.trim() || '';
    if (query.length < 2) {
      setMatchingProfiles([]);
      return;
    }

    let active = true;
    const searchEmails = async () => {
      setIsSearchingEmails(true);
      try {
        const isPhone = !query.includes('@') && /^[0-9+\s\-()]+$/.test(query);
        let resolvedEmail = query;
        if (isPhone) {
          const { data: memberByPhone } = await supabase
            .from('member')
            .select('email')
            .eq('phone', query)
            .maybeSingle();
          if (memberByPhone?.email) {
            resolvedEmail = memberByPhone.email;
          } else {
            const { data: ecByPhone } = await supabase
              .from('ec_member')
              .select('email')
              .eq('phone', query)
              .maybeSingle();
            if (ecByPhone?.email) {
              resolvedEmail = ecByPhone.email;
            } else {
              resolvedEmail = `${query}@josephitre.club`;
            }
          }
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .or(`email.ilike.%${resolvedEmail}%,email.ilike.%${query}%`)
          .limit(8);

        if (error) throw error;
        if (active) {
          setMatchingProfiles(data || []);
        }
      } catch (e) {
        console.error("Failed to search profiles by email:", e);
      } finally {
        if (active) {
          setIsSearchingEmails(false);
        }
      }
    };

    const timer = setTimeout(() => {
      searchEmails();
    }, 150);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.email, formData.hasAccount]);

  const handleSelectProfile = async (profile: any) => {
    setFormData(prev => ({
      ...prev,
      email: profile.email || '',
      full_name: profile.full_name || prev.full_name || ''
    }));
    setShowSuggestions(false);

    try {
      const { data: memberData } = await supabase
        .from('member')
        .select('*')
        .eq('id', profile.id)
        .maybeSingle();

      if (memberData) {
        setFormData(prev => ({
          ...prev,
          class: memberData.class || prev.class,
          section: memberData.section || prev.section,
          roll: memberData.roll || prev.roll,
          phone: memberData.phone || prev.phone
        }));
      } else {
        const { data: ecData } = await supabase
          .from('ec_member')
          .select('*')
          .eq('id', profile.id)
          .maybeSingle();

        if (ecData) {
          setFormData(prev => ({
            ...prev,
            class: ecData.class || prev.class,
            section: ecData.section || prev.section,
            roll: ecData.roll || prev.roll,
            phone: ecData.phone || prev.phone
          }));
        }
      }
    } catch (e) {
      console.error("Error loading existing member details:", e);
    }
  };

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Form details passed with forced is_ec=true
      const data = await addMember({
        ...formData,
        is_ec: true,
        register_method: formData.register_method
      });
      setSuccessData(data);
      setFormData({ 
        full_name: '', 
        class: '', 
        section: '', 
        roll: '', 
        email: '', 
        phone: '', 
        hasAccount: false, 
        is_ec: true, 
        custom_member_id: '',
        department: 'management',
        register_method: 'both'
      });
      fetchMembers();
    } catch (err) {
      // Error is handled inside AdminDashboard addMember toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);

  const handleResendWelcomeEmail = async (member: any) => {
    setSendingEmailId(member.id);
    try {
      const email = member.email_address || member.email;
      if (!email) throw new Error("No email address found for this EC member.");
      
      showToast('Sending EC welcome email...', 'info');
      const res = await fetch('/api/admin/bulk-welcome-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ members: [{ email, fullName: member.full_name, memberId: member.member_id }] })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send welcome email.");
      
      if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0]);
      }
      
      showToast('EC welcome email sent successfully!', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingEmailId(null);
    }
  };

  const filteredMembers = useMemo(() => {
    const q = memberSearch.toLowerCase().trim();
    if (!q) {
      return members.filter(m => {
        // Filter ONLY EC members
        const isEcMember = m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id));
        if (!isEcMember) return false;

        return memberFilter === 'all' || m.verified === memberFilter;
      });
    }

    const scoredList = members
      .map(m => {
        // Filter ONLY EC members
        const isEcMember = m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id));
        if (!isEcMember) return { item: m, matches: false, score: 999 };

        const matchesFilter = memberFilter === 'all' || m.verified === memberFilter;
        if (!matchesFilter) return { item: m, matches: false, score: 999 };

        const email = m.email_address || m.email || '';
        const matchRes = matchesSearchWithFuzzy(m, q, {
          nameField: 'full_name',
          secondaryFields: ['email', 'member_id', 'phone', 'class', 'roll']
        });

        // Also check email since email can be m.email_address too
        let finalMatches = matchRes.matches;
        let finalScore = matchRes.score;
        if (email.toLowerCase().includes(q)) {
          finalMatches = true;
          finalScore = -10;
        }

        return { item: m, matches: finalMatches, score: finalScore };
      })
      .filter(res => res.matches);

    scoredList.sort((a, b) => a.score - b.score);
    return scoredList.map(res => res.item);
  }, [members, memberSearch, memberFilter]);

  const handleDownloadCSV = () => {
    if (filteredMembers.length === 0) {
      showToast("No EC members to download.", "info");
      return;
    }

    const headers = ["Name", "Class", "Section", "Roll", "Unique ID", "Department"];
    
    const csvRows = [
      headers.join(",")
    ];

    filteredMembers.forEach(m => {
      const name = m.full_name || '';
      const className = m.class || '';
      const section = m.section || '';
      const roll = m.roll || '';
      const uniqueId = m.member_id || m.id || '';
      const department = m.department || '';

      const values = [name, className, section, roll, uniqueId, department];
      const escapedValues = values.map(val => {
        const stringVal = String(val).replace(/"/g, '""');
        return `"${stringVal}"`;
      });
      csvRows.push(escapedValues.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `ec_members_list_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("EC members list exported successfully in CSV format!", "success");
  };

  return (
    <motion.div
      key="ec-members"
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection 
        icon={Shield} 
        title="Add New Executive Committee Member" 
        description="Manually register EC officers with designated 3-digit identifiers individually or upload batch spreadsheet records."
      >
        <div className="space-y-6">
          {!isManualAddOpen ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setAddMode('single');
                  setIsManualAddOpen(true);
                  setSuccessData(null);
                }}
                className="py-12 border-2 border-dashed border-amber-500/20 rounded-3xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest group bg-amber-500/[0.01]"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <Plus className="w-6 h-6 animate-pulse" />
                </div>
                Single EC Registration
              </button>

              <button 
                onClick={() => {
                  setAddMode('batch');
                  setIsManualAddOpen(true);
                  setSuccessData(null);
                }}
                className="py-12 border-2 border-dashed border-amber-500/20 rounded-3xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest group bg-amber-500/[0.01]"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                Batch EC Spreadsheet Upload
              </button>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8"
            >
              <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                    {addMode === 'single' ? <Plus className="w-5 h-5 text-amber-500" /> : <FileSpreadsheet className="w-5 h-5 text-amber-500" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                      {addMode === 'single' ? 'Manual EC Officer Registration' : 'Batch EC Officer Upload'}
                    </h4>
                    <p className="text-[10px] text-amber-500/75 uppercase tracking-widest font-bold">
                      {addMode === 'single' ? 'Fill out parameters to register a single committee member.' : 'Upload an Excel or CSV file. All loaded rows will automatically register under EC role.'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsManualAddOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-500 hover:text-white"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              {addMode === 'batch' ? (
                <BatchMemberUpload 
                  addMember={addMember}
                  showToast={showToast}
                  onComplete={() => fetchMembers()}
                  forceEcUpload={true}
                />
              ) : successData ? (
                <div className="text-center space-y-6 py-6 font-display">
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white uppercase tracking-tight">EC Officer Approved</h4>
                    <p className="text-zinc-500 text-sm">Designation registered and verified successfully.</p>
                  </div>
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl inline-block min-w-[300px]">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-2">Unique 3-Digit EC ID</span>
                    <span className="text-3xl font-mono font-bold text-white tracking-[0.3em] pl-[0.3em]">{successData.member_id}</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setSuccessData(null)}
                      className="px-8 py-4 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all"
                    >
                      Add Another EC Representative
                    </button>
                    <button 
                      onClick={() => setIsManualAddOpen(false)}
                      className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Close Form
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleManualAdd} className="space-y-8">
                  {/* Registration Method Selection */}
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                    <p className="text-[10px] font-bold text-zinc-300 uppercase tracking-[0.2em] text-center">Registration Setup</p>
                    <h4 className="text-sm font-bold text-white text-center">How would you like to register this EC officer?</h4>
                    <div className="flex gap-4 justify-center pt-2 max-w-xl mx-auto">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, register_method: 'both'})}
                        className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.register_method === 'both' ? 'bg-white/10 border-amber-500/50 text-white shadow-lg' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                      >
                        Email & Phone Number
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, register_method: 'phone_only', email: ''})}
                        className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.register_method === 'phone_only' ? 'bg-white/10 border-amber-500/50 text-white shadow-lg' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                      >
                        Only Phone Number
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                      <p className="text-[10px] font-bold text-zinc-350 uppercase tracking-[0.2em] text-center">Account Link Verification</p>
                      <h4 className="text-sm font-bold text-white text-center">Does this EC officer have an existing account?</h4>
                      <div className="flex gap-4 justify-center pt-2">
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, hasAccount: true})}
                          className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.hasAccount === true ? 'bg-white/10 border-amber-500/50 text-white shadow-lg' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                        >
                          Yes, Link Existing Account
                        </button>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, hasAccount: false})}
                          className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.hasAccount === false ? 'bg-white/10 border-amber-500/50 text-white shadow-lg' : 'border-white/5 text-zinc-500 hover:border-white/20'}`}
                        >
                          No, Auto-create Credentials
                        </button>
                      </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] text-center">Assigned EC Digit Identifier</p>
                      <h4 className="text-sm font-bold text-white text-center">Specify 3-digit number or allocate auto</h4>
                      <div className="space-y-2">
                        <input 
                          type="text"
                          pattern="^\d{3}$"
                          maxLength={3}
                          value={formData.custom_member_id}
                          onChange={(e) => setFormData({...formData, custom_member_id: e.target.value.replace(/\D/g, '').substring(0, 3)})}
                          placeholder="ENTER 3-DIGIT EC ID (e.g. 051) OR AUTO"
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500 text-white font-mono font-bold text-center text-xs placeholder:text-zinc-700 tracking-[0.2em]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-4">
                    <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4 col-span-1 md:col-span-2">
                      <p className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em] text-center">Assign Department</p>
                      <h4 className="text-sm font-bold text-white text-center">Select active working department</h4>
                      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                        {['academics', 'management', 'logistics'].map((dept) => (
                          <button 
                            key={dept}
                            type="button"
                            onClick={() => setFormData({...formData, department: dept})}
                            className={`flex-1 px-4 py-3 rounded-xl border text-[10px] font-bold uppercase tracking-widest transition-all ${formData.department === dept ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-lg' : 'border-white/5 bg-white/5 text-zinc-400 hover:border-white/20'}`}
                          >
                            {dept}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        placeholder="ENTER NAME"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    {formData.register_method !== 'phone_only' && (
                      <div className="space-y-2 relative">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Email Address (User ID)</label>
                        <input 
                          type="text"
                          required
                          value={formData.email}
                          onChange={(e) => {
                            setFormData({...formData, email: e.target.value});
                            setShowSuggestions(true);
                          }}
                          onFocus={() => setShowSuggestions(true)}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowSuggestions(false);
                            }, 250);
                          }}
                          placeholder="EMAIL@EXAMPLE.COM OR PHONE NUMBER"
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                        />

                        {formData.hasAccount && showSuggestions && (formData.email.trim().length >= 2) && (
                          <div className="absolute z-50 left-0 right-0 mt-1 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-white/5 backdrop-blur-md">
                            {isSearchingEmails && (
                              <div className="px-6 py-3.5 text-xs text-zinc-500 flex items-center gap-2">
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                                <span className="uppercase tracking-widest text-[9px] font-bold">Searching matching addresses...</span>
                              </div>
                            )}
                            {!isSearchingEmails && matchingProfiles.length === 0 && (
                              <div className="px-6 py-3.5 text-xs text-zinc-600 uppercase tracking-widest text-[9px] font-bold">
                                No registered profile matches "{formData.email}"
                              </div>
                            )}
                            {!isSearchingEmails && matchingProfiles.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => handleSelectProfile(p)}
                                className="w-full px-6 py-3 text-left hover:bg-white/5 transition-colors flex flex-col justify-center gap-1 group"
                              >
                                <span className="text-white font-bold font-mono text-xs group-hover:text-amber-500 transition-colors">
                                  {p.email}
                                </span>
                                {p.full_name && (
                                  <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider block">
                                    {p.full_name}
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {(formData.register_method !== 'phone_only' && !formData.hasAccount) || formData.register_method === 'phone_only' ? (
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                          Phone Number {formData.register_method === 'phone_only' ? '(Username & Password)' : '(Temporary Password)'}
                        </label>
                        <input 
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="e.g. 01712345678"
                          className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                        />
                      </div>
                    ) : null}
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Class</label>
                      <input 
                        type="text"
                        required
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        placeholder="e.g. 11/12"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Section</label>
                      <input 
                        type="text"
                        required
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        placeholder="e.g. Science B"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Roll</label>
                      <input 
                        type="text"
                        required
                        value={formData.roll}
                        onChange={(e) => setFormData({...formData, roll: e.target.value})}
                        placeholder="e.g. 210"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button"
                      onClick={() => setIsManualAddOpen(false)}
                      className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-10 py-3 rounded-xl bg-amber-500 text-black font-bold text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                      Register & Verify EC Officer
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </DashboardSection>

      <DashboardSection 
        icon={Award} 
        title="Executive Committee Member Management" 
        description="Oversee verified EC members, designate 3-digit identifiers, edit officers profile cards, or remove officers."
      >
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search EC officers by name, email or 3-digit ID..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white text-xs font-bold uppercase tracking-widest"
              />
            </div>
            
            <div className="flex gap-2 items-center justify-between w-full md:w-auto">
              <div className="flex gap-2">
                {['all', 'yes', 'no'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setMemberFilter(status)}
                    className={`px-4 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                      memberFilter === status 
                        ? 'bg-amber-500 border-amber-500 text-black' 
                        : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {status === 'all' ? 'All Officers' : status === 'yes' ? 'Verified' : 'Pending'}
                  </button>
                ))}
              </div>
              <button 
                onClick={fetchMembers}
                disabled={loadingMembers}
                className="p-2.5 text-amber-500 hover:bg-amber-500/10 border border-white/10 rounded-xl transition-all"
              >
                <Loader2 className={`w-4 h-4 ${loadingMembers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="flex justify-end border-b border-white/10 pb-4 gap-4 flex-wrap">
            <button
              onClick={handleDownloadCSV}
              className="px-6 py-3 rounded-xl border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download EC List (CSV)
            </button>

            <button
              onClick={async () => {
                const pending = filteredMembers.filter(m => m.verified === 'no');
                if (pending.length === 0) {
                  showToast("No pending EC officers in view.", "info");
                  return;
                }
                const confirmRes = window.confirm(`Send verification reminders to ${pending.length} pending EC officers?`);
                if (!confirmRes) return;
                
                setSendingEmailId('bulk-pending');
                try {
                  const toSend = pending.map(m => ({
                    email: m.email_address || m.email,
                    fullName: m.full_name,
                    memberId: m.member_id
                  })).filter(m => !!m.email);
                  
                  showToast(`Sending ${toSend.length} validation reminders...`, 'info');
                  const res = await fetch('/api/admin/bulk-verification-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ members: toSend })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed to dispatch reminders.");
                  showToast(`Dispatched ${data.sentCount} verification reminders.`, 'success');
                } catch (err: any) {
                  showToast(err.message, 'error');
                } finally {
                  setSendingEmailId(null);
                }
              }}
              disabled={sendingEmailId === 'bulk-pending'}
              className="px-6 py-3 rounded-xl border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {sendingEmailId === 'bulk-pending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sendingEmailId === 'bulk-pending' ? 'Sending...' : 'Remind Pending Officers'}
            </button>

            <button
              onClick={async () => {
                const unnotified = filteredMembers.filter(m => m.verified === 'yes');
                if (unnotified.length === 0) {
                  showToast("No verified EC officers in view.", "info");
                  return;
                }
                const confirmRes = window.confirm(`Dispense welcome credentials packages to ${unnotified.length} verified EC officers in view?`);
                if (!confirmRes) return;
                
                setSendingEmailId('bulk-all');
                try {
                  const toSend = unnotified.map(m => ({
                    email: m.email_address || m.email,
                    fullName: m.full_name,
                    memberId: m.member_id
                  })).filter(m => !!m.email);
                  
                  showToast(`Delivering packages to ${toSend.length} officers...`, 'info');
                  const res = await fetch('/api/admin/bulk-welcome-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ members: toSend })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || "Failed to dispatch packages.");
                  
                  if (data.sentCount > 0) {
                    showToast(`Dispatched ${data.sentCount} welcome packages.`, 'success');
                  } else {
                    showToast("No packages were sent.", "info");
                  }
                } catch (err: any) {
                  showToast(err.message, 'error');
                } finally {
                  setSendingEmailId(null);
                }
              }}
              disabled={sendingEmailId === 'bulk-all'}
              className="px-6 py-3 rounded-xl border border-amber-500/30 text-amber-500 hover:bg-amber-500/10 transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
            >
              {sendingEmailId === 'bulk-all' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {sendingEmailId === 'bulk-all' ? 'Delivering...' : 'Send EC Welcome Packages'}
            </button>
          </div>

          {memberError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              <span>Error loading EC registry: {memberError}</span>
              <button onClick={fetchMembers} className="ml-auto underline hover:text-red-400">Retry</button>
            </div>
          )}

          <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.01]">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-amber-500">Unique EC ID</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">EC Official Info</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Designation</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Roll No.</th>
                    <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</th>
                    <th className="py-4 pr-8 pl-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Options</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-xs font-semibold text-zinc-550 uppercase tracking-widest">
                        No committee members match your search criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((m) => (
                      <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono font-bold text-xs rounded-md tracking-wider">
                              {m.member_id || 'PENDING'}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="relative group/avatar">
                              {m.photo_url ? (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 relative">
                                  <Image 
                                    src={resolveImageUrl(m.photo_url)} 
                                    alt="" 
                                    fill 
                                    className="object-cover" 
                                    unoptimized={!m.photo_url?.startsWith('http') && !m.photo_url?.startsWith('/uploads/')}
                                    referrerPolicy="no-referrer"
                                  />
                                </div>
                              ) : (
                                <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex items-center justify-center flex-shrink-0">
                                  <GeometricAvatar name={m.full_name || 'Member'} size="100%" />
                                </div>
                              )}
                              <label className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                <Camera className="w-3.5 h-3.5 text-white" />
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="hidden" 
                                  disabled={uploading !== null}
                                  onChange={(e) => handleMemberPhotoUpload(e, m.id)} 
                                />
                              </label>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                {m.full_name}
                                <span className="text-[8px] bg-amber-500/20 text-amber-400 font-extrabold uppercase px-1 rounded">EC Officer</span>
                              </span>
                              <span className="text-[9px] text-zinc-500">{m.email_address || m.email}</span>
                              {m.phone && <span className="text-[9px] text-amber-500/80 font-mono font-bold">{m.phone}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.class} / {m.section || '-'}</span>
                            {m.department && (
                              <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-widest">{m.department}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-[10px] font-mono text-zinc-400">{m.roll}</span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[9px] font-bold uppercase tracking-widest ${m.verified === 'yes' ? 'text-green-500' : 'text-amber-500'}`}>
                              {m.verified === 'yes' ? 'Verified' : 'Pending'}
                            </span>
                            <span className="text-[8px] text-zinc-650 uppercase tracking-tight">{m.payment_method}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-8 pl-4 text-right">
                          <div className="flex items-center justify-end gap-2 text-right">
                            <button
                              onClick={() => toggleVerified(m.id, m.verified)}
                              disabled={m.verified === 'yes' && !isSuperAdmin}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                m.verified === 'yes'
                                  ? (isSuperAdmin ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-500/5 text-zinc-500 cursor-not-allowed opacity-50')
                                  : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                              }`}
                              title={m.verified === 'yes' && !isSuperAdmin ? "Only Super Admins can deactivate/unverify officers" : ""}
                            >
                              {m.verified === 'yes' ? 'Deactivate' : 'Verify'}
                            </button>
                            <button
                              onClick={() => handleResendWelcomeEmail(m)}
                              disabled={sendingEmailId === m.id}
                              className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg hover:bg-amber-500/20 transition-all opacity-40 hover:opacity-100 disabled:opacity-50"
                              title="Resend welcome package"
                            >
                              {sendingEmailId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setMemberToDelete(m)}
                              disabled={isDeletingMember}
                              className="p-2.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 hover:scale-[1.08] transition-all opacity-60 hover:opacity-100 disabled:opacity-50 flex items-center justify-center cursor-pointer"
                              title="Remove EC officer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y divide-white/5">
              {filteredMembers.length === 0 ? (
                <div className="py-12 text-center text-xs font-semibold text-zinc-550 uppercase tracking-widest">
                  No committee officers meet criteria.
                </div>
              ) : (
                filteredMembers.map((m) => (
                  <div key={m.id} className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="relative group/avatar">
                          {m.photo_url ? (
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 relative">
                              <Image 
                                src={resolveImageUrl(m.photo_url)} 
                                alt="" 
                                fill 
                                className="object-cover" 
                                unoptimized={!m.photo_url?.startsWith('http') && !m.photo_url?.startsWith('/uploads/')}
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex items-center justify-center">
                              <GeometricAvatar name={m.full_name || 'Member'} size="100%" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white flex items-center gap-1.5">
                            {m.full_name}
                            <span className="text-[8px] bg-amber-500/20 text-amber-400 font-semibold px-1 rounded uppercase">EC</span>
                          </p>
                          <p className="text-[9px] text-zinc-400">{m.email_address || m.email}</p>
                          {m.phone && <p className="text-[9px] text-amber-500/80 font-mono font-bold">{m.phone}</p>}
                        </div>
                      </div>
                      <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono font-bold text-xs rounded-md">
                        {m.member_id || 'PENDING'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-white/5 text-[10px] font-medium text-zinc-400">
                      <div>
                        <span className="text-[8px] text-zinc-650 uppercase block font-semibold">Class / Section</span>
                        <span className="font-bold text-white uppercase tracking-wider">{m.class} / {m.section || '-'}</span>
                        {m.department && (
                          <span className="text-[8px] text-amber-400 font-extrabold uppercase tracking-widest block mt-0.5">{m.department}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-650 uppercase block font-semibold">Roll Number</span>
                        <span className="font-mono text-white font-bold">{m.roll}</span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-650 uppercase block font-semibold">Status</span>
                        <span className={`font-bold ${m.verified === 'yes' ? 'text-green-500' : 'text-amber-500'} uppercase tracking-wider`}>
                          {m.verified === 'yes' ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[8px] text-zinc-650 uppercase block font-semibold">Method</span>
                        <span className="text-zinc-500 uppercase tracking-wider text-[9px]">{m.payment_method}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-4 border-t border-white/5">
                      <button
                        onClick={() => toggleVerified(m.id, m.verified)}
                        disabled={m.verified === 'yes' && !isSuperAdmin}
                        className={`flex-1 py-3.5 rounded-xl text-[10px] font-bold uppercase tracking-widest text-center transition-all ${
                          m.verified === 'yes'
                            ? (isSuperAdmin ? 'bg-red-500/10 border border-red-500/20 text-red-550' : 'bg-green-500/5 text-zinc-500 cursor-not-allowed opacity-50 border border-white/5')
                            : 'bg-green-500/10 border border-green-500/20 text-green-550'
                        }`}
                        title={m.verified === 'yes' && !isSuperAdmin ? "Only Super Admins can deactivate/unverify officers" : ""}
                      >
                        {m.verified === 'yes' ? 'Deactivate' : 'Verify Officer'}
                      </button>
                      <button
                        onClick={() => handleResendWelcomeEmail(m)}
                        disabled={sendingEmailId === m.id}
                        className="p-3 border border-white/10 rounded-xl hover:bg-white/5 text-zinc-400 transition-colors"
                        title="Resend welcome package"
                      >
                        {sendingEmailId === m.id ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Mail className="w-4.5 h-4.5" />}
                      </button>
                      <button
                        onClick={() => setMemberToDelete(m)}
                        disabled={isDeletingMember}
                        className="p-3 border border-red-500/10 rounded-xl hover:bg-red-500/10 text-red-500 transition-colors"
                        title="Delete officer"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DashboardSection>

      <ConfirmModal 
        isOpen={memberToDelete !== null}
        onCancel={() => setMemberToDelete(null)}
        onConfirm={async () => {
          if (memberToDelete) {
            await deleteMember(memberToDelete);
            setMemberToDelete(null);
          }
        }}
        title="Remove EC Committee Officer"
        message={`Are you absolutely sure you want to remove ${memberToDelete?.full_name} from the Executive Committee database? Their corresponding account login credentials and performance logs will be lost.`}
        confirmLabel="Remove Officer"
        cancelLabel="Cancel"
        type="danger"
      />
    </motion.div>
  );
};
