"use client";
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { Menu, X, User, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { resolveImageUrl } from '../lib/utils';

import { usePerformance } from '../hooks/usePerformance';

const Navbar = () => {
  const { user, isAdmin, signOut } = useAuth();
  const { content } = useContent();
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);
  const [scrollProgress, setScrollProgress] = React.useState(0);
  const pathname = usePathname();
  const { shouldReduceGfx } = usePerformance();
  const [isInputFocused, setIsInputFocused] = React.useState(false);

  React.useEffect(() => {
    // Hide when typing on mobile
    const handleFocus = (e: FocusEvent) => {
      if (window.innerWidth >= 768) return; // Only on mobile
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

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScroll = window.scrollY;
          setScrolled(currentScroll > 20);
          
          if (!shouldReduceGfx) {
            const windowHeight = document.documentElement.scrollHeight - window.innerHeight;
            if (windowHeight > 0) {
              const currentProgress = (currentScroll / windowHeight) * 100;
              // Only update if difference is noticeable (e.g., > 0.5%)
              setScrollProgress(prev => Math.abs(prev - currentProgress) > 0.5 ? currentProgress : prev);
            }
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [shouldReduceGfx]);

  const [timeState, setTimeState] = React.useState<{ date: string, time: string } | null>(null);

  React.useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeState({
        date: now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase(),
        time: now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0')
      });
    };
    
    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Articles', path: '/articles' },
    { name: 'Events', path: '/events' },
    { name: 'Notice Board', path: '/notices' },
    { name: 'Panel', path: '/panel' },
  ];

  const logoUrl = content?.site?.logoUrl;
  const clubName = content?.site?.clubName || 'Josephite Math';
  const announcements = content?.site?.announcements || [];
  const showAnnouncements = content?.site?.showAnnouncements ?? true;

  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <motion.nav 
      initial={shouldReduceGfx ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
      animate={{ 
        y: isInputFocused ? -100 : 0, 
        opacity: isInputFocused ? 0 : 1 
      }}
      transition={{ duration: shouldReduceGfx ? 0.1 : 0.5, ease: 'easeOut' }}
      className={`${isAdminPage ? 'relative bg-[#080808] border-b border-white/5' : 'fixed top-0 left-0 w-full z-50'} transition-all duration-500 ${
        !isAdminPage && scrolled 
          ? 'glass-nav py-3 border-b border-white/10 shadow-2xl' 
          : !isAdminPage ? 'bg-transparent py-4 border-b border-transparent' : 'py-4'
      }`}
    >
      {/* Announcement Marquee */}
      {!isAdminPage && showAnnouncements && announcements.length > 0 && (
        <div className="w-full bg-[var(--c-6-start)]/10 border-b border-white/5 py-2 md:py-3 relative overflow-hidden group">
          <div className="absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-[#050505] to-transparent z-10 hidden md:block" />
          <div className="absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-[#050505] to-transparent z-10 hidden md:block" />
          
          <motion.div 
            animate={!shouldReduceGfx ? {
              x: ["0%", "-25%"],
            } : {}}
            transition={!shouldReduceGfx ? {
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 20 + announcements.length * 4,
                ease: "linear",
              },
            } : {}}
            className="flex whitespace-nowrap"
          >
            {[...announcements, ...announcements, ...announcements, ...announcements].map((text, i) => (
              <div key={i} className="inline-flex items-center mx-4 md:mx-12 shrink-0">
                <span className="w-1 h-1 rounded-full bg-[var(--c-6-start)] mr-3 md:mr-4 shadow-[0_0_8px_rgba(255,184,0,0.8)]" />
                <span className="text-[10px] md:text-sm font-mono font-bold tracking-[0.15em] md:tracking-[0.2em] text-white/80 uppercase">
                  {text}
                </span>
                <span className="ml-4 md:ml-12 text-white/20 select-none">{"//"}</span>
              </div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Elegant Scroll Progress Bar */}
      {!isAdminPage && scrolled && (
        <div 
          className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-[var(--c-6-start)] via-[var(--c-2-start)] to-[var(--c-6-start)] z-[60] transition-all duration-150 ease-out"
          style={{ width: `${scrollProgress}%` }}
        />
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between transition-all duration-500 ${scrolled ? 'h-16' : 'h-24'}`}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group relative px-4 py-2 hud-bracket hud-bracket-tl hud-bracket-br">
              <div className={`h-10 w-10 relative ${!shouldReduceGfx && 'group-hover:scale-110 transition-transform duration-500'}`}>
                <Image 
                  src={resolveImageUrl(logoUrl) || "/images/logo.png"} 
                  alt="JMC Logo" 
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-md font-display font-bold tracking-tight text-white ${!shouldReduceGfx && 'group-hover:text-[var(--c-6-start)] transition-colors duration-500'}`}>{clubName}</span>
                <div className="flex items-center space-x-2">
                  <span className="mono-label text-zinc-500">{content?.site?.established || 'EST. 2015'}</span>
                  <span className="w-1 h-1 rounded-full bg-[var(--c-6-start)] animate-pulse" />
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Status Monitor */}
          {!isAdminPage && (
            <div className="hidden lg:flex items-center justify-center flex-1 mx-8 pointer-events-none opacity-40">
              <div className="flex space-x-8 mono-label text-[8px] text-zinc-500">
                <div className="flex flex-col items-center">
                  <span>LAT: 23.8103° N</span>
                  <span className="glow-text-cyan">LON: 90.4125° E</span>
                </div>
                <div className="h-4 w-px bg-white/10 self-center" />
                <div className="flex flex-col items-center">
                  <span>SYS_READY</span>
                  <span className="glow-text-cyan">CORE: [STABLE]</span>
                </div>
                <div className="h-4 w-px bg-white/10 self-center" />
                <div className="flex flex-col items-center">
                  <span>{timeState?.date || 'SYS_CALIBRATING'}</span>
                  <span className="glow-text-cyan">UTC: {timeState?.time || '--:--'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`mono-label transition-all duration-500 hover:text-[var(--c-6-start)] relative group py-2 ${
                  pathname === link.path ? 'text-[var(--c-6-start)]' : 'text-zinc-500'
                }`}
              >
                {link.name}
                {pathname === link.path && (
                  <motion.div 
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 w-full h-[1px] bg-[var(--c-6-start)] shadow-[0_0_8px_rgba(0,180,219,0.5)]"
                  />
                )}
                <span className="absolute -top-1 -right-1 w-0.5 h-0.5 bg-[var(--c-6-start)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/admin"
                className="flex items-center space-x-1 text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                <LayoutDashboard className="h-4 w-4" />
                <span>Admin</span>
              </Link>
            )}
            {user ? (
              <div className="flex items-center space-x-4">
                <motion.div whileTap={shouldReduceGfx ? {} : { scale: 0.9 }}>
                  <Link href="/profile" className="text-zinc-400 hover:text-[var(--c-6-start)]">
                    <User className="h-5 w-5" />
                  </Link>
                </motion.div>
                <motion.button
                  whileTap={shouldReduceGfx ? {} : { scale: 0.9 }}
                  onClick={signOut}
                  className="text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </motion.button>
              </div>
            ) : (
              <motion.div whileTap={shouldReduceGfx ? {} : { scale: 0.95 }}>
                <Link
                  href="/login"
                  className="btn-premium-glow !px-6 !py-2 !text-[8px]"
                >
                  Login
                </Link>
              </motion.div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for mobile menu */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[45]"
            />
            
            <motion.div
              initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="md:hidden fixed top-0 right-0 h-screen w-[80%] bg-zinc-950/95 backdrop-blur-2xl border-l border-white/10 z-[55] shadow-2xl safe-p-top"
            >
              <div className="flex flex-col h-full p-8 pt-24 space-y-4">
                <div className="mono-label text-[10px] text-zinc-500 mb-6 flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-[var(--c-6-start)] animate-pulse" />
                  NAVIGATION_MENU
                </div>
                
                {navLinks.map((link, index) => (
                  <motion.div
                    key={link.path}
                    initial={shouldReduceGfx ? {} : { opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={link.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center justify-between group py-4 border-b border-white/5 transition-all active:scale-95 ${
                        pathname === link.path ? 'text-[var(--c-6-start)]' : 'text-zinc-300'
                      }`}
                    >
                      <span className="text-xl font-display font-medium">{link.name}</span>
                      <div className={`h-1.5 w-1.5 rounded-full ${pathname === link.path ? 'bg-[var(--c-6-start)] shadow-[0_0_8px_rgba(0,180,219,0.5)]' : 'bg-transparent'}`} />
                    </Link>
                  </motion.div>
                ))}

                <div className="pt-8 flex flex-col space-y-4 mt-auto pb-12">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsOpen(false)}
                      className="flex items-center space-x-3 p-4 rounded-2xl bg-emerald-500/5 text-emerald-400 border border-emerald-500/10 active:scale-95 transition-transform"
                    >
                      <LayoutDashboard size={20} />
                      <span className="font-medium font-display">Admin Dashboard</span>
                    </Link>
                  )}
                  
                  {user ? (
                    <div className="grid grid-cols-2 gap-4">
                      <Link
                        href="/profile"
                        onClick={() => setIsOpen(false)}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl bg-white/5 text-zinc-300 border border-white/10 active:scale-95 transition-transform"
                      >
                        <User size={24} className="mb-2" />
                        <span className="text-xs mono-label">Profile</span>
                      </Link>
                      <button
                        onClick={() => {
                          signOut();
                          setIsOpen(false);
                        }}
                        className="flex flex-col items-center justify-center p-6 rounded-2xl bg-red-500/5 text-red-500 border border-red-500/10 active:scale-95 transition-transform"
                      >
                        <LogOut size={24} className="mb-2" />
                        <span className="text-xs mono-label">Logout</span>
                      </button>
                    </div>
                  ) : (
                    <Link
                      href="/login"
                      onClick={() => setIsOpen(false)}
                      className="btn-premium-glow !w-full !p-5 !text-xs !bg-[var(--c-6-start)] !text-black text-center font-bold font-display flex items-center justify-center gap-2 active:scale-95 transition-transform"
                    >
                      ACCESS_TERMINAL (LOGIN)
                    </Link>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
