"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  Mail, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Filter,
  User,
  Hash,
  School,
  FileText,
  ShieldCheck,
  RefreshCw,
  X
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";

interface EmailLog {
  id: string;
  recipient_email: string;
  recipient_name: string;
  recipient_class: string;
  recipient_section: string;
  recipient_roll: string;
  subject: string;
  body_text: string;
  verified_by: string;
  sent_at: string;
  status: string;
  error_message: string;
}

export function EmailConfirmationsSection() {
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  const fetchEmailLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("email_confirmations_sent")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          setError("The 'email_confirmations_sent' table does not exist in your database yet. Ensure the latest SQL schema is deployed.");
        } else {
          setError(error.message);
        }
        setEmailLogs([]);
      } else {
        setEmailLogs(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching email logs:", err);
      setError(err.message || "An unexpected error occurred while fetching email logs.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmailLogs();
  }, [fetchEmailLogs]);

  // Unique Classes for filtering
  const classesList = Array.from(
    new Set(
      emailLogs
        .map((log) => log.recipient_class)
        .filter((c) => c && c.trim() !== "")
    )
  ).sort();

  // Filter & Search Logic
  const filteredLogs = emailLogs.filter((log) => {
    // 1. Status Filter
    if (statusFilter !== "all" && log.status !== statusFilter) {
      return false;
    }

    // 2. Class Filter
    if (classFilter !== "all" && log.recipient_class !== classFilter) {
      return false;
    }

    // 3. Search Query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      const matchName = (log.recipient_name || "").toLowerCase().includes(query);
      const matchEmail = (log.recipient_email || "").toLowerCase().includes(query);
      const matchClass = (log.recipient_class || "").toLowerCase().includes(query);
      const matchSection = (log.recipient_section || "").toLowerCase().includes(query);
      const matchRoll = (log.recipient_roll || "").toLowerCase().includes(query);
      const matchAdmin = (log.verified_by || "").toLowerCase().includes(query);
      const matchSubject = (log.subject || "").toLowerCase().includes(query);

      return (
        matchName || 
        matchEmail || 
        matchClass || 
        matchSection || 
        matchRoll || 
        matchAdmin || 
        matchSubject
      );
    }

    return true;
  });

  // Calculate Metrics
  const totalSentCount = emailLogs.filter(l => l.status === "sent").length;
  const totalFailedCount = emailLogs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <Mail className="w-8 h-8 text-amber-500 animate-pulse" />
            Email Confirmations Log
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Audit automatic notification dispatches, recipient demographics, and verifying administrators.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={fetchEmailLogs}
          disabled={isLoading}
          className="lg:self-end px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 disabled:bg-amber-500/50 hover:shadow-lg hover:shadow-amber-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
          {isLoading ? "Refreshing..." : "Refresh logs"}
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Dispatched</div>
            <div className="text-2xl font-black text-white mt-1">{emailLogs.length}</div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Sent Successfully</div>
            <div className="text-2xl font-black text-green-400 mt-1">{totalSentCount}</div>
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Failed Dispatches</div>
            <div className="text-2xl font-black text-red-400 mt-1">{totalFailedCount}</div>
          </div>
        </div>
      </div>

      {/* DB Setup Warning if any */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div className="space-y-1">
            <p className="font-bold">Database Sync Notice</p>
            <p className="text-zinc-400">{error}</p>
          </div>
        </div>
      )}

      {/* Filters & Search Control Grid */}
      <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Advanced Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, class, section, roll, or admin..."
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-xs font-bold"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer"
            >
              <option value="all" className="bg-neutral-900 text-white">All Statuses</option>
              <option value="sent" className="bg-neutral-900 text-white">Dispatched Only</option>
              <option value="failed" className="bg-neutral-900 text-white">Failed Only</option>
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
            <School className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer"
            >
              <option value="all" className="bg-neutral-900 text-white">All Classes</option>
              {classesList.map((cls) => (
                <option key={cls} value={cls} className="bg-neutral-900 text-white">
                  Class {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl animate-pulse flex flex-col gap-3">
              <div className="h-4 bg-zinc-800 rounded w-1/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white/[0.01] border border-dashed border-white/10 p-16 text-center rounded-[2.5rem] max-w-4xl mx-auto">
          <Mail className="w-16 h-16 text-zinc-700 mx-auto mb-6 opacity-30 animate-pulse" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
            No matching email receipts found
          </p>
          <p className="text-xs text-zinc-600 mt-2 font-medium">
            Adjust your search query or trigger registration approvals to capture new records.
          </p>
        </div>
      ) : (
        <div className="bg-[#0b0b0b]/60 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Recipient Demographics</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Class/Sec/Roll</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Log Subject</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Confirming Admin</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Dispatched At</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                    {/* Recipient info: Name + Email */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{log.recipient_name || "Anonymous Member"}</div>
                          <div className="font-mono text-[10px] text-zinc-500 mt-0.5">{log.recipient_email}</div>
                        </div>
                      </div>
                    </td>

                    {/* Class / Section / Roll */}
                    <td className="p-5">
                      <div className="space-y-1">
                        <div className="text-xs text-zinc-300">
                          Class <span className="font-bold text-white">{log.recipient_class || "--"}</span>
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500">
                          Sec: <span className="text-zinc-300 font-bold">{log.recipient_section || "--"}</span> | Roll: <span className="text-zinc-300 font-bold">{log.recipient_roll || "--"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Email Subject preview */}
                    <td className="p-5">
                      <div className="text-xs text-zinc-300 max-w-xs truncate" title={log.subject}>
                        {log.subject}
                      </div>
                    </td>

                    {/* Who verified it */}
                    <td className="p-5">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                        <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-amber-500 text-[10px] font-mono">
                          {log.verified_by || "System / Auto"}
                        </span>
                      </div>
                    </td>

                    {/* Datetime stamp */}
                    <td className="p-5 text-xs text-zinc-400 font-medium whitespace-nowrap">
                      {log.sent_at ? new Date(log.sent_at).toLocaleString() : "N/A"}
                    </td>

                    {/* Dispatch status */}
                    <td className="p-5">
                      {log.status === "sent" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-extrabold border border-green-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                          DISPATCHED
                        </span>
                      ) : (
                        <span 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-extrabold border border-red-500/20 cursor-help" 
                          title={log.error_message || "Unknown error occurred"}
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                          FAILED
                        </span>
                      )}
                    </td>

                    {/* Details modal prompt */}
                    <td className="p-5 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Audit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modern Popover receipt Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-[#080808] max-w-2xl w-full p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative shadow-2xl">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-amber-500" />
                <h3 className="text-md font-black text-white uppercase tracking-wider">
                  Verification Confirmation Payload
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Structured attributes */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Recipient Name / JMC ID</p>
                  <p className="text-white font-black text-sm mt-1">{selectedLog.recipient_name || "N/A"}</p>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Recipient Email address</p>
                  <p className="text-amber-500 font-mono text-xs font-bold mt-1.5 break-all">{selectedLog.recipient_email}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Class</p>
                  <p className="text-white font-bold mt-1">Class {selectedLog.recipient_class || "--"}</p>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Section</p>
                  <p className="text-white font-bold mt-1">{selectedLog.recipient_section || "--"}</p>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Roll</p>
                  <p className="text-white font-bold mt-1">Roll {selectedLog.recipient_roll || "--"}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Approved/Rejected By Admin</p>
                  <p className="text-white font-mono font-bold mt-1 text-xs">{selectedLog.verified_by || "System"}</p>
                </div>
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Dispatched Timestamp</p>
                  <p className="text-zinc-400 font-medium mt-1">
                    {selectedLog.sent_at ? new Date(selectedLog.sent_at).toLocaleString() : "N/A"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider mb-2">Subject Header</p>
                <div className="text-white font-bold bg-white/5 px-4 py-3 rounded-2xl border border-white/5 text-xs">
                  {selectedLog.subject}
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider mb-2">Email Body Text Context</p>
                <div className="bg-black/80 font-mono text-[11px] p-5 rounded-2xl border border-white/5 text-zinc-300 whitespace-pre-wrap max-h-40 overflow-y-auto leading-relaxed scrollbar-thin">
                  {selectedLog.body_text || "No custom preview text stored."}
                </div>
              </div>

              {selectedLog.status !== "sent" && selectedLog.error_message && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
                  <p className="text-[9px] font-black uppercase tracking-wider mb-1">Dispatch Error logs</p>
                  <p className="font-mono text-[10px] break-all">{selectedLog.error_message}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-3 cursor-pointer bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
