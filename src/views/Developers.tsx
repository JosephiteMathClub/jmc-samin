"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform, useMotionValue, useSpring, type Variants } from 'framer-motion';
import { GithubIcon, LinkedinIcon } from '@/components/SocialIcons';
import { 
  Globe, 
  Mail, 
  Code2, 
  Cpu, 
  Palette, 
  Terminal, 
  Sparkles, 
  Star, 
  Layout, 
  Database,
  QrCode,
  FileText,
  ScanLine,
  ShieldCheck,
  Award,
  Layers,
  Send,
  Workflow,
  Check,
  CheckCircle2,
  Compass,
  Laptop
} from 'lucide-react';
import ScrollReveal from '@/components/ScrollReveal';
import { usePerformance } from '@/hooks/usePerformance';
import { useContent } from '@/context/ContentContext';
import { resolveImageUrl } from '@/lib/utils';

// Samin Tausif's Key Contributions & Features
const saminContributions = [
  {
    icon: Layout,
    title: "Dual Event Registration Engines",
    category: "Full-Stack Engine",
    description: "Architected both Intra-School and National Inter-School Olympiad registration flows with dynamic pricing calculations, multi-segment bundle selection, and instant database synchronization.",
    badge: "Core Feature",
    accentColor: "from-amber-500/20 to-orange-500/10",
    borderColor: "group-hover:border-amber-500/40",
    iconColor: "text-amber-400"
  },
  {
    icon: ShieldCheck,
    title: "Super Admin Command Center & RBAC",
    category: "Security & Operations",
    description: "Engineered a multi-tabbed administration dashboard with granular Role-Based Access Control, live multi-table database explorer, user management, and verified payment audits.",
    badge: "Enterprise",
    accentColor: "from-indigo-500/20 to-blue-500/10",
    borderColor: "group-hover:border-indigo-500/40",
    iconColor: "text-indigo-400"
  },
  {
    icon: FileText,
    title: "Automated Verification PDF & Scannable QR Pass",
    category: "Ticketing & Passes",
    description: "Built the automated PDF slip generation engine with embedded high-resolution 2D QR codes, instant post-registration auto-download, and bulk/single email dispatch system.",
    badge: "Automated",
    accentColor: "from-rose-500/20 to-pink-500/10",
    borderColor: "group-hover:border-rose-500/40",
    iconColor: "text-rose-400"
  },
  {
    icon: QrCode,
    title: "Digital Member ID Cards & Multi-Pass Layouts",
    category: "Identity Systems",
    description: "Created official digital membership cards with dynamic QR verification, printable 2x2 multi-badge portal layouts, and custom photo integration.",
    badge: "Identity",
    accentColor: "from-purple-500/20 to-fuchsia-500/10",
    borderColor: "group-hover:border-purple-500/40",
    iconColor: "text-purple-400"
  },
  {
    icon: ScanLine,
    title: "Ticket Scanner & Food Voucher Hub",
    category: "Event Operations",
    description: "Developed real-time camera-based QR ticket validation scanner and food token redemption portal with fast offline-tolerant verification.",
    badge: "Real-time",
    accentColor: "from-emerald-500/20 to-teal-500/10",
    borderColor: "group-hover:border-emerald-500/40",
    iconColor: "text-emerald-400"
  },
  {
    icon: Database,
    title: "Cloud Database Architecture & Supabase Integration",
    category: "Backend & Data",
    description: "Structured the PostgreSQL schemas, relational queries, real-time sync hooks, secure role authentication, and data integrity safeguards across all club tables.",
    badge: "Cloud",
    accentColor: "from-cyan-500/20 to-blue-500/10",
    borderColor: "group-hover:border-cyan-500/40",
    iconColor: "text-cyan-400"
  },
  {
    icon: Send,
    title: "Email Dispatch & Notification Infrastructure",
    category: "Communication",
    description: "Implemented backend API services for transactional email delivery, official verification slip attachments, and bulk announcement broadcasting.",
    badge: "API Services",
    accentColor: "from-amber-500/20 to-yellow-500/10",
    borderColor: "group-hover:border-amber-500/40",
    iconColor: "text-amber-400"
  },
  {
    icon: Palette,
    title: "Mathematical Dark Aesthetic & Design System",
    category: "UI/UX & Design",
    description: "Crafted the bespoke visual identity, fluid Framer Motion micro-interactions, responsive typography, and mathematical art direction across the entire platform.",
    badge: "UI/UX",
    accentColor: "from-pink-500/20 to-rose-500/10",
    borderColor: "group-hover:border-pink-500/40",
    iconColor: "text-pink-400"
  }
];

