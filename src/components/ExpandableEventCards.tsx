"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/utils";
import { DEFAULT_CONTENT } from "../data/default-content";
import { Clock, MapPin, ArrowRight, X } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

const getLocalFallbackForTitle = (title: string, index: number = 0) => {
  const t = (title || "").toLowerCase();
  if (t.includes("geometry") || t.includes("dash")) return "/images/event_banner/Geo-Dash.jpg";
  if (t.includes("sudoku")) return "/images/event_banner/Sudoku.jpg";
  if (t.includes("singularity")) return "/images/event_banner/Singularity-segment.jpg";
  if (t.includes("escape") || t.includes("room")) return "/images/event_banner/Escape-Room.jpg";
  if (t.includes("tic") || t.includes("toe")) return "/images/event_banner/tic-tac-toe.jpg";
  if (t.includes("probability") || t.includes("pressure") || t.includes("pr-pr") || t.includes("pr pr")) return "/images/event_banner/PR-PR.jpg";
  if (t.includes("calculator") || t.includes("calc")) return "/images/event_banner/Human_Calc-segment.jpg";
  if (t.includes("olympiad")) return "/images/event_banner/Geo-Dash.jpg";
  if (t.includes("iq") || t.includes("intelligence")) return "/images/event_banner/Sudoku.jpg";
  if (t.includes("calculus") || t.includes("bee")) return "/images/event_banner/Human_Calc-segment.jpg";
  if (t.includes("rubik") || t.includes("cube")) return "/images/event_banner/Sudoku.jpg";
  if (t.includes("crypto") || t.includes("mania")) return "/images/event_banner/Escape-Room.jpg";
  
  const fallbackList = [
    "/images/event_banner/Geo-Dash.jpg",
    "/images/event_banner/Sudoku.jpg",
    "/images/event_banner/Singularity-segment.jpg",
    "/images/event_banner/Escape-Room.jpg",
    "/images/event_banner/tic-tac-toe.jpg",
    "/images/event_banner/PR-PR.jpg",
    "/images/event_banner/Human_Calc-segment.jpg"
  ];
  return fallbackList[index % fallbackList.length];
};

const getEventImageUrl = (event: any, index: number = 0) => {
  if (event && event.imageUrl) return event.imageUrl;
  try {
    const defaultEvents = DEFAULT_CONTENT?.events?.events || [];
    const matched = defaultEvents.find((e: any) => e.id === event?.id);
    if (matched?.imageUrl) return matched.imageUrl;
  } catch (err) {
    console.error("Error in getEventImageUrl fallback:", err);
  }
  return getLocalFallbackForTitle(event?.title, index);
};

