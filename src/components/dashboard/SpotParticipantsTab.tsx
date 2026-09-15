'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Ticket,
  Search,
  RefreshCw,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  XCircle,
  Users,
  Shield,
  Phone,
  Mail,
  School,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Eye,
  Loader2,
  ExternalLink,
  Plus,
  X,
  Sparkles,
  QrCode,
  DollarSign
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PurchaseSlipModal } from './PurchaseSlipModal';

export interface SpotParticipant {
  id: string;
  ticket_id: string;
  user_id?: string | null;
  full_name: string;
  email: string;
  phone: string;
  academic_class?: string;
  section?: string;
  roll?: string;
  school?: string;
  category?: string;
  selected_events?: string;
  is_team?: boolean;
  team_name?: string | null;
  team_members?: any[] | null;
  amount?: number;
  trxnid?: string;
  payment_method?: string;
  verified?: string;
  verified_by?: string;
  verified_by_name?: string;
  verified_by_email?: string | null;
  validated?: boolean;
  validated_at?: string | null;
  validated_by?: string | null;
  snacks_collected?: boolean;
  certificate_collected?: boolean;
  souvenir_collected?: boolean;
  academic_year?: string;
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

interface SpotParticipantsTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isSuperAdmin: boolean;
}

export function SpotParticipantsTab({ showToast, isSuperAdmin }: SpotParticipantsTabProps) {
  const [participants, setParticipants] = useState<SpotParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableExists, setTableExists] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all'); // all, solo, team
  const [validationFilter, setValidationFilter] = useState('all'); // all, validated, pending

  // Edit modal state
  const [editingParticipant, setEditingParticipant] = useState<SpotParticipant | null>(null);
  const [editForm, setEditForm] = useState<Partial<SpotParticipant>>({});
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete modal state
  const [deletingParticipant, setDeletingParticipant] = useState<SpotParticipant | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View Slip Modal state
  const [viewingCandidate, setViewingCandidate] = useState<any | null>(null);

  // Copy helper
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Fetch participants
  const fetchParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/spot-participants');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch spot participants');
      }
      setParticipants(data.records || []);
      setTableExists(data.tableExists !== false);
    } catch (err: any) {
      console.error('Error fetching spot participants:', err);
      showToast(err.message || 'Error loading on-spot participants', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  // Copy text helper
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text}`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter participants
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches =
          (p.full_name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.phone || '').includes(q) ||
          (p.ticket_id || '').toLowerCase().includes(q) ||
          (p.school || '').toLowerCase().includes(q) ||
          (p.trxnid || '').toLowerCase().includes(q) ||
          (p.academic_class || '').toLowerCase().includes(q) ||
          (p.roll || '').toLowerCase().includes(q) ||
          (p.team_name || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category
      if (categoryFilter !== 'all' && (p.category || 'Secondary') !== categoryFilter) {
        return false;
      }

      // Type (solo or team)
      if (typeFilter === 'solo' && p.is_team) return false;
      if (typeFilter === 'team' && !p.is_team) return false;

      // Validation
      if (validationFilter === 'validated' && !p.validated) return false;
      if (validationFilter === 'pending' && p.validated) return false;

      return true;
    });
  }, [participants, searchTerm, categoryFilter, typeFilter, validationFilter]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalRevenue = 0;
    let teamCount = 0;
    let soloCount = 0;
    let validatedCount = 0;

    participants.forEach(p => {
      totalRevenue += Number(p.amount || 0);
      if (p.is_team) teamCount++;
      else soloCount++;
      if (p.validated) validatedCount++;
    });

    return {
      total: participants.length,
      revenue: totalRevenue,
      teamCount,
      soloCount,
      validatedCount
    };
  }, [participants]);

  // Open Edit Modal
  const handleOpenEdit = (p: SpotParticipant) => {
    setEditingParticipant(p);
    setEditForm({
      ...p,
      team_members: Array.isArray(p.team_members) ? JSON.parse(JSON.stringify(p.team_members)) : []
    });
  };

  // Save Edit
  const handleSaveEdit = async () => {
    if (!editingParticipant) return;
    if (!editForm.full_name?.trim() || !editForm.email?.trim()) {
      showToast('Participant full name and email are mandatory.', 'error');
      return;
    }

    setSavingEdit(true);
    try {
      const res = await fetch('/api/admin/spot-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_participant',
          id: editingParticipant.id,
          ticket_id: editingParticipant.ticket_id,
          ...editForm
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update participant');
      }

      showToast(data.message || 'Participant info updated successfully.', 'success');
      setEditingParticipant(null);
      fetchParticipants();
    } catch (err: any) {
      showToast(err.message || 'Error updating participant', 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete
  const handleDelete = async () => {
    if (!deletingParticipant) return;
    setIsDeleting(true);
    try {
      const res = await fetch('/api/admin/spot-participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_participant',
          id: deletingParticipant.id,
          ticket_id: deletingParticipant.ticket_id,
          email: deletingParticipant.email,
          trxnid: deletingParticipant.trxnid,
          fullName: deletingParticipant.full_name
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete on-spot participant');
      }

      showToast(data.message || 'Participant deleted successfully.', 'success');
      setDeletingParticipant(null);
      fetchParticipants();
    } catch (err: any) {
      showToast(err.message || 'Error deleting participant', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export to Excel (.xlsx)
  const exportToExcel = () => {
    if (filteredParticipants.length === 0) {
      showToast('No participants to export', 'error');
      return;
    }

    try {
      const rows = filteredParticipants.map((p, idx) => {
        let teamRoster = 'N/A';
        if (p.is_team && Array.isArray(p.team_members) && p.team_members.length > 0) {
          teamRoster = p.team_members.map((m: any, mIdx: number) => {
            const name = m.name || m.fullName || `Member ${mIdx + 1}`;
            const roll = m.roll ? `(Roll: ${m.roll})` : '';
            const phone = m.phone ? `[Ph: ${m.phone}]` : '';
            return `${name} ${roll} ${phone}`.trim();
          }).join('; ');
        }

        return {
          'SL': idx + 1,
          'Ticket ID': p.ticket_id,
          'Participant Name': p.full_name,
          'Email': p.email,
          'Phone': p.phone,
          'School / College': p.school || 'St. Joseph Higher Secondary School',
          'Class': p.academic_class || 'N/A',
          'Section': p.section || 'N/A',
          'Roll': p.roll || 'Spot Reg',
          'Category': p.category || 'Secondary',
          'Selected Events': p.selected_events || '',
          'Registration Type': p.is_team ? 'Team' : 'Individual',
          'Team Name': p.team_name || 'N/A',
          'Team Members Roster': teamRoster,
          'Amount Paid (BDT)': p.amount || 0,
          'Transaction ID': p.trxnid || '',
          'Verified Status': p.verified || 'yes',
          'Verified By Admin': p.verified_by_name || p.verified_by || 'Admin Desk',
          'Admin Email': p.verified_by_email || '',
          'Gate Validated': p.validated ? 'Yes' : 'No',
          'Snacks Collected': p.snacks_collected ? 'Yes' : 'No',
          'Certificate Collected': p.certificate_collected ? 'Yes' : 'No',
          'Souvenir Collected': p.souvenir_collected ? 'Yes' : 'No',
          'Registration Date': p.created_at ? new Date(p.created_at).toLocaleString() : ''
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'OnSpot_Participants');
      XLSX.writeFile(workbook, `OnSpot_Participants_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('Exported On-Spot participants to Excel!', 'success');
    } catch (err: any) {
      console.error('Excel Export error:', err);
      showToast('Failed to export Excel file', 'error');
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    if (filteredParticipants.length === 0) {
      showToast('No participants to export', 'error');
      return;
    }

    const headers = [
      'Ticket ID',
      'Name',
      'Email',
      'Phone',
      'Institution',
      'Class',
      'Section',
      'Roll',
      'Category',
      'Selected Events',
      'Type',
      'Team Name',
      'Team Members',
      'Amount BDT',
      'Trxn ID',
      'Verified By',
      'Gate Validated',
      'Registration Date'
    ];

    const csvRows = filteredParticipants.map(p => {
      let teamRoster = '';
      if (p.is_team && Array.isArray(p.team_members)) {
        teamRoster = p.team_members.map(m => m.name || m.fullName).filter(Boolean).join('; ');
      }

      return [
        `"${p.ticket_id}"`,
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        `"${p.phone || ''}"`,
        `"${(p.school || '').replace(/"/g, '""')}"`,
        `"${p.academic_class || ''}"`,
        `"${p.section || ''}"`,
        `"${p.roll || ''}"`,
        `"${p.category || ''}"`,
        `"${(p.selected_events || '').replace(/"/g, '""')}"`,
        `"${p.is_team ? 'Team' : 'Individual'}"`,
        `"${(p.team_name || '').replace(/"/g, '""')}"`,
        `"${teamRoster.replace(/"/g, '""')}"`,
        p.amount || 0,
        `"${p.trxnid || ''}"`,
        `"${(p.verified_by_name || p.verified_by || '').replace(/"/g, '""')}"`,
        `"${p.validated ? 'Yes' : 'No'}"`,
        `"${p.created_at || ''}"`
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `OnSpot_Participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported On-Spot participants to CSV!', 'success');
  };

  // Convert participant for PurchaseSlipModal
  const openVerificationSlip = (p: SpotParticipant) => {
    const rawSpotId = p.ticket_id.replace(/^SPOT-/i, '').replace(/^#/i, '');
    setViewingCandidate({
      id: p.ticket_id,
      memberId: rawSpotId,
      fullName: p.full_name,
      email: p.email,
      phone: p.phone,
      school: p.school || 'St. Joseph Higher Secondary School',
      class: p.academic_class || 'N/A',
      section: p.section || 'N/A',
      roll: p.roll || 'Spot Reg',
      category: p.category || 'Secondary',
      eventsList: p.selected_events ? p.selected_events.split(',').map(s => s.trim()) : ['On-Spot Ticket Registration'],
      teamName: p.team_name,
      teamMembers: p.team_members,
      trxnid: p.trxnid || `SPOT-TICKET-${rawSpotId}`,
      candidateType: 'spot',
      confirmed: true,
      confirmedAt: p.created_at,
      confirmedBy: p.verified_by_email || p.verified_by || 'Super Admin',
      confirmedByName: p.verified_by_name || 'Super Admin',
      amount: p.amount || 0
    });
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-zinc-950 to-black p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400">
                <Ticket className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500 text-black">
                Supabase Table
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                spot_ticket_participants
              </span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight">
              On-Spot Ticket Participants Management
            </h2>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              All participant records created at the On-Spot Ticket Purchase desk are permanently stored in this dedicated Supabase database table. As Super Admin, you can edit registrant information, download as Excel or CSV, or delete records on wish.
            </p>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={fetchParticipants}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
              Refresh
            </button>

            <button
              onClick={exportToExcel}
              disabled={filteredParticipants.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-bold text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Download Excel (.xlsx)
            </button>

            <button
              onClick={exportToCSV}
              disabled={filteredParticipants.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download CSV
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Total Participants</span>
          <span className="text-2xl font-black text-white mt-1">{metrics.total}</span>
          <span className="text-[9.5px] text-zinc-500 mt-1">Stored in Supabase table</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-amber-500/80">Total Revenue</span>
          <span className="text-2xl font-black text-amber-400 mt-1">৳ {metrics.revenue.toLocaleString()}</span>
          <span className="text-[9.5px] text-amber-500/60 mt-1">Cash collected at desk</span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400/80">Teams / Solo</span>
          <span className="text-2xl font-black text-blue-400 mt-1">
            {metrics.teamCount} <span className="text-sm font-normal text-zinc-500">teams</span> • {metrics.soloCount} <span className="text-sm font-normal text-zinc-500">solo</span>
          </span>
          <span className="text-[9.5px] text-blue-400/60 mt-1">Registration breakdown</span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 flex flex-col">
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400/80">Gate Validated</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">
            {metrics.validatedCount} <span className="text-xs font-normal text-zinc-500">/ {metrics.total}</span>
          </span>
          <span className="text-[9.5px] text-emerald-400/60 mt-1">Scanned at venue entrance</span>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="p-4 rounded-2xl bg-zinc-950/70 border border-white/5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone, ticket ID, school, roll, team..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-zinc-300 outline-none focus:border-amber-500/40 cursor-pointer"
          >
            <option value="all">All Categories</option>
            <option value="Primary">Primary (Class 3-5)</option>
            <option value="Junior">Junior (Class 6-8)</option>
            <option value="Secondary">Secondary (Class 9-10)</option>
            <option value="Higher Secondary">Higher Secondary (Class 11-12)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-zinc-300 outline-none focus:border-amber-500/40 cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="solo">Solo Registrations</option>
            <option value="team">Team Registrations Only</option>
          </select>

          <select
            value={validationFilter}
            onChange={(e) => setValidationFilter(e.target.value)}
            className="px-3.5 py-2 bg-zinc-900 border border-white/10 rounded-xl text-[11px] font-bold text-zinc-300 outline-none focus:border-amber-500/40 cursor-pointer"
          >
            <option value="all">All Gate States</option>
            <option value="validated">Gate Validated</option>
            <option value="pending">Pending Gate Scan</option>
          </select>
        </div>

        <div className="text-[11px] text-zinc-400 font-mono">
          Showing <span className="font-bold text-amber-400">{filteredParticipants.length}</span> of {participants.length} records
        </div>
      </div>

      {/* 4. Participants Table */}
      <div className="rounded-2xl border border-white/10 bg-zinc-950/60 overflow-hidden shadow-2xl">
        <div className="overflow-x-auto min-h-[350px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">
                Loading On-Spot Participants From Supabase...
              </p>
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500">
                <Ticket className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-white">No On-Spot Participants Found</h4>
              <p className="text-xs text-zinc-500 max-w-sm">
                {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'No records match your active search filters. Try clearing or expanding your query.'
                  : 'No on-spot ticket registrations have been recorded yet. Purchases made at the desk will appear here automatically.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02] text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-3 px-4">Ticket ID</th>
                  <th className="py-3 px-4">Participant & Contact</th>
                  <th className="py-3 px-4">Academic Details</th>
                  <th className="py-3 px-4">Category & Events</th>
                  <th className="py-3 px-4">Team Info</th>
                  <th className="py-3 px-4">Payment & Admin</th>
                  <th className="py-3 px-4">Gate Validation</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs text-zinc-300">
                {filteredParticipants.map(p => (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors group">
                    {/* Ticket ID */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-black text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                          {p.ticket_id}
                        </span>
                        <button
                          onClick={() => copyToClipboard(p.ticket_id, p.id)}
                          className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-1"
                          title="Copy Ticket ID"
                        >
                          {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <span className="text-[9px] text-zinc-500 block mt-1">
                        {p.created_at ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </td>

                    {/* Participant & Contact */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                        {p.full_name}
                      </p>
                      <div className="text-[11px] text-zinc-400 font-mono space-y-0.5 mt-0.5">
                        <p className="flex items-center gap-1 text-zinc-300">
                          <Mail className="w-3 h-3 text-zinc-500" />
                          <span className="truncate max-w-[200px]" title={p.email}>{p.email}</span>
                        </p>
                        <p className="flex items-center gap-1 text-zinc-400">
                          <Phone className="w-3 h-3 text-zinc-500" />
                          <span>{p.phone}</span>
                        </p>
                      </div>
                    </td>

                    {/* Academic Details */}
                    <td className="py-3.5 px-4 align-top">
                      <p className="text-zinc-200 font-semibold line-clamp-1 max-w-[180px]" title={p.school}>
                        {p.school || 'St. Joseph Higher Secondary School'}
                      </p>
                      <p className="text-[10.5px] text-zinc-400 font-mono mt-0.5">
                        Class: {p.academic_class || 'N/A'} • Sec: {p.section || 'N/A'} • Roll: {p.roll || 'Spot Reg'}
                      </p>
                    </td>

                    {/* Category & Events */}
                    <td className="py-3.5 px-4 align-top">
                      <span className="px-2 py-0.5 rounded text-[9.5px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 inline-block mb-1">
                        {p.category || 'Secondary'}
                      </span>
                      <p className="text-[10px] text-zinc-400 line-clamp-2 max-w-[190px]" title={p.selected_events}>
                        {p.selected_events || 'General Participation'}
                      </p>
                    </td>

                    {/* Team Info */}
                    <td className="py-3.5 px-4 align-top">
                      {p.is_team ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300 text-[9.5px] font-bold">
                            <Users className="w-3 h-3 text-blue-400" />
                            {p.team_name || 'Team Registration'}
                          </span>
                          {Array.isArray(p.team_members) && p.team_members.length > 0 && (
                            <p className="text-[9.5px] text-zinc-400">
                              {p.team_members.length} roster members
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-mono">Solo Participant</span>
                      )}
                    </td>

                    {/* Payment & Admin */}
                    <td className="py-3.5 px-4 align-top">
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-amber-400">৳ {p.amount || 0}</span>
                        <p className="text-[9.5px] text-zinc-500 font-mono">
                          Trx: {p.trxnid || 'N/A'}
                        </p>
                        <div className="flex items-center gap-1 text-[9.5px] text-zinc-400 mt-1">
                          <Shield className="w-3 h-3 text-amber-500/70" />
                          <span>{p.verified_by_name || p.verified_by || 'Admin Desk'}</span>
                        </div>
                      </div>
                    </td>

                    {/* Gate Validation */}
                    <td className="py-3.5 px-4 align-top">
                      {p.validated ? (
                        <div className="space-y-1">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9.5px] font-black uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            Validated
                          </span>
                          {p.validated_at && (
                            <p className="text-[9px] text-zinc-500 font-mono">
                              {new Date(p.validated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-white/5 text-zinc-500 text-[9.5px] font-semibold uppercase tracking-wider">
                          <XCircle className="w-3 h-3 text-zinc-600" />
                          Pending Scan
                        </span>
                      )}
                    </td>

                    {/* Actions: Edit, View Slip, Delete */}
                    <td className="py-3.5 px-4 align-top text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Slip */}
                        <button
                          type="button"
                          onClick={() => openVerificationSlip(p)}
                          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all cursor-pointer"
                          title="View / Print Verification Slip"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Info */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all cursor-pointer"
                          title="Edit Participant Info"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete on Wish */}
                        <button
                          type="button"
                          onClick={() => setDeletingParticipant(p)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all cursor-pointer"
                          title="Delete on wish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* 5. EDIT PARTICIPANT MODAL */}
      {editingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-zinc-950 border border-amber-500/30 p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3 text-amber-400 font-black text-base uppercase tracking-wider">
                <Edit className="w-5 h-5" />
                <span>Edit On-Spot Participant Info</span>
              </div>
              <button
                onClick={() => setEditingParticipant(null)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {/* Ticket ID (Read-only) */}
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                  Ticket ID (Permanent Database Key)
                </label>
                <input
                  type="text"
                  disabled
                  value={editingParticipant.ticket_id}
                  className="w-full px-3.5 py-2.5 bg-white/5 border border-white/10 rounded-xl text-zinc-400 font-mono cursor-not-allowed"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editForm.full_name || ''}
                  onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                  placeholder="Participant Full Name"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editForm.email || ''}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="participant@example.com"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={editForm.phone || ''}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Event Category
                </label>
                <select
                  value={editForm.category || 'Secondary'}
                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50 cursor-pointer"
                >
                  <option value="Primary">Primary (Class 3-5)</option>
                  <option value="Junior">Junior (Class 6-8)</option>
                  <option value="Secondary">Secondary (Class 9-10)</option>
                  <option value="Higher Secondary">Higher Secondary (Class 11-12)</option>
                </select>
              </div>

              {/* School / Institution */}
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  School / Institution
                </label>
                <input
                  type="text"
                  value={editForm.school || ''}
                  onChange={(e) => setEditForm({ ...editForm, school: e.target.value })}
                  placeholder="e.g. St. Joseph Higher Secondary School"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Class */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Class
                </label>
                <input
                  type="text"
                  value={editForm.academic_class || ''}
                  onChange={(e) => setEditForm({ ...editForm, academic_class: e.target.value })}
                  placeholder="e.g. 10"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Section */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={editForm.section || ''}
                  onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                  placeholder="e.g. A / Science"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Roll */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Roll / Spot Identifier
                </label>
                <input
                  type="text"
                  value={editForm.roll || ''}
                  onChange={(e) => setEditForm({ ...editForm, roll: e.target.value })}
                  placeholder="e.g. 24"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Amount BDT */}
              <div>
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Amount Paid (BDT)
                </label>
                <input
                  type="number"
                  value={editForm.amount ?? 0}
                  onChange={(e) => setEditForm({ ...editForm, amount: Number(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Selected Events */}
              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-zinc-300 tracking-wider block mb-1">
                  Selected Events (Comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.selected_events || ''}
                  onChange={(e) => setEditForm({ ...editForm, selected_events: e.target.value })}
                  placeholder="e.g. Math Olympiad, Rubik's Cube, Sudoku"
                  className="w-full px-3.5 py-2.5 bg-zinc-900 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500/50"
                />
              </div>

              {/* Team Information Section */}
              <div className="sm:col-span-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editForm.is_team)}
                      onChange={(e) => setEditForm({ ...editForm, is_team: e.target.checked })}
                      className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                    />
                    <span>Team Event Registration</span>
                  </label>
                  {editForm.is_team && (
                    <button
                      type="button"
                      onClick={() => {
                        const cur = editForm.team_members || [];
                        setEditForm({
                          ...editForm,
                          team_members: [...cur, { name: '', roll: '', phone: '', email: '' }]
                        });
                      }}
                      className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Member
                    </button>
                  )}
                </div>

                {editForm.is_team && (
                  <>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider block mb-1">
                        Team Name
                      </label>
                      <input
                        type="text"
                        value={editForm.team_name || ''}
                        onChange={(e) => setEditForm({ ...editForm, team_name: e.target.value })}
                        placeholder="e.g. Josephite Matrix"
                        className="w-full px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-amber-500/50"
                      />
                    </div>

                    {/* Member Rosters */}
                    <div className="space-y-2 mt-2">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider block">
                        Team Members List
                      </span>
                      {(editForm.team_members || []).map((m: any, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-white/5">
                          <input
                            type="text"
                            placeholder="Name"
                            value={m.name || m.fullName || ''}
                            onChange={(e) => {
                              const updated = [...(editForm.team_members || [])];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setEditForm({ ...editForm, team_members: updated });
                            }}
                            className="flex-1 px-2.5 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Roll"
                            value={m.roll || ''}
                            onChange={(e) => {
                              const updated = [...(editForm.team_members || [])];
                              updated[idx] = { ...updated[idx], roll: e.target.value };
                              setEditForm({ ...editForm, team_members: updated });
                            }}
                            className="w-20 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Phone"
                            value={m.phone || ''}
                            onChange={(e) => {
                              const updated = [...(editForm.team_members || [])];
                              updated[idx] = { ...updated[idx], phone: e.target.value };
                              setEditForm({ ...editForm, team_members: updated });
                            }}
                            className="w-28 px-2 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...(editForm.team_members || [])];
                              updated.splice(idx, 1);
                              setEditForm({ ...editForm, team_members: updated });
                            }}
                            className="p-1.5 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Status Toggles */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.validated)}
                    onChange={(e) => setEditForm({ ...editForm, validated: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-emerald-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Gate Validated</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.snacks_collected)}
                    onChange={(e) => setEditForm({ ...editForm, snacks_collected: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Snacks Claimed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.certificate_collected)}
                    onChange={(e) => setEditForm({ ...editForm, certificate_collected: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Certificate Claimed</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.souvenir_collected)}
                    onChange={(e) => setEditForm({ ...editForm, souvenir_collected: e.target.checked })}
                    className="rounded border-zinc-700 bg-zinc-900 text-purple-500 focus:ring-0"
                  />
                  <span className="text-xs font-semibold text-zinc-300">Souvenir Claimed</span>
                </label>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setEditingParticipant(null)}
                className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={savingEdit}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50"
              >
                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. DELETE CONFIRMATION MODAL */}
      {deletingParticipant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-950 border border-red-500/30 p-6 md:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400 font-black text-base uppercase tracking-wider">
              <Trash2 className="w-6 h-6" />
              <span>Delete Participant</span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Are you sure you want to permanently delete the on-spot registration for:
            </p>

            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs space-y-1">
              <p className="font-bold text-white text-sm">{deletingParticipant.full_name}</p>
              <p className="font-mono text-zinc-400">Ticket ID: <span className="text-amber-400">{deletingParticipant.ticket_id}</span></p>
              <p className="font-mono text-zinc-400">Email: {deletingParticipant.email}</p>
              <p className="font-mono text-zinc-400">Phone: {deletingParticipant.phone}</p>
            </div>

            <p className="text-[11px] text-zinc-500">
              This action will remove the participant from the <code className="text-red-400">spot_ticket_participants</code> table, live event category tables, site tickets, and the historical participant archive.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingParticipant(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-all shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete on Wish
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. VIEW VERIFICATION SLIP MODAL */}
      {viewingCandidate && (
        <PurchaseSlipModal
          isOpen={true}
          onClose={() => setViewingCandidate(null)}
          candidate={viewingCandidate}
          documentType="verification_slip"
        />
      )}
    </div>
  );
}