// Supporting Development Team & Contributors (Idea Representers & Debuggers)
const supportingDevelopers = [
  {
    name: "Tawhid Bin Omar",
    alias: "Idea & Debugging",
    role: "Idea Representer & Debugger",
    bio: "Played an important role in proposing core platform ideas, validating system logic, and debugging data synchronization workflows to help the website achieve its current operational status.",
    image: "/images/members/tawhid.jpg",
    skills: ["Idea Representation", "System Debugging", "Data Flow Testing", "Logic Validation"],
    color: "from-indigo-500/20 to-blue-600/20",
    accent: "text-indigo-400",
    borderColor: "hover:border-indigo-500/40",
    glowColor: "rgba(99, 102, 241, 0.15)",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:tawhid@jmc.edu.bd"
    }
  },
  {
    name: "Sharafi Ahmed",
    alias: "Idea & Debugging",
    role: "Idea Representer & Debugger",
    bio: "Played an essential role in creative feature ideation, testing interactive layouts, and debugging user experience inconsistencies to elevate the website to its current high visual standard.",
    image: "/images/members/sharafi.jpg",
    skills: ["Feature Ideation", "UI Debugging", "Visual Quality Assurance", "Concept Design"],
    color: "from-rose-500/20 to-purple-600/20",
    accent: "text-rose-400",
    borderColor: "hover:border-rose-500/40",
    glowColor: "rgba(244, 63, 94, 0.15)",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sharafi@jmc.edu.bd"
    }
  },
  {
    name: "Sanjid Kabir",
    alias: "Idea & Debugging",
    role: "Idea Representer & Debugger",
    bio: "Played a vital role in representing student user requirements, executing rigorous responsiveness debugging, and resolving edge-case issues across diverse mobile and desktop devices.",
    image: "/images/members/sanjid.jpg",
    skills: ["Idea Representation", "Cross-Device Debugging", "Issue Pinpointing", "User Experience QA"],
    color: "from-emerald-500/20 to-teal-600/20",
    accent: "text-emerald-400",
    borderColor: "hover:border-emerald-500/40",
    glowColor: "rgba(16, 185, 129, 0.15)",
    links: {
      github: "https://github.com",
      linkedin: "https://linkedin.com",
      website: "https://jmc.edu.bd",
      email: "mailto:sanjid@jmc.edu.bd"
    }
  }
];

// =========================================================================
// CINEMATIC FRAMER MOTION STAGGERED ENTRANCE VARIANTS
// =========================================================================

const heroContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.08,
    },
  },
};

const heroItemVariants: Variants = {
  hidden: { opacity: 0, y: 35, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const sectionContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.09,
      delayChildren: 0.1,
    },
  },
};

const fadeUpVariant: Variants = {
  hidden: { opacity: 0, y: 25, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const monolithCardVariants: Variants = {
  hidden: { opacity: 0, y: 45, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const bentoGridContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.15,
    },
  },
};

const bentoCardVariants: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.95, filter: "blur(4px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.65,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const podsContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.14,
      delayChildren: 0.12,
    },
  },
};

const podCardVariants: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.93, filter: "blur(6px)" },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      duration: 0.85,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

const techMatrixContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const techMatrixItemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.7,
      ease: [0.22, 1, 0.36, 1],
    },
  },
};

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
}

const TiltCard: React.FC<TiltCardProps> = ({ children, className = "" }) => {
  const { shouldReduceGfx } = usePerformance();
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springConfig = { damping: 20, stiffness: 200, mass: 0.8 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [8, -8]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-8, 8]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceGfx) return;
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = event.clientX - rect.left - width / 2;
    const mouseY = event.clientY - rect.top - height / 2;
    
    x.set(mouseX / width);
    y.set(mouseY / height);
  };

  const handleMouseLeave = () => {
    if (shouldReduceGfx) return;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={shouldReduceGfx ? {} : {
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative select-none ${className}`}
    >
      {children}
    </motion.div>
  );
};

// Interactive Flashlight Card component for luxury feel
const FlashlightCard: React.FC<{
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}> = ({ children, className = "", glowColor = "rgba(245, 158, 11, 0.12)" }) => {
  const { shouldReduceGfx } = usePerformance();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const backgroundGradient = useTransform(
    [mouseX, mouseY],
    ([x, y]) => `radial-gradient(400px circle at ${x}px ${y}px, ${glowColor}, transparent 70%)`
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceGfx) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden ${className}`}
    >
      {!shouldReduceGfx && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: backgroundGradient,
          }}
        />
      )}
      {children}
    </div>
  );
};

