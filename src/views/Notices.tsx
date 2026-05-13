"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Calendar, Pin, ArrowRight, Search, Filter, Info, AlertTriangle, CheckCircle, Sparkles, Clock } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components/Skeleton';

import { usePerformance } from '../hooks/usePerformance';

const NoticesSkeleton = () => (
  <div className="min-h-screen bg-transparent pt-40">
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
  const notices = React.useMemo(() => noticesContent.notices || [], [noticesContent.notices]);
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const { shouldReduceGfx } = usePerformance();

  const filteredNotices = React.useMemo(() => {
    return notices.filter((n: any) => {
      const matchesFilter = filter === 'all' || n.type?.toLowerCase() === filter.toLowerCase();
      const title = n.title || '';
      const contentText = n.content || '';
      const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                            contentText.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [notices, filter, search]);

  if (loading) return <NoticesSkeleton />;

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
                    className="group"
                  >
                    <div className={`relative flex flex-col md:flex-row border-t border-white/10 ${i === filteredNotices.length - 1 ? 'border-b' : ''} bg-transparent transition-all duration-500 overflow-hidden`}>
                      
                      {/* Technical Meta Column */}
                      <div className="w-full md:w-64 p-8 flex flex-col justify-between border-r border-white/10 bg-white/[0.01]">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-zinc-600 mb-2">Notice ID: {notice.id?.slice(-8) || `NTC-${i+100}`}</span>
                          <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${
                              notice.tag === 'important' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' :
                              notice.tag === 'urgent' ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]' :
                              notice.tag === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' :
                              'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                            } animate-pulse`} />
                            <span className="font-mono text-[10px] uppercase font-bold text-white tracking-widest">
                              {notice.tag || notice.type || 'SYSTEM'}
                            </span>
                          </div>
                        </div>

                        <div className="mt-12 md:mt-0">
                          <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-widest">{notice.date}</span>
                        </div>
                      </div>

                      {/* Main content area */}
                      <div className="flex-grow p-8 md:p-12 relative group-hover:bg-white/[0.01] transition-colors duration-500">
                        {notice.isPinned && (
                          <div className="absolute top-8 right-12 flex items-center gap-3">
                            <span className="font-mono text-[9px] font-bold text-[var(--c-6-start)] uppercase tracking-[0.3em]">PRIORITY_LOCK</span>
                            <Pin className="w-3.5 h-3.5 text-[var(--c-6-start)] fill-[var(--c-6-start)]" />
                          </div>
                        )}

                        <div className="max-w-4xl">
                          <h3 className="text-2xl md:text-4xl font-display font-medium tracking-tight mb-8 group-hover:text-[var(--c-6-start)] transition-colors duration-500">
                            {notice.title}
                          </h3>
                          <div className="text-zinc-500 text-lg md:text-xl leading-relaxed font-light mb-10 whitespace-pre-line">
                            {notice.content}
                          </div>

                          {notice.link && (
                            <a 
                              href={notice.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group/link inline-flex items-center gap-4 py-4 px-8 rounded-full border border-white/10 hover:border-[var(--c-6-start)]/30 hover:bg-[var(--c-6-start)]/5 transition-all duration-500"
                            >
                              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 group-hover/link:text-[var(--c-6-start)]">
                                {notice.linkText || 'Execute_Module'}
                              </span>
                              <ArrowRight className="w-4 h-4 text-zinc-600 group-hover/link:text-[var(--c-6-start)] group-hover/link:translate-x-1 transition-all" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Subtle scanner decoration */}
                      {!shouldReduceGfx && (
                        <div className="absolute inset-y-0 right-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--c-6-start)]/20 to-transparent group-hover:via-[var(--c-6-start)]/40 transition-all duration-700" />
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
