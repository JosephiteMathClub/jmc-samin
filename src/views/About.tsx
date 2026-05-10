"use client";
import React from 'react';
import Image from 'next/image';
import { useContent } from '../context/ContentContext';
import { motion } from 'framer-motion';
import { Calculator, Trophy, Lightbulb, Heart, Target, Rocket, Zap, Globe } from 'lucide-react';
import ScrollReveal from '../components/ScrollReveal';
import { Skeleton } from '../components/Skeleton';

import { usePerformance } from '../hooks/usePerformance';

const AboutSkeleton = () => (
  <div className="min-h-screen bg-[#050505] pt-32">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-32">
        <Skeleton className="h-24 w-3/4 mx-auto mb-12" />
        <Skeleton className="h-6 w-2/3 mx-auto mb-24" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-48 rounded-3xl" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    </div>
  </div>
);

const Typewriter = ({ text, delay = 20 }: { text: string; delay?: number }) => {
  const [currentText, setCurrentText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const { shouldReduceGfx } = usePerformance();

  React.useEffect(() => {
    if (shouldReduceGfx) {
      setCurrentText(text);
      return;
    }
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setCurrentText((prevText) => prevText + text[currentIndex]);
        setCurrentIndex((prevIndex) => prevIndex + 1);
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, delay, text, shouldReduceGfx]);

  return <span>{currentText}</span>;
};

const About = () => {
  const { content, loading } = useContent();
  const { shouldReduceGfx } = usePerformance();

  if (loading) return <AboutSkeleton />;

  const aboutContent = content.about || {};
  
  const stats = aboutContent.stats && aboutContent.stats.length > 0 ? aboutContent.stats : [
    { number: "10+", label: "Years of Excellence" },
    { number: "100+", label: "Workshops Conducted" },
    { number: "6", label: "National Festivals" },
    { number: "20k+", label: "Students Impacted" },
  ];

  const objectives = (aboutContent.objectives && aboutContent.objectives.length > 0 ? aboutContent.objectives : [
    {
      title: "Problem Solving",
      description: "Develop your math skills through challenging problems and real-world applications. Build critical thinking and problem-solving abilities.",
      icon: "Calculator",
      color: "text-purple-400"
    },
    {
      title: "Olympiad Preparation",
      description: "Preparing for math Olympiads helps you think outside the box and tackle advanced problems with confidence.",
      icon: "Trophy",
      color: "text-amber-400"
    },
    {
      title: "Creativity",
      description: "Learn how creativity fuels problem-solving. Apply mathematical thinking in innovative ways.",
      icon: "Lightbulb",
      color: "text-emerald-400"
    },
    {
      title: "Love for Math",
      description: "Embrace your passion for mathematics and explore its beauty in a supportive environment.",
      icon: "Heart",
      color: "text-rose-400"
    }
  ]).map((obj: any) => {
    const IconMap: any = { Calculator, Trophy, Lightbulb, Heart };
    const Icon = IconMap[obj.icon] || Calculator;
    return { ...obj, icon: <Icon className="w-8 h-8" /> };
  });

  const visionSteps = (aboutContent.visionSteps && aboutContent.visionSteps.length > 0 ? aboutContent.visionSteps : [
    { title: "Discovery", desc: "Identifying mathematical potential in every student.", icon: "Target", color: "bg-gradient-to-br from-[var(--c-4-start)] to-[var(--c-4-end)]" },
    { title: "Nurturing", desc: "Providing the resources and mentorship to grow.", icon: "Zap", color: "bg-gradient-to-br from-[var(--c-5-start)] to-[var(--c-5-end)]" },
    { title: "Excellence", desc: "Achieving mastery through practice and competition.", icon: "Rocket", color: "bg-gradient-to-br from-[var(--c-2-start)] to-[var(--c-2-end)]" },
    { title: "Impact", desc: "Applying math to solve real-world global problems.", icon: "Globe", color: "bg-gradient-to-br from-[var(--c-3-start)] to-[var(--c-3-end)]" }
  ]);

  return (
    <div className="min-h-screen relative py-24 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* What is JMC Section */}
        <section className="text-center mb-48">
          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceGfx ? 0.1 : 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2 className="text-4xl md:text-8xl font-bold text-white mb-8 md:mb-16 font-display tracking-tighter leading-[1.1] md:leading-none">
              {(aboutContent.title || "What is JMC?").split(' ').map((word: string, i: number) => (
                <span key={i} className={i === 2 ? "pink-text mr-3 md:mr-6" : "mr-3 md:mr-6"}>{word}</span>
              ))}
            </h2>
            
            <div className="text-zinc-400 max-w-5xl mx-auto text-lg md:text-3xl leading-relaxed mb-16 md:mb-24 font-light tracking-tight min-h-[100px] md:min-h-[120px] px-4">
              <Typewriter text={aboutContent.description} />
            </div>
          </motion.div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-4 sm:px-0">
            {stats.map((stat: any, i: number) => (
              <motion.div
                key={i}
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: shouldReduceGfx ? 0 : i * 0.15, duration: shouldReduceGfx ? 0.1 : 0.8, ease: "easeOut" }}
                className={`glass-card p-6 md:p-12 flex flex-col items-center justify-center border-white/5 ${!shouldReduceGfx && 'hover:border-[var(--c-2-start)]/30 transition-all group relative overflow-hidden'}`}
              >
                {!shouldReduceGfx && <div className="absolute inset-0 bg-gradient-to-br from-[var(--c-2-start)]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />}
                <span className={`text-3xl md:text-6xl font-bold text-white mb-2 md:mb-6 font-display tracking-tighter ${!shouldReduceGfx && 'group-hover:scale-110 transition-transform duration-700'}`}>
                  {stat.number}
                </span>
                <span className="text-[var(--c-2-start)]/60 text-[8px] md:text-xs font-black uppercase tracking-[0.2em] md:tracking-[0.3em] text-center">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Our Objectives Section */}
        <section className="text-center mb-32 md:mb-48">
          <motion.div
            initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: shouldReduceGfx ? 0.1 : 0.8 }}
            className="mb-16 md:mb-24 px-4"
          >
            <div className="inline-block px-3 py-1 mb-6 rounded-full bg-[var(--c-6-start)]/10 text-[var(--c-6-start)] text-[10px] font-bold tracking-[0.3em] uppercase border border-[var(--c-6-start)]/20">
              {aboutContent.visionTagline || "Our Vision"}
            </div>
            <h2 className="text-4xl md:text-8xl font-bold text-white font-display tracking-tighter leading-tight md:leading-none">
              {(aboutContent.objectivesTitle || "Our Objectives").split(' ').map((word: string, i: number, arr: string[]) => (
                <span key={i} className={i === arr.length - 1 ? "blue-text" : "mr-3 md:mr-4"}>
                  {word}
                </span>
              ))}
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {objectives.map((obj: any, i: number) => (
              <motion.div
                key={i}
                initial={shouldReduceGfx ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: shouldReduceGfx ? 0 : i * 0.1, duration: 0.6 }}
                className="group relative bg-[#0a0a0a] border border-white/5 p-10 flex flex-col items-start text-left overflow-hidden transition-all duration-500 hover:border-[var(--c-6-start)]/30 hover:bg-white/[0.01]"
              >
                {/* ID Label */}
                <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-[0.3em] mb-8">Objective_0{i+1}</span>
                
                {/* Icon with background glow */}
                <div className={`relative mb-8 p-4 rounded-xl bg-white/5 ${obj.color} group-hover:scale-110 transition-transform duration-500`}>
                  {obj.icon}
                  {!shouldReduceGfx && (
                    <div className="absolute inset-0 bg-white/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>

                <h3 className="text-2xl font-display font-medium text-white mb-6 group-hover:text-[var(--c-6-start)] transition-colors">
                  {obj.title}
                </h3>
                
                <p className="text-zinc-500 text-sm leading-relaxed font-light tracking-tight flex-grow">
                  {obj.description}
                </p>

                {/* Moving Glow Effect */}
                {!shouldReduceGfx && (
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <motion.div
                      animate={{
                        x: ["-100%", "100%"],
                        y: ["-100%", "100%"],
                      }}
                      transition={{
                        duration: 5,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                      className="absolute w-full h-full bg-[radial-gradient(circle_at_center,var(--c-6-start)_0%,transparent_70%)] opacity-0 group-hover:opacity-[0.07] blur-[120px]"
                    />
                    <motion.div
                      initial={{ left: "-100%" }}
                      whileHover={{ left: "200%" }}
                      transition={{ duration: 1.5, ease: "easeInOut", repeat: Infinity, repeatDelay: 1 }}
                      className="absolute top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[var(--c-6-start)]/50 to-transparent blur-[2px]"
                    />
                  </div>
                )}

                {/* Decorative corner */}
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none">
                  <div className="absolute top-4 right-4 w-1 h-1 bg-white/10 rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Vision in 4 Steps Section */}
        <section className="py-24 relative">
          <div className="text-center mb-24">
            <ScrollReveal direction="up" distance={20} className="inline-block mb-6">
              <span className="font-mono text-[10px] text-[var(--c-5-start)] uppercase tracking-[0.4em] px-4 py-1 rounded-full border border-[var(--c-5-start)]/20 bg-[var(--c-5-start)]/5">
                {aboutContent.pathTagline || "The Path Forward"}
              </span>
            </ScrollReveal>
            <ScrollReveal direction="up" distance={30} delay={0.1}>
              <h2 className="text-6xl md:text-8xl font-display font-medium tracking-tight text-white">
                Vision in <span className="text-[var(--c-6-start)]">4 Phases</span>
              </h2>
            </ScrollReveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border border-white/5 bg-[#080808]">
            {(visionSteps).map((step: any, i: number) => {
              const IconMap: any = { Target, Zap, Rocket, Globe };
              const Icon = IconMap[step.icon] || Zap;
              return (
                <ScrollReveal 
                  key={i} 
                  direction="up" 
                  distance={0}
                  className={`relative p-8 md:p-12 border-white/5 ${i < 3 ? 'lg:border-r border-b lg:border-b-0' : 'border-b lg:border-b-0'} ${i % 2 === 0 ? 'md:border-r' : 'md:border-r-0 lg:border-r'} group overflow-hidden`}
                >
                  {/* Phase ID */}
                  <div className="flex justify-between items-start mb-12">
                    <span className="font-mono text-[40px] font-black text-white/5 leading-none transition-colors group-hover:text-[var(--c-6-start)]/10">0{i + 1}</span>
                    <div className={`p-3 rounded-lg ${step.color} bg-opacity-20 flex items-center justify-center`}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <h3 className="text-2xl font-display font-medium text-white mb-6 uppercase tracking-wider">{step.title}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed font-light mb-8">{step.desc}</p>

                  <div className="mt-auto pt-8 flex items-center gap-3">
                    <div className="h-[2px] w-8 bg-[var(--c-6-start)]/30" />
                    <span className="font-mono text-[9px] text-zinc-600 uppercase tracking-widest">Active_Phase</span>
                  </div>

                  {/* Hover Scanner */}
                  {!shouldReduceGfx && (
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--c-6-start)]/5 to-transparent translate-y-full group-hover:translate-y-0 transition-transform duration-1000 ease-in-out pointer-events-none" />
                  )}
                </ScrollReveal>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