export default function DevelopersView() {
  const { content } = useContent();
  const { shouldReduceGfx } = usePerformance();
  const { scrollYProgress } = useScroll();
  const yParallax = useTransform(scrollYProgress, [0, 1], [0, -140]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.4], [1, 0.3]);

  // Dynamic Image resolution from ContentContext (Admin Dashboard manageable)
  const saminImage = content?.developers?.samin?.image
    ? resolveImageUrl(content.developers.samin.image)
    : "/images/members/samin.jpg";

  const dynamicSupportingDevelopers = supportingDevelopers.map((dev, idx) => {
    const overrideImage = content?.developers?.supporting?.[idx]?.image;
    return {
      ...dev,
      image: overrideImage ? resolveImageUrl(overrideImage) : dev.image
    };
  });

  // Subtle interactive mouse tracker for ambient workspace lighting
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 60, damping: 25 });
  const springY = useSpring(mouseY, { stiffness: 60, damping: 25 });

  useEffect(() => {
    if (shouldReduceGfx) return;
    const handleGlobalMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener('mousemove', handleGlobalMouseMove);
    return () => window.removeEventListener('mousemove', handleGlobalMouseMove);
  }, [shouldReduceGfx, mouseX, mouseY]);

  return (
    <div className="relative min-h-screen bg-[#050608] text-white selection:bg-amber-500/30 selection:text-amber-200 overflow-x-hidden">
      
      {/* ========================================================================= */}
      {/* ATMOSPHERIC AMBIENT CANVAS & COZY FUTURE LIGHTING */}
      {/* ========================================================================= */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Subtle Geometric Matrix Lattice */}
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:32px_32px] opacity-40" />
        
        {/* Soft Noise Texture */}
        <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
        
        {/* Living Celestial Auroral Lights */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[80vw] h-[60vh] bg-gradient-to-b from-amber-500/10 via-indigo-600/5 to-transparent blur-[140px] rounded-full" />
        <div className="absolute top-[35%] -left-[10%] w-[50vw] h-[50vh] bg-indigo-500/[0.04] blur-[160px] rounded-full" />
        <div className="absolute top-[60%] -right-[10%] w-[50vw] h-[50vh] bg-amber-500/[0.04] blur-[160px] rounded-full" />
        <div className="absolute bottom-[5%] left-1/3 w-[60vw] h-[40vh] bg-rose-500/[0.03] blur-[150px] rounded-full" />

        {/* Reactive Workspace Cursor Light (Desktop) */}
        {!shouldReduceGfx && (
          <motion.div
            style={{
              x: springX,
              y: springY,
              translateX: '-50%',
              translateY: '-50%',
            }}
            className="hidden lg:block w-[600px] h-[600px] bg-radial from-amber-400/[0.03] via-indigo-500/[0.02] to-transparent blur-3xl pointer-events-none"
          />
        )}
      </div>

      <div className="relative z-10">

        {/* ========================================================================= */}
        {/* CINEMATIC HERO SECTION WITH STAGGERED VARIANTS */}
        {/* ========================================================================= */}
        <section className="relative min-h-[82vh] flex flex-col items-center justify-center pt-28 pb-16 px-4">
          <motion.div 
            style={{ opacity: opacityHero }}
            variants={heroContainerVariants}
            initial="hidden"
            animate="visible"
            className="container mx-auto max-w-5xl text-center space-y-8"
          >
            {/* Ambient Badges & Status Beacon */}
            <motion.div
              variants={heroItemVariants}
              className="flex flex-wrap items-center justify-center gap-3"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 backdrop-blur-xl text-amber-300 text-[11px] font-black uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <Sparkles size={13} className="text-amber-400 animate-pulse" />
                <span>Platform Architects & Engineers</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl text-zinc-400 text-[10px] font-mono uppercase tracking-widest">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Official JMC Web Platform</span>
              </div>
            </motion.div>

            {/* Monumental Headline Typography */}
            <motion.div variants={heroItemVariants} className="relative space-y-2">
              <div>
                <h1 className="text-[13vw] sm:text-7xl md:text-8xl lg:text-9xl font-black leading-[0.88] tracking-tight font-display uppercase select-none">
                  <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-zinc-100 to-zinc-400 drop-shadow-sm">
                    THE MAIN
                  </span>
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-400 drop-shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                    ARCHITECT
                  </span>
                </h1>
              </div>

              {/* Holographic Watermark Deco */}
              <motion.div 
                style={{ y: yParallax }}
                className="absolute -top-16 -right-6 md:right-4 opacity-[0.06] pointer-events-none select-none"
              >
                <Terminal size={360} className="text-amber-400 stroke-[1]" />
              </motion.div>
            </motion.div>
            
            {/* Subheading with Clean Atmospheric Contrast */}
            <motion.p
              variants={heroItemVariants}
              className="text-zinc-300 max-w-2xl mx-auto text-base sm:text-lg font-light leading-relaxed font-sans"
            >
              Meet the mastermind and technical visionaries behind the Josephite Math Club digital ecosystem. Engineering pure mathematics into an intuitive, high-performance web platform.
            </motion.p>

            {/* Cozy HUD Telemetry Strip */}
            <motion.div
              variants={heroItemVariants}
              className="pt-2 flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-[10px] font-mono uppercase tracking-wider text-zinc-400"
            >
              <span className="px-3 py-1 rounded-lg bg-zinc-900/60 border border-white/5 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span>ARCHITECT_STATUS: <strong className="text-white">ONLINE</strong></span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-zinc-900/60 border border-white/5 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                <span>SYSTEM_ROLE: <strong className="text-white">CHIEF_CREATOR</strong></span>
              </span>
              <span className="px-3 py-1 rounded-lg bg-zinc-900/60 border border-white/5 backdrop-blur-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>PILLARS: <strong className="text-white">8 CORE MODULES</strong></span>
              </span>
            </motion.div>

            {/* Scroll Indicator with Subtle Spring Motion */}
            <motion.div
              variants={heroItemVariants}
              className="pt-6 flex justify-center"
            >
              <motion.div 
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-5 h-9 border border-white/20 rounded-full flex justify-center p-1.5 backdrop-blur-sm"
              >
                <motion.div 
                  animate={{ height: ["4px", "10px", "4px"] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-1 bg-amber-400 rounded-full" 
                />
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* SPOTLIGHT MASTER MONOLITH: SAMIN TAUSIF (MAIN DEVELOPER & LEAD ARCHITECT) */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 py-8 lg:py-16">
          <motion.div
            variants={monolithCardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
          >
            <div className="relative rounded-[2.5rem] bg-gradient-to-b from-zinc-900/90 via-[#0a0b0e] to-black border border-amber-500/30 p-6 sm:p-10 lg:p-14 shadow-[0_25px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(245,158,11,0.08)] overflow-hidden backdrop-blur-2xl">
              
              {/* Cozy Corner Lights & Background Gradients */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] pointer-events-none" />

              {/* Master Header Bar & Status Credentials */}
              <motion.div 
                variants={fadeUpVariant}
                className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-8 mb-10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shadow-amber-500/20">
                    <Award size={28} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 block font-mono">
                      Chief Platform Creator
                    </span>
                    <h3 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight font-display">
                      Lead Developer & Architect
                    </h3>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold font-mono shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Primary Creator & Maintainer
                  </span>
                </div>
              </motion.div>

              {/* Main Content Layout Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
                
                {/* ------------------------------------------------------------- */}
                {/* Left Column: 3D Holographic Avatar Card & Quick Action Console */}
                {/* ------------------------------------------------------------- */}
                <motion.div 
                  variants={fadeUpVariant}
                  className="lg:col-span-5 space-y-6"
                >
                  {/* Interactive 3D Tilt Card */}
                  <TiltCard className="aspect-square w-full max-w-md mx-auto rounded-[2rem] overflow-hidden bg-gradient-to-br from-amber-500/20 via-zinc-900 to-zinc-950 border border-amber-500/30 group shadow-2xl">
                    <div className="relative w-full h-full">
                      {/* Photo or Fallback Frame */}
                      <Image 
                        src={saminImage} 
                        alt="Samin Tausif"
                        fill
                        className="object-cover transition-all duration-700 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as any).style.display = 'none';
                        }}
                      />

                      {/* Sci-Fi Corner Accents */}
                      <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-amber-400/60 pointer-events-none" />
                      <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-amber-400/60 pointer-events-none" />
                      <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-amber-400/60 pointer-events-none" />
                      <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-amber-400/60 pointer-events-none" />

                      {/* Glassmorphic Lower Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-6 sm:p-8 z-10">
                        <div className="p-4 sm:p-5 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10 shadow-2xl">
                          <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 mb-0.5">
                            System Architect
                          </p>
                          <p className="text-white font-black text-xl font-display">
                            Samin Tausif
                          </p>
                          <p className="text-zinc-300 text-xs font-sans mt-1 leading-snug">
                            Architected 100% of Core Platform Modules
                          </p>
                        </div>
                      </div>
                    </div>
                  </TiltCard>

                  {/* Social & Contact Buttons Hub */}
                  <motion.div variants={fadeUpVariant} className="flex flex-wrap items-center justify-center lg:justify-start gap-3 pt-1">
                    <motion.a 
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      href="mailto:samintausif38@gmail.com" 
                      className="px-5 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-yellow-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_10px_25px_rgba(245,158,11,0.3)] cursor-pointer"
                    >
                      <Mail size={15} /> Contact Developer
                    </motion.a>
                    
                    <motion.a 
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href="https://github.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 text-zinc-300 hover:text-white transition-all shadow-sm"
                      title="GitHub"
                    >
                      <GithubIcon size={18} />
                    </motion.a>

                    <motion.a 
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href="https://linkedin.com" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 text-zinc-300 hover:text-white transition-all shadow-sm"
                      title="LinkedIn"
                    >
                      <LinkedinIcon size={18} />
                    </motion.a>

                    <motion.a 
                      whileHover={{ scale: 1.08, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href="https://jmc-sjs.org" 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 hover:border-amber-400/40 text-zinc-300 hover:text-white transition-all shadow-sm"
                      title="Website"
                    >
                      <Globe size={18} />
                    </motion.a>
                  </motion.div>

                  {/* Technical Competencies / Stack */}
                  <motion.div variants={fadeUpVariant} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 backdrop-blur-md space-y-3.5">
                    <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                      <Cpu size={15} className="text-amber-400" /> Core Technology Mastery
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Next.js 15 App Router",
                        "TypeScript",
                        "Tailwind CSS",
                        "PostgreSQL",
                        "Supabase DB & Auth",
                        "Framer Motion",
                        "PDF & QR Code Engines",
                        "REST APIs & Webhooks",
                        "RBAC & Cloud Security",
                        "Performance Optimization"
                      ].map((tech, idx) => (
                        <motion.span 
                          key={idx}
                          whileHover={{ scale: 1.05, y: -1 }}
                          className="px-3 py-1.5 rounded-lg bg-zinc-900/90 border border-white/10 hover:border-amber-500/40 text-[11px] font-mono text-zinc-300 font-medium transition-colors cursor-default"
                        >
                          {tech}
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                </motion.div>

                {/* ------------------------------------------------------------- */}
                {/* Right Column: Bio & Comprehensive Contributions Bento Deck */}
                {/* ------------------------------------------------------------- */}
                <div className="lg:col-span-7 space-y-8">
                  
                  {/* Master Bio Introduction */}
                  <motion.div variants={fadeUpVariant} className="space-y-3.5">
                    <div className="inline-flex items-center gap-2 text-xs font-mono font-bold text-amber-400 uppercase tracking-widest">
                      <Star size={14} className="fill-amber-400" /> The Master Architect & Lead Developer
                    </div>
                    <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight uppercase font-display">
                      Samin Tausif
                    </h2>
                    <p className="text-zinc-300 text-base sm:text-lg leading-relaxed font-light font-sans pt-1">
                      The structural visionary, lead full-stack developer, and chief architect of the Josephite Math Club official platform. Samin single-handedly designed, built, and deployed the club's end-to-end web application—transforming complex festival workflows, real-time database management, automated verification ticketing, and event operations into a cohesive, high-performance digital universe.
                    </p>
                  </motion.div>

                  {/* Section Title: Features Added & Contributions */}
                  <div className="pt-6 border-t border-white/10 space-y-6">
                    <motion.div variants={fadeUpVariant} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-lg sm:text-xl font-black text-white uppercase tracking-tight flex items-center gap-2.5 font-display">
                          <Layers className="text-amber-400 w-5 h-5" /> Features Added & Architectural Contributions
                        </h4>
                        <p className="text-xs text-zinc-400 font-sans mt-0.5">
                          Key modules, production systems, and functional features designed and built by Samin Tausif:
                        </p>
                      </div>
                      <span className="self-start sm:self-auto px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-mono font-bold rounded-full border border-amber-500/25 shrink-0">
                        8 Core Pillars
                      </span>
                    </motion.div>

                    {/* 8 Contributions Staggered Bento Cards Grid */}
                    <motion.div 
                      variants={bentoGridContainerVariants}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: "-40px" }}
                      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                    >
                      {saminContributions.map((item, idx) => (
                        <motion.div
                          key={idx}
                          variants={bentoCardVariants}
                          whileHover={{ y: -4 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          className="group relative"
                        >
                          <FlashlightCard 
                            className={`p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-white/10 ${item.borderColor} transition-all duration-300 space-y-3 h-full flex flex-col justify-between shadow-lg`}
                            glowColor="rgba(245, 158, 11, 0.12)"
                          >
                            <div className="space-y-3">
                              {/* Top Bar: Icon + Category Badge */}
                              <div className="flex items-start justify-between gap-2">
                                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.accentColor} border border-white/10 flex items-center justify-center ${item.iconColor} group-hover:scale-105 transition-transform duration-300 shadow-inner`}>
                                  <item.icon size={20} />
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-300">
                                  {item.badge}
                                </span>
                              </div>

                              {/* Title & Category */}
                              <div>
                                <p className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400/90">
                                  {item.category}
                                </p>
                                <h5 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors mt-0.5">
                                  {item.title}
                                </h5>
                              </div>

                              {/* Description */}
                              <p className="text-xs text-zinc-300/90 font-sans leading-relaxed">
                                {item.description}
                              </p>
                            </div>

                            {/* Subtle Active Accent Dot */}
                            <div className="pt-2 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-mono font-bold text-amber-400 flex items-center gap-1">
                                Verified Module <Check size={12} className="text-emerald-400" />
                              </span>
                            </div>
                          </FlashlightCard>
                        </motion.div>
                      ))}
                    </motion.div>

                  </div>

                </div>

              </div>

            </div>
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* IDEA REPRESENTERS & SYSTEM DEBUGGERS */}
        {/* ========================================================================= */}
        <section className="container mx-auto px-4 py-20 lg:py-28 space-y-16">
          <motion.div
            variants={sectionContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-60px" }}
            className="text-center space-y-3 max-w-2xl mx-auto"
          >
            <motion.span variants={fadeUpVariant} className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-amber-400">
              <Workflow size={12} /> Idea Representation & System Debugging
            </motion.span>
            <motion.h3 variants={fadeUpVariant} className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight uppercase font-display">
              Idea Representers & Debuggers
            </motion.h3>
            <motion.p variants={fadeUpVariant} className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed">
              Vital contributors who played an important role in representing core ideas, testing festival workflows, and debugging critical features to shape the website's current operational status.
            </motion.p>
          </motion.div>

          {/* 3-Column Staggered Holographic Pods */}
          <motion.div 
            variants={podsContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
          >
            {dynamicSupportingDevelopers.map((dev, index) => (
              <motion.div 
                key={index}
                variants={podCardVariants}
                whileHover={{ y: -6 }}
                transition={{ type: "spring", stiffness: 280, damping: 22 }}
                className="h-full"
              >
                <FlashlightCard 
                  className={`h-full rounded-3xl bg-zinc-950/80 border border-white/10 ${dev.borderColor} p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 group space-y-6 shadow-xl backdrop-blur-xl`}
                  glowColor={dev.glowColor}
                >
                  
                  {/* Image Container with Holographic Sheen */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5">
                    <Image 
                      src={dev.image} 
                      alt={dev.name}
                      fill
                      className="object-cover grayscale group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div className={`absolute inset-0 bg-gradient-to-tr ${dev.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                    
                    {/* Alias Pill Badge */}
                    <div className="absolute top-3.5 right-3.5 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-200 shadow-md">
                      {dev.alias}
                    </div>
                  </div>

                  {/* Bio & Details */}
                  <div className="space-y-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xl font-bold text-white group-hover:text-amber-300 transition-colors font-display">
                        {dev.name}
                      </h4>
                      <p className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-400 mt-0.5">
                        {dev.role}
                      </p>
                    </div>

                    <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                      {dev.bio}
                    </p>

                    {/* Skill Badges with Micro-Interactions */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {dev.skills.map((skill, sIdx) => (
                        <motion.span 
                          key={sIdx} 
                          whileHover={{ scale: 1.05 }}
                          className="px-2.5 py-1 rounded-md bg-white/[0.03] border border-white/5 hover:border-white/20 text-[10px] font-mono text-zinc-300 transition-colors cursor-default"
                        >
                          {skill}
                        </motion.span>
                      ))}
                    </div>
                  </div>

                  {/* Social Action Links */}
                  <div className="flex items-center gap-2.5 pt-4 border-t border-white/10">
                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.github} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors" 
                      title="GitHub"
                    >
                      <GithubIcon size={16} />
                    </motion.a>
                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.linkedin} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors" 
                      title="LinkedIn"
                    >
                      <LinkedinIcon size={16} />
                    </motion.a>
                    <motion.a 
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      href={dev.links.email} 
                      className="p-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white transition-colors" 
                      title="Email"
                    >
                      <Mail size={16} />
                    </motion.a>
                  </div>

                </FlashlightCard>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ========================================================================= */}
        {/* THE TECHNOLOGICAL CORE MATRIX */}
        {/* ========================================================================= */}
        <section className="relative bg-zinc-950/40 border-y border-white/5 py-24 overflow-hidden backdrop-blur-md">
          <div className="container mx-auto px-4">
            
            {/* Header */}
            <motion.div
              variants={sectionContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
              className="text-center mb-16 space-y-3"
            >
              <motion.span variants={fadeUpVariant} className="text-[10px] font-mono font-bold uppercase tracking-[0.3em] text-amber-400">
                Underlying Engine
              </motion.span>
              <motion.h3 variants={fadeUpVariant} className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase font-display">
                The Technological Architecture
              </motion.h3>
              <motion.div variants={fadeUpVariant} className="h-0.5 w-16 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-4" />
            </motion.div>
            
            {/* 4 Interactive Matrix Pillars Staggered Grid */}
            <motion.div 
              variants={techMatrixContainerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
            >
              {[
                { label: "App Architecture", icon: Layout, desc: "Next.js 15 App Router & Server Components", tag: "Frontend Stack" },
                { label: "Core Computation", icon: Code2, desc: "TypeScript with Strict Type-Safety & Validation", tag: "Logic Engine" },
                { label: "Cloud Database", icon: Database, desc: "Supabase, PostgreSQL & Realtime Webhooks", tag: "Data Persistence" },
                { label: "Design System", icon: Palette, desc: "Tailwind CSS, Mathematical Themes & Motion", tag: "UI Layer" }
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={techMatrixItemVariants}
                  whileHover={{ y: -5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="h-full"
                >
                  <FlashlightCard className="p-7 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-amber-500/30 transition-all text-center space-y-4 h-full flex flex-col justify-between shadow-lg">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-white/5 to-white/[0.02] border border-white/10 flex items-center justify-center mx-auto text-amber-400 shadow-inner group-hover:scale-105 transition-transform">
                      <item.icon size={26} />
                    </div>
                    <div>
                      <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400 block mb-1">
                        {item.tag}
                      </span>
                      <h4 className="text-white font-bold text-sm uppercase tracking-wide mb-1.5 font-display">
                        {item.label}
                      </h4>
                      <p className="text-zinc-300 text-xs font-sans leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </FlashlightCard>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* FOOTER SIGNATURE */}
        {/* ========================================================================= */}
        <footer className="py-24 text-center space-y-4">
          <motion.div 
            variants={sectionContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="space-y-3"
          >
            <motion.p variants={fadeUpVariant} className="text-zinc-400 text-xs font-black uppercase tracking-[0.6em] font-mono">
              Josephite Math Club
            </motion.p>
            <motion.p variants={fadeUpVariant} className="text-zinc-300 text-sm font-sans">
              Designed & Engineered by <span className="text-amber-400 font-bold">Samin Tausif</span> and the JMC Engineering Team.
            </motion.p>
            <motion.p variants={fadeUpVariant} className="text-zinc-500 text-xs font-serif italic pt-1">
              "Forged in code, dedicated to the infinite beauty of mathematics."
            </motion.p>
          </motion.div>
        </footer>

      </div>
    </div>
  );
}
