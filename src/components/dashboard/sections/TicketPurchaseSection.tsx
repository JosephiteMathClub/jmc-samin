"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Ticket, 
  CheckCircle2, 
  XCircle, 
  Award, 
  Gift, 
  Cookie, 
  Loader2, 
  ShieldCheck, 
  ShieldAlert,
  AlertCircle, 
  RefreshCw, 
  Sparkles, 
  Filter,
  Check,
  User,
  Users,
  Building,
  BookOpen,
  QrCode,
  FileText,
  Camera,
  Scan,
  Mail,
  Phone,
  Layers,
  Grid,
  Trophy,
  Zap,
  Brain,
  Lock,
  Compass,
  Timer,
  Activity,
  Share2,
  Smile,
  ImageIcon,
  Edit,
  Home,
  Construction,
  Layout,
  CheckSquare,
  Square,
  UserPlus,
  Trash2,
  Tag,
  HelpCircle,
  ArrowUpDown,
  SlidersHorizontal,
  Download,
  Table as TableIcon,
  LayoutGrid,
  ExternalLink,
  Copy
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { SUPER_ADMIN_EMAILS } from '../../../lib/constants';
import { matchesSearchWithFuzzy, resolveEventNames } from '../../../lib/utils';
import { playSuccessSound, playErrorSound } from '../../../lib/sound';
import QRScanner from '../QRScanner';
import { PurchaseSlipModal, PurchaseSlipCandidate } from '../PurchaseSlipModal';

export type EventCategoryType = 'Primary' | 'Junior' | 'Secondary' | 'Higher Secondary';

export interface SpotFestivalEvent {
  id: string;
  name: string;
  category: 'Solo' | 'Team' | 'Creative' | 'Writing';
  isTeamEvent: boolean;
  teamSize: number; // 1, 2, or 3
  allowedCategories: EventCategoryType[];
  description: string;
}

export const SPOT_FESTIVAL_EVENTS: SpotFestivalEvent[] = [
  // Solo Events
  {
    id: "Math Olympiad (Find-based)",
    name: "Math Olympiad (Find-based)",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Solve numeric mysteries and discover deep hidden structural patterns."
  },
  {
    id: "Math Olympiad (Proof-based)",
    name: "Math Olympiad (Proof-based)",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Draft elegant formal proofs and logically sound explanations."
  },
  {
    id: "IQ Test",
    name: "IQ Test",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Race against the clock in analytical speed reasoning."
  },
  {
    id: "Human Calculator",
    name: "Human Calculator",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior"],
    description: "Super-speed mental arithmetic and calculation loops (Classes 3-8)."
  },
  {
    id: "Genesis",
    name: "Genesis",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Interactive math design and scientific origin-based discovery."
  },
  {
    id: "Geometry Dash",
    name: "Geometry Dash",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Navigate space calculations, angle proofs, and vector mazes (Classes 9-12)."
  },
  {
    id: "Probability Pressure",
    name: "Probability Pressure",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Calculate rapid-fire odds and stochastic outcomes under stress (Classes 9-12)."
  },
  {
    id: "Secret Event",
    name: "Secret Event",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Deduce clues, decrypt secret files, and solve the covert mathematical secret event challenge."
  },
  {
    id: "Crack the Code",
    name: "Crack the Code",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Deconstruct cryptographic ciphers and decode encrypted strings."
  },
  {
    id: "Complex Calamity",
    name: "Complex Calamity",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Grapple with complex numbers, imaginary axes, and fractals (Classes 9-12)."
  },
  {
    id: "Sudoku",
    name: "Sudoku",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Solve grid placement challenges with extreme speed precision."
  },
  {
    id: "Rubik’s Cube Showdown",
    name: "Rubik’s Cube Showdown",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Manipulate cubic modules and solve cubes in record times."
  },
  {
    id: "5 min Professor",
    name: "5 min Professor",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Deliver a lightning lecture explaining abstract concepts simply (Classes 9-12)."
  },
  {
    id: "Calculus Bee",
    name: "Calculus Bee",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Solve derivatives and integral equations in real-time playoffs (Classes 9-12)."
  },
  {
    id: "Combi Verse",
    name: "Combi Verse",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Navigate combinatorics, permutations, graph theory networks (Classes 9-12)."
  },
  {
    id: "Singularity",
    name: "Singularity",
    category: "Solo",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Secondary", "Higher Secondary"],
    description: "Explore boundary-pushing theoretical physics & abstract math (Classes 9-12)."
  },
  {
    id: "Math Memes",
    name: "Math Memes",
    category: "Creative",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Design humorous and intellectually witty math memes."
  },
  {
    id: "Math Article",
    name: "Math Article",
    category: "Writing",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Draft a well-researched article on mathematical theories."
  },
  {
    id: "Math Vision",
    name: "Math Vision",
    category: "Creative",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Design digital graphic art illustrating geometric formulas."
  },
  {
    id: "Math Drawing",
    name: "Math Drawing",
    category: "Creative",
    isTeamEvent: false,
    teamSize: 1,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Create hand-drawn sketches of golden ratios and fractals."
  },

  // Team Events
  {
    id: "Escape Room",
    name: "Escape Room",
    category: "Team",
    isTeamEvent: true,
    teamSize: 2,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Decrypt physical room locks and spatial logic systems (2 members, All Categories)."
  },
  {
    id: "Tic-Tac-Toe",
    name: "Tic-Tac-Toe",
    category: "Team",
    isTeamEvent: true,
    teamSize: 3,
    allowedCategories: ["Primary", "Junior"],
    description: "Strategic mathematical Tic-Tac-Toe grid playoffs (3 members, Primary & Junior)."
  },
  {
    id: "Truss",
    name: "Truss",
    category: "Team",
    isTeamEvent: true,
    teamSize: 3,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Build high-load structurally sound physical bridge trusses (3 members, All Categories)."
  },
  {
    id: "Wall Magazine Display",
    name: "Wall Magazine Display",
    category: "Team",
    isTeamEvent: true,
    teamSize: 3,
    allowedCategories: ["Primary", "Junior", "Secondary", "Higher Secondary"],
    description: "Design physical wall posters mapping historical math breakthroughs (3 members, All Categories)."
  }
];

export const detectCategoryFromClass = (cls: string): EventCategoryType => {
  const norm = cls.trim().toLowerCase();
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0]);
    if (val >= 3 && val <= 5) return 'Primary';
    if (val >= 6 && val <= 8) return 'Junior';
    if (val >= 9 && val <= 10) return 'Secondary';
    if (val >= 11 && val <= 12) return 'Higher Secondary';
  }
  if (norm.includes('xii') || norm.includes('12') || norm.includes('eleven') || norm.includes('twelve') || norm.includes('xi') || norm.includes('11') || norm.includes('hsc') || norm.includes('a-level') || norm.includes('a level')) {
    return 'Higher Secondary';
  }
  if (norm.includes('ix') || norm.includes('9') || norm.includes('x') || norm.includes('10') || norm.includes('ssc') || norm.includes('o-level') || norm.includes('o level')) {
    return 'Secondary';
  }
  if (norm.includes('vi') || norm.includes('6') || norm.includes('vii') || norm.includes('7') || norm.includes('viii') || norm.includes('8') || norm.includes('junior')) {
    return 'Junior';
  }
  if (norm.includes('iii') || norm.includes('3') || norm.includes('iv') || norm.includes('4') || norm.includes('v') || norm.includes('5') || norm.includes('primary')) {
    return 'Primary';
  }
  return 'Secondary';
};

interface TicketPurchase {
  id: string; // user UUID
  fullName: string;
  email: string;
  phone: string;
  memberId?: string;
  class: string;
  section: string;
  roll: string;
  school?: string;
  confirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  confirmedByName?: string;
  confirmedByEmail?: string;
  validated: boolean;
  validatedAt?: string;
  validatedBy?: string;
  validatedByName?: string;
  validatedByEmail?: string;
  snacks: boolean;
  certificate: boolean;
  souvenir: boolean;
  candidateType: 'general' | 'ec' | 'non_general' | 'spot';
  teamName?: string;
  teamMembers?: any[];
  category?: EventCategoryType;
  eventsList?: string[];
  trxnid?: string;
}

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  memberId?: string;
  class: string;
  section: string;
  roll: string;
  school: string;
  candidateType: 'general' | 'ec' | 'non_general' | 'spot';
  eventsList: string[];
  teamName?: string;
  teamMembers?: any[];
  category?: EventCategoryType;
  trxnid?: string;
}

export interface TicketPurchaseSectionProps {
  isSuperAdmin?: boolean;
}

