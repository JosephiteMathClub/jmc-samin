"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  markFestivalDatesInUserAccount, 
  getGoogleCalendarAllDaysUrl, 
  downloadIcsCalendar, 
  FESTIVAL_CALENDAR_EVENTS 
} from '../lib/calendar';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Sparkles, 
  User, 
  Users,
  BookOpen, 
  Layers, 
  Hash, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Phone, 
  QrCode, 
  Mail, 
  Calendar, 
  RefreshCw,
  Database,
  Search,
  Zap,
  Brain,
  FileText,
  Compass,
  Timer,
  Eye,
  Lock,
  HelpCircle,
  Grid,
  Award,
  Activity,
  Home,
  Share2,
  Smile,
  Image as ImageIcon,
  Edit,
  Construction,
  Layout,
  Globe,
  Building,
  Coins,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Film,
  Rocket,
  ExternalLink,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Upload,
  Plus,
  AlertTriangle,
  Download,
  MessageSquare,
  Ticket,
  X
} from 'lucide-react';
import { PurchaseSlipModal, PurchaseSlipCandidate } from '../components/dashboard/PurchaseSlipModal';

const DEFAULT_SEGMENT_BANNERS: Record<string, string> = {
  "Math Olympiad (Find-based)": "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
  "Math Olympiad (Proof-based)": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
  "IQ Test": "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80",
  "Human Calculator": "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80",
  "Genesis": "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  "Geometry Dash": "https://images.unsplash.com/photo-1509228627152-72ae946807b1?auto=format&fit=crop&w=1200&q=80",
  "Probability Pressure": "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80",
  "Murder Mystery": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80",
  "Crack the Code": "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80",
  "Complex Calamity": "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80",
  "Sudoku": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "Rubik’s Cube Showdown": "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80",
  "5 min Professor": "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80",
  "Calculus Bee": "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80",
  "Escape Room": "https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=1200&q=80",
  "Combi Verse": "https://images.unsplash.com/photo-1509228627152-72ae946807b1?auto=format&fit=crop&w=1200&q=80",
  "Math Memes": "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80",
  "Math Article": "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80",
  "Math Vision": "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80",
  "Math Drawing": "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80",
  "Truss": "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80",
  "Wall Magazine Display": "https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80"
};

const DEFAULT_SEGMENT_DESCRIPTIONS: Record<string, string> = {
  "Math Olympiad (Find-based)": "Test your numeric intuition and mathematical pattern recognition under time constraints. Find exact numerical values without writing long proofs.",
  "Math Olympiad (Proof-based)": "Demonstrate rigorous logical deduction and mathematical elegance by constructing full formal proofs across geometry, number theory, and algebra.",
  "IQ Test": "A rapid-fire series of spatial, visual, and analytical logic puzzles designed to evaluate fluid intelligence and cognitive processing speed.",
  "Human Calculator": "Battle time and mental fatigue in rapid mental math playoffs! Calculate complex multiplications, square roots, and percentages without scratch paper.",
  "Genesis": "Explore the origin stories of fundamental mathematical constants, geometric theorems, and historical mathematical breakthroughs.",
  "Geometry Dash": "Navigate spatial reasoning, coordinate plane geometry, circle theorems, and 3D vector geometry problems in a high-octane quiz format.",
  "Probability Pressure": "Calculate odds, permutations, combinations, and conditional probabilities under intense countdown timer pressure.",
  "Murder Mystery": "Channel your inner mathematical detective! Use cryptanalysis, logic grids, and probability elimination to solve a fictional crime scene case.",
  "Crack the Code": "Decrypt complex ciphers, frequency analysis substitution puzzles, binary strings, and modular arithmetic cryptography.",
  "Complex Calamity": "A specialized solo challenge tackling imaginary axes, Euler's formula, polar coordinates, and complex plane transformations.",
  "Sudoku": "Compete in speed-solving custom high-difficulty Sudoku grids, testing spatial placement and structural constraint solving.",
  "Rubik’s Cube Showdown": "Speedcubing tournament for 3x3, 4x4, and custom puzzle cubes. Speed, finger tricks, and algorithmic muscle memory win the day.",
  "5 min Professor": "Prepare and deliver a 5-minute concise presentation explaining an advanced or abstract mathematical topic to a panel of judges.",
  "Calculus Bee": "Live playoff competition calculating derivatives, definite integrals, differential equations, and limits on a whiteboard.",
  "Escape Room": "Team physical & mental escape room challenge. Solve locked chests, hidden mathematical ciphers, and physical puzzle locks to escape within 30 minutes.",
  "Combi Verse": "Deep dive into graph theory networks, pigeonhole principle, recurrence relations, and combinatorial game strategy.",
  "Math Memes": "Unleash your humor and witty mathematical intellect! Create hilarious, high-concept memes blending popular culture with mathematical theory.",
  "Math Article": "Write and submit an insightful research or expository paper highlighting a fascinating mathematical application or historical theorem.",
  "Math Vision": "Digital graphic design competition. Create stunning digital artwork illustrating mathematical fractals, golden spirals, or geometric art.",
  "Math Drawing": "Hand-drawn artistic competition. Sketch pristine artwork illustrating mathematical concepts, tessellations, or non-Euclidean geometry.",
  "Truss": "Engineering team competition! Build high-load structurally sound physical bridge trusses using popsicles and glue to withstand maximum mechanical weights.",
  "Wall Magazine Display": "Design an informative, visually captivating physical wall poster/magazine showcasing mathematical discoveries, history, or modern research."
};
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';

const ICON_LOOKUP: Record<string, any> = {
  Trophy, Brain, Zap, Sparkles, Compass, Timer, Eye, Lock, HelpCircle, Grid, Layers, Award, Activity, Home, Share2, Smile, BookOpen, ImageIcon, Edit, Construction, Layout, Calendar, Users
};

function getSegmentIconComponent(iconName?: string) {
  if (!iconName) return Trophy;
  return ICON_LOOKUP[iconName] || Trophy;
}

function getSegmentColorStyle(cat: string) {
  const norm = (cat || '').toLowerCase();
  if (norm.includes('team')) return "from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20";
  if (norm.includes('creative')) return "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20";
  if (norm.includes('writing')) return "from-zinc-500/10 to-slate-500/10 text-zinc-400 border-zinc-500/20";
  if (norm.includes('exhibition')) return "from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20";
  return "from-amber-500/10 to-yellow-500/10 text-amber-400 border-amber-500/20";
}

export function getCategoryFromClass(classVal: string): string | null {
  if (!classVal) return null;
  const numClass = parseInt(classVal, 10);
  if (isNaN(numClass)) {
    const lower = classVal.toLowerCase();
    if (lower.includes('primary') || lower.includes('3') || lower.includes('4') || lower.includes('5')) return 'Primary';
    if (lower.includes('junior') || lower.includes('6') || lower.includes('7') || lower.includes('8')) return 'Junior';
    if (lower.includes('secondary') && !lower.includes('higher')) return 'Secondary';
    if (lower.includes('higher') || lower.includes('hsc') || lower.includes('11') || lower.includes('12')) return 'Higher Secondary';
    return null;
  }
  if (numClass >= 3 && numClass <= 5) return "Primary";
  if (numClass >= 6 && numClass <= 8) return "Junior";
  if (numClass >= 9 && numClass <= 10) return "Secondary";
  if (numClass >= 11 && numClass <= 12) return "Higher Secondary";
  return null;
}

export function getCategoryClassRange(categories: string[]): string {
  const ranges: string[] = [];
  if (categories.includes("Primary")) ranges.push("Primary: Class 3–5");
  if (categories.includes("Junior")) ranges.push("Junior: Class 6–8");
  if (categories.includes("Secondary")) ranges.push("Secondary: Class 9–10");
  if (categories.includes("Higher Secondary")) ranges.push("Higher Secondary: Class 11–12");
  return ranges.join(", ");
}

// Hardcoded segments catalog as pristine baseline
export const FREE_INTER_SEGMENTS = new Set([
  "Math Olympiad (Find-based)",
  "Math Olympiad (Proof-based)",
  "Math Memes",
  "Math Article",
  "Math Vision"
]);

export function isFreeInterSegment(name: string): boolean {
  if (!name) return false;
  const norm = name.trim().toLowerCase();
  return Array.from(FREE_INTER_SEGMENTS).some(s => s.toLowerCase() === norm);
}

