"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, MapPin, Clock, ArrowRight, Filter, Search, Trophy, Users, BookOpen, Sparkles, Zap, Shield, HelpCircle, ExternalLink, Globe, Loader2 } from 'lucide-react';
import { useContent } from '../context/ContentContext';
import ScrollReveal from '../components/ScrollReveal';
import Image from 'next/image';
import { Skeleton } from '../components/Skeleton';
import { ExpandableEventCards } from '../components/ExpandableEventCards';
import { resolveImageUrl } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import dynamic from 'next/dynamic';
import { QrCode, Printer, AlertCircle, Sparkle, Tag, FileText } from 'lucide-react';

const QRCode = dynamic(() => import('../components/QRCode'), { ssr: false });

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

  // Route control State
  const [isIntraView, setIsIntraView] = useState(false);

  const { user, isAdmin, isSuperAdmin } = useAuth();
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [userMemberId, setUserMemberId] = useState<string | null>(null);
  const [isMemberVerified, setIsMemberVerified] = useState(false);
  const [loadingReg, setLoadingReg] = useState(false);

  const isGeneralMember = React.useMemo(() => {
    return !!(isMemberVerified && userMemberId && (userMemberId.startsWith('JMC-') || /^\d{3}$/.test(userMemberId)));
  }, [isMemberVerified, userMemberId]);

  const [searchVal, setSearchVal] = useState('');
  const [searchedTicket, setSearchedTicket] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setIsIntraView(params.get('view') === 'intra');
    }
  }, []);

  useEffect(() => {
    const loadUserRegistrations = async () => {
      if (!user) {
        setRegistrations([]);
        setUserMemberId(null);
        setIsMemberVerified(false);
        return;
      }
      setLoadingReg(true);
      try {
        // Query their member record to fetch member_id and verified status
        const { data: mData } = await supabase
          .from('member')
          .select('member_id, verified')
          .eq('id', user.id)
          .maybeSingle();

        const { data: ecData } = await supabase
          .from('ec_member')
          .select('member_id, verified')
          .eq('id', user.id)
          .maybeSingle();

        const resolvedId = ecData?.member_id || mData?.member_id || null;
        setUserMemberId(resolvedId);
        
        const verifiedVal = (mData?.verified === 'yes') || (ecData?.verified === 'yes');
        setIsMemberVerified(verifiedVal);

        const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
        let matched: any[] = [];
        for (const tb of tables) {
          const { data } = await supabase
            .from(tb)
            .select('*')
            .eq('user_id', user.id);
          if (data && data.length > 0) {
            matched = [...matched, ...data.map((d: any) => ({ ...d, tableName: tb }))];
          }
        }
        setRegistrations(matched);
      } catch (err) {
        console.error("Error loading event passes:", err);
      } finally {
        setLoadingReg(false);
      }
    };

    loadUserRegistrations();
  }, [user]);

  const handleFetchTicket = async () => {
    if (!searchVal.trim()) return;
    setSearching(true);
    setSearchError('');
    setSearchedTicket(null);
    try {
      const criteria = searchVal.trim();
      const isPhone = /^\d+$/.test(criteria) && criteria.length >= 10;
      const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
      let foundRec: any = null;
      let foundTable = '';

      for (const tb of tables) {
        let query = supabase.from(tb).select('*');
        if (isPhone) {
          query = query.eq('bkash_number', criteria);
        } else {
          query = query.eq('trxnid', criteria);
        }

        const { data } = await query;
        if (data && data.length > 0) {
          foundRec = data[0];
          foundTable = tb;
          break;
        }
      }

      if (!foundRec) {
        setSearchError('No verified event registration found with this bKash number or TrxID. Ensure your payment has been verified by administrators.');
      } else {
        // Also fetch their member id from both member and ec_member to verify if they are a General Member
        const { data: mData } = await supabase
          .from('member')
          .select('member_id')
          .eq('id', foundRec.user_id)
          .maybeSingle();

        const { data: ecData } = await supabase
          .from('ec_member')
          .select('member_id')
          .eq('id', foundRec.user_id)
          .maybeSingle();

        const finalMemberId = ecData?.member_id || mData?.member_id || null;
        const isGeneral = !!(finalMemberId && (finalMemberId.startsWith('JMC-') || /^\d{3}$/.test(finalMemberId)));

        if (isGeneral) {
          setSearchError('Searching is only available for non-general members. General member tickets cannot be retrieved here.');
        } else {
          setSearchedTicket({
            ...foundRec,
            tableName: foundTable,
            memberId: finalMemberId
          });
        }
      }
    } catch (err) {
      console.error("Failed to query ticket search:", err);
      setSearchError('An error occurred during search. Please contact support.');
    } finally {
      setSearching(false);
    }
  };

  const handleOpenIntraTab = () => {
    window.open('/events?view=intra', '_blank');
  };

  const handleOpenRegistrationForm = () => {
    window.open('/events/register', '_blank');
  };

  const handlePrintTicket = (reg: any, customId: string | null) => {
    const isGeneral = !!(customId && (customId.startsWith('JMC-') || /^\d{3}$/.test(customId)));
    const displayId = isGeneral ? customId : `EVT-${reg.id?.split('-')[0]?.toUpperCase() || reg.trxnid || 'PENDING'}`;
    const qrData = `PassId:${displayId}\nName:${reg.full_name}\nClass:${reg.class}\nRoll:${reg.roll}\nSegments:${reg.selected_events}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrData)}`;
    
    // Create iframe for seamless printing
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0px';
    iframe.style.height = '0px';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    
    const iframeDoc = iframe.contentWindow?.document;
    if (!iframeDoc) return;
    
    iframeDoc.open();
    iframeDoc.write(`
      <html>
        <head>
          <title>Josephite Mathematics Championship - Event Ticket</title>
          <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700;800&family=Space+Grotesk:wght@500;700;900&display=swap');
            body {
              font-family: 'Space Grotesk', sans-serif;
              background-color: white;
              color: #111827;
              padding: 40px;
            }
            .font-mono {
              font-family: 'JetBrains Mono', monospace;
            }
            .ticket-container {
              border: 4px dashed #374151;
              border-radius: 20px;
              padding: 30px;
              max-width: 650px;
              margin: 0 auto;
              position: relative;
              background: #fafafa;
            }
          </style>
        </head>
        <body onload="window.print(); setTimeout(() => { window.close(); }, 500);">
          <div class="ticket-container shadow-sm">
            <div class="text-center pb-6 border-b-2 border-dashed border-gray-300">
              <div class="inline-block px-3 py-1 bg-gray-150 border border-gray-200 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-600 mb-3">
                ${isGeneral ? 'General Member Pass' : 'Non-General Event Pass'}
              </div>
              <h2 class="text-2xl font-extrabold uppercase tracking-tight text-gray-900">Josephite Mathematics Championship</h2>
              <p class="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-widest mt-1">Official Entry Pass & Segment Admission</p>
            </div>
            
            <div class="grid grid-cols-3 gap-6 pt-6 items-center">
              <div class="col-span-2 space-y-4">
                <div>
                  <span class="block text-[10px] uppercase tracking-widest text-gray-400 font-extrabold">Participant Name</span>
                  <span class="text-lg font-black text-gray-900 uppercase tracking-wide block mt-0.5">${reg.full_name}</span>
                </div>
                
                <div class="grid grid-cols-3 gap-4">
                  <div>
                    <span class="block text-[9px] uppercase tracking-widest text-gray-400 font-extrabold">Class / Sec</span>
                    <span class="text-sm font-bold text-gray-800 uppercase block mt-0.5">${reg.class} (${reg.section})</span>
                  </div>
                  <div>
                    <span class="block text-[9px] uppercase tracking-widest text-gray-400 font-extrabold">Roll</span>
                    <span class="text-sm font-bold text-gray-800 block mt-0.5">${reg.roll}</span>
                  </div>
                  <div>
                    <span class="block text-[9px] uppercase tracking-widest text-gray-400 font-extrabold">Ticket ID</span>
                    <span class="text-sm font-mono font-bold text-indigo-600 block mt-0.5">${displayId}</span>
                  </div>
                </div>
 
                <div>
                  <span class="block text-[9px] uppercase tracking-widest text-gray-400 font-extrabold mb-1">Registered Segments</span>
                  <div class="flex flex-wrap gap-1.5 mt-1">
                    ${(reg.selected_events || '').split(',').map((ev: string) => `
                      <span class="px-2 py-1 bg-gray-100 border border-gray-200 text-gray-800 text-[9px] font-extrabold uppercase tracking-wider rounded">
                        ✓ ${ev.trim()}
                      </span>
                    `).join('')}
                  </div>
                </div>
              </div>
 
              <div class="col-span-1 text-center flex flex-col items-center justify-center border-l border-dashed border-gray-300 pl-4">
                <div class="border border-gray-300 p-2 bg-white rounded-lg">
                  <img src="${qrUrl}" width="125" height="125" alt="Admission QR Code" />
                </div>
                <span class="block text-[8px] uppercase tracking-widest text-gray-400 font-extrabold mt-2">Unique Ticket QR</span>
                <span class="text-[10px] font-mono font-extrabold text-indigo-600 tracking-wider mt-0.5">${displayId}</span>
              </div>
            </div>
            
            <div class="mt-6 pt-4 border-t-2 border-dashed border-gray-300 text-center">
              <p class="text-[9px] font-mono text-gray-500 uppercase tracking-widest font-bold font-mono">St Joseph Higher Secondary School - Spot Event Ticket</p>
              <p class="text-[8px] text-gray-400 mt-0.5 font-semibold">Please carry this printed stub or active passport to secure immediate entry at the check-in queue.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    iframeDoc.close();
    
    setTimeout(() => {
      document.body.removeChild(iframe);
    }, 4500);
  };
 
  const renderTicketCard = (reg: any, customId: string | null) => {
    const isGeneral = !!(customId && (customId.startsWith('JMC-') || /^\d{3}$/.test(customId)));
    const displayId = isGeneral ? customId : ('EVT-' + (reg.id?.split('-')[0]?.toUpperCase() || reg.trxnid || 'PENDING'));
    
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a0e17] to-[#0e1726] border border-white/10 shadow-2xl p-8 mb-8 group">
        {/* Perforated ticket punch cutouts */}
        <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#020202] z-10 border-r border-white/10" />
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-[#020202] z-10 border-l border-white/10" />
        
        {/* Ticket Content Container for Printing */}
        <div id={`print-ticket-${reg.id}`} className="grid grid-cols-1 md:grid-cols-4 gap-8 md:divide-x md:divide-dashed md:divide-zinc-700/60 items-center">
          
          {/* LEFT 3 COLS: Info Section */}
          <div className="md:col-span-3 space-y-6 md:pr-8 text-left">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xl font-display font-black text-white tracking-tight uppercase flex items-center gap-2">
                  <Sparkle className="w-5 h-5 text-amber-500 animate-pulse" />
                  Josephite Mathematics Championship
                </h4>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Official Entry Pass & Segment Admission</p>
              </div>
              <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                isGeneral 
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {isGeneral ? 'General Member' : 'Non-General Event Member'}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/5">
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Participant Name</span>
                <span className="text-zinc-200 text-xs font-black uppercase tracking-wider block mt-1">{reg.full_name}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Class / Sec</span>
                <span className="text-zinc-200 text-xs font-black uppercase tracking-wider block mt-1">{reg.class} ({reg.section})</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Roll</span>
                <span className="text-zinc-200 text-xs font-black uppercase tracking-wider block mt-1">{reg.roll}</span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Transaction ID</span>
                <span className="text-zinc-200 text-[11px] font-mono font-bold uppercase tracking-wider block mt-1 text-indigo-400">{reg.trxnid}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Registered Segments Included</span>
              <div className="flex flex-wrap gap-2">
                {reg.selected_events?.split(',').map((ev: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-white/5 border border-white/5 text-zinc-300 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5">
                    <Tag className="w-3 h-3 text-amber-500" />
                    {ev.trim()}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT 1 COL: QR & Validation Section */}
          <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4 md:pl-8 text-center pt-6 md:pt-0">
            <div className="bg-white p-3.5 rounded-2xl inline-block shadow-lg border border-white/20 transition-transform group-hover:scale-105 duration-300">
              <QRCode 
                value={`PassId:${displayId}\nName:${reg.full_name}\nClass:${reg.class}\nRoll:${reg.roll}\nSegments:${reg.selected_events}`} 
                size={110} 
              />
            </div>
            
            <div className="space-y-1">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block">Unique Entry ID</span>
              <span className="text-sm font-mono text-white font-black tracking-widest block">{displayId}</span>
            </div>
          </div>
          
        </div>

        {/* PRINT TRIGGER BUTTONS */}
        <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between no-print relative z-25">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-emerald-500" />
            Verified & Active Entrance Pass
          </span>
          <button
            onClick={() => handlePrintTicket(reg, customId)}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest border border-white/10 transition-all flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-amber-500" />
            Print Pass
          </button>
        </div>
      </div>
    );
  };

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
    <div className="relative min-h-screen bg-[#020202] overflow-hidden">
      {/* Background Glows */}
      {!shouldReduceGfx && (
        <>
          <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -right-24 opacity-50" />
          <div className="atmospheric-glow w-[600px] h-[600px] bg-[var(--c-2-start)]/5 bottom-0 -left-24 opacity-50" />
        </>
      )}

      <div className="pt-40 pb-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header Section */}
          <ScrollReveal>
            <div className="max-w-5xl mb-16">
              <div className="flex items-center gap-4 mb-8">
                <Sparkles className="w-5 h-5 text-[var(--c-6-start)]" />
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-[var(--c-6-start)]/80">
                  {isIntraView ? 'INTRA EVENTS LIST' : (eventsContent.subtitle || 'UPCOMING EVENTS')}
                </span>
              </div>
              <h1 className="text-6xl md:text-[8rem] font-display font-bold leading-[0.85] tracking-tighter mb-8 uppercase">
                {isIntraView ? (
                  <>
                    <span className="block">INTRA</span>
                    <span className="blue-text">FESTIVAL</span>
                  </>
                ) : (
                  eventsContent.title?.split(' ').map((word: string, i: number) => (
                    <span key={i} className={i === 1 ? 'blue-text' : 'block'}>{word} </span>
                  )) || (
                    <>
                      <span className="block">BEYOND</span>
                      <span className="blue-text">NUMBERS</span>
                    </>
                  )
                )}
              </h1>
              <p className="text-lg md:text-2xl text-zinc-400 font-light leading-relaxed max-w-3xl">
                {isIntraView 
                  ? 'Welcome to the Intra-school Mathematics Competitions Hub. Browse the categories below and open the Registration form to confirm your participation.'
                  : (eventsContent.description || 'Join us for a series of challenging competitions, insightful workshops, and engaging seminars designed to push your mathematical boundaries.')}
              </p>
            </div>
          </ScrollReveal>

          <AnimatePresence mode="wait">
            {!isIntraView ? (
              <>
              {/* DUAL CARDS VIEW: INTRA & INTER SELECTION SCENE */}
              <motion.div 
                key="subpage-selectors"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12"
              >
                {/* CARD 1: INTRA EVENTS */}
                <motion.div 
                  onClick={handleOpenIntraTab}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/10 p-10 flex flex-col justify-between h-[540px] select-none hover:border-amber-500/50 shadow-2xl shadow-indigo-500/5 hover:shadow-amber-500/10 hover:bg-neutral-900/10"
                >
                  {/* Subtle Glow inside Card */}
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-amber-500/5 rounded-full blur-[80px]" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 rounded-2xl bg-amber-500/10 text-amber-500">
                        <Zap className="w-8 h-8" />
                      </div>
                      <span className="px-4 py-2 rounded-full border border-amber-500/20 text-[9px] text-amber-500 font-black uppercase tracking-widest bg-amber-500/5">
                        Active Hub
                      </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-black text-white uppercase tracking-tight mb-4 group-hover:text-amber-500 transition-colors">
                      Intra Events
                    </h2>
                    
                    <p className="text-sm text-zinc-400 font-medium leading-relaxed max-w-sm">
                      Exclusive internal olympiads and mental arithmetic challenges designed solely for general members and students of St Joseph Higher Secondary School.
                    </p>

                    <ul className="mt-8 space-y-3 text-xs text-zinc-500 font-bold uppercase tracking-wider ">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Math Olympiads & IQ Tests</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Rubik's Cube & Sudoku Grids</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Generous Member Discounts Available</li>
                    </ul>
                  </div>

                  <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 group-hover:text-white transition-colors flex items-center gap-2">
                      Explore Competitions <ExternalLink className="w-4 h-4 text-amber-500" />
                    </span>
                    <button className="p-4 rounded-full bg-amber-500 text-black hover:bg-amber-400 transition-all flex items-center justify-center">
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                    </button>
                  </div>
                </motion.div>

                {/* CARD 2: INTER EVENTS */}
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="group relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white/[0.01] to-transparent border border-white/5 p-10 flex flex-col justify-between h-[540px] select-none hover:border-indigo-500/20 shadow-2xl"
                >
                  {/* Subtle Glow inside Card */}
                  <div className="absolute top-0 right-0 w-[200px] h-[200px] bg-indigo-500/5 rounded-full blur-[80px]" />
                  
                  <div>
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-4 rounded-2xl bg-indigo-500/10 text-indigo-400">
                        <Globe className="w-8 h-8" />
                      </div>
                      <span className="px-4 py-2 rounded-full border border-indigo-500/10 text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
                        Coming Soon
                      </span>
                    </div>

                    <h2 className="text-4xl md:text-5xl font-display font-black text-white/50 uppercase tracking-tight mb-4 group-hover:text-white transition-colors">
                      Inter Events
                    </h2>
                    
                    <p className="text-sm text-zinc-600 font-medium leading-relaxed max-w-sm">
                      National scale math festivals, training camps, and inter-school/college mega math carnivals uniting logic masters across Bangladesh.
                    </p>

                    <ul className="mt-8 space-y-3 text-xs text-zinc-700 font-bold uppercase tracking-wider">
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-800" /> Nationwide St Joseph Carnivals</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-800" /> Elite Inter-College Face-offs</li>
                      <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-zinc-800" /> Renowned Guest Lectures & Exhibitions</li>
                    </ul>
                  </div>

                  <div className="mt-12 flex items-center justify-between border-t border-white/5 pt-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">
                      National Portal In Development
                    </span>
                    <button className="p-4 rounded-full bg-white/5 text-zinc-700 flex items-center justify-center cursor-not-allowed border border-white/5">
                      <Clock className="w-5 h-5" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>
              </>
            ) : (
              /* THE INTRA-EVENTS SECTION LISTING */
              <motion.div 
                key="intra-festival-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-12"
              >
                {/* NEW REGISTRATION FORM BANNER */}
                <motion.div 
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 md:p-10 rounded-[2.5rem] bg-gradient-to-r from-[#171302]/70 via-[#3a2007]/40 to-[#020202]/90 border border-amber-500/20 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 mb-16 mb-24"
                >
                  <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-amber-500/5 rounded-full blur-[50px] pointer-events-none" />
                  
                  <div className="space-y-2 text-center md:text-left">
                    <span className="px-3 py-1 rounded bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                      Active Portal
                    </span>
                    <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight pt-2">
                      Event and Segment Registration Form
                    </h2>
                    <p className="text-xs text-zinc-400 font-medium max-w-xl leading-relaxed">
                      Choose your segments and complete bKash checkout to finalize registration! General members qualify for custom rates.
                    </p>
                  </div>

                  <button
                    onClick={handleOpenRegistrationForm}
                    className="w-full md:w-auto py-5 px-10 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 group flex-shrink-0"
                  >
                    Open Registration <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </motion.div>

                {/* Filters & Search */}
                <div className="mb-24 flex flex-col lg:flex-row items-center justify-between gap-12">
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Events;
