"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { produce } from 'immer';
import { 
  LayoutDashboard, 
  Settings, 
  Users, 
  Calendar, 
  Bell, 
  Save, 
  Plus, 
  Trash2, 
  ChevronRight, 
  Image as ImageIcon,
  FileText,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  XCircle,
  Download,
  Award,
  Star,
  Briefcase,
  User as UserIcon,
  Search,
  Zap,
  Trophy,
  Lightbulb,
  Target,
  Rocket,
  Globe,
  Camera,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  BookOpen,
  Info,
  Mail,
  CreditCard,
  Home
} from 'lucide-react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'next/navigation';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { DashboardSection } from '../components/dashboard/DashboardSection';
import { DashboardFormField } from '../components/dashboard/DashboardFormField';
import { DashboardButton } from '../components/dashboard/DashboardButton';
import { DashboardFileUpload } from '../components/dashboard/DashboardFileUpload';
import ConfirmModal from '../components/ConfirmModal';
import Image from 'next/image';
import { resolveImageUrl } from '../lib/utils';

import { Skeleton } from '../components/Skeleton';

import { usePerformance } from '../hooks/usePerformance';

const AdminSkeleton = () => (
  <div className="min-h-screen bg-[#080808] flex flex-col lg:flex-row">
    <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 p-6 space-y-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
    <div className="flex-1 p-6 lg:p-12 space-y-8">
      <div className="flex justify-between items-center">
        <Skeleton className="h-12 w-48 lg:w-64" />
        <Skeleton className="h-12 w-24 lg:w-32 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-3xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Skeleton className="h-48 rounded-3xl" />
        <Skeleton className="h-48 rounded-3xl" />
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const { content, loading: contentLoading, saveAllContent, seedDatabase } = useContent();
  const { user, isAdmin, loading: authLoading } = useAuth();
  const { showToast } = useToast();
  const router = useRouter();
  const { shouldReduceGfx } = usePerformance();
  
  const [activeTab, setActiveTab] = useState('home');
  const [executiveTab, setExecutiveTab] = useState<'current' | 'recent' | 'former'>('current');
  const [localContent, setLocalContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ section: string, field: string, index: number, isOpen: boolean }>({ 
    section: '', field: '', index: -1, isOpen: false 
  });

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('all'); // 'all', 'yes', 'no'

  const [profiles, setProfiles] = useState<any[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all'); // 'all', 'admin', 'member'

  const fetchProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setLoadingProfiles(true);
    setProfileError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setProfiles(data || []);
    } catch (err: any) {
      console.error("Error fetching profiles:", err);
      setProfileError(err.message);
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  const toggleUserRole = async (profileId: string, currentRole: string) => {
    if (!isSupabaseConfigured) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', profileId);
      
      if (error) throw error;
      
      setProfiles(prev => prev.map(p => p.id === profileId ? { ...p, role: newRole } : p));
      showToast(`User role updated to ${newRole}`, "success");
    } catch (err: any) {
      console.error("Error updating role:", err);
      showToast(`Failed to update role: ${err.message}`, "error");
    }
  };

  const fetchMembers = useCallback(async () => {
    setLoadingMembers(true);
    setMemberError(null);
    try {
      const { data, error } = await supabase
        .from('member')
        .select('*');
      
      if (error) throw error;
      setMembers(data || []);
    } catch (err: any) {
      setMemberError(err.message || 'Failed to fetch members');
      showToast('Failed to fetch members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  }, [showToast]);

  const toggleVerified = async (memberId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'yes' ? 'no' : 'yes';
    try {
      const member = members.find(m => m.id === memberId);
      let updates: any = { verified: newStatus };
      
      if (newStatus === 'yes' && !member?.member_id) {
        // Generate unique 6-digit ID
        const generatedId = Math.floor(100000 + Math.random() * 900000).toString();
        updates.member_id = generatedId;
      }

      const { error } = await supabase
        .from('member')
        .update(updates)
        .eq('id', memberId);
      
      if (error) {
        throw error;
      }
      
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));
      showToast(`Member ${newStatus === 'yes' ? 'verified' : 'unverified'}`, 'success');
    } catch (err) {
      console.error('Error updating member:', err);
      showToast('Failed to update member', 'error');
    }
  };

  const handleMemberPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => {
    await handleFileUpload(e, undefined, async (url) => {
      try {
        const { error } = await supabase
          .from('member')
          .update({ photo_url: url })
          .eq('id', memberId);
        
        if (error) throw error;
        
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, photo_url: url } : m));
        showToast("Member photo updated successfully", "success");
      } catch (err: any) {
        showToast(`Failed to update member photo: ${err.message}`, "error");
      }
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => {
    if (!isSupabaseConfigured) {
      showToast("Database is not configured. File upload is disabled.", "error");
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (limit to 10MB for safety)
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      showToast("File is too large. Maximum size is 10MB.", "error");
      return;
    }

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      showToast("Only .jpg, .png, .webp and .pdf formats are allowed.", "error");
      return;
    }

    const uploadId = path ? path.join('-') : Math.random().toString(36).substr(2, 9);
    setUploading(uploadId);

    try {
      const nameParts = file.name.split('.');
      const extension = nameParts.length > 1 ? nameParts.pop() : 'png';
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${extension}`;

      const { data, error } = await supabase.storage
        .from('images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      if (callback) {
        callback(publicUrl);
      }
      showToast("File uploaded successfully!", "success");
    } catch (error: any) {
      const errorMessage = error.message || error.error_description || "Unknown error";
      showToast(`Upload failed: ${errorMessage}. Ensure 'images' bucket exists and is public.`, "error");
    } finally {
      setUploading(null);
    }
  };

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
    if (activeTab === 'access') {
      fetchProfiles();
    }
  }, [activeTab, fetchMembers, fetchProfiles]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login?redirect=/admin');
      return;
    }
    if (!authLoading && !isAdmin) {
      // We'll show an access denied message instead of immediate redirect to help debugging
    }
  }, [isAdmin, authLoading, user, router]);

  useEffect(() => {
    if (content) {
      setLocalContent(JSON.parse(JSON.stringify(content)));
    }
  }, [content]);

  if (authLoading || contentLoading || (isAdmin && !localContent)) {
    return <AdminSkeleton />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="atmospheric-glow w-[600px] h-[600px] bg-red-500/5 -top-48 -left-24" />
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full p-12 rounded-[3rem] bg-white/[0.02] border border-white/10 backdrop-blur-3xl text-center space-y-8 relative z-10"
        >
          <div className="w-20 h-20 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="w-10 h-10 text-red-500" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white font-display tracking-tight uppercase">Access Denied</h1>
            <p className="text-zinc-500 text-sm font-medium leading-relaxed">
              You do not have administrative privileges to access this dashboard.
            </p>
          </div>
          <div className="p-4 bg-black/40 rounded-2xl text-[10px] font-mono text-zinc-500 text-left space-y-1">
            <div className="flex justify-between">
              <span>User:</span>
              <span className="text-zinc-300">{user?.email || 'Not Logged In'}</span>
            </div>
            <div className="flex justify-between">
              <span>Status:</span>
              <span className="text-amber-500 font-bold">{user ? 'Authenticated' : 'Guest'}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <DashboardButton 
              label="Return Home" 
              onClick={() => router.push('/')}
              variant="secondary"
            />
            {!user && (
              <DashboardButton 
                label="Sign In" 
                onClick={() => router.push('/login')}
              />
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      await saveAllContent(localContent);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (section: string, field: string, value: any) => {
    setLocalContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const updateNestedField = (section: string, subSection: string, field: string, value: any) => {
    setLocalContent((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [subSection]: {
          ...prev[section][subSection],
          [field]: value
        }
      }
    }));
  };

  const addListItem = (section: string, field: string, newItem: any) => {
    setLocalContent((prev: any) => {
      const sectionData = prev[section] || {};
      const currentList = sectionData[field] || [];
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: [...currentList, newItem]
        }
      };
    });
  };

  const removeListItem = (section: string, field: string, index: number) => {
    setConfirmDelete({ section, field, index, isOpen: true });
  };

  const executeDelete = () => {
    const { section, field, index } = confirmDelete;
    setLocalContent((prev: any) => {
      const sectionData = prev[section] || {};
      const currentList = sectionData[field] || [];
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: currentList.filter((_: any, i: number) => i !== index)
        }
      };
    });
  };

  const updateListItem = (section: string, field: string, index: number, value: any) => {
    setLocalContent((prev: any) => {
      const sectionData = prev[section] || {};
      const currentList = [...(sectionData[field] || [])];
      if (currentList[index]) {
        currentList[index] = { ...currentList[index], ...value };
      }
      return {
        ...prev,
        [section]: {
          ...sectionData,
          [field]: currentList
        }
      };
    });
  };

  const updateDeepListItem = (path: string[], index: number, value: any) => {
    setLocalContent((prev: any) => produce(prev, (draft: any) => {
      let current = draft;
      for (let i = 0; i < path.length; i++) {
        if (!current[path[i]]) current[path[i]] = {};
        current = current[path[i]];
      }
      if (Array.isArray(current)) {
        current[index] = { ...current[index], ...value };
      }
    }));
  };

  const addDeepListItem = (path: string[], newItem: any) => {
    setLocalContent((prev: any) => produce(prev, (draft: any) => {
      let current = draft;
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
          if (!Array.isArray(current[path[i]])) current[path[i]] = [];
          current[path[i]].push(newItem);
        } else {
          if (!current[path[i]]) current[path[i]] = {};
          current = current[path[i]];
        }
      }
    }));
  };

  const removeDeepListItem = (path: string[], index: number) => {
    setLocalContent((prev: any) => produce(prev, (draft: any) => {
      let current = draft;
      for (let i = 0; i < path.length; i++) {
        if (i === path.length - 1) {
          if (Array.isArray(current[path[i]])) {
            current[path[i]].splice(index, 1);
          }
        } else {
          if (!current[path[i]]) current[path[i]] = {};
          current = current[path[i]];
        }
      }
    }));
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'panel', label: 'Panel', icon: Users },
    { id: 'members_list', label: 'Members List', icon: Users },
    { id: 'gallery', label: 'Gallery', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Award },
    { id: 'access', label: 'Access Control', icon: ShieldAlert },
    { id: 'site', label: 'Site Config', icon: Settings },
  ];

  return (
    <DashboardLayout 
      activeTab={activeTab}
      onTabChange={setActiveTab}
      onSave={handleSave}
      onReset={() => setLocalContent(content)}
      saving={isSaving}
      saveSuccess={saveStatus === 'success'}
      isSupabaseConfigured={isSupabaseConfigured}
      logoUrl={localContent?.site?.logoUrl}
      tabs={tabs}
    >
      <AnimatePresence mode="wait">
        {activeTab === 'home' && (
          <motion.div
            key="home"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={LayoutDashboard} title="Hero Section" description="The first thing visitors see on your homepage.">
              <div className="grid grid-cols-1 gap-6">
                <DashboardFormField 
                  label="Hero Title" 
                  value={localContent?.home?.heroTitle} 
                  onChange={(val) => updateField('home', 'heroTitle', val)} 
                />
                <DashboardFormField 
                  label="Hero Subtitle" 
                  type="textarea"
                  value={localContent?.home?.heroSubtitle} 
                  onChange={(val) => updateField('home', 'heroSubtitle', val)} 
                />
                <DashboardFormField 
                  label="Hero Tagline" 
                  value={localContent?.home?.heroTagline} 
                  onChange={(val) => updateField('home', 'heroTagline', val)} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Join Button Text" 
                    value={localContent?.home?.joinButtonText} 
                    onChange={(val) => updateField('home', 'joinButtonText', val)} 
                  />
                  <DashboardFormField 
                    label="Story Button Text" 
                    value={localContent?.home?.storyButtonText} 
                    onChange={(val) => updateField('home', 'storyButtonText', val)} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Memories Title" 
                    value={localContent?.home?.memoriesTitle} 
                    onChange={(val) => updateField('home', 'memoriesTitle', val)} 
                  />
                  <DashboardFormField 
                    label="Memories Tagline" 
                    value={localContent?.home?.memoriesTagline} 
                    onChange={(val) => updateField('home', 'memoriesTagline', val)} 
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hero Subtitles (Typewriter)</h4>
                  <div className="space-y-3">
                    {(localContent?.home?.heroSubtitles || []).map((text: string, i: number) => (
                      <div key={i} className="flex gap-2 items-start">
                        <div className="flex-1">
                          <DashboardFormField 
                            label={`Subtitle ${i + 1}`} 
                            value={text} 
                            onChange={(val) => {
                              const newList = [...localContent.home.heroSubtitles];
                              newList[i] = val;
                              updateField('home', 'heroSubtitles', newList);
                            }} 
                          />
                        </div>
                        <button 
                          onClick={() => {
                            const newList = localContent.home.heroSubtitles.filter((_: any, idx: number) => idx !== i);
                            updateField('home', 'heroSubtitles', newList);
                          }}
                          className="mt-8 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newList = [...(localContent?.home?.heroSubtitles || []), ""];
                        updateField('home', 'heroSubtitles', newList);
                      }}
                      className="w-full py-2 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-3 h-3" /> Add Subtitle
                    </button>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-white/5">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gallery Images</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(localContent?.home?.gallery || []).map((url: string, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => {
                             const newList = localContent.home.gallery.filter((_: any, idx: number) => idx !== i);
                             updateField('home', 'gallery', newList);
                          }}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <DashboardFileUpload 
                          label={`Image ${i + 1}`} 
                          value={url} 
                          uploading={uploading === `home-gallery-${i}`}
                          onUpload={(e) => handleFileUpload(e, [`home`, `gallery`, i], (newUrl) => {
                            const newList = [...localContent.home.gallery];
                            newList[i] = newUrl;
                            updateField('home', 'gallery', newList);
                          })} 
                        />
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newList = [...(localContent?.home?.gallery || []), ""];
                        updateField('home', 'gallery', newList);
                      }}
                      className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add Image
                    </button>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={Zap} title="Club Agenda" description="Define the club's mission and regular activities.">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Agenda Title" 
                    value={localContent?.home?.agendaTitle} 
                    onChange={(val) => updateField('home', 'agendaTitle', val)} 
                  />
                  <DashboardFormField 
                    label="Agenda Tagline" 
                    value={localContent?.home?.agendaTagline} 
                    onChange={(val) => updateField('home', 'agendaTagline', val)} 
                  />
                </div>
                <DashboardFormField 
                  label="Agenda Description" 
                  type="textarea"
                  value={localContent?.home?.agendaDescription} 
                  onChange={(val) => updateField('home', 'agendaDescription', val)} 
                />
                
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Agenda Items</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(localContent?.home?.agendaItems || []).map((item: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => removeListItem('home', 'agendaItems', i)}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          <DashboardFormField label="Title" value={item.title} onChange={(val) => updateListItem('home', 'agendaItems', i, { title: val })} />
                          <DashboardFormField 
                            label="Icon" 
                            type="select" 
                            value={item.icon} 
                            onChange={(val) => updateListItem('home', 'agendaItems', i, { icon: val })}
                            options={[
                              { value: 'Zap', label: 'Zap' },
                              { value: 'Trophy', label: 'Trophy' },
                              { value: 'Star', label: 'Star' },
                              { value: 'Lightbulb', label: 'Lightbulb' },
                              { value: 'Users', label: 'Users' },
                              { value: 'Award', label: 'Award' },
                              { value: 'BookOpen', label: 'BookOpen' }
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addListItem('home', 'agendaItems', { title: 'New Item', icon: 'Zap' })}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add Item
                    </button>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={Users} title="Testimonials" description="Manage the quotes from club leadership.">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Section Title" 
                    value={localContent?.home?.testimonialsTitle} 
                    onChange={(val) => updateField('home', 'testimonialsTitle', val)} 
                  />
                  <DashboardFormField 
                    label="Section Tagline" 
                    value={localContent?.home?.testimonialsTagline} 
                    onChange={(val) => updateField('home', 'testimonialsTagline', val)} 
                  />
                </div>
                <div className="grid grid-cols-1 gap-8">
                  {localContent?.home?.testimonials?.map((t: any, i: number) => (
                    <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative group">
                      <button 
                        onClick={() => removeListItem('home', 'testimonials', i)}
                        className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <DashboardFormField label="Name" value={t.name} onChange={(val) => updateListItem('home', 'testimonials', i, { name: val })} />
                        <DashboardFormField label="Role" value={t.role} onChange={(val) => updateListItem('home', 'testimonials', i, { role: val })} />
                      </div>
                      <DashboardFormField label="Message" type="textarea" value={t.message} onChange={(val) => updateListItem('home', 'testimonials', i, { message: val })} />
                      <DashboardFileUpload 
                        label="Profile Image" 
                        value={t.imageUrl} 
                        uploading={uploading === `home-testimonials-${i}`}
                        onUpload={(e) => handleFileUpload(e, [`home`, `testimonials`, i], (url) => updateListItem('home', 'testimonials', i, { imageUrl: url }))} 
                      />
                    </div>
                  ))}
                  <button 
                    onClick={() => addListItem('home', 'testimonials', { name: '', role: '', message: '', imageUrl: '' })}
                    className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
                  >
                    <Plus className="w-5 h-5" /> Add Testimonial
                  </button>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'about' && (
          <motion.div
            key="about"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={FileText} title="About Page Content" description="Define your club's history and mission.">
              <div className="grid grid-cols-1 gap-6">
                <DashboardFormField 
                  label="Page Title" 
                  value={localContent?.about?.title} 
                  onChange={(val) => updateField('about', 'title', val)} 
                />
                <DashboardFormField 
                  label="Description" 
                  type="textarea"
                  value={localContent?.about?.description} 
                  onChange={(val) => updateField('about', 'description', val)} 
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Vision Tagline" 
                    value={localContent?.about?.visionTagline} 
                    onChange={(val) => updateField('about', 'visionTagline', val)} 
                  />
                  <DashboardFormField 
                    label="Objectives Title" 
                    value={localContent?.about?.objectivesTitle} 
                    onChange={(val) => updateField('about', 'objectivesTitle', val)} 
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Path Tagline" 
                    value={localContent?.about?.pathTagline} 
                    onChange={(val) => updateField('about', 'pathTagline', val)} 
                  />
                  <DashboardFormField 
                    label="Vision Steps Title" 
                    value={localContent?.about?.visionStepsTitle} 
                    onChange={(val) => updateField('about', 'visionStepsTitle', val)} 
                  />
                </div>
                <DashboardFormField 
                  label="Mission Statement" 
                  type="textarea"
                  value={localContent?.about?.mission} 
                  onChange={(val) => updateField('about', 'mission', val)} 
                />

                <div className="space-y-8 pt-8 border-t border-white/5">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Statistics</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(localContent?.about?.stats || []).map((stat: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                          <button 
                            onClick={() => removeListItem('about', 'stats', i)}
                            className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="grid grid-cols-1 gap-3">
                            <DashboardFormField label="Number" value={stat.number} onChange={(val) => updateListItem('about', 'stats', i, { number: val })} />
                            <DashboardFormField label="Label" value={stat.label} onChange={(val) => updateListItem('about', 'stats', i, { label: val })} />
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => addListItem('about', 'stats', { number: '0', label: 'New Stat' })}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Plus className="w-4 h-4" /> Add Stat
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objectives</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(localContent?.about?.objectives || []).map((obj: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                          <button 
                            onClick={() => removeListItem('about', 'objectives', i)}
                            className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="grid grid-cols-1 gap-3">
                            <DashboardFormField label="Title" value={obj.title} onChange={(val) => updateListItem('about', 'objectives', i, { title: val })} />
                            <DashboardFormField label="Description" type="textarea" value={obj.description} onChange={(val) => updateListItem('about', 'objectives', i, { description: val })} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <DashboardFormField 
                                label="Icon" 
                                type="select" 
                                value={obj.icon} 
                                onChange={(val) => updateListItem('about', 'objectives', i, { icon: val })}
                                options={[
                                  { value: 'Calculator', label: 'Calculator' },
                                  { value: 'Trophy', label: 'Trophy' },
                                  { value: 'Lightbulb', label: 'Lightbulb' },
                                  { value: 'Heart', label: 'Heart' },
                                  { value: 'Award', label: 'Award' },
                                  { value: 'Users', label: 'Users' }
                                ]}
                              />
                              <DashboardFormField 
                                label="Color Class" 
                                value={obj.color} 
                                onChange={(val) => updateListItem('about', 'objectives', i, { color: val })}
                                placeholder="e.g. text-purple-400"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => addListItem('about', 'objectives', { title: 'New Objective', description: '', icon: 'Lightbulb', color: 'text-amber-400' })}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Plus className="w-4 h-4" /> Add Objective
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vision Steps</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(localContent?.about?.visionSteps || []).map((step: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                          <button 
                            onClick={() => removeListItem('about', 'visionSteps', i)}
                            className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="grid grid-cols-1 gap-3">
                            <DashboardFormField label="Title" value={step.title} onChange={(val) => updateListItem('about', 'visionSteps', i, { title: val })} />
                            <DashboardFormField label="Description" type="textarea" value={step.desc} onChange={(val) => updateListItem('about', 'visionSteps', i, { desc: val })} />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <DashboardFormField 
                                label="Icon" 
                                type="select" 
                                value={step.icon} 
                                onChange={(val) => updateListItem('about', 'visionSteps', i, { icon: val })}
                                options={[
                                  { value: 'Target', label: 'Target' },
                                  { value: 'Zap', label: 'Zap' },
                                  { value: 'Rocket', label: 'Rocket' },
                                  { value: 'Globe', label: 'Globe' },
                                  { value: 'Trophy', label: 'Trophy' }
                                ]}
                              />
                              <DashboardFormField 
                                label="Color Class" 
                                value={step.color} 
                                onChange={(val) => updateListItem('about', 'visionSteps', i, { color: val })}
                                placeholder="e.g. bg-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                      <button 
                        onClick={() => addListItem('about', 'visionSteps', { title: 'New Step', desc: '', icon: 'Zap', color: 'bg-indigo-500' })}
                        className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                      >
                        <Plus className="w-4 h-4" /> Add Vision Step
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'events' && (
          <motion.div
            key="events"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={Calendar} title="Events Page Header" description="Customize the title and description of the Events page.">
              <div className="grid grid-cols-1 gap-6">
                <DashboardFormField 
                  label="Page Title" 
                  value={localContent?.events?.title} 
                  onChange={(val) => updateField('events', 'title', val)} 
                />
                <DashboardFormField 
                  label="Page Subtitle" 
                  value={localContent?.events?.subtitle} 
                  onChange={(val) => updateField('events', 'subtitle', val)} 
                />
                <DashboardFormField 
                  label="Page Description" 
                  type="textarea"
                  value={localContent?.events?.description} 
                  onChange={(val) => updateField('events', 'description', val)} 
                />
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(localContent?.events?.categories || []).map((cat: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => removeListItem('events', 'categories', i)}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          <DashboardFormField label="ID" value={cat.id} onChange={(val) => updateListItem('events', 'categories', i, { id: val })} />
                          <DashboardFormField label="Name" value={cat.name} onChange={(val) => updateListItem('events', 'categories', i, { name: val })} />
                          <DashboardFormField 
                            label="Icon" 
                            type="select" 
                            value={cat.icon} 
                            onChange={(val) => updateListItem('events', 'categories', i, { icon: val })}
                            options={[
                              { value: 'Calendar', label: 'Calendar' },
                              { value: 'Trophy', label: 'Trophy' },
                              { value: 'BookOpen', label: 'BookOpen' },
                              { value: 'Users', label: 'Users' },
                              { value: 'Star', label: 'Star' }
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addListItem('events', 'categories', { id: 'new', name: 'New Category', icon: 'Calendar' })}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={Calendar} title="Manage Events" description="Add or edit club competitions and workshops.">
              <div className="grid grid-cols-1 gap-8">
                {(localContent.events?.events || []).map((e: any, i: number) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
                    <button 
                      onClick={() => removeListItem('events', 'events', i)}
                      className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Event Title" value={e.title} onChange={(val) => updateListItem('events', 'events', i, { title: val })} />
                      <DashboardFormField label="Category" value={e.category} onChange={(val) => updateListItem('events', 'events', i, { category: val })} />
                    </div>
                    <DashboardFormField label="Description" type="textarea" value={e.description} onChange={(val) => updateListItem('events', 'events', i, { description: val })} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DashboardFormField label="Date" value={e.date} onChange={(val) => updateListItem('events', 'events', i, { date: val })} />
                      <DashboardFormField label="Time" value={e.time} onChange={(val) => updateListItem('events', 'events', i, { time: val })} />
                      <DashboardFormField label="Location" value={e.location} onChange={(val) => updateListItem('events', 'events', i, { location: val })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DashboardFormField label="Button Text" value={e.buttonText} onChange={(val) => updateListItem('events', 'events', i, { buttonText: val })} />
                      <DashboardFormField label="Registration Link" value={e.registrationLink} onChange={(val) => updateListItem('events', 'events', i, { registrationLink: val })} />
                      <DashboardFormField 
                        label="Tag" 
                        type="select" 
                        value={e.tag} 
                        onChange={(val) => updateListItem('events', 'events', i, { tag: val })}
                        options={[
                          { value: 'general', label: 'General' },
                          { value: 'important', label: 'Important' },
                          { value: 'urgent', label: 'Urgent' },
                          { value: 'success', label: 'Success' }
                        ]}
                      />
                    </div>
                    <DashboardFileUpload 
                      label="Event Banner" 
                      value={e.imageUrl} 
                      uploading={uploading === `events-events-${i}`}
                      onUpload={(ev) => handleFileUpload(ev, [`events`, `events`, i], (url) => updateListItem('events', 'events', i, { imageUrl: url }))} 
                    />
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('events', 'events', { title: 'New Event', category: 'Competition', description: '', date: '', time: '', location: '', imageUrl: '', buttonText: 'Register Now', registrationLink: '', tag: 'general' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" /> Add New Event
                </button>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'notices' && (
          <motion.div
            key="notices"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={Bell} title="Notice Board Header" description="Customize the title and description of the Notice Board page.">
              <div className="grid grid-cols-1 gap-6">
                <DashboardFormField 
                  label="Page Title" 
                  value={localContent?.notices?.title} 
                  onChange={(val) => updateField('notices', 'title', val)} 
                />
                <DashboardFormField 
                  label="Page Subtitle" 
                  value={localContent?.notices?.subtitle} 
                  onChange={(val) => updateField('notices', 'subtitle', val)} 
                />
                <DashboardFormField 
                  label="Page Description" 
                  type="textarea"
                  value={localContent?.notices?.description} 
                  onChange={(val) => updateField('notices', 'description', val)} 
                />
                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categories</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(localContent?.notices?.categories || []).map((cat: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => removeListItem('notices', 'categories', i)}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-1 gap-3">
                          <DashboardFormField label="ID" value={cat.id} onChange={(val) => updateListItem('notices', 'categories', i, { id: val })} />
                          <DashboardFormField label="Name" value={cat.name} onChange={(val) => updateListItem('notices', 'categories', i, { name: val })} />
                          <DashboardFormField 
                            label="Icon" 
                            type="select" 
                            value={cat.icon} 
                            onChange={(val) => updateListItem('notices', 'categories', i, { icon: val })}
                            options={[
                              { value: 'Bell', label: 'Bell' },
                              { value: 'Info', label: 'Info' },
                              { value: 'AlertTriangle', label: 'Alert' },
                              { value: 'CheckCircle', label: 'Success' },
                              { value: 'Star', label: 'Star' }
                            ]}
                          />
                        </div>
                      </div>
                    ))}
                    <button 
                      onClick={() => addListItem('notices', 'categories', { id: 'new', name: 'New Category', icon: 'Bell' })}
                      className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                    >
                      <Plus className="w-4 h-4" /> Add Category
                    </button>
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={Bell} title="Manage Notices" description="Post important announcements and updates.">
              <div className="grid grid-cols-1 gap-8">
                {(localContent.notices?.notices || []).map((n: any, i: number) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
                    <button 
                      onClick={() => removeListItem('notices', 'notices', i)}
                      className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Notice Title" value={n.title} onChange={(val) => updateListItem('notices', 'notices', i, { title: val })} />
                      <DashboardFormField label="Type" value={n.type} onChange={(val) => updateListItem('notices', 'notices', i, { type: val })} />
                    </div>
                    <DashboardFormField label="Content" type="textarea" value={n.content} onChange={(val) => updateListItem('notices', 'notices', i, { content: val })} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Date" value={n.date} onChange={(val) => updateListItem('notices', 'notices', i, { date: val })} />
                      <DashboardFormField label="Link (Optional)" value={n.link} onChange={(val) => updateListItem('notices', 'notices', i, { link: val })} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Link Text" value={n.linkText} onChange={(val) => updateListItem('notices', 'notices', i, { linkText: val })} />
                      <DashboardFormField 
                        label="Tag" 
                        type="select" 
                        value={n.tag} 
                        onChange={(val) => updateListItem('notices', 'notices', i, { tag: val })}
                        options={[
                          { value: 'general', label: 'General' },
                          { value: 'important', label: 'Important' },
                          { value: 'urgent', label: 'Urgent' },
                          { value: 'success', label: 'Success' }
                        ]}
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="checkbox" 
                        id={`pin-${i}`}
                        checked={n.isPinned} 
                        onChange={(e) => updateListItem('notices', 'notices', i, { isPinned: e.target.checked })}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500"
                      />
                      <label htmlFor={`pin-${i}`} className="text-sm font-bold text-zinc-400">Pin to top</label>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('notices', 'notices', { title: 'New Notice', type: 'General', content: '', date: new Date().toLocaleDateString(), isPinned: false, link: '', linkText: 'View Details', tag: 'general' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" /> Add New Notice
                </button>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'panel' && (
          <motion.div
            key="panel"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection title="Panel Page Content" description="Manage titles and subtitles for the Panel page" icon={Users}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Moderators Title" value={localContent?.panel?.moderatorsTitle} onChange={(val) => updateField('panel', 'moderatorsTitle', val)} />
                <DashboardFormField label="Executive Title" value={localContent?.panel?.executiveTitle} onChange={(val) => updateField('panel', 'executiveTitle', val)} />
                <DashboardFormField label="Executive Subtitle" value={localContent?.panel?.executiveSubtitle} onChange={(val) => updateField('panel', 'executiveSubtitle', val)} />
                <DashboardFormField label="Departments Title" value={localContent?.panel?.departmentsTitle} onChange={(val) => updateField('panel', 'departmentsTitle', val)} />
                <DashboardFormField label="Departments Subtitle" value={localContent?.panel?.departmentsSubtitle} onChange={(val) => updateField('panel', 'departmentsSubtitle', val)} />
                <DashboardFormField label="Secretaries Title" value={localContent?.panel?.secretariesTitle} onChange={(val) => updateField('panel', 'secretariesTitle', val)} />
              </div>
            </DashboardSection>

            <DashboardSection icon={Users} title="Moderators" description="Manage the club's moderators who are always displayed at the top of the Panel page.">
              <div className="grid grid-cols-1 gap-8">
                {(localContent.panel?.moderators || []).map((m: any, i: number) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
                    <button 
                      onClick={() => removeListItem('panel', 'moderators', i)}
                      className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Name" value={m.name} onChange={(val) => updateListItem('panel', 'moderators', i, { name: val })} />
                      <DashboardFormField label="Role" value={m.role} onChange={(val) => updateListItem('panel', 'moderators', i, { role: val })} />
                    </div>
                    <DashboardFileUpload 
                      label="Profile Image" 
                      value={m.imageUrl} 
                      uploading={uploading === `panel-moderators-${i}`}
                      onUpload={(ev) => handleFileUpload(ev, [`panel`, `moderators`, i], (url) => updateListItem('panel', 'moderators', i, { imageUrl: url }))} 
                      onDelete={() => updateListItem('panel', 'moderators', i, { imageUrl: '' })}
                      onChange={(path, val) => updateListItem('panel', 'moderators', i, { imageUrl: val })}
                    />
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('panel', 'moderators', { name: '', role: 'Moderator', imageUrl: '' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" /> Add Moderator
                </button>
              </div>
            </DashboardSection>

            <DashboardSection icon={ShieldAlert} title="Executive Body Management" description="Manage the current, recent, and former executive members.">
              <div className="space-y-8">
                {/* Executive Body Tabs */}
                <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
                  {['current', 'recent', 'former'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setExecutiveTab(tab as any)}
                      className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                        executiveTab === tab 
                          ? 'bg-amber-500 text-black shadow-lg' 
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-12">
                  {/* Reusable Member List Component Logic */}
                  {[
                    { id: 'president', label: 'President', icon: Star, single: true },
                    { id: 'generalSecretary', label: 'General Secretary', icon: Briefcase, single: true },
                    { id: 'deputyPresidents', label: 'Deputy Presidents', icon: Award },
                    { id: 'vicePresidents', label: 'Vice Presidents', icon: Award },
                    { id: 'departments', label: 'Department Heads', icon: Users, isDept: true },
                  ].map((category) => {
                    const list = localContent.panel?.executive?.[executiveTab]?.[category.id] || [];
                    return (
                      <div key={category.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <category.icon className="w-4 h-4 text-amber-500" />
                            <h4 className="text-xs font-bold uppercase tracking-widest text-white">{category.label}</h4>
                          </div>
                          {(!category.single || list.length === 0) && (
                            <button 
                              onClick={() => addDeepListItem(['panel', 'executive', executiveTab, category.id], 
                                category.isDept ? { dept: 'New Dept', name: '', imageUrl: '' } : { name: '', role: category.label, imageUrl: '' }
                              )}
                              className="p-1 text-amber-500 hover:text-amber-400 transition-colors"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {list.map((m: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                              <button 
                                onClick={() => removeDeepListItem(['panel', 'executive', executiveTab, category.id], i)}
                                className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {category.isDept && (
                                  <DashboardFormField label="Department" value={m.dept} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { dept: val })} />
                                )}
                                <DashboardFormField label="Name" value={m.name} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { name: val })} />
                                {!category.isDept && !category.single && (
                                  <DashboardFormField label="Role" value={m.role} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { role: val })} />
                                )}
                              </div>
                              <div className="mt-4">
                                <DashboardFileUpload 
                                  label="Photo" 
                                  value={m.imageUrl} 
                                  uploading={uploading === `panel-executive-${executiveTab}-${category.id}-${i}`}
                                  onUpload={(ev) => handleFileUpload(ev, [`panel`, `executive`, executiveTab, category.id, i], (url) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: url }))} 
                                  onDelete={() => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: '' })}
                                  onChange={(path, val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: val })}
                                />
                              </div>
                            </div>
                          ))}
                          {list.length === 0 && (
                            <p className="text-[10px] text-zinc-600 italic">No members added to this category.</p>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {/* Secretaries Section */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Secretary Positions
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {[
                        { id: 'asstGeneralSecretary', label: 'Asst. General Secretary' },
                        { id: 'jointSecretary', label: 'Joint Secretary' },
                        { id: 'organizingSecretary', label: 'Organizing Secretary' },
                        { id: 'correspondingSecretary', label: 'Corresponding Secretary' }
                      ].map((sec) => {
                        const list = localContent.panel?.executive?.[executiveTab]?.secretaries?.[sec.id] || [];
                        return (
                          <div key={sec.id} className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{sec.label}</h5>
                              <button 
                                onClick={() => addDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], { name: '', imageUrl: '' })}
                                className="p-1 text-amber-500 hover:text-amber-400 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="space-y-2">
                              {list.map((s: any, i: number) => (
                                <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3 relative group">
                                  <button 
                                    onClick={() => removeDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i)}
                                    className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                  <DashboardFormField label="Name" value={s.name} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { name: val })} />
                                  <DashboardFileUpload 
                                    label="Photo" 
                                    value={s.imageUrl} 
                                    uploading={uploading === `panel-executive-${executiveTab}-secretaries-${sec.id}-${i}`}
                                    onUpload={(ev) => handleFileUpload(ev, [`panel`, `executive`, executiveTab, `secretaries`, sec.id, i], (url) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: url }))} 
                                    onDelete={() => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: '' })}
                                    onChange={(path, val) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: val })}
                                  />
                                </div>
                              ))}
                              {list.length === 0 && (
                                <p className="text-[10px] text-zinc-600 italic">None</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'members_list' && (
          <motion.div
            key="members_list"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={Users} title="Members List Header" description="Customize the title and description of the Members List section.">
              <div className="grid grid-cols-1 gap-6">
                <DashboardFormField 
                  label="Section Title" 
                  value={localContent?.members_list?.title} 
                  onChange={(val) => updateField('members_list', 'title', val)} 
                />
                <DashboardFormField 
                  label="Section Subtitle" 
                  value={localContent?.members_list?.subtitle} 
                  onChange={(val) => updateField('members_list', 'subtitle', val)} 
                />
                <DashboardFormField 
                  label="Section Description" 
                  type="textarea"
                  value={localContent?.members_list?.description} 
                  onChange={(val) => updateField('members_list', 'description', val)} 
                />
              </div>
            </DashboardSection>

            <DashboardSection icon={Users} title="Manage Members" description="Add or edit members in the static list.">
              <div className="grid grid-cols-1 gap-8">
                {(localContent.members_list?.members || []).map((m: any, i: number) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative group">
                    <button 
                      onClick={() => removeListItem('members_list', 'members', i)}
                      className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <DashboardFormField label="Name" value={m.name} onChange={(val) => updateListItem('members_list', 'members', i, { name: val })} />
                      <DashboardFormField label="Role/Batch" value={m.role} onChange={(val) => updateListItem('members_list', 'members', i, { role: val })} />
                    </div>
                    <DashboardFileUpload 
                      label="Profile Image" 
                      value={m.imageUrl} 
                      uploading={uploading === `members_list-members-${i}`}
                      onUpload={(ev) => handleFileUpload(ev, [`members_list`, `members`, i], (url) => updateListItem('members_list', 'members', i, { imageUrl: url }))} 
                      onDelete={() => updateListItem('members_list', 'members', i, { imageUrl: '' })}
                      onChange={(path, val) => updateListItem('members_list', 'members', i, { imageUrl: val })}
                    />
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('members_list', 'members', { name: '', role: '', imageUrl: '' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Plus className="w-5 h-5" /> Add New Member
                </button>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'gallery' && (
          <motion.div
            key="gallery"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={LayoutDashboard} title="Gallery Page Management" description="Manage the images displayed on the dedicated Gallery page.">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(localContent.gallery_page?.images || []).map((url: string, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                    <button 
                      onClick={() => {
                        const newList = localContent.gallery_page.images.filter((_: any, idx: number) => idx !== i);
                        updateField('gallery_page', 'images', newList);
                      }}
                      className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <DashboardFileUpload 
                      label={`Gallery Image ${i + 1}`} 
                      value={url} 
                      uploading={uploading === `gallery_page-images-${i}`}
                      onUpload={(ev) => handleFileUpload(ev, [`gallery_page`, `images`, i], (newUrl) => {
                        const newList = [...localContent.gallery_page.images];
                        newList[i] = newUrl;
                        updateField('gallery_page', 'images', newList);
                      })} 
                      onDelete={() => {
                        const newList = [...localContent.gallery_page.images];
                        newList[i] = '';
                        updateField('gallery_page', 'images', newList);
                      }}
                      onChange={(path, val) => {
                        const newList = [...localContent.gallery_page.images];
                        newList[i] = val;
                        updateField('gallery_page', 'images', newList);
                      }}
                    />
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const newList = [...(localContent?.gallery_page?.images || []), ""];
                    updateField('gallery_page', 'images', newList);
                  }}
                  className="w-full py-12 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus className="w-5 h-5" /> Add Image to Gallery
                </button>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'members' && (
          <motion.div
            key="members"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection 
              icon={Award} 
              title="Member Management" 
              description="Verify member registrations and manage payment statuses."
            >
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search by name or email..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white text-xs font-bold uppercase tracking-widest"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
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
                        {status === 'all' ? 'All' : status === 'yes' ? 'Verified' : 'Pending'}
                      </button>
                    ))}
                    <button 
                      onClick={fetchMembers}
                      disabled={loadingMembers}
                      className="p-2.5 text-amber-500 hover:bg-amber-500/10 border border-white/10 rounded-xl transition-all"
                    >
                      <Loader2 className={`w-4 h-4 ${loadingMembers ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {memberError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    <span>Error: {memberError}</span>
                    <button 
                      onClick={fetchMembers}
                      className="ml-auto underline hover:text-red-400"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Member</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Class/Roll</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Membership</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payment</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Verified</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {members
                        .filter(m => {
                          const matchesSearch = m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                              m.email?.toLowerCase().includes(memberSearch.toLowerCase());
                          const matchesFilter = memberFilter === 'all' || m.verified === memberFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((m) => (
                          <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="relative group/avatar">
                                  {m.photo_url ? (
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0 relative">
                                      <Image 
                                        src={resolveImageUrl(m.photo_url)} 
                                        alt="" 
                                        fill 
                                        className="object-cover" 
                                        unoptimized={!m.photo_url?.startsWith('http') && !m.photo_url?.startsWith('/uploads/')}
                                      />
                                    </div>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                      <UserIcon className="w-5 h-5 text-zinc-500" />
                                    </div>
                                  )}
                                  <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer rounded-full">
                                    {uploading === `member-photo-${m.id}` ? (
                                      <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                                    ) : (
                                      <Camera className="w-4 h-4 text-white" />
                                    )}
                                    <input 
                                      type="file" 
                                      className="hidden" 
                                      accept="image/*"
                                      onChange={(e) => {
                                        setUploading(`member-photo-${m.id}`);
                                        handleMemberPhotoUpload(e, m.id).finally(() => setUploading(null));
                                      }}
                                    />
                                  </label>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">{m.full_name}</span>
                                  <span className="text-[10px] text-zinc-500">{m.email_address || m.email}</span>
                                  {m.phone && <span className="text-[9px] text-zinc-600">PH: {m.phone}</span>}
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-xs text-zinc-400">{m.class} / {m.roll}</span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400">General Member</span>
                                {m.member_id && (
                                  <span className="text-[10px] font-mono font-bold text-white mt-1">ID: {m.member_id}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-500">{m.payment_method}</span>
                                {m.trxnid && <span className="text-[8px] font-mono text-zinc-500">TX: {m.trxnid}</span>}
                                {m.bkash_number && <span className="text-[8px] font-mono text-zinc-500">PH: {m.bkash_number}</span>}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`text-[10px] font-bold uppercase tracking-widest ${m.verified === 'yes' ? 'text-green-500' : 'text-red-500'}`}>
                                {m.verified === 'yes' ? 'YES' : 'NO'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => toggleVerified(m.id, m.verified)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  m.verified === 'yes'
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                    : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                }`}
                              >
                                {m.verified === 'yes' ? 'Unverify' : 'Verify'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {members.filter(m => {
                        const matchesSearch = m.full_name?.toLowerCase().includes(memberSearch.toLowerCase()) || 
                                            m.email?.toLowerCase().includes(memberSearch.toLowerCase());
                        const matchesFilter = memberFilter === 'all' || m.verified === memberFilter;
                        return matchesSearch && matchesFilter;
                      }).length === 0 && !loadingMembers && (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-zinc-600 italic text-xs">
                            No members found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'access' && (
          <motion.div
            key="access"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection 
              icon={ShieldAlert} 
              title="User Access Control" 
              description="Manage user roles and administrative permissions."
            >
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input 
                      type="text"
                      placeholder="Search by name, email or ID..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white text-xs font-bold uppercase tracking-widest"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'admin', 'member'].map((role) => (
                      <button
                        key={role}
                        onClick={() => setUserFilter(role)}
                        className={`px-4 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                          userFilter === role 
                            ? 'bg-amber-500 border-amber-500 text-black' 
                            : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        {role === 'all' ? 'All Users' : role === 'admin' ? 'Admins' : 'Members'}
                      </button>
                    ))}
                    <button 
                      onClick={fetchProfiles}
                      disabled={loadingProfiles}
                      className="p-2.5 text-amber-500 hover:bg-amber-500/10 border border-white/10 rounded-xl transition-all"
                    >
                      <Loader2 className={`w-4 h-4 ${loadingProfiles ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                {profileError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
                    <AlertCircle className="w-4 h-4" />
                    <span>Error: {profileError}</span>
                    <button 
                      onClick={fetchProfiles}
                      className="ml-auto underline hover:text-red-400"
                    >
                      Retry
                    </button>
                  </div>
                )}

                <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5 border-b border-white/5">
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">User</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">User ID</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Role</th>
                        <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {profiles
                        .filter(p => {
                          const searchLower = userSearch.toLowerCase();
                          const matchesSearch = 
                            p.full_name?.toLowerCase().includes(searchLower) || 
                            p.email?.toLowerCase().includes(searchLower) ||
                            p.id?.toLowerCase().includes(searchLower);
                          const matchesFilter = userFilter === 'all' || p.role === userFilter;
                          return matchesSearch && matchesFilter;
                        })
                        .map((p) => (
                          <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                  <UserIcon className="w-4 h-4 text-zinc-500" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-white">{p.full_name || 'No Name'}</span>
                                  <span className="text-[10px] text-zinc-500">{p.email}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="text-[10px] font-mono text-zinc-500">{p.id}</span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-widest ${
                                p.role === 'admin' 
                                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                                  : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                              }`}>
                                {p.role || 'member'}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => toggleUserRole(p.id, p.role || 'member')}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                                  p.role === 'admin'
                                    ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                    : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
                                }`}
                              >
                                {p.role === 'admin' ? 'Make Member' : 'Make Admin'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      {profiles.filter(p => {
                        const searchLower = userSearch.toLowerCase();
                        const matchesSearch = 
                          p.full_name?.toLowerCase().includes(searchLower) || 
                          p.email?.toLowerCase().includes(searchLower) ||
                          p.id?.toLowerCase().includes(searchLower);
                        const matchesFilter = userFilter === 'all' || p.role === userFilter;
                        return matchesSearch && matchesFilter;
                      }).length === 0 && !loadingProfiles && (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-zinc-600 italic text-xs">
                            No users found matching your criteria.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeTab === 'site' && (
          <motion.div
            key="site"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <DashboardSection icon={Settings} title="Global Site Settings" description="Configure basic site information.">
              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DashboardFormField 
                    label="Club Name" 
                    value={localContent?.site?.clubName} 
                    onChange={(val) => updateField('site', 'clubName', val)} 
                  />
                  <DashboardFormField 
                    label="Established Year" 
                    value={localContent?.site?.established} 
                    onChange={(val) => updateField('site', 'established', val)} 
                  />
                </div>
                
                <div className="p-6 rounded-3xl bg-red-500/5 border border-red-500/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-red-500 uppercase tracking-widest">Maintenance Mode</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">When enabled, normal users will see a maintenance page. Admins can still access the site.</p>
                    </div>
                    <DashboardFormField 
                      label="" 
                      type="toggle"
                      checked={localContent?.site?.maintenanceMode}
                      onCheckedChange={(val) => updateField('site', 'maintenanceMode', val)}
                    />
                  </div>
                  
                  {localContent?.site?.maintenanceMode && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-red-500/10"
                    >
                      <DashboardFormField 
                        label="Maintenance Message" 
                        type="textarea"
                        value={localContent?.site?.maintenanceMessage} 
                        onChange={(val) => updateField('site', 'maintenanceMessage', val)} 
                        placeholder="Enter the message users will see..."
                      />
                    </motion.div>
                  )}
                </div>

                <DashboardFileUpload 
                  label="Club Logo" 
                  value={localContent?.site?.logoUrl} 
                  uploading={uploading === 'site-logoUrl'}
                  onUpload={(e) => handleFileUpload(e, ['site', 'logoUrl'], (url) => updateField('site', 'logoUrl', url))} 
                />
              </div>
            </DashboardSection>

            <DashboardSection icon={Mail} title="Contact Information" description="Update the club's contact details and social links.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <DashboardFormField 
                  label="Email" 
                  value={localContent?.contact?.email} 
                  onChange={(val) => updateField('contact', 'email', val)} 
                />
                <DashboardFormField 
                  label="Phone" 
                  value={localContent?.contact?.phone} 
                  onChange={(val) => updateField('contact', 'phone', val)} 
                />
                <DashboardFormField 
                  label="Location" 
                  value={localContent?.contact?.location} 
                  onChange={(val) => updateField('contact', 'location', val)} 
                />
                <div className="space-y-4 md:col-span-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Social Media</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DashboardFormField 
                      label="Facebook" 
                      value={localContent?.contact?.socials?.facebook} 
                      onChange={(val) => updateNestedField('contact', 'socials', 'facebook', val)} 
                    />
                    <DashboardFormField 
                      label="Instagram" 
                      value={localContent?.contact?.socials?.instagram} 
                      onChange={(val) => updateNestedField('contact', 'socials', 'instagram', val)} 
                    />
                  </div>
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={Award} title="Registration Settings" description="Configure member registration details and payment instructions.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest">Registration Availability</h4>
                      <p className="text-[10px] text-zinc-500 font-medium">Manually turn on or off access to the registration form for users.</p>
                    </div>
                    <DashboardFormField 
                      label="" 
                      type="toggle"
                      checked={localContent?.registration?.registrationOpen}
                      onCheckedChange={(val) => updateField('registration', 'registrationOpen', val)}
                    />
                  </div>
                  
                  {!localContent?.registration?.registrationOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="pt-4 border-t border-amber-500/10"
                    >
                      <DashboardFormField 
                        label="Registration Closed Message" 
                        type="textarea"
                        value={localContent?.registration?.registrationClosedMessage} 
                        onChange={(val) => updateField('registration', 'registrationClosedMessage', val)} 
                        placeholder="Enter the message users will see when registration is closed..."
                      />
                    </motion.div>
                  )}
                </div>

                <DashboardFormField 
                  label="Registration Fee" 
                  value={localContent?.registration?.fee} 
                  onChange={(val) => updateField('registration', 'fee', val)} 
                />
                <DashboardFormField 
                  label="bKash Number" 
                  value={localContent?.registration?.bkashNumber} 
                  onChange={(val) => updateField('registration', 'bkashNumber', val)} 
                />
                <div className="md:col-span-2">
                  <DashboardFormField 
                    label="Cash Payment Instructions" 
                    type="textarea"
                    value={localContent?.registration?.cashInstructions} 
                    onChange={(val) => updateField('registration', 'cashInstructions', val)} 
                  />
                </div>
                <div className="md:col-span-2 space-y-4">
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">bKash Instructions</h4>
                  {localContent?.registration?.instructions?.map((step: string, i: number) => (
                    <div key={i} className="flex gap-2">
                      <DashboardFormField 
                        label={`Step ${i + 1}`} 
                        value={step} 
                        onChange={(val) => {
                          const newSteps = [...localContent.registration.instructions];
                          newSteps[i] = val;
                          updateField('registration', 'instructions', newSteps);
                        }} 
                      />
                      <button 
                        onClick={() => {
                          const newSteps = localContent.registration.instructions.filter((_: any, idx: number) => idx !== i);
                          updateField('registration', 'instructions', newSteps);
                        }}
                        className="mt-8 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                  <button 
                    onClick={() => {
                      const newSteps = [...(localContent?.registration?.instructions || []), ""];
                      updateField('registration', 'instructions', newSteps);
                    }}
                    className="w-full py-3 border border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest"
                  >
                    <Plus className="w-4 h-4" /> Add Step
                  </button>
                </div>
                <div className="md:col-span-2 pt-4 border-t border-white/5">
                  <DashboardFormField 
                    label="Membership Declaration" 
                    type="textarea"
                    value={localContent?.registration?.declaration} 
                    onChange={(val) => updateField('registration', 'declaration', val)} 
                    description="The agreement text members must accept during registration."
                  />
                </div>
              </div>
            </DashboardSection>

            <DashboardSection icon={ShieldAlert} title="Database Setup" description="If you&apos;re seeing database errors, follow these steps to set up your Supabase project.">
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                  <div className="flex items-center gap-3 text-amber-500">
                    <Rocket className="w-5 h-5" />
                    <h3 className="text-sm font-bold uppercase tracking-widest">Initialization</h3>
                  </div>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    If your database is empty, click the button below to push the current website content to Supabase. 
                    This will ensure your website has data to display.
                  </p>
                  <DashboardButton 
                    label="Push Content to Database" 
                    onClick={async () => {
                      try {
                        await seedDatabase();
                        showToast("Database seeded successfully!", "success");
                      } catch (err: any) {
                        showToast(`Seeding failed: ${err.message}`, "error");
                      }
                    }}
                    icon={Zap}
                    className="w-full"
                  />
                </div>

                <div className="space-y-4">
                  <p className="text-sm text-zinc-400">
                    Copy and run the following SQL in your Supabase SQL Editor to create the required tables and security policies:
                  </p>
                  <div className="p-4 rounded-xl bg-black/40 border border-white/10 font-mono text-[10px] text-zinc-300 overflow-x-auto whitespace-pre">
{`-- 1. Create or Repair the site_content table
do $$ 
begin
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'site_content') then
    create table public.site_content (
      id text primary key,
      data jsonb not null,
      updated_at timestamp with time zone default now()
    );
  else
    if not exists (select from information_schema.columns where table_name = 'site_content' and column_name = 'data') then
      alter table public.site_content add column data jsonb not null default '{}'::jsonb;
    end if;
  end if;
end $$;

-- 2. Enable Row Level Security
alter table public.site_content enable row level security;

-- 2.5 Create is_admin helper function
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ) or (
    (auth.jwt() ->> 'email' = 'l47idkpro@gmail.com' or auth.jwt() ->> 'email' = 'jarysucksatgames@gmail.com')
    and (auth.jwt() ->> 'email_verified')::boolean = true
  );
end;
$$ language plpgsql security definer;

-- 3. Create or Update policies for site_content
drop policy if exists "Allow public read access" on public.site_content;
create policy "Allow public read access"
  on public.site_content for select
  using ( true );

drop policy if exists "Allow admin full access" on public.site_content;
create policy "Allow admin full access"
  on public.site_content for all
  using ( is_admin() )
  with check ( is_admin() );

-- 4. Create or Repair the profiles and member tables
do $$ 
begin
  -- Profiles table
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'profiles') then
    create table public.profiles (
      id uuid references auth.users on delete cascade primary key,
      email text,
      full_name text,
      role text default 'member',
      school text,
      class text,
      section text,
      roll text,
      intra_events boolean,
      intra_events_chosen boolean default false,
      updated_at timestamp with time zone default now()
    );
  else
    -- Add missing columns to profiles
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'role') then
      alter table public.profiles add column role text default 'member';
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'full_name') then
      alter table public.profiles add column full_name text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'school') then
      alter table public.profiles add column school text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'class') then
      alter table public.profiles add column class text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'section') then
      alter table public.profiles add column section text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'roll') then
      alter table public.profiles add column roll text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'phone') then
      alter table public.profiles add column phone text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'intra_events_chosen') then
      alter table public.profiles add column intra_events_chosen boolean default false;
    end if;
    if not exists (select from information_schema.columns where table_name = 'profiles' and column_name = 'intra_events') then
      alter table public.profiles add column intra_events boolean;
    end if;
  end if;

  -- Member table
  if not exists (select from pg_tables where schemaname = 'public' and tablename = 'member') then
    create table public.member (
      id uuid references auth.users on delete cascade primary key,
      full_name text,
      email text,
      school text,
      class text,
      section text,
      roll text,
      created_at timestamp with time zone default now()
    );
  else
    -- Add missing columns to member
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'school') then
      alter table public.member add column school text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'class') then
      alter table public.member add column class text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'section') then
      alter table public.member add column section text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'roll') then
      alter table public.member add column roll text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'payment_method') then
      alter table public.member add column payment_method text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'trxnid') then
      alter table public.member add column trxnid text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'bkash_number') then
      alter table public.member add column bkash_number text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'verified') then
      alter table public.member add column verified text default 'no';
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'phone') then
      alter table public.member add column phone text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'email_address') then
      alter table public.member add column email_address text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'member_id') then
      alter table public.member add column member_id text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'photo_url') then
      alter table public.member add column photo_url text;
    end if;
    if not exists (select from information_schema.columns where table_name = 'member' and column_name = 'created_at') then
      alter table public.member add column created_at timestamp with time zone default now();
    end if;

    -- Remove EC related columns
    alter table public.member drop column if exists membership_type;
    alter table public.member drop column if exists department;
    alter table public.profiles drop column if exists membership_type;
    alter table public.profiles drop column if exists department;
  end if;