export function TicketPurchaseSection({ isSuperAdmin: propIsSuperAdmin }: TicketPurchaseSectionProps = {}) {
  const { user, profile, isSuperAdmin: authIsSuperAdmin } = useAuth();
  
  const userEmail = (user?.email || "").toLowerCase().trim();
  const profileRole = (profile?.role || "").toString().toLowerCase().trim();
  
  const isSuperAdmin = Boolean(
    propIsSuperAdmin ||
    authIsSuperAdmin ||
    profileRole === 'super_admin' ||
    SUPER_ADMIN_EMAILS.map(e => e.toLowerCase().trim()).includes(userEmail)
  );
  
  const currentAdminName = profile?.full_name || profile?.fullName || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Admin';
  const currentAdminEmail = user?.email || '';
  
  // App States
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [purchases, setPurchases] = useState<Record<string, TicketPurchase>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Subtab State
  const [subTab, setSubTab] = useState<'validation' | 'tickify_qr' | 'spot_purchase'>('validation');

  // Purchase Slip Modal State
  const [selectedSlipCandidate, setSelectedSlipCandidate] = useState<PurchaseSlipCandidate | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);

  const handleOpenSlip = (cand: Candidate) => {
    const p = purchases[cand.id];
    setSelectedSlipCandidate({
      id: cand.id,
      fullName: cand.fullName,
      email: cand.email,
      phone: cand.phone,
      memberId: cand.memberId,
      class: cand.class,
      section: cand.section,
      roll: cand.roll,
      school: cand.school,
      candidateType: cand.candidateType,
      eventsList: cand.eventsList || [],
      teamName: cand.teamName || p?.teamName,
      teamMembers: cand.teamMembers || p?.teamMembers,
      verified: p?.validated,
      confirmed: p?.confirmed,
    });
    setIsSlipModalOpen(true);
  };

  // Tickify Continuous QR Scanner State & Overlay Popup
  const [tickifyScanPopup, setTickifyScanPopup] = useState<{
    type: 'verified' | 'already' | 'error';
    candidateName?: string;
    memberId?: string;
    className?: string;
    message: string;
  } | null>(null);

  // Quick scanner modal state accessible from any subtab
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  const scanCooldownRef = useRef<{ [key: string]: number }>({});

  // Helper to test if a string is a valid UUID
  const isValidUuid = (str: string): boolean => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str.trim());
  };

  // Helper to extract all possible search criteria from any QR code payload
  const extractIdentifiers = (scannedText: string) => {
    const ids: string[] = [];
    const names: string[] = [];
    const emails: string[] = [];
    const phones: string[] = [];
    const trxnids: string[] = [];

    const raw = (scannedText || '').trim();
    if (!raw) return { ids, names, emails, phones, trxnids, raw };

    // 1. Try parsing JSON (Profile QR, Ticket Slip QR, ID Card QR)
    try {
      const json = JSON.parse(raw);
      if (json && typeof json === 'object') {
        if (json.id) ids.push(String(json.id).trim());
        if (json.member_id) ids.push(String(json.member_id).trim());
        if (json.memberId) ids.push(String(json.memberId).trim());
        if (json.ticketId) ids.push(String(json.ticketId).trim());
        if (json.ticket_id) ids.push(String(json.ticket_id).trim());
        if (json.code) ids.push(String(json.code).trim());
        if (json.name) names.push(String(json.name).trim());
        if (json.full_name) names.push(String(json.full_name).trim());
        if (json.fullName) names.push(String(json.fullName).trim());
        if (json.email) emails.push(String(json.email).trim());
        if (json.phone) phones.push(String(json.phone).trim());
        if (json.trxnid) trxnids.push(String(json.trxnid).trim());
        if (json.trxn_id) trxnids.push(String(json.trxn_id).trim());
        if (json.trxId) trxnids.push(String(json.trxId).trim());
      }
    } catch (e) {
      // 2. Try URL query params (e.g. https://.../verify?id=10452&trxnid=...)
      if (raw.includes('?') && (raw.includes('id=') || raw.includes('member_id=') || raw.includes('ticket='))) {
        try {
          const url = new URL(raw);
          const uId = url.searchParams.get('id') || url.searchParams.get('member_id') || url.searchParams.get('ticket');
          if (uId) ids.push(uId.trim());
          const uTrx = url.searchParams.get('trxnid') || url.searchParams.get('trxn_id');
          if (uTrx) trxnids.push(uTrx.trim());
          const uPhone = url.searchParams.get('phone');
          if (uPhone) phones.push(uPhone.trim());
          const uEmail = url.searchParams.get('email');
          if (uEmail) emails.push(uEmail.trim());
        } catch (_) {}
      }

      // 3. String lines / regex patterns (PassId:, ID:, MemberID:, Name:, Phone:, etc.)
      const lines = raw.split(/\r?\n/);
      for (const line of lines) {
        const passMatch = line.match(/PassId:\s*([^\r\n]+)/i);
        if (passMatch) ids.push(passMatch[1].trim());
        const idMatch = line.match(/\b(id|member[-_]?id|ticket[-_]?id|code):\s*([^\r\n]+)/i);
        if (idMatch) ids.push(idMatch[2].trim());
        const nameMatch = line.match(/Name:\s*([^\r\n]+)/i);
        if (nameMatch) names.push(nameMatch[1].trim());
        const phoneMatch = line.match(/Phone:\s*([^\r\n]+)/i);
        if (phoneMatch) phones.push(phoneMatch[1].trim());
        const trxMatch = line.match(/trxn?id:\s*([^\r\n]+)/i);
        if (trxMatch) trxnids.push(trxMatch[1].trim());
      }
    }

    // Always include raw string as candidate ID
    ids.push(raw);

    return {
      ids: Array.from(new Set(ids.filter(Boolean))),
      names: Array.from(new Set(names.filter(Boolean))),
      emails: Array.from(new Set(emails.filter(Boolean))),
      phones: Array.from(new Set(phones.filter(Boolean))),
      trxnids: Array.from(new Set(trxnids.filter(Boolean))),
      raw
    };
  };

  // Helper to normalize alphanumeric IDs
  const normalizeCode = (val: string): string => {
    if (!val) return '';
    return val.toUpperCase().replace(/^(JMC|SPOT)[-_]/i, '').replace(/^#/, '').trim();
  };

  // Helper to normalize numbers without leading zeroes
  const normalizeDigits = (val: string): string => {
    if (!val) return '';
    const digits = val.replace(/\D/g, '');
    return digits.replace(/^0+/, '');
  };

  // Helper to find candidate by decoded QR text
  const findMatchingCandidate = useCallback((scannedText: string, candidatesList: Candidate[]) => {
    if (!scannedText || !candidatesList || candidatesList.length === 0) return null;

    const { ids, names, emails, phones, trxnids, raw } = extractIdentifiers(scannedText);
    const rawLower = raw.toLowerCase();

    // Prepare normalized search tokens
    const normalizedIds = ids.map(id => normalizeCode(id)).filter(Boolean);
    const normalizedDigitsList = ids.map(id => normalizeDigits(id)).filter(d => d.length >= 1);
    const lowerNames = names.map(n => n.toLowerCase().trim()).filter(Boolean);
    const lowerEmails = emails.map(e => e.toLowerCase().trim()).filter(Boolean);
    const normalizedPhones = phones.map(p => normalizeDigits(p)).filter(p => p.length >= 7);
    const upperTrxns = trxnids.map(t => t.toUpperCase().trim()).filter(Boolean);

    for (const cand of candidatesList) {
      const cMemberId = cand.memberId ? cand.memberId.toUpperCase().trim() : '';
      const cId = (cand.id || '').toUpperCase().trim();
      const cNormMemberId = normalizeCode(cMemberId);
      const cNormId = normalizeCode(cId);
      const cMemberDigits = normalizeDigits(cMemberId);
      const cPhoneDigits = normalizeDigits(cand.phone || '');
      const cEmailLower = (cand.email || '').toLowerCase().trim();
      const cNameLower = (cand.fullName || '').toLowerCase().trim();

      // 1. Direct ID / UUID match
      if (ids.some(id => id.toUpperCase() === cId || (cMemberId && id.toUpperCase() === cMemberId))) {
        return cand;
      }

      // 2. Normalized Code Match (e.g. 10452 matches JMC-10452 or SPOT-10452)
      if (normalizedIds.some(norm => norm && (norm === cNormMemberId || norm === cNormId || `SPOT-${norm}` === cMemberId || `JMC-${norm}` === cMemberId))) {
        return cand;
      }

      // 3. Numeric Digits Match (e.g. "010452" matches "10452", "001" matches "1" for EC)
      if (cMemberDigits && normalizedDigitsList.some(d => d === cMemberDigits)) {
        return cand;
      }

      // 4. Spot ID Match (e.g. spotId "1045" matches candidate id "spot-1045")
      if (ids.some(id => cId === `SPOT-${id.toUpperCase()}` || cId === `SPOT-${normalizeCode(id)}`)) {
        return cand;
      }

      // 5. Phone Match (compare last 8-11 digits)
      if (cPhoneDigits && cPhoneDigits.length >= 7) {
        if (normalizedPhones.some(p => p === cPhoneDigits || p.endsWith(cPhoneDigits) || cPhoneDigits.endsWith(p))) {
          return cand;
        }
        if (normalizedDigitsList.some(d => d.length >= 8 && (d === cPhoneDigits || cPhoneDigits.endsWith(d)))) {
          return cand;
        }
      }

      // 6. Email Match
      if (cEmailLower && (lowerEmails.includes(cEmailLower) || rawLower === cEmailLower || rawLower.includes(cEmailLower))) {
        return cand;
      }

      // 7. Transaction ID Match
      if (upperTrxns.some(trx => cId.includes(trx) || (cand.id && cand.id.toUpperCase().includes(trx)))) {
        return cand;
      }

      // 8. Exact Name Match (only if name was explicitly provided in JSON payload)
      if (lowerNames.length > 0 && lowerNames.some(n => n.length >= 4 && n === cNameLower)) {
        return cand;
      }
    }

    return null;
  }, []);

  // Continuous Scan Handler for Tickify Mode & Modal Scanner
  const handleTickifyScan = useCallback(async (decodedText: string) => {
    if (!decodedText || !decodedText.trim()) return;

    const cleanRaw = decodedText.trim();
    const now = Date.now();
    if (scanCooldownRef.current[cleanRaw] && now - scanCooldownRef.current[cleanRaw] < 2000) {
      return; // 2s cooldown per identical QR code frame
    }
    scanCooldownRef.current[cleanRaw] = now;

    let matched = findMatchingCandidate(cleanRaw, candidates);

    // Dynamic Safe Database Fallback if not found in current candidate state
    if (!matched && isSupabaseConfigured) {
      try {
        const { ids, emails, phones, trxnids } = extractIdentifiers(cleanRaw);
        
        // A. Check Member Table
        for (const rawId of ids) {
          const cleanCode = normalizeCode(rawId);
          
          // Check by member_id
          let { data: mData } = await supabase
            .from('member')
            .select('id, full_name, email, phone, member_id, class, section, roll, school')
            .eq('member_id', cleanCode)
            .maybeSingle();

          if (!mData) {
            const { data: jmcData } = await supabase
              .from('member')
              .select('id, full_name, email, phone, member_id, class, section, roll, school')
              .eq('member_id', `JMC-${cleanCode}`)
              .maybeSingle();
            mData = jmcData;
          }

          if (!mData && cleanCode.length >= 3) {
            const { data: suffixMatches } = await supabase
              .from('member')
              .select('id, full_name, email, phone, member_id, class, section, roll, school')
              .ilike('member_id', `%${cleanCode}`)
              .limit(1);
            if (suffixMatches && suffixMatches.length > 0) {
              mData = suffixMatches[0];
            }
          }

          // Check by UUID if valid UUID string
          if (!mData && isValidUuid(rawId)) {
            const { data: uuidData } = await supabase
              .from('member')
              .select('id, full_name, email, phone, member_id, class, section, roll, school')
              .eq('id', rawId)
              .maybeSingle();
            mData = uuidData;
          }

          if (mData) {
            matched = {
              id: mData.id,
              fullName: mData.full_name || 'Member',
              email: mData.email || '',
              phone: mData.phone || '',
              memberId: mData.member_id || undefined,
              class: mData.class || '',
              section: mData.section || '',
              roll: mData.roll || '',
              school: mData.school || 'St Joseph',
              candidateType: 'general',
              eventsList: ['Josephite Math Club Member Pass']
            };
            setCandidates(prev => [matched!, ...prev]);
            break;
          }
        }

        // B. Check EC Member Table if still not found
        if (!matched) {
          for (const rawId of ids) {
            const cleanCode = normalizeCode(rawId);
            let { data: ecData } = await supabase
              .from('ec_member')
              .select('id, full_name, email, phone, member_id, class, section, roll, school')
              .eq('member_id', cleanCode)
              .maybeSingle();

            if (!ecData) {
              const { data: jmcEcData } = await supabase
                .from('ec_member')
                .select('id, full_name, email, phone, member_id, class, section, roll, school')
                .eq('member_id', `JMC-${cleanCode}`)
                .maybeSingle();
              ecData = jmcEcData;
            }

            if (!ecData && isValidUuid(rawId)) {
              const { data: uuidEcData } = await supabase
                .from('ec_member')
                .select('id, full_name, email, phone, member_id, class, section, roll, school')
                .eq('id', rawId)
                .maybeSingle();
              ecData = uuidEcData;
            }

            if (ecData) {
              matched = {
                id: ecData.id,
                fullName: ecData.full_name || 'EC Officer',
                email: ecData.email || '',
                phone: ecData.phone || '',
                memberId: ecData.member_id || undefined,
                class: ecData.class || '',
                section: ecData.section || '',
                roll: ecData.roll || '',
                school: ecData.school || 'St Joseph',
                candidateType: 'ec',
                eventsList: ['Executive Committee Pass']
              };
              setCandidates(prev => [matched!, ...prev]);
              break;
            }
          }
        }

        // C. Check Event Registrations Tables if still not found
        if (!matched) {
          const eventTables = [
            "primary_events",
            "junior_events",
            "secondary_events",
            "higher_secondary_events",
          ];

          for (const table of eventTables) {
            if (matched) break;

            for (const trx of trxnids) {
              if (!trx) continue;
              const { data: evTrx } = await supabase
                .from(table)
                .select('*')
                .eq('trxnid', trx)
                .maybeSingle();
              if (evTrx) {
                const resolvedEvts = evTrx.selected_events ? resolveEventNames(evTrx.selected_events) : '';
                matched = {
                  id: evTrx.id || evTrx.user_id || `ev-${Date.now()}`,
                  fullName: evTrx.full_name || 'Event Registrant',
                  email: evTrx.email || '',
                  phone: evTrx.phone || evTrx.bkash_number || '',
                  memberId: evTrx.member_id || undefined,
                  class: evTrx.class || '',
                  section: evTrx.section || '',
                  roll: evTrx.roll || '',
                  school: evTrx.school || 'St Joseph',
                  candidateType: 'non_general',
                  eventsList: resolvedEvts ? resolvedEvts.split(',').map((e: string) => e.trim()).filter(Boolean) : ['Festival Event Registration']
                };
                setCandidates(prev => [matched!, ...prev]);
                break;
              }
            }

            if (!matched) {
              for (const phone of phones) {
                const cleanPhone = phone.replace(/\D/g, '');
                if (cleanPhone.length < 8) continue;
                const { data: evPhone } = await supabase
                  .from(table)
                  .select('*')
                  .or(`phone.ilike.%${cleanPhone}%,bkash_number.ilike.%${cleanPhone}%`)
                  .limit(1);
                if (evPhone && evPhone.length > 0) {
                  const item = evPhone[0];
                  const resolvedEvts = item.selected_events ? resolveEventNames(item.selected_events) : '';
                  matched = {
                    id: item.id || item.user_id || `ev-${Date.now()}`,
                    fullName: item.full_name || 'Event Registrant',
                    email: item.email || '',
                    phone: item.phone || item.bkash_number || '',
                    memberId: item.member_id || undefined,
                    class: item.class || '',
                    section: item.section || '',
                    roll: item.roll || '',
                    school: item.school || 'St Joseph',
                    candidateType: 'non_general',
                    eventsList: resolvedEvts ? resolvedEvts.split(',').map((e: string) => e.trim()).filter(Boolean) : ['Festival Event Registration']
                  };
                  setCandidates(prev => [matched!, ...prev]);
                  break;
                }
              }
            }
          }
        }
      } catch (lookupErr) {
        console.warn('Safe candidate lookup error:', lookupErr);
      }
    }

    if (!matched) {
      playErrorSound(0.15);
      setTickifyScanPopup({
        type: 'error',
        message: `Unrecognized QR code or Ticket ID: "${cleanRaw.slice(0, 35)}"`
      });
      setTimeout(() => {
        setTickifyScanPopup(prev => (prev?.type === 'error' ? null : prev));
      }, 2800);
      return;
    }

    const existing = purchases[matched.id];
    const wasValidated = existing?.validated === true;

    // Auto-mark ticket validated, snacks claimed, souvenir claimed, and certificate
    const updatedPurchase: TicketPurchase = {
      id: matched.id,
      fullName: matched.fullName,
      email: matched.email,
      phone: matched.phone,
      memberId: matched.memberId,
      class: matched.class,
      section: matched.section,
      roll: matched.roll,
      confirmed: true,
      confirmedAt: existing?.confirmedAt || new Date().toISOString(),
      confirmedBy: existing?.confirmedBy || currentAdminEmail || 'Admin',
      confirmedByName: existing?.confirmedByName || currentAdminName,
      confirmedByEmail: existing?.confirmedByEmail || currentAdminEmail,
      validated: true,
      validatedAt: existing?.validatedAt || new Date().toISOString(),
      validatedBy: currentAdminEmail || 'Admin',
      validatedByName: currentAdminName,
      validatedByEmail: currentAdminEmail,
      snacks: true,
      souvenir: true,
      certificate: true,
      candidateType: matched.candidateType
    };

    const newPurchases = {
      ...purchases,
      [matched.id]: updatedPurchase
    };

    // Save purchase state in background
    await savePurchaseState(newPurchases);

    if (wasValidated) {
      playSuccessSound(0.12);
      setTickifyScanPopup({
        type: 'already',
        candidateName: matched.fullName,
        memberId: matched.memberId || matched.id,
        className: matched.class,
        message: 'Already Validated - Entry, Snacks & Souvenir Re-confirmed'
      });
    } else {
      playSuccessSound(0.2);
      setTickifyScanPopup({
        type: 'verified',
        candidateName: matched.fullName,
        memberId: matched.memberId || matched.id,
        className: matched.class,
        message: 'Ticket Validated! Entry Granted, Snacks & Souvenir Checked'
      });
    }

    // Auto-dismiss popup after 2.8 seconds WITHOUT closing the scanner
    setTimeout(() => {
      setTickifyScanPopup(null);
    }, 2800);
  }, [candidates, purchases, findMatchingCandidate, user?.email, isSupabaseConfigured]);

  // Spot Purchase Form State
  const [spotCategory, setSpotCategory] = useState<EventCategoryType>('Secondary');
  const [spotSelectedEvents, setSpotSelectedEvents] = useState<string[]>(['Math Olympiad (Find-based)']);
  const [spotTeamName, setSpotTeamName] = useState('');

  // Captain / Primary Registrant (Member 1)
  const [spotName, setSpotName] = useState('');
  const [spotEmail, setSpotEmail] = useState('');
  const [spotPhone, setSpotPhone] = useState('');
  const [spotClass, setSpotClass] = useState('');
  const [spotInstitute, setSpotInstitute] = useState('');

  // Team Member 2 (Name, Class, Institute ONLY - No email or phone needed)
  const [spotMember2Name, setSpotMember2Name] = useState('');
  const [spotMember2Class, setSpotMember2Class] = useState('');
  const [spotMember2Institute, setSpotMember2Institute] = useState('');

  // Team Member 3 (Name, Class, Institute ONLY - No email or phone needed)
  const [spotMember3Name, setSpotMember3Name] = useState('');
  const [spotMember3Class, setSpotMember3Class] = useState('');
  const [spotMember3Institute, setSpotMember3Institute] = useState('');

  const [spotError, setSpotError] = useState<string | null>(null);
  const [spotSuccess, setSpotSuccess] = useState<string | null>(null);
  const [spotSubmitting, setSpotSubmitting] = useState(false);

  // Selected team events
  const selectedTeamEvents = useMemo(() => {
    return SPOT_FESTIVAL_EVENTS.filter(e => e.isTeamEvent && spotSelectedEvents.includes(e.id));
  }, [spotSelectedEvents]);

  const isTeamSelected = selectedTeamEvents.length > 0;

  // Maximum team size required across all selected team events
  const maxTeamSizeNeeded = useMemo(() => {
    if (!isTeamSelected) return 1;
    return Math.max(...selectedTeamEvents.map(e => e.teamSize), 2);
  }, [isTeamSelected, selectedTeamEvents]);

  // Group events by category
  const soloEvents = useMemo(() => {
    return SPOT_FESTIVAL_EVENTS.filter(e => !e.isTeamEvent);
  }, []);

  const teamEvents = useMemo(() => {
    return SPOT_FESTIVAL_EVENTS.filter(e => e.isTeamEvent);
  }, []);

  // Toggle event selection with category verification (Super Admin only)
  const handleToggleEvent = (eventId: string) => {
    if (!isSuperAdmin) return;
    const eventDef = SPOT_FESTIVAL_EVENTS.find(e => e.id === eventId);
    if (!eventDef) return;

    if (!eventDef.allowedCategories.includes(spotCategory)) {
      setSpotError(`"${eventDef.name}" is restricted to: ${eventDef.allowedCategories.join(', ')}.`);
      return;
    }

    setSpotError(null);
    setSpotSelectedEvents(prev => {
      if (prev.includes(eventId)) {
        return prev.filter(id => id !== eventId);
      } else {
        return [...prev, eventId];
      }
    });
  };

  const handleCategorySelect = (newCat: EventCategoryType) => {
    if (!isSuperAdmin) return;
    setSpotCategory(newCat);
    // Keep only events that are allowed in this category
    setSpotSelectedEvents(prev => {
      const valid = prev.filter(id => {
        const ev = SPOT_FESTIVAL_EVENTS.find(e => e.id === id);
        return ev && ev.allowedCategories.includes(newCat);
      });
      return valid.length > 0 ? valid : ['Math Olympiad (Find-based)'];
    });
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isSuperAdmin) return;
    const val = e.target.value;
    setSpotClass(val);
    if (val.trim()) {
      const detected = detectCategoryFromClass(val);
      if (detected !== spotCategory) {
        handleCategorySelect(detected);
      }
    }
  };

  const handleSelectAllEligible = () => {
    if (!isSuperAdmin) return;
    const eligibleIds = SPOT_FESTIVAL_EVENTS
      .filter(e => e.allowedCategories.includes(spotCategory))
      .map(e => e.id);
    setSpotSelectedEvents(eligibleIds);
    setSpotError(null);
  };

  const handleSelectOlympiadOnly = () => {
    if (!isSuperAdmin) return;
    const oly = spotCategory === 'Primary' || spotCategory === 'Junior'
      ? ['Math Olympiad (Find-based)']
      : ['Math Olympiad (Find-based)', 'Math Olympiad (Proof-based)'];
    setSpotSelectedEvents(oly);
    setSpotError(null);
  };

  const handleClearSelectedEvents = () => {
    if (!isSuperAdmin) return;
    setSpotSelectedEvents([]);
  };

  // Helper to generate a unique 5-digit Spot Ticket ID
  const generateUniqueSpotId = (candidatesList: Candidate[]): string => {
    const existingIds = new Set(candidatesList.map(c => (c.memberId || '').toUpperCase()));
    for (let i = 0; i < 200; i++) {
      const randNum = Math.floor(10000 + Math.random() * 90000);
      const strId = String(randNum);
      if (!existingIds.has(strId) && !existingIds.has(`SPOT-${strId}`)) {
        return strId;
      }
    }
    return String(Date.now()).slice(-5);
  };

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'ec' | 'non_general' | 'spot'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'purchased' | 'not_purchased' | 'validated'>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<
    'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc' | 'class_asc' | 'class_desc' | 'events_desc' | 'status_validated' | 'status_purchased' | 'type'
  >('newest');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Spot Purchase Subtab Registry State
  const [spotRegistrySearch, setSpotRegistrySearch] = useState('');
  const [spotRegistryCategory, setSpotRegistryCategory] = useState<'all' | EventCategoryType>('all');
  const [spotRegistrySortBy, setSpotRegistrySortBy] = useState<'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'id_asc' | 'id_desc' | 'class_asc' | 'events_desc' | 'status'>('newest');

  // Helper to extract numeric class value (e.g. "Class 10" -> 10, "12" -> 12, "XI" -> 11)
  const parseClassNumber = (val: string): number => {
    if (!val) return 0;
    const digits = val.match(/\d+/);
    if (digits) return parseInt(digits[0], 10);
    const lower = val.toLowerCase();
    if (lower.includes('xii') || lower.includes('12')) return 12;
    if (lower.includes('xi') || lower.includes('11')) return 11;
    if (lower.includes('x') || lower.includes('10')) return 10;
    if (lower.includes('ix') || lower.includes('9')) return 9;
    if (lower.includes('viii') || lower.includes('8')) return 8;
    if (lower.includes('vii') || lower.includes('7')) return 7;
    if (lower.includes('vi') || lower.includes('6')) return 6;
    if (lower.includes('v') || lower.includes('5')) return 5;
    if (lower.includes('iv') || lower.includes('4')) return 4;
    if (lower.includes('iii') || lower.includes('3')) return 3;
    return 0;
  };

  // Helper to extract numeric ID (e.g. "SPOT-10452" -> 10452, "JMC-012" -> 12)
  const parseIdNumber = (val: string): number => {
    if (!val) return 0;
    const digits = val.replace(/\D/g, '');
    return digits ? parseInt(digits, 10) : 0;
  };

  // Export CSV Helper for On-Spot & Candidates Registry
  const exportCandidatesCSV = (dataList: Candidate[], filename = 'Josephite_Participants_Registry.csv') => {
    if (dataList.length === 0) return;
    const headers = ['ID', 'Candidate Type', 'Full Name', 'Email', 'Phone', 'Class', 'Section', 'Roll', 'School', 'Events', 'Ticket Issued', 'Validated', 'Snacks', 'Certificate', 'Souvenir'];
    const rows = dataList.map(c => {
      const p = purchases[c.id];
      return [
        c.candidateType === 'spot' ? `SPOT-${c.memberId}` : (c.memberId || c.id),
        c.candidateType,
        `"${(c.fullName || '').replace(/"/g, '""')}"`,
        `"${c.email || ''}"`,
        `"${c.phone || ''}"`,
        `"${c.class || ''}"`,
        `"${c.section || ''}"`,
        `"${c.roll || ''}"`,
        `"${(c.school || '').replace(/"/g, '""')}"`,
        `"${(c.eventsList || []).join('; ').replace(/"/g, '""')}"`,
        p?.confirmed ? 'YES' : 'NO',
        p?.validated ? 'YES' : 'NO',
        p?.snacks ? 'YES' : 'NO',
        p?.certificate ? 'YES' : 'NO',
        p?.souvenir ? 'YES' : 'NO'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSpotPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpotError(null);
    setSpotSuccess(null);

    if (!isSuperAdmin) {
      setSpotError("Permission Denied: Only Super Administrators have authorization to edit the form and register on-spot tickets.");
      return;
    }

    const cleanName = spotName.trim();
    const cleanEmail = spotEmail.trim().toLowerCase();
    const cleanPhone = spotPhone.trim();
    const cleanClass = spotClass.trim();
    const cleanInstitute = spotInstitute.trim();

    // Validate minimal required fields for Captain / Primary Registrant
    if (!cleanName) {
      setSpotError(isTeamSelected ? "Team Captain's Full Name is required." : "Registrant's Full Name is required.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setSpotError(isTeamSelected ? "A valid Email for Team Captain is required to dispatch the soft copy pass." : "A valid Email address is required to dispatch the soft copy ticket.");
      return;
    }
    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 6) {
      setSpotError(isTeamSelected ? "A valid Phone Number for Team Captain is required." : "A valid Phone Number is required.");
      return;
    }
    if (!cleanClass) {
      setSpotError("Class / Standard is required.");
      return;
    }
    if (!cleanInstitute) {
      setSpotError("Institute (School / College Name) is required.");
      return;
    }

    if (spotSelectedEvents.length === 0) {
      setSpotError("Please select at least one event from the selectable fields.");
      return;
    }

    // Validate Team Members if a team event is selected
    if (isTeamSelected) {
      if (maxTeamSizeNeeded >= 2) {
        if (!spotMember2Name.trim()) {
          setSpotError("Team Member 2's Full Name is required for the selected team event(s).");
          return;
        }
        if (!spotMember2Class.trim()) {
          setSpotError("Team Member 2's Class is required.");
          return;
        }
        if (!spotMember2Institute.trim()) {
          setSpotError("Team Member 2's Institute is required.");
          return;
        }
      }

      if (maxTeamSizeNeeded >= 3) {
        if (!spotMember3Name.trim()) {
          setSpotError("Team Member 3's Full Name is required for 3-member team events (Tic-Tac-Toe, Truss, Wall Magazine).");
          return;
        }
        if (!spotMember3Class.trim()) {
          setSpotError("Team Member 3's Class is required.");
          return;
        }
        if (!spotMember3Institute.trim()) {
          setSpotError("Team Member 3's Institute is required.");
          return;
        }
      }
    }

    setSpotSubmitting(true);

    try {
      // Autogenerate unique 5-digit Spot Ticket ID
      const autoSpotId = generateUniqueSpotId(candidates);
      const spotTicketId = `spot-${autoSpotId}`;

      // Build structured team members list
      const teamMembersList = [];
      if (isTeamSelected) {
        teamMembersList.push({
          role: 'Captain (Member 1)',
          name: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          class: cleanClass,
          institute: cleanInstitute
        });
        if (maxTeamSizeNeeded >= 2) {
          teamMembersList.push({
            role: 'Team Member 2',
            name: spotMember2Name.trim(),
            class: spotMember2Class.trim() || cleanClass,
            institute: spotMember2Institute.trim() || cleanInstitute
          });
        }
        if (maxTeamSizeNeeded >= 3) {
          teamMembersList.push({
            role: 'Team Member 3',
            name: spotMember3Name.trim(),
            class: spotMember3Class.trim() || cleanClass,
            institute: spotMember3Institute.trim() || cleanInstitute
          });
        }
      }

      const teamNameStr = spotTeamName.trim();
      const eventsSummary = spotSelectedEvents.join(', ') + 
        (isTeamSelected && teamNameStr ? ` [Team: ${teamNameStr}]` : '');

      // Call dedicated API endpoint to check account existence, auto-create captain account if needed, sync event records, and dispatch email
      const apiRes = await fetch('/api/admin/spot-register-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          email: cleanEmail,
          phone: cleanPhone,
          className: cleanClass,
          section: 'N/A',
          roll: 'N/A',
          school: cleanInstitute,
          category: spotCategory,
          selectedEvents: spotSelectedEvents,
          teamName: isTeamSelected ? (teamNameStr || undefined) : undefined,
          teamMembers: isTeamSelected ? teamMembersList : undefined,
          verifiedBy: currentAdminEmail || 'Admin',
          verifiedByName: currentAdminName,
          verifiedByEmail: currentAdminEmail,
          documentType: 'verification_slip'
        })
      });

      const apiData = await apiRes.json();
      if (!apiRes.ok || !apiData.success) {
        throw new Error(apiData.error || 'Failed to register spot ticket');
      }

      const newSpotPurchase = apiData.purchase || {
        id: spotTicketId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        memberId: autoSpotId,
        class: cleanClass,
        section: 'N/A',
        roll: 'N/A',
        school: cleanInstitute,
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: currentAdminEmail || 'Admin',
        confirmedByName: currentAdminName,
        confirmedByEmail: currentAdminEmail,
        validated: false,
        snacks: false,
        certificate: false,
        souvenir: false,
        candidateType: 'spot',
        category: spotCategory,
        eventsList: spotSelectedEvents,
        teamName: isTeamSelected ? (teamNameStr || undefined) : undefined,
        teamMembers: isTeamSelected ? teamMembersList : undefined
      };

      const newCandidate: Candidate = apiData.candidate || {
        id: spotTicketId,
        fullName: cleanName,
        email: cleanEmail,
        phone: cleanPhone,
        memberId: autoSpotId,
        class: cleanClass,
        section: 'N/A',
        roll: 'N/A',
        school: cleanInstitute,
        candidateType: 'spot',
        eventsList: spotSelectedEvents,
        teamName: isTeamSelected ? (teamNameStr || undefined) : undefined,
        teamMembers: isTeamSelected ? teamMembersList : undefined,
        category: spotCategory
      };

      const updated = {
        ...purchases,
        [newSpotPurchase.id]: newSpotPurchase
      };

      // 1. Save ticket to persistent store
      await savePurchaseState(updated);

      // 2. Add to candidates list in state
      setCandidates(prev => [newCandidate, ...prev]);

      const teamMsg = isTeamSelected 
        ? ` (${teamMembersList.length} Team Members Registered)` 
        : '';

      const accountStatusMsg = apiData.accountCreated
        ? `🔐 A new member account was automatically created for ${cleanName} (Password: ${cleanPhone}).`
        : apiData.accountExists
        ? `✅ Verification slip linked & forwarded to ${cleanName}'s existing account profile.`
        : '';

      setSpotSuccess(
        `Spot Ticket registered successfully! Generated Ticket ID: #SPOT-${apiData.memberId || autoSpotId}${teamMsg}. Events: ${spotSelectedEvents.join(', ')}. ${accountStatusMsg} The verification slip & QR pass has been emailed to ${cleanEmail} and synced to the profile.`
      );
      
      // Reset form
      setSpotName('');
      setSpotEmail('');
      setSpotPhone('');
      setSpotClass('');
      setSpotInstitute('');
      setSpotTeamName('');
      setSpotMember2Name('');
      setSpotMember2Class('');
      setSpotMember2Institute('');
      setSpotMember3Name('');
      setSpotMember3Class('');
      setSpotMember3Institute('');
    } catch (err: any) {
      console.error('Failed to register spot ticket:', err);
      setSpotError(err.message || 'An error occurred while registering the spot ticket.');
    } finally {
      setSpotSubmitting(false);
    }
  };

  // Load All Candidates and Ticket Purchases
  const loadData = useCallback(async (silent = false) => {
    if (!isSupabaseConfigured) return;
    if (!silent) setLoading(true);
    setError(null);

    try {
      // 1. Fetch ticket purchase logs from site_content
      const { data: ticketData, error: ticketErr } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 'ticket_purchases')
        .maybeSingle();

      if (ticketErr) {
        console.error('Error fetching ticket purchases:', ticketErr);
      }

      const existingPurchases: Record<string, TicketPurchase> = ticketData?.data?.purchases || {};
      const existingSpotTickets = ticketData?.data?.spotTickets || {};

      const mergedPurchases = { ...existingPurchases };
      Object.entries(existingSpotTickets).forEach(([spotId, ticket]: [string, any]) => {
        mergedPurchases[`spot-${spotId}`] = ticket;
      });
      setPurchases(mergedPurchases);

      // 2. Fetch standard members
      let memberData: any[] = [];
      try {
        const { data, error: memberErr } = await supabase
          .from('member')
          .select('*');
        if (memberErr) {
          console.warn('Note fetching members:', memberErr.message || memberErr);
        } else if (data) {
          memberData = data;
        }
      } catch (mErr) {
        console.warn('Error loading members table:', mErr);
      }

      // 3. Fetch EC members
      let ecMemberData: any[] = [];
      try {
        const { data, error: ecErr } = await supabase
          .from('ec_member')
          .select('*');
        if (ecErr) {
          console.warn('Note fetching EC members:', ecErr.message || ecErr);
        } else if (data) {
          ecMemberData = data;
        }
      } catch (ecE) {
        console.warn('Error loading ec_member table:', ecE);
      }

      // Create maps to easily identify users
      const generalMembersMap = new Map<string, any>();
      const ecMembersMap = new Map<string, any>();

      (memberData || []).forEach(m => {
        if (m.id) generalMembersMap.set(m.id.toLowerCase(), m);
      });

      (ecMemberData || []).forEach(m => {
        if (m.id) ecMembersMap.set(m.id.toLowerCase(), m);
      });

      // 4. Fetch Event registrations to discover non-general members
      const eventTables = [
        "primary_events",
        "junior_events",
        "secondary_events",
        "higher_secondary_events",
      ];

      const allEventRegs: any[] = [];
      for (const table of eventTables) {
        try {
          const { data, error: tableErr } = await supabase
            .from(table)
            .select('*');
          
          if (tableErr) {
            console.warn(`Note fetching from ${table}:`, tableErr.message || tableErr);
            continue;
          }
          if (data) {
            allEventRegs.push(...data.map(d => ({ ...d, tableName: table })));
          }
        } catch (tableCatchErr) {
          console.warn(`Error querying ${table}:`, tableCatchErr);
        }
      }

      // Group event registrations by user_id or id to find participants
      const eventParticipantsMap = new Map<string, { events: string[], data: any }>();
      allEventRegs.forEach(reg => {
        const uid = (reg.user_id || reg.id || reg.email || reg.phone || '').toLowerCase();
        if (!uid) return;
        const existing = eventParticipantsMap.get(uid);
        const resolvedEvts = reg.selected_events ? resolveEventNames(reg.selected_events) : '';
        const eventsList = resolvedEvts ? resolvedEvts.split(',').map((e: string) => e.trim()).filter(Boolean) : [];
        
        if (existing) {
          existing.events = Array.from(new Set([...existing.events, ...eventsList]));
        } else {
          eventParticipantsMap.set(uid, {
            events: eventsList,
            data: reg
          });
        }
      });

      // Assemble candidates list
      const candidateList: Candidate[] = [];
      const addedUids = new Set<string>();

      // A. Add general members
      (memberData || []).forEach(m => {
        if (!m.id) return;
        const uid = m.id.toLowerCase();
        addedUids.add(uid);

        // Check if has registered events
        const eventInfo = eventParticipantsMap.get(uid);

        candidateList.push({
          id: m.id,
          fullName: m.full_name || 'Anonymous General Member',
          email: m.email || '',
          phone: m.phone || '',
          memberId: m.member_id || undefined,
          class: m.class || '',
          section: m.section || '',
          roll: m.roll || '',
          school: m.school || 'St Joseph',
          candidateType: 'general',
          eventsList: eventInfo ? eventInfo.events : []
        });
      });

      // B. Add EC members
      (ecMemberData || []).forEach(m => {
        if (!m.id) return;
        const uid = m.id.toLowerCase();
        // If already added as general member, we can upgrade their type to EC if they are EC
        addedUids.add(uid);

        const eventInfo = eventParticipantsMap.get(uid);

        candidateList.push({
          id: m.id,
          fullName: m.full_name || 'Anonymous EC Member',
          email: m.email || '',
          phone: m.phone || '',
          memberId: m.member_id || undefined,
          class: m.class || '',
          section: m.section || '',
          roll: m.roll || '',
          school: m.school || 'St Joseph',
          candidateType: 'ec',
          eventsList: eventInfo ? eventInfo.events : []
        });
      });

      // C. Add non-general members who registered for events
      eventParticipantsMap.forEach((p, uid) => {
        if (addedUids.has(uid)) return; // already added as member

        // Get details from profile table if possible, otherwise use registration details
        candidateList.push({
          id: uid,
          fullName: p.data.full_name || 'Anonymous Event Registrant',
          email: p.data.email || '',
          phone: p.data.phone || p.data.bkash_number || '',
          memberId: undefined, // Event-only participants have no member ID
          class: p.data.class || '',
          section: p.data.section || '',
          roll: p.data.roll || '',
          school: p.data.school || 'St Joseph',
          candidateType: 'non_general',
          eventsList: p.events
        });
      });

      // D. Add spot tickets
      Object.entries(existingSpotTickets).forEach(([spotId, ticket]: [string, any]) => {
        candidateList.push({
          id: `spot-${spotId}`,
          fullName: ticket.fullName || 'Anonymous Spot Registrant',
          email: ticket.email || '',
          phone: ticket.phone || '',
          memberId: spotId, // 4-digit ID
          class: ticket.class || '',
          section: ticket.section || '',
          roll: ticket.roll || '',
          school: ticket.school || 'St Joseph',
          candidateType: 'spot',
          eventsList: ticket.eventsList || ['Spot Ticket Registration']
        });
      });

      setCandidates(candidateList);
    } catch (err: any) {
      console.error('Error loading ticket dashboard data:', err);
      setError(err.message || 'Failed to retrieve candidates and purchases.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial and sync subscriptions
  useEffect(() => {
    loadData();

    if (!isSupabaseConfigured) return;

    // Listen to real-time changes on ticket_purchases row in site_content
    const channel = supabase
      .channel('ticket_purchases_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_content',
          filter: 'id=eq.ticket_purchases',
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            const data = (payload.new as any).data;
            const regPurchases = data.purchases || {};
            const spotTickets = data.spotTickets || {};

            const mergedPurchases: Record<string, TicketPurchase> = { ...regPurchases };
            Object.entries(spotTickets).forEach(([spotId, ticket]: [string, any]) => {
              mergedPurchases[`spot-${spotId}`] = ticket;
            });
            setPurchases(mergedPurchases);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData(true);
  };

  // Safe save routine
  const savePurchaseState = async (updatedPurchases: Record<string, TicketPurchase>) => {
    if (!isSupabaseConfigured) return;
    try {
      const regularPurchases: Record<string, TicketPurchase> = {};
      const spotTickets: Record<string, any> = {};

      Object.entries(updatedPurchases).forEach(([key, value]) => {
        if (key.startsWith('spot-')) {
          spotTickets[key.replace('spot-', '')] = value;
        } else {
          regularPurchases[key] = value;
        }
      });

      const { error: upsertErr } = await supabase
        .from('site_content')
        .upsert({
          id: 'ticket_purchases',
          data: { 
            purchases: regularPurchases,
            spotTickets: spotTickets
          },
          updated_at: new Date().toISOString()
        });

      if (upsertErr) throw upsertErr;
      setPurchases(updatedPurchases);
    } catch (err: any) {
      console.error('Failed to save ticket purchase state:', err);
      setError('Failed to sync ticket update with database. Try again.');
    }
  };

  // Confirm ticket purchase: "By confirming ticket purchase that user will not be able to confirm it again anymore"
  const confirmTicketPurchase = async (candidate: Candidate) => {
    if (purchases[candidate.id]?.confirmed) {
      alert("This user has already purchased a ticket. Tickets are strictly limited to one per unique ID.");
      return;
    }

    setActionLoading(candidate.id);
    const newPurchase: TicketPurchase = {
      id: candidate.id,
      fullName: candidate.fullName,
      email: candidate.email,
      phone: candidate.phone,
      memberId: candidate.memberId,
      class: candidate.class,
      section: candidate.section,
      roll: candidate.roll,
      school: candidate.school,
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: currentAdminEmail || 'Admin',
      confirmedByName: currentAdminName,
      confirmedByEmail: currentAdminEmail,
      validated: false,
      snacks: false,
      certificate: false,
      souvenir: false,
      candidateType: candidate.candidateType,
      eventsList: candidate.eventsList
    };

    const updated = {
      ...purchases,
      [candidate.id]: newPurchase
    };

    await savePurchaseState(updated);
    setActionLoading(null);
  };

  // Toggle validation status: "The admin will click validate beside every user's card"
  const toggleValidation = async (userId: string) => {
    const purchase = purchases[userId];
    if (!purchase) return;

    if (purchase.validated) {
      if (!isSuperAdmin) {
        alert("Permission Denied: Only Super Admins are authorized to invalidate or revoke a validated ticket.");
        return;
      }
      setActionLoading(`${userId}-validate`);
      const updatedPurchase = {
        ...purchase,
        validated: false,
        validatedAt: undefined,
        validatedBy: undefined,
        validatedByName: undefined,
        validatedByEmail: undefined
      };
      const updated = {
        ...purchases,
        [userId]: updatedPurchase
      };
      await savePurchaseState(updated);
      setActionLoading(null);
      return;
    }

    setActionLoading(`${userId}-validate`);
    const updatedPurchase = {
      ...purchase,
      validated: true,
      validatedAt: new Date().toISOString(),
      validatedBy: currentAdminEmail || 'Admin',
      validatedByName: currentAdminName,
      validatedByEmail: currentAdminEmail
    };

    const updated = {
      ...purchases,
      [userId]: updatedPurchase
    };

    await savePurchaseState(updated);
    setActionLoading(null);
  };

  // Toggle specific checklist item: "and also checklist for checking snacks, certificate and souvenir"
  const toggleChecklistItem = async (userId: string, itemKey: 'snacks' | 'certificate' | 'souvenir') => {
    const purchase = purchases[userId];
    if (!purchase) return;

    setActionLoading(`${userId}-${itemKey}`);
    const updatedPurchase = {
      ...purchase,
      [itemKey]: !purchase[itemKey]
    };

    const updated = {
      ...purchases,
      [userId]: updatedPurchase
    };

    await savePurchaseState(updated);
    setActionLoading(null);
  };

  // Only Super Admin can delete on-spot ticket registrations
  const handleDeleteSpotTicket = async (cand: Candidate) => {
    if (!isSuperAdmin) {
      alert("Permission Denied: Only Super Administrators have authorization to delete on-spot ticket registrations and participant information.");
      return;
    }

    const cleanMemberId = (cand.memberId || cand.id.replace('spot-', '')).replace('SPOT-', '');
    const confirmMsg = `⚠️ SUPER ADMIN CONFIRMATION:\n\nAre you sure you want to permanently delete the on-spot ticket registration for:\n\n• Name: ${cand.fullName}\n• Ticket ID: #SPOT-${cleanMemberId}\n• Email: ${cand.email}\n\nThis will remove their ticket pass, validation status, and associated event record.`;
    
    if (!window.confirm(confirmMsg)) {
      return;
    }

    try {
      setActionLoading(cand.id);
      const spotTicketId = cand.id.startsWith('spot-') ? cand.id : `spot-${cleanMemberId}`;

      const res = await fetch('/api/admin/delete-spot-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          spotTicketId,
          memberId: cleanMemberId,
          email: cand.email,
          fullName: cand.fullName,
          trxnid: cand.trxnid || `SPOT-TICKET-${cleanMemberId}`,
          category: cand.category,
          adminEmail: currentAdminEmail,
          isSuperAdmin: true
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete on-spot ticket.');
      }

      // 1. Update purchases state
      const updatedPurchases = { ...purchases };
      delete updatedPurchases[spotTicketId];
      delete updatedPurchases[cand.id];
      delete updatedPurchases[cleanMemberId];
      setPurchases(updatedPurchases);

      // 2. Remove from candidates list
      setCandidates(prev => prev.filter(c => c.id !== cand.id && c.id !== spotTicketId && c.memberId !== cleanMemberId));

      setSpotSuccess(`Participant record and on-spot ticket for ${cand.fullName} (#SPOT-${cleanMemberId}) was permanently deleted by Super Admin.`);
    } catch (err: any) {
      console.error('Error deleting spot ticket:', err);
      alert(err.message || 'Failed to delete on-spot ticket.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTogglePurchase = async (candidateId: string) => {
    const cand = candidates.find(c => c.id === candidateId);
    if (!cand) return;
    if (purchases[candidateId]?.confirmed) {
      if (cand.candidateType === 'spot') {
        if (!isSuperAdmin) {
          alert("Permission Denied: Only Super Administrators have authorization to delete or cancel on-spot ticket registrations.");
          return;
        }
        await handleDeleteSpotTicket(cand);
        return;
      }
      setActionLoading(candidateId);
      const updated = { ...purchases };
      delete updated[candidateId];
      await savePurchaseState(updated);
      setActionLoading(null);
    } else {
      await confirmTicketPurchase(cand);
    }
  };

  const handleToggleValidation = async (candidateId: string) => {
    const purchase = purchases[candidateId];
    if (!purchase) return;
    if (purchase.validated && !isSuperAdmin) {
      alert("Permission Denied: Only Super Admins are authorized to invalidate or revoke a validated ticket.");
      return;
    }
    setActionLoading(candidateId);
    if (purchase.validated) {
      const updatedPurchase = {
        ...purchase,
        validated: false,
        validatedAt: undefined,
        validatedBy: undefined,
        validatedByName: undefined,
        validatedByEmail: undefined
      };
      await savePurchaseState({
        ...purchases,
        [candidateId]: updatedPurchase
      });
    } else {
      const updatedPurchase = {
        ...purchase,
        validated: true,
        validatedAt: new Date().toISOString(),
        validatedBy: currentAdminEmail || 'Admin',
        validatedByName: currentAdminName,
        validatedByEmail: currentAdminEmail
      };
      await savePurchaseState({
        ...purchases,
        [candidateId]: updatedPurchase
      });
    }
    setActionLoading(null);
  };

  // Filter & Sort candidates list based on query, filters and sort criteria
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter(cand => {
        // 1. Search Query filter (matches ID, Name, Email, Class, Section, Roll, Phone, School, Events)
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchesName = cand.fullName.toLowerCase().includes(query);
          const matchesEmail = cand.email.toLowerCase().includes(query);
          const matchesPhone = cand.phone.toLowerCase().includes(query);
          const matchesMemberId = cand.memberId ? cand.memberId.toLowerCase().includes(query) : false;
          const matchesClass = cand.class.toLowerCase().includes(query);
          const matchesSection = cand.section.toLowerCase().includes(query);
          const matchesRoll = cand.roll.toLowerCase().includes(query);
          const matchesSchool = (cand.school || '').toLowerCase().includes(query);
          const matchesEvents = (cand.eventsList || []).some(e => e.toLowerCase().includes(query));
          const fuzzyMatches = matchesSearchWithFuzzy(cand.fullName, query);

          if (!matchesName && !matchesEmail && !matchesPhone && !matchesMemberId && !matchesClass && !matchesSection && !matchesRoll && !matchesSchool && !matchesEvents && !fuzzyMatches) {
            return false;
          }
        }

        // 2. Candidate Type filter
        if (typeFilter !== 'all') {
          if (typeFilter === 'general' && cand.candidateType !== 'general') return false;
          if (typeFilter === 'ec' && cand.candidateType !== 'ec') return false;
          if (typeFilter === 'non_general' && cand.candidateType !== 'non_general') return false;
          if (typeFilter === 'spot' && cand.candidateType !== 'spot') return false;
        }

        // 3. Ticket Purchase status filter
        if (ticketFilter !== 'all') {
          const p = purchases[cand.id];
          const isPurchased = p?.confirmed === true;
          const isValidated = p?.validated === true;

          if (ticketFilter === 'purchased' && !isPurchased) return false;
          if (ticketFilter === 'not_purchased' && isPurchased) return false;
          if (ticketFilter === 'validated' && (!isPurchased || !isValidated)) return false;
        }

        // 4. Specific Event Filter
        if (eventFilter !== 'all') {
          const target = eventFilter.toLowerCase();
          const matchesEvent = (cand.eventsList || []).some(e => e.toLowerCase().includes(target));
          if (!matchesEvent) return false;
        }

        // 5. Class / Category Filter
        if (classFilter !== 'all') {
          const classNum = parseClassNumber(cand.class);
          if (classFilter === 'Primary') {
            if (classNum < 3 || classNum > 5) return false;
          } else if (classFilter === 'Junior') {
            if (classNum < 6 || classNum > 8) return false;
          } else if (classFilter === 'Secondary') {
            if (classNum < 9 || classNum > 10) return false;
          } else if (classFilter === 'Higher Secondary') {
            if (classNum < 11 || classNum > 12) return false;
          } else {
            // Specific numeric class e.g. "10"
            if (!cand.class.includes(classFilter)) return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        const pA = purchases[a.id];
        const pB = purchases[b.id];

        if (sortBy === 'newest') {
          const timeA = pA?.confirmedAt ? new Date(pA.confirmedAt).getTime() : parseIdNumber(a.memberId || a.id);
          const timeB = pB?.confirmedAt ? new Date(pB.confirmedAt).getTime() : parseIdNumber(b.memberId || b.id);
          if (timeA !== timeB) return timeB - timeA;
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (sortBy === 'oldest') {
          const timeA = pA?.confirmedAt ? new Date(pA.confirmedAt).getTime() : parseIdNumber(a.memberId || a.id);
          const timeB = pB?.confirmedAt ? new Date(pB.confirmedAt).getTime() : parseIdNumber(b.memberId || b.id);
          if (timeA !== timeB) return timeA - timeB;
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (sortBy === 'name_asc') {
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (sortBy === 'name_desc') {
          return (b.fullName || '').localeCompare(a.fullName || '');
        }

        if (sortBy === 'id_asc') {
          return parseIdNumber(a.memberId || a.id) - parseIdNumber(b.memberId || b.id);
        }

        if (sortBy === 'id_desc') {
          return parseIdNumber(b.memberId || b.id) - parseIdNumber(a.memberId || a.id);
        }

        if (sortBy === 'class_asc') {
          const numA = parseClassNumber(a.class);
          const numB = parseClassNumber(b.class);
          if (numA !== numB) return numA - numB;
          return (a.class || '').localeCompare(b.class || '');
        }

        if (sortBy === 'class_desc') {
          const numA = parseClassNumber(a.class);
          const numB = parseClassNumber(b.class);
          if (numA !== numB) return numB - numA;
          return (b.class || '').localeCompare(a.class || '');
        }

        if (sortBy === 'events_desc') {
          return (b.eventsList?.length || 0) - (a.eventsList?.length || 0);
        }

        if (sortBy === 'status_validated') {
          const valA = pA?.validated ? 2 : pA?.confirmed ? 1 : 0;
          const valB = pB?.validated ? 2 : pB?.confirmed ? 1 : 0;
          return valB - valA;
        }

        if (sortBy === 'status_purchased') {
          const purA = pA?.confirmed ? 1 : 0;
          const purB = pB?.confirmed ? 1 : 0;
          return purB - purA;
        }

        if (sortBy === 'type') {
          const typeWeight: Record<string, number> = { spot: 4, general: 3, ec: 2, non_general: 1 };
          return (typeWeight[b.candidateType] || 0) - (typeWeight[a.candidateType] || 0);
        }

        return 0;
      });
  }, [candidates, purchases, searchQuery, typeFilter, ticketFilter, eventFilter, classFilter, sortBy]);

  // Dedicated Spot Participants List with its own filters and sorting for Spot subtab
  const spotParticipantsRegistry = useMemo(() => {
    const list = candidates.filter(c => c.candidateType === 'spot');
    return list
      .filter(cand => {
        if (spotRegistrySearch.trim()) {
          const q = spotRegistrySearch.toLowerCase().trim();
          const p = purchases[cand.id];
          const matchesName = cand.fullName.toLowerCase().includes(q);
          const matchesEmail = cand.email.toLowerCase().includes(q);
          const matchesPhone = cand.phone.toLowerCase().includes(q);
          const matchesId = cand.memberId ? cand.memberId.toLowerCase().includes(q) : false;
          const matchesClass = cand.class.toLowerCase().includes(q);
          const matchesSchool = (cand.school || '').toLowerCase().includes(q);
          const matchesEvents = (cand.eventsList || []).some(e => e.toLowerCase().includes(q));
          const matchesTeam = p?.teamName ? p.teamName.toLowerCase().includes(q) : false;
          const fuzzyMatches = matchesSearchWithFuzzy(cand.fullName, q);

          if (!matchesName && !matchesEmail && !matchesPhone && !matchesId && !matchesClass && !matchesSchool && !matchesEvents && !matchesTeam && !fuzzyMatches) {
            return false;
          }
        }

        if (spotRegistryCategory !== 'all') {
          const p = purchases[cand.id];
          const classNum = parseClassNumber(cand.class);
          const derivedCat: EventCategoryType = 
            p?.category || (classNum <= 5 ? 'Primary' : classNum <= 8 ? 'Junior' : classNum <= 10 ? 'Secondary' : 'Higher Secondary');
          if (derivedCat !== spotRegistryCategory) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const pA = purchases[a.id];
        const pB = purchases[b.id];

        if (spotRegistrySortBy === 'newest') {
          const timeA = pA?.confirmedAt ? new Date(pA.confirmedAt).getTime() : parseIdNumber(a.memberId || a.id);
          const timeB = pB?.confirmedAt ? new Date(pB.confirmedAt).getTime() : parseIdNumber(b.memberId || b.id);
          if (timeA !== timeB) return timeB - timeA;
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (spotRegistrySortBy === 'oldest') {
          const timeA = pA?.confirmedAt ? new Date(pA.confirmedAt).getTime() : parseIdNumber(a.memberId || a.id);
          const timeB = pB?.confirmedAt ? new Date(pB.confirmedAt).getTime() : parseIdNumber(b.memberId || b.id);
          if (timeA !== timeB) return timeA - timeB;
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (spotRegistrySortBy === 'name_asc') {
          return (a.fullName || '').localeCompare(b.fullName || '');
        }

        if (spotRegistrySortBy === 'name_desc') {
          return (b.fullName || '').localeCompare(a.fullName || '');
        }

        if (spotRegistrySortBy === 'id_asc') {
          return parseIdNumber(a.memberId || a.id) - parseIdNumber(b.memberId || b.id);
        }

        if (spotRegistrySortBy === 'id_desc') {
          return parseIdNumber(b.memberId || b.id) - parseIdNumber(a.memberId || a.id);
        }

        if (spotRegistrySortBy === 'class_asc') {
          const numA = parseClassNumber(a.class);
          const numB = parseClassNumber(b.class);
          return numA - numB;
        }

        if (spotRegistrySortBy === 'events_desc') {
          return (b.eventsList?.length || 0) - (a.eventsList?.length || 0);
        }

        if (spotRegistrySortBy === 'status') {
          const valA = pA?.validated ? 2 : pA?.confirmed ? 1 : 0;
          const valB = pB?.validated ? 2 : pB?.confirmed ? 1 : 0;
          return valB - valA;
        }

        return 0;
      });
  }, [candidates, purchases, spotRegistrySearch, spotRegistryCategory, spotRegistrySortBy]);

  // Analytics Calculations
  const stats = useMemo(() => {
    const totalEligible = candidates.length;
    let totalPurchased = 0;
    let totalValidated = 0;
    let totalSnacks = 0;
    let totalCertificates = 0;
    let totalSouvenirs = 0;

    Object.values(purchases).forEach(p => {
      if (p.confirmed) {
        totalPurchased++;
        if (p.validated) totalValidated++;
        if (p.snacks) totalSnacks++;
        if (p.certificate) totalCertificates++;
        if (p.souvenir) totalSouvenirs++;
      }
    });

    return {
      totalEligible,
      totalPurchased,
      totalValidated,
      totalSnacks,
      totalCertificates,
      totalSouvenirs,
      unpurchasedCount: Math.max(0, totalEligible - totalPurchased)
    };
  }, [candidates, purchases]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-zinc-400 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="font-medium text-sm text-zinc-500">Compiling ticket database and event rosters...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Ticket className="w-7 h-7 text-emerald-500" />
            TICKET PURCHASE MANAGEMENT
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Register and validate event tickets for General Members and Event Registrants. Strictly 1 ticket per unique ID.
          </p>
        </div>
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Scan className="w-4 h-4" />
            Launch Scanner Modal
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      {/* Subtabs selection */}
      <div className="flex flex-wrap p-1 rounded-full bg-white/[0.02] border border-white/5 backdrop-blur-md shadow-lg self-start gap-1">
        <button
          onClick={() => setSubTab('validation')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'validation' ? 'text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <ShieldCheck className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Ticket Validation</span>
          {subTab === 'validation' && (
            <motion.div 
              layoutId="activeSubTabPill" 
              className="absolute inset-0 bg-emerald-400 rounded-full"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
        </button>

        <button
          onClick={() => setSubTab('tickify_qr')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'tickify_qr' ? 'text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Scan className="w-4 h-4 relative z-10" />
          <span className="relative z-10 flex items-center gap-1.5">
            QR Verification (Tickify Mode)
            <span className="px-1.5 py-0.5 rounded-full text-[9px] bg-emerald-500/30 text-emerald-950 font-extrabold uppercase">Live</span>
          </span>
          {subTab === 'tickify_qr' && (
            <motion.div 
              layoutId="activeSubTabPill" 
              className="absolute inset-0 bg-emerald-400 rounded-full"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
        </button>

        <button
          onClick={() => setSubTab('spot_purchase')}
          className={`px-5 py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all relative cursor-pointer flex items-center gap-2 ${
            subTab === 'spot_purchase' ? 'text-black font-bold' : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          <Sparkles className="w-4 h-4 relative z-10" />
          <span className="relative z-10">Spot Ticket Purchase</span>
          {subTab === 'spot_purchase' && (
            <motion.div 
              layoutId="activeSubTabPill" 
              className="absolute inset-0 bg-emerald-400 rounded-full"
              transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
            />
          )}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div className="text-sm text-red-200">{error}</div>
        </div>
      )}

      {subTab === 'tickify_qr' ? (
        <motion.div
          key="tickify_scanner_view"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-3xl mx-auto space-y-6"
        >
          <div className="p-6 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-2 text-center">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Continuous Verification Engine
            </span>
            <h3 className="text-xl font-black text-white uppercase font-display tracking-tight">TICKIFY QR CODE SCANNER</h3>
            <p className="text-xs text-zinc-400 max-w-lg mx-auto">
              Scanner launches once and remains live for continuous verification. Position participant QR code in camera view. Upon scanning, ticket validation, snacks, souvenir, and event status are auto-checked with a temporary popup notification.
            </p>
          </div>

          {/* Continuous Camera Feed & Floating Popup */}
          <div className="relative rounded-[2.5rem] overflow-hidden border border-emerald-500/20 bg-black/60 p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            
            {/* Live Camera Feed */}
            <QRScanner
              inline={true}
              onScan={handleTickifyScan}
              onClose={() => setSubTab('validation')}
              fps={25}
              lastScannedId={tickifyScanPopup?.candidateName ? `${tickifyScanPopup.candidateName} (${tickifyScanPopup.memberId || 'VERIFIED'})` : null}
              isProcessing={actionLoading !== null}
              title="Tickify High-Speed QR Scanner"
              subtitle="Hold QR code in camera view or type ticket code for instant validation"
            />

            {/* FLOATING VERIFICATION OVERLAY POPUP */}
            <AnimatePresence>
              {tickifyScanPopup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-x-4 top-6 z-50 p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center space-y-3 ${
                    tickifyScanPopup.type === 'verified'
                      ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-500/30'
                      : tickifyScanPopup.type === 'already'
                      ? 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-500/30'
                      : 'bg-red-950/95 border-red-500/60 text-white shadow-red-500/30'
                  }`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
                    tickifyScanPopup.type === 'verified'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : tickifyScanPopup.type === 'already'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-red-500/20 border-red-500/40 text-red-400'
                  }`}>
                    {tickifyScanPopup.type === 'verified' && <ShieldCheck className="w-8 h-8 animate-bounce" />}
                    {tickifyScanPopup.type === 'already' && <CheckCircle2 className="w-8 h-8 animate-pulse" />}
                    {tickifyScanPopup.type === 'error' && <XCircle className="w-8 h-8 animate-pulse" />}
                  </div>

                  <div>
                    <span className={`text-[10px] font-black uppercase tracking-widest block ${
                      tickifyScanPopup.type === 'verified' ? 'text-emerald-400' :
                      tickifyScanPopup.type === 'already' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {tickifyScanPopup.type === 'verified' ? '✓ MEMBER VERIFIED' :
                       tickifyScanPopup.type === 'already' ? 'ℹ ALREADY VERIFIED' : '⚠ UNRECOGNIZED QR CODE'}
                    </span>
                    
                    {tickifyScanPopup.candidateName && (
                      <h4 className="text-xl font-black text-white font-display mt-0.5">
                        {tickifyScanPopup.candidateName}
                      </h4>
                    )}

                    {tickifyScanPopup.memberId && (
                      <p className="text-xs font-mono font-bold text-emerald-300 mt-1">
                        ID: {tickifyScanPopup.memberId} {tickifyScanPopup.className ? `• Class ${tickifyScanPopup.className}` : ''}
                      </p>
                    )}

                    <p className="text-xs font-medium text-zinc-300 mt-1">
                      {tickifyScanPopup.message}
                    </p>
                  </div>

                  {tickifyScanPopup.type !== 'error' && (
                    <div className="flex flex-wrap justify-center gap-2 pt-1 text-[10px] font-bold font-mono text-emerald-300">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">✓ Ticket Validated</span>
                      <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">✓ Snacks Claimed</span>
                      <span className="px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30">✓ Souvenir Claimed</span>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      ) : subTab === 'spot_purchase' ? (
        <motion.div
          key="spot_purchase_form"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="max-w-4xl mx-auto p-6 md:p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8"
        >
          {/* Header */}
          <div className="space-y-2 border-b border-white/5 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-xl font-bold text-white flex items-center gap-2.5 font-display">
                <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                ON-SPOT TICKET & EVENT REGISTRATION
              </h3>
              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Instant Pass & Event Sync
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Register candidates for on-spot ticket passes and select all events they wish to participate in. For team events, only the team captain&apos;s email and phone number are required, while members require name, class, and institute only.
            </p>
          </div>

          {!isSuperAdmin && (
            <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3.5 shadow-lg shadow-amber-500/5">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-amber-300 font-display">Super Administrator Authorization Required</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Only Super Administrators have access to edit information and issue tickets in the On-Spot Ticket Purchase section. Standard administrators have read-only permissions.
                </p>
              </div>
            </div>
          )}

          {spotError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">{spotError}</div>
            </div>
          )}

          {spotSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-200 leading-relaxed">{spotSuccess}</div>
            </div>
          )}

          <form onSubmit={handleSpotPurchase} className="space-y-8">
            {/* Step 1: Category Selection */}
            <div className="space-y-3 p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  1. Participant Category / Level
                </label>
                <span className="text-[11px] text-zinc-500 font-mono">Filters eligible events</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Primary', 'Junior', 'Secondary', 'Higher Secondary'] as EventCategoryType[]).map((cat) => {
                  const isSelected = spotCategory === cat;
                  const rangeLabel = 
                    cat === 'Primary' ? 'Class 3–5' :
                    cat === 'Junior' ? 'Class 6–8' :
                    cat === 'Secondary' ? 'Class 9–10' : 'Class 11–12';

                  return (
                    <button
                      key={cat}
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={() => handleCategorySelect(cat)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        !isSuperAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        isSelected 
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-lg shadow-emerald-500/10' 
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-emerald-400' : 'text-zinc-300'}`}>
                          {cat}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 block">{rangeLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Event Selection Fields */}
            <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div>
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-emerald-400" />
                    2. Select Events to Participate In
                  </label>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Click to toggle events for this ticket</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                    {spotSelectedEvents.length} Event{spotSelectedEvents.length !== 1 ? 's' : ''} Selected
                  </span>
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={handleSelectAllEligible}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-zinc-300 border border-white/10 transition-all cursor-pointer"
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={handleSelectOlympiadOnly}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-zinc-300 border border-white/10 transition-all cursor-pointer"
                  >
                    Math Olympiad
                  </button>
                  <button
                    type="button"
                    disabled={!isSuperAdmin}
                    onClick={handleClearSelectedEvents}
                    className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] disabled:opacity-40 disabled:cursor-not-allowed text-[11px] text-zinc-400 border border-white/10 transition-all cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Team Events Section */}
              <div className="space-y-2.5 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <Users className="w-3.5 h-3.5" />
                    Team Events
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    Escape Room (2) • Tic-Tac-Toe (3) • Truss (3) • Wall Magazine (3)
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {teamEvents.map((evt) => {
                    const isSelected = spotSelectedEvents.includes(evt.id);
                    const isEligible = evt.allowedCategories.includes(spotCategory);
                    const canClick = isEligible && isSuperAdmin;

                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => handleToggleEvent(evt.id)}
                        disabled={!canClick}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 ${
                          !canClick
                            ? 'opacity-40 bg-zinc-900/40 border-white/5 cursor-not-allowed'
                            : isSelected
                              ? 'bg-amber-500/15 border-amber-500/40 shadow-lg shadow-amber-500/10 cursor-pointer'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded-md ${isSelected ? 'bg-amber-500/20 text-amber-300' : 'bg-white/5 text-zinc-400'}`}>
                              {isSelected ? <CheckSquare className="w-4 h-4 text-amber-400" /> : <Square className="w-4 h-4" />}
                            </div>
                            <div>
                              <span className={`text-xs font-bold block ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                {evt.name}
                              </span>
                              <span className="text-[10px] text-zinc-500 block font-mono mt-0.5">
                                {evt.description}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              {evt.teamSize} Members
                            </span>
                            {!isEligible && (
                              <span className="text-[9px] font-mono text-red-400">
                                {evt.allowedCategories.join('/')} Only
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Solo & Creative Events Section */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                    <User className="w-3.5 h-3.5" />
                    Solo & Academic Tracks
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Individual participation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {soloEvents.map((evt) => {
                    const isSelected = spotSelectedEvents.includes(evt.id);
                    const isEligible = evt.allowedCategories.includes(spotCategory);
                    const canClick = isEligible && isSuperAdmin;

                    return (
                      <button
                        key={evt.id}
                        type="button"
                        onClick={() => handleToggleEvent(evt.id)}
                        disabled={!canClick}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center justify-between gap-2 ${
                          !canClick
                            ? 'opacity-35 bg-zinc-900/30 border-white/5 cursor-not-allowed'
                            : isSelected
                              ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm cursor-pointer'
                              : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] cursor-pointer'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-0.5 rounded ${isSelected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {isSelected ? <CheckSquare className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> : <Square className="w-3.5 h-3.5 shrink-0" />}
                          </div>
                          <span className={`text-[11px] font-medium truncate ${isSelected ? 'text-emerald-200 font-bold' : 'text-zinc-300'}`}>
                            {evt.name}
                          </span>
                        </div>

                        {!isEligible && (
                          <span className="text-[8px] font-mono text-zinc-600 shrink-0">
                            N/A
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step 3: Registrant & Team Details */}
            <div className="space-y-6">
              {/* Primary Contact / Team Captain */}
              <div className="space-y-4 p-5 rounded-2xl bg-black/40 border border-white/5">
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <label className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <User className="w-4 h-4 text-emerald-400" />
                    {isTeamSelected ? '3. Team Captain Details (Main Contact & Ticket Recipient)' : '3. Participant Details (Main Contact & Ticket Recipient)'}
                  </label>
                  <span className="text-[10px] font-mono text-emerald-400">Receives Soft Copy Slip & QR Pass</span>
                </div>

                {isTeamSelected && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Team Name (Optional)
                    </label>
                    <div className="relative">
                      <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Matrix Enigma"
                        value={spotTeamName}
                        onChange={(e) => setSpotTeamName(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Captain Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                    {isTeamSelected ? "Team Captain's Full Name" : "Participant's Full Name"} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      disabled={!isSuperAdmin}
                      placeholder="Enter full name"
                      value={spotName}
                      onChange={(e) => setSpotName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone Grid (Captain only) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      {isTeamSelected ? "Captain Email (Soft Copy Pass)" : "Email Address (Soft Copy Pass)"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="email"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. captain@gmail.com"
                        value={spotEmail}
                        onChange={(e) => setSpotEmail(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      {isTeamSelected ? "Captain Phone Number" : "Phone Number"} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="tel"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. 01712345678"
                        value={spotPhone}
                        onChange={(e) => setSpotPhone(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Class & Institute Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Class / Standard <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Class 10, HSC-25"
                        value={spotClass}
                        onChange={handleClassChange}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                      Institute (School / College) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. St. Joseph Higher Secondary School"
                        value={spotInstitute}
                        onChange={(e) => setSpotInstitute(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic Team Member 2 Details (Only if team event selected) */}
              {isTeamSelected && maxTeamSizeNeeded >= 2 && (
                <div className="space-y-4 p-5 rounded-2xl bg-amber-500/[0.03] border border-amber-500/20 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-amber-500/10 pb-3">
                    <label className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                      <UserPlus className="w-4 h-4 text-amber-400" />
                      Team Member 2 Details
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Name, Class, Institute only (No email/phone)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 2 Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Tanvir Ahmed"
                        value={spotMember2Name}
                        onChange={(e) => setSpotMember2Name(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 2}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 2 Class <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Class 10"
                        value={spotMember2Class}
                        onChange={(e) => setSpotMember2Class(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 2}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 2 Institute <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. St. Joseph"
                        value={spotMember2Institute}
                        onChange={(e) => setSpotMember2Institute(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 2}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Team Member 3 Details (Only if 3-member event like Tic-Tac-Toe, Truss, Wall Magazine selected) */}
              {isTeamSelected && maxTeamSizeNeeded >= 3 && (
                <div className="space-y-4 p-5 rounded-2xl bg-blue-500/[0.03] border border-blue-500/20 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-blue-500/10 pb-3">
                    <label className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2 font-mono">
                      <UserPlus className="w-4 h-4 text-blue-400" />
                      Team Member 3 Details (3-Member Team Events)
                    </label>
                    <span className="text-[10px] font-mono text-zinc-500">Name, Class, Institute only (No email/phone)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 3 Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Samin Yasar"
                        value={spotMember3Name}
                        onChange={(e) => setSpotMember3Name(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 3 Class <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. Class 10"
                        value={spotMember3Class}
                        onChange={(e) => setSpotMember3Class(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                        Member 3 Institute <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        disabled={!isSuperAdmin}
                        placeholder="e.g. St. Joseph"
                        value={spotMember3Institute}
                        onChange={(e) => setSpotMember3Institute(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all font-mono"
                        required={isTeamSelected && maxTeamSizeNeeded >= 3}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Autogenerated ID info badge */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-400 font-mono">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-white font-bold block">Digital Pass & QR Code:</span>
                  <span className="text-[11px] text-zinc-500">Auto-dispatched to captain email with verification QR token</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-zinc-500">Ticket ID:</span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold">
                  #SPOT-XXXXX (5-digit unique code)
                </span>
              </div>
            </div>

            {/* Action Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={!isSuperAdmin || spotSubmitting || spotSelectedEvents.length === 0}
                className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                {spotSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : !isSuperAdmin ? (
                  <ShieldAlert className="w-5 h-5" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {!isSuperAdmin
                  ? 'Super Admin Authorization Required to Register Ticket'
                  : spotSubmitting 
                    ? 'Registering Events & Dispatching Soft Copy...' 
                    : `Register & Issue Ticket (${spotSelectedEvents.length} Event${spotSelectedEvents.length !== 1 ? 's' : ''}${isTeamSelected ? ` • ${maxTeamSizeNeeded} Members` : ''})`}
              </button>
            </div>
          </form>

          {/* Spot Registered Participants Registry below the Form */}
          <div className="mt-12 pt-8 border-t border-white/10 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight font-display">
                    Spot Registered Participants Registry
                  </h3>
                </div>
                <p className="text-xs text-zinc-400 mt-1">
                  Live log of on-spot tickets issued. Filter, sort by issue date or category, validate entry, and print passes.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => exportCandidatesCSV(spotParticipantsRegistry, 'Spot_Ticket_Registrations.csv')}
                  disabled={spotParticipantsRegistry.length === 0}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/10 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Spot CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleRefresh()}
                  className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white border border-white/10 transition-all cursor-pointer"
                  title="Refresh Registry"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Spot Search, Filter & Sort Controls */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div className="sm:col-span-6 relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search spot participants by name, spot ID, email, team, school..."
                    value={spotRegistrySearch}
                    onChange={(e) => setSpotRegistrySearch(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs">
                  <Filter className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-zinc-500 font-semibold">Category:</span>
                  <select
                    value={spotRegistryCategory}
                    onChange={(e: any) => setSpotRegistryCategory(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer w-full text-xs font-medium"
                  >
                    <option value="all" className="bg-zinc-950">All Categories</option>
                    <option value="Primary" className="bg-zinc-950">Primary (3-5)</option>
                    <option value="Junior" className="bg-zinc-950">Junior (6-8)</option>
                    <option value="Secondary" className="bg-zinc-950">Secondary (9-10)</option>
                    <option value="Higher Secondary" className="bg-zinc-950">Higher Sec (11-12)</option>
                  </select>
                </div>

                <div className="sm:col-span-3 flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-2 rounded-xl text-xs">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <span className="text-zinc-500 font-semibold">Sort:</span>
                  <select
                    value={spotRegistrySortBy}
                    onChange={(e: any) => setSpotRegistrySortBy(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer w-full text-xs font-medium"
                  >
                    <option value="newest" className="bg-zinc-950">Newest Issued</option>
                    <option value="oldest" className="bg-zinc-950">Oldest Issued</option>
                    <option value="name_asc" className="bg-zinc-950">Name (A → Z)</option>
                    <option value="name_desc" className="bg-zinc-950">Name (Z → A)</option>
                    <option value="id_asc" className="bg-zinc-950">Spot ID (Asc)</option>
                    <option value="id_desc" className="bg-zinc-950">Spot ID (Desc)</option>
                    <option value="class_asc" className="bg-zinc-950">Class (Asc)</option>
                    <option value="events_desc" className="bg-zinc-950">Most Events</option>
                    <option value="status" className="bg-zinc-950">Validated First</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono px-1">
                <span>Showing {spotParticipantsRegistry.length} Spot Registered entries</span>
                <span>{spotParticipantsRegistry.filter(c => purchases[c.id]?.validated).length} Validated</span>
              </div>
            </div>

            {/* Spot Participants Table */}
            {spotParticipantsRegistry.length === 0 ? (
              <div className="text-center py-12 rounded-2xl bg-white/[0.01] border border-white/5 space-y-2">
                <Ticket className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="text-sm font-semibold text-zinc-400">No on-spot participants registered yet</p>
                <p className="text-xs text-zinc-600">Issued spot tickets will appear here with full team & validation details.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-white/10 bg-black/20">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-semibold font-mono">
                      <th className="py-3 px-4">Ticket ID</th>
                      <th className="py-3 px-4">Participant / Captain</th>
                      <th className="py-3 px-4">Category & Institute</th>
                      <th className="py-3 px-4">Events & Team</th>
                      <th className="py-3 px-4 text-center">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-sans">
                    {spotParticipantsRegistry.map((cand) => {
                      const p = purchases[cand.id];
                      const isValidated = p?.validated === true;
                      const isConfirmed = p?.confirmed === true;

                      return (
                        <tr key={cand.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="py-3.5 px-4 font-mono font-bold text-emerald-400 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span>#SPOT-{cand.memberId}</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 font-normal block">
                              {p?.confirmedAt ? new Date(p.confirmedAt).toLocaleDateString() : 'Active'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{cand.fullName}</div>
                            <div className="text-[11px] text-zinc-400 font-mono flex flex-wrap gap-x-2">
                              <span>{cand.email}</span>
                              {cand.phone && <span>• {cand.phone}</span>}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/5 border border-white/10 text-zinc-300">
                                Class {cand.class}
                              </span>
                              {p?.category && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                  {p.category}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-zinc-400 truncate max-w-[200px] mt-0.5">
                              {cand.school || 'St. Joseph Higher Secondary School'}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {(cand.eventsList || []).map((ev, i) => (
                                <span key={i} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                                  {ev}
                                </span>
                              ))}
                            </div>
                            {p?.teamName && (
                              <div className="text-[11px] text-purple-300 font-semibold mt-1 flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                <span>{p.teamName}</span>
                              </div>
                            )}
                            {p?.teamMembers && p.teamMembers.length > 0 && (
                              <div className="text-[10px] text-zinc-400 mt-0.5">
                                {p.teamMembers.map((m: any) => m.name).filter(Boolean).join(', ')}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            {isValidated ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40">
                                <Check className="w-3 h-3 stroke-[3]" /> Validated
                              </span>
                            ) : isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <Ticket className="w-3 h-3" /> Ticket Issued
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-800 text-zinc-400">
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleOpenSlip(cand)}
                                className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                                title="View Digital Pass & QR Code"
                              >
                                <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Slip & QR</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleValidation(cand.id)}
                                disabled={actionLoading === cand.id || (isValidated && !isSuperAdmin)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  isValidated
                                    ? isSuperAdmin
                                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 cursor-pointer'
                                      : 'bg-violet-500/10 text-violet-400/60 border border-violet-500/20 cursor-not-allowed'
                                    : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm cursor-pointer'
                                }`}
                                title={isValidated ? (isSuperAdmin ? "Click to invalidate / revoke validation (Super Admin)" : "Validated (Only Super Admin can invalidate)") : "Click to validate ticket"}
                              >
                                {actionLoading === cand.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                )}
                                <span>{isValidated ? 'Verified' : 'Validate'}</span>
                              </button>

                              {/* Only Super Admin can delete on-spot participant record */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (!isSuperAdmin) {
                                    alert("Permission Denied: Only Super Administrators have authorization to delete on-spot ticket registrations and participant information.");
                                    return;
                                  }
                                  handleDeleteSpotTicket(cand);
                                }}
                                disabled={actionLoading === cand.id || !isSuperAdmin}
                                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                                  isSuperAdmin
                                    ? 'bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 border border-red-500/30 cursor-pointer'
                                    : 'bg-white/[0.02] text-zinc-600 border border-white/5 cursor-not-allowed opacity-50'
                                }`}
                                title={isSuperAdmin ? `Permanently Delete Spot Ticket & Info for ${cand.fullName} (Super Admin Only)` : "Only Super Admin can delete on-spot ticket participants"}
                              >
                                {actionLoading === cand.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Analytics Bento Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Users className="w-16 h-16 text-emerald-500" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Eligible Cohort</p>
          <p className="text-3xl font-bold text-white mt-2 font-display">{stats.totalEligible}</p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">{stats.unpurchasedCount} Pending sales</p>
        </div>

        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <Ticket className="w-16 h-16 text-emerald-400" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Tickets Issued</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2 font-display">{stats.totalPurchased}</p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            {stats.totalEligible > 0 ? ((stats.totalPurchased / stats.totalEligible) * 100).toFixed(1) : 0}% Conversion
          </p>
        </div>

        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
            <ShieldCheck className="w-16 h-16 text-violet-400" />
          </div>
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Validated Entry</p>
          <p className="text-3xl font-bold text-violet-400 mt-2 font-display">{stats.totalValidated}</p>
          <p className="text-[10px] text-zinc-400 mt-1 font-mono">
            {stats.totalPurchased > 0 ? ((stats.totalValidated / stats.totalPurchased) * 100).toFixed(1) : 0}% Validated
          </p>
        </div>

        <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 relative overflow-hidden">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Item Checklist Status</p>
          <div className="space-y-2 text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1.5"><Cookie className="w-3.5 h-3.5 text-amber-500/80" /> Snacks:</span>
              <span className="text-white font-bold">{stats.totalSnacks} <span className="text-zinc-600">/ {stats.totalPurchased}</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1.5"><Award className="w-3.5 h-3.5 text-blue-500/80" /> Certificates:</span>
              <span className="text-white font-bold">{stats.totalCertificates} <span className="text-zinc-600">/ {stats.totalPurchased}</span></span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-zinc-500 flex items-center gap-1.5"><Gift className="w-3.5 h-3.5 text-purple-500/80" /> Souvenirs:</span>
              <span className="text-white font-bold">{stats.totalSouvenirs} <span className="text-zinc-600">/ {stats.totalPurchased}</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar with Advanced Sorting & Views */}
      <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search candidates by name, email, phone, JMC ID, class, section, school, events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-400">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
            <ArrowUpDown className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="newest" className="bg-zinc-950">Latest / Newest First</option>
              <option value="oldest" className="bg-zinc-950">Oldest First</option>
              <option value="name_asc" className="bg-zinc-950">Name (A → Z)</option>
              <option value="name_desc" className="bg-zinc-950">Name (Z → A)</option>
              <option value="id_asc" className="bg-zinc-950">ID / Spot ID (Ascending)</option>
              <option value="id_desc" className="bg-zinc-950">ID / Spot ID (Descending)</option>
              <option value="class_asc" className="bg-zinc-950">Class (3 → 12)</option>
              <option value="class_desc" className="bg-zinc-950">Class (12 → 3)</option>
              <option value="events_desc" className="bg-zinc-950">Most Events Registered</option>
              <option value="status_validated" className="bg-zinc-950">Validated Entries First</option>
              <option value="status_purchased" className="bg-zinc-950">Purchased Tickets First</option>
              <option value="type" className="bg-zinc-950">Candidate Type</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span>Type:</span>
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-zinc-950">All Candidates</option>
              <option value="general" className="bg-zinc-950">General Members</option>
              <option value="ec" className="bg-zinc-950">EC Members</option>
              <option value="non_general" className="bg-zinc-950">Non-General (Event-Only)</option>
              <option value="spot" className="bg-zinc-950">Spot Tickets</option>
            </select>
          </div>

          {/* Ticket Status Filter */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
            <Ticket className="w-3.5 h-3.5 text-zinc-500" />
            <span>Status:</span>
            <select
              value={ticketFilter}
              onChange={(e: any) => setTicketFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-zinc-950">All Statuses</option>
              <option value="purchased" className="bg-zinc-950">Tickets Purchased</option>
              <option value="not_purchased" className="bg-zinc-950">Not Purchased</option>
              <option value="validated" className="bg-zinc-950">Validated Only</option>
            </select>
          </div>

          {/* Event Filter */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
            <Trophy className="w-3.5 h-3.5 text-zinc-500" />
            <span>Event:</span>
            <select
              value={eventFilter}
              onChange={(e: any) => setEventFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium max-w-[130px] truncate"
            >
              <option value="all" className="bg-zinc-950">All Events</option>
              <option value="Math Olympiad" className="bg-zinc-950">Math Olympiad</option>
              <option value="Truss" className="bg-zinc-950">Truss</option>
              <option value="Wall Magazine" className="bg-zinc-950">Wall Magazine Display</option>
              <option value="Tic-Tac-Toe" className="bg-zinc-950">Tic-Tac-Toe</option>
              <option value="Escape Room" className="bg-zinc-950">Escape Room</option>
              <option value="Sudoku" className="bg-zinc-950">Sudoku</option>
              <option value="Rubik" className="bg-zinc-950">Rubik&apos;s Cube</option>
              <option value="Science Olympiad" className="bg-zinc-950">Science Olympiad</option>
              <option value="Physics" className="bg-zinc-950">Physics Olympiad</option>
              <option value="Chemistry" className="bg-zinc-950">Chemistry Olympiad</option>
              <option value="Biology" className="bg-zinc-950">Biology Olympiad</option>
              <option value="Cyber" className="bg-zinc-950">IT & Cyber Olympiad</option>
              <option value="Astronomy" className="bg-zinc-950">Astronomy Olympiad</option>
              <option value="Robotics" className="bg-zinc-950">Robotics & Innovation</option>
              <option value="Project Display" className="bg-zinc-950">Project Display</option>
              <option value="Quiz" className="bg-zinc-950">Scientific Quiz</option>
              <option value="Scrapbook" className="bg-zinc-950">Scrapbook Display</option>
              <option value="Gaming" className="bg-zinc-950">Gaming (Valorant / FIFA)</option>
            </select>
          </div>

          {/* Class / Standard Filter */}
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-xl">
            <BookOpen className="w-3.5 h-3.5 text-zinc-500" />
            <span>Class:</span>
            <select
              value={classFilter}
              onChange={(e: any) => setClassFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer font-medium"
            >
              <option value="all" className="bg-zinc-950">All Classes</option>
              <option value="Primary" className="bg-zinc-950">Primary (3-5)</option>
              <option value="Junior" className="bg-zinc-950">Junior (6-8)</option>
              <option value="Secondary" className="bg-zinc-950">Secondary (9-10)</option>
              <option value="Higher Secondary" className="bg-zinc-950">Higher Sec (11-12)</option>
              <option value="3" className="bg-zinc-950">Class 3</option>
              <option value="4" className="bg-zinc-950">Class 4</option>
              <option value="5" className="bg-zinc-950">Class 5</option>
              <option value="6" className="bg-zinc-950">Class 6</option>
              <option value="7" className="bg-zinc-950">Class 7</option>
              <option value="8" className="bg-zinc-950">Class 8</option>
              <option value="9" className="bg-zinc-950">Class 9</option>
              <option value="10" className="bg-zinc-950">Class 10</option>
              <option value="11" className="bg-zinc-950">Class 11</option>
              <option value="12" className="bg-zinc-950">Class 12</option>
            </select>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-black/40 border border-white/10 rounded-xl p-1 gap-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'cards' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                viewMode === 'table' ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title="Data Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Export CSV Button */}
          <button
            type="button"
            onClick={() => exportCandidatesCSV(filteredCandidates, 'Participants_Registry.csv')}
            disabled={filteredCandidates.length === 0}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] text-zinc-300 border border-white/10 text-xs font-semibold transition-all disabled:opacity-40 cursor-pointer"
            title="Download CSV of current filtered and sorted results"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {/* QR Scanner Modal Button */}
          <button
            type="button"
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer ml-auto"
          >
            <Scan className="w-3.5 h-3.5" />
            Scan QR
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono pt-1 border-t border-white/5">
          <span>Showing {filteredCandidates.length} of {candidates.length} candidate records</span>
          <span>Sort: <strong className="text-zinc-300 font-semibold">{sortBy.replace(/_/g, ' ')}</strong></span>
        </div>
      </div>

      {/* Grid of Candidates */}
      {filteredCandidates.length === 0 ? (
        <div className="text-center py-16 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-3">
          <div className="w-12 h-12 rounded-full bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto text-zinc-500">
            <Search className="w-6 h-6" />
          </div>
          <p className="text-sm font-semibold text-zinc-400">No matching candidate files found</p>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">Try refining your search keywords or switching filters to uncover other registry rows.</p>
        </div>
      ) : viewMode === 'table' ? (
        /* TABLE VIEW */
        <div className="overflow-x-auto rounded-[2rem] border border-white/10 bg-black/20 p-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-zinc-400 font-semibold font-mono">
                <th className="py-3.5 px-4">Candidate ID</th>
                <th className="py-3.5 px-4">Full Name & Contact</th>
                <th className="py-3.5 px-4">Category & Class</th>
                <th className="py-3.5 px-4">Events Registered</th>
                <th className="py-3.5 px-4 text-center">Status</th>
                <th className="py-3.5 px-4 text-center">Checklist</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredCandidates.map((cand) => {
                const p = purchases[cand.id];
                const isPurchased = p?.confirmed === true;
                const isValidated = p?.validated === true;

                return (
                  <tr key={cand.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                      {cand.candidateType === 'spot' ? (
                        <span className="font-bold text-purple-400">#SPOT-{cand.memberId}</span>
                      ) : cand.memberId ? (
                        <span className="font-bold text-emerald-400">{cand.memberId}</span>
                      ) : (
                        <span className="text-zinc-500">{cand.id.slice(0, 8)}...</span>
                      )}
                      <div className="mt-0.5">
                        {cand.candidateType === 'general' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">General</span>
                        )}
                        {cand.candidateType === 'ec' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">EC</span>
                        )}
                        {cand.candidateType === 'non_general' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">Event-Only</span>
                        )}
                        {cand.candidateType === 'spot' && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Spot</span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{cand.fullName}</div>
                      <div className="text-[11px] text-zinc-400 font-mono flex flex-wrap gap-x-2">
                        <span>{cand.email}</span>
                        {cand.phone && <span>• {cand.phone}</span>}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-zinc-300">Class {cand.class} {cand.section ? `• Sec ${cand.section}` : ''} {cand.roll ? `• Roll ${cand.roll}` : ''}</div>
                      <div className="text-[11px] text-zinc-500 truncate max-w-[180px]">{cand.school || 'St. Joseph Higher Secondary School'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(cand.eventsList || []).map((ev, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isValidated ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-violet-500/20 text-violet-300 border border-violet-500/40">
                          <Check className="w-3 h-3 stroke-[3]" /> Validated
                        </span>
                      ) : isPurchased ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          <Ticket className="w-3 h-3" /> Purchased
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-zinc-800/80 text-zinc-400 border border-white/5">
                          Unpurchased
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isPurchased ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => toggleChecklistItem(cand.id, 'snacks')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              p?.snacks ? 'bg-amber-500/20 border-amber-500/40 text-amber-400' : 'bg-white/5 border-white/10 text-zinc-600'
                            }`}
                            title="Toggle Snacks"
                          >
                            <Cookie className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleChecklistItem(cand.id, 'certificate')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              p?.certificate ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-600'
                            }`}
                            title="Toggle Certificate"
                          >
                            <Award className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleChecklistItem(cand.id, 'souvenir')}
                            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                              p?.souvenir ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-white/5 border-white/10 text-zinc-600'
                            }`}
                            title="Toggle Souvenir"
                          >
                            <Gift className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-zinc-600 text-[10px]">—</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {isPurchased && (
                          <button
                            type="button"
                            onClick={() => handleOpenSlip(cand)}
                            className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                            title="View Digital Pass & QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Slip</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleTogglePurchase(cand.id)}
                          disabled={actionLoading === cand.id}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                            isPurchased
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-sm'
                          }`}
                        >
                          {actionLoading === cand.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Ticket className="w-3.5 h-3.5" />
                          )}
                          <span>{isPurchased ? 'Cancel' : 'Purchase'}</span>
                        </button>

                        {isPurchased && (
                          <button
                            type="button"
                            onClick={() => handleToggleValidation(cand.id)}
                            disabled={actionLoading === cand.id || (isValidated && !isSuperAdmin)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                              isValidated
                                ? isSuperAdmin
                                  ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 hover:bg-violet-500/30 cursor-pointer'
                                  : 'bg-violet-500/10 text-violet-400/60 border border-violet-500/20 cursor-not-allowed'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/10 cursor-pointer'
                            }`}
                            title={isValidated ? (isSuperAdmin ? "Click to invalidate / revoke validation (Super Admin)" : "Validated (Only Super Admin can invalidate)") : "Click to validate ticket"}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{isValidated ? 'Verified' : 'Validate'}</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCandidates.map((cand) => {
              const p = purchases[cand.id];
              const isPurchased = p?.confirmed === true;
              const isValidated = p?.validated === true;

              return (
                <motion.div
                  key={cand.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 rounded-[2.5rem] bg-white/[0.02] border transition-all relative overflow-hidden flex flex-col justify-between ${
                    isValidated 
                      ? 'border-violet-500/35 bg-violet-950/[0.01]' 
                      : isPurchased 
                        ? 'border-emerald-500/30 bg-emerald-950/[0.01]' 
                        : 'border-white/5 hover:border-white/10'
                  }`}
                >
                  {/* Visual Category Badge */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5">
                    {cand.candidateType === 'general' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        General Member
                      </span>
                    )}
                    {cand.candidateType === 'ec' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        EC Member
                      </span>
                    )}
                    {cand.candidateType === 'non_general' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        Event Registrant
                      </span>
                    )}
                    {cand.candidateType === 'spot' && (
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-purple-500/10 text-purple-400 border border-purple-500/20 animate-pulse">
                        Spot Ticket
                      </span>
                    )}
                  </div>

                  {/* Main details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-white tracking-tight leading-snug pr-24">
                        {cand.fullName}
                      </h3>
                      
                      {/* Secondary identifiers */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 mt-1 font-mono">
                        {cand.memberId && (
                          <span className="text-emerald-400/90 font-semibold">
                            {cand.candidateType === 'spot' ? `SPOT-${cand.memberId}` : cand.memberId}
                          </span>
                        )}
                        {!cand.memberId && (
                          <span className="text-zinc-600">No Member ID</span>
                        )}
                        <span className="text-zinc-700">•</span>
                        <span>Class {cand.class || 'N/A'}</span>
                        <span className="text-zinc-700">•</span>
                        <span>Sec {cand.section || 'N/A'}</span>
                        <span className="text-zinc-700">•</span>
                        <span>Roll {cand.roll || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Contact & School information */}
                    <div className="p-3 bg-black/30 rounded-2xl text-[11px] space-y-1 text-zinc-400 font-mono">
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Email:</span>
                        <span className="text-zinc-300 truncate max-w-[200px]">{cand.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Phone:</span>
                        <span className="text-zinc-300">{cand.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-600">Institution:</span>
                        <span className="text-zinc-300 truncate max-w-[200px]">{cand.school || 'St Joseph'}</span>
                      </div>
                    </div>

                    {/* Registered Events list */}
                    {cand.eventsList.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Registered Events</p>
                        <div className="flex flex-wrap gap-1">
                          {cand.eventsList.map((evt, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-white/[0.04] border border-white/5 text-[9px] font-mono text-zinc-400">
                              {evt}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Operational Footer of the card */}
                  <div className="mt-6 pt-5 border-t border-white/5 space-y-4">
                    {!isPurchased ? (
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-zinc-600 font-mono">No Active Ticket</span>
                        <button
                          onClick={() => confirmTicketPurchase(cand)}
                          disabled={actionLoading === cand.id}
                          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs font-bold text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          {actionLoading === cand.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-black" />
                          ) : (
                            <Ticket className="w-4 h-4" />
                          )}
                          Confirm Purchase
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Ticket issued & Validate action */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ticket Issued
                            </span>
                            <span className="text-[9px] font-mono text-zinc-600 mt-0.5">
                              By {p.confirmedBy}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedSlipCandidate(cand);
                                setIsSlipModalOpen(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-[11px] font-bold text-emerald-400 transition-all cursor-pointer"
                              title="View & Email Purchase Slip with QR Code"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Slip & QR</span>
                            </button>

                            <button
                              onClick={() => toggleValidation(cand.id)}
                              disabled={actionLoading === `${cand.id}-validate` || (isValidated && !isSuperAdmin)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                                isValidated 
                                  ? isSuperAdmin
                                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-300 hover:bg-violet-500/30 cursor-pointer'
                                    : 'bg-violet-500/5 border-violet-500/20 text-violet-400/60 cursor-not-allowed' 
                                  : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.08] cursor-pointer'
                              }`}
                              title={isValidated ? (isSuperAdmin ? "Click to invalidate / revoke validation (Super Admin)" : "Validated (Only Super Admin can invalidate)") : "Click to validate ticket"}
                            >
                              {actionLoading === `${cand.id}-validate` ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : isValidated ? (
                                <ShieldCheck className="w-3.5 h-3.5" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              {isValidated ? 'Validated' : 'Validate'}
                            </button>

                            {cand.candidateType === 'spot' && (
                              <button
                                onClick={() => {
                                  if (!isSuperAdmin) {
                                    alert("Permission Denied: Only Super Administrators have authorization to delete on-spot ticket registrations and participant information.");
                                    return;
                                  }
                                  handleDeleteSpotTicket(cand);
                                }}
                                disabled={actionLoading === cand.id || !isSuperAdmin}
                                className={`p-1.5 rounded-xl border transition-all ${
                                  isSuperAdmin
                                    ? 'bg-red-500/10 hover:bg-red-500/20 border-red-500/30 text-red-400 cursor-pointer'
                                    : 'bg-white/[0.02] border-white/5 text-zinc-600 cursor-not-allowed opacity-50'
                                }`}
                                title={isSuperAdmin ? `Permanently Delete Spot Ticket & Info for ${cand.fullName} (Super Admin Only)` : "Only Super Admin can delete on-spot ticket participants"}
                              >
                                {actionLoading === cand.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-red-400" />
                                ) : (
                                  <Trash2 className="w-3.5 h-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Interactive Item Checklist */}
                        <div className="p-3 bg-white/[0.01] border border-white/5 rounded-2xl space-y-2.5">
                          <p className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase">Event Checklist</p>
                          <div className="grid grid-cols-3 gap-2">
                            {/* Snacks checklist */}
                            <button
                              onClick={() => toggleChecklistItem(cand.id, 'snacks')}
                              disabled={actionLoading === `${cand.id}-snacks`}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                                p.snacks 
                                  ? 'bg-amber-500/10 border-amber-500/35 text-amber-400' 
                                  : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10'
                              }`}
                            >
                              <Cookie className="w-4 h-4" />
                              <span className="text-[10px] font-semibold">Snacks</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                p.snacks ? 'bg-amber-500 border-amber-500 text-black' : 'border-zinc-700'
                              }`}>
                                {p.snacks && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>

                            {/* Certificate checklist */}
                            <button
                              onClick={() => toggleChecklistItem(cand.id, 'certificate')}
                              disabled={actionLoading === `${cand.id}-certificate`}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                                p.certificate 
                                  ? 'bg-blue-500/10 border-blue-500/35 text-blue-400' 
                                  : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10'
                              }`}
                            >
                              <Award className="w-4 h-4" />
                              <span className="text-[10px] font-semibold">Certificate</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                p.certificate ? 'bg-blue-500 border-blue-500 text-black' : 'border-zinc-700'
                              }`}>
                                {p.certificate && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>

                            {/* Souvenir checklist */}
                            <button
                              onClick={() => toggleChecklistItem(cand.id, 'souvenir')}
                              disabled={actionLoading === `${cand.id}-souvenir`}
                              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center gap-1 ${
                                p.souvenir 
                                  ? 'bg-purple-500/10 border-purple-500/35 text-purple-400' 
                                  : 'bg-transparent border-white/5 text-zinc-500 hover:border-white/10'
                              }`}
                            >
                              <Gift className="w-4 h-4" />
                              <span className="text-[10px] font-semibold">Souvenir</span>
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                p.souvenir ? 'bg-purple-500 border-purple-500 text-black' : 'border-zinc-700'
                              }`}>
                                {p.souvenir && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                              </div>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
        </>
      )}

      {/* Purchase Slip & QR Modal */}
      <PurchaseSlipModal
        candidate={selectedSlipCandidate}
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
        onEmailSent={() => handleRefresh()}
      />

      {/* Floating Modal QR Scanner */}
      {isScanModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-xl">
            <QRScanner
              inline={false}
              onScan={handleTickifyScan}
              onClose={() => setIsScanModalOpen(false)}
              fps={25}
              lastScannedId={tickifyScanPopup?.candidateName ? `${tickifyScanPopup.candidateName} (${tickifyScanPopup.memberId || 'VERIFIED'})` : null}
              isProcessing={actionLoading !== null}
              title="Ticket Validation Scanner"
              subtitle="Scan Participant ID, Pass QR or Soft Copy Ticket for Instant Verification"
            />

            {/* FLOATING VERIFICATION OVERLAY POPUP */}
            <AnimatePresence>
              {tickifyScanPopup && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  className={`absolute bottom-6 left-6 right-6 p-4 rounded-2xl border shadow-2xl backdrop-blur-xl z-[130] flex items-center gap-3.5 ${
                    tickifyScanPopup.type === 'verified'
                      ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-100 shadow-emerald-900/40'
                      : tickifyScanPopup.type === 'already'
                      ? 'bg-amber-950/95 border-amber-500/50 text-amber-100 shadow-amber-900/40'
                      : 'bg-red-950/95 border-red-500/50 text-red-100 shadow-red-900/40'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shrink-0 ${
                    tickifyScanPopup.type === 'verified'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : tickifyScanPopup.type === 'already'
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-red-500/20 border-red-500/40 text-red-400'
                  }`}>
                    {tickifyScanPopup.type === 'verified' && <ShieldCheck className="w-6 h-6 animate-bounce" />}
                    {tickifyScanPopup.type === 'already' && <CheckCircle2 className="w-6 h-6 animate-pulse" />}
                    {tickifyScanPopup.type === 'error' && <XCircle className="w-6 h-6 animate-pulse" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className={`text-[9px] font-black uppercase tracking-widest block ${
                      tickifyScanPopup.type === 'verified' ? 'text-emerald-400' :
                      tickifyScanPopup.type === 'already' ? 'text-amber-400' : 'text-red-400'
                    }`}>
                      {tickifyScanPopup.type === 'verified' ? '✓ MEMBER VERIFIED' :
                       tickifyScanPopup.type === 'already' ? 'ℹ ALREADY VERIFIED' : '⚠ UNRECOGNIZED QR CODE'}
                    </span>
                    
                    {tickifyScanPopup.candidateName && (
                      <h4 className="text-base font-black text-white font-display truncate">
                        {tickifyScanPopup.candidateName}
                      </h4>
                    )}

                    {tickifyScanPopup.memberId && (
                      <p className="text-[11px] font-mono font-bold text-emerald-300">
                        ID: {tickifyScanPopup.memberId} {tickifyScanPopup.className ? `• Class ${tickifyScanPopup.className}` : ''}
                      </p>
                    )}

                    <p className="text-[11px] text-zinc-300">
                      {tickifyScanPopup.message}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}
