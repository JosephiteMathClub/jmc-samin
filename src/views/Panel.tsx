"use client";
import React from 'react';
import { useContent } from '../context/ContentContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, Star, Briefcase, Users, Award, Upload, Loader2 } from 'lucide-react';
import Image from 'next/image';
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components/Skeleton';

import { usePerformance } from '../hooks/usePerformance';
import { resolveImageUrl } from '../lib/utils';

const PanelSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-32">
      <div className="text-center">
        <Skeleton className="h-16 w-64 mx-auto mb-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="aspect-[4/5] rounded-3xl" />
          ))}
        </div>
      </div>
      <div className="text-center">
        <Skeleton className="h-16 w-96 mx-auto mb-16" />
        <div className="flex justify-center gap-4 mb-16">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-12 w-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[600px] w-full rounded-3xl" />
      </div>
    </div>
  </div>
);

// --- COMPONENTS ---

const Flashcard = ({ role, name, imageUrl, icon: Icon = User, onUpload, isAdmin }: any) => {
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const { shouldReduceGfx } = usePerformance();

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
      whileHover={shouldReduceGfx ? {} : { y: -10, scale: 1.02 }}
      className={`glass-card overflow-hidden ${!shouldReduceGfx && 'transition-all duration-500'} group relative flex flex-col border-white/5 bg-[#0a0a0c]/80`}
    >
      <div className="aspect-[4/5] relative overflow-hidden bg-zinc-900/50">
        {imageUrl ? (
          <Image 
            src={resolveImageUrl(imageUrl)} 
            alt={name || 'Member'} 
            fill 
            className={`object-cover ${!shouldReduceGfx && 'transition-transform duration-700 group-hover:scale-110'}`}
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-amber-500/10">
            <Icon className="w-24 h-24" />
          </div>
        )}
        
        {/* Upload Overlay - Only for Admins */}
        {isAdmin && (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-20 backdrop-blur-sm"
          >
            {uploading ? (
              <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-6 h-6 text-white" />
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
      <div className="p-6 bg-gradient-to-b from-transparent to-black/40 backdrop-blur-md border-t border-white/5 text-center">
        <p className="font-bold text-white font-display tracking-tight text-lg leading-tight mb-1 group-hover:text-[var(--c-6-start)] transition-colors">
          {name || 'New Member'}
        </p>
        <p className="text-[var(--c-5-start)] text-[10px] uppercase tracking-[0.2em] font-bold">
          {role || 'Member'}
        </p>
      </div>
    </motion.div>
  );
};

const SectionHeading = ({ children, subtitle }: any) => {
  const { shouldReduceGfx } = usePerformance();
  return (
    <ScrollReveal direction="up" distance={shouldReduceGfx ? 10 : 30} className="mb-16 text-center">
      <motion.h2 
        className="text-4xl md:text-7xl font-bold text-white font-display tracking-tighter mb-4 uppercase"
      >
        {children}
      </motion.h2>
      {subtitle && <p className="text-zinc-500 font-light text-lg tracking-widest uppercase">{subtitle}</p>}
      {!shouldReduceGfx && (
        <motion.div 
          initial={{ width: 0 }}
          whileInView={{ width: 100 }}
          viewport={{ once: true }}
          className="h-1 bg-gradient-to-r from-transparent via-[var(--c-6-start)] to-transparent mx-auto mt-8 rounded-full shadow-[0_0_20px_rgba(0,180,219,0.5)]"
        ></motion.div>
      )}
    </ScrollReveal>
  );
};

const SubHeading = ({ children }: any) => (
  <h3 className="text-xl font-bold text-[var(--c-6-start)] font-display mb-8 uppercase tracking-widest text-center">
    {children}
  </h3>
);

const Panel = () => {
  const { content, loading, updateNestedField } = useContent();
  const { isAdmin } = useAuth();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = React.useState('current');
  const { shouldReduceGfx } = usePerformance();

  if (loading) return <PanelSkeleton />;

  const panel = content.panel;
  if (!panel) return null;

  const activePanelData = panel.executive?.[activeTab] || {};

  const handleMemberUpdate = async (jsonPath: string, value: any) => {
    try {
      await updateNestedField(jsonPath, value);
      // No need to reload, context update will trigger re-render
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  return (
    <div className="min-h-screen py-32 px-4 sm:px-6 lg:px-8 bg-[#050505]">
      <div className="max-w-7xl mx-auto space-y-32">
        
        {/* --- MODERATORS SECTION --- */}
        <section>
          <SectionHeading>{panel.moderatorsTitle || "Moderators"}</SectionHeading>
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={{
              hidden: { opacity: 0 },
              visible: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.1
                }
              }
            }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {panel.moderators?.map((m: any, i: number) => (
              <motion.div
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 30, scale: 0.95 },
                  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
                }}
              >
                <Flashcard 
                  {...m} 
                  isBig 
                  icon={Shield} 
                  isAdmin={isAdmin}
                  onUpload={(url: string) => handleMemberUpdate(`panel.moderators.${i}.imageUrl`, url)}
                />
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* --- EXECUTIVE COMMITTEE SECTION --- */}
        <section className="space-y-20">
          <SectionHeading subtitle={panel.executiveSubtitle || "The Core Leadership"}>{panel.executiveTitle || "Executive Committee"}</SectionHeading>
          
          {/* Tabs */}
          <ScrollReveal direction="up" distance={shouldReduceGfx ? 10 : 20} className="flex justify-center gap-4 mb-16">
            {['current', 'recent', 'former'].map((tab) => (
              <motion.button
                key={tab}
                whileHover={shouldReduceGfx ? {} : { scale: 1.05, y: -2 }}
                whileTap={shouldReduceGfx ? {} : { scale: 0.95 }}
                onClick={() => setActiveTab(tab)}
                className={`px-8 py-3 rounded-xl font-bold uppercase tracking-widest transition-all duration-300 relative overflow-hidden group/tab ${
                  activeTab === tab
                    ? 'text-white bg-gradient-to-b from-[#00B4DB] to-[#162E65] shadow-lg shadow-[#00B4DB]/20 border border-white/10'
                    : 'bg-white/5 text-zinc-500 hover:bg-white/10 hover:text-white border border-white/5'
                }`}
              >
                <span className="relative z-10">{tab}</span>
                {activeTab === tab && !shouldReduceGfx && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-[var(--c-6-start)] to-[var(--c-6-end)] -z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            ))}
          </ScrollReveal>

          <AnimatePresence mode="wait">
            <motion.div 
              key={activeTab}
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, x: 20, filter: 'blur(10px)' }}
              animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, x: -20, filter: 'blur(10px)' }}
              transition={{ duration: shouldReduceGfx ? 0.1 : 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-16"
            >
            <div>
              <SubHeading>President</SubHeading>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
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
            </div>

            <div>
              <SubHeading>Deputy Presidents</SubHeading>
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

            <div>
              <SubHeading>General Secretary</SubHeading>
              <div className="flex justify-center">
                <div className="w-full max-w-md">
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
            </div>

            <div>
              <SubHeading>Vice Presidents</SubHeading>
              <motion.div 
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.05
                    }
                  }
                }}
                className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8"
              >
                {activePanelData.vicePresidents?.map((p: any, i: number) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, scale: 0.9 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                  >
                    <Flashcard 
                      {...p} 
                      isAdmin={isAdmin}
                      onUpload={(url: string) => handleMemberUpdate(`panel.executive.${activeTab}.vicePresidents.${i}.imageUrl`, url)}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>
      </section>

        {/* --- DEPARTMENT LEADERSHIP SECTION --- */}
        <section className="space-y-12">
          <SectionHeading>{panel.departmentsTitle || "Department Leadership"}</SectionHeading>
          
          <ScrollReveal direction="up" distance={40} className="glass-card p-1 border-[var(--c-6-start)]/20 overflow-hidden">
            <div className="bg-[var(--c-6-start)]/10 p-6 flex items-center gap-4 border-b border-[var(--c-6-start)]/20">
              {shouldReduceGfx ? (
                <Users className="w-6 h-6 text-[var(--c-6-start)]" />
              ) : (
                <motion.div
                  animate={{ 
                    scale: [1, 1.15, 1],
                    opacity: [0.7, 1, 0.7]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                >
                  <Users className="w-6 h-6 text-[var(--c-6-start)]" />
                </motion.div>
              )}
              <h3 className="text-xl font-bold text-white font-display uppercase tracking-widest">{panel.departmentsSubtitle || "Department Heads"}</h3>
            </div>
            
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-black/40">
              {activePanelData.departments?.map((d: any, i: number) => (
                <div key={i} className="glass-card p-6 border-white/5 flex flex-col items-center text-center group hover:bg-white/5 transition-all relative">
                  <p className="text-[var(--c-6-start)] font-bold text-xs mb-2 uppercase tracking-tighter">{d.dept}</p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden relative group/img">
                      {d.imageUrl ? (
                        <Image 
                          src={resolveImageUrl(d.imageUrl)} 
                          alt={d.name || 'Dept Head'} 
                          fill 
                          className="object-cover" 
                          unoptimized={!d.imageUrl?.startsWith('http') && !d.imageUrl?.startsWith('/uploads/')}
                        />
                      ) : (
                        <User className="w-4 h-4 text-zinc-500" />
                      )}
                      
                      {/* Mini Upload Overlay - Only for Admins */}
                      {isAdmin && (
                        <div 
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = '.jpg,.jpeg,.png';
                            input.onchange = async (e: any) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              const formData = new FormData();
                              formData.append('file', file);
                              const res = await fetch('/api/upload', { method: 'POST', body: formData });
                              if (res.ok) {
                                const data = await res.json();
                                handleMemberUpdate(`panel.executive.${activeTab}.departments.${i}.imageUrl`, data.url);
                                showToast('Image updated', 'success');
                              } else {
                                showToast('Upload failed', 'error');
                              }
                            };
                            input.click();
                          }}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer z-10"
                        >
                          <Upload className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-white font-medium text-sm">{d.name || 'Head Name'}</p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </section>

        {/* --- SECRETARY POSITIONS SECTION --- */}
        <section className="space-y-12">
          <SectionHeading>{panel.secretariesTitle || "Secretary Positions"}</SectionHeading>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              { id: 'asstGeneralSecretary', label: 'Asst. General Secretary' },
              { id: 'jointSecretary', label: 'Joint Secretary' },
              { id: 'organizingSecretary', label: 'Organizing Secretary' },
              { id: 'correspondingSecretary', label: 'Corresponding Secretary' }
            ].map((category, idx) => (
              <ScrollReveal key={category.id} direction={idx % 2 === 0 ? "left" : "right"} distance={30} className="glass-card border-white/10 overflow-hidden flex flex-col h-full">
                <div className="bg-white/10 p-5 border-b border-white/10">
                  <h4 className="text-white font-bold font-display uppercase tracking-widest text-sm">{category.label}</h4>
                </div>
                <div className="p-5 space-y-3 flex-1 bg-black/20">
                  {activePanelData.secretaries?.[category.id]?.map((s: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white/[0.03] rounded-xl border border-white/5 hover:bg-white/10 transition-all group/sec cursor-default">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden relative group/img shrink-0 border border-white/10">
                        {s.imageUrl ? (
                          <Image 
                            src={resolveImageUrl(s.imageUrl)} 
                            alt={s.name || 'Secretary'} 
                            fill 
                            className="object-cover" 
                            unoptimized={!s.imageUrl?.startsWith('http') && !s.imageUrl?.startsWith('/uploads/')}
                          />
                        ) : (
                          <User className="w-5 h-5 text-zinc-500" />
                        )}
                        {isAdmin && (
                          <div 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file';
                              input.accept = '.jpg,.jpeg,.png';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const formData = new FormData();
                                formData.append('file', file);
                                const res = await fetch('/api/upload', { method: 'POST', body: formData });
                                if (res.ok) {
                                  const data = await res.json();
                                  handleMemberUpdate(`panel.executive.${activeTab}.secretaries.${category.id}.${i}.imageUrl`, data.url);
                                  showToast('Image updated', 'success');
                                } else {
                                  showToast('Upload failed', 'error');
                                }
                              };
                              input.click();
                            }}
                            className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer z-10"
                          >
                            <Upload className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-zinc-200 text-sm font-bold tracking-tight">{s.name || 'Secretary Name'}</p>
                    </div>
                  ))}
                </div>
              </ScrollReveal>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
};

export default Panel;
