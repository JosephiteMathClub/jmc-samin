"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useContent } from "@/context/ContentContext";
import ContactModal from "@/components/ContactModal";

import { usePerformance } from "@/hooks/usePerformance";

import { resolveImageUrl } from "@/lib/utils";

const Footer = () => {
  const { content } = useContent();
  const [isContactOpen, setIsContactOpen] = useState(false);
  const { shouldReduceGfx } = usePerformance();
  const clubName = content?.site?.clubName || 'Josephite Math Club';
  const logoUrl = resolveImageUrl(content?.site?.logoUrl) || "/images/logo.png";

  return (
    <footer className="bg-[#050505] text-zinc-400 py-20 border-t border-white/5 relative z-10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 mb-16">
          {/* Brand Section */}
          <div className="md:col-span-5 space-y-8">
            <div className="flex items-center space-x-4 px-6 py-4 hud-bracket hud-bracket-tl hud-bracket-br bg-white/[0.02]">
              <div className="h-10 w-24 relative">
                <Image 
                  src={logoUrl} 
                  alt="JMC Logo" 
                  fill
                  className="object-contain filter grayscale invert opacity-80"
                />
              </div>
              <div className="font-display font-bold leading-tight text-white">
                <div className="text-xl tracking-tighter uppercase">{clubName}</div>
                <div className="mono-label text-[7px] text-zinc-600 mt-1">VER_PROTO.2.4.9 // AUTH_REQUIRED</div>
              </div>
            </div>
            <p className="text-sm max-w-xs leading-relaxed opacity-60">
              Nurturing logical thinking and mathematical curiosity at St. Joseph Higher Secondary School. Connecting the dots between theory and reality.
            </p>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="mono-label text-white">Navigation</h4>
            <ul className="space-y-4">
              <li><Link href="/" className="text-xs hover:text-[var(--c-6-start)] transition-colors mono-label opacity-70 hover:opacity-100">Home</Link></li>
              <li><Link href="/about" className="text-xs hover:text-[var(--c-6-start)] transition-colors mono-label opacity-70 hover:opacity-100">About</Link></li>
              <li><Link href="/panel" className="text-xs hover:text-[var(--c-6-start)] transition-colors mono-label opacity-70 hover:opacity-100">Panel</Link></li>
            </ul>
          </div>

          {/* More Links */}
          <div className="md:col-span-2 space-y-6">
            <h4 className="mono-label text-white">Explore</h4>
            <ul className="space-y-4">
              <li><Link href="/#memories" className="text-xs hover:text-[var(--c-6-start)] transition-colors mono-label opacity-70 hover:opacity-100">Gallery</Link></li>
              <li>
                <button 
                  onClick={() => setIsContactOpen(true)}
                  className="text-xs hover:text-[var(--c-6-start)] transition-colors mono-label opacity-70 hover:opacity-100 text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div className="md:col-span-3 space-y-6">
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.01] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-20">
                <div className="w-1 h-1 bg-[var(--c-6-start)]" />
              </div>
              <h4 className="mono-label text-white mb-4">Transmission</h4>
              <p className="text-[10px] text-zinc-500 mb-6 leading-relaxed">Join our secure data stream for mathematical challenges and updates.</p>
              <div className="flex flex-col space-y-3">
                <input 
                  type="email" 
                  placeholder="ID@DOMAIN.XYZ" 
                  className="bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-[10px] font-mono focus:outline-none focus:ring-1 focus:ring-[var(--c-6-start)] transition-all placeholder:text-zinc-700 uppercase"
                />
                <button className="btn-metallic-blue !py-3 !rounded-lg !text-[8px] !px-0">
                  Initialize Sync
                </button>
              </div>
            </div>
            
            {/* Social Links */}
            <div className="flex items-center gap-4 pt-4 px-2">
              {content?.contact?.socials?.facebook && (
                <Link href={content.contact.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[var(--c-6-start)] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </Link>
              )}
              <div className="h-4 w-px bg-white/10 mx-1" />
              {content?.contact?.socials?.instagram && (
                <Link href={content.contact.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-[var(--c-6-start)] transition-colors">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="pt-12 border-t border-white/5 flex flex-col items-center gap-6 relative">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--c-6-start)] to-transparent opacity-50" />
          <div className="grid grid-cols-3 gap-12 text-[7px] mono-label text-zinc-700 opacity-50">
            <div className="flex flex-col items-center">
              <span>REGION_LOCK: OFF</span>
              <span>ENC: AES-256</span>
            </div>
            <div className="flex flex-col items-center text-[9px] text-zinc-500 font-bold tracking-[0.4em]">
              (C) JMC 2025 // PROTOCOL_V3
            </div>
            <div className="flex flex-col items-center">
              <span>LAT_SYNC: 99.8%</span>
              <span>UPTIME: 14:24:59:02</span>
            </div>
          </div>
        </div>
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  );
};

export default Footer;
