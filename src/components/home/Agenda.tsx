"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Trophy, Star, Lightbulb } from 'lucide-react';
import ScrollReveal from '../ScrollReveal';

interface AgendaProps {
  home: any;
}

export const Agenda: React.FC<AgendaProps> = ({ home }) => {
  return (
    <section id="agenda" className="py-32 md:py-48 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-24 text-left">
          <ScrollReveal direction="up" distance={20} className="inline-block px-4 py-1.5 mb-6 rounded-lg bg-[var(--c-5-start)]/10 text-[var(--c-5-start)] text-[10px] font-mono font-black tracking-[0.4em] uppercase border border-[var(--c-5-start)]/20">
            {home?.agendaTagline || "Our Mission"}
          </ScrollReveal>
          <ScrollReveal direction="up" distance={30} delay={0.1}>
            <h2 className="text-7xl md:text-9xl font-bold tracking-[-0.05em] text-white font-display leading-[0.8] mb-12">
              {home?.agendaTitle?.split(' ').map((word: string, i: number, arr: string[]) => (
                <span key={i} className={`block ${i === arr.length - 1 ? "blue-text italic font-serif font-light" : ""}`}>
                  {word}
                </span>
              )) || (
                <>The Club <span className="blue-text italic font-serif font-light">Agenda</span></>
              )}
            </h2>
            <p className="text-xl md:text-2xl text-zinc-500 font-light leading-relaxed max-w-2xl tracking-tighter">
              {home?.agendaDescription || "We aim to bridge the gap between theoretical mathematics and practical innovation through a series of structured programs."}
            </p>
          </ScrollReveal>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-6 h-auto md:h-[600px]">
          {(home?.agendaItems || [
            { title: "Weekly Workshops", icon: "Zap", desc: "Interactive sessions solving competitive mathematics." },
            { title: "Monthly Competitions", icon: "Trophy", desc: "Timed challenges to test analytic speed and accuracy." },
            { title: "Annual Math Festival", icon: "Star", desc: "The grand gathering of Josephite mathematicians." },
            { title: "Research Projects", icon: "Lightbulb", desc: "Exploring unsolved conjectures in modern math." }
          ]).map((item: any, i: number) => {
            const IconMap: any = { Zap, Trophy, Star, Lightbulb };
            const Icon = IconMap[item.icon] || Zap;
            const bentoClasses = [
              "md:col-span-2 md:row-span-2 bg-[var(--c-5-start)]/10",
              "md:col-span-2 bg-[var(--c-6-start)]/5",
              "md:col-span-1 bg-[var(--c-2-start)]/5",
              "md:col-span-1 bg-[var(--c-4-start)]/5"
            ];
            const borderColors = [
              "group-hover:border-[var(--c-5-start)]/50",
              "group-hover:border-[var(--c-6-start)]/50",
              "group-hover:border-[var(--c-2-start)]/50",
              "group-hover:border-[var(--c-4-start)]/50"
            ];
            const textColors = [
              "text-[var(--c-5-start)]",
              "text-[var(--c-6-start)]",
              "text-[var(--c-2-start)]",
              "text-[var(--c-4-start)]"
            ];

            return (
              <motion.div 
                key={i}
                whileHover={{ y: -8, scale: 1.01 }}
                className={`group relative p-10 rounded-[2.5rem] glass border-white/[0.05] flex flex-col justify-between overflow-hidden transition-all duration-700 ${bentoClasses[i % 4]} ${borderColors[i % 4]}`}
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity duration-700">
                  <Icon className="w-48 h-48 rotate-[-15deg]" />
                </div>
                
                <div className={`w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-white/10 transition-all duration-700`}>
                  <Icon className={`w-8 h-8 ${textColors[i % 4]}`} />
                </div>

                <div>
                  <h4 className="text-3xl font-bold text-white mb-4 tracking-tighter group-hover:translate-x-2 transition-transform duration-500">{item.title}</h4>
                  <p className="text-base text-zinc-500 leading-relaxed font-light tracking-tight">{item.desc || "Interactive sessions and systematic exploration."}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
