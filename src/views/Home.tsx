"use client";
import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useContent } from '../context/ContentContext';
import { motion } from 'framer-motion';
import { usePerformance } from '../hooks/usePerformance';
import { Skeleton } from '../components/Skeleton';
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
        role: "Chief Moderator",
        message: "JMC has been a beacon of mathematical exploration for years. It's heartening to see students push their boundaries through logic and creativity.",
        imageUrl: ""
      },
      {
        name: "Samin Yasar",
        role: "President",
        message: "The club is not just about solving equations; it's about building a community that thinks differently and solves real-world challenges.",
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
          "/images/gallery/gallery4.jpg"
        ];
  }, [home?.gallery]);

  if (loading) return <HomeSkeleton />;

  return (
    <div className="relative min-h-screen selection:bg-[var(--c-6-start)]/30 selection:text-white bg-[#050505]">
      {/* Immersive Background Grid System */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:100px_100px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] opacity-30" />
          
          <div className="absolute top-0 left-1/4 w-[60vw] h-[60vw] bg-[var(--c-6-start)]/10 blur-[150px] rounded-full animate-pulse opacity-40" />
          <div className="absolute bottom-0 right-1/4 w-[60vw] h-[60vw] bg-[var(--c-5-start)]/10 blur-[150px] rounded-full animate-pulse opacity-40" />
      </div>

      <Hero home={home} shouldReduceGfx={shouldReduceGfx} />

      <div className="relative z-10 flex flex-col">
        <Memories home={home} gallery={gallery} shouldReduceGfx={shouldReduceGfx} />
        <Agenda home={home} />
        <Testimonials home={home} duplicatedTestimonials={duplicatedTestimonials} shouldReduceGfx={shouldReduceGfx} />
      </div>
    </div>
  );
};

export default Home;