export function ExpandableEventCards({ events, shouldReduceGfx }: { events: any[], shouldReduceGfx: boolean }) {
  const [active, setActive] = useState<any | boolean | null>(
    null
  );
  const [activeImageError, setActiveImageError] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    setActiveImageError(false);
  }, [active]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActive(false);
      }
    }

    if (active && typeof active === "object") {
      document.body.style.overflow = "hidden";
      document.body.classList.add("overflow-hidden");
    } else {
      document.body.style.overflow = "auto";
      document.body.classList.remove("overflow-hidden");
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active]);

  useOutsideClick(ref, () => setActive(null));

  return (
    <>
      <AnimatePresence>
        {active && typeof active === "object" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-md h-full w-full z-[999]"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {active && typeof active === "object" ? (
          <div 
            className="fixed inset-0 flex justify-center items-start overflow-y-auto z-[1000] p-4 md:p-8 pt-10 pb-12"
            data-lenis-prevent
          >
            {/* Fixed Close Button placed in the viewport top right to never scroll out of sight */}
            <motion.button
              key={`button-${active.title}-${id}`}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.1 } }}
              className="fixed top-4 right-4 sm:top-6 sm:right-6 md:top-8 md:right-8 z-[1150] flex items-center justify-center bg-black/75 hover:bg-black/95 backdrop-blur-md rounded-full h-12 w-12 border border-white/20 text-white transition-all shadow-2xl hover:scale-110 active:scale-95 group cursor-pointer"
              onClick={() => setActive(null)}
              title="Close Event Details"
            >
              <X className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
            </motion.button>

            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[700px] my-8 md:my-16 h-fit flex flex-col bg-[#050505] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <motion.div layoutId={`image-${active.title}-${id}`} className="relative h-72 sm:h-96 w-full shrink-0">
                <Image
                  fill
                  src={(() => {
                    const resolvedImg = getEventImageUrl(active);
                    return (resolvedImg && !activeImageError) ? resolveImageUrl(resolvedImg) : getLocalFallbackForTitle(active.title, 0);
                  })()}
                  alt={active.title}
                  className="w-full h-full object-cover"
                  onError={() => setActiveImageError(true)}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
              </motion.div>

              <div className="flex flex-col flex-1">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 p-6 shrink-0 border-b border-white/5">
                  <div>
                    <motion.h3
                      layoutId={`title-${active.title}-${id}`}
                      className="font-bold text-2xl text-white font-display leading-tight"
                    >
                      {active.title}
                    </motion.h3>
                    
                    <div className="flex flex-wrap gap-4 mt-3">
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        <Clock className="w-4 h-4 text-[var(--c-6-start)]" />
                        {active.date?.split(' ')[0]} {active.date?.split(' ')[1]} {active.time && `• ${active.time}`}
                      </div>
                      <div className="flex items-center gap-2 text-xs font-mono text-zinc-400 uppercase tracking-widest">
                        <MapPin className="w-4 h-4 text-[var(--c-6-start)]" />
                        {active.location}
                      </div>
                    </div>
                  </div>

                  <motion.a
                    layoutId={`button-${active.title}-${id}`}
                    href={active.registrationLink || '#'}
                    target="_blank"
                    className="px-6 py-3 text-xs rounded-full font-bold bg-[var(--c-6-start)] text-white hover:bg-[var(--c-6-end)] transition-colors whitespace-nowrap uppercase tracking-widest"
                  >
                    {active.buttonText || 'Secure Seat'}
                  </motion.a>
                </div>
                {/* Scroll container logic changed so entire card flows naturally together */}
                <div className="p-6 md:p-10 relative bg-[#0a0a0a]">
                  <motion.div
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-zinc-300 text-sm md:text-base pb-10 flex flex-col font-light whitespace-pre-wrap prose prose-invert prose-p:text-zinc-300 prose-headings:text-white max-w-none prose-a:text-[var(--c-6-start)]"
                  >
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {active.description}
                    </Markdown>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        ) : null}
      </AnimatePresence>
      <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {events.map((event, index) => {
          const isPast = event.date?.toLowerCase().includes('2023') || event.date?.toLowerCase().includes('2024');
          const isLive = event.tag?.toLowerCase() === 'live' || event.category?.toLowerCase() === 'live';
          const eventId = event.id || `event-${index}`;
          const hasImageError = failedImages[eventId];

          return (
            <motion.div
              layoutId={`card-${event.title}-${id}`}
              key={`card-${event.title}-${id}`}
              onClick={() => setActive(event)}
              className="group relative h-[450px] flex flex-col bg-[#0a0a0a] rounded-[2rem] border border-white/5 overflow-hidden transition-all duration-700 hover:border-[var(--c-6-start)]/30 hover:-translate-y-2 cursor-pointer"
            >
              {!shouldReduceGfx && (
                <div className="absolute -inset-24 bg-[var(--c-6-start)]/5 blur-[100px] opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none" />
              )}
              
              <motion.div layoutId={`image-${event.title}-${id}`} className="relative h-56 shrink-0 w-full overflow-hidden">
                <Image
                  fill
                  src={(() => {
                    const resolvedImg = getEventImageUrl(event, index);
                    return (resolvedImg && !hasImageError) ? resolveImageUrl(resolvedImg) : getLocalFallbackForTitle(event.title, index);
                  })()}
                  alt={event.title}
                  className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-500"
                  onError={() => setFailedImages(prev => ({ ...prev, [eventId]: true }))}
                  referrerPolicy="no-referrer"
                />
                {/* Top Meta */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start z-20">
                  <div className="flex flex-col gap-2">
                    <span className="font-mono text-[9px] uppercase tracking-[0.3em] text-[var(--c-6-start)] bg-black/60 backdrop-blur-md px-3 py-1 rounded-sm border border-white/10">
                      {event.category || 'REGISTRY'}
                    </span>
                    {isLive && (
                      <div className="flex items-center gap-2 text-red-500 font-mono text-[8px] uppercase tracking-widest bg-red-500/20 backdrop-blur-md px-3 py-1 rounded-sm border border-red-500/30">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Live_Stream
                      </div>
                    )}
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent z-10" />
              </motion.div>
              
              <div className="flex-grow p-8 pt-4 flex flex-col z-20 relative">
                <div className="mb-6 flex gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-[var(--c-6-start)]" />
                    {event.date?.split(' ')[0]} {event.date?.split(' ')[1]}
                  </div>
                </div>

                <motion.h3
                  layoutId={`title-${event.title}-${id}`}
                  className="text-2xl font-display font-bold mb-4 text-white group-hover:text-[var(--c-6-start)] transition-colors duration-500 leading-tight"
                >
                  {event.title}
                </motion.h3>
                
                <p className="text-zinc-400 text-sm leading-relaxed mb-6 line-clamp-2 md:line-clamp-3 font-light">
                  {event.description}
                </p>

                <div className="mt-auto pt-6 border-t border-white/5">
                  <motion.button
                    layoutId={`button-${event.title}-${id}`}
                    className={`w-full text-center px-4 py-3 text-[10px] rounded-xl font-bold uppercase tracking-widest border border-white/10 transition-colors ${isPast ? 'bg-white/5 text-zinc-500' : 'bg-white/5 text-white hover:bg-white hover:text-black hover:border-white'}`}
                  >
                    {isPast ? 'Archives_Closed' : 'Learn More'}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </ul>
    </>
  );
}

export const CloseIcon = () => {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.05 } }}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M18 6l-12 12" />
      <path d="M6 6l12 12" />
    </motion.svg>
  );
};