end $$;

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.member enable row level security;

-- Policies for profiles
drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using ( auth.uid() = id );

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using ( is_admin() );

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for all
  using ( is_admin() )
  with check ( is_admin() );

-- Policies for member
drop policy if exists "Admins can view all members" on public.member;
create policy "Admins can view all members"
  on public.member for select
  using ( is_admin() );

drop policy if exists "Users can view their own member entry" on public.member;
create policy "Users can view their own member entry"
  on public.member for select
  using ( auth.uid() = id );

drop policy if exists "Users can insert their own member entry" on public.member;
create policy "Users can insert their own member entry"
  on public.member for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update their own member entry" on public.member;
create policy "Users can update their own member entry"
  on public.member for update
  using ( auth.uid() = id )
  with check ( auth.uid() = id );

drop policy if exists "Admins can full access all members" on public.member;
create policy "Admins can full access all members"
  on public.member for all
  using ( is_admin() )
  with check ( is_admin() );

-- 5. Create or Update handle_new_user trigger
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Insert into profiles
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, 
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'member'
  );

  return new;
end;
$$ language plpgsql security definer;

-- Ensure trigger exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 6. Storage Setup
insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

drop policy if exists "Public Access" on storage.objects;
create policy "Public Access" on storage.objects for select using (bucket_id = 'images');

