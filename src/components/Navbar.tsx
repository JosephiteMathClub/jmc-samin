"use client";
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { Menu, X, User, LogOut, LayoutDashboard, Globe, Cpu, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../lib/utils';
import { usePerformance } from '../hooks/usePerformance';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { content } = useContent();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const { shouldReduceGfx } = usePerformance();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Hide when typing on mobile
    const handleFocus = (e: FocusEvent) => {
      if (window.innerWidth >= 768) return;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        setIsInputFocused(true);
      }
    };
    const handleBlur = () => setIsInputFocused(false);

    window.addEventListener('focusin', handleFocus);
    window.addEventListener('focusout', handleBlur);
    return () => {
      window.removeEventListener('focusin', handleFocus);
      window.removeEventListener('focusout', handleBlur);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);

    // GSAP Scroll Progress
    if (progressRef.current && !shouldReduceGfx) {
      gsap.to(progressRef.current, {
        scaleX: 1,
        ease: "none",
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.3,
        }
      });
    }

    return () => {
      window.removeEventListener('scroll', handleScroll);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, [shouldReduceGfx]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Articles', path: '/articles' },
    { name: 'Events', path: '/events' },
    { name: 'Notices', path: '/notices' },
    { name: 'Gallery', path: '/gallery' },
    { name: 'Panel', path: '/panel' },
  ];

  const logoUrl = content?.site?.logoUrl;
  const clubName = content?.site?.clubName || 'Josephite Math';
  const announcements = content?.site?.announcements || [];
  const showAnnouncements = content?.site?.showAnnouncements ?? true;
  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <motion.nav 
      ref={navRef}
      initial={{ y: -100, opacity: 0 }}
      animate={{ 
        y: isInputFocused ? -100 : 0, 
        opacity: isInputFocused ? 0 : 1 
      }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={`${isAdminPage ? 'relative bg-[#080808] border-b border-white/5' : 'fixed top-0 left-0 w-full z-50'} transition-all duration-700 ${
        !isAdminPage && scrolled 
          ? 'glass-nav py-3 border-b border-white/10 shadow-2xl' 
          : !isAdminPage ? 'bg-transparent py-6 border-b border-transparent' : 'py-4'
      }`}
    >
      {/* Scroll Progress Bar */}
      {!isAdminPage && (
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5 pointer-events-none">
          <div 
            ref={progressRef}
            className="h-full bg-gradient-to-r from-transparent via-[var(--c-6-start)] to-transparent origin-left scale-x-0 blur-[1px]"
          />
        </div>
      )}

      {/* Announcement Marquee System */}
      {!isAdminPage && showAnnouncements && announcements.length > 0 && !scrolled && (
        <div className="w-full bg-white/[0.02] border-b border-white/5 py-3 relative overflow-hidden hidden md:block">
           <motion.div 
            animate={{ x: ["0%", "-50%"] }}
            transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
            className="flex whitespace-nowrap gap-12"
          >
            {[...announcements, ...announcements].map((text, i) => (
              <div key={i} className="flex items-center gap-4 px-6 border-r border-white/10">
                <Radio className="w-3 h-3 text-[var(--c-6-start)] animate-pulse" />
                <span className="text-[9px] font-mono font-black text-white/50 uppercase tracking-[0.3em]">{text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className={`flex justify-between items-center transition-all duration-700 ${scrolled ? 'h-16' : 'h-24'}`}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-5 group relative">
              <div className="relative w-12 h-12 transition-transform duration-700 group-hover:scale-110">
                <div className="absolute inset-0 bg-[var(--c-6-start)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Image 
                  src={resolveImageUrl(logoUrl) || "/images/logo.png"} 
                  alt="JMC Logo" 
                  fill
                  priority
                  className="object-contain relative z-10"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xl font-display font-black tracking-tighter text-white uppercase">{clubName}</span>
                <div className="flex items-center gap-2">
                  <div className="h-[1px] w-4 bg-[var(--c-6-start)] shadow-[0_0_8px_rgba(0,180,219,1)]" />
                  <span className="text-[8px] font-mono font-black text-zinc-500 tracking-[0.4em]">INIT_S_01_OK</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-[10px] font-mono font-black uppercase tracking-[0.25em] transition-all duration-500 relative group px-2 py-1 ${
                  pathname === link.path ? 'text-[var(--c-6-start)]' : 'text-zinc-500 hover:text-white'
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div 
                    layoutId="nav_underline_pro"
                    className="absolute -bottom-1 left-0 w-full h-[1px] bg-[var(--c-6-start)] shadow-[0_0_10px_rgba(0,180,219,0.5)]"
                  />
                )}
                {/* HUD Corners for hover */}
                <span className="absolute top-0 left-0 w-1 h-1 border-t border-l border-[var(--c-6-start)] opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="absolute bottom-0 right-0 w-1 h-1 border-b border-r border-[var(--c-6-start)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            
            {user ? (
               <div className="flex items-center gap-6 pl-6 border-l border-white/10">
                <Link href="/profile" className="p-2.5 rounded-xl glass border-white/5 text-zinc-500 hover:text-[var(--c-6-start)] transition-all">
                  <User className="h-4 w-4" />
                </Link>
                <div className="h-6 w-px bg-white/5" />
                <button onClick={signOut} className="p-2.5 rounded-xl glass border-white/5 text-zinc-500 hover:text-red-500 transition-all">
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="px-8 py-2.5 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.2em] rounded-full hover:scale-105 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Access_Term
              </Link>
            )}
          </div>

          {/* Mobile Toggle */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-3 rounded-2xl glass border-white/10 text-white transition-all active:scale-90"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="md:hidden fixed inset-0 z-[60] bg-black/95 backdrop-blur-3xl overflow-hidden"
          >
            <div className="absolute top-8 right-8">
               <button onClick={() => setIsOpen(false)} className="p-4 rounded-full glass border-white/10 text-white">
                 <X className="w-8 h-8" />
               </button>
            </div>

            <div className="flex flex-col h-full px-6 pt-32 pb-6 space-y-6 overflow-y-auto">
              <div className="flex flex-col gap-2 mb-6">
                <div className="h-1 w-12 bg-[var(--c-6-start)]" />
                <div className="text-[10px] font-mono font-black text-zinc-500 tracking-[0.5em] uppercase">Navigation_Index</div>
              </div>
              
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.path}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Link
                    href={link.path}
                    onClick={() => setIsOpen(false)}
                    className={`text-3xl font-display font-black uppercase tracking-tighter transition-all block ${
                      pathname === link.path ? 'text-[var(--c-6-start)]' : 'text-zinc-700 hover:text-white'
                    }`}
                  >
                    {link.name}
                  </Link>
                </motion.div>
              ))}

              <div className="pt-12 mt-auto space-y-6">
                {user ? (
                   <div className="grid grid-cols-2 gap-4">
                    <Link href="/profile" onClick={() => setIsOpen(false)} className="p-6 rounded-3xl glass border-white/10 flex flex-col gap-4">
                      <User className="w-8 h-8 text-[var(--c-6-start)]" />
                      <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Dashboard</span>
                    </Link>
                    <button onClick={signOut} className="p-6 rounded-3xl glass border-white/10 flex flex-col gap-4">
                      <LogOut className="w-8 h-8 text-red-500" />
                      <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">Disconnect</span>
                    </button>
                   </div>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setIsOpen(false)}
                    className="block w-full py-8 bg-white text-black rounded-[2rem] text-center text-xs font-mono font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                  >
                    Authorize_System
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
