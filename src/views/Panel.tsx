"use client";
import React from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence, useMotionValue as motionValue, useSpring, useTransform } from 'framer-motion';
import { User, Shield, Star, Briefcase, Award, Upload, Loader2, Sparkles, Search, GraduationCap } from 'lucide-react';
import Image from 'next/image';
import { Reveal } from '../components/animations/Reveal';
import { Skeleton } from '../components/Skeleton';
import MemberMarquee from '../components/shared/MemberMarquee';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl } from '../lib/utils';
import { supabase } from '../lib/supabase';
import GeometricAvatar from '../components/GeometricAvatar';

const PanelSkeleton = () => (
  <div className="min-h-screen bg-transparent pt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
      <div className="text-center">
        <Skeleton className="h-16 w-64 mx-auto mb-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-[3rem]" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Flashcard = React.memo(({ role, name, imageUrl, icon: Icon = User, onUpload, isAdmin, isBig }: any) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { shouldReduceGfx } = usePerformance();

  const x = motionValue(0);
  const y = motionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["10deg", "-10deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-10deg", "10deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceGfx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      
      if (onUpload) {
        await onUpload(data.url);
      }
      showToast('Image updated successfully', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div
      style={!shouldReduceGfx ? { rotateX, rotateY, transformStyle: "preserve-3d" } : {}}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={shouldReduceGfx ? {} : { y: -12, scale: 1.02 }}
      className={`relative rounded-[2.5rem] overflow-hidden glass border-white/[0.05] group flex flex-col transition-all duration-700 hover:border-white/20 shadow-2xl ${isBig ? 'max-w-xl mx-auto' : ''}`}
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-zinc-900/50">
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        
        {imageUrl ? (
          <Image 
            src={resolveImageUrl(imageUrl)} 
            alt={name || 'Member'} 
            fill 
            className="object-cover object-[center_top] transition-transform duration-700 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 400px"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/5">
            <Icon className="w-32 h-32" />
          </div>
        )}

        {isAdmin && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-30 backdrop-blur-sm"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Upload className="w-8 h-8 text-white" />
                <span className="text-[10px] font-bold text-white uppercase tracking-widest">Update Photo</span>
              </div>
            )}
          </div>
        )}
        {isAdmin && (
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUpload} 
            className="hidden" 
            accept=".jpg,.jpeg,.png"
          />
        )}
      </div>

      <div className="p-8 relative bg-black/40 backdrop-blur-xl flex-1 flex flex-col justify-center border-t border-white/5">
        <div className="relative z-10 text-center">
          <p className="font-bold text-white text-2xl tracking-tight leading-tight mb-2 group-hover:text-emerald-400 transition-colors duration-500">
            {name || 'New Member'}
          </p>
          <p className="text-zinc-400 uppercase tracking-widest font-semibold text-[10px]">
             {role || 'Member'}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

Flashcard.displayName = 'Flashcard';

const ExecutiveRow = React.memo(({ role, name, imageUrl, icon: Icon = User, onUpload, isAdmin }: any) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isAdmin) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      if (onUpload) await onUpload(data.url);
      showToast('Image updated successfully', 'success');
    } catch (err) {
      console.error('Upload error:', err);
      showToast('Failed to upload image', 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-6 p-4 rounded-[2rem] bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] transition-colors relative overflow-hidden group">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden flex-shrink-0 bg-zinc-900 border border-white/10">
        {imageUrl ? (
          <Image src={resolveImageUrl(imageUrl)} alt={name || 'Member'} fill className="object-cover object-[center_top]" sizes="80px" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/20">
            <Icon className="w-8 h-8" />
          </div>
        )}
        {isAdmin && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
          >
            {uploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Upload className="w-5 h-5 text-white" />}
          </div>
        )}
      </div>

      <div className="flex-grow pr-4">
        <h4 className="text-base sm:text-lg font-bold text-white tracking-tight">{name || 'New Member'}</h4>
        <p className="text-[10px] sm:text-xs font-mono text-[var(--c-6-start)] tracking-[0.2em] uppercase mt-1 opacity-80">{role || 'Member'}</p>
      </div>

      {isAdmin && (
        <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden" accept=".jpg,.jpeg,.png" />
      )}
    </div>
  );
});
ExecutiveRow.displayName = 'ExecutiveRow';

