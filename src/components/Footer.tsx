"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useContent } from "@/context/ContentContext";
import ContactModal from "@/components/ContactModal";
import { motion } from "framer-motion";
import { ChevronUp, Radio, Mail, ShieldCheck } from "lucide-react";
import { FacebookIcon, InstagramIcon, GithubIcon } from "@/components/SocialIcons";
import { usePerformance } from "@/hooks/usePerformance";
import { resolveImageUrl } from "@/lib/utils";

const Footer = () => {
  const { content } = useContent();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { shouldReduceGfx } = usePerformance();
  const clubName = content?.site?.clubName || 'Josephite Math Club';
  const logoUrl = resolveImageUrl(content?.site?.logoUrl) || "/images/logo.png";

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#050505] text-zinc-500 py-32 border-t border-white/5 relative z-10 overflow-hidden">
      {/* Background HUD Decor */}
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] bg-[var(--c-6-start)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 lg:gap-24 mb-24">
          
          {/* Brand/Core Section */}
          <div className="md:col-span-4 space-y-10">
            <Link href="/" className="flex items-center gap-5 group">
              <div className="relative w-14 h-14 transition-all duration-700 group-hover:scale-110">
                <div className="absolute inset-0 bg-[var(--c-6-start)]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                <Image 
                  src={logoUrl} 
                  alt="JMC Logo" 
                  fill
                  className="object-contain relative z-10"
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-display font-black tracking-tighter text-white uppercase">{clubName}</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[var(--c-6-start)] animate-pulse" />
                  <span className="text-[9px] font-mono font-black text-zinc-500 tracking-[0.4em]">SYS_ACTIVE_PRO</span>
                </div>
              </div>
            </Link>
            
            <p className="text-sm font-medium leading-relaxed max-w-sm">
              Cultivating the next generation of logical thinkers and mathematical visionaries. Breaking boundaries through the language of the universe.
            </p>

            <div className="pt-4 flex items-center gap-6">
               {[
                 { icon: FacebookIcon, href: content?.contact?.socials?.facebook },
                 { icon: InstagramIcon, href: content?.contact?.socials?.instagram },
                 { icon: GithubIcon, href: "#" },
               ].map((social, i) => social.href && (
                 <Link key={i} href={social.href} target="_blank" className="p-3 rounded-full glass border-white/5 text-zinc-500 hover:text-white transition-all hover:scale-110">
                    <social.icon className="w-4 h-4" />
                 </Link>
               ))}
            </div>
          </div>

          {/* Navigation Matrix */}
          <div className="md:col-span-2 space-y-8">
            <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center gap-2">
               <div className="w-1 h-[10px] bg-[var(--c-6-start)]" />
               Index
            </h4>
            <ul className="space-y-4">
              {['Home', 'About', 'Panel', 'Events'].map((link) => (
                <li key={link}>
                  <Link 
                    href={`/${link === 'Home' ? '' : link.toLowerCase()}`} 
                    className="text-xs font-mono font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[var(--c-6-start)] transition-all flex items-center gap-3 group"
                  >
                    <span className="w-0 h-[1px] bg-[var(--c-6-start)] transition-all group-hover:w-4" />
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2 space-y-8">
            <h4 className="text-[10px] font-mono font-black text-white uppercase tracking-[0.4em] mb-10 flex items-center gap-2">
               <div className="w-1 h-[10px] bg-[var(--c-6-start)]" />
               Operations
            </h4>
            <ul className="space-y-4">
              {['Notices', 'Articles', 'Gallery'].map((link) => (
                <li key={link}>
                  <Link 
                    href={`/${link.toLowerCase()}`} 
                    className="text-xs font-mono font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[var(--c-6-start)] transition-all flex items-center gap-3 group"
                  >
                    <span className="w-0 h-[1px] bg-[var(--c-6-start)] transition-all group-hover:w-4" />
                    {link}
                  </Link>
                </li>
              ))}
              <li>
                <button onClick={() => setIsContactOpen(true)} className="text-xs font-mono font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[var(--c-6-start)] transition-all flex items-center gap-3 group">
                  <span className="w-0 h-[1px] bg-[var(--c-6-start)] transition-all group-hover:w-4" />
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Integration Sector */}
          <div className="md:col-span-4 space-y-10">
            <div className="p-10 rounded-[2.5rem] glass border-white/5 relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-5 opacity-20">
                  <Radio className="w-6 h-6 text-[var(--c-6-start)] animate-pulse" />
               </div>
               
               <h4 className="text-sm font-display font-black text-white uppercase tracking-widest mb-4">Transmission_Secure</h4>
               <p className="text-[10px] font-mono font-bold text-zinc-500 mb-8 leading-relaxed tracking-wider uppercase">Join the neural network for exclusive mathematical insights.</p>
               
               <div className="flex flex-col gap-4">
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700" />
                    <input 
                      type="email" 
                      placeholder="ENTER_IDENTITY_KEY" 
                      className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-[10px] font-mono font-black text-white focus:outline-none focus:border-[var(--c-6-start)]/50 transition-all placeholder:text-zinc-800"
                    />
                  </div>
                  <button className="w-full py-4 bg-white text-black text-[10px] font-mono font-black uppercase tracking-[0.4em] rounded-2xl hover:bg-[var(--c-6-start)] hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.05)]">
                    Sync_Access
                  </button>
               </div>
            </div>
          </div>
        </div>

        {/* Technical Footer Metadata */}
        <div className="pt-16 border-t border-white/5 relative flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-10 opacity-30">
              <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Protocol</span>
                 <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">S_01_GLOBAL</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col gap-1">
                 <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest">Encoding</span>
                 <span className="text-[10px] font-mono font-black text-white uppercase tracking-widest">AES_256_PRO</span>
              </div>
           </div>

           <div className="text-center group cursor-default">
              <div className="text-[10px] font-mono font-black text-white uppercase tracking-[0.8em] mb-2 px-10 relative">
                 (C) {new Date().getFullYear()} JMC_MAINFRAME
                 <div className="absolute top-1/2 left-0 w-8 h-[1px] bg-white/10" />
                 <div className="absolute top-1/2 right-0 w-8 h-[1px] bg-white/10" />
              </div>
              <div className="flex items-center justify-center gap-3">
                 <ShieldCheck className="w-3 h-3 text-[var(--c-6-start)]" />
                 <span className="text-[8px] font-mono font-black text-zinc-600 uppercase tracking-[0.2em]">Verified Secure Transmission System v4.2.0</span>
              </div>
           </div>

           <motion.button 
            whileHover={{ y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="p-5 rounded-2xl glass border-white/10 text-white group relative"
           >
              <ChevronUp className="w-6 h-6 group-hover:text-[var(--c-6-start)] transition-colors" />
              <div className="absolute inset-x-0 bottom-1 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="w-1 h-1 rounded-full bg-[var(--c-6-start)] shadow-[0_0_10px_rgba(0,180,219,1)]" />
              </div>
           </motion.button>
        </div>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  );
};

export default Footer;
