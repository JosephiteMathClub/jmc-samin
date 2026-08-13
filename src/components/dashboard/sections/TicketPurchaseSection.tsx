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
  Scan
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { matchesSearchWithFuzzy, resolveEventNames } from '../../../lib/utils';
import { playSuccessSound, playErrorSound } from '../../../lib/sound';
import QRScanner from '../QRScanner';
import { PurchaseSlipModal, PurchaseSlipCandidate } from '../PurchaseSlipModal';

interface TicketPurchase {
  id: string; // user UUID
  fullName: string;
  email: string;
  phone: string;
  memberId?: string;
  class: string;
  section: string;
  roll: string;
  confirmed: boolean;
  confirmedAt?: string;
  confirmedBy?: string;
  validated: boolean;
  validatedAt?: string;
  validatedBy?: string;
  snacks: boolean;
  certificate: boolean;
  souvenir: boolean;
  candidateType: 'general' | 'ec' | 'non_general' | 'spot';
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
}

export function TicketPurchaseSection() {
  const { user } = useAuth();
  
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

  // Tickify Continuous QR Scanner State & Overlay Popup
  const [tickifyScanPopup, setTickifyScanPopup] = useState<{
    type: 'verified' | 'already' | 'error';
    candidateName?: string;
    memberId?: string;
    className?: string;
    message: string;
  } | null>(null);

  const scanCooldownRef = useRef<{ [key: string]: number }>({});

  // Helper to find candidate by decoded QR text (JSON payload, PassId, memberId, phone, email, etc.)
  const findMatchingCandidate = useCallback((scannedText: string, candidatesList: Candidate[]) => {
    if (!scannedText) return null;

    let parsedId = '';
    let parsedName = '';
    let parsedTrxn = '';

    // 1. Try parsing JSON payload from purchase slip or pass
    try {
      const json = JSON.parse(scannedText);
      parsedId = (json.id || json.member_id || json.memberId || json.code || '').toString().trim();
      parsedName = (json.name || json.full_name || json.fullName || '').toString().trim();
      parsedTrxn = (json.trxnid || json.trxn_id || json.trxId || '').toString().trim();
    } catch (e) {
      // 2. Try Key-Value formatted string: PassId:... \n Name:...
      if (scannedText.includes('PassId:')) {
        const matchId = scannedText.match(/PassId:\s*([^\n\r]+)/i);
        if (matchId) parsedId = matchId[1].trim();
        const matchName = scannedText.match(/Name:\s*([^\n\r]+)/i);
        if (matchName) parsedName = matchName[1].trim();
      } else {
        parsedId = scannedText.trim();
      }
    }

    const cleanId = parsedId.toUpperCase();
    const cleanTrxn = parsedTrxn.toUpperCase();
    const cleanName = parsedName.toLowerCase();

    return candidatesList.find(cand => {
      const cId = (cand.memberId || '').toUpperCase();
      const cRealId = (cand.id || '').toUpperCase();
      const cPhone = (cand.phone || '').replace(/\D/g, '');
      const cEmail = (cand.email || '').toLowerCase();
      const cName = (cand.fullName || '').toLowerCase();

      if (cleanId) {
        if (cId === cleanId) return true;
        if (cRealId === cleanId) return true;
        if (`SPOT-${cId}` === cleanId) return true;
        if (`JMC-${cId}` === cleanId) return true;
        if (cId.replace(/^JMC-/, '') === cleanId.replace(/^JMC-/, '')) return true;
      }

      if (cleanTrxn && cand.id.toUpperCase().includes(cleanTrxn)) return true;
      if (cleanName && cName === cleanName) return true;

      const rawClean = scannedText.trim().toLowerCase();
      if (cEmail && cEmail === rawClean) return true;
      if (cPhone && cPhone.length > 5 && rawClean.includes(cPhone)) return true;

      return false;
    });
  }, []);

  // Continuous Scan Handler for Tickify Mode
  const handleTickifyScan = useCallback(async (decodedText: string) => {
    if (!decodedText) return;

    const now = Date.now();
    if (scanCooldownRef.current[decodedText] && now - scanCooldownRef.current[decodedText] < 2500) {
      return; // 2.5s cooldown per identical QR code frame
    }
    scanCooldownRef.current[decodedText] = now;

    const matched = findMatchingCandidate(decodedText, candidates);

    if (!matched) {
      playErrorSound(0.12);
      setTickifyScanPopup({
        type: 'error',
        message: `Unrecognized QR code or Ticket ID: "${decodedText.slice(0, 30)}"`
      });
      setTimeout(() => {
        setTickifyScanPopup(prev => (prev?.type === 'error' ? null : prev));
      }, 2500);
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
      confirmedBy: existing?.confirmedBy || user?.email || 'Admin',
      validated: true,
      validatedAt: existing?.validatedAt || new Date().toISOString(),
      validatedBy: user?.email || 'Admin',
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
        message: 'Already Validated - Entry & Perks Re-confirmed'
      });
    } else {
      playSuccessSound(0.2);
      setTickifyScanPopup({
        type: 'verified',
        candidateName: matched.fullName,
        memberId: matched.memberId || matched.id,
        className: matched.class,
        message: 'Member Verified! Ticket, Snacks & Souvenir Checked'
      });
    }

    // Auto-dismiss popup after 2.5 seconds WITHOUT closing the scanner!
    setTimeout(() => {
      setTickifyScanPopup(null);
    }, 2500);
  }, [candidates, purchases, findMatchingCandidate, user?.email]);

  // Spot Purchase Form State
  const [spotName, setSpotName] = useState('');
  const [spotClass, setSpotClass] = useState('');
  const [spotInstitute, setSpotInstitute] = useState('');
  const [spotId, setSpotId] = useState('');
  const [spotError, setSpotError] = useState<string | null>(null);
  const [spotSuccess, setSpotSuccess] = useState<string | null>(null);
  const [spotSubmitting, setSpotSubmitting] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'general' | 'ec' | 'non_general' | 'spot'>('all');
  const [ticketFilter, setTicketFilter] = useState<'all' | 'purchased' | 'not_purchased' | 'validated'>('all');

  const handleSpotPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSpotError(null);
    setSpotSuccess(null);

    // Validate inputs
    if (!spotName.trim()) {
      setSpotError("Registrant's Name is required.");
      return;
    }
    if (!spotClass.trim()) {
      setSpotError("Class is required.");
      return;
    }
    if (!spotInstitute.trim()) {
      setSpotError("Institute (School/College) is required.");
      return;
    }
    if (!/^\d{4}$/.test(spotId)) {
      setSpotError("ID must be exactly 4 digits (e.g. 1234).");
      return;
    }

    // Check for duplicate ID
    const idExists = candidates.some(cand => cand.memberId === spotId);
    if (idExists) {
      setSpotError(`ID "${spotId}" is already registered. Please use a unique 4-digit ID.`);
      return;
    }

    setSpotSubmitting(true);

    try {
      const spotTicketId = `spot-${spotId}`;
      const newSpotPurchase: TicketPurchase = {
        id: spotTicketId,
        fullName: spotName.trim(),
        email: '',
        phone: '',
        memberId: spotId,
        class: spotClass.trim(),
        section: '',
        roll: '',
        confirmed: true,
        confirmedAt: new Date().toISOString(),
        confirmedBy: user?.email || 'Admin',
        validated: false,
        snacks: false,
        certificate: false,
        souvenir: false,
        candidateType: 'spot'
      };

      const updated = {
        ...purchases,
        [spotTicketId]: newSpotPurchase
      };

      await savePurchaseState(updated);

      const newCandidate: Candidate = {
        id: spotTicketId,
        fullName: spotName.trim(),
        email: '',
        phone: '',
        memberId: spotId,
        class: spotClass.trim(),
        section: '',
        roll: '',
        school: spotInstitute.trim(),
        candidateType: 'spot',
        eventsList: ['Spot Ticket Registration']
      };

      setCandidates(prev => [newCandidate, ...prev]);
      setSpotSuccess(`Spot Ticket with ID "${spotId}" purchased successfully!`);
      
      // Reset form
      setSpotName('');
      setSpotClass('');
      setSpotInstitute('');
      setSpotId('');
    } catch (err: any) {
      console.error('Failed to register spot ticket:', err);
      setSpotError(err.message || 'An error occurred while saving the spot ticket.');
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
      const { data: memberData, error: memberErr } = await supabase
        .from('member')
        .select('id, full_name, email, phone, member_id, class, section, roll, school, verified');

      if (memberErr) throw memberErr;

      // 3. Fetch EC members
      const { data: ecMemberData, error: ecErr } = await supabase
        .from('ec_member')
        .select('id, full_name, email, phone, member_id, class, section, roll, school, verified');

      if (ecErr) {
        console.error('Error fetching EC members:', ecErr);
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
        const { data, error: tableErr } = await supabase
          .from(table)
          .select('user_id, full_name, class, section, roll, bkash_number, trxnid, selected_events, verified');
        
        if (tableErr) {
          console.error(`Error fetching from ${table}:`, tableErr);
          continue;
        }
        if (data) {
          allEventRegs.push(...data.map(d => ({ ...d, tableName: table })));
        }
      }

      // Group event registrations by user_id to find participants
      const eventParticipantsMap = new Map<string, { events: string[], data: any }>();
      allEventRegs.forEach(reg => {
        if (!reg.user_id) return;
        const uid = reg.user_id.toLowerCase();
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
      confirmed: true,
      confirmedAt: new Date().toISOString(),
      confirmedBy: user?.email || 'Admin',
      validated: false,
      snacks: false,
      certificate: false,
      souvenir: false,
      candidateType: candidate.candidateType
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
      alert("Ticket validation is permanent and cannot be cancelled under any circumstances.");
      return;
    }

    setActionLoading(`${userId}-validate`);
    const updatedPurchase = {
      ...purchase,
      validated: true,
      validatedAt: new Date().toISOString(),
      validatedBy: user?.email || 'Admin'
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

  // Filter candidates list based on query and tabs
  const filteredCandidates = useMemo(() => {
    return candidates.filter(cand => {
      // 1. Search Query filter (matches ID, Name, Email, Class, Section, Roll, Phone)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = cand.fullName.toLowerCase().includes(query);
        const matchesEmail = cand.email.toLowerCase().includes(query);
        const matchesPhone = cand.phone.toLowerCase().includes(query);
        const matchesMemberId = cand.memberId ? cand.memberId.toLowerCase().includes(query) : false;
        const matchesClass = cand.class.toLowerCase().includes(query);
        const matchesSection = cand.section.toLowerCase().includes(query);
        const matchesRoll = cand.roll.toLowerCase().includes(query);
        
        const fuzzyMatches = matchesSearchWithFuzzy(cand.fullName, query);

        if (!matchesName && !matchesEmail && !matchesPhone && !matchesMemberId && !matchesClass && !matchesSection && !matchesRoll && !fuzzyMatches) {
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

      return true;
    });
  }, [candidates, purchases, searchQuery, typeFilter, ticketFilter]);

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
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/10 text-xs font-semibold text-zinc-300 hover:bg-white/[0.08] transition-all disabled:opacity-50 self-start md:self-auto"
        >
          <RefreshCw className={`w-4.5 h-4.5 ${refreshing ? 'animate-spin text-emerald-500' : ''}`} />
          Sync Roster Data
        </button>
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
          <div className="relative rounded-[2.5rem] overflow-hidden border border-emerald-500/20 bg-black min-h-[420px] shadow-2xl">
            
            {/* Live Camera Feed */}
            <QRScanner
              onScan={handleTickifyScan}
              onClose={() => setSubTab('validation')}
              fps={15}
            />

            {/* FLOATING VERIFICATION OVERLAY POPUP */}
            <AnimatePresence>
              {tickifyScanPopup && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute inset-x-4 top-12 z-50 p-6 rounded-3xl border shadow-2xl backdrop-blur-2xl flex flex-col items-center text-center space-y-3 ${
                    tickifyScanPopup.type === 'verified'
                      ? 'bg-emerald-950/95 border-emerald-500/60 text-white shadow-emerald-500/20'
                      : tickifyScanPopup.type === 'already'
                      ? 'bg-amber-950/95 border-amber-500/60 text-white shadow-amber-500/20'
                      : 'bg-red-950/95 border-red-500/60 text-white shadow-red-500/20'
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
          className="max-w-2xl mx-auto p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-6"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 font-display">
              <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
              SPOT TICKET ISSUANCE FORM
            </h3>
            <p className="text-xs text-zinc-500">
              Instantly register and issue a ticket on the spot. Input the registrant's name, class, institute, and 4-digit ID.
            </p>
          </div>

          {spotError && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div className="text-sm text-red-200">{spotError}</div>
            </div>
          )}

          {spotSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-200">{spotSuccess}</div>
            </div>
          )}

          <form onSubmit={handleSpotPurchase} className="space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Registrant's Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Enter registrant's full name"
                  value={spotName}
                  onChange={(e) => setSpotName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  Class <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="e.g. Class 10, HSC-25"
                    value={spotClass}
                    onChange={(e) => setSpotClass(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                  ID (4 Digits Only) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Ticket className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    maxLength={4}
                    placeholder="Input 4-digit ID (e.g. 1045)"
                    value={spotId}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                      setSpotId(val);
                    }}
                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
                Institute / School <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="e.g. St. Joseph Higher Secondary School"
                  value={spotInstitute}
                  onChange={(e) => setSpotInstitute(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                />
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={spotSubmitting}
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-sm font-bold text-black shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-[0.99] transition-all cursor-pointer"
              >
                {spotSubmitting ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <Sparkles className="w-5 h-5" />
                )}
                {spotSubmitting ? 'Issuing Spot Ticket...' : 'Issue Spot Ticket'}
              </button>
            </div>
          </form>
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

      {/* Filter and Search Bar */}
      <div className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500" />
          <input
            type="text"
            placeholder="Search candidates by name, email, phone, JMC ID, class, section..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-zinc-400">
          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span>Category:</span>
            <select
              value={typeFilter}
              onChange={(e: any) => setTypeFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-950">All Candidates</option>
              <option value="general" className="bg-zinc-950">General Members</option>
              <option value="ec" className="bg-zinc-950">EC Members</option>
              <option value="non_general" className="bg-zinc-950">Non-General (Event-Only)</option>
              <option value="spot" className="bg-zinc-950">Spot Tickets</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-white/[0.03] border border-white/10 px-3 py-1.5 rounded-xl">
            <Ticket className="w-3.5 h-3.5 text-zinc-500" />
            <span>Ticket Status:</span>
            <select
              value={ticketFilter}
              onChange={(e: any) => setTicketFilter(e.target.value)}
              className="bg-transparent text-white focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-zinc-950">All Statuses</option>
              <option value="purchased" className="bg-zinc-950">Tickets Purchased</option>
              <option value="not_purchased" className="bg-zinc-950">Not Purchased</option>
              <option value="validated" className="bg-zinc-950">Validated Only</option>
            </select>
          </div>

          <div className="ml-auto font-mono text-[10px] text-zinc-500">
            Showing {filteredCandidates.length} of {candidates.length} records
          </div>
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
                              disabled={actionLoading === `${cand.id}-validate` || isValidated}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold transition-all ${
                                isValidated 
                                  ? 'bg-violet-500/5 border-violet-500/20 text-violet-400/60 cursor-not-allowed' 
                                  : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.08]'
                              }`}
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
    </div>
  );
}
