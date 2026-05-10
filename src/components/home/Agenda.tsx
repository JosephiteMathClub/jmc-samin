"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Star, Lightbulb } from 'lucide-react';
import { Reveal } from '../animations/Reveal';
import { usePerformance } from '../../hooks/usePerformance';

interface AgendaProps {
  home: any;
}

export const Agenda: React.FC<AgendaProps> = ({ home }) => {
  const { shouldReduceGfx } = usePerformance();
  const items = home?.agendaItems || [
    { title: "Weekly Workshops", icon: "Zap", desc: "Interactive sessions solving competitive mathematics." },
    { title: "Monthly Competitions", icon: "Trophy", desc: "Timed challenges to test analytic speed and accuracy." },
    { title: "Annual Math Festival", icon: "Star", desc: "The grand gathering of Josephite mathematicians." },
    { title: "Research Projects", icon: "Lightbulb", desc: "Exploring unsolved conjectures in modern math." }
  ];

  return (
    <section id="agenda" className="py-32 md:py-64 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-[var(--c-5-start)]/5 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal direction="up" className="mb-32">
          <div className="inline-block px-4 py-1.5 mb-8 rounded-full bg-[var(--c-5-start)]/10 text-[var(--c-5-start)] text-[10px] font-mono font-black tracking-[0.5em] uppercase border border-[var(--c-5-start)]/20 shadow-[0_0_20px_rgba(106,48,147,0.1)]">
            {home?.agendaTagline || "OUR_MISSION_SCOPE"}
          </div>
          <h2 className="text-6xl sm:text-8xl md:text-[10rem] font-bold tracking-[-0.07em] text-white font-display leading-[0.8] mb-12">
            {home?.agendaTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
              <span key={i} className={`block ${i === arr.length - 1 ? "blue-text italic font-serif font-light tracking-tighter" : ""}`}>
                {word}
              </span>
            )) || (
              <>THE_CLUB <span className="blue-text italic font-serif font-light tracking-tighter">AGENDA</span></>
            )}
          </h2>
          <p className="text-xl md:text-3xl text-zinc-500 font-light leading-relaxed max-w-3xl tracking-tight px-2">
            {home?.agendaDescription || "Bridging the gap between theoretical mathematics and practical innovation through elite structured programs."}
          </p>
        </Reveal>
        
        <div className="grid grid-cols-1 md:grid-cols-6 gap-6 auto-rows-[300px]">
          {items.map((item: any, i: number) => {
            const IconMap: any = { Zap, Trophy, Star, Lightbulb };
            const Icon = IconMap[item.icon] || Zap;
            
            // Premium Bento Grid Spans
            const spans = [
              "md:col-span-4 md:row-span-2", // Big hero card
              "md:col-span-2 md:row-span-1",
              "md:col-span-2 md:row-span-1",
              "md:col-span-6 md:row-span-1"  // Bottom bar card
            ];

            const gradients = [
              "from-[var(--c-5-start)]/20 to-transparent",
              "from-[var(--c-6-start)]/20 to-transparent",
              "from-[var(--c-2-start)]/20 to-transparent",
              "from-[var(--c-4-start)]/20 to-transparent"
            ];

            return (
              <Reveal 
                key={i} 
                direction="up" 
                delay={i * 0.1}
                className={`${spans[i % 4]} h-full`}
              >
                <motion.div 
                  whileHover={{ y: -5 }}
                  className="group relative h-full w-full p-10 rounded-[2.5rem] glass border-white/[0.05] flex flex-col justify-between overflow-hidden transition-all duration-700 hover:border-white/20 shadow-2xl"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${gradients[i % 4]} opacity-0 group-hover:opacity-100 transition-opacity duration-1000`} />
                  
                  {!shouldReduceGfx && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                      <motion.div
                        animate={{
                          x: ["-100%", "100%"],
                          y: ["-100%", "100%"],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          ease: "linear",
                        }}
                        className="absolute w-full h-full bg-[radial-gradient(circle_at_center,var(--c-6-start)_0%,transparent_70%)] opacity-0 group-hover:opacity-[0.05] blur-[120px]"
                      />
                    </div>
                  )}

                  <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-[0.08] transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12">
                    <Icon className="w-64 h-64" />
                  </div>
                  
                  <div className="relative">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700 hud-bracket hud-bracket-tl hud-bracket-br">
                      <Icon className="w-8 h-8 text-white" />
                    </div>
                  </div>

                  <div className="relative z-10">
                    <div className="mono-label text-[10px] text-zinc-600 mb-4 tracking-[0.4em]">0{i + 1} {"//"} SEGMENT</div>
                    <h4 className="text-4xl font-bold text-white mb-4 tracking-tighter group-hover:text-[var(--c-6-start)] transition-colors duration-500">{item.title}</h4>
                    <p className="text-lg text-zinc-500 leading-relaxed font-light tracking-tight max-w-md">{item.desc || "Interactive sessions and systematic exploration."}</p>
                  </div>

                  {/* Corner Accent */}
                  <div className="absolute bottom-6 right-6 w-12 h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
                    <div className="w-full h-[1px] bg-white/20 rotate-45" />
                    <div className="w-full h-[1px] bg-white/20 -rotate-45 absolute" />
                  </div>
                </motion.div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

