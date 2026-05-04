"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useContent } from '../context/ContentContext';
import { motion } from 'framer-motion';
import { usePerformance } from '../hooks/usePerformance';
import { Skeleton } from '../components/Skeleton';

// Import Hero directly as it's above the fold (LCP)
import { Hero } from '../components/home/Hero';

// Dynamic imports for components below the fold
const Memories = dynamic(() => import('../components/home/Memories').then(mod => mod.Memories), {
  loading: () => <div className="py-24 flex items-center justify-center"><Skeleton className="w-full max-w-7xl h-[400px] rounded-[3rem]" /></div>
});

const Agenda = dynamic(() => import('../components/home/Agenda').then(mod => mod.Agenda), {
  loading: () => <div className="py-24 flex items-center justify-center"><Skeleton className="w-full max-w-7xl h-[400px] rounded-[3rem]" /></div>
});

const Testimonials = dynamic(() => import('../components/home/Testimonials').then(mod => mod.Testimonials), {
  loading: () => <div className="py-24 flex items-center justify-center"><Skeleton className="w-full max-w-7xl h-[400px] rounded-[3rem]" /></div>
});

const HomeSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-32">
        <Skeleton className="h-4 w-32 mb-8 rounded-full" />
        <Skeleton className="h-24 w-3/4 mb-6" />
        <Skeleton className="h-24 w-1/2 mb-12" />
        <Skeleton className="h-6 w-2/3 mb-12" />
        <div className="flex gap-4">
          <Skeleton className="h-16 w-48 rounded-2xl" />
          <Skeleton className="h-16 w-48 rounded-2xl" />
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { content, loading } = useContent();
  const { home } = content;
  const { shouldReduceGfx } = usePerformance();

  const testimonials = useMemo(() => {
    const list = home?.testimonials || [];
    if (list.length > 0) return list;
    return [
      {
        name: "Dr. S.M. Abu Saim",
        role: "Moderator",
        message: "JMC has been a beacon of mathematical exploration for years. It's heartening to see students push their boundaries through logic and creativity.",
        imageUrl: ""
      },
      {
        name: "Samin Yasar",
        role: "President",
        message: "The club is not just about solving equations; it's about building a community that thinks differently and solves real-world challenges.",
        imageUrl: ""
      },
      {
        name: "Zidan Al-Zayed",
        role: "General Secretary",
        message: "Being part of JMC has shaped how I view complexity. It's a sanctuary for those who find beauty in the language of the universe.",
        imageUrl: ""
      }
    ];
  }, [home?.testimonials]);
  const duplicatedTestimonials = useMemo(() => {
    return [...testimonials, ...testimonials];
  }, [testimonials]);

  const gallery = useMemo(() => {
    const customGallery = (home?.gallery || []).filter((url: string) => !!url && typeof url === 'string');
    return customGallery.length > 0 
      ? customGallery 
      : [
          "/images/gallery/gallery1.jpg",
          "/images/gallery/gallery2.jpg",
          "/images/gallery/gallery3.jpg",
          "/images/gallery/gallery4.jpg",
          "/images/gallery/gallery5.jpg",
          "/images/gallery/gallery6.jpg",
        ];
  }, [home?.gallery]);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="relative min-h-screen selection:bg-[var(--c-6-start)]/30 selection:text-white">
      {/* Immersive Background */}
      {!shouldReduceGfx && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.06, 0.1, 0.06],
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-[var(--c-6-start)]/20 blur-[100px] rounded-full will-change-transform"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                opacity: [0.04, 0.08, 0.04],
              }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-[10%] -right-[10%] w-[60%] h-[60%] bg-[var(--c-2-start)]/15 blur-[120px] rounded-full will-change-transform"
            />
            
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
        </div>
      )}

      {/* Floating Status Bar - Desktop Only */}
      <div className="hidden lg:flex fixed left-8 top-1/2 -translate-y-1/2 flex-col gap-8 z-40">
        <div className="flex flex-col items-center gap-6 py-8 px-4 rounded-[2rem] glass border-white/5 relative group overflow-hidden">
          <motion.div 
            className="absolute inset-x-0 h-[1px] bg-[var(--c-6-start)]/50 blur-[2px] z-10"
            style={{ willChange: 'transform' }}
            animate={{ y: ['-100%', '800%'] }} // Approximate full height of its container
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          />
          
          <div className="relative">
            <div className="w-2 h-2 rounded-full bg-[var(--c-6-start)] shadow-[0_0_10px_rgba(255,184,0,0.8)] animate-pulse" />
            <motion.div 
              className="absolute inset-0 rounded-full border border-[var(--c-6-start)]/50"
              style={{ willChange: 'transform, opacity' }}
              animate={{ scale: [1, 1.5], opacity: [1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="vertical-text text-[9px] font-mono font-black tracking-[0.5em] text-white/60 uppercase">System_Active</div>
          </div>

          <div className="w-[1px] h-24 bg-gradient-to-b from-[var(--c-6-start)]/40 via-white/10 to-transparent" />
          <div className="text-[10px] font-mono text-white/20 rotate-90 tracking-widest">v3.1.0_PRO</div>
        </div>
      </div>

      <Hero home={home} shouldReduceGfx={shouldReduceGfx} />

      {/* Mobile-Only Interactive HUD Section */}
      <div className="md:hidden px-4 mb-24 -mt-24 relative z-20">
        <div className="mobile-hud-grid">
          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="glass-card p-4 flex flex-col items-center gap-2 border-white/10"
          >
            <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Members</div>
            <div className="text-2xl font-display font-black text-white">2.4k+</div>
            <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: '75%' }}
                className="h-full bg-[var(--c-6-start)]"
              />
            </div>
          </motion.div>

          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="glass-card p-4 flex flex-col items-center gap-2 border-white/10"
          >
            <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">Events</div>
            <div className="text-2xl font-display font-black text-white">48+</div>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 4 ? 'bg-[var(--c-2-start)]' : 'bg-white/10'}`} />
              ))}
            </div>
          </motion.div>

          <motion.div 
            whileTap={{ scale: 0.95 }}
            className="glass-card p-4 flex flex-col items-center gap-2 border-white/10 col-span-2 sm:col-span-1"
          >
            <div className="flex justify-between w-full">
              <div className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest">System_Status</div>
              <div className="text-[8px] font-mono text-emerald-500 animate-pulse">Running</div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-display font-black text-white">100%</span>
              <span className="text-[10px] font-mono text-zinc-500 italic">stable</span>
            </div>
          </motion.div>
        </div>
      </div>

      <Memories home={home} gallery={gallery} shouldReduceGfx={shouldReduceGfx} />
      <Agenda home={home} />
      <Testimonials home={home} duplicatedTestimonials={duplicatedTestimonials} shouldReduceGfx={shouldReduceGfx} />
    </div>
  );
};

export default Home;
