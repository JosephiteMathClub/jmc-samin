'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  DatabaseZap, 
  Archive, 
  Trash2, 
  Mail, 
  PhoneCall, 
  Send, 
  RefreshCw, 
  Search, 
  Filter, 
  Download, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  Clock, 
  Sparkles, 
  Copy, 
  FileText, 
  Users, 
  Layers, 
  ExternalLink, 
  Eye, 
  Code2, 
  Check,
  Loader2,
  ShieldAlert,
  HelpCircle,
  Smartphone,
  CheckSquare,
  Square,
  X
} from 'lucide-react';

interface ParticipantRecord {
  id: string;
  original_id?: string;
  user_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  bkash_number?: string;
  academic_class?: string;
  section?: string;
  roll?: string;
  school?: string;
  source_table?: string;
  selected_events?: string;
  trxnid?: string;
  amount?: number;
  academic_year?: string;
  verified?: string;
  archived_at?: string;
  created_at?: string;
  metadata?: any;
}

interface ParticipantHistoryTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  isSuperAdmin: boolean;
}

const DEFAULT_EMAIL_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #0b071e;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #ffffff;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #0b071e;
      padding: 30px 10px;
    }
    .card {
      max-width: 600px;
      margin: 0 auto;
      background: #130a2a;
      border: 1px solid rgba(245, 158, 11, 0.25);
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
    }
    .header {
      background: linear-gradient(135deg, #1f0d4d 0%, #110530 100%);
      padding: 36px 30px 24px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .logo-badge {
      display: inline-block;
      padding: 6px 14px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      color: #fbbf24;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.15em;
      text-transform: uppercase;
      border-radius: 100px;
      margin-bottom: 14px;
    }
    .title {
      font-size: 24px;
      font-weight: 900;
      color: #ffffff;
      margin: 0 0 6px 0;
      letter-spacing: -0.02em;
    }
    .subtitle {
      font-size: 13px;
      color: #a78bfa;
      margin: 0;
      font-weight: 500;
    }
    .content {
      padding: 32px 30px;
      font-size: 15px;
      line-height: 1.65;
      color: #e2e8f0;
    }
    .greeting {
      font-size: 18px;
      font-weight: 700;
      color: #ffffff;
      margin-bottom: 16px;
    }
    .info-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 14px;
      padding: 18px 20px;
      margin: 22px 0;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 13px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      color: #94a3b8;
      font-weight: 600;
    }
    .info-val {
      color: #fbbf24;
      font-weight: 700;
      text-align: right;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0 10px;
    }
    .cta-btn {
      display: inline-block;
      background: #f59e0b;
      color: #000000 !important;
      font-weight: 800;
      font-size: 13px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25);
    }
    .footer {
      background: #0d061c;
      padding: 24px 30px;
      text-align: center;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
      font-size: 12px;
      color: #64748b;
      line-height: 1.5;
    }
    .footer a {
      color: #a78bfa;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-badge">📐 Official JMC Outreach</div>
        <h1 class="title">Josephite Math Club</h1>
        <p class="subtitle">St. Joseph Higher Secondary School • National Mathematics Festival</p>
      </div>

      <div class="content">
        <div class="greeting">Dear {{fullName}},</div>
        <p>We hope this message finds you in great mathematical spirits! As a valued previous participant of the <strong>Josephite Math Club</strong> competitions, we are thrilled to invite you to our upcoming season of exciting mathematical events, masterclasses, and prestigious Olympiad segments.</p>
        
        <div class="info-box">
          <div style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #a78bfa; margin-bottom: 8px;">Previous Registration Record</div>
          <div class="info-row">
            <span class="info-label">Category Segment:</span>
            <span class="info-val">{{category}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Institution:</span>
            <span class="info-val">{{school}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Academic Season:</span>
            <span class="info-val">{{academicYear}}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Registered Phone:</span>
            <span class="info-val">{{phone}}</span>
          </div>
        </div>

        <p>Registrations for the new season are opening shortly. Prepare yourself to solve exhilarating problems, compete with the brightest mathematical minds across the country, and take home prestigious honors!</p>

        <div class="cta-container">
          <a href="https://jmc-sjs.org" class="cta-btn" target="_blank">Visit JMC Championship Portal</a>
        </div>
      </div>

      <div class="footer">
        <p>Sent with 💙 by <strong>Josephite Math Club</strong><br>
        97 Asad Avenue, Mohammadpur, Dhaka-1207, Bangladesh<br>
        Inquiries: <a href="mailto:mathclub@sjs.edu.bd">mathclub@sjs.edu.bd</a></p>
        <p style="font-size: 10px; color: #475569; margin-top: 10px;">You are receiving this update because you participated in Josephite Math Club events.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

export const ParticipantHistoryTab: React.FC<ParticipantHistoryTabProps> = ({
  showToast,
  isSuperAdmin
}) => {
  // Data States
  const [loading, setLoading] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const [participants, setParticipants] = useState<ParticipantRecord[]>([]);
  const [liveCounts, setLiveCounts] = useState({
    primary_events: 0,
    junior_events: 0,
    secondary_events: 0,
    higher_secondary_events: 0,
    total_live: 0
  });
  const [stats, setStats] = useState({
    totalArchived: 0,
    totalWithEmail: 0,
    totalWithPhone: 0,
    availableYears: [] as string[]
  });

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedParticipants, setSelectedParticipants] = useState<Record<string, boolean>>({});

  // Archive & Clear Action States
  const [archiveTargetTables, setArchiveTargetTables] = useState<string[]>([
    'primary_events',
    'junior_events',
    'secondary_events',
    'higher_secondary_events'
  ]);
  const [archiveAcademicYear, setArchiveAcademicYear] = useState(`${new Date().getFullYear() - 1}-${new Date().getFullYear()}`);
  const [archiveNote, setArchiveNote] = useState('');
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [archiveConfirmText, setArchiveConfirmText] = useState('');
  const [archiving, setArchiving] = useState(false);

  // Communications Module (Email & SMS)
  const [commChannel, setCommChannel] = useState<'email' | 'sms'>('email');
  const [emailSubject, setEmailSubject] = useState('Important Announcement from Josephite Math Club');
  const [emailHtmlTemplate, setEmailHtmlTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [emailEditorTab, setEmailEditorTab] = useState<'preview' | 'code'>('preview');
  const [emailTargetFilter, setEmailTargetFilter] = useState<'all' | 'selected' | 'year' | 'category'>('all');
  const [testEmailAddress, setTestEmailAddress] = useState('l47idkpro@gmail.com');
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [broadcastingEmail, setBroadcastingEmail] = useState(false);
  const [confirmBroadcastEmail, setConfirmBroadcastEmail] = useState(false);

  // SMS Broadcast States
  const [smsMessage, setSmsMessage] = useState('Hello {{fullName}}, greetings from Josephite Math Club! Stay tuned for our upcoming National Mathematics Championship. Visit: jmc-sjs.org');
  const [broadcastingSms, setBroadcastingSms] = useState(false);
  const [copiedPhones, setCopiedPhones] = useState(false);

  // Manual Participant Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newParticipant, setNewParticipant] = useState({
    full_name: '',
    email: '',
    phone: '',
    academic_class: '',
    school: '',
    academic_year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
    selected_events: ''
  });
  const [addingParticipant, setAddingParticipant] = useState(false);

  // Fetch Participant History data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/participant-history');
      const data = await res.json();

      if (res.ok) {
        setTableExists(data.tableExists !== false);
        setParticipants(data.participants || []);
        if (data.liveCounts) setLiveCounts(data.liveCounts);
        if (data.stats) setStats(data.stats);
      } else {
        throw new Error(data.error || 'Failed to fetch participant history');
      }
    } catch (err: any) {
      console.error('fetchData error:', err);
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filtered Participants List
  const filteredParticipants = useMemo(() => {
    return participants.filter(p => {
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matches = 
          (p.full_name || '').toLowerCase().includes(q) ||
          (p.email || '').toLowerCase().includes(q) ||
          (p.phone || '').includes(q) ||
          (p.bkash_number || '').includes(q) ||
          (p.school || '').toLowerCase().includes(q) ||
          (p.trxnid || '').toLowerCase().includes(q) ||
          (p.academic_class || '').toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Year Filter
      if (yearFilter !== 'all' && p.academic_year !== yearFilter) {
        return false;
      }

      // Category Filter
      if (categoryFilter !== 'all' && p.source_table !== categoryFilter) {
        return false;
      }

      return true;
    });
  }, [participants, searchTerm, yearFilter, categoryFilter]);

  // Selected Count
  const selectedCount = useMemo(() => {
    return Object.values(selectedParticipants).filter(Boolean).length;
  }, [selectedParticipants]);

  const selectedIds = useMemo(() => {
    return Object.keys(selectedParticipants).filter(k => selectedParticipants[k]);
  }, [selectedParticipants]);

  // Handle Archive & Clear Execution
  const handleArchiveAndClear = async () => {
    if (archiveConfirmText.trim().toUpperCase() !== 'ARCHIVE & CLEAR') {
      showToast('Please type "ARCHIVE & CLEAR" to verify safety authorization.', 'error');
      return;
    }

    if (archiveTargetTables.length === 0) {
      showToast('Please select at least one live event table to archive.', 'error');
      return;
    }

    setArchiving(true);
    showToast('Executing participant migration and archival...', 'info');

    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'archive_and_clear',
          targetTables: archiveTargetTables,
          academicYear: archiveAcademicYear,
          note: archiveNote
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Archival and table clearing completed successfully!', 'success');
        setShowArchiveModal(false);
        setArchiveConfirmText('');
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to archive participants');
      }
    } catch (err: any) {
      console.error('Archive error:', err);
      showToast(err.message, 'error');
    } finally {
      setArchiving(false);
    }
  };

  // Handle Send Test Email
  const handleSendTestEmail = async () => {
    if (!testEmailAddress.trim() || !testEmailAddress.includes('@')) {
      showToast('Please enter a valid test email address.', 'error');
      return;
    }

    setSendingTestEmail(true);
    showToast(`Sending test preview email to ${testEmailAddress}...`, 'info');

    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_email',
          testEmail: testEmailAddress.trim(),
          subject: emailSubject,
          htmlTemplate: emailHtmlTemplate
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || 'Test email dispatched successfully! Check inbox.', 'success');
      } else {
        throw new Error(data.error || 'Failed to send test email');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingTestEmail(false);
    }
  };

  // Handle Broadcast Email
  const handleBroadcastEmail = async () => {
    if (!confirmBroadcastEmail) {
      showToast('Please confirm the broadcast authorization checkbox first.', 'error');
      return;
    }

    if (emailTargetFilter === 'selected' && selectedIds.length === 0) {
      showToast('Please select at least one participant from the table below.', 'error');
      return;
    }

    setBroadcastingEmail(true);
    showToast('Initiating wide-scale email broadcast...', 'info');

    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_email',
          subject: emailSubject,
          htmlTemplate: emailHtmlTemplate,
          targetFilter: emailTargetFilter === 'category' ? categoryFilter : (emailTargetFilter === 'selected' ? undefined : 'all'),
          academicYearFilter: emailTargetFilter === 'year' ? yearFilter : 'all',
          customParticipantIds: emailTargetFilter === 'selected' ? selectedIds : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Broadcast completed! Sent: ${data.sentCount}, Failed: ${data.failedCount} out of ${data.totalTargeted}`, 'success');
        setConfirmBroadcastEmail(false);
      } else {
        throw new Error(data.error || 'Failed to broadcast emails');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBroadcastingEmail(false);
    }
  };

  // Handle Broadcast SMS / Phone Export
  const handleBroadcastSms = async () => {
    setBroadcastingSms(true);
    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'broadcast_sms',
          messageText: smsMessage,
          academicYearFilter: yearFilter,
          targetFilter: categoryFilter,
          customParticipantIds: selectedIds.length > 0 ? selectedIds : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message || `SMS payload ready for ${data.totalRecipients} recipients!`, 'success');
      } else {
        throw new Error(data.error || 'Failed to prepare SMS broadcast');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setBroadcastingSms(false);
    }
  };

  // Copy phone numbers to clipboard
  const handleCopyPhoneNumbers = () => {
    const phones = filteredParticipants
      .map(p => (p.phone || p.bkash_number || '').replace(/[^0-9+]/g, ''))
      .filter(p => p.length >= 10);
    
    const uniquePhones = Array.from(new Set(phones));

    if (uniquePhones.length === 0) {
      showToast('No phone numbers available in current view to copy.', 'error');
      return;
    }

    navigator.clipboard.writeText(uniquePhones.join(', '));
    setCopiedPhones(true);
    setTimeout(() => setCopiedPhones(false), 2500);
    showToast(`Copied ${uniquePhones.length} unique phone numbers to clipboard!`, 'success');
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      showToast('No participant records to export.', 'error');
      return;
    }

    const headers = [
      'Full Name',
      'Email Address',
      'Phone Number',
      'bKash Number',
      'Class',
      'Section',
      'Roll',
      'Institution/School',
      'Category/Source',
      'Selected Events',
      'Transaction ID',
      'Amount',
      'Academic Year',
      'Archived Date'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredParticipants.map(p => [
        `"${(p.full_name || '').replace(/"/g, '""')}"`,
        `"${(p.email || '').replace(/"/g, '""')}"`,
        `"${(p.phone || '').replace(/"/g, '""')}"`,
        `"${(p.bkash_number || '').replace(/"/g, '""')}"`,
        `"${(p.academic_class || '').replace(/"/g, '""')}"`,
        `"${(p.section || '').replace(/"/g, '""')}"`,
        `"${(p.roll || '').replace(/"/g, '""')}"`,
        `"${(p.school || '').replace(/"/g, '""')}"`,
        `"${(p.source_table || '').replace(/"/g, '""')}"`,
        `"${(p.selected_events || '').replace(/"/g, '""')}"`,
        `"${(p.trxnid || '').replace(/"/g, '""')}"`,
        `"${p.amount || 0}"`,
        `"${(p.academic_year || '').replace(/"/g, '""')}"`,
        `"${p.archived_at ? new Date(p.archived_at).toLocaleDateString() : ''}"`
      ].join(','))
    ];

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `jmc_previous_year_participants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV successfully!', 'success');
  };

  // Add Single Participant
  const handleAddParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParticipant.full_name.trim() || !newParticipant.email.trim()) {
      showToast('Full Name and Email are required.', 'error');
      return;
    }

    setAddingParticipant(true);
    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_participant',
          ...newParticipant
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Historical participant record added!', 'success');
        setShowAddModal(false);
        setNewParticipant({
          full_name: '',
          email: '',
          phone: '',
          academic_class: '',
          school: '',
          academic_year: `${new Date().getFullYear() - 1}-${new Date().getFullYear()}`,
          selected_events: ''
        });
        fetchData();
      } else {
        throw new Error(data.error || 'Failed to add participant');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setAddingParticipant(false);
    }
  };

  // Delete Single Participant Record from Archive
  const handleDeleteParticipant = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" from historical archive?`)) return;

    try {
      const res = await fetch('/api/admin/participant-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_participant',
          id
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Participant record deleted.', 'success');
        setParticipants(prev => prev.filter(p => p.id !== id));
      } else {
        throw new Error(data.error || 'Failed to delete record');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  // Helper Category Formatter
  const getCategoryLabel = (src?: string) => {
    switch (src) {
      case 'primary_events': return 'Primary (3-5)';
      case 'junior_events': return 'Junior (6-8)';
      case 'secondary_events': return 'Secondary (9-10)';
      case 'higher_secondary_events': return 'Higher Secondary (11-12)';
      case 'manual': return 'Manual Entry';
      default: return src || 'General';
    }
  };

  return (
    <div className="space-y-8">
      {/* 1. TOP HERO & COMPREHENSIVE SYSTEM DESCRIPTION */}
      <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 via-purple-950/20 to-black/60 p-6 md:p-8 backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                <Archive className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500 text-black">
                    Super Admin Feature
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Table: previous_year_participants
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight mt-1">
                  Updating History of Participants Email & Contacts
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
                <span>Refresh Vault</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Historical Entry</span>
              </button>
            </div>
          </div>

          {/* Description & How it Works Box */}
          <div className="mt-4 p-5 rounded-2xl bg-black/40 border border-white/10 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-widest">
              <Info className="w-4 h-4 text-amber-400" />
              <span>What Was Just Added & How It Works</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-zinc-300">
              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  1. Zero-Loss Event Archival
                </span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  When clearing or resetting the live event databases (<code className="text-amber-300">primary_events</code>, <code className="text-amber-300">junior_events</code>, <code className="text-amber-300">secondary_events</code>, <code className="text-amber-300">higher_secondary_events</code>), all participant emails, phone numbers, full names, schools, classes, and transaction records are automatically migrated into the permanent <code className="text-purple-300">previous_year_participants</code> table before deletion.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  2. Permanent Contact Vault
                </span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  Even after live tables are wiped clean for a fresh festival season, all previous years' verified student emails and mobile numbers remain permanently preserved, searchable, and structured by academic year for ongoing engagement.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                <span className="font-bold text-white flex items-center gap-1.5 text-[11px] uppercase tracking-wide">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  3. Wide-Scale Broadcasting
                </span>
                <p className="text-zinc-400 text-[11px] leading-relaxed">
                  From this very tab, Super Admins can dispatch bulk emails with customizable HTML/CSS responsive cards and send mass SMS notifications with dynamic variable tagging (<code className="text-emerald-300">{"{{fullName}}"}</code>, <code className="text-emerald-300">{"{{category}}"}</code>, <code className="text-emerald-300">{"{{year}}"}</code>).
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SQL Setup Alert if table not yet created in Supabase */}
      {!tableExists && (
        <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-500/30 text-amber-200 space-y-3">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div>
              <h4 className="font-black text-sm uppercase tracking-wider text-white">Database Migration Notice</h4>
              <p className="text-xs text-amber-300/90 mt-0.5">
                The permanent table <code className="font-bold text-white">previous_year_participants</code> is defined in <code className="font-bold text-white">SUPABASE_SETUP.sql</code> (Section 13). If not already executed in Supabase SQL editor, copy the command below:
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/60 font-mono text-[11px] text-zinc-300 overflow-x-auto flex items-center justify-between gap-4">
            <pre className="text-amber-400 select-all">
              CREATE TABLE IF NOT EXISTS public.previous_year_participants (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), full_name TEXT NOT NULL, email TEXT NOT NULL, phone TEXT, academic_class TEXT, school TEXT, source_table TEXT, selected_events TEXT, trxnid TEXT, academic_year TEXT, archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW());
            </pre>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`CREATE TABLE IF NOT EXISTS public.previous_year_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    original_id TEXT,
    user_id UUID,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    bkash_number TEXT,
    academic_class TEXT,
    section TEXT,
    roll TEXT,
    school TEXT,
    source_table TEXT,
    selected_events TEXT,
    trxnid TEXT,
    amount NUMERIC DEFAULT 0,
    academic_year TEXT DEFAULT '2025-2026',
    verified TEXT DEFAULT 'yes',
    archived_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);
ALTER TABLE public.previous_year_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow super admins full access to previous_year_participants" ON public.previous_year_participants FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
CREATE POLICY "Allow service role full access to previous_year_participants" ON public.previous_year_participants FOR ALL TO service_role USING (true) WITH CHECK (true);`);
                showToast('SQL script copied to clipboard! Paste into Supabase SQL Editor.', 'success');
              }}
              className="px-3 py-1.5 rounded-lg bg-amber-500 text-black font-heavy text-[10px] uppercase tracking-wider flex-shrink-0 flex items-center gap-1.5"
            >
              <Copy className="w-3 h-3" />
              Copy Full SQL
            </button>
          </div>
        </div>
      )}

      {/* 2. STATS & ARCHIVAL CONTROL CENTER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Stats Counter */}
        <div className="lg:col-span-1 space-y-4">
          <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 space-y-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 flex items-center justify-between">
              <span>Historical Vault Metrics</span>
              <DatabaseZap className="w-4 h-4 text-amber-500" />
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Archived Total</span>
                <span className="text-2xl font-black text-white font-mono mt-1 block">
                  {stats.totalArchived}
                </span>
                <span className="text-[9px] text-amber-400 font-bold uppercase tracking-wider mt-0.5 block">
                  Preserved Records
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Verified Emails</span>
                <span className="text-2xl font-black text-purple-400 font-mono mt-1 block">
                  {stats.totalWithEmail}
                </span>
                <span className="text-[9px] text-purple-300 font-bold uppercase tracking-wider mt-0.5 block">
                  Active Inboxes
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Phone Numbers</span>
                <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">
                  {stats.totalWithPhone}
                </span>
                <span className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider mt-0.5 block">
                  SMS Contacts
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/20">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-bold block">Archived Years</span>
                <span className="text-2xl font-black text-blue-400 font-mono mt-1 block">
                  {stats.availableYears.length || 1}
                </span>
                <span className="text-[9px] text-blue-300 font-bold uppercase tracking-wider mt-0.5 block">
                  Festival Seasons
                </span>
              </div>
            </div>

            {/* Live Tables Count breakdown */}
            <div className="pt-4 border-t border-white/5 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Currently Live In DB:</span>
                <span className="text-amber-400 font-mono font-black">{liveCounts.total_live} records</span>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-400 font-mono">
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span>primary_events:</span>
                  <span className="text-white font-bold">{liveCounts.primary_events}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span>junior_events:</span>
                  <span className="text-white font-bold">{liveCounts.junior_events}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span>secondary_events:</span>
                  <span className="text-white font-bold">{liveCounts.secondary_events}</span>
                </div>
                <div className="flex justify-between p-2 rounded-lg bg-white/[0.02]">
                  <span>higher_secondary_events:</span>
                  <span className="text-white font-bold">{liveCounts.higher_secondary_events}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Archival & Clearing Trigger Center */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-6 md:p-7 rounded-3xl bg-gradient-to-br from-red-500/5 via-white/[0.02] to-black/40 border border-red-500/20 space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                  <Archive className="w-4 h-4 text-amber-500" />
                  <span>Participant Archival & Database Reset Center</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Safely migrate current festival participants into the permanent vault and clear the live tables.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowArchiveModal(true)}
                disabled={liveCounts.total_live === 0}
                className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                  liveCounts.total_live > 0 
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white shadow-red-600/20' 
                    : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                }`}
              >
                <Archive className="w-4 h-4" />
                <span>Archive & Clear Live Tables ({liveCounts.total_live})</span>
              </button>
            </div>

            {/* Target Tables Selector */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                Select Live Event Tables to Include:
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: 'primary_events', label: 'Primary (3-5)', count: liveCounts.primary_events },
                  { key: 'junior_events', label: 'Junior (6-8)', count: liveCounts.junior_events },
                  { key: 'secondary_events', label: 'Secondary (9-10)', count: liveCounts.secondary_events },
                  { key: 'higher_secondary_events', label: 'Higher Sec (11-12)', count: liveCounts.higher_secondary_events },
                ].map((tbl) => {
                  const isChecked = archiveTargetTables.includes(tbl.key);
                  return (
                    <label 
                      key={tbl.key}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                        isChecked 
                          ? 'bg-amber-500/10 border-amber-500/30 text-white' 
                          : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setArchiveTargetTables(prev => [...prev, tbl.key]);
                            } else {
                              setArchiveTargetTables(prev => prev.filter(t => t !== tbl.key));
                            }
                          }}
                          className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                        />
                        <span className="text-xs font-bold truncate">{tbl.label}</span>
                      </div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-black/40 text-amber-400">
                        {tbl.count}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Academic Year Tag & Custom Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Academic Year Tag for Archived Batch
                </label>
                <input
                  type="text"
                  value={archiveAcademicYear}
                  onChange={(e) => setArchiveAcademicYear(e.target.value)}
                  placeholder="e.g. 2024-2025 or 2025"
                  className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white font-mono font-bold outline-none focus:border-amber-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Archival Audit Note (Optional)
                </label>
                <input
                  type="text"
                  value={archiveNote}
                  onChange={(e) => setArchiveNote(e.target.value)}
                  placeholder="e.g. Annual Season Reset before 2026 Festival"
                  className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/50"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. WIDE-SCALE COMMUNICATIONS CENTER (EMAIL & SMS) */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-6 border-b border-white/5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-base font-black text-white uppercase tracking-tight">
                Wide-Scale Communication & Outreach Engine
              </h3>
            </div>
            <p className="text-xs text-zinc-400">
              Broadcast beautifully styled HTML/CSS responsive emails and SMS alerts to previous participants.
            </p>
          </div>

          {/* Channel Switcher */}
          <div className="flex items-center gap-1.5 bg-black/40 p-1.5 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => setCommChannel('email')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                commChannel === 'email'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email Broadcast (HTML/CSS)</span>
            </button>

            <button
              type="button"
              onClick={() => setCommChannel('sms')}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                commChannel === 'sms'
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>SMS Broadcast</span>
            </button>
          </div>
        </div>

        {/* EMAIL BROADCAST INTERFACE */}
        {commChannel === 'email' && (
          <div className="space-y-6">
            {/* Target Audience & Test Email Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Target Recipient Scope
                </label>
                <select
                  value={emailTargetFilter}
                  onChange={(e) => setEmailTargetFilter(e.target.value as any)}
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:border-amber-500/50"
                >
                  <option value="all">All Preserved Participants ({stats.totalWithEmail} emails)</option>
                  <option value="year">Filtered by Academic Year ({yearFilter === 'all' ? 'All' : yearFilter})</option>
                  <option value="category">Filtered by Category ({categoryFilter === 'all' ? 'All' : getCategoryLabel(categoryFilter)})</option>
                  <option value="selected">Custom Checked Rows ({selectedCount} selected)</option>
                </select>
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Invitation: 2026 Josephite National Mathematics Championship"
                  className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Template Variables Guide */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex flex-wrap items-center gap-2 text-[11px] text-zinc-300">
              <span className="font-bold text-amber-400 uppercase tracking-widest text-[10px] mr-1">
                Dynamic Tags:
              </span>
              {[
                { tag: '{{fullName}}', desc: 'Participant Name' },
                { tag: '{{category}}', desc: 'Event Category' },
                { tag: '{{school}}', desc: 'Institution' },
                { tag: '{{academicYear}}', desc: 'Year' },
                { tag: '{{phone}}', desc: 'Phone' },
                { tag: '{{email}}', desc: 'Email Address' },
              ].map(t => (
                <button
                  key={t.tag}
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(t.tag);
                    showToast(`Copied ${t.tag} to clipboard!`, 'info');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-black/50 border border-white/10 hover:border-amber-500/40 text-amber-300 font-mono text-[10px] flex items-center gap-1 cursor-pointer transition-all"
                  title={t.desc}
                >
                  <code>{t.tag}</code>
                  <span className="text-zinc-500 text-[9px]">({t.desc})</span>
                </button>
              ))}
            </div>

            {/* Code / Visual Preview Tabs */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEmailEditorTab('preview')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      emailEditorTab === 'preview'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Visual Card Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setEmailEditorTab('code')}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
                      emailEditorTab === 'code'
                        ? 'bg-purple-600 text-white shadow-md'
                        : 'text-zinc-400 hover:text-white bg-white/5'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    <span>Edit HTML & CSS Code</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Reset template back to default JMC Outreach card?')) {
                      setEmailHtmlTemplate(DEFAULT_EMAIL_TEMPLATE);
                      showToast('Template reset to default.', 'info');
                    }
                  }}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300 uppercase tracking-widest font-bold cursor-pointer"
                >
                  Reset Default Card
                </button>
              </div>

              {/* Editor Workspace */}
              {emailEditorTab === 'code' ? (
                <div className="space-y-2">
                  <textarea
                    rows={18}
                    value={emailHtmlTemplate}
                    onChange={(e) => setEmailHtmlTemplate(e.target.value)}
                    className="w-full p-4 bg-zinc-950 border border-white/10 rounded-2xl font-mono text-xs text-emerald-400 leading-relaxed outline-none focus:border-amber-500/50"
                    placeholder="Enter HTML & CSS Email Template..."
                  />
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-950 border border-white/10 overflow-hidden flex justify-center">
                  <iframe
                    title="Email Card Live Preview"
                    srcDoc={emailHtmlTemplate
                      .replace(/{{fullName}}/g, 'Alex Rahman')
                      .replace(/{{category}}/g, 'Secondary Category (Classes 9-10)')
                      .replace(/{{school}}/g, 'St. Joseph Higher Secondary School')
                      .replace(/{{academicYear}}/g, '2025-2026')
                      .replace(/{{phone}}/g, '01712345678')
                      .replace(/{{email}}/g, 'alex.rahman@example.com')
                    }
                    className="w-full max-w-[620px] h-[520px] rounded-xl border border-white/5 bg-[#0b071e]"
                  />
                </div>
              )}
            </div>

            {/* Test Send & Bulk Dispatch Actions */}
            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Test Send */}
              <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="Test recipient email..."
                  className="px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/50 w-full sm:w-64 font-mono"
                />
                <button
                  type="button"
                  disabled={sendingTestEmail}
                  onClick={handleSendTestEmail}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-heavy text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  {sendingTestEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Test Email</span>
                </button>
              </div>

              {/* Bulk Send Trigger */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto justify-end">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-zinc-300">
                  <input
                    type="checkbox"
                    checked={confirmBroadcastEmail}
                    onChange={(e) => setConfirmBroadcastEmail(e.target.checked)}
                    className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0"
                  />
                  <span className="text-[11px] font-bold">Authorize Wide Broadcast</span>
                </label>

                <button
                  type="button"
                  disabled={broadcastingEmail || !confirmBroadcastEmail}
                  onClick={handleBroadcastEmail}
                  className={`px-6 py-3 rounded-xl font-heavy text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-xl cursor-pointer ${
                    confirmBroadcastEmail
                      ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20'
                      : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                  }`}
                >
                  {broadcastingEmail ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Dispatch Email Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SMS BROADCAST INTERFACE */}
        {commChannel === 'sms' && (
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  SMS Message Body (Single / Multi-Part)
                </label>
                <div className="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                  <span>Characters: {smsMessage.length}</span>
                  <span>•</span>
                  <span className="text-amber-400 font-bold">
                    {Math.ceil((smsMessage.length || 1) / 160)} SMS Part(s)
                  </span>
                </div>
              </div>

              <textarea
                rows={4}
                value={smsMessage}
                onChange={(e) => setSmsMessage(e.target.value)}
                placeholder="Enter SMS message text..."
                className="w-full p-4 bg-black/40 border border-white/10 rounded-2xl text-xs text-white leading-relaxed outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Mobile Number Inventory
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {stats.totalWithPhone} available contact numbers in the permanent repository.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyPhoneNumbers}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-heavy text-[10px] uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  {copiedPhones ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPhones ? 'Copied Phone List!' : 'Copy Numbers to Clipboard'}</span>
                </button>

                <button
                  type="button"
                  disabled={broadcastingSms}
                  onClick={handleBroadcastSms}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heavy text-[10px] uppercase tracking-widest flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  {broadcastingSms ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PhoneCall className="w-3.5 h-3.5" />}
                  <span>Prepare SMS Dispatch</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. PERMANENT PARTICIPANT VAULT TABLE */}
      <div className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-500" />
              <span>Historical Participants Vault Directory</span>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-zinc-300">
                {filteredParticipants.length} Records
              </span>
            </h3>
            <p className="text-xs text-zinc-400">
              Query, filter, and inspect preserved student contact credentials across all archived championship seasons.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-heavy uppercase tracking-widest flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone, school, TrxID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-amber-500/50"
            />
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:border-amber-500/50"
            >
              <option value="all">All Academic Years</option>
              {stats.availableYears.map(yr => (
                <option key={yr} value={yr}>Year: {yr}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white font-bold outline-none focus:border-amber-500/50"
            >
              <option value="all">All Categories</option>
              <option value="primary_events">Primary (Classes 3-5)</option>
              <option value="junior_events">Junior (Classes 6-8)</option>
              <option value="secondary_events">Secondary (Classes 9-10)</option>
              <option value="higher_secondary_events">Higher Secondary (Classes 11-12)</option>
              <option value="manual">Manual Entry</option>
            </select>
          </div>
        </div>

        {/* Bulk Selection Controls */}
        <div className="flex items-center justify-between text-xs py-2 px-3 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const allSelected = filteredParticipants.every(p => selectedParticipants[p.id]);
                const nextSelection: Record<string, boolean> = {};
                filteredParticipants.forEach(p => {
                  nextSelection[p.id] = !allSelected;
                });
                setSelectedParticipants(nextSelection);
              }}
              className="text-[11px] font-bold text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
            >
              {filteredParticipants.length > 0 && filteredParticipants.every(p => selectedParticipants[p.id]) ? (
                <>
                  <CheckSquare className="w-3.5 h-3.5" />
                  <span>Deselect All</span>
                </>
              ) : (
                <>
                  <Square className="w-3.5 h-3.5" />
                  <span>Select All ({filteredParticipants.length})</span>
                </>
              )}
            </button>

            {selectedCount > 0 && (
              <span className="text-zinc-400 font-mono text-[11px]">
                • <strong className="text-white">{selectedCount}</strong> chosen for custom broadcast
              </span>
            )}
          </div>

          <span className="text-zinc-500 text-[10px] uppercase tracking-widest font-mono">
            Showing {filteredParticipants.length} of {participants.length} entries
          </span>
        </div>

        {/* Interactive Data Table */}
        <div className="overflow-x-auto min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            </div>
          ) : filteredParticipants.length === 0 ? (
            <div className="text-center py-20 text-zinc-500 space-y-3">
              <Archive className="w-10 h-10 text-zinc-600 mx-auto" />
              <p className="text-xs">No historical participant records match your query.</p>
              {participants.length === 0 && (
                <p className="text-[11px] text-zinc-600 max-w-md mx-auto">
                  Click <strong>&quot;Archive &amp; Clear Live Tables&quot;</strong> to preserve your current festival participants, or manually add entries using the button above.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/5 text-[10px] uppercase tracking-widest text-zinc-500 font-black">
                  <th className="py-4 px-3 text-center w-10">Select</th>
                  <th className="py-4 px-4">Participant & Contact</th>
                  <th className="py-4 px-4">Category & Class</th>
                  <th className="py-4 px-4">Institution / School</th>
                  <th className="py-4 px-4">Season</th>
                  <th className="py-4 px-4">TrxID & Events</th>
                  <th className="py-4 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredParticipants.map((p) => {
                  const isSelected = !!selectedParticipants[p.id];
                  return (
                    <tr 
                      key={p.id} 
                      className={`hover:bg-white/[0.02] transition-colors ${isSelected ? 'bg-amber-500/5' : ''}`}
                    >
                      <td className="py-4 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            setSelectedParticipants(prev => ({
                              ...prev,
                              [p.id]: e.target.checked
                            }));
                          }}
                          className="rounded border-zinc-700 bg-zinc-900 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </td>

                      <td className="py-4 px-4">
                        <p className="font-bold text-white text-sm">{p.full_name}</p>
                        <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{p.email || 'No email saved'}</p>
                        {(p.phone || p.bkash_number) && (
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            📱 {p.phone || p.bkash_number}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20 block w-fit">
                          {getCategoryLabel(p.source_table)}
                        </span>
                        {p.academic_class && (
                          <p className="text-[11px] text-zinc-400 mt-1 font-medium">
                            Class: {p.academic_class} {p.section ? `(${p.section})` : ''}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-zinc-300 font-medium">
                        <p className="line-clamp-2 max-w-[200px]">{p.school || '—'}</p>
                      </td>

                      <td className="py-4 px-4 font-mono">
                        <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-amber-400 font-bold text-[10px]">
                          {p.academic_year || 'Historical'}
                        </span>
                      </td>

                      <td className="py-4 px-4 font-mono text-[11px]">
                        <p className="text-zinc-300 font-bold">TrxID: {p.trxnid || '—'}</p>
                        {p.selected_events && (
                          <p className="text-[10px] text-indigo-300 line-clamp-1 max-w-[180px] mt-0.5">
                            {p.selected_events}
                          </p>
                        )}
                      </td>

                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (p.email) {
                                setTestEmailAddress(p.email);
                                showToast(`Target email set to ${p.email}. Check test sender.`, 'info');
                              }
                            }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                            title="Quick Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(p.id, p.full_name)}
                            className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-all cursor-pointer"
                            title="Delete from archive"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CONFIRMATION MODAL FOR ARCHIVE & DATABASE CLEAR */}
      {showArchiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-red-500/30 p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-red-400 font-black text-sm uppercase tracking-wider">
                <ShieldAlert className="w-6 h-6" />
                <span>Confirm Participant Archival</span>
              </div>
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="p-2 rounded-xl text-zinc-500 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <p className="leading-relaxed">
                You are about to archive <strong className="text-white">{liveCounts.total_live} active participants</strong> from live tables into the permanent <code className="text-amber-300">previous_year_participants</code> vault and clear the live records.
              </p>

              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 space-y-2">
                <span className="font-bold text-red-400 block uppercase tracking-wider text-[11px]">
                  Safety Guarantee:
                </span>
                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  ✓ Participant email addresses, phone numbers, full names, school affiliations, classes, and transaction records will be <strong>permanently saved</strong> into the historical archive.<br />
                  ✓ The live registration tables will be cleared and reset for the fresh championship season.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 block">
                  Type <span className="text-amber-400">ARCHIVE &amp; CLEAR</span> below to confirm:
                </label>
                <input
                  type="text"
                  value={archiveConfirmText}
                  onChange={(e) => setArchiveConfirmText(e.target.value)}
                  placeholder="ARCHIVE & CLEAR"
                  className="w-full px-4 py-2.5 bg-black border border-white/10 rounded-xl text-xs text-white font-mono font-bold uppercase tracking-wider outline-none focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowArchiveModal(false)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={archiving || archiveConfirmText.trim().toUpperCase() !== 'ARCHIVE & CLEAR'}
                onClick={handleArchiveAndClear}
                className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {archiving && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>Execute Archival &amp; Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR ADDING MANUAL PARTICIPANT */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-zinc-950 border border-white/10 p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-black text-sm uppercase tracking-wider">
                <Plus className="w-5 h-5 text-amber-500" />
                <span>Add Historical Participant Manually</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-zinc-500 hover:text-white bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddParticipant} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={newParticipant.full_name}
                  onChange={(e) => setNewParticipant(prev => ({ ...prev, full_name: e.target.value }))}
                  placeholder="e.g. Tanzim Ahmed"
                  className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newParticipant.email}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="student@example.com"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={newParticipant.phone}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Institution / School
                  </label>
                  <input
                    type="text"
                    value={newParticipant.school}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, school: e.target.value }))}
                    placeholder="School or College Name"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Class / Grade
                  </label>
                  <input
                    type="text"
                    value={newParticipant.academic_class}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, academic_class: e.target.value }))}
                    placeholder="e.g. Class 10"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Academic Year Season
                  </label>
                  <input
                    type="text"
                    value={newParticipant.academic_year}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, academic_year: e.target.value }))}
                    placeholder="2025-2026"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Selected Events
                  </label>
                  <input
                    type="text"
                    value={newParticipant.selected_events}
                    onChange={(e) => setNewParticipant(prev => ({ ...prev, selected_events: e.target.value }))}
                    placeholder="Math Olympiad, Rubik's Cube"
                    className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-300 uppercase tracking-wider font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingParticipant}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heavy uppercase tracking-wider flex items-center gap-2"
                >
                  {addingParticipant && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Record</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
