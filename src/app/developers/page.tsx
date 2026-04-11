"use client";
import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { GithubIcon, LinkedinIcon } from '@/components/SocialIcons';
import { Globe, Mail, Code2, Cpu, Palette, Terminal } from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';

const developers = [
  {
    name: "Samin Tausif",
    role: "Full-Stack Developer",
    bio: "Passionate about building scalable web applications and exploring new technologies. Dedicated to creating seamless user experiences for the Josephite Math Club.",
    image: "/images/members/samin.jpg",
    skills: ["Next.js", "TypeScript", "Tailwind CSS", "Node.js"],
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:samin@jmc.edu.bd"
    }
  },
  {
    name: "Tawhid Bin Omar",
    role: "Full-Stack Developer",
    bio: "A tech enthusiast with a focus on backend architecture and database management. Committed to ensuring the robustness of JMC's digital platforms.",
    image: "/images/members/tawhid.jpg",
    skills: ["React", "Supabase", "PostgreSQL", "Express"],
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:tawhid@jmc.edu.bd"
    }
  },
  {
    name: "Sharan Haque Shakin",
    role: "Full-Stack Developer",
    bio: "Creative developer specializing in frontend animations and interactive UI. Bringing mathematical concepts to life through code.",
    image: "/images/members/sharan.jpg",
    skills: ["Framer Motion", "JavaScript", "CSS3", "React"],
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sharan@jmc.edu.bd"
    }
  },
  {
    name: "Sanjid Kabir",
    role: "Full-Stack Developer",
    bio: "Passionate about building intuitive user interfaces and optimizing web performance. Dedicated to enhancing the digital presence of the Josephite Math Club.",
    image: "/images/members/sanjid.jpg",
    skills: ["React", "Next.js", "Tailwind CSS", "UI/UX Design"],
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sanjid@jmc.edu.bd"
    }
  }
];

export default function DevelopersPage() {
  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] animate-pulse delay-1000" />
      </div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <ScrollReveal direction="up" distance={20} className="inline-block px-3 py-1 mb-4 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-bold tracking-[0.3em] uppercase border border-amber-500/20">
            The Architects
          </ScrollReveal>
          <ScrollReveal direction="up" distance={30} delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tighter text-white font-display mb-6">
              Web Developers
            </h1>
          </ScrollReveal>
          <ScrollReveal direction="up" distance={40} delay={0.2}>
            <p className="text-zinc-400 max-w-2xl mx-auto text-lg">
              Meet the creative minds behind the digital experience of the Josephite Math Club. 
              Blending logic with aesthetics to create a sanctuary for mathematicians.
            </p>
          </ScrollReveal>
        </div>

        <div className="grid grid-cols-1 gap-12 max-w-4xl mx-auto">
          {developers.map((dev, index) => (
            <ScrollReveal key={index} direction="up" distance={50} delay={0.3 + index * 0.1}>
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm relative group overflow-hidden">
                {/* Decorative Icon */}
                <div className="absolute -right-10 -top-10 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Terminal size={300} />
                </div>

                <div className="flex flex-col md:flex-row gap-12 items-center relative z-10">
                  <div className="w-48 h-48 md:w-64 md:h-64 shrink-0 relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-500 to-indigo-500 rounded-2xl rotate-6 group-hover:rotate-12 transition-transform duration-500" />
                    <Image 
                      src={dev.image} 
                      alt={dev.name}
                      fill
                      className="object-cover rounded-2xl grayscale group-hover:grayscale-0 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                  </div>

                  <div className="flex-grow space-y-6">
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">{dev.name}</h2>
                      <p className="text-amber-500 font-mono text-sm tracking-widest uppercase">{dev.role}</p>
                    </div>

                    <p className="text-zinc-400 leading-relaxed">
                      {dev.bio}
                    </p>

                    <div className="flex flex-wrap gap-2">
                      {dev.skills.map((skill, sIdx) => (
                        <span key={sIdx} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-bold text-zinc-300 uppercase tracking-wider">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-6 pt-4">
                      <a href={dev.links.github} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                        <GithubIcon size={20} />
                      </a>
                      <a href={dev.links.linkedin} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                        <LinkedinIcon size={20} />
                      </a>
                      <a href={dev.links.website} target="_blank" rel="noopener noreferrer" className="text-zinc-500 hover:text-white transition-colors">
                        <Globe size={20} />
                      </a>
                      <a href={dev.links.email} className="text-zinc-500 hover:text-white transition-colors">
                        <Mail size={20} />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Tech Stack Section */}
        <div className="mt-32 text-center">
          <ScrollReveal direction="up" distance={30}>
            <h3 className="text-xl font-bold text-white mb-12 uppercase tracking-[0.4em] opacity-50">Powered By</h3>
            <div className="flex flex-wrap justify-center gap-12 md:gap-24 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
              <div className="flex flex-col items-center gap-4">
                <Code2 size={40} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Next.js</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Cpu size={40} />
                <span className="text-[10px] font-bold tracking-widest uppercase">TypeScript</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Palette size={40} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Tailwind</span>
              </div>
              <div className="flex flex-col items-center gap-4">
                <Terminal size={40} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Supabase</span>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </div>
  );
}
