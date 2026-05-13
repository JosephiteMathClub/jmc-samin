"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, Filter, Search, Trophy, Users, BookOpen, Sparkles } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import ScrollReveal from '../components/ScrollReveal';
import Image from 'next/image';
import { Skeleton } from '../components/Skeleton';
import { ExpandableEventCards } from '../components/ExpandableEventCards';
import { resolveImageUrl } from '../lib/utils';

import { usePerformance } from '../hooks/usePerformance';

const EventsSkeleton = () => (
  <div className="min-h-screen bg-transparent pt-40">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-24">
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-24 w-3/4 mb-6" />
        <Skeleton className="h-24 w-1/2 mb-12" />
        <Skeleton className="h-6 w-2/3" />
      </div>
      <div className="flex gap-4 mb-24">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-32 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[500px] rounded-3xl" />
        ))}
      </div>
    </div>
  </div>
);

const Events = () => {
  const { content, loading } = useContent();
  const eventsContent = content?.events || {};
  const events = React.useMemo(() => eventsContent.events || [], [eventsContent.events]);
  const [filter, setFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');
  const { shouldReduceGfx } = usePerformance();

  const filteredEvents = React.useMemo(() => {
    return events.filter((e: any) => {
      const matchesFilter = filter === 'all' || e.category?.toLowerCase() === filter.toLowerCase();
      const title = e.title || '';
      const description = e.description || '';
      const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                            description.toLowerCase().includes(search.toLowerCase());
      return matchesFilter && matchesSearch;
    });
  }, [events, filter, search]);

  if (loading) return <EventsSkeleton />;

  const categories = eventsContent.categories || [
    { id: 'all', name: 'All', icon: 'Calendar' },
    { id: 'competition', name: 'Competitions', icon: 'Trophy' },
    { id: 'workshop', name: 'Workshops', icon: 'BookOpen' },
    { id: 'seminar', name: 'Seminars', icon: 'Users' },
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] overflow-hidden">
      {/* Background Glows */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -right-24" />
          <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-2-start)]/5 bottom-0 -left-24" />
        </>
      )}

      <div className="pt-40 pb-32 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <ScrollReveal>
            <div className="max-w-5xl mb-24">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-[var(--c-6-start)]" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--c-6-start)]/80">{eventsContent.subtitle || 'UPCOMING EVENTS'}</span>
              </div>
              <h1 className="text-7xl md:text-[9rem] font-display font-bold leading-[0.85] tracking-tighter mb-12">
                {eventsContent.title?.split(' ').map((word: string, i: number) => (
                  <span key={i} className={i === 1 ? 'blue-text' : 'block'}>{word} </span>
                )) || (
                  <>
                    <span className="block">BEYOND</span>
                    <span className="blue-text">NUMBERS</span>
                  </>
                )}
              </h1>
              <p className="text-xl md:text-3xl text-zinc-400 font-light leading-relaxed max-w-3xl">
                {eventsContent.description || 'Join us for a series of challenging competitions, insightful workshops, and engaging seminars designed to push your mathematical boundaries.'}
              </p>
            </div>
          </ScrollReveal>

          {/* Filters & Search */}
          <div className="mb-24 flex flex-col lg:flex-row items-center justify-between gap-12">
            <ScrollReveal direction="left">
              <div className="flex flex-wrap items-center gap-3">
                {categories.map((cat: any) => {
                  const IconMap: any = { Calendar, Trophy, BookOpen, Users };
                  const Icon = IconMap[cat.icon] || Calendar;
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
                          layoutId="activeCat"
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
                  placeholder="SEARCH EVENTS..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-16 pr-8 py-5 bg-white/5 border border-white/10 rounded-full focus:outline-none focus:border-[var(--c-6-start)]/50 focus:ring-4 focus:ring-[var(--c-6-start)]/10 transition-all text-white placeholder:text-zinc-600 font-bold text-[10px] tracking-widest uppercase"
                />
              </div>
            </ScrollReveal>
          </div>

          {/* Events Grid */}
          <div className="mt-12">
            {filteredEvents.length > 0 ? (
              <ExpandableEventCards events={filteredEvents} shouldReduceGfx={shouldReduceGfx} />
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-40 rounded-[3rem] bg-white/[0.02] border border-dashed border-white/10"
              >
                <Calendar className="w-20 h-20 text-zinc-800 mx-auto mb-8 opacity-20" />
                <h3 className="text-3xl font-display font-bold text-zinc-600 mb-4">No events found</h3>
                <p className="text-zinc-700 uppercase tracking-widest text-xs font-bold">Try adjusting your filters or search terms.</p>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;