drop policy if exists "Admin Full Access" on storage.objects;
create policy "Admin Full Access" on storage.objects for all using (bucket_id = 'images' and public.is_admin());

drop policy if exists "Users can upload their own photo" on storage.objects;
create policy "Users can upload their own photo" on storage.objects for insert with check (
  bucket_id = 'images' and 
  (storage.foldername(name))[1] = 'members' and 
  (split_part(name, '/', 2) like auth.uid()::text || '-%')
);
`}
                </div>

                <div className="pt-6 border-t border-white/5">
                  <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 mb-4">Data Export</h3>
                  <DashboardButton
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase
                          .from('member')
                          .select('*');
                        
                        if (error) throw error;
                        
                        if (!data || data.length === 0) {
                          showToast('No member data to export', 'info');
                          return;
                        }

                        // Convert to CSV
                        const headers = Object.keys(data[0]).join(',');
                        const rows = data.map((row: any) => 
                          Object.values(row).map(val => `"${val}"`).join(',')
                        ).join('\n');
                        const csv = `${headers}\n${rows}`;
                        
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.setAttribute('hidden', '');
                        a.setAttribute('href', url);
                        a.setAttribute('download', 'members.csv');
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        
                        showToast('Members data exported successfully', 'success');
                      } catch (err) {
                        console.error(err);
                        showToast('Failed to export members data', 'error');
                      }
                    }}
                    icon={Download}
                    className="w-full"
                    label="Download Member Data (CSV)"
                  />
                </div>

                <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">
                    Note: Ensure your admin email is in the AuthContext.tsx list or your profile role is set to &apos;admin&apos;.
                  </p>
                </div>
              </div>
            </div>
          </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="Confirm Deletion"
        message="Are you sure you want to remove this item? This action cannot be undone."
        onConfirm={executeDelete}
        onCancel={() => setConfirmDelete(prev => ({ ...prev, isOpen: false }))}
        confirmLabel="Delete"
        type="danger"
      />
    </DashboardLayout>
  );
};

export default AdminDashboard;
