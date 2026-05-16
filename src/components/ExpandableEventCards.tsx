"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOutsideClick } from "@/hooks/use-outside-click";
import Image from "next/image";
import { resolveImageUrl } from "@/lib/utils";
import { Clock, MapPin, ArrowRight, X } from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function ExpandableEventCards({ events, shouldReduceGfx }: { events: any[], shouldReduceGfx: boolean }) {
  const [active, setActive] = useState<any | boolean | null>(
    null
  );
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

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
          <div className="fixed inset-0 grid place-items-center z-[1000] p-4 sm:p-0 overflow-y-auto pt-24 pb-12">
            <motion.div
              layoutId={`card-${active.title}-${id}`}
              ref={ref}
              className="w-full max-w-[700px] h-fit flex flex-col bg-[#050505] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl relative"
            >
              <motion.button
                key={`button-${active.title}-${id}`}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.05 } }}
                className="flex absolute top-6 right-6 z-[1110] items-center justify-center bg-white/10 backdrop-blur-3xl rounded-full h-12 w-12 border border-white/20 text-white hover:bg-white/20 transition-all shadow-2xl group"
                onClick={() => setActive(null)}
              >
                <X className="w-6 h-6 group-hover:scale-110 transition-transform" />
              </motion.button>
              
              <motion.div layoutId={`image-${active.title}-${id}`} className="relative h-72 sm:h-96 w-full shrink-0">
                <Image
                  fill
                  src={resolveImageUrl(active.imageUrl) || `https://picsum.photos/seed/event-${active.id}/1200/800`}
                  alt={active.title}
                  className="w-full h-full object-cover"
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
                <div 
                  className="p-6 md:p-10 relative flex-1 overflow-y-auto overscroll-contain bg-[#0a0a0a]"
                  data-lenis-prevent
                >
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
                  src={resolveImageUrl(event.imageUrl) || `https://picsum.photos/seed/event-${event.id || index}/800/600`}
                  alt={event.title}
                  className="w-full h-full object-cover object-top opacity-60 group-hover:opacity-100 transition-opacity duration-500"
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
