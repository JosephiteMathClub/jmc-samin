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
  Plus, 
  Trash2, 
  FileText,
  ShieldAlert,
  Award,
  Trophy,
  BookOpen,
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
import { EventParticipation } from '../components/dashboard/EventParticipation';
import { UserManagement } from '../components/dashboard/UserManagement';

import dynamic from 'next/dynamic';

const DashboardHomeSection = dynamic(() => import('../components/dashboard/sections/DashboardHomeSection').then(mod => mod.DashboardHomeSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardAboutSection = dynamic(() => import('../components/dashboard/sections/DashboardAboutSection').then(mod => mod.DashboardAboutSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardEventsSection = dynamic(() => import('../components/dashboard/sections/DashboardEventsSection').then(mod => mod.DashboardEventsSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardNoticesSection = dynamic(() => import('../components/dashboard/sections/DashboardNoticesSection').then(mod => mod.DashboardNoticesSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardPanelSection = dynamic(() => import('../components/dashboard/sections/DashboardPanelSection').then(mod => mod.DashboardPanelSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardGallerySection = dynamic(() => import('../components/dashboard/sections/DashboardGallerySection').then(mod => mod.DashboardGallerySection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardArticlesSection = dynamic(() => import('../components/dashboard/sections/DashboardArticlesSection'), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardSiteSection = dynamic(() => import('../components/dashboard/sections/DashboardSiteSection').then(mod => mod.DashboardSiteSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });
const DashboardMemberManagementSection = dynamic(() => import('../components/dashboard/sections/DashboardMemberManagementSection').then(mod => mod.DashboardMemberManagementSection), { loading: () => <Skeleton className="h-64 w-full rounded-3xl" /> });

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
  const [localContent, setLocalContent] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploading, setUploading] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ section: string, field: string, index: number, isOpen: boolean, path?: string[] }>({ 
    section: '', field: '', index: -1, isOpen: false 
  });

  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);
  const [isDeletingMember, setIsDeletingMember] = useState(false);

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
      let updates: any = { 
        verified: newStatus
      };
      
      if (newStatus === 'yes' && !member?.member_id) {
        // Generate unique ID: JMC + 6 random digits
        const prefix = "JMC";
        const digits = Math.floor(100000 + Math.random() * 900000).toString();
        const generatedId = `${prefix}-${digits}`;
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
    } catch (err: any) {
      console.error('Error updating member:', err);
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      showToast(`Failed to update member: ${errorMessage}`, 'error');
    }
  };

  const deleteMember = async (member: any) => {
    if (!isSupabaseConfigured || !member) return;
    setIsDeletingMember(true);
    try {
      // Handle foreign key constraint: delete participation records first
      if (member.member_id) {
        const { error: partError } = await supabase
          .from('event_participation')
          .delete()
          .eq('member_id', member.member_id);
        
        if (partError) {
          console.warn("Could not delete participation records, member deletion might fail:", partError);
        }
      }

      const { error } = await supabase
        .from('member')
        .delete()
        .eq('id', member.id);
      
      if (error) throw error;
      
      setMembers(prev => prev.filter(m => m.id !== member.id));
      showToast(`Member ${member.full_name} removed from database`, "success");
    } catch (err: any) {
      console.error("Error deleting member:", err);
      showToast(`Failed to delete member: ${err.message}`, "error");
    } finally {
      setIsDeletingMember(false);
    }
  };

  const addMember = async (memberData: { 
    full_name: string, 
    class: string, 
    section: string, 
    roll: string, 
    email: string, 
    phone?: string, 
    hasAccount: boolean 
  }) => {
    if (!isSupabaseConfigured) return;
    try {
      let userId: string | null = null;

      // If user doesn't have an account, create one automatically
      if (!memberData.hasAccount && memberData.email && memberData.phone) {
        showToast("Creating user account...", "info");
        const createRes = await fetch('/api/admin/create-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: memberData.email,
            phone: memberData.phone,
            password: memberData.phone, // Password is the phone number
            fullName: memberData.full_name
          }),
        });

        const createData = await createRes.json();
        if (!createRes.ok) {
          throw new Error(createData.error || 'Failed to create user account');
        }
        userId = createData.userId || createData.user?.id;
        showToast("User account created!", "success");
      } else if (memberData.hasAccount && memberData.email) {
        // If user has an account, find their ID by email
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', memberData.email.toLowerCase().trim())
          .single();
        
        if (userError || !userData) {
          throw new Error("Could not find an existing account with that email. Please ensure the user has signed up first.");
        }
        userId = userData.id;
      }

      // Use crypto.randomUUID() if available, fallback to a manual UUID if not
      const tempId = userId || (typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : '00000000-0000-4000-8000-' + Math.random().toString(16).slice(2, 14).padStart(12, '0'));

      // Check if member already exists to preserve their member_id
      const { data: existingMember } = await supabase
        .from('member')
        .select('member_id')
        .eq('id', tempId)
        .maybeSingle();

      const memberIdToUse = existingMember?.member_id || (() => {
        const prefix = "JMC";
        const digits = Math.floor(100000 + Math.random() * 900000).toString();
        return `${prefix}-${digits}`;
      })();
      
      const { data, error } = await supabase
        .from('member')
        .upsert({
          id: tempId,
          full_name: memberData.full_name,
          class: memberData.class,
          section: memberData.section,
          roll: memberData.roll,
          email: memberData.email,
          email_address: memberData.email,
          phone: memberData.phone,
          member_id: memberIdToUse,
          verified: 'yes',
          payment_method: 'Manual (Admin)',
          school: 'St Joseph',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' })
        .select()
        .single();
      
      if (error) {
        // Specifically catch foreign key constraint errors
        if (error.code === '23503') {
          throw new Error("Database integrity error: Manual registration requires an existing Auth user's ID. If account creation failed, this record cannot be saved.");
        }
        throw error;
      }
      
      setMembers(prev => [data, ...prev]);
      showToast("Member registered and verified successfully!", "success");
      return data;
    } catch (err: any) {
      console.error('Error adding member:', err);
      const msg = err.message || "Failed to add member";
      showToast(msg, 'error');
      throw err;
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
  }, [activeTab, fetchMembers]);

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
    const { section, field, index, path } = confirmDelete;
    
    if (path) {
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
    } else {
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
    }
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
    setConfirmDelete({ path, index, section: '', field: '', isOpen: true });
  };

  const tabs = [
    { id: 'home', label: 'Home', icon: LayoutDashboard },
    { id: 'participation', label: 'Participation', icon: Trophy },
    { id: 'about', label: 'About', icon: FileText },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'notices', label: 'Notices', icon: Bell },
    { id: 'panel', label: 'Panel', icon: Users },
    { id: 'gallery', label: 'Gallery', icon: LayoutDashboard },
    { id: 'articles', label: 'Articles', icon: BookOpen },
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
          <DashboardHomeSection 
            data={localContent?.home}
            updateField={(field, val) => updateField('home', field, val)}
            updateListItem={(field, index, val) => updateListItem('home', field, index, val)}
            addListItem={(field, newItem) => addListItem('home', field, newItem)}
            removeListItem={(field, index) => removeListItem('home', field, index)}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'participation' && (
          <motion.div
            key="participation"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <EventParticipation />
          </motion.div>
        )}

        {activeTab === 'about' && (
          <DashboardAboutSection 
            data={localContent?.about}
            updateField={(field, val) => updateField('about', field, val)}
            updateListItem={(field, index, val) => updateListItem('about', field, index, val)}
            addListItem={(field, newItem) => addListItem('about', field, newItem)}
            removeListItem={(field, index) => removeListItem('about', field, index)}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'events' && (
          <DashboardEventsSection 
            data={localContent?.events}
            updateField={(field, val) => updateField('events', field, val)}
            updateListItem={(field, index, val) => updateListItem('events', field, index, val)}
            addListItem={(field, newItem) => addListItem('events', field, newItem)}
            removeListItem={(field, index) => removeListItem('events', field, index)}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'notices' && (
          <DashboardNoticesSection 
            data={localContent?.notices}
            updateField={(field, val) => updateField('notices', field, val)}
            updateListItem={(field, index, val) => updateListItem('notices', field, index, val)}
            addListItem={(field, newItem) => addListItem('notices', field, newItem)}
            removeListItem={(field, index) => removeListItem('notices', field, index)}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'panel' && (
          <DashboardPanelSection 
            data={localContent?.panel}
            updateField={(field, val) => updateField('panel', field, val)}
            updateListItem={(field, index, val) => updateListItem('panel', field, index, val)}
            addListItem={(field, newItem) => addListItem('panel', field, newItem)}
            removeListItem={(field, index) => removeListItem('panel', field, index)}
            updateDeepListItem={updateDeepListItem}
            addDeepListItem={addDeepListItem}
            removeDeepListItem={removeDeepListItem}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'gallery' && (
          <DashboardGallerySection 
            data={localContent?.gallery_page}
            updateField={(field, val) => updateField('gallery_page', field, val)}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            shouldReduceGfx={shouldReduceGfx}
          />
        )}

        {activeTab === 'articles' && (
          <DashboardArticlesSection />
        )}

        {activeTab === 'members' && (
          <DashboardMemberManagementSection 
            members={members}
            loadingMembers={loadingMembers}
            memberError={memberError}
            fetchMembers={fetchMembers}
            toggleVerified={toggleVerified}
            deleteMember={deleteMember}
            addMember={addMember}
            handleMemberPhotoUpload={handleMemberPhotoUpload}
            uploading={uploading}
            shouldReduceGfx={shouldReduceGfx}
            isDeletingMember={isDeletingMember}
          />
        )}

        {activeTab === 'access' && (
          <motion.div
            key="access"
            initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
            animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <UserManagement />
          </motion.div>
        )}

        {activeTab === 'site' && (
          <DashboardSiteSection 
            data={localContent?.site}
            contactData={localContent?.contact}
            registrationData={localContent?.registration}
            updateField={(field, val) => updateField('site', field, val)}
            updateContactField={(field, val) => updateField('contact', field, val)}
            updateContactNestedField={(sub, field, val) => updateNestedField('contact', sub, field, val)}
            updateRegistrationField={(field, val) => updateField('registration', field, val)}
            uploading={uploading}
            handleFileUpload={handleFileUpload}
            shouldReduceGfx={shouldReduceGfx}
            seedDatabase={seedDatabase}
            supabase={supabase}
          />
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
