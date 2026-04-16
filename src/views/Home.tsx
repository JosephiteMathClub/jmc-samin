"use client";
import React, { useState, useEffect } from 'react';
import { useContent } from '../context/ContentContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Calculator, Brain, Users, ChevronLeft, ChevronRight, Quote, Code, Cpu, Globe, BookOpen, Lightbulb, Zap, Trophy, Star } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import ScrollReveal from '../components/ScrollReveal';
import TypewriterText from '../components/TypewriterText';
import { usePerformance } from '../hooks/usePerformance';
import { Skeleton } from '../components/Skeleton';
import { resolveImageUrl } from '../lib/utils';

const HomeSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Skeleton */}
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

      {/* Stats Skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-32">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-40 rounded-3xl" />
        ))}
      </div>

      {/* Memories Skeleton */}
      <div className="mb-32">
        <Skeleton className="h-12 w-64 mb-12 mx-auto" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="aspect-video rounded-3xl" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

const Home = () => {
  const { content, loading } = useContent();
  const { home } = content;
  const [currentIndex, setCurrentIndex] = useState(0);
  const { shouldReduceGfx, isMobile } = usePerformance();
  const testimonials = home?.testimonials || [];
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  const gallery = home?.gallery && home.gallery.length > 0 
    ? home.gallery
    : [
        "/images/gallery/gallery1.jpg",
        "/images/gallery/gallery2.jpg",
        "/images/gallery/gallery3.jpg",
        "/images/gallery/gallery4.jpg",
        "/images/gallery/gallery5.jpg",
        "/images/gallery/gallery6.jpg",
      ];

  useEffect(() => {
    if (gallery.length === 0) return;
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [gallery.length]);

  if (loading) return <HomeSkeleton />;

  const nextImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % gallery.length);
  };

  const prevImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + gallery.length) % gallery.length);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } },
  };

  const wordVariants: any = {
    hidden: { opacity: 0, y: 50 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.8,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="relative min-h-screen">
      {/* Background Innovation Elements */}
      {!shouldReduceGfx && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, 45, 0],
                opacity: [0.05, 0.08, 0.05],
              }}
              transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              style={{ willChange: "transform, opacity" }}
              className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[var(--c-6-start)]/10 blur-[80px] rounded-full"
            />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, -45, 0],
                opacity: [0.03, 0.06, 0.03],
              }}
              transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
              style={{ willChange: "transform, opacity" }}
              className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[var(--c-2-start)]/10 blur-[100px] rounded-full"
            />
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="relative py-32 md:py-48 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-block px-4 py-1.5 mb-8 rounded-full glass text-[var(--c-6-start)] text-xs font-bold tracking-[0.2em] uppercase border-[var(--c-6-start)]/20"
            >
              {home?.heroTagline || "Est. 2015 * Excellence in Mathematics"}
            </motion.div>
            
            <div className="overflow-hidden mb-8">
              <h1 className="text-7xl md:text-[10rem] font-bold tracking-tighter text-white font-display leading-[0.85] flex flex-wrap justify-center gap-x-6">
                {(home?.heroTitle || "Josephite Math Club").split(' ').map((word: string, i: number, arr: string[]) => (
                  <motion.span
                    key={i}
                    custom={i}
                    initial={shouldReduceGfx ? { opacity: 1 } : "hidden"}
                    animate="visible"
                    variants={wordVariants}
                    className={i === arr.length - 1 ? "blue-text" : ""}
                  >
                    {word}
                  </motion.span>
                ))}
              </h1>
            </div>

            <motion.p
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 1 }}
              className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto mb-16 leading-relaxed font-light tracking-tight h-[3em] flex items-center justify-center"
            >
              {shouldReduceGfx ? (
                <span>{home?.heroSubtitle || "Where logic meets creativity to solve the world's most beautiful problems."}</span>
              ) : (
                <TypewriterText 
                  texts={home?.heroSubtitles || [
                    home?.heroSubtitle || "Where logic meets creativity to solve the world's most beautiful problems.",
                    "Exploring the infinite boundaries of mathematical thought.",
                    "Building a sanctuary for Josephite mathematicians.",
                    "Innovating through the language of the universe."
                  ]}
                  speed={70}
                  delay={3000}
                />
              )}
            </motion.p>

            <motion.div
              initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex flex-col sm:flex-row justify-center gap-8"
            >
              <motion.div whileHover={shouldReduceGfx ? {} : { scale: 1.05 }} whileTap={shouldReduceGfx ? {} : { scale: 0.95 }}>
                <Link
                  href="/panel"
                  className="btn-premium-glow"
                >
                  {home?.joinButtonText || "Join the Club"} <ArrowRight className="w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div whileHover={shouldReduceGfx ? {} : { scale: 1.05 }} whileTap={shouldReduceGfx ? {} : { scale: 0.95 }}>
                <Link
                  href="/about"
                  className="btn-premium"
                >
                  {home?.storyButtonText || "Our Story"}
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Floating Math Symbols */}
        {!shouldReduceGfx && (
          <div className="absolute inset-0 pointer-events-none opacity-40">
            {[Calculator, Brain].map((Icon, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: [0.4, 0.8, 0.4],
                  y: [0, -40, 0],
                  x: [0, 20, 0],
                  rotate: [0, 10, 0]
                }}
                transition={{ 
                  duration: 8 + i * 2, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  delay: i * 2
                }}
                className="absolute"
                style={{
                  top: `${20 + i * 30}%`,
                  left: `${10 + i * 35}%`,
                }}
              >
                <Icon className="w-16 h-16 text-[var(--c-6-start)]/60" />
              </motion.div>
            ))}
            
            {/* Integration Expression instead of Word */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ 
                opacity: [0.5, 0.9, 0.5],
                y: [0, 50, 0],
                x: [0, -30, 0],
                rotate: [0, -15, 0]
              }}
              transition={{ 
                duration: 12, 
                repeat: Infinity, 
                ease: "easeInOut"
              }}
              className="absolute text-[var(--c-6-start)]/60 font-handwritten text-4xl select-none"
              style={{ 
                top: '82%', 
                left: '82%',
                fontFamily: 'var(--font-handwritten)'
              }}
            >
              &int; f(x) dx
            </motion.div>
          </div>
        )}
      </section>

      {/* Memories Section */}
      <section id="memories" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <ScrollReveal direction="up" distance={20} className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--c-2-start)]/10 text-[var(--c-2-start)] text-[10px] font-bold tracking-[0.3em] uppercase border border-[var(--c-2-start)]/20">
              {home?.memoriesTagline || "Visual Journey"}
            </ScrollReveal>
            <ScrollReveal direction="up" distance={30} delay={0.1}>
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white font-display">
                {home?.memoriesTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                  <span key={i} className={i === arr.length - 1 ? "pink-text" : "mr-4"}>
                    {word}
                  </span>
                )) || (
                  <>Our <span className="pink-text">Memories</span></>
                )}
              </h2>
            </ScrollReveal>
          </div>

          <ScrollReveal direction="up" distance={50} delay={0.2} className="relative w-full max-w-6xl mx-auto aspect-[16/9] rounded-[2.5rem] overflow-hidden glass-card border-white/10 group shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <AnimatePresence mode="wait">
              <div className="w-full h-full relative">
                <Image
                  key={currentIndex}
                  src={resolveImageUrl(gallery[currentIndex])}
                  alt={`Memory ${currentIndex + 1}`}
                  fill
                  priority={currentIndex === 0}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                />
              </div>
            </AnimatePresence>

            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Navigation Arrows */}
            <button
              onClick={prevImage}
              className="absolute left-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 text-white hover:bg-[var(--c-2-start)] hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10 scale-90 hover:scale-100"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            
            <button
              onClick={nextImage}
              className="absolute right-8 top-1/2 -translate-y-1/2 p-4 rounded-full bg-black/40 text-white hover:bg-[var(--c-2-start)] hover:text-white transition-all opacity-0 group-hover:opacity-100 backdrop-blur-xl border border-white/10 scale-90 hover:scale-100"
            >
              <ChevronRight className="w-8 h-8" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-4">
              {gallery.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    idx === currentIndex ? 'w-12 bg-[var(--c-2-start)]' : 'w-4 bg-white/30 hover:bg-white/60'
                  }`}
                />
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20">
          <div className="text-center">
            <ScrollReveal direction="up" distance={20} className="inline-block px-3 py-1 mb-4 rounded-full bg-[var(--c-1-start)]/10 text-[var(--c-1-start)] text-[10px] font-bold tracking-[0.3em] uppercase border border-[var(--c-1-start)]/20">
              {home?.testimonialsTagline || "Voices of JMC"}
            </ScrollReveal>
            <ScrollReveal direction="up" distance={30} delay={0.1}>
              <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-white font-display">
                {home?.testimonialsTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                  <span key={i} className={i === arr.length - 1 ? "gold-text" : "mr-4"}>
                    {word}
                  </span>
                )) || (
                  <>People About <span className="gold-text">JMC</span></>
                )}
              </h2>
            </ScrollReveal>
          </div>
        </div>

        <div className="relative flex overflow-hidden group py-16 -my-16">
          <div className="absolute inset-y-0 left-0 w-60 bg-gradient-to-r from-[#050505] to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-60 bg-gradient-to-l from-[#050505] to-transparent z-10 pointer-events-none" />

          <div
            className={`flex gap-10 w-max px-4 ${!shouldReduceGfx ? 'animate-marquee marquee-pause' : ''}`}
          >
            {duplicatedTestimonials.map((t: any, i: number) => (
              <motion.div
                key={i}
                whileHover={shouldReduceGfx ? {} : { 
                  y: -10, 
                  scale: 1.01,
                  borderColor: "rgba(255, 184, 0, 0.3)",
                  boxShadow: "0 20px 40px -10px rgba(255, 184, 0, 0.15)",
                  zIndex: 50
                }}
                style={{ willChange: "transform, box-shadow" }}
                className="w-[500px] shrink-0 glass-card p-10 border-white/10 transition-all duration-500 group/card relative overflow-hidden"
              >
                <div className="absolute -top-32 -right-32 w-64 h-64 bg-[var(--c-1-start)]/5 blur-[100px] group-hover/card:bg-[var(--c-1-start)]/20 transition-colors duration-700" />
                
                <div className="flex items-start justify-between mb-8 relative z-10">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-[var(--c-1-start)]/20 bg-zinc-900 shrink-0 rotate-3 group-hover/card:rotate-0 transition-transform duration-500 relative">
                      {t.imageUrl ? (
                        <Image 
                          src={resolveImageUrl(t.imageUrl)} 
                          alt={t.name} 
                          fill
                          className="object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                          <Users className="w-10 h-10 text-zinc-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xl font-bold text-white truncate mb-1">{t.name}</h4>
                      <p className="text-[10px] font-black text-[var(--c-1-start)] uppercase tracking-[0.2em]">{t.role}</p>
                    </div>
                  </div>
                  <Quote className="w-10 h-10 text-[var(--c-1-start)]/10 group-hover/card:text-[var(--c-1-start)]/30 transition-colors duration-500" />
                </div>
                <p className="text-zinc-400 text-base leading-relaxed whitespace-normal line-clamp-6 italic font-light relative z-10 tracking-tight">
                  &quot;{t.message}&quot;
                </p>
                
                {/* Decorative Element */}
                <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--c-1-start)]/20 to-transparent transform scale-x-0 group-hover/card:scale-x-100 transition-transform duration-700" />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Club Agenda Section */}
      <section id="agenda" className="py-32 relative bg-zinc-900/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <ScrollReveal direction="up" distance={50}>
              <div className="inline-block px-3 py-1 mb-6 rounded-full bg-[var(--c-5-start)]/10 text-[var(--c-5-start)] text-[10px] font-bold tracking-[0.3em] uppercase border border-[var(--c-5-start)]/20">
                {home?.agendaTagline || "Our Mission"}
              </div>
              <h2 className="text-5xl md:text-7xl font-bold text-white font-display tracking-tighter mb-8">
                {home?.agendaTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                  <span key={i} className={i === arr.length - 1 ? "blue-text" : "mr-4"}>
                    {word}
                  </span>
                )) || (
                  <>The Club <span className="blue-text">Agenda</span></>
                )}
              </h2>
              <p className="text-xl text-zinc-400 font-light leading-relaxed mb-16 max-w-2xl mx-auto">
                {home?.agendaDescription || "We aim to bridge the gap between theoretical mathematics and practical innovation through a series of structured programs."}
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {(home?.agendaItems || [
                  { title: "Weekly Workshops", icon: "Zap" },
                  { title: "Monthly Competitions", icon: "Trophy" },
                  { title: "Annual Math Festival", icon: "Star" },
                  { title: "Research Projects", icon: "Lightbulb" }
                ]).map((item: any, i: number) => {
                  const IconMap: any = { Zap, Trophy, Star, Lightbulb };
                  const Icon = IconMap[item.icon] || Zap;
                  return (
                    <div key={i} className="flex items-center gap-5 group glass-card p-6 border-white/5 hover:border-[var(--c-5-start)]/30 transition-all duration-500">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-[var(--c-5-start)] transition-all duration-500 shrink-0">
                        <Icon className="w-7 h-7 text-[var(--c-5-start)] group-hover:text-white transition-colors duration-500" />
                      </div>
                      <span className="text-xl text-white font-medium group-hover:text-[var(--c-5-start)] transition-colors duration-500">{item.title}</span>
                    </div>
                  );
                })}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
