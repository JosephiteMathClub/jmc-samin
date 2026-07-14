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
  Coins
} from 'lucide-react';
import { supabase } from '../lib/supabase';
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
  { id: "Escape Room", name: "Escape Room", tagline: "Decrypt physical room locks and spatial logic systems.", category: "Team track", icon: Home, color: "from-violet-500/10 to-fuchsia-500/10 text-violet-400 border-violet-500/20" },
  { id: "Combi Verse", name: "Combi Verse", tagline: "Navigate combinatorics, permutations, graph theory networks.", category: "Solo track", icon: Share2, color: "from-cyan-500/10 to-blue-500/10 text-cyan-400 border-cyan-500/20" },
  { id: "Math Memes", name: "Math Memes", tagline: "Design humorous and intellectually witty math memes.", category: "Creative track", icon: Smile, color: "from-yellow-500/10 to-green-500/10 text-yellow-400 border-yellow-500/20" },
  { id: "Math Article", name: "Math Article", tagline: "Draft a well-researched article on advanced mathematical theories.", category: "Writing track", icon: BookOpen, color: "from-zinc-500/10 to-slate-500/10 text-zinc-400 border-zinc-500/20" },
  { id: "Math Vision", name: "Math Vision", tagline: "Design digital graphic art illustrating geometric formulas.", category: "Creative track", icon: ImageIcon, color: "from-pink-500/10 to-purple-500/10 text-pink-400 border-pink-500/20" },
  { id: "Math Drawing", name: "Math Drawing", tagline: "Create pristine hand-drawn sketches of golden ratios and fractals.", category: "Creative track", icon: Edit, color: "from-purple-500/10 to-indigo-500/10 text-purple-400 border-purple-500/20" },
  { id: "Truss", name: "Truss", tagline: "Build high-load structurally sound physical bridge trusses.", category: "Team / Solo track", icon: Construction, color: "from-amber-500/10 to-orange-500/10 text-amber-400 border-amber-500/20" },
  { id: "Wall Magazine Display", name: "Wall Magazine Display", tagline: "Design physical wall posters mapping historical math breakthroughs.", category: "Exhibition track", icon: Layout, color: "from-emerald-500/10 to-green-500/10 text-emerald-400 border-emerald-500/20" }
];

