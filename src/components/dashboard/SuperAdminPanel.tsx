"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Database, 
  Shield, 
  Award, 
  Trash2, 
  Search, 
  Loader2, 
  ChevronRight,
  DatabaseZap,
  Activity,
  AlertCircle,
  Plus,
  ShieldAlert,
  Mail,
  CheckCircle2,
  XCircle,
  Utensils,
  Lock,
  Unlock,
  Volume2,
  QrCode,
  Printer
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';
import { DashboardFormField } from './DashboardFormField';
import { SupportManagement } from './SupportManagement';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const QRCode = dynamic(() => import('../QRCode'), { ssr: false });

export const SuperAdminPanel = () => {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'database' | 'positions' | 'support' | 'email' | 'food' | 'cards'>('users');
  
  // Member ID Cards state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [printLayout, setPrintLayout] = useState<'single' | 'grid2x2'>('grid2x2');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [activePdfMember, setActivePdfMember] = useState<any | null>(null);
  
  // Food distribution management state
  const [foodConfig, setFoodConfig] = useState<any>(null);
  const [loadingFoodConfig, setLoadingFoodConfig] = useState(false);
  const [savingFoodConfig, setSavingFoodConfig] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotMaxServings, setNewSlotMaxServings] = useState(1);

  // Email state
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [loadingEmailConfig, setLoadingEmailConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Database Explorer state
  const [tables] = useState(['profiles', 'member', 'event_participation', 'site_content', 'support_tickets']);
  const [selectedTable, setSelectedTable] = useState('profiles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Position Management state
  const [participations, setParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  const fetchEmailConfig = useCallback(async () => {
    setLoadingEmailConfig(true);
    try {
      const res = await fetch('/api/admin/check-email-config');
      const data = await res.json();
      setEmailConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmailConfig(false);
    }
  }, []);

  const testEmail = async () => {
    setTestingEmail(true);
    showToast('Sending test email...', 'info');
    try {
      const res = await fetch('/api/debug-email');
      const data = await res.json();
      if (res.ok) {
        showToast('Test email sent! Check l47idkpro@gmail.com', 'success');
      } else {
        throw new Error(data.details?.message || data.error || 'Failed to send test email');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchTableData = useCallback(async (tableName: string) => {
    setLoadingTable(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);
      
      if (error) throw error;
      setTableData(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingTable(false);
    }
  }, [showToast]);

  const fetchParticipations = useCallback(async () => {
    setLoadingParticipations(true);
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select(`
          *,
          member (
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setParticipations(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingParticipations(false);
    }
  }, [showToast]);

  const fetchFoodConfig = useCallback(async () => {
    setLoadingFoodConfig(true);
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 'food_management')
        .maybeSingle();

      if (error) throw error;
      if (data && data.data) {
        setFoodConfig(data.data);
      } else {
        const defaultPayload = {
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
        setFoodConfig(defaultPayload);
      }
    } catch (err: any) {
      console.error("Error fetching food config in SuperAdminPanel:", err);
      showToast(err.message || "Failed to load food config", "error");
    } finally {
      setLoadingFoodConfig(false);
    }
  }, [showToast]);

  const updateFoodDistributionStatus = async (enabled: boolean) => {
    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks'
          }),
          distribution_enabled: enabled
        },
        logs: foodConfig?.logs || []
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast(
        enabled 
          ? "Food distribution has been successfully ANNOUNCED. Normal admins can now scan and distribute food." 
          : "Food distribution has been STOPPED. Normal admins are now blocked from scanning.",
        "success"
      );
    } catch (err: any) {
      console.error("Error updating food config in SuperAdminPanel:", err);
      showToast(err.message || "Failed to save food config status", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleSetActiveSlot = async (slotId: string) => {
    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ]
          }),
          active_slot_id: slotId
        }
      };
      
      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Changed active portions distribution category target", "success");
    } catch (err: any) {
      console.error("Error setting active slot:", err);
      showToast(err.message || "Failed to change active portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const toggleSlotAvailability = async (slotId: string) => {
    setSavingFoodConfig(true);
    try {
      const currentAvailable = foodConfig?.settings?.available_slots || [];
      const updatedAvailable = currentAvailable.includes(slotId)
        ? currentAvailable.filter((id: string) => id !== slotId)
        : [...currentAvailable, slotId];

      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks',
            distribution_enabled: false
          }),
          available_slots: updatedAvailable
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast(
        updatedAvailable.includes(slotId)
          ? "Slot is now available to normal admins."
          : "Slot is now hidden/unavailable to normal admins.",
        "success"
      );
    } catch (err: any) {
      console.error("Error toggling slot availability:", err);
      showToast(err.message || "Failed to toggle slot availability", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;

    const newId = newSlotName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingSlots = foodConfig?.settings?.slots || [
      { id: 'snacks', name: 'Snacks', max_servings: 1 },
      { id: 'lunch', name: 'Lunch', max_servings: 1 },
      { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
    ];

    if (existingSlots.some((s: any) => s.id === newId)) {
      showToast("Portion slot already exists", "error");
      return;
    }

    const newSlot = {
      id: newId,
      name: newSlotName,
      max_servings: Math.max(1, newSlotMaxServings)
    };

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            active_slot_id: newId,
            distribution_enabled: false
          }),
          slots: [...existingSlots, newSlot]
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      setNewSlotName('');
      setNewSlotMaxServings(1);
      showToast(`Added portion slot: ${newSlot.name}`, "success");
    } catch (err: any) {
      console.error("Error adding slot:", err);
      showToast(err.message || "Failed to add portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    const existingSlots = foodConfig?.settings?.slots || [];
    if (existingSlots.length <= 1) {
      showToast("At least one food slot must remain active.", "error");
      return;
    }

    const updatedSlots = existingSlots.filter((s: any) => s.id !== slotId);
    let nextActiveId = foodConfig?.settings?.active_slot_id;
    if (nextActiveId === slotId) {
      nextActiveId = updatedSlots[0].id;
    }

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {}),
          slots: updatedSlots,
          active_slot_id: nextActiveId
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Portion distribution slot removed.", "info");
    } catch (err: any) {
      console.error("Error removing slot:", err);
      showToast(err.message || "Failed to remove portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleResetLogs = async () => {
    if (!window.confirm("Are you absolutely sure you want to clear/reset all scanned QR entries for today? This action cannot be undone and resets food claims for a new day.")) {
      return;
    }

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        logs: []
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Portions claims reset. Ready for a new day of scans!", "success");
    } catch (err: any) {
      console.error("Error resetting logs:", err);
      showToast(err.message || "Failed to reset scan logs", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const fetchVerifiedMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const { data, error } = await supabase
        .from('member')
        .select('*')
        .eq('verified', 'yes')
        .order('full_name');
      
      if (error) throw error;
      setMembers(data || []);
      
      // Initially select all verified members for printing
      const initialSelection: Record<string, boolean> = {};
      (data || []).forEach((m: any) => {
        initialSelection[m.id] = true;
      });
      setSelectedMembers(initialSelection);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch verified members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  }, [showToast]);

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const generateBulkPdf = async () => {
    const selectedList = members.filter(m => selectedMembers[m.id]);
    if (selectedList.length === 0) {
      showToast('Please select at least one member to generate PDF', 'error');
      return;
    }

    setGeneratingPdf(true);
    setPdfProgress(0);
    showToast(`Initializing PDF engine for ${selectedList.length} members...`, 'info');

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const total = selectedList.length;
      const images: string[] = [];

      for (let i = 0; i < total; i++) {
        const member = selectedList[i];
        setActivePdfMember(member);
        
        // Brief pause to allow the single DOM capture node to fully paint
        await new Promise((resolve) => setTimeout(resolve, 80));
        
        const node = document.getElementById('pdf-sandbox-card');
        if (!node) {
          throw new Error('PDF Sandbox card node not found in DOM.');
        }

        const dataUrl = await toPng(node, {
          pixelRatio: 2, // Double DPI factor for unpixelated high-resolution output
          skipFonts: false,
          cacheBust: true,
        });

        images.push(dataUrl);
        setPdfProgress(Math.round(((i + 1) / total) * 100));
      }

      // Hide the template sandbox immediately
      setActivePdfMember(null);

      // Create PDF and place 4 dynamic ID cards in a 2x2 grid per page
      const pdf = new jsPDF('p', 'mm', 'a4');
      const cardsPerPage = 4;
      const chunks = chunkArray(images, cardsPerPage);

      for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage();
        }

        const chunk = chunks[pageIdx];
        
        for (let cardIdx = 0; cardIdx < chunk.length; cardIdx++) {
          const imgData = chunk[cardIdx];
          
          let x = 10;
          let y = 6.25;

          if (cardIdx === 1) { // Top Right
            x = 115;
          } else if (cardIdx === 2) { // Bottom Left
            y = 154.75;
          } else if (cardIdx === 3) { // Bottom Right
            x = 115;
            y = 154.75;
          }

          pdf.addImage(imgData, 'PNG', x, y, 85, 136, undefined, 'FAST');
        }
      }

      pdf.save(`st-joseph-math-club-id-cards-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Printers-ready bulk 2x2 grid PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      showToast(err.message || 'Error occurred during PDF generation', 'error');
    } finally {
      setGeneratingPdf(false);
      setActivePdfMember(null);
      setPdfProgress(0);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') fetchUsers();
    if (activeSubTab === 'database') fetchTableData(selectedTable);
    if (activeSubTab === 'positions') fetchParticipations();
    if (activeSubTab === 'email') fetchEmailConfig();
    if (activeSubTab === 'food') fetchFoodConfig();
    if (activeSubTab === 'cards') fetchVerifiedMembers();
  }, [activeSubTab, selectedTable, fetchUsers, fetchTableData, fetchParticipations, fetchEmailConfig, fetchFoodConfig, fetchVerifiedMembers]);

  const updateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setPromoting(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPromoting(null);
    }
  };

  const updatePosition = async (participationId: string, position: string) => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .update({ position: position })
        .eq('id', participationId);
      
      if (error) throw error;
      
      setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, position } : p));
      showToast('Position updated', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteRow = async (tableName: string, rowId: any) => {
    if (!window.confirm('Are you sure you want to delete this row? This action is irreversible.')) return;
    try {
      // Handle different ID types (id for UUID, or specific key for site_content)
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idKey, rowId);
      
      if (error) throw error;
      
      setTableData(prev => prev.filter(row => row[idKey] !== rowId));
      showToast('Row deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const editRow = async (tableName: string, row: any) => {
    const field = window.prompt(`Enter column name to edit (Available: ${Object.keys(row).join(', ')}):`);
    if (!field || !row[field]) return;
    
    const newValue = window.prompt(`Enter new value for "${field}" (Current: ${row[field]}):`);
    if (newValue === null) return;

    try {
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const updates = { [field]: newValue };
      
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idKey, row[idKey]);
      
      if (error) throw error;
      
      setTableData(prev => prev.map(r => r[idKey] === row[idKey] ? { ...r, ...updates } : r));
      showToast('Row updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const addRow = async (tableName: string) => {
    const dataStr = window.prompt('Enter JSON object for new row (e.g. {"email": "test@example.com", "full_name": "Test User"}):');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const { error } = await supabase
        .from(tableName)
        .insert(data);
      
      if (error) throw error;
      
      fetchTableData(tableName);
      showToast('Row added successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Sub-tabs header */}
      <div className="flex flex-wrap gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Admin Management', icon: Shield },
          { id: 'positions', label: 'Event Positions', icon: Award },
          { id: 'support', label: 'Support Issues', icon: ShieldAlert },
          { id: 'email', label: 'Email Status', icon: Mail },
          { id: 'food', label: 'Food Management', icon: Utensils },
          { id: 'cards', label: 'Member ID Cards', icon: QrCode },
          { id: 'database', label: 'Database Explorer', icon: DatabaseZap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Admin Permissions" 
              description="Promote or demote users to normal admin roles."
              icon={Shield}
              actions={
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-64"
                  />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">User</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Role</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={3} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                {u.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{u.full_name}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-500' :
                              u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-zinc-500/10 text-zinc-500'
                            }`}>
                               {/* Hardcode super admin for UI clarity if needed */}
                               {u.email === 'l47idkpro@gmail.com' ? 'SUPER ADMIN' : u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             {/* Only allow modifying if not the specific super admin email */}
                            {u.email !== 'l47idkpro@gmail.com' ? (
                              <DashboardButton 
                                label={promoting === u.id ? "Updating..." : (u.role === 'admin' ? "Demote to Member" : "Promote to Admin")}
                                onClick={() => updateUserRole(u.id, u.role)}
                                disabled={promoting !== null}
                                variant={u.role === 'admin' ? 'secondary' : 'primary'}
                                className="h-8 text-[9px] px-3"
                                icon={promoting === u.id ? Loader2 : UserCheck}
                              />
                            ) : (
                              <span className="text-[9px] text-zinc-700 font-bold uppercase">Restricted</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'positions' && (
          <motion.div
            key="positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Event Winners & Positions" 
              description="Assign titles, ranks, or positions to members who participated in events."
              icon={Award}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Member</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Event</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Category</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Position</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingParticipations ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : participations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-600 text-xs italic">No participation records found.</td>
                      </tr>
                    ) : (
                      participations.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <p className="text-xs font-bold text-white">{p.member?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-zinc-600 font-mono">{p.member_id}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-zinc-400">{p.event_name || 'Unknown'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{p.category}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.position ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-500'
                            }`}>
                              {p.position || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-2">
                               {['Champion', 'Runner Up', '3rd Place'].map(pos => (
                                 <button
                                   key={pos}
                                   onClick={() => updatePosition(p.id, pos)}
                                   className={`px-2 py-1 border rounded-lg text-[8px] font-bold transition-all uppercase ${
                                     p.position === pos 
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30'
                                   }`}
                                 >
                                   {pos}
                                 </button>
                               ))}
                               <input 
                                 type="text" 
                                 placeholder="Custom..."
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     updatePosition(p.id, (e.target as HTMLInputElement).value);
                                     (e.target as HTMLInputElement).value = '';
                                   }
                                 }}
                                 className="w-20 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] text-white outline-none focus:border-amber-500/30 transition-all"
                               />
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SupportManagement />
          </motion.div>
        )}

        {activeSubTab === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Email System Health" 
              description="Monitor SMTP and API configurations. Ensure reliable communication."
              icon={Mail}
              actions={
                <DashboardButton 
                  label={testingEmail ? "Sending..." : "Send Test Email"} 
                  onClick={testEmail}
                  disabled={testingEmail}
                  icon={testingEmail ? Loader2 : Mail}
                  variant="primary"
                  className="h-9 px-4 text-[10px]"
                />
              }
            >
              {loadingEmailConfig ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : emailConfig ? (
                <div className="space-y-8">
                  <div className={`p-6 rounded-3xl border ${emailConfig.is_api_mode ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                     <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${emailConfig.is_api_mode ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                          {emailConfig.is_api_mode ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                            {emailConfig.is_api_mode ? 'API Mode Active' : 'SMTP Mode (Prone to IP Issues)'}
                          </h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{emailConfig.recommendation}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Brevo API Key', status: emailConfig.BREVO_API_KEY, env: 'BREVO_API_KEY' },
                      { label: 'SMTP Pass/Key', status: emailConfig.SMTP_PASS, env: 'SMTP_PASS' },
                      { label: 'Sender Email', status: emailConfig.SMTP_FROM_EMAIL, env: 'SMTP_FROM_EMAIL', val: emailConfig.current_from_email },
                      { label: 'SMTP User', status: emailConfig.SMTP_USER, env: 'SMTP_USER' }
                    ].map((item, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-xs font-mono text-zinc-400">{item.env}</p>
                          {item.val && <p className="text-[10px] text-amber-500/60 mt-1">{item.val}</p>}
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${item.status ? 'text-green-500' : 'text-red-500'}`}>
                          {item.status ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status ? 'Configured' : 'Missing'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                       <Shield className="w-4 h-4" />
                       How to Fix permanently
                    </h4>
                    <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed uppercase tracking-wider">
                      <p>1. Go to Brevo Dashbord &gt; Settings &gt; SMTP &amp; API.</p>
                      <p>2. Generate a new <strong className="text-white">API Key</strong> (V3).</p>
                      <p>3. Set <strong className="text-white">BREVO_API_KEY</strong> environment variable in your host settings.</p>
                      <p>4. Go to Brevo &gt; Senders &gt; Domains and ensure <strong className="text-white">{emailConfig.current_from_email.split('@')[1]}</strong> is verified.</p>
                      <p>5. In Brevo &gt; Settings &gt; Security &gt; Authorized IPs, <strong className="text-red-500">REMOVE</strong> all IP addresses if using SMTP.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'food' && (
          <motion.div
            key="food"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Food Distribution Control" 
              description="Announce start of food distribution and manage permission overrides for normal admins."
              icon={Utensils}
            >
              {loadingFoodConfig ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Current Active Status Showcase */}
                  <div className={`p-6 rounded-3xl border ${foodConfig?.settings?.distribution_enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${foodConfig?.settings?.distribution_enabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                          {foodConfig?.settings?.distribution_enabled ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                            Distribution Status: {foodConfig?.settings?.distribution_enabled ? 'ANNOUNCED & ACTIVE' : 'LOCKED / DEACTIVATED'}
                          </h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                            {foodConfig?.settings?.distribution_enabled 
                              ? 'Normal admins are allowed to open the scanner to distribute food portions.' 
                              : 'Normal admins are strictly blocked from scanning QR codes or accessing the manual portion register.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => updateFoodDistributionStatus(!foodConfig?.settings?.distribution_enabled)}
                        disabled={savingFoodConfig}
                        className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                          foodConfig?.settings?.distribution_enabled 
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/10' 
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/10'
                        } ${savingFoodConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {savingFoodConfig && <Loader2 className="w-4 h-4 animate-spin" />}
                        {foodConfig?.settings?.distribution_enabled ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Stop Distribution
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Announce Start
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Informational Guidelines Card */}
                  <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                    <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      About Food Distribution Announcement
                    </h4>
                    <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed uppercase tracking-wider">
                      <p>1. <strong className="text-white">Announcing the start</strong> of food distribution switches the live setting to active across the application instantly.</p>
                      <p>2. Normal admins can access the <strong className="text-white">Food Management Tab</strong> to capture student profile QR codes using live camera access.</p>
                      <p>3. If the event breaks or concludes, click <strong className="text-white">Stop Distribution</strong>. This instantly shuts down and locks normal admin inputs, preventing unexpected, accidental, or duplicate claims.</p>
                      <p>4. Super admins retain the absolute authority to override scan records even when the distribution status is locked.</p>
                    </div>
                  </div>

                  {/* Settings and Slots Configuration Panel */}
                  <div className="border-t border-white/5 pt-8 space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest text-amber-500">Food Schedule & Portion Settings</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Configure food portion slots, adjust distribution claim limits, or reset the daily claim registry logs.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Slots List */}
                      <div className="space-y-4">
                        <span className="text-[10.5px] font-black text-white uppercase tracking-widest block border-b border-white/5 pb-2">Active Slots Inventory</span>
                        
                        <div className="space-y-2.5">
                          {(foodConfig?.settings?.slots || [
                            { id: 'snacks', name: 'Snacks', max_servings: 1 },
                            { id: 'lunch', name: 'Lunch', max_servings: 1 },
                            { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
                          ]).map((slot: any) => {
                            const isAvailable = (foodConfig?.settings?.available_slots !== undefined)
                              ? (foodConfig?.settings?.available_slots || []).includes(slot.id)
                              : true;

                            return (
                              <div 
                                key={slot.id} 
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${slot.id === (foodConfig?.settings?.active_slot_id || 'snacks') ? 'bg-amber-500/5 border-amber-500/35' : 'bg-white/5 border-white/5'}`}
                              >
                                <div>
                                  <p className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                    {slot.name}
                                    {slot.id === (foodConfig?.settings?.active_slot_id || 'snacks') && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Active Target</span>}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">
                                    Limit: {slot.max_servings} distribution claim(s)
                                  </p>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded text-[8px] font-black tracking-widest uppercase border ${
                                    isAvailable 
                                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                                  }`}>
                                    {isAvailable ? 'Available to Admins' : 'Locked for Admins'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleSlotAvailability(slot.id)}
                                    disabled={savingFoodConfig}
                                    className={`px-3 py-1.5 text-[9px] rounded-lg font-black uppercase tracking-wider transition-all border ${
                                      isAvailable 
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' 
                                        : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850'
                                    }`}
                                    title="Toggle availability for normal admins"
                                  >
                                    {isAvailable ? 'Revoke Access' : 'Allow Access'}
                                  </button>

                                  {slot.id !== (foodConfig?.settings?.active_slot_id || 'snacks') && (
                                    <button 
                                      onClick={() => handleSetActiveSlot(slot.id)}
                                      disabled={savingFoodConfig}
                                      className="px-3 py-1.5 text-[9px] bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                      Activate
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleRemoveSlot(slot.id)}
                                    disabled={savingFoodConfig}
                                    className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all disabled:opacity-50"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
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
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Max Allowable Distributions</label>
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

                          <button 
                            type="submit"
                            disabled={savingFoodConfig}
                            className="w-full py-3 bg-amber-500 border border-amber-600 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/5 flex items-center justify-center gap-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Register Food Item Slot
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Dangerous maintenance actions */}
                    <div className="p-5 border border-red-900/40 bg-red-950/5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">
                      <div>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          End of Day Operations
                        </p>
                        <p className="text-[9.5px] text-zinc-500 uppercase tracking-widest leading-loose max-w-xl">
                          Clearing the logs will erase all food portion scans recorded for today. Normal admins will be able to scanning new QR codes of members again on a fresh session for the next day.
                        </p>
                      </div>
                      <button 
                        onClick={handleResetLogs}
                        disabled={savingFoodConfig}
                        className="px-6 py-3 bg-red-600 border border-red-700 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center disabled:opacity-50"
                      >
                        Clear portion claim logs & Reset Day
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'database' && (
          <motion.div
            key="database"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Database Explorer" 
              description="Directly view and monitor database records. Critical operations only."
              icon={DatabaseZap}
              actions={
                <div className="flex items-center gap-3">
                  <DashboardButton 
                    label="Add Row" 
                    onClick={() => addRow(selectedTable)}
                    icon={Plus}
                    className="h-9 px-4 text-[10px]"
                    variant="secondary"
                  />
                  <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500/30 uppercase tracking-widest cursor-pointer"
                  >
                    {tables.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
              }
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-500 font-medium leading-relaxed uppercase tracking-widest">
                  Direct database manipulation can cause site-wide instability. Any deletion here will affect live users.
                </p>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                {loadingTable ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-white/5">
                        {tableData.length > 0 && Object.keys(tableData[0]).slice(0, 6).map(key => (
                          <th key={key} className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">{key}</th>
                        ))}
                        <th className="py-4 px-6 w-24 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          {Object.entries(row).slice(0, 6).map(([key, val]: any, j) => (
                            <td key={j} className="py-4 px-6 overflow-hidden truncate whitespace-nowrap text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors" title={String(val)}>
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-1">
                               <button 
                                 onClick={() => editRow(selectedTable, row)}
                                 className="p-2 text-zinc-600 hover:text-amber-500 transition-colors"
                                 title="Edit row"
                               >
                                 <Plus className="w-3.5 h-3.5 rotate-45" />
                               </button>
                               <button 
                                 onClick={() => deleteRow(selectedTable, row.id || row.email || row.member_id)}
                                 className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                 title="Delete row"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {tableData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-zinc-600 text-xs italic">Table is empty.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Verified Member ID Cards" 
              description="View, verify, and generate printable multi-page print sheets of all verified members' ID cards. Highly optimized for saving as a PDF file."
              icon={QrCode}
              actions={
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search verified members..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const allSelected = members.every(m => selectedMembers[m.id]);
                      const nextSelection: Record<string, boolean> = {};
                      members.forEach(m => {
                        nextSelection[m.id] = !allSelected;
                      });
                      setSelectedMembers(nextSelection);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-heavy text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    {members.every(m => selectedMembers[m.id]) ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={() => {
                      const noneSelected = !Object.values(selectedMembers).some(Boolean);
                      if (noneSelected) {
                        showToast('Please select at least one member to print', 'error');
                        return;
                      }
                      window.print();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heavy text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 text-center"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Selected ({Object.values(selectedMembers).filter(Boolean).length})
                  </button>
                </div>
              }
            >
              {loadingMembers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Print and PDF Generation Configuration Dashboard */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Print Layout & PDF Output Settings
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Select single-page formats or an A4-optimized 2x2 grid. Zero margin-of-error page splitting.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto">
                        <button
                          onClick={() => setPrintLayout('grid2x2')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            printLayout === 'grid2x2' 
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          2x2 Grid (A4)
                        </button>
                        <button
                          onClick={() => setPrintLayout('single')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            printLayout === 'single' 
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          1 Card / Page
                        </button>
                      </div>

                      <button
                        onClick={generateBulkPdf}
                        disabled={generatingPdf}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] font-black text-white uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all ${
                          generatingPdf 
                            ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/15'
                        }`}
                      >
                        {generatingPdf ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                            Rendering ({pdfProgress}%)
                          </>
                        ) : (
                          <>
                            <Database className="w-3.5 h-3.5 text-purple-300" />
                            Download 2x2 PDF
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Grid list of members */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members
                      .filter(m => 
                        m.full_name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.member_id?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.email?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.class?.toLowerCase().includes(memberSearchTerm.toLowerCase())
                      )
                      .map((m) => {
                        const isSelected = !!selectedMembers[m.id];
                        return (
                          <div 
                            key={m.id}
                            onClick={() => {
                              setSelectedMembers(prev => ({
                                ...prev,
                                [m.id]: !prev[m.id]
                              }));
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Selection Indicator */}
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-amber-500 border-amber-500 text-black' 
                                  : 'border-zinc-700 hover:border-white'
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>

                              {/* Member basic info */}
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{m.full_name}</p>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-1">{m.member_id}</p>
                                <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-semibold">
                                  <span>C: {m.class}</span>
                                  <span>•</span>
                                  <span>S: {m.section}</span>
                                  <span>•</span>
                                  <span>R: {m.roll}</span>
                                </div>
                              </div>
                            </div>

                            {/* Little Badge info */}
                            <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {m.is_ec ? 'EC' : 'General'}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {members.length === 0 && (
                    <div className="text-center py-20 text-zinc-550 text-xs italic">
                      No verified club members found. Verified members will appear here.
                    </div>
                  )}
                </div>
              )}
            </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="print-container-portal hidden print:block bg-transparent text-white">
          {printLayout === 'grid2x2' ? (
            chunkArray(members.filter(m => selectedMembers[m.id]), 4).map((chunk, pageIdx) => (
              <div 
                key={pageIdx} 
                className="print-page-grid-2x2"
              >
                {chunk.map((m) => {
                  const isEc = !!m.is_ec;
                  const brandingColor = isEc ? '#F59E0B' : '#8475FF';
                  
                  return (
                    <div 
                      key={m.id} 
                      className="print-grid-cell"
                    >
                      <div 
                        className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center id-card-print-node-scaled"
                        style={{
                          borderColor: `${brandingColor}66`,
                          boxShadow: 'none',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        } as any}
                      >
                        {/* Blank Background Template Image */}
                        <Image 
                          src="/images/id-card-bg.png" 
                          alt="ID Card Background" 
                          fill
                          className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                          referrerPolicy="no-referrer" 
                        />

                        {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                          
                          {/* QR Code */}
                          <div 
                            className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                            style={{
                              top: '353px',
                              left: '182px',
                              width: '274px',
                              height: '274px',
                              padding: '17px',
                              boxShadow: 'none'
                            }}
                          >
                            <QRCode 
                              value={JSON.stringify({
                                name: m.full_name,
                                id: m.member_id,
                                class: m.class,
                                section: m.section,
                                roll: m.roll,
                                role: isEc ? 'EC Officer' : 'General Member',
                                is_ec: isEc,
                                v: '1.0'
                              })}
                              size={240}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          {/* Name */}
                          <div 
                            className="absolute flex items-center justify-start pointer-events-auto"
                            style={{
                              top: '825px',
                              left: '186px',
                              width: '390px',
                              height: '32px',
                            }}
                          >
                            <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                              (m.full_name || "").length > 20 
                                ? 'text-[15px]' 
                                : (m.full_name || "").length > 15 
                                  ? 'text-[17px]' 
                                  : 'text-[20px]'
                            }`}>
                              {m.full_name || "—"}
                            </span>
                          </div>

                          {/* Class */}
                          <div 
                            className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                            style={{
                              top: '880px',
                              left: '150px',
                              width: '80px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                              {m.class || "—"}
                            </span>
                          </div>

                          {/* Section */}
                          <div 
                            className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                            style={{
                              top: '880px',
                              left: '390px',
                              width: '60px',
                              height: '24px',
                            }}
                          >
                             <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                              (m.section || "").length > 5
                                ? 'text-[12px] tracking-tight'
                                : 'text-[16px]'
                            }`}>
                              {m.section || "—"}
                            </span>
                          </div>

                          {/* Roll */}
                          <div 
                            className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                            style={{
                              top: '880px',
                              left: '544px',
                              width: '50px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                              {m.roll || "—"}
                            </span>
                          </div>

                          {/* ID No */}
                          <div 
                            className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                            style={{
                              top: '940px',
                              left: '213px',
                              width: '260px',
                              height: '24px',
                            }}
                          >
                            <span className={`text-white font-black tracking-widest leading-none select-all ${
                              (m.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                            }`}>
                              {m.member_id || "—"}
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            members
              .filter(m => selectedMembers[m.id])
              .map((m) => {
              const isEc = !!m.is_ec;
              const brandingColor = isEc ? '#F59E0B' : '#8475FF';
              
              return (
                <div 
                  key={m.id} 
                  className="print-page-wrapper"
                  style={{ 
                    pageBreakAfter: 'always', 
                    breakAfter: 'page',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    width: '100%',
                    height: '100vh',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent'
                  }}
                >
                  <div 
                    className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center id-card-print-node-scaled"
                    style={{
                      borderColor: `${brandingColor}66`,
                      boxShadow: '0 0 60px rgba(58, 31, 241, 0.35)',
                      transform: 'scale(0.62)',
                      transformOrigin: 'center center',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    } as any}
                  >
                    {/* Blank Background Template Image */}
                    <Image 
                      src="/images/id-card-bg.png" 
                      alt="ID Card Background" 
                      fill
                      className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                      referrerPolicy="no-referrer" 
                    />

                    {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      
                          {/* QR Code */}
                          <div 
                            className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                            style={{
                              top: '353px',
                              left: '182px',
                              width: '274px',
                              height: '274px',
                              padding: '17px',
                              boxShadow: isEc ? '0 0 40px rgba(245, 158, 11, 0.25)' : '0 0 40px rgba(58, 31, 241, 0.25)'
                            }}
                          >
                            <QRCode 
                              value={JSON.stringify({
                                name: m.full_name,
                                id: m.member_id,
                                class: m.class,
                                section: m.section,
                                roll: m.roll,
                                role: isEc ? 'EC Officer' : 'General Member',
                                is_ec: isEc,
                                v: '1.0'
                              })}
                              size={240}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          {/* Name */}
                          <div 
                            className="absolute flex items-center justify-start pointer-events-auto"
                            style={{
                              top: '825px',
                              left: '186px',
                              width: '390px',
                              height: '32px',
                            }}
                          >
                            <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                              (m.full_name || "").length > 20 
                                ? 'text-[15px]' 
                                : (m.full_name || "").length > 15 
                                  ? 'text-[17px]' 
                                  : 'text-[20px]'
                            }`}>
                              {m.full_name || "—"}
                            </span>
                          </div>

                          {/* Class */}
                          <div 
                            className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                            style={{
                              top: '880px',
                              left: '150px',
                              width: '80px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                              {m.class || "—"}
                            </span>
                          </div>

                          {/* Section */}
                          <div 
                            className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                            style={{
                              top: '880px',
                              left: '390px',
                              width: '60px',
                              height: '24px',
                            }}
                          >
                             <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                               (m.section || "").length > 5
                                 ? 'text-[12px] tracking-tight'
                                 : 'text-[16px]'
                             }`}>
                               {m.section || "—"}
                             </span>
                          </div>

                      {/* Roll */}
                      <div 
                        className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                        style={{
                          top: '880px',
                          left: '544px',
                          width: '50px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                          {m.roll || "—"}
                        </span>
                      </div>

                      {/* ID No */}
                      <div 
                        className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                        style={{
                          top: '940px',
                          left: '213px',
                          width: '260px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-white font-black tracking-widest leading-none select-all ${
                          (m.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                        }`}>
                          {m.member_id || "—"}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}

      {/* Dynamic offscreen sandbox card for programmatic PDF exports */}
      {activePdfMember && (
        <div 
          id="pdf-sandbox-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '638px',
            height: '1012px',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
        >
          <div 
            id="pdf-sandbox-card"
            className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center"
            style={{
              borderColor: activePdfMember.is_ec ? '#F59E0B66' : '#8475FF66',
              boxShadow: 'none',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            <Image 
              src="/images/id-card-bg.png" 
              alt="ID Card Background" 
              fill
              className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 z-10 pointer-events-none">
              
              {/* QR Code */}
              <div 
                className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                style={{
                  top: '353px',
                  left: '182px',
                  width: '274px',
                  height: '274px',
                  padding: '17px',
                  boxShadow: activePdfMember.is_ec ? '0 0 40px rgba(245, 158, 11, 0.25)' : '0 0 40px rgba(58, 31, 241, 0.25)'
                }}
              >
                <QRCode 
                  value={JSON.stringify({
                    name: activePdfMember.full_name,
                    id: activePdfMember.member_id,
                    class: activePdfMember.class,
                    section: activePdfMember.section,
                    roll: activePdfMember.roll,
                    role: activePdfMember.is_ec ? 'EC Officer' : 'General Member',
                    is_ec: !!activePdfMember.is_ec,
                    v: '1.0'
                  })}
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Name */}
              <div 
                className="absolute flex items-center justify-start pointer-events-auto"
                style={{
                  top: '825px',
                  left: '186px',
                  width: '390px',
                  height: '32px',
                }}
              >
                <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                  (activePdfMember.full_name || "").length > 20 
                    ? 'text-[15px]' 
                    : (activePdfMember.full_name || "").length > 15 
                      ? 'text-[17px]' 
                      : 'text-[20px]'
                }`}>
                  {activePdfMember.full_name || "—"}
                </span>
              </div>

              {/* Class */}
              <div 
                className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                style={{
                  top: '880px',
                  left: '150px',
                  width: '80px',
                  height: '24px',
                }}
              >
                <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                  {activePdfMember.class || "—"}
                </span>
              </div>

              {/* Section */}
              <div 
                className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                style={{
                  top: '880px',
                  left: '390px',
                  width: '60px',
                  height: '24px',
                }}
              >
                 <span className={`text-[#ffffff] font-black leading-none truncate tracking-wide select-all uppercase ${
                  (activePdfMember.section || "").length > 5
                    ? 'text-[12px] tracking-tight'
                    : 'text-[16px]'
                }`}>
                  {activePdfMember.section || "—"}
                </span>
              </div>

              {/* Roll */}
              <div 
                className="absolute flex items-center justify-center text-left pointer-events-auto font-extrabold"
                style={{
                  top: '880px',
                  left: '544px',
                  width: '50px',
                  height: '24px',
                }}
              >
                <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                  {activePdfMember.roll || "—"}
                </span>
              </div>

              {/* ID No */}
              <div 
                className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                style={{
                  top: '940px',
                  left: '213px',
                  width: '260px',
                  height: '24px',
                }}
              >
                <span className={`text-white font-black tracking-widest leading-none select-all ${
                  (activePdfMember.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                }`}>
                  {activePdfMember.member_id || "—"}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};
