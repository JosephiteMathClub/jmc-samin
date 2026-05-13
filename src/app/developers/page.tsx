"use client";
import React from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GithubIcon, LinkedinIcon } from '@/components/SocialIcons';
import { Globe, Mail, Code2, Cpu, Palette, Terminal, Sparkles, Zap, Star, Layout, Database } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const developers = [
  {
    name: "Samin Tausif",
    alias: "The Mastermind",
    role: "Lead Full-Stack Architect",
    bio: "The structural visionary behind JMC's digital core. Samin bridges the gap between complex mathematical logic and seamless user flows, orchestrating the entire stack with precision.",
    image: "/images/members/samin.jpg",
    skills: ["Next.js", "TypeScript", "Tailwind CSS", "Architecture"],
    color: "from-amber-500/20 to-orange-600/20",
    accent: "text-amber-500",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:samin@jmc.edu.bd"
    }
  },
  {
    name: "Tawhid Bin Omar",
    alias: "The Engine",
    role: "Backend Infrastructure Lead",
    bio: "Powering the silent machinery that keeps JMC running. Tawhid specializes in data integrity and cloud architecture, ensuring that every calculation and user action is persistent and fast.",
    image: "/images/members/tawhid.jpg",
    skills: ["PostgreSQL", "Supabase", "Node.js", "Database"],
    color: "from-indigo-500/20 to-blue-600/20",
    accent: "text-indigo-400",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:tawhid@jmc.edu.bd"
    }
  },
  {
    name: "Sharan Haque Shakin",
    alias: "The Visualizer",
    role: "Head of Experience Design",
    bio: "The one who breathes life into pixels. Sharan transforms static mathematical concepts into immersive, interactive journeys, pushing the boundaries of what's possible on the web.",
    image: "/images/members/sharan.jpg",
    skills: ["Framer Motion", "Animations", "UI/UX", "Motion"],
    color: "from-rose-500/20 to-purple-600/20",
    accent: "text-rose-400",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sharan@jmc.edu.bd"
    }
  },
  {
    name: "Sanjid Kabir",
    alias: "The Polisher",
    role: "UI Systems Specialist",
    bio: "Craftsmanship in every detail. Sanjid focuses on the refinement and optimization of the user interface, ensuring that the JMC brand is represented with absolute perfection across all devices.",
    image: "/images/members/sanjid.jpg",
    skills: ["React", "Performance", "Craft", "Visuals"],
    color: "from-emerald-500/20 to-teal-600/20",
    accent: "text-emerald-400",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sanjid@jmc.edu.bd"
    }
  }
];