export default function InterEventRegister() {
  const router = useRouter();
  const { isAdmin, isSuperAdmin } = useAuth();
  
  // Gatekeeper status & configurations
  const [checkingStatuses, setCheckingStatuses] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // Settings values fetched from system settings
  const [bkashTarget, setBkashTarget] = useState("01789456123");
  const [paymentDesc, setPaymentDesc] = useState("Please pay BDT 100 registration fee to our bKash personal/merchant account. Highlighted Phone: 01789456123.");
  const [pricePerSegment, setPricePerSegment] = useState(100);
  const [caCodesList, setCaCodesList] = useState<string[]>([]);
  
  // Registration form states
  const [step, setStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [className, setClassName] = useState("");
  const [institute, setInstitute] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [caCode, setCaCode] = useState("N/A");
  
  const [selectedSegments, setSelectedSegments] = useState<string[]>([]);
  
  const [senderBkash, setSenderBkash] = useState("");
  const [trxnId, setTrxnId] = useState("");
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successInfo, setSuccessInfo] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Load gatekeepers and configuration parameters
  useEffect(() => {
    async function loadConfig() {
      try {
        const { data: settings, error } = await supabase
          .from('system_settings')
          .select('key, value');

        if (error) throw error;

        if (settings) {
          // Check global reg form toggle & inter reg specific toggle
          const globalToggle = settings.find(s => s.key === 'event_registration_enabled');
          const interToggle = settings.find(s => s.key === 'inter_registration_enabled');
          
          const isGlobalOn = globalToggle ? globalToggle.value === true : true;
          const isInterOn = interToggle ? interToggle.value === true : true;
          
          setIsLocked(!isGlobalOn || !isInterOn);

          // Fetch inter registration config parameters
          const interConfig = settings.find(s => s.key === 'inter_registration_config');
          if (interConfig && interConfig.value) {
            const val = interConfig.value;
            setBkashTarget(val.bkashNumber || "01789456123");
            let desc = val.paymentDescription || "Please pay BDT 100 registration fee.";
            desc = desc.replace(/150/g, "100").replace(/per event segment/gi, "registration fee");
            setPaymentDesc(desc);
            setPricePerSegment(100);
            setCaCodesList(val.caCodes || []);
          }
        }
      } catch (err) {
        console.warn("Failed to retrieve system settings gracefully:", err);
      } finally {
        setCheckingStatuses(false);
      }
    }
    loadConfig();
  }, []);

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

  // Cost calculation
  const totalRawPrice = selectedSegments.length > 0 ? 100 : 0;
  const hasCaDiscount = false;
  const discountAmount = 0;
  const finalPrice = totalRawPrice;

  // Toggle selection
  const handleToggleSegment = (id: string) => {
    if (selectedSegments.includes(id)) {
      setSelectedSegments(selectedSegments.filter(s => s !== id));
    } else {
      setSelectedSegments([...selectedSegments, id]);
    }
  };

  // Navigations
  const handleNextStep1 = () => {
    if (!fullName.trim() || !className || !institute.trim() || !email.trim() || !phone.trim()) {
      setErrorMessage("Please complete all general information fields before continuing.");
      return;
    }
    
    // Simple email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrorMessage("Please provide a valid email address.");
      return;
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
    setErrorMessage("");
    setStep(3);
  };

  const handleRegister = async () => {
    if (!senderBkash.trim() || !trxnId.trim()) {
      setErrorMessage("Please provide your bKash sender number and the transaction ID.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/events/register-inter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          className,
          institute: institute.trim(),
          caCode: caCode || null,
          bkashNumber: senderBkash.trim(),
          trxnid: trxnId.trim().toUpperCase(),
          amount: finalPrice,
          selectedEvents: selectedSegments
        })
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "A database connectivity or registration error occurred.");
      }

      setSuccessInfo(resData);
      setIsSuccess(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Something went wrong. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
              
              <div className="mb-8 text-center md:text-left">
                <h2 className="text-3xl font-black uppercase tracking-tight text-white flex items-center justify-center md:justify-start gap-3">
                  <User className="w-8 h-8 text-pink-500" /> Participant Identity
                </h2>
                <p className="text-xs text-zinc-500 mt-1 max-w-xl font-medium leading-relaxed">
                  Provide your official academic registry coordinates. Ensure your email and phone numbers are functional, as auto-passcodes will be dispatched there.
                </p>
              </div>

              {errorMessage && (
                <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl text-xs font-bold uppercase tracking-wide flex items-center gap-3">
                  <AlertCircle className="w-5 h-5" /> {errorMessage}
                </div>
              )}

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
                      placeholder="E.G. SAMIN TAUSIF"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all uppercase tracking-wider"
                    />
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
                      onChange={(e) => setClassName(e.target.value)}
                      className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all cursor-pointer"
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
                      placeholder="E.G. SJS / NOTRE DAME COLLEGE"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all uppercase tracking-wider"
                    />
                  </div>
                </div>

                {/* Email address */}
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
                      placeholder="E.G. SAMIN@EMAIL.COM"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
                    />
                  </div>
                </div>

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
                      placeholder="E.G. 017XXXXXXXX"
                      className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all"
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
                      className="w-full bg-[#050508] border border-white/10 rounded-xl pl-12 pr-4 py-4 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 focus:ring-4 focus:ring-pink-500/5 transition-all cursor-pointer"
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

                {/* Segment selection grids */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {INTER_SEGMENTS.map((seg) => {
                    const isSelected = selectedSegments.includes(seg.id);
                    const SegIcon = seg.icon;
                    
                    return (
                      <button
                        key={seg.id}
                        onClick={() => handleToggleSegment(seg.id)}
                        className={`p-6 rounded-2xl text-left border transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden select-none h-[220px] ${
                          isSelected 
                            ? 'bg-gradient-to-b from-indigo-950/40 via-[#0a0525]/30 to-[#020108]/90 border-pink-500/60 shadow-lg shadow-pink-500/5 hover:border-pink-400' 
                            : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/50'
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute top-3 right-3 h-5 w-5 rounded-full bg-pink-500 text-white flex items-center justify-center border border-pink-400">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="space-y-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border bg-gradient-to-br ${seg.color}`}>
                            <SegIcon className="w-4 h-4" />
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-sm font-bold text-white uppercase tracking-wide">{seg.name}</h4>
                            <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">{seg.tagline}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t border-white/5 w-full flex items-center justify-between text-[9px] font-black uppercase tracking-wider font-mono">
                          <span className="text-zinc-500">{seg.category}</span>
                          <span className={`${isSelected ? 'text-pink-400' : 'text-zinc-400'}`}>{isSelected ? '✓ SELECTED' : 'SELECT'}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

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

              {/* Instructions and highlight phone */}
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
