"use client";
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Cookie, 
  Coffee, 
  Utensils, 
  QrCode, 
  Trash2, 
  Plus, 
  Settings, 
  Users, 
  ChevronRight, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Award,
  Calendar,
  XCircle,
  KeyRound
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import QRScanner from '../QRScanner';

interface FoodSlot {
  id: string;
  name: string;
  max_servings: number;
}

interface ScanLog {
  id: string;
  member_id: string;
  full_name: string;
  slot_id: string;
  scanned_at: string;
  scanned_by: string;
  is_ec: boolean;
  serving_number: number;
}

interface FoodManagementSectionProps {
  members: any[];
  shouldReduceGfx?: boolean;
}

export const FoodManagementSection: React.FC<FoodManagementSectionProps> = ({
  members,
  shouldReduceGfx = false
}) => {
  const { user, isSuperAdmin } = useAuth();
  
  // State
  const [loading, setLoading] = useState(true);
  const [distributionEnabled, setDistributionEnabled] = useState(false);
  const [slots, setSlots] = useState<FoodSlot[]>([
    { id: 'snacks', name: 'Snacks', max_servings: 1 },
    { id: 'lunch', name: 'Lunch', max_servings: 1 },
    { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
  ]);
  const [activeSlotId, setActiveSlotId] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [logs, setLogs] = useState<ScanLog[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [manualId, setManualId] = useState('');
  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  
  // Search state for logs and manual entry
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'scan' | 'logs' | 'settings'>('scan');

  // Modal feedback state
  const [scanFeedback, setScanFeedback] = useState<{
    status: 'success' | 'duplicate' | 'error';
    title: string;
    message: string;
    memberName?: string;
    memberId?: string;
    isEc?: boolean;
    servingNumber?: number;
    maxServings?: number;
    time?: string;
  } | null>(null);

  // New slot inputs
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotMaxServings, setNewSlotMaxServings] = useState(1);

  // Responsive Search Filtering for Manual Lookup Fallback
  const matchingMembers = useMemo(() => {
    const query = manualId.trim().toLowerCase();
    if (!query) return [];

    return (members || []).filter(m => {
      const mId = (m.member_id || '').toLowerCase();
      // Only general member and EC member's code can be input; the other 5-digit code is blocked.
      if (/^\d{5}$/.test(mId)) {
        return false;
      }
      const fullName = (m.full_name || '').toLowerCase();

      // Match full_name or member_id
      const matchesId = mId.includes(query);
      const matchesName = fullName.includes(query);

      if (!matchesId && !matchesName) return false;

      // Determine if they are EC members
      const isEcMember = m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id));

      // Rule: If query length <= 3, show both EC and general members.
      // If query length > 3, isolate only to general members (i.e., do not show EC members).
      if (query.length > 3) {
        return !isEcMember;
      }

      return true;
    });
  }, [manualId, members]);

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    // Rely on console / local visual feedback for scan panels
    console.log(`[Food Management Toast] ${type.toUpperCase()}: ${msg}`);
  };

  // Fetch or Seed database row for food management
  const fetchFoodData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 'food_management')
        .maybeSingle();

      if (error) throw error;

      if (data && data.data) {
        const payload = data.data;
        if (payload.settings?.slots) {
          setSlots(payload.settings.slots);
        }
        if (payload.settings?.active_slot_id) {
          setActiveSlotId(prev => prev || payload.settings.active_slot_id);
        } else {
          setActiveSlotId(prev => prev || 'snacks');
        }
        setDistributionEnabled(payload.settings?.distribution_enabled === true);
        if (payload.settings?.available_slots) {
          setAvailableSlots(payload.settings.available_slots);
        } else {
          setAvailableSlots(payload.settings?.slots ? payload.settings.slots.map((s: any) => s.id) : ['snacks']);
        }
        if (payload.logs) {
          setLogs(payload.logs);
        }
      } else {
        // Direct seed food management record in site_content
        const initialPayload = {
          settings: {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks',
            distribution_enabled: false
          },
          logs: []
        };
        const { error: seedError } = await supabase
          .from('site_content')
          .insert({
            id: 'food_management',
            data: initialPayload,
            updated_at: new Date().toISOString()
          });
        if (seedError) console.warn("Failed seeding food distribution data store:", seedError);
      }
    } catch (err) {
      console.error("Error fetching food distribution settings:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFoodData();
  }, [fetchFoodData]);

  // Save current dynamic food state to Supabase
  const saveFoodState = async (updatedSlots: FoodSlot[], activeId: string, updatedLogs: ScanLog[]) => {
    if (!isSupabaseConfigured) return;
    try {
      const payload = {
        settings: {
          slots: updatedSlots,
          active_slot_id: activeId,
          distribution_enabled: distributionEnabled,
          available_slots: availableSlots
        },
        logs: updatedLogs
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: payload,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
    } catch (err: any) {
      console.error("Error saving food distribution state to Supabase:", err);
      showToast("Sync Error: Failed to save to database.", "error");
    }
  };

  // Handle Scan QR code logic
  const handleScan = async (decodedText: string) => {
    if (isProcessing) return;
    setIsProcessing(true);

    const isSlotAvailable = availableSlots.includes(activeSlotId);
    if (!isSuperAdmin && !distributionEnabled && !isSlotAvailable) {
      setScanFeedback({
        status: 'error',
        title: 'Distribution Deactivated',
        message: 'Normal admins can only register distribution logs once a Super Admin has made this category slot available in the Super Admin panel.'
      });
      setIsProcessing(false);
      return;
    }
    
    const formattedId = decodedText.trim().toUpperCase();

    // Block any 5-digit Event/Spot registration code immediately as they are not General/EC Members
    if (/^\d{5}$/.test(formattedId)) {
      setScanFeedback({
        status: 'error',
        title: 'Event-Only Ticket Code',
        message: `The 5-digit code "${formattedId}" is an Event-Only Participant ticket. Food distribution is strictly limited to verified General Members and EC Officers.`,
        memberId: formattedId
      });
      setIsProcessing(false);
      return;
    }

    try {
      // 1. Fetch matching member (try direct, JMC prefix, or suffix match)
      let member = null;
      
      const { data: exactMember, error: exactError } = await supabase
        .from('member')
        .select('id, full_name, verified, member_id, is_ec')
        .eq('member_id', formattedId)
        .maybeSingle();

      if (exactError) throw exactError;

      if (exactMember) {
        member = exactMember;
      } else {
        const prependedId = `JMC-${formattedId}`;
        const { data: prependedMember, error: prependedError } = await supabase
          .from('member')
          .select('id, full_name, verified, member_id, is_ec')
          .eq('member_id', prependedId)
          .maybeSingle();

        if (prependedError) throw prependedError;

        if (prependedMember) {
          member = prependedMember;
        } else if (formattedId.length >= 3) {
          const { data: suffixMatches, error: suffixError } = await supabase
            .from('member')
            .select('id, full_name, verified, member_id, is_ec')
            .ilike('member_id', `%${formattedId}`);

          if (suffixError) throw suffixError;

          if (suffixMatches && suffixMatches.length > 0) {
            const perfectSub = suffixMatches.find(m => m.member_id.endsWith(`-${formattedId}`));
            member = perfectSub || suffixMatches[0];
          }
        }
      }

      if (!member) {
        setLastScannedId(formattedId);
        setScanFeedback({
          status: 'error',
          title: 'Not Found',
          message: `The scanned ID "${formattedId}" does not exist in the client registry. Please confirm they have registered.`,
          memberId: formattedId
        });
        setIsProcessing(false);
        return;
      }

      // Block resolved 5-digit Event/Spot registration codes from redeeming food
      if (/^\d{5}$/.test(member.member_id || '')) {
        setScanFeedback({
          status: 'error',
          title: 'Event-Only Ticket Code',
          message: `${member.full_name} has an Event-Only Participant ticket. Food distribution is strictly limited to verified General Members and EC Officers.`,
          memberName: member.full_name,
          memberId: member.member_id
        });
        setIsProcessing(false);
        return;
      }

      // Set to fully resolved canonical member id so UI lists the complete full ID
      setLastScannedId(member.member_id);

      if (member.verified !== 'yes') {
        setScanFeedback({
          status: 'error',
          title: 'Unverified Member',
          message: `${member.full_name} has registered but their club membership is currently unverified. Manual authorization required.`,
          memberName: member.full_name,
          memberId: member.member_id
        });
        setIsProcessing(false);
        return;
      }

      // 2. Identify active slot configurations
      const currentSlot = slots.find(s => s.id === activeSlotId);
      if (!currentSlot) {
        setScanFeedback({
          status: 'error',
          title: 'No Active Slot',
          message: 'The active food distribution slot is invalid. Super admin must configure a valid food item.'
        });
        setIsProcessing(false);
        return;
      }

      // Check if EC member (defined by 3-digit member ID or database flag)
      const isEc = member.is_ec === true || /^\d{3}$/.test(member.member_id);

      // 3. Prevent duplicate scanning
      const existingScans = logs.filter(l => l.member_id === member.member_id && l.slot_id === activeSlotId);
      const totalScansInSlot = existingScans.length;

      if (totalScansInSlot >= currentSlot.max_servings) {
        const lastScan = existingScans[existingScans.length - 1];
        const localTime = lastScan ? new Date(lastScan.scanned_at).toLocaleTimeString() : 'Unknown';
        
        setScanFeedback({
          status: 'duplicate',
          title: 'Double Feeding Prevented',
          message: `Hold on! This member's QR ID has already claimed food for the "${currentSlot.name}" slot today. Scanning again is blocked to prevent double portions.`,
          memberName: member.full_name,
          memberId: member.member_id,
          isEc,
          servingNumber: totalScansInSlot,
          maxServings: currentSlot.max_servings,
          time: localTime
        });
        setIsProcessing(false);
        return;
      }

      // 4. Create new Scan Log
      const newLog: ScanLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
        member_id: member.member_id,
        full_name: member.full_name,
        slot_id: activeSlotId,
        scanned_at: new Date().toISOString(),
        scanned_by: user?.email || 'Admin',
        is_ec: isEc,
        serving_number: totalScansInSlot + 1
      };

      const updatedLogs = [newLog, ...logs];
      setLogs(updatedLogs);

      // Save to server
      await saveFoodState(slots, activeSlotId, updatedLogs);

      setScanFeedback({
        status: 'success',
        title: 'Portion Approved',
        message: `Successfully released food portion for the active slot "${currentSlot.name}". Pack distributed clean.`,
        memberName: member.full_name,
        memberId: member.member_id,
        isEc,
        servingNumber: newLog.serving_number,
        maxServings: currentSlot.max_servings
      });

    } catch (err: any) {
      console.error("Failed executing food distribution lookup:", err);
      setScanFeedback({
        status: 'error',
        title: 'Lookup Error',
        message: err.message || 'Connection crashed while analyzing state.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    handleScan(manualId);
    setManualId('');
  };

  // Add a new food item slot (Super Admin)
  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;
    
    const newId = newSlotName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    if (slots.some(s => s.id === newId)) {
      showToast("Food slot already exists", "error");
      return;
    }

    const newSlot: FoodSlot = {
      id: newId,
      name: newSlotName,
      max_servings: Math.max(1, newSlotMaxServings)
    };

    const updatedSlots = [...slots, newSlot];
    setSlots(updatedSlots);
    setNewSlotName('');
    setNewSlotMaxServings(1);

    await saveFoodState(updatedSlots, activeSlotId, logs);
    showToast(`Added food slot: ${newSlot.name}`, "success");
  };

  // Remove a food slot (Super Admin)
  const handleRemoveSlot = async (slotId: string) => {
    if (slots.length <= 1) {
      showToast("At least one food slot must remain active.", "error");
      return;
    }

    const updatedSlots = slots.filter(s => s.id !== slotId);
    
    // Adjust active slot if we removed it
    let nextActiveId = activeSlotId;
    if (activeSlotId === slotId) {
      nextActiveId = updatedSlots[0].id;
      setActiveSlotId(nextActiveId);
    }

    setSlots(updatedSlots);
    await saveFoodState(updatedSlots, nextActiveId, logs);
    showToast("Food distribution slot removed.", "info");
  };

  // Change active slot (Super Admin)
  const handleSetActiveSlot = async (slotId: string) => {
    setActiveSlotId(slotId);
    await saveFoodState(slots, slotId, logs);
  };

  // Reset entire day (Super Admin)
  const handleResetLogs = async () => {
    if (!window.confirm("Are you absolutely sure you want to clear/reset all scanned QR entries for today? This action cannot be undone and resets food claims for a new day.")) {
      return;
    }

    setLogs([]);
    await saveFoodState(slots, activeSlotId, []);
    showToast("Portions claims reset. Ready for a new day of scans!", "success");
  };

  // Counts
  const totalRegularScanned = logs.filter(l => l.slot_id === activeSlotId && !l.is_ec).length;
  const totalEcScanned = logs.filter(l => l.slot_id === activeSlotId && l.is_ec).length;

  const totalMembersCount = members.filter(m => !(m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id)))).length;
  const totalEcMembersCount = members.filter(m => m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id))).length;

  // Filter logs for the table
  const filteredLogs = logs.filter(l => {
    if (!logSearchQuery) return true;
    const query = logSearchQuery.toLowerCase();
    return (
      l.full_name?.toLowerCase().includes(query) ||
      l.member_id?.toLowerCase().includes(query) ||
      l.slot_id?.toLowerCase().includes(query) ||
      l.scanned_by?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header and Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
            <Utensils className="w-6 h-6 text-amber-500 animate-pulse" />
            Food Management Services
          </h2>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
            Distribute food packs, verify member QR integrity, and block double claims
          </p>
        </div>

        {/* Sync loading status */}
        <div className="flex items-center gap-3">
          {loading ? (
            <span className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-zinc-900 border border-white/5 px-4 py-2 rounded-xl">
              <RefreshCw className="w-3 h-3 text-amber-500 animate-spin" />
              Syncing Ledger
            </span>
          ) : (
            <button 
              onClick={fetchFoodData}
              className="flex items-center gap-2 text-[10px] text-zinc-400 hover:text-white font-bold uppercase tracking-wider bg-white/5 border border-white/10 hover:border-amber-500/30 px-4 py-2 rounded-xl transition-all"
            >
              <RefreshCw className="w-3 h-3 text-amber-500" />
              Refresh
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setActiveTab(activeTab === 'settings' ? 'scan' : 'settings')}
              className={`p-2.5 rounded-xl border transition-all ${activeTab === 'settings' ? 'bg-amber-500 border-amber-600 text-black shadow-lg shadow-amber-500/20' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'}`}
              title="Super Admin Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Dynamic Registered Totals */}
        <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest block">Total Club members</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <p className="text-2xl font-black text-white tracking-tight">{totalMembersCount}</p>
          <div className="text-[9px] text-zinc-650 font-medium uppercase tracking-wider">verified in database</div>
        </div>

        <div className="p-5 rounded-2xl bg-zinc-950/40 border border-white/5 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-amber-500/80 font-bold uppercase tracking-widest block">EC members</span>
            <Award className="w-4 h-4 text-amber-500/80" />
          </div>
          <p className="text-2xl font-black text-amber-500 tracking-tight">{totalEcMembersCount}</p>
          <div className="text-[9px] text-zinc-650 font-medium uppercase tracking-wider">unique 3-digit identifiers</div>
        </div>

        {/* Current Scan Metrics - General */}
        <div className="p-5 rounded-2xl bg-zinc-950/40 border border-zinc-800 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">General Claimed (Active Slot)</span>
            <Cookie className="w-4 h-4 text-zinc-400" />
          </div>
          <p className="text-2xl font-black text-white tracking-tight">
            {totalRegularScanned} <span className="text-xs font-semibold text-zinc-500">Regular</span>
          </p>
          <p className="text-[9px] text-green-500/80 font-bold uppercase tracking-wider">
            Slot: {slots.find(s => s.id === activeSlotId)?.name || 'None'}
          </p>
        </div>

        {/* Current Scan Metrics - EC */}
        <div className="p-5 rounded-2xl bg-zinc-950/40 border border-amber-500/10 space-y-2">
          <div className="flex justify-between items-start">
            <span className="text-[9px] text-amber-400 font-bold uppercase tracking-widest block">EC Claimed (Active Slot)</span>
            <Coffee className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-500 tracking-tight">
            {totalEcScanned} <span className="text-xs font-semibold text-amber-700">EC Users</span>
          </p>
          <p className="text-[9px] text-zinc-505 font-bold uppercase tracking-wider">
            Lim: {slots.find(s => s.id === activeSlotId)?.max_servings} serving(s) max
          </p>
        </div>
      </div>

      {activeTab === 'settings' && isSuperAdmin ? (
        /* Super Admin Configurations Section */
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-8"
        >
          <div className="space-y-1">
            <h3 className="text-sm font-black text-white uppercase tracking-widest text-amber-500">Food Schedule Settings</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Add or remove time slots, specify maximum serving times, or trigger ledger clearance</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Slot List */}
            <div className="space-y-4">
              <span className="text-[10.5px] font-black text-white uppercase tracking-widest block border-b border-white/5 pb-2">Active Slots Inventory</span>
              
              <div className="space-y-2.5">
                {slots.map(slot => (
                  <div 
                    key={slot.id} 
                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${slot.id === activeSlotId ? 'bg-amber-500/5 border-amber-500/35' : 'bg-white/5 border-white/5'}`}
                  >
                    <div>
                      <p className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                        {slot.name}
                        {slot.id === activeSlotId && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Active</span>}
                      </p>
                      <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                        Limit: {slot.max_servings} distribution claim(s)
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {slot.id !== activeSlotId && (
                        <button 
                          onClick={() => handleSetActiveSlot(slot.id)}
                          className="px-3 py-1.5 text-[9px] bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 font-black uppercase tracking-wider transition-all"
                        >
                          Activate
                        </button>
                      )}
                      
                      <button 
                        onClick={() => handleRemoveSlot(slot.id)}
                        className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all"
                        title="Delete slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Slot Creator Form */}
            <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
              <span className="text-[10.5px] font-black text-white uppercase tracking-widest block border-b border-white/5 pb-2">Add New Portions Slot</span>
              
              <form onSubmit={handleAddSlot} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Slot Name</label>
                  <input 
                    type="text"
                    required
                    value={newSlotName}
                    onChange={(e) => setNewSlotName(e.target.value)}
                    placeholder="e.g. BREAKFAST, DINNER"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-amber-500/50 transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Max Distributions allowable</label>
                    <input 
                      type="number"
                      required
                      min={1}
                      max={5}
                      value={newSlotMaxServings}
                      onChange={(e) => setNewSlotMaxServings(parseInt(e.target.value) || 1)}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  className="w-full py-3 bg-amber-500 border border-amber-600 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/5 flex items-center justify-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register Food Item Slot
                </button>
              </form>
            </div>
          </div>

          {/* Dangerous maintenance actions */}
          <div className="p-5 border border-red-900/40 bg-red-950/5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
                End of Day Operations
              </p>
              <p className="text-[9.5px] text-zinc-500 uppercase tracking-widest leading-loose max-w-xl">
                Clearing the logs will erase all food portion scans recorded for today. Normal admins will be able to scanning new QR codes of members again on a fresh session for the next day.
              </p>
            </div>
            <button 
              onClick={handleResetLogs}
              className="px-6 py-3 bg-red-600 border border-red-700 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center"
            >
              Clear portion claim logs & Reset Day
            </button>
          </div>
        </motion.div>
      ) : (
        /* Standard Admin Scanner Operations View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Active slot trigger panel */}
          <div className="lg:col-span-1 space-y-6">
            <div className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-6">
              <div>
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block mb-1">Active Portions Distribution Target</span>
                <h3 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-2.5">
                  <Cookie className="w-6 h-6 text-amber-500" />
                  {slots.find(s => s.id === activeSlotId)?.name || 'Default snacks'}
                </h3>
                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mt-1">
                  Claim restriction: Max {slots.find(s => s.id === activeSlotId)?.max_servings || 1} serving limit
                </p>
              </div>

              {/* Selector / Indicator list */}
              <div className="space-y-2">
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Available Slots Selection</span>
                <div className="grid grid-cols-1 gap-1.5">
                  {slots.map(s => {
                    const isAvailable = availableSlots.includes(s.id);
                    const canSelect = isSuperAdmin || isAvailable;
                    return (
                      <button 
                        key={s.id}
                        onClick={() => {
                          if (canSelect) {
                            setActiveSlotId(s.id);
                          }
                        }}
                        disabled={!canSelect}
                        className={`px-4 py-3 rounded-xl border text-left font-bold text-xs uppercase tracking-all flex items-center justify-between ${s.id === activeSlotId ? 'bg-amber-500/10 border-amber-500/30 text-white shadow-lg' : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'} ${!canSelect ? 'opacity-40 cursor-not-allowed' : ''}`}
                      >
                        <span className="flex items-center gap-2">
                          {s.name}
                          {isAvailable && !isSuperAdmin && (
                            <span className="text-[7.5px] bg-green-500/10 border border-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Available</span>
                          )}
                        </span>
                        <span className="text-[9px] opacity-60 font-mono">Max: {s.max_servings} serv</span>
                      </button>
                    );
                  })}
                </div>
                {!isSuperAdmin && (
                  <p className="text-[8.5px] text-zinc-650 uppercase tracking-wide text-center pt-1 font-semibold leading-normal">
                    (Select among the food slots made available by the Super Admin above)
                  </p>
                )}
              </div>

              {/* Lock Alert for Normal Admins */}
              {!distributionEnabled && !availableSlots.includes(activeSlotId) && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${isSuperAdmin ? 'bg-amber-500/5 border-amber-500/10 text-amber-500' : 'bg-red-500/5 border-red-500/10 text-red-500'}`}>
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-wider">
                      {isSuperAdmin ? 'Distribution Dormant (Super Override Active)' : 'Food Distribution Dormant'}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide leading-relaxed text-zinc-400">
                      {isSuperAdmin 
                        ? 'Distribution status is declared inactive for normal admins, but you possess super override privileges.' 
                        : 'Accidental claims are fully locked. This slot is currently deactivated. A Super Admin must make this slot available in the Super Admin panel to unlock scan access.'}
                    </p>
                  </div>
                </div>
              )}

              {/* Instant QR Reader Button */}
              <button 
                onClick={() => {
                  const isSlotAvailable = availableSlots.includes(activeSlotId);
                  if (!isSuperAdmin && !distributionEnabled && !isSlotAvailable) return;
                  setIsScannerOpen(true);
                }}
                disabled={!isSuperAdmin && !distributionEnabled && !availableSlots.includes(activeSlotId)}
                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest outline-none flex items-center justify-center gap-2.5 transition-all active:scale-95 shadow-md ${
                  (!isSuperAdmin && !distributionEnabled && !availableSlots.includes(activeSlotId))
                    ? 'bg-zinc-800 border border-white/5 text-zinc-500 cursor-not-allowed opacity-50' 
                    : 'bg-amber-500 hover:bg-amber-400 hover:shadow-lg hover:shadow-amber-500/15'
                }`}
              >
                <QrCode className="w-5 h-5" />
                Launch Camera QR Scanner
              </button>
 
              {/* Manual ID Input Fallback */}
              <div className="border-t border-white/5 pt-5 space-y-3 relative">
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest text-center">Manual QR ID Lookup Fallback</p>
                
                <form onSubmit={handleManualLookupSubmit} className="flex gap-2">
                  <input 
                    type="text"
                    required
                    disabled={!isSuperAdmin && !distributionEnabled && !availableSlots.includes(activeSlotId)}
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder={(!isSuperAdmin && !distributionEnabled && !availableSlots.includes(activeSlotId)) ? "DISTRIBUTION LOCKED" : "e.g. 054 or JMC-123456"}
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono font-bold text-xs uppercase focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-700 text-center disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                  <button 
                    type="submit"
                    disabled={!isSuperAdmin && !distributionEnabled && !availableSlots.includes(activeSlotId)}
                    className="px-5 py-3 bg-white/5 border border-white/10 hover:border-amber-500/30 text-white font-black text-[10px] uppercase tracking-widest rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Lookup
                  </button>
                </form>

                {/* Auto-suggest dropdown system */}
                {manualId.trim() !== '' && (
                  <div className="absolute z-[110] left-0 right-0 top-[100%] mt-2 bg-zinc-950/95 border border-white/10 rounded-xl shadow-2xl p-2 max-h-56 overflow-y-auto divide-y divide-white/5 backdrop-blur-xl">
                    <div className="flex items-center justify-between px-2 py-1.5 border-b border-white/5 mb-1 bg-white/[0.02]">
                      <span className="text-[8px] text-zinc-500 font-extrabold tracking-widest uppercase">Auto-Search Suggestions</span>
                      <span className="text-[7.5px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-mono font-bold">Matches: {matchingMembers.length}</span>
                    </div>
                    {matchingMembers.length === 0 ? (
                      <div className="p-4 text-[10px] text-zinc-500 text-center uppercase tracking-wider font-semibold">
                        No matches found
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1 max-h-44 overflow-y-auto">
                        {matchingMembers.map(m => {
                          const isEcMember = m.is_ec === true || (m.member_id && /^\d{3}$/.test(m.member_id));
                          return (
                            <button
                              key={m.id || m.member_id}
                              type="button"
                              onClick={() => {
                                handleScan(m.member_id);
                                setManualId('');
                              }}
                              className="w-full text-left p-2.5 hover:bg-white/5 transition-all flex flex-col gap-0.5 rounded-lg active:scale-98 group"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[10.5px] font-black text-white uppercase truncate group-hover:text-amber-400 transition-colors">
                                  {m.full_name}
                                </span>
                                {isEcMember ? (
                                  <span className="text-[7.5px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0">
                                    EC
                                  </span>
                                ) : (
                                  <span className="text-[7.5px] bg-sky-500/10 border border-sky-500/20 text-sky-450 px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0">
                                    General
                                  </span>
                                )}
                              </div>
                              <span className="text-[9.5px] font-mono font-bold text-zinc-400 tracking-wider">
                                {m.member_id}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Distribute list and history board */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest block">Distributed Ledger</span>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">Scanned logs lists across all categories for today</p>
              </div>

              {/* Search Bar */}
              <div className="relative w-48 shrink-0">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input 
                  type="text"
                  value={logSearchQuery}
                  onChange={(e) => setLogSearchQuery(e.target.value)}
                  placeholder="SEARCH SCAN"
                  className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-bold text-[10px] uppercase focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-650"
                />
              </div>
            </div>

            {/* Logs list panel */}
            <div className="rounded-2xl border border-white/5 bg-zinc-950/20 overflow-hidden">
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse font-sans">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/5">
                      <th className="p-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Recipient</th>
                      <th className="p-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Unique ID</th>
                      <th className="p-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Category</th>
                      <th className="p-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02] text-[10.5px]">
                    {filteredLogs.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-zinc-500 uppercase tracking-widest font-bold text-[9px] shrink-0">
                          (Any scanned distribution entries will display here in real time)
                        </td>
                      </tr>
                    ) : (
                      filteredLogs.map(log => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-color">
                          <td className="p-3 font-bold text-white uppercase tracking-wide flex items-center gap-2">
                            {log.full_name}
                            {log.is_ec && (
                              <span className="text-[7.5px] bg-amber-500/10 border border-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded font-black tracking-widest uppercase shrink-0">
                                EC MEM
                              </span>
                            )}
                          </td>
                          <td className="p-3 font-mono font-bold text-zinc-400 select-all">{log.member_id}</td>
                          <td className="p-3 font-bold uppercase text-zinc-500 tracking-wider">
                            {slots.find(s => s.id === log.slot_id)?.name || log.slot_id}
                          </td>
                          <td className="p-3 font-mono text-zinc-500 font-semibold">{new Date(log.scanned_at).toLocaleTimeString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* QR CAMERA SCAN PROCESSOR WINDOW OVERLAY */}
      {isScannerOpen && (
        <QRScanner 
          onScan={(decoded) => {
            setIsScannerOpen(false);
            handleScan(decoded);
          }}
          onClose={() => setIsScannerOpen(false)}
          lastScannedId={lastScannedId}
          isProcessing={isProcessing}
        />
      )}

      {/* DETAILED DOUBLE PORTION CLAIM PREVENTION VERBATIM DISPLAY */}
      <AnimatePresence>
        {scanFeedback && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="relative w-full max-w-lg glass-card p-8 border text-center font-display space-y-6"
              style={{
                borderColor: scanFeedback.status === 'success' ? '#22c55e30' : scanFeedback.status === 'duplicate' ? '#ef444440' : '#eab30830'
              }}
            >
              
              {/* Animated Top Hexagon HUD Indicator */}
              <div className="flex justify-center">
                {scanFeedback.status === 'success' ? (
                  <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center text-green-500 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                ) : scanFeedback.status === 'duplicate' ? (
                  <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/20 flex items-center justify-center text-red-500 animate-pulse">
                    <AlertTriangle className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center text-amber-500">
                    <XCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              {/* Primary Feedback Headline */}
              <div className="space-y-2">
                <span className={`text-[10px] font-black uppercase tracking-[0.3em] block ${scanFeedback.status === 'success' ? 'text-green-500' : 'text-red-500'}`}>
                  System Response • {scanFeedback.status === 'success' ? 'Approved' : 'Scan Blocked'}
                </span>
                <h3 className="text-3xl font-black text-white tracking-tight leading-none uppercase">
                  {scanFeedback.title}
                </h3>
              </div>

              {/* Claimer Profile HUD Metadata */}
              {scanFeedback.memberName && (
                <div className="p-5 rounded-2xl bg-white/[0.01] border border-white/5 space-y-1 inline-block min-w-[280px]">
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Recipient</p>
                  <p className="text-lg font-black text-white uppercase tracking-wide flex items-center justify-center gap-2">
                    {scanFeedback.memberName}
                    {scanFeedback.isEc && (
                      <span className="text-[7px] bg-amber-500 text-black px-1 rounded font-black tracking-widest uppercase">
                        EC
                      </span>
                    )}
                  </p>
                  <code className="text-xs font-mono font-bold text-zinc-400 block">{scanFeedback.memberId}</code>
                </div>
              )}

              {/* Duplicate feeding metadata logs */}
              {scanFeedback.status === 'duplicate' && scanFeedback.time && (
                <div className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-left text-xs text-red-400 space-y-1 max-w-md mx-auto">
                  <p className="font-bold flex items-center gap-2 uppercase tracking-wider text-[9.5px]">
                    <Clock className="w-3.5 h-3.5" />
                    Prior Serving Claim Logged:
                  </p>
                  <p className="text-[10.5px] leading-relaxed text-zinc-400 uppercase">
                    First Portion collected today at <span className="font-mono text-white font-bold">{scanFeedback.time}</span>. 
                    Re-scanning is blocked. Current quota: <span className="font-bold text-white">{scanFeedback.servingNumber}/{scanFeedback.maxServings} portion claim allowed</span>.
                  </p>
                </div>
              )}

              {/* Status prompt description */}
              <p className="text-xs text-zinc-400 leading-normal max-w-sm mx-auto uppercase tracking-wide font-medium">
                {scanFeedback.message}
              </p>

              {/* Re-enable distribution gesture buttons */}
              <div className="pt-4 flex justify-center gap-4">
                {scanFeedback.status === 'success' && (
                  <button 
                    onClick={() => {
                      setScanFeedback(null);
                      setIsScannerOpen(true); // Quickly continuous scanning
                    }}
                    className="px-8 py-3.5 bg-green-600 hover:bg-green-500 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-green-500/10 flex items-center gap-2 active:scale-95"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan Next QR Code
                  </button>
                )}

                <button 
                  onClick={() => setScanFeedback(null)}
                  className="px-8 py-3.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-[10px] uppercase tracking-widest rounded-xl transition-all"
                >
                  Close Window
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