const SectionHeader = ({ children, subtitle }: any) => {
  return (
    <Reveal direction="up" className="mb-24 text-center">
      <div className="inline-flex items-center gap-3 px-4 py-1.5 mb-8 rounded-full bg-white/5 border border-white/10">
         <Sparkles className="w-3 h-3 text-[var(--c-6-start)]" />
         <span className="text-[10px] font-mono font-black text-zinc-500 tracking-[0.4em] uppercase">{subtitle || "COMMITTEE_SCOPE"}</span>
      </div>
      <h2 className="text-6xl md:text-8xl font-bold text-white font-display tracking-[-0.05em] uppercase mb-4">
        {children}
      </h2>
      <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[var(--c-6-start)] to-transparent mx-auto mt-12 opacity-50" />
    </Reveal>
  );
};

const SubHeader = ({ children }: any) => (
  <h3 className="text-xs font-mono font-black text-[var(--c-6-start)] mb-12 uppercase tracking-[0.6em] text-center">
    {"//"} {children}
  </h3>
);

const PanelView = () => {
  const { content, loading, updateNestedField } = useContent();
  const { isAdmin } = useAuth();
  const [mainTab, setMainTab] = React.useState<'executive' | 'alumni'>('executive');
  const [dbMembers, setDbMembers] = React.useState<any[]>([]);
  const [dbLoading, setDbLoading] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const { shouldReduceGfx } = usePerformance();

  const panel = content.panel;

  const fetchDbMembers = React.useCallback(async () => {
    setDbLoading(true);
    try {
      const { data: alumniData, error: alumniError } = await supabase
        .from('alumni')
        .select('*');
      
      if (alumniError) {
        // Table doesn't exist or is not configured yet, default to empty array
        setDbMembers([]);
      } else {
        setDbMembers(alumniData || []);
      }
    } catch (err) {
      console.error('Error fetching members for Alumni:', err);
      setDbMembers([]);
    } finally {
      setDbLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (mainTab === 'alumni') {
      fetchDbMembers();
    }
  }, [mainTab, fetchDbMembers]);

  const moderators = React.useMemo(() => {
    return panel?.moderators || [{ name: "Dr. S.M. Abu Saim", role: "Chief Moderator", imageUrl: "" }];
  }, [panel?.moderators]);

  const [subTab, setSubTab] = React.useState<'current' | 'former'>('current');

  const formerPanels = React.useMemo(() => {
    const raw = panel?.executive?.former;
    return Array.isArray(raw) ? raw : [];
  }, [panel?.executive?.former]);

  const [selectedFormerYearId, setSelectedFormerYearId] = React.useState<string | null>(null);

  const activeFormerPanel = React.useMemo(() => {
    if (formerPanels.length === 0) return null;
    const found = formerPanels.find((p: any) => p.id === selectedFormerYearId);
    return found || formerPanels[0];
  }, [formerPanels, selectedFormerYearId]);

  const formerPanelIndex = React.useMemo(() => {
    if (!activeFormerPanel) return -1;
    return formerPanels.findIndex((p: any) => p.id === activeFormerPanel.id);
  }, [formerPanels, activeFormerPanel]);

  const shouldRenderMember = React.useCallback((m: any) => {
    return isAdmin || (m && m.name && m.name.trim() !== "" && m.name.trim() !== "N/A");
  }, [isAdmin]);

  const activePanelData = React.useMemo(() => {
    if (subTab === 'current') {
      return panel?.executive?.current || {};
    }
    return activeFormerPanel || {};
  }, [panel, subTab, activeFormerPanel]);

  const getMemberPath = React.useCallback((categoryPath: string, index: number) => {
    if (subTab === 'current') {
      return `panel.executive.current.${categoryPath}.${index}.imageUrl`;
    } else {
      return `panel.executive.former.${formerPanelIndex}.${categoryPath}.${index}.imageUrl`;
    }
  }, [subTab, formerPanelIndex]);

  const filteredPresidents = React.useMemo(() => activePanelData.president?.filter(shouldRenderMember) || [], [activePanelData.president, shouldRenderMember]);
  const filteredDeputyPresidents = React.useMemo(() => activePanelData.deputyPresidents?.filter(shouldRenderMember) || [], [activePanelData.deputyPresidents, shouldRenderMember]);
  const filteredGeneralSecretary = React.useMemo(() => activePanelData.generalSecretary?.filter(shouldRenderMember) || [], [activePanelData.generalSecretary, shouldRenderMember]);
  const filteredVicePresidents = React.useMemo(() => activePanelData.vicePresidents?.filter(shouldRenderMember) || [], [activePanelData.vicePresidents, shouldRenderMember]);
  
  const filteredJointSecretary = React.useMemo(() => activePanelData.secretaries?.jointSecretary?.filter(shouldRenderMember) || [], [activePanelData.secretaries?.jointSecretary, shouldRenderMember]);
  const filteredOrganizingSecretary = React.useMemo(() => activePanelData.secretaries?.organizingSecretary?.filter(shouldRenderMember) || [], [activePanelData.secretaries?.organizingSecretary, shouldRenderMember]);
  const filteredAsstGeneralSecretary = React.useMemo(() => activePanelData.secretaries?.asstGeneralSecretary?.filter(shouldRenderMember) || [], [activePanelData.secretaries?.asstGeneralSecretary, shouldRenderMember]);
  const filteredCorrespondingSecretary = React.useMemo(() => activePanelData.secretaries?.correspondingSecretary?.filter(shouldRenderMember) || [], [activePanelData.secretaries?.correspondingSecretary, shouldRenderMember]);

  const filteredDepartments = React.useMemo(() => activePanelData.departments?.filter(shouldRenderMember) || [], [activePanelData.departments, shouldRenderMember]);

  const isExecutivePanelEmpty = React.useMemo(() => {
    return filteredPresidents.length === 0 &&
           filteredDeputyPresidents.length === 0 &&
           filteredGeneralSecretary.length === 0 &&
           filteredVicePresidents.length === 0 &&
           filteredJointSecretary.length === 0 &&
           filteredOrganizingSecretary.length === 0 &&
           filteredAsstGeneralSecretary.length === 0 &&
           filteredCorrespondingSecretary.length === 0 &&
           filteredDepartments.length === 0;
  }, [
    filteredPresidents, filteredDeputyPresidents, filteredGeneralSecretary,
    filteredVicePresidents, filteredJointSecretary, filteredOrganizingSecretary,
    filteredAsstGeneralSecretary, filteredCorrespondingSecretary, filteredDepartments
  ]);

  const filteredDbMembers = React.useMemo(() => {
    if (!searchQuery.trim()) return dbMembers;
    const query = searchQuery.toLowerCase();
    return dbMembers.filter(m => 
      (m.full_name || '').toLowerCase().includes(query) ||
      (m.member_id || '').toLowerCase().includes(query) ||
      (m.class || '').toLowerCase().includes(query) ||
      (m.email || '').toLowerCase().includes(query)
    );
  }, [dbMembers, searchQuery]);

  const handleMemberUpdate = React.useCallback(async (jsonPath: string, value: any) => {
    try {
      await updateNestedField(jsonPath, value);
    } catch (err) {
      console.error('Update error:', err);
    }
  }, [updateNestedField]);

  if (loading) return <PanelSkeleton />;
  if (!panel) return null;

  return (
    <div className="min-h-screen pt-48 pb-32 px-4 sm:px-8 bg-[#050505] overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[50vw] h-[50vw] bg-[var(--c-6-start)]/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[50vw] h-[50vw] bg-[var(--c-5-start)]/5 blur-[150px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto space-y-32 relative z-10">
        
        {/* --- MODERATORS SECTION --- */}
        <section>
          <SectionHeader subtitle="FACULTY_OVERSIGHT">{panel.moderatorsTitle || "Moderators"}</SectionHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {moderators?.map((m: any, i: number) => (
              <Reveal key={i} direction="up" delay={i * 0.1}>
                <Flashcard 
                  {...m} 
                  icon={Shield} 
                  isAdmin={isAdmin}
                  onUpload={(url: string) => handleMemberUpdate(`panel.moderators.${i}.imageUrl`, url)}
                />
              </Reveal>
            ))}
          </div>
        </section>

        {/* --- EXECUTIVE COMMITTEE SECTION --- */}
        <section className="space-y-24">
          <div>
            <SectionHeader subtitle="Explore the dedicated committee members who drive the Josephite Math Club forward, year after year.">
              Meet the JMC Team
            </SectionHeader>
            
            {/* Premium Tab Controller */}
            <div className="flex flex-col items-center gap-8 mb-24">
              <div className="flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                {[
                  { id: 'executive', label: 'Executive members' },
                  { id: 'alumni', label: 'Alumni' }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMainTab(tab.id as any)}
                    className={`px-8 py-3 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all duration-500 relative cursor-pointer ${
                      mainTab === tab.id ? 'text-black' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{tab.label}</span>
                    {mainTab === tab.id && (
                      <motion.div
                        layoutId="activeTabPanel"
                        className="absolute inset-0 bg-white rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>

              {/* Subtabs for Executive: Current and Former */}
              {mainTab === 'executive' && (
                <div className="space-y-6 flex flex-col items-center w-full">
                  <div className="flex p-1 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-lg">
                    {[
                      { id: 'current', label: 'Current Panel' },
                      { id: 'former', label: 'Former Panels' }
                    ].map((sub) => (
                      <button
                        key={sub.id}
                        onClick={() => setSubTab(sub.id as any)}
                        className={`px-6 py-2 rounded-full text-[9px] font-mono font-bold uppercase tracking-[0.15em] transition-all duration-300 relative cursor-pointer ${
                          subTab === sub.id ? 'text-white font-black' : 'text-zinc-500 hover:text-zinc-300'
                        }`}
                      >
                        <span className="relative z-10">{sub.label}</span>
                        {subTab === sub.id && (
                          <motion.div
                            layoutId="activeExecutiveSubTab"
                            className="absolute inset-0 bg-white/10 rounded-full border border-white/10"
                            transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Former Panels Years Sub-tabs */}
                  {subTab === 'former' && formerPanels.length > 0 && (
                    <div className="flex flex-wrap justify-center gap-2 max-w-4xl px-4 py-2 bg-white/[0.01] border border-white/5 rounded-2xl backdrop-blur-sm">
                      {formerPanels.map((p: any) => {
                        const isActive = (activeFormerPanel && activeFormerPanel.id === p.id) || (!selectedFormerYearId && p.id === formerPanels[0]?.id);
                        return (
                          <button
                            key={p.id}
                            onClick={() => setSelectedFormerYearId(p.id)}
                            className={`px-4 py-1.5 rounded-lg text-[8.5px] font-mono font-semibold uppercase tracking-wider transition-all duration-300 relative cursor-pointer ${
                              isActive ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20 shadow-md shadow-amber-500/5' : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                            }`}
                          >
                            {p.year}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {mainTab === 'executive' ? (
              <motion.div 
                key={`executive-tab-${subTab}-${subTab === 'former' ? (activeFormerPanel?.id || 'none') : 'current'}`}
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-32"
              >
                {isExecutivePanelEmpty ? (
                  <div className="text-center py-24 border border-white/5 rounded-[2.5rem] bg-white/[0.01] backdrop-blur-md max-w-2xl mx-auto">
                    <User className="w-12 h-12 text-zinc-600 mx-auto mb-4 animate-pulse" />
                    <h3 className="text-lg font-sans font-medium text-zinc-300">No Members Found</h3>
                    <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto font-sans">
                      Executive committee details are currently being compiled or have not been populated for this panel year.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Core Leadership Row */}
                    {(filteredPresidents.length > 0 || filteredDeputyPresidents.length > 0 || filteredGeneralSecretary.length > 0) && (
                      <div className="space-y-12">
                        <SubHeader>CORE LEADERSHIP</SubHeader>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                          {filteredPresidents.map((p: any, i: number) => (
                            <Flashcard 
                              key={`pres-${i}`} 
                              {...p} 
                              icon={Star} 
                              isAdmin={isAdmin}
                              onUpload={(url: string) => handleMemberUpdate(getMemberPath('president', i), url)}
                            />
                          ))}
                          {filteredDeputyPresidents.map((p: any, i: number) => (
                            <Flashcard 
                              key={`dp-${i}`} 
                              {...p} 
                              icon={Award} 
                              isAdmin={isAdmin}
                              onUpload={(url: string) => handleMemberUpdate(getMemberPath('deputyPresidents', i), url)}
                            />
                          ))}
                          {filteredGeneralSecretary.map((p: any, i: number) => (
                            <Flashcard 
                              key={`gs-${i}`} 
                              {...p} 
                              icon={Briefcase} 
                              isAdmin={isAdmin}
                              onUpload={(url: string) => handleMemberUpdate(getMemberPath('generalSecretary', i), url)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* VP Grid */}
                    {filteredVicePresidents.length > 0 && (
                      <div className="space-y-12">
                        <SubHeader>VICE PRESIDENT</SubHeader>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                          {filteredVicePresidents.map((p: any, i: number) => (
                            <ExecutiveRow 
                              key={i}
                              {...p} 
                              isAdmin={isAdmin}
                              onUpload={(url: string) => handleMemberUpdate(getMemberPath('vicePresidents', i), url)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Secretaries Grid */}
                    {(filteredJointSecretary.length > 0 || 
                      filteredOrganizingSecretary.length > 0 || 
                      filteredAsstGeneralSecretary.length > 0 || 
                      filteredCorrespondingSecretary.length > 0) && (
                       <div className="space-y-16">
                         {filteredJointSecretary.length > 0 && (
                           <div className="space-y-8">
                             <SubHeader>JOINT SECRETARY</SubHeader>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                               {filteredJointSecretary.map((p: any, i: number) => (
                                 <ExecutiveRow 
                                   key={`js-${i}`}
                                   {...p} 
                                   role="Joint Secretary"
                                   isAdmin={isAdmin}
                                   onUpload={(url: string) => handleMemberUpdate(getMemberPath('secretaries.jointSecretary', i), url)}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                         {filteredOrganizingSecretary.length > 0 && (
                           <div className="space-y-8">
                             <SubHeader>ORGANIZING SECRETARY</SubHeader>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                               {filteredOrganizingSecretary.map((p: any, i: number) => (
                                 <ExecutiveRow 
                                   key={`os-${i}`}
                                   {...p} 
                                   role="Organizing Secretary"
                                   isAdmin={isAdmin}
                                   onUpload={(url: string) => handleMemberUpdate(getMemberPath('secretaries.organizingSecretary', i), url)}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                         {filteredAsstGeneralSecretary.length > 0 && (
                           <div className="space-y-8">
                             <SubHeader>ASSISTANT GENERAL SECRETARY</SubHeader>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                               {filteredAsstGeneralSecretary.map((p: any, i: number) => (
                                 <ExecutiveRow 
                                   key={`ags-${i}`}
                                   {...p} 
                                   role="Assistant General Secretary"
                                   isAdmin={isAdmin}
                                   onUpload={(url: string) => handleMemberUpdate(getMemberPath('secretaries.asstGeneralSecretary', i), url)}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                         {filteredCorrespondingSecretary.length > 0 && (
                           <div className="space-y-8">
                             <SubHeader>CORRESPONDING SECRETARY</SubHeader>
                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                               {filteredCorrespondingSecretary.map((p: any, i: number) => (
                                 <ExecutiveRow 
                                   key={`cs-${i}`}
                                   {...p} 
                                   role="Corresponding Secretary"
                                   isAdmin={isAdmin}
                                   onUpload={(url: string) => handleMemberUpdate(getMemberPath('secretaries.correspondingSecretary', i), url)}
                                 />
                               ))}
                             </div>
                           </div>
                         )}
                       </div>
                    )}

                    {/* Departments Grid */}
                    {filteredDepartments.length > 0 && (
                       <div className="space-y-8">
                         <SubHeader>HEAD OF DEPARTMENTS</SubHeader>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                           {filteredDepartments.map((p: any, i: number) => (
                             <ExecutiveRow 
                               key={i}
                               {...p} 
                               role={p.dept ? `Head of ${p.dept}` : p.role}
                               isAdmin={isAdmin}
                               onUpload={(url: string) => handleMemberUpdate(getMemberPath('departments', i), url)}
                             />
                           ))}
                         </div>
                       </div>
                    )}
                  </>
                )}
              </motion.div>
            ) : (
              <motion.div 
                key="alumni-tab"
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -30 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-16"
              >
                {/* Loading State */}
                {dbLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                    <p className="text-zinc-500 text-xs font-mono">LOADING ALUMNI BASE...</p>
                  </div>
                ) : filteredDbMembers.length === 0 ? (
                  <div className="text-center py-20 border border-white/5 rounded-3xl bg-white/[0.01] backdrop-blur-md">
                    <GraduationCap className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                    <h3 className="text-lg font-sans font-medium text-zinc-300">No Alumni Found</h3>
                    <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
                      {searchQuery ? "Try checking your spelling or search for a different name or member ID." : "The alumni directory is currently empty. The super admin will populate the database later on."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDbMembers.map((m: any, i: number) => {
                      const imageSrc = m.photo_url ? resolveImageUrl(m.photo_url) : '';
                      const isEcMember = Boolean(m.is_ec);
                      const displayRole = m.is_ec 
                        ? (m.department ? `EC - Head of ${m.department}` : 'Executive Committee')
                        : 'General Member';
                      
                      return (
                        <motion.div
                          key={m.id || i}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.4, delay: i * 0.03 }}
                          className={`relative group rounded-3xl p-6 bg-[#0B0B0B] border transition-all duration-500 ${
                            isEcMember 
                              ? 'border-amber-500/10 hover:border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.02)] hover:shadow-[0_0_50px_rgba(245,158,11,0.05)]' 
                              : 'border-white/5 hover:border-white/15'
                          }`}
                        >
                          {/* Inner card content */}
                          <div className="flex flex-col items-center text-center space-y-4 relative z-10">
                            {/* Avatar/Photo */}
                            <div className="relative w-24 h-24 rounded-full overflow-hidden border border-white/10 group-hover:border-white/25 transition-all duration-500">
                              {imageSrc ? (
                                <Image
                                  src={imageSrc}
                                  alt={m.full_name}
                                  fill
                                  sizes="96px"
                                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <GeometricAvatar name={m.full_name || 'Member'} size="100%" />
                              )}
                            </div>

                            {/* Info */}
                            <div className="space-y-2 w-full">
                              <h4 className="font-sans font-medium text-base text-zinc-100 group-hover:text-white transition-colors duration-300 truncate px-2">
                                {m.full_name}
                              </h4>
                              <div className="flex flex-col items-center space-y-1">
                                <span className={`text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                  isEcMember 
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                    : 'bg-white/5 text-zinc-400 border border-white/5'
                                }`}>
                                  {m.member_id || 'JMC MEMBER'}
                                </span>
                                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                                  {displayRole}
                                </span>
                              </div>
                            </div>

                            {/* Academic Details Footer */}
                            <div className="w-full pt-4 border-t border-white/5 text-[10px] font-mono text-zinc-500 flex justify-center gap-3">
                              <span>CLASS {m.class}</span>
                              <span className="text-white/10">•</span>
                              <span>SEC {m.section}</span>
                              <span className="text-white/10">•</span>
                              <span>ROLL {m.roll}</span>
                            </div>
                          </div>
                          
                          {/* Hover Overlay background glow */}
                          <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none bg-gradient-to-b ${
                            isEcMember 
                              ? 'from-amber-500/[0.01] to-transparent' 
                              : 'from-white/[0.01] to-transparent'
                          }`} />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Member Marquee */}
        <div className="py-24 border-t border-white/5">
          <Reveal direction="up">
             <MemberMarquee />
          </Reveal>
        </div>
      </div>
    </div>
  );
};

export default PanelView;

