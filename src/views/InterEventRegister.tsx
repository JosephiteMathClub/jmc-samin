"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Sparkles, 
  User, 
  BookOpen, 
  Layers, 
  Hash, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  QrCode, 
  Mail, 
  Calendar, 
  RefreshCw,
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
  UserCheck
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

// Hardcoded segments catalog as pristine baseline
const INTER_SEGMENTS = [
  { id: "Math Olympiad (Find-based)", name: "Math Olympiad (Find-based)", tagline: "Solve numeric mysteries and discover deep hidden structural patterns.", category: "Solo track", icon: Trophy, color: "from-amber-500/10 to-yellow-500/10 text-amber-400 border-amber-500/20" },
  { id: "Math Olympiad (Proof-based)", name: "Math Olympiad (Proof-based)", tagline: "Draft elegant formal proofs and logically sound explanations.", category: "Solo track", icon: FileText, color: "from-blue-500/10 to-cyan-500/10 text-blue-400 border-blue-500/20" },
  { id: "IQ Test", name: "IQ Test", tagline: "Race against the clock in analytical speed reasoning.", category: "Solo track", icon: Brain, color: "from-pink-500/10 to-rose-500/10 text-pink-400 border-pink-500/20" },
  { id: "Human Calculator", name: "Human Calculator", tagline: "Unleash super-speed mental arithmetic and calculation loops.", category: "Solo track", icon: Zap, color: "from-green-500/10 to-emerald-500/10 text-green-400 border-green-500/20" },
  { id: "Genesis", name: "Genesis", tagline: "Interactive math design and scientific origin-based discovery.", category: "Solo track", icon: Sparkles, color: "from-purple-500/10 to-violet-500/10 text-purple-400 border-purple-500/20" },
  { id: "Geometry Dash", name: "Geometry Dash", tagline: "Navigate space calculations, angle proofs, and vector mazes.", category: "Solo track", icon: Compass, color: "from-indigo-500/10 to-blue-500/10 text-indigo-400 border-indigo-500/20" },
  { id: "Probability Pressure", name: "Probability Pressure", tagline: "Calculate rapid-fire odds and stochastic outcomes under stress.", category: "Solo track", icon: Timer, color: "from-red-500/10 to-orange-500/10 text-red-400 border-red-500/20" },
  { id: "Murder Mystery", name: "Murder Mystery", tagline: "Deduce clues and crack mathematical murder mystery cases.", category: "Team / Solo track", icon: Eye, color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20" },
  { id: "Crack the Code", name: "Crack the Code", tagline: "Deconstruct cryptographic ciphers and decode encrypted strings.", category: "Solo track", icon: Lock, color: "from-teal-500/10 to-emerald-500/10 text-teal-400 border-teal-500/20" },
  { id: "Complex Calamity", name: "Complex Calamity", tagline: "Grapple with complex numbers, imaginary axes, and fractals.", category: "Solo track", icon: HelpCircle, color: "from-amber-500/10 to-red-500/10 text-amber-400 border-amber-500/20" },
  { id: "Sudoku", name: "Sudoku", tagline: "Solve grid placement challenges with extreme speed precision.", category: "Solo track", icon: Grid, color: "from-blue-500/10 to-indigo-500/10 text-blue-400 border-blue-500/20" },
  { id: "Rubik’s Cube Showdown", name: "Rubik’s Cube Showdown", tagline: "Manipulate cubic modules and solve cubes in record times.", category: "Solo track", icon: Layers, color: "from-emerald-500/10 to-teal-500/10 text-emerald-400 border-emerald-500/20" },
  { id: "5 min Professor", name: "5 min Professor", tagline: "Deliver a lightning lecture explaining abstract concepts simply.", category: "Solo track", icon: Award, color: "from-yellow-500/10 to-orange-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "Calculus Bee", name: "Calculus Bee", tagline: "Solve derivatives and integral equations in real-time playoffs.", category: "Solo track", icon: Activity, color: "from-red-500/10 to-rose-500/10 text-red-400 border-red-500/20" },
  { id: "Escape Room", name: "Escape Room", tagline: "Decrypt physical room locks and spatial logic systems. (Team Event • Class 9-12)", category: "Team track", icon: Home, color: "from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20" },
  { id: "Combi Verse", name: "Combi Verse", tagline: "Navigate combinatorics, permutations, graph theory networks.", category: "Solo track", icon: Share2, color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20" },
  { id: "Math Memes", name: "Math Memes", tagline: "Design humorous and intellectually witty math memes.", category: "Creative track", icon: Smile, color: "from-yellow-500/10 to-green-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "Math Article", name: "Math Article", tagline: "Draft a well-researched article on advanced mathematical theories.", category: "Writing track", icon: BookOpen, color: "from-zinc-500/10 to-slate-500/10 text-zinc-400 border-zinc-500/20" },
  { id: "Math Vision", name: "Math Vision", tagline: "Design digital graphic art illustrating geometric formulas.", category: "Creative track", icon: ImageIcon, color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20" },
  { id: "Math Drawing", name: "Math Drawing", tagline: "Create pristine hand-drawn sketches of golden ratios and fractals.", category: "Creative track", icon: Edit, color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "Truss", name: "Truss", tagline: "Build high-load structurally sound physical bridge trusses. (Team Event • Class 3-8)", category: "Team track", icon: Construction, color: "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20" },
  { id: "Wall Magazine Display", name: "Wall Magazine Display", tagline: "Design physical wall posters mapping historical math breakthroughs.", category: "Exhibition track", icon: Layout, color: "from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20" }
];

export default function InterEventRegister() {
  const router = useRouter();
  const { user, profile, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  
  // Gatekeeper status & configurations
  const [checkingStatuses, setCheckingStatuses] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // Settings values fetched from system settings
  const [bkashTarget, setBkashTarget] = useState("01789456123");
  const [paymentDesc, setPaymentDesc] = useState("Please pay BDT 100 registration fee to our bKash personal/merchant account. Highlighted Phone: 01789456123.");
  const [pricePerSegment, setPricePerSegment] = useState(100);
  const [caCodesList, setCaCodesList] = useState<string[]>([]);

  // Launch, Video Teaser & Coming Soon States
  const [isEventPageLaunched, setIsEventPageLaunched] = useState(false);
  const [teaserVideoEnabled, setTeaserVideoEnabled] = useState(true);
  const [teaserVideoUrl, setTeaserVideoUrl] = useState("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
  const [showingVideo, setShowingVideo] = useState(true);
  const [videoEnded, setVideoEnded] = useState(false);
  
  // Video Player Controls
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [hasStartedAudio, setHasStartedAudio] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);

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

  const hasTeamSegment = selectedSegments.some(id => {
    const seg = INTER_SEGMENTS.find(s => s.id === id);
    return id === "Escape Room" || id === "Truss" || id === "Murder Mystery" || (seg && seg.category.toLowerCase().includes("team"));
  });

  // Helper function to validate segment class eligibility
  const isSegmentEligible = (segmentId: string, classVal: string): { eligible: boolean; reason?: string } => {
    if (!classVal) return { eligible: true };
    const numClass = parseInt(classVal, 10);

    if (segmentId === "Escape Room") {
      if (isNaN(numClass) || numClass < 9 || numClass > 12) {
        return {
          eligible: false,
          reason: "Escape Room is for Secondary (Class 9-10) & Higher Secondary (Class 11-12)."
        };
      }
    }

    if (segmentId === "Truss") {
      if (isNaN(numClass) || numClass < 3 || numClass > 8) {
        return {
          eligible: false,
          reason: "Truss is for Primary (Class 3-5) & Secondary (Class 6-8)."
        };
      }
    }

    return { eligible: true };
  };
  
  const [senderBkash, setSenderBkash] = useState("");
  const [trxnId, setTrxnId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

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
      return {
        type: 'youtube',
        embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=${mutedState ? 1 : 0}&controls=1&enablejsapi=1&rel=0`
      };
    }

    // Vimeo
    const vimeoRegExp = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/;
    const vimeoMatch = url.match(vimeoRegExp);
    if (vimeoMatch && vimeoMatch[3]) {
      return {
        type: 'vimeo',
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[3]}?autoplay=1&muted=${mutedState ? 1 : 0}`
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

          const launched = Boolean(configVal.isEventPageLaunched);
          setIsEventPageLaunched(launched);

          const enabled = configVal.teaserVideoEnabled !== false;
          setTeaserVideoEnabled(enabled);

          if (configVal.teaserVideoUrl && typeof configVal.teaserVideoUrl === 'string' && configVal.teaserVideoUrl.trim().length > 0) {
            setTeaserVideoUrl(configVal.teaserVideoUrl.trim());
          }

          if (!enabled) {
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
  }, [teaserVideoEnabled, showingVideo, videoEnded, teaserVideoUrl]);

  // Video End and Fullscreen Audio Start Handlers
  const handleVideoEnd = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    setVideoEnded(true);
    setShowingVideo(false);
  };

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

  // Cost calculation
  const totalRawPrice = selectedSegments.length > 0 ? 100 : 0;
  const hasCaDiscount = false;
  const discountAmount = 0;
  const finalPrice = totalRawPrice;

  // Toggle selection
  const handleToggleSegment = (id: string) => {
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

  // Select all / Deselect all events
  const handleSelectAllSegments = () => {
    const eligibleIds = INTER_SEGMENTS
      .filter(seg => isSegmentEligible(seg.id, className).eligible)
      .map(seg => seg.id);

    if (selectedSegments.length === eligibleIds.length && eligibleIds.every(id => selectedSegments.includes(id))) {
      setSelectedSegments([]);
    } else {
      setSelectedSegments(eligibleIds);
    }
  };

  // Navigations
  const handleNextStep1 = () => {
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
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (selectedSegments.length === 0) {
      setErrorMessage("You must select at least one mathematical event segment to register.");
      return;
    }

    if (hasTeamSegment) {
      const tm2Inst = teamMember2Institute.trim() || institute.trim();
      if (!teamMember2Name.trim() || !teamMember2Class || !tm2Inst || !teamMember2Gender) {
        setErrorMessage("Please fill all required details (Name, Class, Institute, and Gender) for Team Member 2.");
        return;
      }

      const is3MemberEvent = selectedSegments.some(id => id === "Escape Room" || id === "Truss");
      if (is3MemberEvent) {
        const tm3Inst = teamMember3Institute.trim() || institute.trim();
        if (!teamMember3Name.trim() || !teamMember3Class || !tm3Inst || !teamMember3Gender) {
          setErrorMessage("Please fill all required details (Name, Class, Institute, and Gender) for Team Member 3.");
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

    if (!isProxyRegistration && (!senderBkash.trim() || !trxnId.trim())) {
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
          caCode: caCode || null,
          bkashNumber: isProxyRegistration ? 'Proxy (Admin)' : senderBkash.trim(),
          trxnid: isProxyRegistration ? 'PROXY-' + Math.random().toString(36).substring(2, 9).toUpperCase() : trxnId.trim().toUpperCase(),
          amount: finalPrice,
          selectedEvents: selectedSegments,
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

      setSuccessInfo(resData);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // TEASER INTRO VIDEO OVERLAY (Pre-Launch Mode & Initial Entrance)
  if (teaserVideoEnabled && showingVideo && !videoEnded) {
    const videoMedia = getVideoMediaInfo(teaserVideoUrl, isMuted);

    return (
      <div 
        ref={videoContainerRef}
        className="fixed inset-0 z-[9999] bg-black text-white flex flex-col justify-between overflow-hidden select-none font-sans"
      >
        {/* Fullscreen Video Element or Embed Iframe */}
        <div className="absolute inset-0 z-0 flex items-center justify-center bg-black">
          {videoMedia.type === 'direct' ? (
            <video
              ref={videoRef}
              src={videoMedia.url}
              autoPlay
              playsInline
              muted={isMuted}
              onEnded={handleVideoEnd}
              onError={() => {
                console.warn("Video failed or unplayable URL:", videoMedia.url);
              }}
              onTimeUpdate={() => {
                if (videoRef.current) {
                  const pct = (videoRef.current.currentTime / videoRef.current.duration) * 100;
                  setVideoProgress(isNaN(pct) ? 0 : pct);
                }
              }}
              className="w-full h-full object-contain pointer-events-auto"
            />
          ) : (
            <iframe
              src={videoMedia.embedUrl}
              title="Teaser Video"
              className="w-full h-full border-0 pointer-events-auto"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
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
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono font-black uppercase tracking-widest text-pink-400">CHAMPIONSHIP CATALOG</span>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Explore All 22 Championship Segments</h2>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">Get your mathematical squad prepared across solo, team, olympiad, and creative tracks.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTER_SEGMENTS.map((seg) => {
              const IconComp = seg.icon;
              return (
                <div key={seg.id} className="bg-zinc-950/60 border border-white/10 rounded-2xl p-5 space-y-3 relative overflow-hidden group hover:border-pink-500/40 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-pink-400 px-2.5 py-1 bg-pink-500/10 rounded-md border border-pink-500/20">
                      {seg.category}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> LOCKED
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-white group-hover:scale-110 transition-transform">
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight">{seg.name}</h3>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{seg.tagline}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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

              <div className="space-y-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                  Use your email/phone to login to your dashboard to download your entry slip!
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => router.push('/auth?mode=login')}
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
              className="bg-zinc-950 border border-white/10 rounded-[3rem] p-8 md:p-12 shadow-2xl relative"
            >
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
                    <Mail className="w-7 h-7" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-black uppercase tracking-wider text-white">
                      {isProxyRegistration ? "Does this student have a valid Email?" : "Do you have a valid Email Address?"}
                    </h4>
                    <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                      {isProxyRegistration 
                        ? "If the student has an email address, their entry passes will be sent there. Otherwise, we can generate a virtual pass mapped to their phone number."
                        : "We use your email address to send your entry passes, confirmation credentials, and payment invoices. If you do not have one, we can auto-generate a virtual account using your phone number."}
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setHasEmailAddress(true);
                      }}
                      className="flex-1 py-4 px-6 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-pink-500/15"
                    >
                      Yes, {isProxyRegistration ? "Has Email" : "I have an Email"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setHasEmailAddress(false);
                        setEmail('');
                      }}
                      className="flex-1 py-4 px-6 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer border border-white/5"
                    >
                      No, {isProxyRegistration ? "No Email (Phone Only)" : "I do not have one"}
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Class Level <span className="text-pink-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <select
                        value={className}
                        onChange={(e) => {
                          const newCls = e.target.value;
                          setClassName(newCls);
                          if (newCls) {
                            setSelectedSegments(prev => prev.filter(id => isSegmentEligible(id, newCls).eligible));
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
                          onBlur={() => checkEmailSilently(email)}
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
                        disabled={isProxyRegistration && (proxyMethod === 'phone' || !proxyVerified || !proxyPhoneEditable)}
                        placeholder="E.G. 017XXXXXXXX"
                        className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  {/* Selective CA Code Dropdown */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2 font-mono">
                      Campus Ambassador (CA) Code
                    </label>
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
                    {caCode && caCode !== "N/A" && (
                      <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider font-mono">
                        ✨ CA Code Applied! Verification status will be tracked on your dashboard.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-8 mt-8 border-t border-white/5">
                <button
                  onClick={handleNextStep1}
                  className="w-full sm:w-auto py-4 px-8 bg-gradient-to-r from-pink-500 to-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-pink-500/10 hover:scale-[1.02]"
                >
                  Continue to Segments <ArrowRight className="w-4 h-4" />
                </button>
              </div>
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
                      Select any number of our 22 national mathematical event segments. The total registration fee is BDT <span className="text-pink-400 font-bold">100</span> regardless of how many segments you choose.
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

                {/* Select All Option */}
                <div className="flex justify-between items-center mb-6 bg-zinc-900/40 border border-white/5 rounded-2xl p-4 md:px-6">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 font-mono">
                    Selected Segments: <span className="text-pink-400 font-black">{selectedSegments.length}</span> of {INTER_SEGMENTS.length}
                  </div>
                  <button
                    type="button"
                    onClick={handleSelectAllSegments}
                    className="px-5 py-2.5 bg-white/5 border border-white/10 hover:border-pink-500/30 hover:bg-pink-500/10 text-[10px] font-black uppercase tracking-wider text-zinc-300 hover:text-pink-400 rounded-full transition-all cursor-pointer flex items-center gap-2 font-mono select-none"
                  >
                    {selectedSegments.length === INTER_SEGMENTS.length ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-pink-400" />
                        Deselect All
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Select All
                      </>
                    )}
                  </button>
                </div>

                {/* Segment selection grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {INTER_SEGMENTS.map((seg) => {
                    const isSelected = selectedSegments.includes(seg.id);
                    const SegIcon = seg.icon;
                    const eligibility = isSegmentEligible(seg.id, className);
                    const isTeamEvent = seg.id === "Escape Room" || seg.id === "Truss" || seg.category.toLowerCase().includes("team");
                    
                    return (
                      <button
                        key={seg.id}
                        type="button"
                        onClick={() => handleToggleSegment(seg.id)}
                        className={`p-6 rounded-2xl text-left border transition-all flex flex-col justify-between relative overflow-hidden select-none min-h-[230px] ${
                          !eligibility.eligible
                            ? 'bg-zinc-950/40 border-white/5 opacity-60 cursor-not-allowed hover:border-rose-500/30'
                            : isSelected 
                              ? 'bg-gradient-to-b from-indigo-950/40 via-[#0a0525]/30 to-[#020108]/90 border-pink-500/60 shadow-lg shadow-pink-500/5 hover:border-pink-400 cursor-pointer' 
                              : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/50 cursor-pointer'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-pink-500 text-white flex items-center justify-center border border-pink-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br ${seg.color}`}>
                              <SegIcon className="w-4 h-4" />
                            </div>
                            {isTeamEvent && (
                              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 bg-amber-500/10 rounded border border-amber-500/20 flex items-center gap-1">
                                👥 TEAM EVENT
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">{seg.name}</h4>
                            <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">{seg.tagline}</p>
                          </div>

                          {!eligibility.eligible && (
                            <div className="mt-2 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[9px] font-mono text-rose-400 leading-tight">
                              ⚠️ {eligibility.reason}
                            </div>
                          )}
                        </div>

                        <div className="pt-3 border-t border-white/5 w-full flex items-center justify-between text-[9px] font-black uppercase tracking-wider font-mono mt-3">
                          <span className="text-zinc-500">{seg.category}</span>
                          <span className={`${!eligibility.eligible ? 'text-rose-500' : isSelected ? 'text-pink-400' : 'text-zinc-400'}`}>
                            {!eligibility.eligible ? 'INELIGIBLE' : isSelected ? '✓ SELECTED' : 'SELECT'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* TEAM MEMBERS SECTION IF A TEAM EVENT IS SELECTED */}
                {hasTeamSegment && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 space-y-6 p-6 rounded-3xl bg-zinc-900/60 border border-pink-500/20"
                  >
                    <div className="border-b border-white/10 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-pink-400 flex items-center gap-2 font-mono">
                          <User className="w-4 h-4" /> Team Members Information
                        </h3>
                        <p className="text-[10px] text-zinc-400 mt-1 uppercase font-mono font-bold">
                          Leader: {fullName || 'Registrant'} ({className ? `Class ${className}` : ''}) — Only Name, Class, Institute & Gender required
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-pink-500/10 text-pink-400 border border-pink-500/20 w-fit">
                        Team Event Selected
                      </span>
                    </div>

                    {/* TEAM MEMBER 2 */}
                    <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-mono">2</span>
                        Team Member 2
                      </h4>

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

                    {/* TEAM MEMBER 3 */}
                    <div className="p-5 bg-black/40 border border-white/5 rounded-2xl space-y-4">
                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2 font-mono">
                        <span className="w-5 h-5 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center text-[10px] font-mono">3</span>
                        Team Member 3 {selectedSegments.some(id => id === "Escape Room" || id === "Truss") ? '(Required)' : '(Optional)'}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Teammate Full Name</label>
                          <input
                            type="text"
                            placeholder="FULL NAME"
                            value={teamMember3Name}
                            onChange={(e) => setTeamMember3Name(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase"
                          />
                        </div>

                        {/* Gender */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Gender</label>
                          <select
                            value={teamMember3Gender}
                            onChange={(e) => setTeamMember3Gender(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold">SELECT GENDER</option>
                            <option value="male" className="bg-zinc-950 text-white font-extrabold">Male</option>
                            <option value="female" className="bg-zinc-950 text-white font-extrabold">Female</option>
                          </select>
                        </div>

                        {/* Class */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Class Level</label>
                          <select
                            value={teamMember3Class}
                            onChange={(e) => setTeamMember3Class(e.target.value)}
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
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Institution / School</label>
                          <input
                            type="text"
                            placeholder="INSTITUTE / SCHOOL NAME"
                            value={teamMember3Institute || institute}
                            onChange={(e) => setTeamMember3Institute(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500 uppercase"
                          />
                        </div>
                      </div>
                    </div>
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
              {isProxyRegistration ? (
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

              {/* Ledger Summary */}
              <div className="bg-black/40 border border-white/5 rounded-2xl p-6 space-y-4 mt-8">
                <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 border-b border-white/5 pb-2 font-mono">TRANSACTION LEDGER SUMMARY</h4>
                
                <div className="space-y-2 text-xs uppercase tracking-wider font-semibold font-mono">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Selected Segment Size:</span>
                    <span className="text-white font-bold">{selectedSegments.length} Segments</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Raw Registration Cost:</span>
                    <span className="text-white font-bold">{totalRawPrice} BDT</span>
                  </div>
                  {hasCaDiscount && (
                    <div className="flex justify-between text-green-400 border-b border-white/5 pb-2">
                      <span>10% CA Code Discount ({caCode}):</span>
                      <span>-{discountAmount} BDT</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black pt-2">
                    <span className="text-pink-400">Net Payable Amount:</span>
                    <span className="text-white">{finalPrice} BDT</span>
                  </div>
                </div>
              </div>

              {/* Input details */}
              {!isProxyRegistration && (
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
                  onClick={handleRegister}
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
      </div>
    </div>
  );
}
