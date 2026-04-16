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
  const pathname = usePathname();
  const { shouldReduceGfx } = usePerformance();

  React.useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Events', path: '/events' },
    { name: 'Notice Board', path: '/notices' },
    { name: 'Panel', path: '/panel' },
  ];

  const logoUrl = content?.site?.logoUrl;
  const clubName = content?.site?.clubName || 'Josephite Math';

  const isAdminPage = pathname?.startsWith('/admin');

  return (
    <motion.nav 
      initial={shouldReduceGfx ? { y: 0, opacity: 1 } : { y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: shouldReduceGfx ? 0.1 : 0.8, ease: [0.22, 1, 0.36, 1] }}
      className={`${isAdminPage ? 'relative bg-[#080808] border-b border-white/5' : 'fixed top-0 left-0 w-full z-50'} transition-all duration-500 ${
        !isAdminPage && scrolled 
          ? 'glass-nav py-3 border-b border-white/10 shadow-2xl' 
          : !isAdminPage ? 'bg-transparent py-6 border-b border-transparent' : 'py-4'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between transition-all duration-500 ${scrolled ? 'h-16' : 'h-24'}`}>
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-4 group">
              <div className={`h-12 w-12 relative ${!shouldReduceGfx && 'group-hover:scale-110 transition-transform duration-500'}`}>
                <Image 
                  src={resolveImageUrl(logoUrl) || "/images/logo.png"} 
                  alt="JMC Logo" 
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className={`text-lg font-display font-bold tracking-tight text-white ${!shouldReduceGfx && 'group-hover:text-[var(--c-6-start)] transition-colors duration-500'}`}>{clubName}</span>
                <span className="text-[8px] uppercase tracking-[0.4em] text-zinc-500 font-bold">{content?.site?.established || 'EST. 2015'}</span>
              </div>
            </Link>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-xs uppercase tracking-widest font-bold transition-all duration-500 hover:text-[var(--c-6-start)] ${
                  pathname === link.path ? 'text-[var(--c-6-start)]' : 'text-zinc-500'
                }`}
              >
                {link.name}
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
          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: -20 }}
            transition={{ duration: shouldReduceGfx ? 0.1 : 0.3 }}
            className="md:hidden bg-black/90 backdrop-blur-xl border-b border-white/10"
          >
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  onClick={() => setIsOpen(false)}
                  className={`block px-3 py-3 rounded-xl text-base font-medium transition-all ${
                    pathname === link.path ? 'text-[var(--c-6-start)] bg-white/5' : 'text-zinc-300 hover:text-[var(--c-6-start)] hover:bg-white/5'
                  }`}
                >
                  {link.name}
                </Link>
              ))}
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 rounded-xl text-base font-medium text-emerald-400 hover:bg-white/5"
                >
                  Admin Dashboard
                </Link>
              )}
              {user ? (
                <>
                  <Link
                    href="/profile"
                    onClick={() => setIsOpen(false)}
                    className="block px-3 py-3 rounded-xl text-base font-medium text-zinc-300 hover:bg-white/5 hover:text-[var(--c-6-start)]"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setIsOpen(false);
                    }}
                    className="block w-full text-left px-3 py-3 rounded-xl text-base font-medium text-red-400 hover:bg-white/5"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="block px-3 py-3 rounded-xl text-base font-medium text-[var(--c-6-start)] hover:bg-white/5"
                >
                  Login
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
