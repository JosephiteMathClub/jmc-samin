"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Pin, ArrowRight, Search, Filter, Info, AlertTriangle, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components/Skeleton';

import { usePerformance } from '../hooks/usePerformance';

const NoticesSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-24">
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-24 w-3/4 mb-6" />
        <Skeleton className="h-24 w-1/2 mb-12" />
        <Skeleton className="h-6 w-2/3" />
      </div>
      <div className="space-y-8">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-64 rounded-[2.5rem]" />
        ))}
      </div>
    </div>
  </div>
);

const Notices = () => {
  const { content, loading } = useContent();
  const noticesContent = content?.notices || {};
  const notices = noticesContent.notices || [];
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const { shouldReduceGfx } = usePerformance();

  if (loading) return <NoticesSkeleton />;

  const filteredNotices = notices.filter((n: any) => {
    const matchesFilter = filter === 'all' || n.type?.toLowerCase() === filter.toLowerCase();
    const title = n.title || '';
    const contentText = n.content || '';
    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                          contentText.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const categories = noticesContent.categories || [
    { id: 'all', name: 'All', icon: 'Bell' },
    { id: 'important', name: 'Important', icon: 'AlertTriangle' },
    { id: 'general', name: 'General', icon: 'Info' },
    { id: 'success', name: 'Success', icon: 'CheckCircle' },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden">
      {/* Background Glows */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -left-24" />
          <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-2-start)]/5 bottom-0 -right-24" />
        </>
      )}

      <div className="pt-40 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <ScrollReveal>
            <div className="max-w-5xl mb-24">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-[var(--c-6-start)]" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--c-6-start)]/80">{noticesContent.subtitle || 'ANNOUNCEMENTS'}</span>
              </div>
              <h1 className="text-7xl md:text-[9rem] font-display font-bold leading-[0.85] tracking-tighter mb-12">
                {noticesContent.title?.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i === 1 ? 'blue-text' : 'block'}>{word} </span>
                )) || (
                  <>
                    <span className="block">NOTICE</span>
                    <span className="blue-text">BOARD</span>
                  </>
                )}
              </h1>
              <p className="text-xl md:text-3xl text-zinc-400 font-light leading-relaxed max-w-3xl">
                {noticesContent.description || 'Stay updated with the latest announcements, results, and important information from the Josephite Math Club.'}
              </p>
            </div>
          </ScrollReveal>

          {/* Filters & Search */}
          <div className="mb-24 flex flex-col lg:flex-row items-center justify-between gap-12">
            <ScrollReveal direction="left">
              <div className="flex flex-wrap items-center gap-3">
                {categories.map((cat: any) => {
                  const IconMap: any = { Bell, AlertTriangle, Info, CheckCircle };
                  const Icon = IconMap[cat.icon] || Bell;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setFilter(cat.id)}
                      className={`px-8 py-4 rounded-full text-[10px] uppercase tracking-widest font-bold flex items-center gap-3 transition-all duration-500 border relative overflow-hidden group/cat ${
                        filter === cat.id 
                          ? 'text-white border-transparent shadow-xl shadow-[var(--c-6-start)]/20' 
                          : 'bg-white/5 text-zinc-500 border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {filter === cat.id && (
                        <motion.div 
                          layoutId="activeCatNotice"
                          className="absolute inset-0 bg-gradient-to-br from-[var(--c-6-start)] to-[var(--c-6-end)] -z-0"
                        />
                      )}
                      <Icon className="w-4 h-4 relative z-10" />
                      <span className="relative z-10">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </ScrollReveal>

            <ScrollReveal direction="right">
              <div className="relative w-full lg:w-96 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500 group-focus-within:text-[var(--c-6-start)] transition-colors" />
                <input 
                  type="text"
                  placeholder="SEARCH NOTICES..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-600 font-bold text-[10px] tracking-widest uppercase"
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Notices Grid */}
          <div className="grid grid-cols-1 gap-8">
            <AnimatePresence mode="popLayout">
              {filteredNotices.length > 0 ? (
                filteredNotices.map((notice: any, i: number) => (
                  <motion.div
                    key={notice.id || i}
                    layout
                    initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 20 }}
                    animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
                    exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: shouldReduceGfx ? 0 : i * 0.05 }}
                  >
                    <div className={`group relative p-8 md:p-10 rounded-[2.5rem] bg-white/[0.02] border border-white/5 ${!shouldReduceGfx && 'hover:border-[var(--c-6-start)]/30 hover:bg-white/[0.04] transition-all duration-500'} overflow-hidden ${notice.isPinned ? 'border-[var(--c-6-start)]/20 bg-[var(--c-6-start)]/[0.02]' : ''}`}>
                      {notice.isPinned && (
                        <div className="absolute top-8 right-8 flex items-center gap-2">
                          <span className="text-[8px] font-bold text-[var(--c-6-start)] uppercase tracking-[0.2em]">Pinned Notice</span>
                          <Pin className="w-4 h-4 text-[var(--c-6-start)] fill-[var(--c-6-start)]" />
                        </div>
                      )}
                      <div className="flex flex-col md:flex-row md:items-start gap-8 md:gap-12 relative z-10">
                        <div className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-[var(--c-6-start)]/10 text-[var(--c-6-start)] border border-[var(--c-6-start)]/20 ${!shouldReduceGfx && 'group-hover:scale-105 group-hover:bg-[var(--c-6-start)]/20 transition-all duration-500'}`}>
                          <Calendar className="w-6 h-6 md:w-8 md:h-8 mb-1 md:mb-2" />
                          <div className="text-[8px] md:text-[10px] font-bold uppercase tracking-[0.2em]">{notice.date?.split(' ')[0]}</div>
                        </div>
                        <div className="flex-grow">
                          <div className="flex flex-wrap items-center gap-4 mb-6">
                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border flex items-center gap-2 ${
                              notice.tag === 'important' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                              notice.tag === 'urgent' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' :
                              notice.tag === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                              'bg-blue-500/10 text-blue-500 border-blue-500/20'
                            }`}>
                              {notice.tag === 'important' && <AlertTriangle className="w-3 h-3" />}
                              {notice.tag === 'success' && <CheckCircle className="w-3 h-3" />}
                              {notice.tag || notice.type || 'General'}
                            </span>
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              {notice.date}
                            </span>
                          </div>
                          <h3 className="text-2xl md:text-4xl font-display font-bold mb-6 group-hover:text-[var(--c-6-start)] transition-colors leading-tight">{notice.title}</h3>
                          <p className="text-lg md:text-xl text-zinc-500 leading-relaxed mb-10 whitespace-pre-line font-light">
                            {notice.content}
                          </p>
                          {notice.link && (
                            <a 
                              href={notice.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-4 text-[var(--c-6-start)] font-bold uppercase tracking-widest text-xs hover:gap-6 transition-all duration-500 group/link"
                            >
                              <span className="relative">
                                {notice.linkText || 'View Details'}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[var(--c-6-start)] group-hover/link:w-full transition-all duration-500" />
                              </span>
                              <ArrowRight className="w-5 h-5 group-hover/link:translate-x-2 transition-transform" />
                            </a>
                          )}
                        </div>
                      </div>
                      {/* Subtle Background Accent */}
                      {!shouldReduceGfx && (
                        <div className="absolute -bottom-12 -right-12 w-64 h-64 bg-[var(--c-6-start)]/5 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-40 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10"
                >
                  <Bell className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
                  <h3 className="text-3xl font-display font-bold text-zinc-600 mb-4">No notices found</h3>
                  <p className="text-zinc-700 uppercase tracking-widest text-xs font-bold">Try adjusting your filters or search terms.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notices;
