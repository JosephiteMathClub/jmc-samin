"use client";
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  User, 
  Calendar, 
  CheckCircle,
  XCircle,
  PlusCircle,
  Edit2,
  Database,
  Globe,
  HelpCircle,
  AlertTriangle
} from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import ConfirmModal from '../../ConfirmModal';

interface AuditLog {
  id: string;
  admin_id: string;
  admin_email: string;
  admin_name: string;
  action_type: string;
  target: string;
  details: string;
  created_at: string;
}

interface DashboardAuditLogsSectionProps {
  supabase: any;
  shouldReduceGfx?: boolean;
}

export function DashboardAuditLogsSection({ supabase, shouldReduceGfx = false }: DashboardAuditLogsSectionProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [adminFilter, setAdminFilter] = useState('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const { showToast } = useToast();

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLogs(data || []);
    } catch (err: any) {
      console.error('Failed to fetch audit logs:', err);
      showToast('Error loading audit logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [supabase, showToast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Filter unique lists for dropdowns
  const adminEmails = useMemo(() => {
    const list = new Set(logs.map(log => log.admin_email).filter(Boolean));
    return Array.from(list);
  }, [logs]);

  const actionTypes = useMemo(() => {
    const list = new Set(logs.map(log => log.action_type).filter(Boolean));
    return Array.from(list);
  }, [logs]);

  // Handle Clear History
  const handleClearHistory = async () => {
    setClearing(true);
    try {
      // 1. Get current admin session info to log the clear operation
      const { data: { user } } = await supabase.auth.getUser();
      let adminName = 'Super Admin';
      let adminEmail = user?.email || 'superadmin@example.com';
      
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', user.id)
          .maybeSingle();
        if (profile?.full_name) adminName = profile.full_name;
        if (profile?.email) adminEmail = profile.email;
      }

      // 2. Delete existing logs
      const { error } = await supabase
        .from('admin_audit_logs')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletes all rows safely

      if (error) throw error;

      // 3. Insert one log entry recording this clearing action
      await supabase.from('admin_audit_logs').insert({
        admin_id: user?.id || null,
        admin_email: adminEmail,
        admin_name: adminName,
        action_type: 'CLEAR_AUDIT_LOGS',
        target: 'Audit Log System',
        details: 'Audit log history was cleared and verified by Super Administrator.'
      });

      showToast('Audit log history cleared and verified successfully!', 'success');
      setShowClearConfirm(false);
      await fetchLogs();
    } catch (err: any) {
      console.error('Failed to clear logs:', err);
      showToast('Failed to clear logs: ' + err.message, 'error');
    } finally {
      setClearing(false);
    }
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
        log.admin_email?.toLowerCase().includes(search.toLowerCase()) ||
        log.target?.toLowerCase().includes(search.toLowerCase()) ||
        log.details?.toLowerCase().includes(search.toLowerCase());

      const matchesAction = actionFilter === 'ALL' || log.action_type === actionFilter;
      const matchesAdmin = adminFilter === 'ALL' || log.admin_email === adminFilter;

      return matchesSearch && matchesAction && matchesAdmin;
    });
  }, [logs, search, actionFilter, adminFilter]);

  // Color badging based on action type
  const getActionBadgeColor = (actionType: string) => {
    switch (actionType) {
      case 'ADD_MEMBER':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'VERIFY_MEMBER':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'UNVERIFY_MEMBER':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'DELETE_MEMBER':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'UPDATE_MEMBER_PHOTO':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'CLEAR_AUDIT_LOGS':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      default:
        return 'bg-zinc-500/10 text-zinc-400 border-zinc-550/25';
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'ADD_MEMBER':
        return <PlusCircle className="w-3.5 h-3.5" />;
      case 'VERIFY_MEMBER':
        return <CheckCircle className="w-3.5 h-3.5" />;
      case 'UNVERIFY_MEMBER':
        return <XCircle className="w-3.5 h-3.5" />;
      case 'DELETE_MEMBER':
        return <Trash2 className="w-3.5 h-3.5" />;
      case 'CLEAR_AUDIT_LOGS':
        return <AlertTriangle className="w-3.5 h-3.5" />;
      default:
        return <Database className="w-3.5 h-3.5" />;
    }
  };

  return (
    <motion.div
      key="audit_logs"
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: 15 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-2">
            <History className="w-8 h-8 text-indigo-505" />
            Admin Action Audit Logs
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Track changes, operations, and general administrative updates live.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Refresh button */}
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-3 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-400 hover:text-white hover:bg-zinc-850 hover:border-zinc-700 transition duration-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Clear History Button (Super Admin) */}
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={loading || logs.length === 0}
            className="flex items-center gap-2 px-5 py-3 bg-red-501/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 hover:border-red-500/40 rounded-2xl font-bold text-sm transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
            Clear Audit History
          </button>
        </div>
      </div>

      {/* Filter and Search board */}
      <div className="p-6 rounded-[2.5rem] bg-zinc-950/40 border border-white/5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search actions, targets, admin..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 pl-11 pr-4 py-3 text-sm text-white rounded-2xl outline-none focus:border-zinc-700 transition duration-200 placeholder:text-zinc-600"
            />
          </div>

          {/* Action Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-550">
              <Filter className="w-4 h-4" />
            </span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 pl-11 pr-4 py-3 text-sm text-white rounded-2xl outline-none focus:border-zinc-700 transition duration-200 appearance-none cursor-pointer"
            >
              <option value="ALL">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>

          {/* Admin Email Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-zinc-550">
              <User className="w-4 h-4" />
            </span>
            <select
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="w-full bg-zinc-900 border border-white/5 pl-11 pr-4 py-3 text-sm text-white rounded-2xl outline-none focus:border-zinc-700 transition duration-200 appearance-none cursor-pointer"
            >
              <option value="ALL">All Administrators</option>
              {adminEmails.map(email => (
                <option key={email} value={email}>{email}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit table/grid */}
      <div className="rounded-[2.5rem] border border-white/5 bg-zinc-950/20 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-sm text-zinc-500 font-medium">Fetching secure logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-24 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center mx-auto text-zinc-650">
              <History className="w-5 h-5" />
            </div>
            <p className="text-zinc-400 font-bold">No logs matching criteria</p>
            <p className="text-xs text-zinc-600">Try adjusting filters or searching different keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-zinc-950/40 text-[10px] uppercase tracking-widest text-zinc-500 font-extrabold">
                  <th className="px-6 py-4.5 pl-8">Timestamp</th>
                  <th className="px-6 py-4.5">Administrator</th>
                  <th className="px-6 py-4.5">Action</th>
                  <th className="px-6 py-4.5">Target</th>
                  <th className="px-6 py-4.5 pr-8">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <AnimatePresence>
                  {filteredLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="hover:bg-white/[0.02] text-sm text-zinc-350 transition duration-150 group"
                    >
                      {/* Timestamp */}
                      <td className="px-6 py-4 pl-8 font-mono text-xs text-zinc-500 group-hover:text-zinc-300">
                        {new Date(log.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                          hour12: false
                        })}
                      </td>

                      {/* Admin Info */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-white tracking-tight">{log.admin_name}</div>
                        <div className="text-[10px] text-zinc-500 font-mono tracking-tighter">{log.admin_email}</div>
                      </td>

                      {/* Action Type badged */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${getActionBadgeColor(log.action_type)}`}>
                          {getActionIcon(log.action_type)}
                          {log.action_type.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Target */}
                      <td className="px-6 py-4">
                        <span className="font-medium text-zinc-200 tracking-tight">{log.target || 'N/A'}</span>
                      </td>

                      {/* Details */}
                      <td className="px-6 py-4 pr-8 max-w-xs md:max-w-md lg:max-w-xl truncate text-zinc-400 font-normal">
                        <span title={log.details}>{log.details}</span>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showClearConfirm}
        title="Clear Audit Log History"
        message="Are you absolutely sure you want to clear the administrator action audit history database? Note: This action is permanent and verified auditing indexes will be wiped completely."
        onConfirm={handleClearHistory}
        onCancel={() => setShowClearConfirm(false)}
        confirmLabel={clearing ? "Clearing..." : "Yes, Purge Audit Logs"}
        type="danger"
      />
    </motion.div>
  );
}
