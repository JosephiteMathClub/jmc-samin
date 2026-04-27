"use client";
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Search, 
  Plus, 
  Trash2, 
  Award, 
  UserPlus, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  ChevronRight,
  Filter,
  Medal,
  Star,
  Zap,
  BookOpen,
  QrCode,
  Keyboard,
  ArrowLeft,
  Calendar,
  Upload,
  FileSpreadsheet
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { useContent } from '../../context/ContentContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';
import { DashboardFormField } from './DashboardFormField';
import { Skeleton } from '../Skeleton';
import ConfirmModal from '../ConfirmModal';
import dynamic from 'next/dynamic';

const QRScanner = dynamic(() => import('./QRScanner'), { ssr: false });

const CATEGORIES = ['Primary', 'Junior', 'Secondary', 'Higher Secondary'];

export const EventParticipation = () => {
  const { content } = useContent();
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('Junior');
  const [participations, setParticipations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const bulkUploadRef = useRef<HTMLInputElement>(null);

  // Event Mode States
  const eventMode = content?.site?.eventMode || false;
  const [viewMode, setViewMode] = useState<'select' | 'options' | 'manual' | 'scan'>('select');
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  
  // Modal for deletion
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, distinctUsers: 0 });

  // Load events from content
  useEffect(() => {
    if (content?.events?.events) {
      setEvents(content.events.events);
      if (content.events.events.length > 0 && !activeEvent) {
        setActiveEvent(content.events.events[0].title);
      }
    }
  }, [content, activeEvent]);

  // Fetch participations for current selection
  const fetchParticipations = useCallback(async () => {
    if (!activeEvent || !isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select('*')
        .eq('event_name', activeEvent)
        .eq('category', activeCategory);
      
      if (error) throw error;
      setParticipations(data || []);
      
      // Update stats for the whole event
      const { data: eventData, error: eventError } = await supabase
        .from('event_participation')
        .select('member_id')
        .eq('event_name', activeEvent);
      
      if (!eventError && eventData) {
        const unique = new Set(eventData.map(p => p.member_id));
        setStats({
          total: eventData.length,
          distinctUsers: unique.size
        });
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [activeEvent, activeCategory, showToast]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  const addParticipantByMemberId = async (mId: string) => {
    const formattedId = mId.trim().toUpperCase();
    if (!formattedId || !activeEvent || !activeCategory) return;
    
    try {
      // 1. Check if member exists
      const { data: member, error: memberError } = await supabase
        .from('member')
        .select('id, full_name, verified, member_id')
        .eq('member_id', formattedId)
        .maybeSingle();
      
      if (memberError) throw memberError;
      if (!member) {
        throw new Error(`Member with ID ${formattedId} not found.`);
      }
      if (member.verified !== 'yes') {
        throw new Error(`Member ${member.full_name} is not verified yet.`);
      }

      // 2. Check if already participating in THIS event and category
      const { data: existing, error: checkError } = await supabase
        .from('event_participation')
        .select('id')
        .eq('member_id', member.member_id)
        .eq('event_name', activeEvent)
        .eq('category', activeCategory)
        .maybeSingle();

      if (checkError) throw checkError;
      if (existing) {
        throw new Error(`Member ${member.full_name} is already participating in this specific category.`);
      }

      // 3. Add to participation
      const { error: insertError } = await supabase
        .from('event_participation')
        .insert({
          member_id: formattedId,
          event_name: activeEvent,
          category: activeCategory
        });
      
      if (insertError) throw insertError;

      showToast(`Added ${member.full_name} to ${activeEvent} (${activeCategory})`, 'success');
      fetchParticipations();
      return true;
    } catch (err: any) {
      showToast(err.message, 'error');
      return false;
    }
  };

  const handleAddParticipant = async () => {
    setAddingMember(true);
    const success = await addParticipantByMemberId(memberIdInput);
    if (success) {
      setMemberIdInput('');
    }
    setAddingMember(false);
  };

  const handleBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeEvent || !activeCategory) return;
    
    setIsBulkUploading(true);
    showToast("Starting bulk upload...", "info");
    
    try {
      const text = await file.text();
      // Split by newline, comma, or semicolon and filter out empty strings
      const ids = text.split(/[\r\n,;]+/).map(id => id.trim().toUpperCase()).filter(id => id && id.startsWith('JMC-'));
      
      if (ids.length === 0) {
        throw new Error("No valid JMC IDs found in the file.");
      }
      
      showToast(`Processing ${ids.length} entries...`, "info");
      
      let successCount = 0;
      let failCount = 0;
      const errors: string[] = [];

      for (const id of ids) {
        try {
          const success = await addParticipantByMemberId(id);
          if (success) successCount++;
          else failCount++;
        } catch (err: any) {
          failCount++;
          errors.push(`${id}: ${err.message}`);
        }
      }

      if (successCount > 0) {
        showToast(`Successfully added ${successCount} participants!`, "success");
        fetchParticipations();
      }
      if (failCount > 0) {
        showToast(`${failCount} entries failed. Check console for details.`, "error");
        console.error("Bulk upload errors:", errors);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsBulkUploading(false);
      if (bulkUploadRef.current) bulkUploadRef.current.value = '';
    }
  };

  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannedCooldownRef = useRef<{ [key: string]: number }>({});

  const handleQRScan = async (decodedText: string) => {
    if (isScanning) return;
    
    let scannedId = '';
    try {
      const data = JSON.parse(decodedText);
      scannedId = data.id || '';
    } catch (err) {
      scannedId = decodedText.trim().toUpperCase();
    }

    if (!scannedId) return;

    // Cooldown check (3 seconds per ID) to prevent spamming the same ID
    const now = Date.now();
    if (scannedCooldownRef.current[scannedId] && now - scannedCooldownRef.current[scannedId] < 3000) {
      return;
    }
    
    scannedCooldownRef.current[scannedId] = now;
    setLastScannedId(scannedId);
    setIsScanning(true);
    
    try {
      await addParticipantByMemberId(scannedId);
    } finally {
      // Small pause before allowing the next scan to ensure DB update and toast visibility
      setTimeout(() => {
        setIsScanning(false);
      }, 500);
    }
  };

  const updatePosition = async (participationId: string, position: number | null) => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .update({ position })
        .eq('id', participationId);
      
      if (error) throw error;
      
      setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, position } : p));
      showToast("Position updated successfully", "success");
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const removeParticipant = async (id: string) => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('event_participation')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      setParticipations(prev => prev.filter(p => p.id !== id));
      showToast("Participant removed", "success");
      setDeleteId(null);
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredParticipations = React.useMemo(() => {
    return participations.filter(p => 
      p.member_id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [participations, searchTerm]);

  const winners = React.useMemo(() => {
    return {
      first: participations.find(p => p.position === 1),
      second: participations.find(p => p.position === 2),
      third: participations.find(p => p.position === 3)
    };
  }, [participations]);

  return (
    <div className="space-y-12">
      {eventMode ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                <Zap className="w-8 h-8 text-amber-500" />
                Live Event Mode
              </h2>
              <p className="text-xs text-zinc-500 font-medium">Streamlined participation tracking for on-ground events.</p>
            </div>
            {viewMode !== 'select' && (
              <button 
                onClick={() => setViewMode('select')}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" /> Change Event/Category
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === 'select' ? (
              <motion.div 
                key="select"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/20 rounded-lg text-amber-500">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Step 1: Select Event</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {events.map((ev) => (
                      <button
                        key={ev.title}
                        onClick={() => setActiveEvent(ev.title)}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all border ${
                          activeEvent === ev.title 
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' 
                          : 'bg-white/5 text-zinc-500 border-transparent hover:border-white/10 hover:text-zinc-300'
                        }`}
                      >
                        {ev.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-500">
                      <Filter className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">Step 2: Select Category</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all border ${
                          activeCategory === cat
                          ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                          : 'bg-white/5 text-zinc-500 border-transparent hover:border-white/10 hover:text-zinc-300'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button 
                      onClick={() => setViewMode('options')}
                      disabled={!activeEvent || !activeCategory}
                      className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      Continue to Deployment <ChevronRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === 'options' ? (
              <motion.div 
                key="options"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <button 
                  onClick={() => setViewMode('manual')}
                  className="glass-card group p-12 text-center space-y-6 hover:border-amber-500/50 transition-all border-dashed border-2"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-amber-500 group-hover:text-black transition-all">
                    <Keyboard className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">Manual Entry</h3>
                    <p className="text-xs text-zinc-500 mt-2">Type in member Unique IDs one by one.</p>
                  </div>
                </button>

                <button 
                  onClick={() => {
                    setViewMode('scan');
                    setIsQRScannerOpen(true);
                  }}
                  className="glass-card group p-12 text-center space-y-6 hover:border-indigo-500/50 transition-all border-dashed border-2"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">QR ID Scanner</h3>
                    <p className="text-xs text-zinc-500 mt-2">Continuously scan profile QR codes to add members automatically.</p>
                  </div>
                </button>
              </motion.div>
            ) : (
                <motion.div 
                key="active-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-8"
              >
                <div className="p-6 rounded-[32px] bg-white/[0.02] border border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ">Active Session</p>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{activeEvent} <span className="text-zinc-600 mx-2">/</span> <span className="text-indigo-400">{activeCategory}</span></h3>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                      <button 
                        onClick={() => setViewMode('manual')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                          viewMode === 'manual' 
                          ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                          : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <Keyboard className="w-3.5 h-3.5" /> Manual
                      </button>
                      <button 
                        onClick={() => {
                          setViewMode('scan');
                          setIsQRScannerOpen(true);
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                          viewMode === 'scan' 
                          ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' 
                          : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" /> Scanner
                      </button>
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="file" 
                        ref={bulkUploadRef}
                        onChange={handleBulkUpload}
                        accept=".csv,.txt"
                        className="hidden"
                      />
                      <button 
                        onClick={() => bulkUploadRef.current?.click()}
                        disabled={isBulkUploading}
                        className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
                      >
                        {isBulkUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        {isBulkUploading ? "Uploading..." : "Bulk Upload"}
                      </button>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Entries</p>
                      <p className="text-lg font-black text-white">{participations.length}</p>
                    </div>
                  </div>
                </div>

                {viewMode === 'manual' && (
                  <div className="glass-card p-8 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1">
                      <DashboardFormField label="Member Unique ID" description="Type ID and press Add">
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input
                            type="text"
                            value={memberIdInput}
                            onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddParticipant()}
                            placeholder="JMC-123456"
                            autoFocus
                            className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono"
                          />
                        </div>
                      </DashboardFormField>
                    </div>
                    <DashboardButton 
                      onClick={handleAddParticipant}
                      label={addingMember ? "Adding..." : "Add Member"}
                      disabled={addingMember || !memberIdInput.trim()}
                      icon={addingMember ? Loader2 : Plus}
                      className="h-[60px]"
                    />
                  </div>
                )}

                {viewMode === 'scan' && (
                  <div className="glass-card p-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
                      <QrCode className="w-12 h-12 text-indigo-400" />
                      <div className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-400/50 animate-ping opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">QR Scanner Active</h4>
                      <p className="text-zinc-500 text-xs max-w-xs mx-auto">The scanner is running in the background. Position member IDs in front of the camera.</p>
                    </div>
                    <div className="flex justify-center gap-4 pt-4">
                      <button 
                        onClick={() => setIsQRScannerOpen(true)}
                        className="px-8 py-3 rounded-xl bg-indigo-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-indigo-400 transition-all"
                      >
                        Re-open Scanner Frame
                      </button>
                    </div>
                  </div>
                )}

                {/* Participant Table (Mini Version for Event Mode) */}
                <div className="overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01]">
                  <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Live Participant List</h4>
                    <Search className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {participations.length === 0 ? (
                          <tr>
                            <td className="px-8 py-16 text-center text-zinc-600 italic text-sm">No entries recorded yet.</td>
                          </tr>
                        ) : (
                          [...participations].reverse().map((p) => (
                            <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </div>
                                  <code className="text-sm text-white font-mono">{p.member_id}</code>
                                </div>
                              </td>
                              <td className="px-8 py-4 text-right">
                                <button 
                                  onClick={() => setDeleteId(p.id)}
                                  className="p-2.5 bg-red-500/5 text-red-500 rounded-lg hover:bg-red-500/20 transition-all opacity-40 hover:opacity-100"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <DashboardSection 
          title="Event Participation Management" 
          description="Manage participation and assign leaderboard for all club events."
          icon={Trophy}
        >
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Events Sidebar */}
          <div className="lg:w-72 flex flex-col gap-2">
            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-4">Select Event</h4>
            {events.map((ev) => (
              <button
                key={ev.title}
                onClick={() => setActiveEvent(ev.title)}
                className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold transition-all text-left ${
                  activeEvent === ev.title 
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                  : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="truncate">{ev.title}</span>
                {activeEvent === ev.title && <ChevronRight className="w-4 h-4 ml-auto" />}
              </button>
            ))}
          </div>

          {/* Categories and Participants */}
          <div className="flex-1 space-y-8">
            <div className="p-2 bg-white/5 rounded-2xl flex flex-wrap gap-1">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeCategory === cat
                    ? 'bg-amber-500 text-black shadow-lg'
                    : 'text-zinc-500 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="p-6 rounded-3xl bg-amber-500/5 border border-amber-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">Total Entries</p>
                    <p className="text-2xl font-black text-white">{stats.total}</p>
                  </div>
                  <Users className="w-10 h-10 text-amber-500/20" />
               </div>
               <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Unique Users</p>
                    <p className="text-2xl font-black text-white">{stats.distinctUsers}</p>
                  </div>
                  <Award className="w-10 h-10 text-indigo-400/20" />
               </div>
            </div>

            {/* Add Participant Input */}
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1">
                <DashboardFormField label="Member Unique ID" description="Enter the JMC-XXXXXX code to add a participant">
                  <div className="relative">
                    <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                    <input
                      type="text"
                      value={memberIdInput}
                      onChange={(e) => setMemberIdInput(e.target.value.toUpperCase())}
                      placeholder="JMC-123456"
                      className="w-full pl-12 pr-6 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono"
                    />
                  </div>
                </DashboardFormField>
              </div>
              <div className="flex gap-2 h-[54px]">
                <DashboardButton 
                  onClick={handleAddParticipant}
                  label={addingMember ? "Adding..." : "Add Participant"}
                  disabled={addingMember || !memberIdInput.trim() || !activeEvent}
                  icon={addingMember ? Loader2 : Plus}
                  className="flex-1"
                />
                
                <input 
                  type="file" 
                  ref={bulkUploadRef}
                  onChange={handleBulkUpload}
                  accept=".csv,.txt"
                  className="hidden"
                />
                <button 
                  onClick={() => bulkUploadRef.current?.click()}
                  disabled={isBulkUploading || !activeEvent}
                  className="h-full px-6 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                  title="Bulk Upload CSV"
                >
                  {isBulkUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                  {isBulkUploading ? "..." : "Bulk"}
                </button>
              </div>
            </div>

            {/* List Search and Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Participant List</h4>
                <div className="relative w-full max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by Unique ID..."
                    className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all font-mono"
                  />
                </div>
              </div>

              {/* Participant Table */}
              <div className="overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Participant ID</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Position</th>
                      <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i}>
                          <td className="px-8 py-6"><Skeleton className="h-4 w-32" /></td>
                          <td className="px-8 py-6"><Skeleton className="h-8 w-40 rounded-xl" /></td>
                          <td className="px-8 py-6 text-right"><Skeleton className="h-8 w-24 rounded-xl ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredParticipations.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                          {searchTerm ? `No participants found matching "${searchTerm}"` : `No participants yet in this category for ${activeEvent}.`}
                        </td>
                      </tr>
                    ) : (
                      filteredParticipations.map((p) => (
                        <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-8 py-6">
                            <code className="text-xs text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                              {p.member_id}
                            </code>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-2">
                              <select 
                                value={p.position || ""}
                                onChange={(e) => updatePosition(p.id, e.target.value ? parseInt(e.target.value) : null)}
                                className="bg-black/40 text-amber-400 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-amber-500/50"
                              >
                                <option value="" className="bg-zinc-900 text-zinc-500 italic">No Position</option>
                                <option value="1" className="bg-zinc-900 text-amber-500 font-bold">1st Position (Gold)</option>
                                <option value="2" className="bg-zinc-900 text-zinc-300 font-bold">2nd Position (Silver)</option>
                                <option value="3" className="bg-zinc-900 text-amber-700 font-bold">3rd Position (Bronze)</option>
                              </select>
                              {p.position === 1 && <Medal className="w-4 h-4 text-amber-400" />}
                              {p.position === 2 && <Star className="w-4 h-4 text-zinc-400" />}
                              {p.position === 3 && <Zap className="w-4 h-4 text-amber-800" />}
                            </div>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <button 
                              onClick={() => setDeleteId(p.id)}
                              className="p-3 bg-red-500/5 text-red-500 rounded-xl hover:bg-red-500/20 transition-all opacity-40 hover:opacity-100"
                              title="Remove Participant"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leaderboard Summary Visual */}
            <div className="p-8 rounded-[40px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/10">
              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-amber-500 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                  <Medal className="w-6 h-6 text-black" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-wider">Current Leaderboard</h3>
                  <p className="text-xs text-zinc-500 font-medium">{activeEvent} - {activeCategory}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map(pos => {
                  const winner = pos === 1 ? winners.first : pos === 2 ? winners.second : winners.third;
                  const colors = pos === 1 ? 'text-amber-500' : pos === 2 ? 'text-zinc-400' : 'text-amber-800';
                  return (
                    <div key={pos} className={`p-6 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden group`}>
                      <div className={`absolute top-0 left-0 w-1 h-full ${pos === 1 ? 'bg-amber-500' : pos === 2 ? 'bg-zinc-400' : 'bg-amber-800'}`} />
                      <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${colors}`}>
                        {pos === 1 ? 'First' : pos === 2 ? 'Second' : 'Third'} Position
                      </p>
                      <p className="text-lg font-mono font-black text-white">
                        {winner?.member_id || '---'}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </DashboardSection>
      )}

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Remove Participant"
        message="Are you sure you want to remove this participant? This will clear their record from this event and category."
        onConfirm={() => deleteId && removeParticipant(deleteId)}
        onCancel={() => !isDeleting && setDeleteId(null)}
        confirmLabel={isDeleting ? "Removing..." : "Remove"}
        type="danger"
        disabled={isDeleting}
      />

      {isQRScannerOpen && (
        <QRScanner 
          onScan={(data) => {
            handleQRScan(data);
          }} 
          onClose={() => setIsQRScannerOpen(false)} 
          lastScannedId={lastScannedId}
          isProcessing={isScanning}
        />
      )}
    </div>
  );
};
