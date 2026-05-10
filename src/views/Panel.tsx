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
      <div className="aspect-[4/5] relative overflow-hidden bg-zinc-900/50" style={{ transform: "translateZ(50px)" }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
        
        {imageUrl ? (
          <Image 
            src={resolveImageUrl(imageUrl)} 
            alt={name || 'Member'} 
            fill 
            className="object-cover object-center transition-transform duration-1000 group-hover:scale-110"
            sizes={isBig ? "600px" : "400px"}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-white/5">
            <Icon className={isBig ? "w-48 h-48" : "w-32 h-32"} />
          </div>
        )}
        
        {/* Profile Tag */}
        <div className="absolute top-6 left-6 z-20">
          <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[var(--c-6-start)] animate-pulse shadow-[0_0_8px_rgba(0,180,219,0.8)]" />
            <span className="text-[8px] font-mono font-bold text-white tracking-[0.2em]">0{Math.floor(Math.random() * 9)} {"//"} AUTH_OK</span>
          </div>
        </div>

        {isAdmin && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-30 backdrop-blur-sm"
          >
            {uploading ? (
              <Loader2 className="w-8 h-8 text-[var(--c-6-start)] animate-spin" />
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

      <div className="p-8 relative bg-black/40 backdrop-blur-3xl flex-1 flex flex-col justify-center border-t border-white/5">
        <div className="absolute -top-10 right-8 z-20">
          <div className="w-16 h-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center hud-bracket hud-bracket-tl hud-bracket-br">
            <Icon className={`w-8 h-8 ${isBig ? 'text-[var(--c-6-start)]' : 'text-white/60'}`} />
          </div>
        </div>
        
        <div className="relative z-10">
          <p className={`font-bold text-white font-display tracking-tight leading-tight mb-2 group-hover:text-[var(--c-6-start)] transition-colors duration-500 ${isBig ? 'text-4xl' : 'text-2xl'}`}>
            {name || 'New Member'}
          </p>
          <div className="flex items-center gap-3 overflow-hidden">
             <div className="h-[1px] w-4 bg-[var(--c-5-start)]" />
             <p className={`text-[var(--c-5-start)] uppercase tracking-[0.3em] font-black font-mono ${isBig ? 'text-[10px]' : 'text-[8px]'}`}>
              {role || 'Member'}
            </p>
          </div>
        </div>
      </div>

      {/* Decorative HUD lines */}
      <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
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
            <SectionHeader subtitle="LEADERSHIP_HIERARCHY">{panel.executiveTitle || "Executive Committee"}</SectionHeader>
            
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
              {/* President Row */}
              <div className="space-y-12">
                <SubHeader>PRESIDENCY</SubHeader>
                <div className="max-w-xl mx-auto">
                  {activePanelData.president?.map((p: any, i: number) => (
                    <Flashcard 
                      key={i} 
                      {...p} 
                      icon={Star} 
                      isBig 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.president.${i}.imageUrl`, url)}
                    />
                  ))}
                </div>
              </div>

              {/* DP Row */}
              <div className="space-y-12">
                <SubHeader>DEPUTY_PRESIDENTS</SubHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                  {activePanelData.deputyPresidents?.map((p: any, i: number) => (
                    <Flashcard 
                      key={i} 
                      {...p} 
                      icon={Award} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.deputyPresidents.${i}.imageUrl`, url)}
                    />
                  ))}
                </div>
              </div>

              {/* GS Row */}
              <div className="space-y-12">
                <SubHeader>CENTRAL_OPERATIONS</SubHeader>
                <div className="max-w-xl mx-auto">
                  {activePanelData.generalSecretary?.map((p: any, i: number) => (
                    <Flashcard 
                      key={i} 
                      {...p} 
                      icon={Briefcase} 
                      isBig 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.generalSecretary.${i}.imageUrl`, url)}
                    />
                  ))}
                </div>
              </div>

              {/* VP Grid */}
              <div className="space-y-12">
                <SubHeader>EXECUTIVE_COLLECTIVE</SubHeader>
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