export default function DevelopersPage() {
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, -200]);

  return (
    <div className="min-h-screen bg-transparent selection:bg-amber-500/30">
      
      {/* Cinematic Hero */}
      <section className="relative h-[90vh] flex flex-col items-center justify-center overflow-hidden">
        {/* Background Grain & Gradients */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(255,184,0,0.05)_0%,transparent_60%)] -z-10" />
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-6"
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/5 text-amber-500 text-[10px] font-bold uppercase tracking-[0.4em]">
              Established by Creators
            </span>
            <div className="relative">
              <h1 className="text-[14vw] md:text-[10rem] font-black leading-[0.8] tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40 font-display uppercase">
                THE<br />ARCHITECTS
              </h1>
              <motion.div 
                style={{ y }}
                className="absolute -top-10 -right-4 md:right-20 opacity-10 pointer-events-none"
              >
                <Terminal size={400} className="text-white" />
              </motion.div>
            </div>
            
            <p className="text-zinc-500 max-w-xl mx-auto text-lg md:text-xl font-light leading-relaxed font-serif italic py-10">
              "The beauty of mathematics is not in its complexity, but in the clarity it brings to the world."
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border border-white/20 rounded-full flex justify-center p-2"
        >
          <div className="w-1 h-2 bg-amber-500 rounded-full" />
        </motion.div>
      </section>

      {/* Developers Gallery */}
      <section className="container mx-auto px-4 py-32 space-y-48">
        {developers.map((dev, index) => (
          <div key={index} className={`flex flex-col ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} gap-12 md:gap-24 items-center`}>
            {/* Image Container */}
            <div className="w-full md:w-1/2 relative">
              <ScrollReveal direction={index % 2 === 0 ? "left" : "right"} distance={50}>
                <div className="relative aspect-[4/5] md:aspect-square group overflow-hidden rounded-[2rem] bg-zinc-900 border border-white/5">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${dev.color} opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-10`} />
                  <Image 
                    src={dev.image} 
                    alt={dev.name}
                    fill
                    className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  
                  {/* Floating Identity */}
                  <div className="absolute bottom-0 left-0 w-full p-8 z-20 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="p-6 glass-card backdrop-blur-xl border-white/10 rounded-2xl">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500 mb-1">Status</p>
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        <Sparkles size={14} className="animate-pulse" /> Online & Building
                      </p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
              
              {/* Background Number */}
              <div className={`absolute -top-10 ${index % 2 === 0 ? '-left-10' : '-right-10'} text-[20rem] font-black text-white/[0.02] pointer-events-none font-display`}>
                0{index + 1}
              </div>
            </div>

            {/* Content Container */}
            <div className="w-full md:w-1/2 space-y-8">
              <ScrollReveal direction="up" distance={30} delay={0.2}>
                <div className="space-y-4">
                  <span className={`text-xs font-bold uppercase tracking-[0.3em] ${dev.accent} flex items-center gap-2`}>
                    <Star size={12} fill="currentColor" /> {dev.alias}
                  </span>
                  <h2 className="text-5xl md:text-7xl font-bold text-white tracking-tighter leading-tight font-display">
                    {dev.name.split(' ').map((n, i) => (
                      <React.Fragment key={i}>
                        {i > 0 && <br className="hidden md:block" />}
                        {n}
                      </React.Fragment>
                    ))}
                  </h2>
                  <p className="text-zinc-500 uppercase tracking-widest text-xs font-bold font-mono">
                    [{dev.role}]
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" distance={30} delay={0.3}>
                <p className="text-zinc-400 text-lg leading-relaxed font-light font-sans max-w-xl">
                  {dev.bio}
                </p>
              </ScrollReveal>

              <ScrollReveal direction="up" distance={30} delay={0.4}>
                <div className="flex flex-wrap gap-3">
                  {dev.skills.map((skill, sIdx) => (
                    <div key={sIdx} className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[11px] font-bold text-zinc-300 uppercase tracking-widest flex items-center gap-2 hover:bg-white/10 transition-colors cursor-default">
                      <Zap size={10} className={dev.accent} /> {skill}
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              <ScrollReveal direction="up" distance={30} delay={0.5}>
                <div className="flex items-center gap-8 pt-4">
                  <a href={dev.links.github} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                    <GithubIcon size={20} />
                  </a>
                  <a href={dev.links.linkedin} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                    <LinkedinIcon size={20} />
                  </a>
                  <a href={dev.links.website} target="_blank" rel="noopener noreferrer" className="p-3 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                    <Globe size={20} />
                  </a>
                  <a href={dev.links.email} className="p-3 rounded-full border border-white/5 hover:border-white/20 hover:bg-white/5 text-zinc-500 hover:text-white transition-all">
                    <Mail size={20} />
                  </a>
                </div>
              </ScrollReveal>
            </div>
          </div>
        ))}
      </section>

      {/* The Tech Matrix */}
      <section className="bg-white/[0.02] border-y border-white/5 py-32 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-24">
            <h3 className="text-[var(--font-serif)] text-4xl italic text-white/40 mb-4 tracking-tighter">The Technological Core</h3>
            <div className="h-px w-24 bg-amber-500/50 mx-auto" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {[
              { label: "Architecture", icon: Layout, desc: "Next.js 14 App Router" },
              { label: "Computing", icon: Code2, desc: "TypeScript & Complex Logic" },
              { label: "Foundation", icon: Database, desc: "Supabase & PostgreSQL" },
              { label: "Visuals", icon: Palette, desc: "Tailwind CSS & Motion" }
            ].map((item, idx) => (
              <ScrollReveal key={idx} direction="up" distance={20} delay={idx * 0.1} className="text-center space-y-6">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <item.icon size={24} className="text-zinc-400" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase tracking-widest mb-1">{item.label}</h4>
                  <p className="text-zinc-500 text-[10px] font-mono">{item.desc}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-24 text-center">
        <ScrollReveal direction="up">
          <p className="text-zinc-600 text-xs font-black uppercase tracking-[0.8em] mb-4">Josephite Math Club</p>
          <p className="text-zinc-400 text-lg font-serif italic">Forged in code, dedicated to the infinite.</p>
        </ScrollReveal>
      </footer>
    </div>
  );
}
