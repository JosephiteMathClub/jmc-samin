"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useContent } from '@/context/ContentContext';
import { 
  FacebookIcon, 
  InstagramIcon 
} from './SocialIcons';
import { 
  Code2, 
  ChevronUp, 
  Bell,
  Calendar,
  ClipboardList
} from 'lucide-react';

import { usePerformance } from '@/hooks/usePerformance';

const FloatingSidebar = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [hasNewNotice, setHasNewNotice] = useState(false);
  const { content } = useContent();
  const pathname = usePathname();
  const { shouldReduceGfx } = usePerformance();

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setShowScrollTop(window.scrollY > 400);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Logic for new notice red dot
  useEffect(() => {
    const noticesArray = content?.notices?.notices || [];
    if (noticesArray.length > 0) {
      const lastViewedId = localStorage.getItem('lastViewedNoticeId');
      
      // Sort notices by date descending to find the latest
      const sortedNotices = [...noticesArray].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestNotice = sortedNotices[0];

      if (!lastViewedId || lastViewedId !== latestNotice.id) {
        setHasNewNotice(true);
      } else {
        setHasNewNotice(false);
      }
    } else {
      setHasNewNotice(false);
    }

    // Clear notification if we are on the notices page
    if (pathname === '/notices' && noticesArray.length > 0) {
      const sortedNotices = [...noticesArray].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      const latestNotice = sortedNotices[0];
      localStorage.setItem('lastViewedNoticeId', latestNotice.id);
      setHasNewNotice(false);
    }
  }, [content?.notices, pathname]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const sidebarLinks = [
    { 
      name: 'Notices',
      icon: ClipboardList, 
      href: "/notices", 
      color: "hover:text-amber-500", 
      external: false 
    },
    { 
      name: 'Events',
      icon: Calendar, 
      href: "/events", 
      color: "hover:text-amber-500", 
      external: false 
    },
    { 
      name: 'Facebook',
      icon: FacebookIcon, 
      href: content?.contact?.socials?.facebook || "https://www.facebook.com/2015JMC/", 
      color: "hover:text-blue-600", 
      external: true 
    },
    { 
      name: 'Instagram',
      icon: InstagramIcon, 
      href: content?.contact?.socials?.instagram || "https://www.instagram.com/jmc_.official/", 
      color: "hover:text-pink-600", 
      external: true 
    },
    { 
      name: 'Developers',
      icon: Code2, 
      href: "/developers", 
      color: "hover:text-amber-600", 
      external: false, 
      newTab: true 
    },
  ];

  return (
    <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[60] hidden sm:flex flex-col gap-4 items-center">
      {/* Notification Icon (Floating separately or integrated) */}
      <Link href="/notices">
        <motion.div 
          whileHover={shouldReduceGfx ? {} : { scale: 1.1 }}
          whileTap={shouldReduceGfx ? {} : { scale: 0.9 }}
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] cursor-pointer relative group transition-all duration-300"
        >
          <Bell className="w-7 h-7 text-black group-hover:text-amber-500 transition-colors fill-black group-hover:fill-amber-500" />
          {hasNewNotice && (
            <span className={`absolute top-3 right-3 w-4 h-4 bg-[#C52D2F] rounded-full border-2 border-white ${!shouldReduceGfx && 'group-hover:animate-pulse'}`} />
          )}
          
          {/* Tooltip */}
          <div className="absolute right-full mr-4 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
            NOTICES
          </div>
        </motion.div>
      </Link>

      {/* Main Sidebar */}
      <motion.div 
        initial={shouldReduceGfx ? { x: 0, opacity: 1 } : { x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-white rounded-full py-7 px-4 flex flex-col gap-6 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] items-center"
      >
        {sidebarLinks.map((link, index) => {
          const Icon = link.icon;
          const linkProps = link.newTab ? { target: "_blank", rel: "noopener noreferrer" } : {};
          
          const content = (
            <motion.div
              whileHover={shouldReduceGfx ? {} : { scale: 1.2 }}
              whileTap={shouldReduceGfx ? {} : { scale: 0.9 }}
              className={`text-black transition-all duration-300 cursor-pointer relative group ${link.color}`}
            >
              <Icon className="w-7 h-7" />
              
              {/* Tooltip */}
              <div className="absolute right-full mr-6 px-3 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {link.name}
              </div>
            </motion.div>
          );

          if (link.external) {
            return (
              <a key={index} href={link.href} {...linkProps}>
                {content}
              </a>
            );
          }

          return (
            <Link key={index} href={link.href} {...linkProps}>
              {content}
            </Link>
          );
        })}
      </motion.div>

      {/* Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={shouldReduceGfx ? { opacity: 1 } : { scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={shouldReduceGfx ? { opacity: 0 } : { scale: 0, opacity: 0 }}
            whileHover={shouldReduceGfx ? {} : { scale: 1.1 }}
            whileTap={shouldReduceGfx ? {} : { scale: 0.9 }}
            onClick={scrollToTop}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] hover:shadow-[0_25px_60px_-12px_rgba(0,0,0,0.6)] cursor-pointer group transition-all duration-300"
          >
            <ChevronUp className="w-7 h-7 text-black group-hover:text-amber-500 transition-colors stroke-[3px]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FloatingSidebar;
