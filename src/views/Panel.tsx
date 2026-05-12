"use client";
import React from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence, useMotionValue as motionValue, useSpring, useTransform } from 'framer-motion';
import { User, Shield, Star, Briefcase, Award, Upload, Loader2, Sparkles } from 'lucide-react';
import Image from 'next/image';
import { Reveal } from '../components/animations/Reveal';
import { Skeleton } from '../components/Skeleton';
import MemberMarquee from '../components/shared/MemberMarquee';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl } from '../lib/utils';

const PanelSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-32">
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
  const [activeTab, setActiveTab] = React.useState('current');
  const { shouldReduceGfx } = usePerformance();

  const panel = content.panel;

  const moderators = React.useMemo(() => {
    return panel?.moderators || [{ name: "Dr. S.M. Abu Saim", role: "Chief Moderator", imageUrl: "" }];
  }, [panel?.moderators]);

  const activePanelData = React.useMemo(() => {
    return panel?.executive?.[activeTab] || {};
  }, [panel, activeTab]);

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
            <div className="flex justify-center mb-24">
              <div className="flex p-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-xl">
                {['current', 'recent', 'former'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-8 py-3 rounded-full text-[10px] font-mono font-black uppercase tracking-[0.2em] transition-all duration-500 relative ${
                      activeTab === tab ? 'text-black' : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    <span className="relative z-10">{tab}</span>
                    {activeTab === tab && (
                      <motion.div
                        layoutId="activeTabPanel"
                        className="absolute inset-0 bg-white rounded-full"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -30 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-32"
            >
              {/* Core Leadership Row */}
              <div className="space-y-12">
                <SubHeader>CORE LEADERSHIP</SubHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                  {activePanelData.president?.map((p: any, i: number) => (
                    <Flashcard 
                      key={`pres-${i}`} 
                      {...p} 
                      icon={Star} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.president.${i}.imageUrl`, url)}
                    />
                  ))}
                  {activePanelData.deputyPresidents?.map((p: any, i: number) => (
                    <Flashcard 
                      key={`dp-${i}`} 
                      {...p} 
                      icon={Award} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.deputyPresidents.${i}.imageUrl`, url)}
                    />
                  ))}
                  {activePanelData.generalSecretary?.map((p: any, i: number) => (
                    <Flashcard 
                      key={`gs-${i}`} 
                      {...p} 
                      icon={Briefcase} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.generalSecretary.${i}.imageUrl`, url)}
                    />
                  ))}
                </div>
              </div>

              {/* VP Grid */}
              <div className="space-y-12">
                <SubHeader>VICE PRESIDENT</SubHeader>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
                  {activePanelData.vicePresidents?.map((p: any, i: number) => (
                    <Flashcard 
                      key={i}
                      {...p} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.vicePresidents.${i}.imageUrl`, url)}
                    />
                  ))}
                </div>
              </div>

              {/* Secretaries Grid */}
              {activePanelData.secretaries && (
                 <div className="space-y-16">
                   {activePanelData.secretaries.jointSecretary && activePanelData.secretaries.jointSecretary.length > 0 && (
                     <div className="space-y-12">
                       <SubHeader>JOINT SECRETARY</SubHeader>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {activePanelData.secretaries.jointSecretary.map((p: any, i: number) => (
                           <Flashcard 
                             key={`js-${i}`}
                             {...p} 
                             role="Joint Secretary"
                             isAdmin={isAdmin}
                             onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.secretaries.jointSecretary.${i}.imageUrl`, url)}
                           />
                         ))}
                       </div>
                     </div>
                   )}
                   {activePanelData.secretaries.organizingSecretary && activePanelData.secretaries.organizingSecretary.length > 0 && (
                     <div className="space-y-12">
                       <SubHeader>ORGANIZING SECRETARY</SubHeader>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {activePanelData.secretaries.organizingSecretary.map((p: any, i: number) => (
                           <Flashcard 
                             key={`os-${i}`}
                             {...p} 
                             role="Organizing Secretary"
                             isAdmin={isAdmin}
                             onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.secretaries.organizingSecretary.${i}.imageUrl`, url)}
                           />
                         ))}
                       </div>
                     </div>
                   )}
                   {activePanelData.secretaries.asstGeneralSecretary && activePanelData.secretaries.asstGeneralSecretary.length > 0 && (
                     <div className="space-y-12">
                       <SubHeader>ASSISTANT GENERAL SECRETARY</SubHeader>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {activePanelData.secretaries.asstGeneralSecretary.map((p: any, i: number) => (
                           <Flashcard 
                             key={`ags-${i}`}
                             {...p} 
                             role="Assistant General Secretary"
                             isAdmin={isAdmin}
                             onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.secretaries.asstGeneralSecretary.${i}.imageUrl`, url)}
                           />
                         ))}
                       </div>
                     </div>
                   )}
                   {activePanelData.secretaries.correspondingSecretary && activePanelData.secretaries.correspondingSecretary.length > 0 && (
                     <div className="space-y-12">
                       <SubHeader>CORRESPONDING SECRETARY</SubHeader>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                         {activePanelData.secretaries.correspondingSecretary.map((p: any, i: number) => (
                           <Flashcard 
                             key={`cs-${i}`}
                             {...p} 
                             role="Corresponding Secretary"
                             isAdmin={isAdmin}
                             onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.secretaries.correspondingSecretary.${i}.imageUrl`, url)}
                           />
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
              )}

              {/* Departments Grid */}
              {activePanelData.departments && activePanelData.departments.length > 0 && (
                 <div className="space-y-12">
                   <SubHeader>HEAD OF DEPARTMENTS</SubHeader>
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-8">
                     {activePanelData.departments.map((p: any, i: number) => (
                       <Flashcard 
                         key={i}
                         {...p} 
                         role={p.dept ? `Head of ${p.dept}` : p.role}
                         isAdmin={isAdmin}
                         onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.departments.${i}.imageUrl`, url)}
                       />
                     ))}
                   </div>
                 </div>
              )}
            </motion.div>
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