const DEFAULT_INTER_SEGMENTS = [
  { id: "Math Olympiad (Find-based)", name: "Math Olympiad (Find-based)", tagline: "Solve numeric mysteries and discover deep hidden structural patterns.", category: "Solo track", icon: Trophy, color: "from-amber-500/10 to-yellow-500/10 text-amber-400 border-amber-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Math Olympiad (Proof-based)", name: "Math Olympiad (Proof-based)", tagline: "Draft elegant formal proofs and logically sound explanations.", category: "Solo track", icon: FileText, color: "from-blue-500/10 to-cyan-500/10 text-blue-400 border-blue-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "IQ Test", name: "IQ Test", tagline: "Race against the clock in analytical speed reasoning.", category: "Solo track", icon: Brain, color: "from-pink-500/10 to-rose-500/10 text-pink-400 border-pink-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Human Calculator", name: "Human Calculator", tagline: "Unleash super-speed mental arithmetic and calculation loops.", category: "Solo track", icon: Zap, color: "from-green-500/10 to-emerald-500/10 text-green-400 border-green-500/20", allowedCategories: ["Primary", "Junior"], isTeamEvent: false, teamSize: 1 },
  { id: "Genesis", name: "Genesis", tagline: "Interactive math design and scientific origin-based discovery.", category: "Solo track", icon: Sparkles, color: "from-purple-500/10 to-violet-500/10 text-purple-400 border-purple-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Geometry Dash", name: "Geometry Dash", tagline: "Navigate space calculations, angle proofs, and vector mazes.", category: "Solo track", icon: Compass, color: "from-indigo-500/10 to-blue-500/10 text-indigo-400 border-indigo-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Probability Pressure", name: "Probability Pressure", tagline: "Calculate rapid-fire odds and stochastic outcomes under stress.", category: "Solo track", icon: Timer, color: "from-red-500/10 to-orange-500/10 text-red-400 border-red-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Murder Mystery", name: "Murder Mystery", tagline: "Deduce clues and crack mathematical murder mystery cases.", category: "Solo track", icon: Eye, color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20", isTeamEvent: false, teamSize: 1, allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"] },
  { id: "Crack the Code", name: "Crack the Code", tagline: "Deconstruct cryptographic ciphers and decode encrypted strings.", category: "Solo track", icon: Lock, color: "from-teal-500/10 to-emerald-500/10 text-teal-400 border-teal-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Complex Calamity", name: "Complex Calamity", tagline: "Grapple with complex numbers, imaginary axes, and fractals.", category: "Solo track", icon: HelpCircle, color: "from-amber-500/10 to-red-500/10 text-amber-400 border-amber-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Sudoku", name: "Sudoku", tagline: "Solve grid placement challenges with extreme speed precision.", category: "Solo track", icon: Grid, color: "from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Rubik’s Cube Showdown", name: "Rubik’s Cube Showdown", tagline: "Manipulate cubic modules and solve cubes in record times.", category: "Solo track", icon: Layers, color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "5 min Professor", name: "5 min Professor", tagline: "Deliver a lightning lecture explaining abstract concepts simply.", category: "Solo track", icon: Award, color: "from-yellow-500/10 to-orange-500/10 text-yellow-400 border-yellow-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Calculus Bee", name: "Calculus Bee", tagline: "Solve derivatives and integral equations in real-time playoffs.", category: "Solo track", icon: Activity, color: "from-red-500/10 to-rose-500/10 text-red-400 border-red-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Combi Verse", name: "Combi Verse", tagline: "Navigate combinatorics, permutations, graph theory networks.", category: "Solo track", icon: Share2, color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Singularity", name: "Singularity", tagline: "Explore boundary-pushing theoretical physics & abstract math problems.", category: "Solo track", icon: Sparkles, color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20", allowedCategories: ["Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Escape Room", name: "Escape Room", tagline: "Decrypt physical room locks and spatial logic systems (2 members).", category: "Team track", icon: Home, color: "from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: true, teamSize: 2 },
  { id: "Truss", name: "Truss", tagline: "Build high-load structurally sound physical bridge trusses (3 members).", category: "Team track", icon: Construction, color: "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: true, teamSize: 3 },
  { id: "Wall Magazine Display", name: "Wall Magazine Display", tagline: "Design physical wall posters mapping historical math breakthroughs (3 members).", category: "Team track", icon: Layout, color: "from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: true, teamSize: 3 },
  { id: "Tic-Tac-Toe", name: "Tic-Tac-Toe", tagline: "Strategic mathematical Tic-Tac-Toe grid playoffs (3 members, Primary & Junior).", category: "Team track", icon: Grid, color: "from-blue-500/10 to-cyan-500/10 text-blue-400 border-blue-500/20", allowedCategories: ["Primary", "Junior"], isTeamEvent: true, teamSize: 3 },
  { id: "Math Memes", name: "Math Memes", tagline: "Design humorous and intellectually witty math memes.", category: "Creative track", icon: Smile, color: "from-yellow-500/10 to-green-500/10 text-yellow-400 border-yellow-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Math Article", name: "Math Article", tagline: "Draft a well-researched article on advanced mathematical theories.", category: "Writing track", icon: BookOpen, color: "from-zinc-500/10 to-slate-500/10 text-zinc-400 border-zinc-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Math Vision", name: "Math Vision", tagline: "Design digital graphic art illustrating geometric formulas.", category: "Creative track", icon: ImageIcon, color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 },
  { id: "Math Drawing", name: "Math Drawing", tagline: "Create pristine hand-drawn sketches of golden ratios and fractals.", category: "Creative track", icon: Edit, color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20", allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"], isTeamEvent: false, teamSize: 1 }
];

export function isTeamSegment(id: string, segmentList?: any[]): boolean {
  if (!id) return false;
  const norm = id.trim().toLowerCase();
  if (norm.includes("murder mystery")) {
    return false;
  }
  if (norm.includes("escape room") || norm.includes("truss") || norm.includes("wall magazine") || norm.includes("tic-tac-toe") || norm.includes("tic tac toe")) {
    return true;
  }
  const list = (segmentList && Array.isArray(segmentList) && segmentList.length > 0) ? segmentList : DEFAULT_INTER_SEGMENTS;
  const seg = list.find((s: any) => (s.id || s.name) === id);
  if (seg && typeof seg.isTeamEvent === 'boolean') {
    return seg.isTeamEvent;
  }
  return false;
}

export function getSegmentTeamSize(id: string, segmentList?: any[]): number {
  if (!id) return 1;
  const norm = id.trim().toLowerCase();
  if (norm.includes("tic-tac-toe") || norm.includes("tic tac toe") || norm.includes("tictactoe") || norm.includes("truss") || norm.includes("wall magazine")) {
    return 3;
  }
  if (norm.includes("escape room")) {
    return 2;
  }
  const list = (segmentList && Array.isArray(segmentList) && segmentList.length > 0) ? segmentList : DEFAULT_INTER_SEGMENTS;
  const seg = list.find((s: any) => (s.id || s.name) === id);
  if (seg && seg.isTeamEvent) {
    return seg.teamSize || 3;
  }
  return 1;
}

export default function InterEventRegister() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const { content } = useContent();

  const [dbInterSegments, setDbInterSegments] = useState<any[] | null>(null);
  const [segmentBanners, setSegmentBanners] = useState<Record<string, string>>({});
  const [segmentDescriptions, setSegmentDescriptions] = useState<Record<string, string>>({});

  const INTER_SEGMENTS = React.useMemo(() => {
    const rawList = (Array.isArray(dbInterSegments) && dbInterSegments.length > 0)
      ? dbInterSegments
      : (Array.isArray(content?.interSegments) && content.interSegments.length > 0)
      ? content.interSegments
      : DEFAULT_INTER_SEGMENTS;

    return rawList.map((s: any) => {
      const segId = s.id || s.name || "";
      const norm = segId.toLowerCase();
      let isTeam = typeof s.isTeamEvent === 'boolean' ? s.isTeamEvent : false;
      if (norm.includes("murder mystery")) {
        isTeam = false;
      } else if (norm.includes("escape room") || norm.includes("truss") || norm.includes("wall magazine") || norm.includes("tic-tac-toe") || norm.includes("tic tac toe")) {
        isTeam = true;
      }

      let category = s.category || (isTeam ? "Team track" : "Solo track");

      let allowedCategories = Array.isArray(s.allowedCategories) && s.allowedCategories.length > 0
        ? s.allowedCategories
        : (norm.includes("human calculator")
            ? ["Primary", "Junior"]
            : (norm.includes("tic-tac-toe") || norm.includes("tic tac toe"))
              ? ["Primary", "Secondary", "Higher Secondary"]
              : (norm.includes("proof") || norm.includes("5 min") || norm.includes("calculus") || norm.includes("combi") || norm.includes("singularity") || norm.includes("geometry dash") || norm.includes("complex") || norm.includes("probability"))
                ? ["Secondary", "Higher Secondary"]
                : ["Primary", "Junior", "Secondary", "Higher Secondary"]);

      let teamSize = 1;
      if (isTeam) {
        if (norm.includes("tic-tac-toe") || norm.includes("tic tac toe") || norm.includes("tictactoe") || norm.includes("truss") || norm.includes("wall magazine")) {
          teamSize = 3;
        } else {
          teamSize = 2;
        }
      }

      return {
        id: segId,
        name: s.name || segId,
        tagline: s.tagline || "",
        category,
        allowedCategories,
        icon: typeof s.icon === 'string' ? getSegmentIconComponent(s.icon) : (s.icon || Trophy),
        isTeamEvent: isTeam,
        teamSize: teamSize,
        isFree: typeof s.isFree === 'boolean' ? s.isFree : isFreeInterSegment(s.name || segId),
        bannerUrl: s.bannerUrl || segmentBanners[s.name] || DEFAULT_SEGMENT_BANNERS[s.name] || DEFAULT_SEGMENT_BANNERS[segId] || "",
        description: s.description || segmentDescriptions[s.name] || DEFAULT_SEGMENT_DESCRIPTIONS[s.name] || DEFAULT_SEGMENT_DESCRIPTIONS[segId] || "",
        color: getSegmentColorStyle(category || s.name || segId)
      };
    });
  }, [dbInterSegments, content?.interSegments, segmentBanners, segmentDescriptions]);

  const checkIsTeamSegment = React.useCallback((id: string) => {
    return isTeamSegment(id, INTER_SEGMENTS);
  }, [INTER_SEGMENTS]);
  
  // Gatekeeper status & configurations
  const [checkingStatuses, setCheckingStatuses] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [regDocType, setRegDocType] = useState<'ticket' | 'verification_slip'>('verification_slip');
  
  // Settings values fetched from system settings
  const [bkashTarget, setBkashTarget] = useState("01789456123");
  const [paymentDesc, setPaymentDesc] = useState("Please pay BDT 100 registration fee to our bKash personal/merchant account. Highlighted Phone: 01789456123.");
  const [pricePerSegment, setPricePerSegment] = useState(100);
  const [caCodesList, setCaCodesList] = useState<string[]>([]);
  const [caCodeInputMode, setCaCodeInputMode] = useState<'selectable' | 'typing'>('selectable');
  const [showCaMangaBubble, setShowCaMangaBubble] = useState(false);
  const caInputContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Registration View Provider (Website Native Form vs. Tickify Portal Card)
  const [registrationProvider, setRegistrationProvider] = useState<'website' | 'tickify'>('website');
  const [tickifyUrl, setTickifyUrl] = useState<string>('');
  const [tickifyNoticeReason, setTickifyNoticeReason] = useState<string>(
    'Registration for the National Inter-School Math Olympiad & Festival has been relocated from the website to Tickify for seamless ticketing, automated seat allocation, and instant confirmation.'
  );

  const [expandedSegments, setExpandedSegments] = useState<string[]>([]);

  const toggleExpandSegment = (id: string) => {
    setExpandedSegments(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleExpandAllSegments = () => {
    if (expandedSegments.length === INTER_SEGMENTS.length) {
      setExpandedSegments([]);
    } else {
      setExpandedSegments(INTER_SEGMENTS.map((s: any) => s.id));
    }
  };

  // Launch, Video Teaser & Coming Soon States
  const [isEventPageLaunched, setIsEventPageLaunched] = useState(false);
  const [teaserVideoEnabled, setTeaserVideoEnabled] = useState(true);
  const [teaserVideoUrl, setTeaserVideoUrl] = useState("https://vjs.zencdn.net/v/oceans.mp4");
  const [showingVideo, setShowingVideo] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  
  // Video Player Controls & Fallback Recovery
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoFallbackIndex, setVideoFallbackIndex] = useState(0);
  const [videoHasError, setVideoHasError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);

  const videoRef = React.useRef<HTMLVideoElement | null>(null);
  const videoContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Presence of valid Email Address
  const [hasEmailAddress, setHasEmailAddress] = useState<boolean | null>(null);

  // Proxy / Spot Registration States
  const [isProxyRegistration, setIsProxyRegistration] = useState(false);
  const [proxyMethod, setProxyMethod] = useState<'email' | 'phone'>('email');
  const [proxyEmail, setProxyEmail] = useState('');
  const [proxyPhoneNumber, setProxyPhoneNumber] = useState('');
  const [proxyVerified, setProxyVerified] = useState(false);
  const [proxyUserExists, setProxyUserExists] = useState(false);
  const [proxyResolvedUserId, setProxyResolvedUserId] = useState<string | null>(null);
  const [checkingProxyEmail, setCheckingProxyEmail] = useState(false);
  const [proxyNameEditable, setProxyNameEditable] = useState(true);
  const [proxyGenderEditable, setProxyGenderEditable] = useState(true);
  const [proxyClassEditable, setProxyClassEditable] = useState(true);
  const [proxyInstituteEditable, setProxyInstituteEditable] = useState(true);
  const [proxyEmailEditable, setProxyEmailEditable] = useState(true);
  const [proxyPhoneEditable, setProxyPhoneEditable] = useState(true);
  
  // Registration form states
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState("");
  const [className, setClassName] = useState("");
  const [institute, setInstitute] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [caCode, setCaCode] = useState("N/A");

  // General Member 50% Discount States
  const [isGeneralMember, setIsGeneralMember] = useState(false);
  const [memberIdentifierInput, setMemberIdentifierInput] = useState('');
  const [verifyingMember, setVerifyingMember] = useState(false);
  const [memberVerifiedData, setMemberVerifiedData] = useState<{ memberName: string; memberId?: string } | null>(null);
  const [memberVerificationError, setMemberVerificationError] = useState<string | null>(null);
  
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);

  // Teammate 2 States (Name, Class, Institute, Gender required for team events)
  const [teamMember2Name, setTeamMember2Name] = useState('');
  const [teamMember2Class, setTeamMember2Class] = useState('');
  const [teamMember2Institute, setTeamMember2Institute] = useState('');
  const [teamMember2Gender, setTeamMember2Gender] = useState('');

  // Teammate 3 States (Name, Class, Institute, Gender required for 3-member team events)
  const [teamMember3Name, setTeamMember3Name] = useState('');
  const [teamMember3Class, setTeamMember3Class] = useState('');
  const [teamMember3Institute, setTeamMember3Institute] = useState('');
  const [teamMember3Gender, setTeamMember3Gender] = useState('');

  const checkIs3MemberSegment = React.useCallback((id: any) => {
    if (!id) return false;
    const rawStr = typeof id === 'string' ? id : (id?.id || id?.name || String(id));
    const norm = String(rawStr).trim().toLowerCase();
    if (
      norm.includes("tic") ||
      norm.includes("toe") ||
      norm.includes("tac") ||
      norm.includes("tictactoe") ||
      norm.includes("truss") ||
      norm.includes("wall magazine")
    ) {
      return true;
    }
    const seg = INTER_SEGMENTS.find((s: any) => 
      (s.id && String(s.id).trim().toLowerCase() === norm) || 
      (s.name && String(s.name).trim().toLowerCase() === norm)
    );
    if (seg) {
      const segNorm = (String(seg.id) + " " + String(seg.name)).toLowerCase();
      if (segNorm.includes("tic") || segNorm.includes("toe") || segNorm.includes("tac") || segNorm.includes("truss") || segNorm.includes("wall magazine") || seg.teamSize === 3 || seg.teamSize >= 3) {
        return true;
      }
    }
    return getSegmentTeamSize(rawStr, INTER_SEGMENTS) >= 3;
  }, [INTER_SEGMENTS]);

  const hasTeamSegment = selectedSegments.some(id => checkIsTeamSegment(id));
  const is3MemberTeamSegment = selectedSegments.some((id: any) => {
    if (!id) return false;
    const rawId = typeof id === 'string' ? id : (id?.id || id?.name || String(id));
    const s = String(rawId).toLowerCase();
    if (s.includes("tic") || s.includes("toe") || s.includes("tac") || s.includes("tictactoe")) {
      return true;
    }
    return checkIs3MemberSegment(id);
  });
  const hasOtherTeamSegment = selectedSegments.some(id => {
    return checkIsTeamSegment(id) && !checkIs3MemberSegment(id);
  });

  // Automatically reset teammate fields if team segments are deselected
  useEffect(() => {
    if (!hasTeamSegment) {
      setTeamMember2Name('');
      setTeamMember2Class('');
      setTeamMember2Institute('');
      setTeamMember2Gender('');
      setTeamMember3Name('');
      setTeamMember3Class('');
      setTeamMember3Institute('');
      setTeamMember3Gender('');
    } else if (!is3MemberTeamSegment) {
      setTeamMember3Name('');
      setTeamMember3Class('');
      setTeamMember3Institute('');
      setTeamMember3Gender('');
    }
  }, [hasTeamSegment, is3MemberTeamSegment]);

  // Helper function to validate segment class eligibility based on Category
  const isSegmentEligible = (segmentId: string, classVal: string): { eligible: boolean; reason?: string } => {
    if (!classVal) return { eligible: true };

    const studentCat = getCategoryFromClass(classVal);
    const seg = INTER_SEGMENTS.find((s: any) => s.id === segmentId || s.name === segmentId);

    if (seg) {
      const allowed = Array.isArray(seg.allowedCategories) && seg.allowedCategories.length > 0 
        ? seg.allowedCategories 
        : null;

      if (allowed && studentCat) {
        if (!allowed.includes(studentCat)) {
          return {
            eligible: false,
            reason: `${seg.name} is only available for: ${allowed.join(', ')} (${getCategoryClassRange(allowed)}). Your Class (${classVal}) belongs to ${studentCat}.`
          };
        }
        return { eligible: true };
      }
    }

    // Fallback checks
    const numClass = parseInt(classVal, 10);
    const norm = (segmentId || "").toLowerCase();

    if (norm.includes("tic-tac-toe") || norm.includes("tic tac toe")) {
      if (isNaN(numClass) || (studentCat !== "Primary" && studentCat !== "Junior")) {
        return {
          eligible: false,
          reason: "Tic-Tac-Toe is restricted to Primary (Class 3-5) & Junior (Class 6-8)."
        };
      }
    }

    return { eligible: true };
  };
  
  const [senderBkash, setSenderBkash] = useState("");
  const [trxnId, setTrxnId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Immediate Registration Check States
  const [checkingRegistration, setCheckingRegistration] = useState(false);
  const [isScanningDB, setIsScanningDB] = useState(false);
  const [alreadyRegisteredEvents, setAlreadyRegisteredEvents] = useState<string[]>([]);
  const [registeredStudentName, setRegisteredStudentName] = useState<string>('');
  const [showUnselectedWarningModal, setShowUnselectedWarningModal] = useState(false);
  const [pendingSubmissionConfirmed, setPendingSubmissionConfirmed] = useState(false);

  const checkRegistrationStatus = async (emailVal?: string, phoneVal?: string) => {
    const e = (emailVal !== undefined ? emailVal : email).trim();
    const p = (phoneVal !== undefined ? phoneVal : phone).trim();

    if (!e && (!p || p.length < 11)) {
      return;
    }

    setCheckingRegistration(true);
    try {
      const res = await fetch('/api/events/check-inter-registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: e, phone: p })
      });
      const data = await res.json();
      if (res.ok && data.registeredEvents) {
        const regs: string[] = data.registeredEvents || [];
        setAlreadyRegisteredEvents(regs);
        if (data.matchedName) {
          setRegisteredStudentName(data.matchedName);
          if (!fullName.trim()) setFullName(data.matchedName);
        }
        // Exclude already registered events from current selection
        setSelectedSegments(prev => prev.filter(id => !regs.includes(id)));
      }
    } catch (err) {
      console.error("Error checking inter event registration status:", err);
    } finally {
      setCheckingRegistration(false);
    }
  };

  // Helper to parse video URLs (Direct MP4, YouTube, Vimeo, Google Drive)
  const getVideoMediaInfo = (rawUrl: string, mutedState: boolean = true) => {
    if (!rawUrl || typeof rawUrl !== 'string') {
      return { type: 'none', url: '' };
    }

    const url = rawUrl.trim();

    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2] && ytMatch[2].length === 11) {
      const videoId = ytMatch[2];
      const origin = typeof window !== 'undefined' ? `&origin=${encodeURIComponent(window.location.origin)}` : '';
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=${mutedState ? 1 : 0}&controls=1&enablejsapi=1&rel=0&playsinline=1${origin}`
      };
    }

    // Vimeo
    const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch && vimeoMatch[3]) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&muted=${mutedState ? 1 : 0}&playsinline=1`
      };
    }

    // Google Drive
    if (url.includes('drive.google.com')) {
      const gdriveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/id=([a-zA-Z0-9_-]+)/);
      if (gdriveMatch && gdriveMatch[1]) {
        const fileId = gdriveMatch[1];
        return {
          type: 'gdrive',
          embedUrl: `https://drive.google.com/file/d/${fileId}/preview`
        };
      }
    }

    return {
      type: 'direct',
      url: url
    };
  };

  // Load gatekeepers and configuration parameters
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data: settings, error } = await supabase
          .from('system_settings')
          .select('key, value');

        if (error) throw error;

        let settingsMap: Record<string, any> = {};
        if (settings) {
          settings.forEach(item => {
            settingsMap[item.key] = item.value;
          });
        }

        const globalToggle = settingsMap['event_registration_enabled'];
        const interToggle = settingsMap['inter_registration_enabled'];
        const isGlobalOn = globalToggle !== false;
        const isInterOn = interToggle !== false;
        setIsLocked(!isGlobalOn || !isInterOn);

        const docTypeSetting = settingsMap['registration_document_type'];
        if (docTypeSetting) {
          setRegDocType(docTypeSetting === 'ticket' ? 'ticket' : 'verification_slip');
        }

        let configVal = settingsMap['inter_registration_config'];

        // Direct database query fallback if not found in array
        if (!configVal) {
          const { data: directData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'inter_registration_config')
            .maybeSingle();
          if (directData && directData.value) {
            configVal = directData.value;
          }
        }

        // Safely parse JSON string if value is stringified in DB
        if (typeof configVal === 'string') {
          try {
            configVal = JSON.parse(configVal);
          } catch (e) {
            console.warn("Could not parse inter_registration_config JSON string:", e);
          }
        }

        if (configVal && typeof configVal === 'object') {
          setBkashTarget(configVal.bkashNumber || "01789456123");
          if (configVal.paymentDescription) {
            let desc = String(configVal.paymentDescription).replace(/150/g, "100").replace(/per event segment/gi, "registration fee");
            setPaymentDesc(desc);
          }
          setPricePerSegment(100);
          if (Array.isArray(configVal.caCodes)) {
            setCaCodesList(configVal.caCodes);
          }
          if (configVal.caCodeInputMode === 'typing') {
            setCaCodeInputMode('typing');
          } else {
            setCaCodeInputMode('selectable');
          }

          if (configVal.registrationProvider === 'tickify') {
            setRegistrationProvider('tickify');
          } else {
            setRegistrationProvider('website');
          }

          if (configVal.tickifyUrl && typeof configVal.tickifyUrl === 'string') {
            setTickifyUrl(configVal.tickifyUrl.trim());
          }

          if (configVal.tickifyNoticeReason && typeof configVal.tickifyNoticeReason === 'string') {
            setTickifyNoticeReason(configVal.tickifyNoticeReason.trim());
          }

          if (configVal.segmentBanners && typeof configVal.segmentBanners === 'object') {
            setSegmentBanners(configVal.segmentBanners);
          }

          if (configVal.segmentDescriptions && typeof configVal.segmentDescriptions === 'object') {
            setSegmentDescriptions(configVal.segmentDescriptions);
          }

          if (Array.isArray(configVal.interSegments) && configVal.interSegments.length > 0) {
            setDbInterSegments(configVal.interSegments);
          }

          const launched = Boolean(configVal.isEventPageLaunched);
          setIsEventPageLaunched(launched);

          const enabled = configVal.teaserVideoEnabled !== false;
          setTeaserVideoEnabled(enabled);

          if (configVal.teaserVideoUrl && typeof configVal.teaserVideoUrl === 'string' && configVal.teaserVideoUrl.trim().length > 0) {
            setTeaserVideoUrl(configVal.teaserVideoUrl.trim());
          }

          if (launched || !enabled) {
            setShowingVideo(false);
          } else {
            setShowingVideo(true);
          }
        } else {
          setIsEventPageLaunched(false);
          setShowingVideo(true);
        }
      } catch (err) {
        console.warn("Failed to retrieve system settings gracefully:", err);
        setIsEventPageLaunched(false);
        setShowingVideo(true);
      } finally {
        setCheckingStatuses(false);
      }
    }
    loadConfig();
  }, []);

  // Programmatically trigger video playback when video overlay is active
  useEffect(() => {
    if (teaserVideoEnabled && showingVideo && !videoEnded && videoRef.current) {
      videoRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Autoplay deferred or handled by browser policy:", err?.message || String(err));
      });
    }
  }, [teaserVideoEnabled, showingVideo, videoEnded, teaserVideoUrl, videoFallbackIndex]);

  // Reset video state when URL changes
  useEffect(() => {
    setVideoFallbackIndex(0);
    setVideoHasError(false);
    setIsVideoLoading(true);
  }, [teaserVideoUrl]);

  // Safety timer to prevent black screen stuck states if video stalls or fails without error event
  useEffect(() => {
    if (teaserVideoEnabled && showingVideo && !videoEnded && isVideoLoading && !videoHasError) {
      const timer = setTimeout(() => {
        if (videoProgress === 0) {
          console.warn("Teaser video loading safety timeout reached. Trying fallback video source...");
          if (videoFallbackIndex < 2) {
            setVideoFallbackIndex(prev => prev + 1);
          } else {
            setVideoHasError(true);
            setIsVideoLoading(false);
          }
        }
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [teaserVideoEnabled, showingVideo, videoEnded, isVideoLoading, videoProgress, videoFallbackIndex, videoHasError]);

  // Video End and Fullscreen Audio Start Handlers
  const handleVideoEnd = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setVideoEnded(true);
    setShowingVideo(false);
  };

  // Close Manga Conversation Bubble when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        caInputContainerRef.current &&
        !caInputContainerRef.current.contains(event.target as Node)
      ) {
        setShowCaMangaBubble(false);
      }
    };

    if (showCaMangaBubble) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showCaMangaBubble]);

  const handleStartVideoWithAudio = () => {
    setHasStartedAudio(true);
    setIsMuted(false);

    if (videoRef.current) {
      videoRef.current.muted = false;
      videoRef.current.volume = 1.0;
      const playPromise = videoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.warn("Unmuted playback deferred or prevented by browser policy:", err?.message || String(err));
          if (videoRef.current) {
            videoRef.current.muted = true;
            setIsMuted(true);
            videoRef.current.play().catch(() => {});
          }
        });
      }
      setIsPlaying(true);
    }

    // Request fullscreen asynchronously so video play user gesture context is not lost
    if (videoContainerRef.current && videoContainerRef.current.requestFullscreen) {
      videoContainerRef.current.requestFullscreen().catch(e => {
        console.warn("Fullscreen request warning (e.g. iframe sandbox or policy):", e?.message || String(e));
      });
    }
  };

  const toggleVideoPlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const toggleVideoMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleVideoFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoContainerRef.current.requestFullscreen?.().catch(() => {});
    }
  };

  // Direct Admin Launch Handler
  const handleAdminLaunchPage = async () => {
    try {
      const { data: currentSetting } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'inter_registration_config')
        .maybeSingle();

      const existingVal = currentSetting?.value || {};
      const updatedVal = {
        ...existingVal,
        isEventPageLaunched: true
      };

      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'inter_registration_config',
          value: updatedVal,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      setIsEventPageLaunched(true);
      setShowingVideo(false);
      setVideoEnded(true);
      alert("🚀 EVENT PAGE LAUNCH INITIATED! Registration portal is now live for all visitors.");
    } catch (err: any) {
      console.error("Failed to launch page:", err);
      alert("Failed to initiate launch: " + (err.message || "Check connection"));
    }
  };

  // Fetch logged-in user's member details and auto-populate
  useEffect(() => {
    async function fetchLoggedMemberInfo() {
      if (!user || !isSupabaseConfigured) {
        return;
      }
      try {
        const { data: memberData } = await supabase
          .from('member')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const { data: ecData } = await supabase
          .from('ec_member')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const activeData = ecData || memberData;

        if (activeData) {
          if (activeData.full_name) setFullName(activeData.full_name);
          if (activeData.gender) setGender(activeData.gender);
          if (activeData.class) setClassName(activeData.class);
          if (activeData.school) {
            setInstitute(activeData.school);
          } else if (activeData.section) {
            setInstitute(activeData.section);
          }
          if (activeData.phone) setPhone(activeData.phone);
          if (activeData.roll) setCaCode(activeData.roll);
        }

        // Handle email resolution
        const userEmail = user.email || '';
        if (userEmail) {
          if (userEmail.endsWith('@josephitre.club')) {
            // registered using phone number only
            setHasEmailAddress(false);
            setEmail('');
            if (!activeData?.phone) {
              const prefix = userEmail.split('@')[0];
              if (/^[0-9]+$/.test(prefix) && prefix.length >= 11) {
                setPhone(prefix);
              }
            }
          } else {
            // chose email address for registration
            setHasEmailAddress(true);
            setEmail(userEmail);
          }
        }

        // Trigger real-time check for existing registrations
        checkRegistrationStatus(userEmail.endsWith('@josephitre.club') ? '' : userEmail, activeData?.phone || '');
      } catch (err) {
        console.error("Error fetching logged-in member info in InterEventRegister:", err);
      }
    }

    if (user) {
      fetchLoggedMemberInfo();
    }
  }, [user]);

  const checkEmailSilently = async (emailToCheck: string) => {
    if (!emailToCheck || !emailToCheck.includes('@')) return;
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', emailToCheck.trim().toLowerCase())
        .maybeSingle();

      if (profileData) {
        // Check member table
        const { data: memberData } = await supabase
          .from('member')
          .select('phone')
          .eq('id', profileData.id)
          .maybeSingle();

        if (memberData && memberData.phone) {
          setPhone(memberData.phone);
          return;
        }

        // Check ec_member table
        const { data: ecData } = await supabase
          .from('ec_member')
          .select('phone')
          .eq('id', profileData.id)
          .maybeSingle();

        if (ecData && ecData.phone) {
          setPhone(ecData.phone);
        }
      }
    } catch (err) {
      console.error("Silent check error:", err);
    }
  };

  const handleToggleProxy = (enable: boolean) => {
    setIsProxyRegistration(enable);
    setProxyVerified(false);
    setProxyUserExists(false);
    setProxyResolvedUserId(null);
    setProxyEmail('');
    setProxyPhoneNumber('');
    
    // Reset standard form fields
    setFullName('');
    setGender('');
    setClassName('');
    setInstitute('');
    setCaCode('N/A');
    setEmail('');
    setPhone('');
    setErrorMessage('');
    setHasEmailAddress(null);
    setProxyGenderEditable(true);
  };

  const handleVerifyProxyEmail = async () => {
    let trimmedInput = '';
    if (proxyMethod === 'phone') {
      trimmedInput = (proxyPhoneNumber || '').trim();
      if (!trimmedInput || trimmedInput.length < 11) {
        setErrorMessage("Please enter a valid student phone number (at least 11 digits).");
        return;
      }
    } else {
      trimmedInput = (proxyEmail || '').trim();
      if (!trimmedInput) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
      const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);
      if (!isPhoneInput && !trimmedInput.includes('@')) {
        setErrorMessage("Please enter a valid email address.");
        return;
      }
    }

    setCheckingProxyEmail(true);
    setErrorMessage("");
    try {
      let profileCheck = null;
      let memberCheck = null;
      let ecCheck = null;
      const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);

      if (proxyMethod === 'phone') {
        // Search by phone
        const { data: mCheck } = await supabase
          .from('member')
          .select('*')
          .eq('phone', trimmedInput)
          .maybeSingle();
        memberCheck = mCheck;

        const { data: eCheck } = await supabase
          .from('ec_member')
          .select('*')
          .eq('phone', trimmedInput)
          .maybeSingle();
        ecCheck = eCheck;

        const resolvedId = ecCheck?.id || memberCheck?.id;
        if (resolvedId) {
          const { data: pCheck } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', resolvedId)
            .maybeSingle();
          profileCheck = pCheck;
        } else {
          // Check profiles if there's an account with email: phone@josephitre.club
          const { data: pCheck } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', `${trimmedInput}@josephitre.club`)
            .maybeSingle();
          profileCheck = pCheck;
          if (profileCheck) {
            const { data: mCheck } = await supabase
              .from('member')
              .select('*')
              .eq('id', profileCheck.id)
              .maybeSingle();
            memberCheck = mCheck;
          }
        }
      } else {
        // Search by email
        let emailToCheck = trimmedInput.toLowerCase();
        const originalPhone = trimmedInput;

        if (isPhoneInput) {
          emailToCheck = `${trimmedInput.toLowerCase()}@josephitre.club`;
        }
        
        const { data: pCheck, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailToCheck)
          .maybeSingle();

        if (pError) throw pError;
        profileCheck = pCheck;

        const { data: mCheck } = await supabase
          .from('member')
          .select('*')
          .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}${isPhoneInput ? `,phone.eq.${originalPhone}` : ''}`)
          .maybeSingle();
        memberCheck = mCheck;

        const { data: eCheck } = await supabase
          .from('ec_member')
          .select('*')
          .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}${isPhoneInput ? `,phone.eq.${originalPhone}` : ''}`)
          .maybeSingle();
        ecCheck = eCheck;
      }

      const activeMember = ecCheck || memberCheck;
      
      if (profileCheck || activeMember) {
        const matchedName = activeMember?.full_name || profileCheck?.full_name || '';
        const matchedGender = activeMember?.gender || profileCheck?.gender || '';
        const matchedClass = activeMember?.class || '';
        const matchedSection = activeMember?.section || ''; // For inter events, section is school name
        const matchedRoll = activeMember?.roll || ''; // For inter events, roll is ca code
        const matchedPhone = activeMember?.phone || '';
        const matchedEmail = activeMember?.email_address || activeMember?.email || profileCheck?.email || '';

        setFullName(matchedName);
        if (matchedGender) setGender(matchedGender);
        setClassName(matchedClass);
        setInstitute(matchedSection || activeMember?.school || '');
        setCaCode(matchedRoll || 'N/A');
        
        if (matchedEmail && !matchedEmail.endsWith('@josephitre.club')) {
          setHasEmailAddress(true);
          setEmail(matchedEmail);
        } else {
          setHasEmailAddress(false);
          setEmail('');
        }
        setPhone(matchedPhone || (proxyMethod === 'phone' ? trimmedInput : ''));
        
        setProxyPhoneNumber(matchedPhone || (proxyMethod === 'phone' ? trimmedInput : ''));
        setProxyEmail(matchedEmail || (proxyMethod === 'email' ? trimmedInput : ''));
        setProxyResolvedUserId(profileCheck?.id || activeMember?.id || null);
        setProxyUserExists(true);
        setProxyVerified(true);

        // Editability
        setProxyNameEditable(!matchedName);
        setProxyGenderEditable(!matchedGender);
        setProxyClassEditable(!matchedClass);
        setProxyInstituteEditable(!(matchedSection || activeMember?.school));
        setProxyEmailEditable(!matchedEmail);
        setProxyPhoneEditable(!matchedPhone);

        setErrorMessage("");
      } else {
        setProxyUserExists(false);
        setProxyVerified(true);
        setProxyResolvedUserId(null);
        setFullName('');
        setClassName('');
        setInstitute('');
        setCaCode('N/A');
        
        if (proxyMethod === 'phone') {
          setPhone(trimmedInput);
          setProxyPhoneNumber(trimmedInput);
          setEmail('');
          setHasEmailAddress(null); // Will ask the admin: Does the student have a valid email?
        } else {
          setEmail(trimmedInput);
          setProxyEmail(trimmedInput);
          setPhone('');
          setProxyPhoneNumber('');
          setHasEmailAddress(true); // Since they searched by email, they must have one
        }

        // In spot mode, everything is editable
        setProxyNameEditable(true);
        setProxyClassEditable(true);
        setProxyInstituteEditable(true);
        setProxyEmailEditable(true);
        setProxyPhoneEditable(true);

        setErrorMessage("");
      }
    } catch (err: any) {
      console.error("Error verifying proxy email:", err);
      setErrorMessage("Proxy verification failed: " + err.message);
    } finally {
      setCheckingProxyEmail(false);
    }
  };

  // Verify General Member for 50% discount
  const handleVerifyGeneralMember = async () => {
    const targetIdentifier = memberIdentifierInput.trim() || email.trim() || phone.trim();
    if (!targetIdentifier) {
      setMemberVerificationError("Please enter your registered phone number or email address.");
      return;
    }
    setVerifyingMember(true);
    setMemberVerificationError(null);
    try {
      const res = await fetch("/api/verify-general-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: targetIdentifier }),
      });
      const data = await res.json();
      if (data.success && data.isMember) {
        setIsGeneralMember(true);
        setMemberVerifiedData({
          memberName: data.memberName,
          memberId: data.memberId,
        });
        setMemberVerificationError(null);
      } else {
        setIsGeneralMember(false);
        setMemberVerifiedData(null);
        setMemberVerificationError(data.message || "Member record not found. Please check your email or phone number.");
      }
    } catch (err: any) {
      console.error("Error verifying general member:", err);
      setIsGeneralMember(false);
      setMemberVerifiedData(null);
      setMemberVerificationError("Verification failed. Please try again.");
    } finally {
      setVerifyingMember(false);
    }
  };

  // Cost calculation
  const paidSelectedSegments = selectedSegments.filter(id => !isFreeInterSegment(id));
  const paidSoloSegments = paidSelectedSegments.filter(id => !checkIsTeamSegment(id));
  const paidTeamSegments = paidSelectedSegments.filter(id => checkIsTeamSegment(id));

  const soloFee = paidSoloSegments.length > 0 ? 100 : 0;
  const teamCount = paidTeamSegments.length;
  const teamFee = teamCount * 200; // 1 = 200, 2 = 400, 3 = 600, 4 = 800 BDT

  const totalRawPrice = teamFee + soloFee;

  const hasCaDiscount = false;
  const discountAmount = isGeneralMember ? Math.round(totalRawPrice * 0.5) : 0;
  const finalPrice = Math.max(0, totalRawPrice - discountAmount);
  const isOnlyFreeSegments = selectedSegments.length > 0 && paidSelectedSegments.length === 0;

  // Toggle selection
  const handleToggleSegment = (id: string) => {
    if (alreadyRegisteredEvents.includes(id)) {
      setErrorMessage(`You have already registered for ${id} in a previous submission.`);
      return;
    }
    const eligibility = isSegmentEligible(id, className);
    if (!eligibility.eligible) {
      setErrorMessage(eligibility.reason || "This segment is not eligible for your selected class level.");
      return;
    }
    setErrorMessage("");
    if (selectedSegments.includes(id)) {
      setSelectedSegments(selectedSegments.filter(s => s !== id));
    } else {
      setSelectedSegments([...selectedSegments, id]);
    }
  };

  // Select all / Deselect all events (Solo events only)
  const handleSelectAllSegments = () => {
    const eligibleSoloIds = INTER_SEGMENTS
      .filter((seg: any) => !checkIsTeamSegment(seg.id) && isSegmentEligible(seg.id, className).eligible && !alreadyRegisteredEvents.includes(seg.id))
      .map((seg: any) => seg.id);

    const allSoloSelected = eligibleSoloIds.length > 0 && eligibleSoloIds.every((id: string) => selectedSegments.includes(id));

    if (allSoloSelected) {
      // Deselect solo events, keeping manually selected team events
      setSelectedSegments(selectedSegments.filter((id: string) => checkIsTeamSegment(id)));
    } else {
      // Select all eligible solo events excluding already registered ones
      const teamSelected = selectedSegments.filter((id: string) => checkIsTeamSegment(id));
      setSelectedSegments([...teamSelected, ...eligibleSoloIds]);
    }
  };

  // Navigations
  const handleNextStep1 = async () => {
    if (isProxyRegistration && !proxyVerified) {
      setErrorMessage("Please enter and verify student credentials first using the Search button.");
      return;
    }

    const emailRequired = hasEmailAddress !== false;

    if (!fullName.trim() || !gender || !className || !institute.trim() || (emailRequired && !email.trim()) || !phone.trim()) {
      setErrorMessage("Please complete all general information fields (including Gender) before continuing.");
      return;
    }
    
    // Simple email regex validation
    if (emailRequired) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setErrorMessage("Please provide a valid email address.");
        return;
      }
    }

    // Phone format validation
    if (phone.trim().length < 11) {
      setErrorMessage("Please provide a valid 11-digit phone number.");
      return;
    }

    setErrorMessage("");
    setIsScanningDB(true);

    try {
      // Perform immediate registration status check
      await checkRegistrationStatus(email, phone);

      // Verify if already fully registered
      const eligibleForClass = INTER_SEGMENTS
        .filter((seg: any) => isSegmentEligible(seg.id, className).eligible)
        .map((seg: any) => seg.id);

      const isFullyReg = eligibleForClass.length > 0 && eligibleForClass.every((id: string) => alreadyRegisteredEvents.includes(id));
      
      if (isFullyReg) {
        setErrorMessage("Notice: You are already registered for all available events for your class level.");
        setIsScanningDB(false);
        return;
      }

      // Smooth brief pause so user notices scan completion before navigating to step 2
      await new Promise(r => setTimeout(r, 600));
      setStep(2);
    } catch (err) {
      console.error("Error checking database registration status:", err);
    } finally {
      setIsScanningDB(false);
    }
  };

  const handleAttemptRegister = () => {
    if (isProxyRegistration && !proxyVerified) {
      setErrorMessage("Please search and verify student credentials before submitting.");
      return;
    }

    if (!isProxyRegistration && finalPrice > 0 && (!senderBkash.trim() || !trxnId.trim())) {
      setErrorMessage("Please provide your bKash sender number and the transaction ID.");
      return;
    }

    const eligibleForClass = INTER_SEGMENTS
      .filter((seg: any) => isSegmentEligible(seg.id, className).eligible)
      .map((seg: any) => seg.id);

    const unselected = eligibleForClass.filter(
      (id: string) => !selectedSegments.includes(id) && !alreadyRegisteredEvents.includes(id)
    );

    if (unselected.length > 0 && !pendingSubmissionConfirmed) {
      setShowUnselectedWarningModal(true);
      return;
    }

    handleRegister();
  };

  const handleNextStep2 = () => {
    if (selectedSegments.length === 0) {
      setErrorMessage("You must select at least one mathematical event segment to register.");
      return;
    }

    if (hasTeamSegment) {
      const tm2Inst = teamMember2Institute.trim() || institute.trim();
      if (!teamMember2Name.trim() || !teamMember2Class || !tm2Inst || !teamMember2Gender) {
        setErrorMessage("Please fill all required details (Name, Class, Institute, and Gender) for Teammate 1.");
        return;
      }

      if (is3MemberTeamSegment) {
        const tm3Inst = teamMember3Institute.trim() || institute.trim();
        if (!teamMember3Name.trim() || !teamMember3Class || !tm3Inst || !teamMember3Gender) {
          setErrorMessage("Please fill all required details (Name, Class, Institute, and Gender) for Teammate 2 (Required for 3-member team events: Tic-Tac-Toe, Truss, Wall Magazine).");
          return;
        }
      }
    }

    setErrorMessage("");
    setStep(3);
  };

  const handleRegister = async () => {
    if (isProxyRegistration && !proxyVerified) {
      setErrorMessage("Please search and verify student credentials before submitting.");
      return;
    }

    if (!isProxyRegistration && finalPrice > 0 && (!senderBkash.trim() || !trxnId.trim())) {
      setErrorMessage("Please provide your bKash sender number and the transaction ID.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      let resolvedUserId = null;

      const finalEmail = hasEmailAddress === false
        ? `${(isProxyRegistration ? proxyPhoneNumber : phone).trim()}@josephitre.club`
        : (isProxyRegistration 
            ? (proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : proxyEmail.trim()) 
            : email.trim());

      // For proxy registration, if user does not exist, auto-create spot account!
      if (isProxyRegistration) {
        if (!proxyUserExists || !proxyResolvedUserId) {
          const resolvedProxyEmail = hasEmailAddress === false 
            ? `${proxyPhoneNumber.trim()}@josephitre.club` 
            : (proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : proxyEmail.trim());
          
          const createRes = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: resolvedProxyEmail,
              password: proxyPhoneNumber.trim(),
              fullName: fullName.trim(),
              usePhoneAsLogin: hasEmailAddress === false || proxyMethod === 'phone'
            })
          });

          const createData = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createData.error || "Failed to create spot registration user account.");
          }

          if (!createData.userId) {
            throw new Error("No user ID returned from spot account creation.");
          }

          resolvedUserId = createData.userId;
        } else {
          resolvedUserId = proxyResolvedUserId;
        }
      }

      const teammatesList = [];
      if (hasTeamSegment) {
        if (teamMember2Name.trim()) {
          teammatesList.push({
            fullName: teamMember2Name.trim(),
            className: teamMember2Class || className,
            institute: (teamMember2Institute.trim() || institute.trim()),
            gender: teamMember2Gender
          });
        }
        if (teamMember3Name.trim()) {
          teammatesList.push({
            fullName: teamMember3Name.trim(),
            className: teamMember3Class || className,
            institute: (teamMember3Institute.trim() || institute.trim()),
            gender: teamMember3Gender
          });
        }
      }

      const finalBkash = isProxyRegistration 
        ? 'Proxy (Admin)' 
        : (finalPrice === 0 ? (senderBkash.trim() || 'N/A - FREE ENTRY') : senderBkash.trim());

      const finalTrxn = isProxyRegistration 
        ? 'PROXY-' + Math.random().toString(36).substring(2, 9).toUpperCase() 
        : (finalPrice === 0 ? (trxnId.trim().toUpperCase() || ('FREE-INTER-' + Math.floor(100000 + Math.random() * 900000).toString())) : trxnId.trim().toUpperCase());

      const resolvedSelectedEventNames = selectedSegments.map((id: string) => {
        const seg = INTER_SEGMENTS.find((s: any) => s.id === id || s.name === id);
        if (seg && seg.name && !seg.name.startsWith('Segment-')) {
          return seg.name;
        }
        if (/^segment-\d+$/i.test(id) || id.startsWith('Segment-')) {
          return "Tic-Tac-Toe";
        }
        return id;
      });

      // CA Code validation & voiding logic
      let resolvedCaCode: string | null = caCode ? caCode.trim().toLowerCase().replace(/\s+/g, '') : null;
      if (resolvedCaCode && resolvedCaCode !== 'n/a') {
        if (caCodeInputMode === 'typing' && caCodesList.length > 0) {
          const isValidCa = caCodesList.some(
            (c: string) => c.trim().toLowerCase().replace(/\s+/g, '') === resolvedCaCode
          );
          if (!isValidCa) {
            resolvedCaCode = null; // Unconfirmed/unregistered CA code is voided
          }
        }
      } else {
        resolvedCaCode = null;
      }

      const response = await fetch('/api/events/register-inter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          gender,
          email: finalEmail,
          phone: isProxyRegistration ? proxyPhoneNumber.trim() : phone.trim(),
          className,
          institute: institute.trim(),
          caCode: resolvedCaCode,
          bkashNumber: finalBkash,
          trxnid: finalTrxn,
          amount: finalPrice,
          selectedEvents: resolvedSelectedEventNames,
          isProxyRegistration: isProxyRegistration,
          userId: resolvedUserId,
          teammatesList
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "A database connectivity or registration error occurred.");
      }

      // Update email state with finalEmail so success panel reflects virtual email correctly
      setEmail(finalEmail);

      // Automatically mark festival dates (24, 25, 26 September 2026) in user account calendar
      markFestivalDatesInUserAccount(finalEmail);

      setSuccessInfo(resData);
      setIsSuccess(true);
      setShowSlipModal(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TEASER INTRO VIDEO OVERLAY (Pre-Launch Mode & Initial Entrance)
  if (!isEventPageLaunched && teaserVideoEnabled && showingVideo && !videoEnded) {
    const videoMedia = getVideoMediaInfo(teaserVideoUrl, isMuted);

    const directFallbacks = Array.from(new Set([
      videoMedia.url,
      "https://vjs.zencdn.net/v/oceans.mp4",
      "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"
    ].filter(Boolean)));

    const activeDirectUrl = directFallbacks[videoFallbackIndex] || directFallbacks[0] || "https://vjs.zencdn.net/v/oceans.mp4";

    return (
      <div 
        ref={videoContainerRef}
        className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans"
      >
        {/* Fullscreen Video Element or Embed Iframe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          {videoMedia.type === 'direct' ? (
            !videoHasError ? (
              <video
                ref={videoRef}
                key={activeDirectUrl}
                src={activeDirectUrl}
                autoPlay
                playsInline
                preload="auto"
                muted={isMuted}
                onEnded={handleVideoEnd}
                onCanPlay={() => setIsVideoLoading(false)}
                onPlaying={() => setIsVideoLoading(false)}
                onWaiting={() => setIsVideoLoading(true)}
                onError={() => {
                  console.warn("Direct video stream error at index:", videoFallbackIndex, activeDirectUrl);
                  if (videoFallbackIndex < directFallbacks.length - 1) {
                    setVideoFallbackIndex(prev => prev + 1);
                    setIsVideoLoading(true);
                  } else {
                    setVideoHasError(true);
                    setIsVideoLoading(false);
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current && videoRef.current.duration) {
                    const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                    setVideoProgress(isNaN(pct) ? 0 : pct);
                    if (pct > 0) setIsVideoLoading(false);
                  }
                }}
                className="w-full h-full object-contain pointer-events-auto"
              />
            ) : null
          ) : (
            <iframe
              key={videoMedia.embedUrl}
              src={videoMedia.embedUrl}
              title="Teaser Video"
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              allowFullScreen
              onLoad={() => setIsVideoLoading(false)}
            />
          )}

          {/* Buffering Loader Overlay */}
          {isVideoLoading && !videoHasError && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white gap-3">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-300 font-bold">Loading Event Teaser...</span>
            </div>
          )}

          {/* Stream Recovery / Error View */}
          {videoHasError && (
            <div className="relative z-30 max-w-md w-full mx-auto p-8 rounded-3xl bg-zinc-900/90 border border-white/10 backdrop-blur-xl text-center space-y-6 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400">
                <Play className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">2nd National Inter-School Championship</h3>
                <p className="text-xs text-zinc-400 mt-2 leading-relaxed">
                  The teaser video stream is taking longer than expected to load on this connection.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleVideoEnd}
                  className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg shadow-pink-500/20 flex items-center justify-center gap-2"
                >
                  <span>PROCEED TO REGISTRATION PORTAL</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setVideoFallbackIndex(0);
                    setVideoHasError(false);
                    setIsVideoLoading(true);
                  }}
                  className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 font-bold text-xs uppercase tracking-wider rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  RETRY PLAYBACK
                </button>
              </div>
            </div>
          )}
        </div>

        {/* TOP BAR OVERLAY */}
        <div className="relative z-20 p-6 md:p-8 flex items-center justify-between bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center text-pink-400 font-black text-xs">
              JMC
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 font-mono block">OFFICIAL EVENT TEASER</span>
              <h2 className="text-sm font-black text-white uppercase tracking-tight">2nd National Inter-School Mathematics Championship</h2>
            </div>
          </div>

          <button
            onClick={handleVideoEnd}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full text-xs font-black uppercase tracking-widest transition-all cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 shadow-2xl"
          >
            SKIP INTRO <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* FLOATING AUDIO & FULLSCREEN ACTION PILL (Un-obscured floating prompt) */}
        {!hasStartedAudio && (
          <div className="relative z-30 flex justify-center my-auto pointer-events-auto px-4">
            <button
              onClick={handleStartVideoWithAudio}
              className="px-8 py-4 bg-gradient-to-r from-pink-600 via-rose-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-2xl shadow-pink-500/50 border border-pink-400/40 flex items-center gap-3 transition-all cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
            >
              <Volume2 className="w-5 h-5 text-white" />
              <span>TAP FOR FULL SOUND & FULLSCREEN</span>
            </button>
          </div>
        )}

        {/* BOTTOM CONTROLS & PROGRESS OVERLAY */}
        <div className="relative z-20 p-6 md:p-8 space-y-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent">
          {/* Progress Bar */}
          <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 transition-all duration-300"
              style={{ width: `${videoProgress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-400 font-mono">
            <div className="flex items-center gap-4">
              <button 
                onClick={toggleVideoPlay}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
              >
                {isPlaying ? <Pause className="w-4 h-4 text-pink-400" /> : <Play className="w-4 h-4 text-pink-400" />}
                {isPlaying ? "PAUSE" : "PLAY"}
              </button>

              <button 
                onClick={toggleVideoMute}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                {isMuted ? "UNMUTE" : "MUTE SOUND"}
              </button>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleVideoFullscreen}
                className="hover:text-white transition-colors cursor-pointer flex items-center gap-1.5 font-bold"
              >
                <Maximize className="w-4 h-4" /> FULLSCREEN
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (checkingStatuses) {
    return (
      <div className="min-h-screen bg-[#020205] flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-pink-500 mx-auto" />
          <p className="text-xs font-black uppercase tracking-widest text-zinc-500 font-mono">Initializing Registration Gateways...</p>
        </div>
      </div>
    );
  }

  // COMING SOON WINDOW (Pre-Launch Mode)
  if (!isEventPageLaunched) {
    return (
      <div className="min-h-screen bg-[#020205] text-white selection:bg-pink-500/30 font-sans pb-20">
        {/* Top Header Navigation */}
        <div className="border-b border-white/10 bg-black/40 backdrop-blur-xl sticky top-0 z-50 px-6 py-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-[10px] font-mono font-black uppercase tracking-widest">
              ⏳ PRE-LAUNCH TEASER MODE
            </span>
          </div>
        </div>

        {/* Hero Banner Area */}
        <div className="relative pt-16 pb-12 px-6 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-full">
            <Sparkles className="w-4 h-4 text-pink-400 animate-spin" />
            <span className="text-xs font-black uppercase tracking-widest text-pink-300">
              OFFICIAL EVENT COMING SOON
            </span>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl md:text-6xl font-black tracking-tight text-white uppercase leading-tight">
              2nd National Inter-School<br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-rose-400 to-purple-500">
                Mathematics Championship
              </span>
            </h1>
            <p className="text-zinc-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
              Bangladesh’s most awaited inter-school mathematics festival hosted by Josephite Math Club at St. Joseph Higher Secondary School.
            </p>
          </div>

          {/* Super Admin Status Badge & Action Controls */}
          <div className="bg-zinc-950/80 border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto space-y-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full blur-3xl" />
            
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400">
                REGISTRATION STATUS
              </span>
              <h3 className="text-lg font-black text-white uppercase tracking-wider">
                Registration Opening Shortly
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed">
                The official inter event registration portal will go live as soon as the Super Admin initiates the Event Page Launch. In the meantime, preview the segment details below or re-watch the teaser video!
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => {
                  setVideoEnded(false);
                  setShowingVideo(true);
                  setHasStartedAudio(false);
                }}
                className="w-full sm:w-auto px-6 py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105"
              >
                <Film className="w-4 h-4" /> RE-WATCH INTRO VIDEO TEASER
              </button>

              <a
                href="#segments"
                className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
              >
                <Trophy className="w-4 h-4 text-amber-400" /> EXPLORE 22 SEGMENTS
              </a>
            </div>

            {/* SUPER ADMIN QUICK LAUNCH TRIGGER IF LOGGED IN */}
            {(isAdmin || isSuperAdmin) && (
              <div className="mt-6 pt-6 border-t border-white/10 bg-indigo-950/30 p-5 rounded-2xl border border-indigo-500/30 space-y-3">
                <div className="flex items-center justify-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Rocket className="w-4 h-4" /> Super Admin Quick Launch Controls
                </div>
                <p className="text-[11px] text-zinc-400 text-center">
                  You are logged in as an administrator. You can launch the event page immediately below.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={handleAdminLaunchPage}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Rocket className="w-4 h-4" /> LAUNCH EVENT PAGE NOW
                  </button>

                  <button
                    onClick={() => router.push('/admin')}
                    className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all border border-white/10 cursor-pointer"
                  >
                    OPEN ADMIN PANEL
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 22 Segments Catalog Grid Preview */}
        <div id="segments" className="max-w-7xl mx-auto px-6 pt-12 space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-left space-y-1">
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-400">CHAMPIONSHIP CATALOG</span>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Explore All 22 Championship Segments</h2>
              <p className="text-xs text-zinc-400 max-w-lg">Get your mathematical squad prepared across solo, team, olympiad, and creative tracks. Expand cards to view banners & descriptions.</p>
            </div>

            <button
              type="button"
              onClick={handleExpandAllSegments}
              className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-pink-400 rounded-full transition-all cursor-pointer flex items-center gap-2 font-mono shrink-0 select-none"
            >
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSegments.length === INTER_SEGMENTS.length ? 'rotate-180 text-pink-400' : ''}`} />
              {expandedSegments.length === INTER_SEGMENTS.length ? 'Collapse All Cards' : 'Expand All Banners & Descriptions'}
            </button>
          </div>

          {/* Catalog Grid grouped into Sub-sections */}
          {(() => {
            const soloSegments = INTER_SEGMENTS.filter((seg: any) => !checkIsTeamSegment(seg.id));
            const teamSegments = INTER_SEGMENTS.filter((seg: any) => checkIsTeamSegment(seg.id));

            const renderCatalogCard = (seg: typeof INTER_SEGMENTS[0]) => {
              const IconComp = seg.icon;
              const isExpanded = expandedSegments.includes(seg.id);
              const isTeamEvent = checkIsTeamSegment(seg.id);
              const bannerUrl = segmentBanners[seg.id] || DEFAULT_SEGMENT_BANNERS[seg.id] || "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80";
              const descriptionText = segmentDescriptions[seg.id] || DEFAULT_SEGMENT_DESCRIPTIONS[seg.id] || "Challenge your mind and represent your institution across problem solving, speed calculation, and creative tracks.";

              return (
                <div 
                  key={seg.id} 
                  className={`rounded-2xl border transition-all overflow-hidden flex flex-col justify-between ${
                    isExpanded 
                      ? 'bg-gradient-to-b from-zinc-900/90 via-zinc-950/90 to-black border-pink-500/50 shadow-xl shadow-pink-500/10' 
                      : 'bg-zinc-950/70 border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Card Main Info Header */}
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border bg-gradient-to-br ${seg.color}`}>
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-pink-400 px-2.5 py-1 bg-pink-500/10 rounded-md border border-pink-500/20">
                          {seg.category}
                        </span>
                        {isFreeInterSegment(seg.id) && (
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                            FREE ENTRY
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isTeamEvent && (
                          <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                            👥 TEAM
                          </span>
                        )}
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                          <Lock className="w-3 h-3 text-zinc-500" /> LOCKED
                        </span>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">{seg.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{seg.tagline}</p>
                    </div>
                  </div>

                  {/* Expand / Collapse Trigger Bar */}
                  <button
                    type="button"
                    onClick={() => toggleExpandSegment(seg.id)}
                    className="w-full px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border-t border-white/10 flex items-center justify-between text-[10px] font-mono font-bold text-pink-400 transition-colors cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5 uppercase tracking-wider">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-pink-500' : ''}`} />
                      {isExpanded ? 'Hide Segment Banner & Brief' : 'Expand Banner & Description'}
                    </span>
                    <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-semibold">
                      {isExpanded ? 'Tap to close' : 'Tap to expand'}
                    </span>
                  </button>

                  {/* Expanded Content Drawer */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-pink-500/20 bg-black/80"
                      >
                        <div className="p-5 space-y-4">
                          {/* Banner Image */}
                          <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900 border border-white/10 group shadow-xl">
                            <img 
                              src={bannerUrl} 
                              alt={seg.name}
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-pink-400 bg-black/70 px-2 py-0.5 rounded w-fit border border-pink-500/30">
                                Segment Banner
                              </span>
                            </div>
                          </div>

                          {/* Brief Description */}
                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 font-mono">BRIEF DESCRIPTION & RULES</h4>
                            <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                              {descriptionText}
                            </p>
                          </div>

                          {/* Spec Sheet */}
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-mono">
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                              <span className="text-zinc-500 block uppercase font-bold text-[8px]">Type</span>
                              <span className="text-white font-bold">{isTeamEvent ? 'Team (2-3 Members)' : 'Solo Individual'}</span>
                            </div>
                            <div className="bg-white/5 p-2 rounded-lg border border-white/5">
                              <span className="text-zinc-500 block uppercase font-bold text-[8px]">Eligibility</span>
                              <span className="text-pink-400 font-bold">
                                {seg.id === "Tic-Tac-Toe"
                                  ? "Class 3 - 8 (Primary & Junior)"
                                  : seg.allowedCategories && seg.allowedCategories.length < 4
                                    ? getCategoryClassRange(seg.allowedCategories)
                                    : "Class 3 - 12 (All Categories)"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            };

            return (
              <div className="space-y-10">
                {/* Catalog Sub-Section 1: Solo Events */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-pink-500/20 pb-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-mono">
                      <User className="w-4 h-4 text-pink-400" /> Solo Events Catalog ({soloSegments.length})
                    </span>
                    <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Individual championship tracks</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {soloSegments.map(renderCatalogCard)}
                  </div>
                </div>

                {/* Catalog Sub-Section 2: Team Events */}
                <div className="space-y-4 pt-2">
                  <div className="flex items-center gap-3 border-b border-amber-500/20 pb-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-mono">
                      <Users className="w-4 h-4 text-amber-400" /> Team Events Catalog ({teamSegments.length})
                    </span>
                    <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Collaborative group challenges</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {teamSegments.map(renderCatalogCard)}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    );
  }

  // Tickify Relocation Card Display (When toggled to Tickify Registration)
  if (registrationProvider === 'tickify') {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
        {/* Ambient Cosmic Lights & Gradients */}
        <div className="absolute top-[15%] left-[50%] -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 via-orange-500/5 to-transparent rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-2xl w-full mx-auto space-y-8 relative z-10">
          
          {/* Top Exit Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/events')}
              className="inline-flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Events Hub
            </button>
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400/90 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
              National Inter-School Olympiad 2026
            </span>
          </div>

          {/* Master Tickify Relocation Card */}
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-[2.5rem] bg-gradient-to-b from-zinc-900/90 via-[#0a0c12] to-black border border-amber-500/30 p-8 sm:p-12 text-center space-y-8 shadow-[0_25px_80px_rgba(0,0,0,0.8),0_0_50px_rgba(245,158,11,0.08)] backdrop-blur-2xl overflow-hidden"
          >
            {/* Top Glowing Mesh Strip */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
            <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Glowing Beacon & Ticket Emblem */}
            <div className="space-y-3 flex flex-col items-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                Official Ticketing Partner
              </div>

              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-yellow-600/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)] mt-2">
                <Ticket className="w-10 h-10 stroke-[1.5]" />
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight font-display">
                Registration Has Moved to <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-500">Tickify</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 font-sans leading-relaxed max-w-lg mx-auto font-light">
                {tickifyNoticeReason || "Registration for the National Inter-School Math Olympiad & Festival has been relocated from the website to Tickify for seamless ticketing, automated seat allocation, and instant confirmation."}
              </p>
            </div>

            {/* Key Perks / Reasons Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Instant Confirmation</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">Instant digital pass and verified roll number generation.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
                  <QrCode className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Automated QR Passes</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">Direct e-ticket delivery to your phone and email.</p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">Secured Gateway</h4>
                <p className="text-[11px] text-zinc-400 leading-snug">Seamless bKash, Nagad, and Card payment integration.</p>
              </div>
            </div>

            {/* Action CTA Area */}
            <div className="pt-4 border-t border-white/10 space-y-4">
              {tickifyUrl && tickifyUrl.trim().length > 0 ? (
                <motion.a
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  href={tickifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4 px-8 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-black font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_0_30px_rgba(245,158,11,0.3)] transition-all cursor-pointer font-mono"
                >
                  <Ticket className="w-4 h-4" /> Proceed to Tickify Registration <ExternalLink className="w-4 h-4" />
                </motion.a>
              ) : (
                <div className="space-y-2">
                  <button
                    disabled
                    className="w-full py-4 px-8 rounded-2xl bg-zinc-900 border border-amber-500/30 text-amber-300 font-mono font-bold uppercase tracking-wider text-xs flex items-center justify-center gap-2 cursor-not-allowed opacity-90 shadow-inner"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" /> Official Tickify Link Activating Shortly
                  </button>
                  <p className="text-[11px] text-zinc-500 font-mono">
                    The direct Tickify registration portal link is being configured by the administration and will go live here shortly.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push('/events')}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Events Hub
                </button>
                <button
                  onClick={() => router.push('/notices')}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Official Notices
                </button>
                <button
                  onClick={() => router.push('/about')}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold uppercase tracking-wider text-zinc-300 hover:text-white transition-all cursor-pointer"
                >
                  Contact Helpdesk
                </button>
              </div>
            </div>

            {/* Bottom Footer Note */}
            <div className="text-[11px] text-zinc-500 font-mono pt-2">
              For institutional bulk entries or technical inquiries, contact the <span className="text-zinc-400">Josephite Math Club Executive Committee</span>.
            </div>
          </motion.div>

        </div>
      </div>
    );
  }

  // Locked display
  if (isLocked && !isAdmin && !isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#020205] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-950 border border-white/10 rounded-[2.5rem] p-10 text-center space-y-6 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-red-500/5 rounded-full blur-[50px] pointer-events-none" />
          
          <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center mx-auto border border-rose-500/20">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black uppercase tracking-tight">Inter-School Portal Locked</h2>
            <p className="text-xs text-zinc-400 font-medium leading-relaxed">
              Online participant registration is currently closed or undergoing routine server-side system maintenance. Please watch our official channels for schedules.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 flex flex-col gap-3">
            <button
              onClick={() => router.push('/events')}
              className="w-full py-4 bg-zinc-900 hover:bg-zinc-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
            >
              Back to Events Hub
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020205] text-white py-12 px-4 sm:px-6 lg:px-8 relative overflow-x-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[20%] left-[-10%] w-[400px] h-[400px] bg-pink-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-12">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b border-white/5 pb-6">
          <button
            onClick={() => router.push('/events')}
            className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Exit Wizard
          </button>
        </div>

        {/* Steps header bar */}
        {!isSuccess && (
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto bg-white/[0.02] border border-white/5 p-1.5 rounded-2xl">
            {[1, 2, 3].map((s) => (
              <button
                key={s}
                disabled={s > step && selectedSegments.length === 0}
                onClick={() => {
                  if (s === 1) setStep(1);
                  if (s === 2 && fullName && className && institute && email && phone) setStep(2);
                }}
                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  step === s 
                    ? 'bg-gradient-to-r from-pink-500 to-indigo-600 text-white shadow-lg shadow-pink-500/10' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                Step {s}
              </button>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {isSuccess ? (
            <motion.div
              key="success-box"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto bg-zinc-950 border border-white/10 p-10 rounded-[3rem] text-center space-y-8 relative overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-green-500/5 rounded-full blur-[50px] pointer-events-none" />
              
              <div className="w-20 h-20 bg-green-500/10 border border-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-10 h-10" />
              </div>

              <div className="space-y-3">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">Registration Submitted!</h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                  Congratulations <span className="text-pink-400 font-bold">{fullName}</span>, your request has been queued inside our payment verification ledger. A unique Participant ID credentials email is on its way to you!
                </p>
              </div>

              {successInfo && (
                <div className="bg-black/40 border border-white/5 rounded-2xl p-6 text-left space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-pink-400 border-b border-white/5 pb-2 font-mono">PARTICIPANT PROFILE META</h4>
                  <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                    {successInfo.isNewUserCreated ? (
                      <>
                        <div className="col-span-2 text-green-400 font-bold uppercase text-[10px] tracking-widest mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4" /> A new account has been created for you!
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Assigned Username/Email:</span>
                          <span className="text-white font-bold">{email}</span>
                        </div>
                        <div>
                          <span className="text-zinc-500 block text-[9px] uppercase font-bold">Initial Password:</span>
                          <span className="text-white font-bold">{phone}</span>
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <span className="text-indigo-400 font-bold block text-[10px] uppercase tracking-widest mb-1.5">Linked to your account</span>
                        <p className="text-[11px] text-zinc-400 leading-relaxed font-sans normal-case">
                          We found an existing account associated with <span className="text-white font-bold">{email}</span>. Your inter-event registrations have been successfully linked to it. You can sign in using your existing password.
                        </p>
                      </div>
                    )}
                    <div className="col-span-2 border-t border-white/5 pt-3">
                      <span className="text-zinc-500 block text-[9px] uppercase font-bold">Registered Segments:</span>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedSegments.map((seg) => (
                          <span key={seg} className="px-2 py-0.5 bg-zinc-900 border border-white/5 text-[9px] rounded-md font-bold text-zinc-300">
                            {seg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Verification Slip / Ticket Pass Auto-Download Notice */}
              <div className={`p-6 border rounded-2xl text-left space-y-4 w-full ${
                regDocType === 'ticket' 
                  ? 'bg-amber-500/10 border-amber-500/20' 
                  : 'bg-emerald-500/10 border-emerald-500/20'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  regDocType === 'ticket' ? 'border-amber-500/20' : 'border-emerald-500/20'
                }`}>
                  <div className="flex items-center gap-2">
                    {regDocType === 'ticket' ? (
                      <Ticket className="w-5 h-5 text-amber-400" />
                    ) : (
                      <FileText className="w-5 h-5 text-emerald-400" />
                    )}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">
                        {regDocType === 'ticket' ? 'Official Event Entry Ticket (Pass)' : 'Official Verification Slip (PDF)'}
                      </h4>
                      <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                        regDocType === 'ticket' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {regDocType === 'ticket' ? '✓ Festival Entry Pass & Scannable QR Issued' : '✓ Scannable Pass & QR Code Generated'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-full ${
                    regDocType === 'ticket' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    Auto-Downloaded
                  </span>
                </div>
                
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {regDocType === 'ticket' 
                    ? 'Your official Event Entry Ticket with unique verification QR Code has been generated and auto-downloaded to your device.'
                    : 'Your official Verification Slip PDF with QR Code has been generated and auto-downloaded to your device.'}
                </p>

                <div className="p-3.5 bg-black/50 rounded-xl text-[11px] text-amber-300 border border-amber-500/20 leading-relaxed font-medium">
                  ℹ️ <strong>Notice:</strong> You can also log in anytime using your required credentials (registered phone number / email) to download this {regDocType === 'ticket' ? 'ticket pass' : 'verification slip PDF'} again from your <strong>Profile Page</strong>.
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSlipModal(true)}
                    className={`flex-1 py-3 px-4 text-black font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 ${
                      regDocType === 'ticket' 
                        ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-500/20' 
                        : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20'
                    }`}
                  >
                    <Download className="w-4 h-4" /> {regDocType === 'ticket' ? 'Download Ticket Pass Again' : 'Download Verification PDF Pass Again'}
                  </button>
                </div>
              </div>

              <PurchaseSlipModal 
                candidate={{
                  id: successInfo?.member_id || successInfo?.registration?.member_id || 'JMC-PASS',
                  fullName: fullName || 'Participant',
                  email: email || '',
                  phone: phone || '',
                  memberId: successInfo?.member_id || successInfo?.registration?.member_id || 'JMC-PASS',
                  class: className || 'N/A',
                  section: 'N/A',
                  roll: 'N/A',
                  school: institute || 'St. Joseph Higher Secondary School',
                  trxnid: trxnId || 'VERIFIED',
                  eventsList: selectedSegments,
                  verified: true,
                }}
                isOpen={showSlipModal}
                autoDownload={true}
                documentType={regDocType}
                onClose={() => setShowSlipModal(false)}
              />

              {/* Festival Calendar Dates Automatically Scheduled */}
              <div className="p-6 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 rounded-2xl text-left space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-400" />
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-white">Event Festival Calendar Scheduled</h4>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">✓ Marked September 24, 25 & 26 in Your Account</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider rounded-full">
                    Auto-Notified
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-center">
                  {FESTIVAL_CALENDAR_EVENTS.map((ev, idx) => (
                    <div key={idx} className="p-3 bg-black/50 border border-white/5 rounded-xl space-y-1">
                      <span className="text-[9px] font-black uppercase text-indigo-400 block">{ev.day} • {ev.dateStr}</span>
                      <p className="text-[10px] font-bold text-white line-clamp-1">{ev.title.split('-')[1]?.trim() || ev.title}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <a
                    href={getGoogleCalendarAllDaysUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-4 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Add to Google Calendar
                  </a>
                  <button
                    type="button"
                    onClick={() => downloadIcsCalendar()}
                    className="flex-1 py-2.5 px-4 bg-white/10 hover:bg-white/15 text-white rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border border-white/10"
                  >
                    <Calendar className="w-3.5 h-3.5" /> Download iCal (.ics) File
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  Use your email/phone to login to your dashboard to download your entry slip!
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/login')}
                    className="flex-1 py-4 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-pink-500/20"
                  >
                    Go To Login
                  </button>
                  <button
                    onClick={() => {
                      // Reset state
                      setStep(1);
                      setFullName("");
                      setClassName("");
                      setInstitute("");
                      setEmail("");
                      setPhone("");
                      setCaCode("");
                      setSelectedSegments([]);
                      setSenderBkash("");
                      setTrxnId("");
                      setIsSuccess(false);
                      setSuccessInfo(null);
                    }}
                    className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                  >
                    Register New
                  </button>
                </div>
              </div>
            </motion.div>
          ) : step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              {isScanningDB ? (
                <div className="bg-zinc-950/90 border border-purple-500/30 rounded-[3rem] p-10 md:p-16 shadow-2xl relative text-center space-y-6 my-4 max-w-2xl mx-auto backdrop-blur-xl">
                  <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 w-[250px] h-[250px] bg-purple-500/15 rounded-full blur-[90px] pointer-events-none" />

                  <div className="relative inline-flex items-center justify-center pt-2">
                    <div className="w-20 h-20 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shadow-inner">
                      <Loader2 className="w-10 h-10 text-purple-400 animate-spin" />
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-pink-500"></span>
                    </span>
                  </div>

                  <div className="space-y-2">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/10 text-purple-300 border border-purple-500/20 font-mono">
                      Database Search Active
                    </span>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white font-mono flex items-center justify-center gap-2">
                      Fetching Important Information...
                    </h3>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed font-sans">
                      Scanning central database records for <strong className="text-purple-300">{fullName || 'participant'}</strong> (<span className="text-zinc-200">{phone || email}</span>) to verify eligibility and existing event segment registrations...
                    </p>
                  </div>

                  {/* Animated Loading Progress Bar */}
                  <div className="w-full bg-white/5 border border-white/10 h-3 rounded-full overflow-hidden p-0.5 max-w-md mx-auto">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-full"
                      initial={{ width: "10%" }}
                      animate={{ width: "95%" }}
                      transition={{ duration: 2.2, ease: "easeInOut" }}
                    />
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-zinc-500 uppercase tracking-widest pt-1">
                    <Database className="w-3.5 h-3.5 text-purple-400 animate-pulse" />
                    <span>Cross-checking records • Standby...</span>
                  </div>
                </div>
              ) : (
                <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
                  <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-pink-500/5 rounded-full blur-[50px] pointer-events-none" />
                  
                  <div className="mb-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                      <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                        <User className="w-8 h-8 text-pink-500" /> Participant Identity
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1 max-w-xl font-medium leading-relaxed">
                        Provide your official academic registry coordinates. Ensure your email and phone numbers are functional, as auto-passcodes will be dispatched there.
                      </p>
                    </div>
                  </div>

              {/* Administrator Proxy Registration Toggle */}
              {isAdmin && (
                <div className="flex flex-col p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/15 mb-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Proxy / Spot Registration Mode</h4>
                      <p className="text-[10px] text-zinc-400">Bypass payment gateway and manually register any participant instantly.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleProxy(!isProxyRegistration)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border cursor-pointer ${
                        isProxyRegistration 
                          ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20 font-black' 
                          : 'bg-zinc-900 hover:bg-zinc-800 border-white/5 text-zinc-400 hover:text-white font-bold'
                      }`}
                    >
                      {isProxyRegistration ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>

                  {isProxyRegistration && (
                    <div className="pt-4 border-t border-white/5 space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Search & Register Student using:</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setProxyMethod('email');
                              setProxyEmail('');
                              setProxyVerified(false);
                              setProxyUserExists(false);
                              setProxyResolvedUserId(null);
                              setFullName('');
                              setPhone('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proxyMethod === 'email'
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setProxyMethod('phone');
                              setProxyEmail('');
                              setProxyVerified(false);
                              setProxyUserExists(false);
                              setProxyResolvedUserId(null);
                              setFullName('');
                              setEmail('');
                            }}
                            className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                              proxyMethod === 'phone'
                                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            Phone Number
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {proxyMethod === 'email' ? (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Email Address (User ID)</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="email"
                                  placeholder="student@example.com"
                                  value={proxyEmail}
                                  onChange={(e) => {
                                    setProxyEmail(e.target.value);
                                    setEmail(e.target.value);
                                    setProxyVerified(false);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleVerifyProxyEmail}
                                disabled={checkingProxyEmail}
                                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {checkingProxyEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Search
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Phone Number (User ID & Password)</label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="text"
                                  placeholder="017XXXXXXXX"
                                  value={proxyPhoneNumber}
                                  onChange={(e) => {
                                    setProxyPhoneNumber(e.target.value);
                                    setPhone(e.target.value);
                                    setProxyVerified(false);
                                  }}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleVerifyProxyEmail}
                                disabled={checkingProxyEmail}
                                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                              >
                                {checkingProxyEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                Search
                              </button>
                            </div>
                          </div>
                        )}

                        {proxyMethod === 'email' && (
                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              Student's Contact Phone Number {proxyVerified && !proxyUserExists && <span className="text-amber-500 font-bold">(Password)</span>}
                            </label>
                            <div className="relative">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                              <input
                                type="text"
                                placeholder="017XXXXXXXX"
                                value={proxyPhoneNumber}
                                onChange={(e) => {
                                  setProxyPhoneNumber(e.target.value);
                                  setPhone(e.target.value);
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}

              {isProxyRegistration && !proxyVerified ? (
                <div className="p-8 border border-dashed border-indigo-500/20 rounded-3xl bg-indigo-500/5 text-center space-y-3">
                  <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse mx-auto" />
                  <h4 className="text-sm font-black uppercase tracking-wider text-white">Verification Required</h4>
                  <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Please provide an email address or phone number and click the <strong>Search</strong> button above to retrieve credentials or initiate manual spot registration.
                  </p>
                </div>
              ) : ((!user && !isProxyRegistration) || (isProxyRegistration && proxyVerified && proxyMethod === 'phone' && !proxyUserExists)) && hasEmailAddress === null ? (
                <div className="p-8 border border-dashed border-pink-500/25 rounded-3xl bg-pink-500/5 text-center space-y-6 my-4">
                  <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-pink-400 font-mono">Registration Setup</p>
                    <h4 className="text-lg font-black uppercase tracking-wider text-white">
                      How would you like to register?
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      Choose whether to register using both Email Address & Phone Number, or Phone Number only.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHasEmailAddress(true);
                      }}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-pink-500/15 flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      Email & Phone Number
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasEmailAddress(false);
                        setEmail('');
                      }}
                      className="flex-1 py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-white/5 flex items-center justify-center gap-2"
                    >
                      <Phone className="w-4 h-4 text-pink-400" />
                      Phone Number Only
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Full Name */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Full Name <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyNameEditable)}
                        placeholder="E.G. SAMIN TAUSIF"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all uppercase tracking-wider disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Gender */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Gender <span className="text-pink-500">*</span>
                      {isProxyRegistration && (!proxyVerified || !proxyGenderEditable) && (
                        <span className="text-[9px] text-amber-400 flex items-center gap-1 font-mono lowercase">
                          (<Lock className="w-2.5 h-2.5" /> locked)
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <UserCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyGenderEditable)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="" className="text-zinc-600 bg-zinc-950">SELECT GENDER</option>
                        <option value="Male" className="bg-zinc-950 text-white">Male</option>
                        <option value="Female" className="bg-zinc-950 text-white">Female</option>
                      </select>
                    </div>
                  </div>

                  {/* Selective Class */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center justify-between font-mono">
                      <span className="flex items-center gap-2">
                        Class Level <span className="text-pink-500">*</span>
                      </span>
                      {className && getCategoryFromClass(className) && (
                        <span className="text-pink-400 font-bold text-[9px] uppercase tracking-wider bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full font-sans">
                          {getCategoryFromClass(className)} Category
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <select
                        value={className}
                        onChange={(e) => {
                          const newCls = e.target.value;
                          setClassName(newCls);
                          if (newCls) {
                            setSelectedSegments(prev => prev.filter((id: string) => isSegmentEligible(id, newCls).eligible));
                          }
                        }}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyClassEditable)}
                        className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        <option value="" className="text-zinc-600 bg-zinc-950">SELECT CLASS</option>
                        {["3","4","5","6","7","8","9","10","11","12"].map((c) => (
                          <option key={c} value={c} className="bg-zinc-950 text-white">Class {c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Institute / School / College */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Institution / School <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={institute}
                        onChange={(e) => setInstitute(e.target.value)}
                        disabled={isProxyRegistration && (!proxyVerified || !proxyInstituteEditable)}
                        placeholder="E.G. SJS / NOTRE DAME COLLEGE"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all uppercase tracking-wider disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Email address */}
                  {hasEmailAddress !== false ? (
                    <div className="space-y-3">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                        Email Address <span className="text-pink-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onBlur={() => {
                            checkEmailSilently(email);
                            checkRegistrationStatus(email, phone);
                          }}
                          disabled={isProxyRegistration && (proxyMethod === 'email' || !proxyVerified || !proxyEmailEditable)}
                          placeholder="E.G. SAMIN@EMAIL.COM"
                          className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10 flex flex-col justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2 text-amber-400/90 leading-normal">
                        <Mail className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold uppercase tracking-wider text-[9px] mb-0.5">Phone-Only Mode</p>
                          <p className="text-[10px] text-zinc-400">Email field is hidden. Entry credentials and passcodes will be bound to phone.</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setHasEmailAddress(true);
                        }}
                        className="text-[10px] font-black uppercase tracking-widest text-pink-500 hover:text-pink-400 text-left transition-colors cursor-pointer w-fit"
                      >
                        Add Email Address &rarr;
                      </button>
                    </div>
                  )}

                  {/* Phone number */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Phone Number <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        onBlur={() => checkRegistrationStatus(email, phone)}
                        disabled={isProxyRegistration && (proxyMethod === 'phone' || !proxyVerified || !proxyPhoneEditable)}
                        placeholder="E.G. 017XXXXXXXX"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Existing Registration Banner */}
                  {alreadyRegisteredEvents.length > 0 && (
                    <div className="col-span-1 md:col-span-2 p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-start gap-3.5 text-xs">
                      <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-indigo-300 block font-mono">
                          Existing Registration Found ({alreadyRegisteredEvents.length} Event{alreadyRegisteredEvents.length > 1 ? 's' : ''})
                        </span>
                        <p className="text-zinc-300 text-[11px] leading-relaxed">
                          Our records show that <strong className="text-indigo-200">{registeredStudentName || fullName || 'this participant'}</strong> is already registered for: <strong className="text-amber-400">{alreadyRegisteredEvents.join(', ')}</strong>. You can continue to select and register for any unregistered events below!
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Campus Ambassador (CA) Code Selection / Typing with Manga Bubble */}
                  <div className="space-y-3 relative" ref={caInputContainerRef}>
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                        Campus Ambassador (CA) Code
                        {caCodeInputMode === 'typing' && (
                          <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 text-[8px] font-mono font-bold uppercase tracking-wider border border-pink-500/30">
                            Typeable
                          </span>
                        )}
                      </label>
                      {caCodeInputMode === 'typing' && (
                        <button
                          type="button"
                          onClick={() => setShowCaMangaBubble(!showCaMangaBubble)}
                          className="text-[10px] font-mono font-bold text-pink-400 hover:text-pink-300 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          <span>Guide</span>
                        </button>
                      )}
                    </div>

                    {caCodeInputMode === 'typing' ? (
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          value={caCode === "N/A" ? "" : caCode}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const sanitized = raw.toLowerCase().replace(/\s+/g, '');
                            setCaCode(sanitized || "N/A");
                          }}
                          onFocus={() => setShowCaMangaBubble(true)}
                          onClick={() => setShowCaMangaBubble(true)}
                          disabled={isProxyRegistration && !proxyVerified}
                          placeholder="e.g. samintausif (all lowercase, no spaces)"
                          className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all disabled:opacity-50 lowercase font-mono placeholder:normal-case placeholder:font-sans placeholder:text-zinc-600"
                        />

                        {/* Manga Conversation Bubble */}
                        <AnimatePresence>
                          {showCaMangaBubble && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.9, y: 12 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9, y: 8 }}
                              transition={{ type: "spring", stiffness: 400, damping: 28 }}
                              className="absolute z-50 left-0 right-0 -top-44 sm:-top-36"
                            >
                              {/* Manga Speech Balloon Body */}
                              <div className="relative bg-white text-zinc-950 p-4 sm:p-5 rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.8)] border-[3px] border-black">
                                {/* Halftone Screen Tone Decorative Dots */}
                                <div className="absolute top-2.5 right-10 flex items-center gap-1 opacity-25 pointer-events-none">
                                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                  <span className="w-1.5 h-1.5 rounded-full bg-black"></span>
                                </div>

                                {/* Manga Bubble Header */}
                                <div className="flex items-center justify-between pb-2 mb-2.5 border-b-2 border-black/80">
                                  <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 bg-black text-white text-[9px] font-black uppercase tracking-widest rounded font-mono">
                                      🗯️ CA PROTOCOL
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowCaMangaBubble(false);
                                    }}
                                    className="p-1 rounded-md hover:bg-black/10 text-zinc-900 transition-colors cursor-pointer"
                                    title="Close Guide"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Manga Dialogue Instructions */}
                                <div className="space-y-2 text-zinc-900 font-sans">
                                  <div className="flex items-start gap-2">
                                    <span className="text-sm shrink-0 mt-0.5">💬</span>
                                    <p className="text-xs font-bold leading-snug tracking-tight">
                                      CA's name will be <span className="bg-amber-300 px-1.5 py-0.5 rounded border border-black font-mono font-black text-black">all small</span> and <span className="bg-amber-300 px-1.5 py-0.5 rounded border border-black font-mono font-black text-black">without any spaces</span>.
                                    </p>
                                  </div>
                                  <div className="flex items-start gap-2 pt-1 border-t border-dashed border-black/30">
                                    <span className="text-sm shrink-0 mt-0.5">⚠️</span>
                                    <p className="text-[11px] font-bold text-red-600 leading-snug tracking-tight">
                                      Unregistered or unconfirmed CA's name will be <span className="underline font-black bg-red-100 px-1 text-red-700">voided</span>.
                                    </p>
                                  </div>
                                </div>

                                {/* Downward Comic Speech Pointer Tail */}
                                <div className="absolute -bottom-3 left-8 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[12px] border-t-black">
                                  <div className="absolute -top-[14px] -left-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[10px] border-t-white"></div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ) : (
                      <div className="relative">
                        <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <select
                          value={caCode}
                          onChange={(e) => setCaCode(e.target.value)}
                          disabled={isProxyRegistration && !proxyVerified}
                          className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all cursor-pointer disabled:opacity-50"
                        >
                          <option value="N/A" className="text-zinc-400 bg-zinc-950">N/A</option>
                          {caCodesList.filter(code => code !== "N/A").map((code) => (
                            <option key={code} value={code} className="bg-zinc-950 text-white">{code}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {caCode && caCode !== "N/A" && (
                      <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider font-mono">
                        ✨ CA Code Applied: <strong className="text-pink-400 font-mono">{caCode}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )}

                  <div className="flex justify-end pt-8 mt-8 border-t border-white/5">
                    <button
                      onClick={handleNextStep1}
                      disabled={isScanningDB}
                      className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/10 hover:scale-[1.02] disabled:opacity-50"
                    >
                      {isScanningDB ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Fetching Information...
                        </>
                      ) : (
                        <>
                          Continue to Segments <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ) : step === 2 ? (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-8"
            >
              <div className="bg-zinc-950 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative">
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-indigo-500/5 rounded-full blur-[50px] pointer-events-none" />

                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-pink-500" /> Event Segments
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl font-medium leading-relaxed">
                      Select any number of our national mathematical event segments. Participating in any or all <span className="text-pink-400 font-bold">Solo events costs a flat BDT 100</span>. Team events: <span className="text-pink-400 font-bold">BDT 200 per team event</span> (1 = 200 BDT, 2 = 400 BDT, 3 = 600 BDT, 4 = 800 BDT). <span className="text-purple-400 font-bold">General members get 50% discount</span>!
                    </p>
                  </div>

                  {/* Real-time total card floating */}
                  <div className="bg-black/50 border border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4 shrink-0 font-mono">
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-zinc-500 font-bold uppercase block tracking-wider">SELECTED FEE</span>
                      <div className="text-xl font-black text-white flex items-baseline gap-1">
                        {finalPrice} <span className="text-xs text-zinc-400 font-bold">BDT</span>
                      </div>
                    </div>
                    {selectedSegments.length > 0 && (
                      <span className="h-8 w-8 rounded-full bg-pink-500/10 text-pink-400 text-xs font-black flex items-center justify-center border border-pink-500/20">
                        {selectedSegments.length}
                      </span>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> {errorMessage}
                  </div>
                )}

                {/* Category Banner Status */}
                {className && getCategoryFromClass(className) && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-pink-500/15 via-indigo-500/10 to-purple-500/15 border border-pink-500/30 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 font-black text-xs flex items-center justify-center font-mono">
                        C{className}
                      </div>
                      <div>
                        <div className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                          <span>Class {className} Student</span>
                          <span className="text-[10px] font-mono text-pink-400 bg-pink-500/20 px-2 py-0.5 rounded-full border border-pink-500/30 font-bold">
                            {getCategoryFromClass(className)} Category
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-300 font-mono mt-0.5">
                          {getCategoryClassRange([getCategoryFromClass(className) || ''])} • Events restricted to your category are enforced automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Select All / Expand All Option */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-6 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 md:px-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                    Selected Segments: <span className="text-pink-400 font-black">{selectedSegments.length}</span> of {INTER_SEGMENTS.length}
                    <span className="text-zinc-500 ml-2">
                      ({selectedSegments.filter((id: string) => !checkIsTeamSegment(id)).length} Solo, {selectedSegments.filter((id: string) => checkIsTeamSegment(id)).length} Team)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleExpandAllSegments}
                      className="px-4 py-2 bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-pink-400 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-mono select-none"
                    >
                      <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedSegments.length === INTER_SEGMENTS.length ? 'rotate-180 text-pink-400' : ''}`} />
                      {expandedSegments.length === INTER_SEGMENTS.length ? 'Collapse All Cards' : 'Expand All Banners'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSelectAllSegments}
                      className="px-4 py-2 bg-pink-500/10 border border-pink-500/20 hover:bg-pink-500/20 text-[10px] font-black uppercase tracking-wider text-pink-300 rounded-full transition-all cursor-pointer flex items-center gap-1.5 font-mono select-none"
                      title="Selects all eligible Solo Events (Team events must be selected individually)"
                    >
                      {(() => {
                        const eligibleSoloIds = INTER_SEGMENTS
                          .filter((seg: any) => !checkIsTeamSegment(seg.id) && isSegmentEligible(seg.id, className).eligible)
                          .map((seg: any) => seg.id);
                        const allSoloSelected = eligibleSoloIds.length > 0 && eligibleSoloIds.every((id: string) => selectedSegments.includes(id));
                        return allSoloSelected ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-pink-400" />
                            Deselect Solo Events
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Select All Solo Events
                          </>
                        );
                      })()}
                    </button>
                  </div>
                </div>

                {/* Segment selection grids grouped by Sub-Sections */}
                {(() => {
                  const soloSegments = INTER_SEGMENTS.filter((seg: any) => !checkIsTeamSegment(seg.id));
                  const teamSegments = INTER_SEGMENTS.filter((seg: any) => checkIsTeamSegment(seg.id));

                  const renderSegmentCard = (seg: typeof INTER_SEGMENTS[0]) => {
                    const isSelected = selectedSegments.includes(seg.id);
                    const isAlreadyRegistered = alreadyRegisteredEvents.includes(seg.id);
                    const isExpanded = expandedSegments.includes(seg.id);
                    const SegIcon = seg.icon;
                    const eligibility = isSegmentEligible(seg.id, className);
                    const isTeamEvent = checkIsTeamSegment(seg.id);
                    const bannerUrl = segmentBanners[seg.id] || DEFAULT_SEGMENT_BANNERS[seg.id] || "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80";
                    const descriptionText = segmentDescriptions[seg.id] || DEFAULT_SEGMENT_DESCRIPTIONS[seg.id] || "Challenge your mind and represent your institution across problem solving, speed calculation, and creative tracks.";

                    return (
                      <div
                        key={seg.id}
                        className={`rounded-2xl border transition-all flex flex-col justify-between overflow-hidden select-none ${
                          isAlreadyRegistered
                            ? 'bg-emerald-950/20 border-emerald-500/40 opacity-85'
                            : !eligibility.eligible
                              ? 'bg-zinc-950/40 border-white/5 opacity-60'
                              : isSelected 
                                ? 'bg-gradient-to-b from-indigo-950/50 via-[#0a0525]/40 to-[#020108]/90 border-pink-500/70 shadow-xl shadow-pink-500/10' 
                                : 'bg-zinc-900/30 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {/* Primary Card View */}
                        <div className="p-5 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border bg-gradient-to-br ${seg.color}`}>
                                <SegIcon className="w-4 h-4" />
                              </div>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-pink-400 px-2.5 py-0.5 bg-pink-500/10 rounded-md border border-pink-500/20">
                                {seg.category}
                              </span>
                              {isFreeInterSegment(seg.id) && (
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-emerald-400 px-2 py-0.5 bg-emerald-500/10 rounded border border-emerald-500/20">
                                  FREE ENTRY
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              {isTeamEvent && (
                                <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">
                                  👥 TEAM
                                </span>
                              )}
                              {isAlreadyRegistered ? (
                                <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-mono">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Registered ✓
                                </span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (eligibility.eligible) handleToggleSegment(seg.id);
                                  }}
                                  disabled={!eligibility.eligible}
                                  className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 ${
                                    !eligibility.eligible
                                      ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                                      : isSelected 
                                        ? 'bg-pink-500 text-white shadow-md shadow-pink-500/30' 
                                        : 'bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10'
                                  }`}
                                >
                                  {isSelected ? <><Check className="w-3 h-3 text-white" /> Selected</> : 'Select'}
                                </button>
                              )}
                            </div>
                          </div>

                          <div>
                            <h4 className="text-base font-black text-white uppercase tracking-wide">{seg.name}</h4>
                            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{seg.tagline}</p>
                            
                            <div className="mt-2.5 flex items-center gap-2 flex-wrap font-mono text-[9px]">
                              <span className="text-zinc-400 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                                Eligibility: {
                                  Array.isArray(seg.allowedCategories) && seg.allowedCategories.length > 0 && seg.allowedCategories.length < 4
                                    ? seg.allowedCategories.join(', ')
                                    : 'All Categories (Primary – Higher Secondary)'
                                }
                              </span>
                            </div>
                          </div>

                          {isAlreadyRegistered && (
                            <div className="mt-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-mono text-emerald-400 leading-tight flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> Registered in previous submission
                            </div>
                          )}

                          {!isAlreadyRegistered && !eligibility.eligible && (
                            <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] font-mono text-rose-300 leading-relaxed flex items-start gap-2">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                              <span>{eligibility.reason}</span>
                            </div>
                          )}
                        </div>

                        {/* Expand / Collapse Action Trigger */}
                        <button
                          type="button"
                          onClick={() => toggleExpandSegment(seg.id)}
                          className="w-full px-5 py-2.5 bg-white/[0.03] hover:bg-white/[0.08] border-t border-white/10 flex items-center justify-between text-[10px] font-mono font-bold text-pink-400 transition-colors cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5 uppercase tracking-wider">
                            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-pink-500' : ''}`} />
                            {isExpanded ? 'Hide Segment Banner & Brief' : 'Expand Banner & Description'}
                          </span>
                          <span className="text-zinc-500 text-[9px] uppercase tracking-wider font-semibold">
                            {isExpanded ? 'Tap to close' : 'Tap to expand'}
                          </span>
                        </button>

                        {/* Expanded Banner & Description Drawer */}
                        {isExpanded && (
                          <div className="border-t border-white/10 bg-black/60 p-5 space-y-4 animate-in fade-in duration-300">
                            <div className="relative w-full h-36 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                              <img
                                src={bannerUrl}
                                alt={seg.name}
                                className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                              <div className="absolute bottom-2 left-3 right-3 text-left">
                                <span className="text-[9px] font-mono font-bold text-pink-400 uppercase tracking-widest drop-shadow-md">
                                  {seg.name} Official Banner
                                </span>
                              </div>
                            </div>

                            <div className="space-y-1 text-left">
                              <h5 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Segment Overview & Brief:</h5>
                              <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                                {descriptionText}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  };

                  return (
                    <div className="space-y-10">
                      {/* SUB-SECTION 1: SOLO EVENTS */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-pink-500/20 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1.5 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-mono">
                              <User className="w-4 h-4 text-pink-400" /> Solo Events Sub-Section ({soloSegments.length})
                            </span>
                            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Individual participation tracks</span>
                          </div>
                          <span className="text-[10px] font-mono text-pink-400/80 bg-pink-500/5 px-2.5 py-1 rounded-lg border border-pink-500/20">
                            Selected by "Select All Solo"
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {soloSegments.map(renderSegmentCard)}
                        </div>
                      </div>

                      {/* SUB-SECTION 2: TEAM EVENTS */}
                      <div className="space-y-4 pt-2">
                        <div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
                          <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider flex items-center gap-2 font-mono">
                              <Users className="w-4 h-4 text-amber-400" /> Team Events Sub-Section ({teamSegments.length})
                            </span>
                            <span className="text-xs text-zinc-400 font-medium hidden sm:inline">Collaborative group challenges (2-3 teammates)</span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-400/80 bg-amber-500/5 px-2.5 py-1 rounded-lg border border-amber-500/20">
                            ⚠️ Excluded from "Select All"
                          </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          {teamSegments.map(renderSegmentCard)}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* TEAM MEMBERS SECTION IF A TEAM EVENT IS SELECTED */}
                {hasTeamSegment && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-6 p-6 rounded-3xl bg-zinc-900/60 border border-pink-500/20"
                  >
                    <div className="border-b border-white/10 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-pink-400 flex items-center gap-2 font-mono">
                          <User className="w-4 h-4" />
                          {is3MemberTeamSegment && hasOtherTeamSegment
                            ? "Shared & Tic-Tac-Toe Teammate Information"
                            : is3MemberTeamSegment
                            ? "Tic-Tac-Toe Team Member Information"
                            : "Shared Teammate Information"
                          }
                        </h3>
                        <p className="text-[10px] text-zinc-300 mt-1 uppercase font-mono font-bold leading-relaxed">
                          Leader: <span className="text-white font-extrabold">{fullName || 'Registrant'}</span> ({className ? `Class ${className}` : ''}) — 
                          {is3MemberTeamSegment && hasOtherTeamSegment
                            ? " Note: Other selected team events require 1 teammate (Teammate 1). Both teammates (Teammate 1 & Teammate 2) will be kept under Tic-Tac-Toe."
                            : is3MemberTeamSegment
                            ? " Tic-Tac-Toe requires a 3-member team (Leader + 2 Teammates)."
                            : " Teammate info entered here applies to all selected team events."
                          }
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20 w-fit shrink-0 font-mono">
                        {is3MemberTeamSegment ? "3-Member Team Event Included" : "Team Event Selected"}
                      </span>
                    </div>

                    {/* TEAM MEMBER 2 (Teammate 1) */}
                    <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-200 flex items-center gap-2 font-mono">
                          <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-mono">2</span>
                          Teammate 1 (2nd Team Member) <span className="text-pink-500">*</span>
                        </h4>
                        <span className="text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20 px-2.5 py-0.5 rounded-full font-mono w-fit">
                          {hasOtherTeamSegment && is3MemberTeamSegment
                            ? "Shared across all team events (including Tic-Tac-Toe)"
                            : "Required"
                          }
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Teammate Full Name <span className="text-pink-500">*</span></label>
                          <input
                            type="text"
                            placeholder="FULL NAME"
                            value={teamMember2Name}
                            onChange={(e) => setTeamMember2Name(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Gender <span className="text-pink-500">*</span></label>
                          <select
                            value={teamMember2Gender}
                            onChange={(e) => setTeamMember2Gender(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold">SELECT GENDER</option>
                            <option value="male" className="bg-zinc-950 text-white font-extrabold">Male</option>
                            <option value="female" className="bg-zinc-950 text-white font-extrabold">Female</option>
                          </select>
                        </div>

                        {/* Class */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Class Level <span className="text-pink-500">*</span></label>
                          <select
                            value={teamMember2Class}
                            onChange={(e) => setTeamMember2Class(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold">SELECT CLASS</option>
                            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <option key={n} value={String(n)} className="bg-zinc-950 text-white font-extrabold">Class {n}</option>
                            ))}
                          </select>
                        </div>

                        {/* Institute */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Institution / School <span className="text-pink-500">*</span></label>
                          <input
                            type="text"
                            placeholder="INSTITUTE / SCHOOL NAME"
                            value={teamMember2Institute || institute}
                            onChange={(e) => setTeamMember2Institute(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase"
                          />
                        </div>
                      </div>
                    </div>

                    {/* TEAM MEMBER 3 - For 3-Member Team Events (Tic-Tac-Toe, Truss, Wall Magazine) */}
                    {is3MemberTeamSegment && (
                      <div className="p-5 bg-purple-950/20 border border-purple-500/30 rounded-2xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-2 font-mono">
                            <span className="w-5 h-5 rounded-full bg-purple-500/30 text-purple-300 flex items-center justify-center text-[10px] font-mono">3</span>
                            Teammate 2 (3rd Member) <span className="text-purple-400">*</span>
                          </h4>
                          <span className="text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full font-mono w-fit">
                            {hasOtherTeamSegment
                              ? "Required for 3-member team events (Tic-Tac-Toe, Truss, Wall Magazine)"
                              : "Required for 3-member teams"
                            }
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Name */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Teammate Full Name <span className="text-purple-400">*</span></label>
                            <input
                              type="text"
                              placeholder="FULL NAME"
                              value={teamMember3Name}
                              onChange={(e) => setTeamMember3Name(e.target.value)}
                              className="w-full bg-black/60 border border-purple-500/20 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-400 uppercase"
                            />
                          </div>

                          {/* Gender */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Gender <span className="text-purple-400">*</span></label>
                            <select
                              value={teamMember3Gender}
                              onChange={(e) => setTeamMember3Gender(e.target.value)}
                              className="w-full bg-black/60 border border-purple-500/20 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-400 uppercase cursor-pointer"
                            >
                              <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold">SELECT GENDER</option>
                              <option value="male" className="bg-zinc-950 text-white font-extrabold">Male</option>
                              <option value="female" className="bg-zinc-950 text-white font-extrabold">Female</option>
                            </select>
                          </div>

                          {/* Class */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Class Level <span className="text-purple-400">*</span></label>
                            <select
                              value={teamMember3Class}
                              onChange={(e) => setTeamMember3Class(e.target.value)}
                              className="w-full bg-black/60 border border-purple-500/20 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-400 uppercase cursor-pointer"
                            >
                              <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold">SELECT CLASS</option>
                              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                <option key={n} value={String(n)} className="bg-zinc-950 text-white font-extrabold">Class {n}</option>
                              ))}
                            </select>
                          </div>

                          {/* Institute */}
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Institution / School <span className="text-purple-400">*</span></label>
                            <input
                              type="text"
                              placeholder="INSTITUTE / SCHOOL NAME"
                              value={teamMember3Institute || institute}
                              onChange={(e) => setTeamMember3Institute(e.target.value)}
                              className="w-full bg-black/60 border border-purple-500/20 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-purple-400 uppercase"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-12 border-t border-white/5">
                  <button
                    onClick={() => setStep(1)}
                    className="w-full sm:w-auto py-4 px-6 border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Identity
                  </button>

                  <button
                    onClick={handleNextStep2}
                    className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/10 hover:scale-[1.02]"
                  >
                    Proceed to Payment <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="max-w-2xl mx-auto bg-zinc-950 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative"
            >
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-pink-500/5 rounded-full blur-[50px] pointer-events-none" />

              <div className="mb-8 text-center">
                <div className="w-16 h-16 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Coins className="w-8 h-8 animate-bounce" />
                </div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-white">Payment Portal</h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto leading-relaxed">
                  Complete the checkout processing safely via bKash. Paste your Transaction ID and Sender Number below to log your verification query.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}

              {/* Instructions and highlight phone or Proxy alert */}
              {finalPrice === 0 && !isProxyRegistration ? (
                <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 space-y-4 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-wider text-emerald-400">🎉 FREE ENTRY BENEFIT APPLIED</h4>
                    <p className="text-xs text-zinc-300 max-w-md mx-auto leading-relaxed font-medium">
                      All of your selected event segments are <strong className="text-emerald-400 uppercase">100% FREE OF CHARGE</strong>! No bKash payment or manual transaction verification is required. Your ticket will be <strong className="text-emerald-400 font-bold">automatically verified & approved</strong> instantly upon submission!
                    </p>
                  </div>
                </div>
              ) : isProxyRegistration ? (
                <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950/20 via-zinc-950 to-black border border-indigo-500/30 space-y-4 text-center">
                  <Sparkles className="w-10 h-10 text-indigo-400 animate-pulse mx-auto" />
                  <div className="space-y-1">
                    <h4 className="text-sm font-black uppercase tracking-wider text-indigo-400">Administrative Spot Bypass Active</h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      You are executing a spot registration as an administrator. Standard bKash payment verification is bypassed. The participant's record will be saved as fully paid and approved immediately.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="p-8 rounded-[2rem] bg-gradient-to-br from-indigo-950/30 via-purple-950/10 to-black border border-indigo-500/20 space-y-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-pink-500/5 rounded-full blur-[40px] pointer-events-none" />
                    
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-pink-400 font-mono">Official Guidelines</h4>
                      <p className="text-sm font-medium text-white leading-relaxed mt-2 uppercase tracking-wide">
                        {paymentDesc}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-xl bg-black/60 border border-white/5 font-mono">
                      <div className="space-y-0.5 text-center sm:text-left">
                        <span className="text-[8px] text-zinc-500 font-bold uppercase block tracking-wider">bKash Personal/Merchant Account</span>
                        <span className="text-lg font-black text-white tracking-widest">{bkashTarget}</span>
                      </div>

                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(bkashTarget);
                          alert("bKash target phone number copied to clipboard!");
                        }}
                        className="px-4 py-2 bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer border border-pink-500/20"
                      >
                        Copy Phone
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* General Member Verification & 50% Discount Card */}
              <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-950/40 via-indigo-950/20 to-black border border-purple-500/30 space-y-4 my-6 text-left">
                <div className="flex items-center justify-between gap-2 border-b border-purple-500/20 pb-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-purple-400" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 font-mono">
                      Josephite General Member Discount
                    </h4>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    50% OFF
                  </span>
                </div>

                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  Are you a registered General Member of Josephite Math Club? Get a <strong className="text-purple-300 font-bold">50% discount</strong> on all registration fees by verifying your registered Phone Number or Email Address.
                </p>

                {isGeneralMember && memberVerifiedData ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-1 font-mono text-xs">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>General Member Verified! 50% Discount Applied.</span>
                    </div>
                    <p className="text-[11px] text-zinc-300 mt-1">
                      Member: <strong className="text-white">{memberVerifiedData.memberName}</strong> {memberVerifiedData.memberId ? `(${memberVerifiedData.memberId})` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setIsGeneralMember(false);
                        setMemberVerifiedData(null);
                      }}
                      className="text-[10px] text-zinc-400 underline hover:text-white mt-1 cursor-pointer"
                    >
                      Remove discount
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={memberIdentifierInput}
                        onChange={(e) => setMemberIdentifierInput(e.target.value)}
                        placeholder="Enter Member Phone Number or Email..."
                        className="flex-1 bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={handleVerifyGeneralMember}
                        disabled={verifyingMember}
                        className="px-5 py-3 bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-purple-600/20"
                      >
                        {verifyingMember ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Verifying...
                          </>
                        ) : (
                          'Verify & Claim 50%'
                        )}
                      </button>
                    </div>

                    {memberVerificationError && (
                      <p className="text-[11px] font-bold text-rose-400 flex items-center gap-1.5 font-mono">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" /> {memberVerificationError}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Ledger Summary */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4 mt-8">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/5 pb-2 font-mono">TRANSACTION LEDGER SUMMARY</h4>
                
                <div className="space-y-2 text-xs uppercase tracking-wider font-semibold font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Selected Segment Size:</span>
                    <span className="text-white font-bold">{selectedSegments.length} Segments ({paidSoloSegments.length} Solo, {paidTeamSegments.length} Team)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Solo Events Fee:</span>
                    <span className="text-white font-bold">{paidSoloSegments.length > 0 ? "100 BDT (Flat for all solo events)" : "0 BDT"}</span>
                  </div>
                  {paidTeamSegments.length > 0 && (
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Team Event(s) Fee:</span>
                      <span className="text-white font-bold">{paidTeamSegments.length * 200} BDT ({paidTeamSegments.length} x 200 BDT)</span>
                    </div>
                  )}
                  <div className="flex justify-between border-t border-white/5 pt-2">
                    <span className="text-zinc-500">Total Registration Fee:</span>
                    <span className="text-white font-bold">{totalRawPrice} BDT</span>
                  </div>
                  {isGeneralMember && (
                    <div className="flex justify-between text-purple-400 border-b border-white/5 pb-2">
                      <span>General Member 50% Discount:</span>
                      <span>-{discountAmount} BDT</span>
                    </div>
                  )}
                  {hasCaDiscount && (
                    <div className="flex justify-between text-green-400 border-b border-white/5 pb-2">
                      <span>10% CA Code Discount ({caCode}):</span>
                      <span>-{discountAmount} BDT</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-2">
                    <span className="text-pink-400">Net Payable Amount:</span>
                    <span className={finalPrice === 0 ? "text-emerald-400 font-black" : "text-white"}>
                      {finalPrice === 0 ? "0 BDT (FREE ENTRY)" : `${finalPrice} BDT`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Input details */}
              {!isProxyRegistration && finalPrice > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  {/* Sender bKash Phone */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      bKash Sender Mobile <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={senderBkash}
                        onChange={(e) => setSenderBkash(e.target.value)}
                        placeholder="E.G. 017XXXXXXXX"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                      />
                    </div>
                  </div>

                  {/* Transaction ID */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Transaction ID (TrxID) <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        value={trxnId}
                        onChange={(e) => setTrxnId(e.target.value)}
                        placeholder="E.G. KLS8DHF6SK"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all uppercase tracking-wider font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 mt-12 border-t border-white/5">
                <button
                  onClick={() => setStep(2)}
                  className="w-full sm:w-auto py-4 px-6 border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Segments
                </button>

                <button
                  onClick={handleAttemptRegister}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto py-4 px-10 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 disabled:opacity-55 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/20 hover:scale-[1.02]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Submit Registration
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* UNSELECTED EVENTS CONFIRMATION WARNING MODAL */}
        <AnimatePresence>
          {showUnselectedWarningModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="w-full max-w-lg bg-zinc-950 border-2 border-amber-500/40 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden space-y-6"
              >
                <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-amber-500/10 rounded-full blur-[50px] pointer-events-none" />

                <div className="flex items-start justify-between gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <button
                    onClick={() => setShowUnselectedWarningModal(false)}
                    className="p-2 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-2">
                  <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-black uppercase tracking-widest font-mono">
                    Confirmation Notice
                  </span>
                  <h3 className="text-xl font-black uppercase tracking-wider text-white font-mono">
                    Are you sure you want to proceed?
                  </h3>
                  <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                    You have selected <span className="text-pink-400 font-bold">{selectedSegments.length}</span> event(s) out of <span className="text-white font-bold">{INTER_SEGMENTS.filter((seg: any) => isSegmentEligible(seg.id, className).eligible).length}</span> available events for <span className="text-amber-400 font-bold">Class {className}</span>.
                  </p>
                </div>

                {/* Unselected Events list */}
                {(() => {
                  const eligibleForClass = INTER_SEGMENTS
                    .filter((seg: any) => isSegmentEligible(seg.id, className).eligible)
                    .map((seg: any) => seg.id);
                  const unselected = eligibleForClass.filter(
                    (id: string) => !selectedSegments.includes(id) && !alreadyRegisteredEvents.includes(id)
                  );

                  return unselected.length > 0 ? (
                    <div className="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-2 font-mono">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block border-b border-white/10 pb-1.5">
                        Events you have not selected ({unselected.length}):
                      </span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {unselected.map((segId: string) => (
                          <span key={segId} className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-semibold text-zinc-300">
                            {segId}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Re-registration Warning Box */}
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs">
                  <Coins className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-wider text-[10px] text-amber-400 font-mono">
                      Re-registration Fee Notice
                    </p>
                    <p className="text-zinc-300 text-[11px] leading-relaxed">
                      If you decide to participate in any of the remaining events later in a separate submission, standard registration fees (100 BDT flat for solo events, 200 BDT for team events) will apply.
                    </p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnselectedWarningModal(false);
                      setPendingSubmissionConfirmed(true);
                      handleRegister();
                    }}
                    className="flex-1 py-3.5 px-5 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-pink-500/20 text-center"
                  >
                    Yes, Proceed with Selected
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowUnselectedWarningModal(false);
                      setStep(2);
                    }}
                    className="flex-1 py-3.5 px-5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-white/10 text-center"
                  >
                    Go Back & Select More
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
