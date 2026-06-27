"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Filter,
  User,
  School,
  FileText,
  ShieldCheck,
  RefreshCw,
  X,
  FileSpreadsheet,
  Calendar,
  Layers,
  Sparkles
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { matchesSearchWithFuzzy } from "../../../lib/utils";

interface EventRegistrationRow {
  id: string;
  user_id: string;
  full_name: string;
  class: string;
  section: string;
  roll: string;
  bkash_number: string;
  trxnid: string;
  amount: number;
  selected_events: string;
  verified: "yes" | "no" | "rejected";
  registered_by: string;
  verified_by?: string;
  created_at: string;
  tableName: string;
  email?: string;
  member_id?: string;
}

export function EventRegistrationsSection() {
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "yes" | "no" | "rejected">("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [showUniqueOnly, setShowUniqueOnly] = useState<boolean>(true); // default to true to show unique participants
  const [selectedRegistrant, setSelectedRegistrant] = useState<EventRegistrationRow | null>(null);

  const fetchAllRegistrations = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    setError(null);
    try {
      const tables = [
        "primary_events",
        "junior_events",
        "secondary_events",
        "higher_secondary_events",
      ];
      let allReg: EventRegistrationRow[] = [];

      for (const tb of tables) {
        const { data, error: tableErr } = await supabase
          .from(tb)
          .select("*");

        if (tableErr) {
          console.error(`Error fetching registrations from ${tb}:`, tableErr);
          continue;
        }

        if (data && data.length > 0) {
          // Collect user IDs for profiles and member ID fetch
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          let emailsMap: Record<string, string> = {};
          let memberIdsMap: Record<string, string> = {};
          
          if (userIds.length > 0) {
            // Fetch both in parallel for optimal throughput
            const [profsRes, memberRes] = await Promise.all([
              supabase
                .from("profiles")
                .select("id, email")
                .in("id", userIds),
              supabase
                .from("member")
                .select("id, member_id")
                .in("id", userIds)
            ]);

            if (!profsRes.error && profsRes.data) {
              profsRes.data.forEach((p: any) => {
                emailsMap[p.id] = p.email;
              });
            }

            if (!memberRes.error && memberRes.data) {
              memberRes.data.forEach((m: any) => {
                memberIdsMap[m.id] = m.member_id;
              });
            }
          }

          const mapped = data.map((item: any) => {
            let normVerified: "yes" | "no" | "rejected" = "no";
            if (item.verified === true || item.verified === "yes") {
              normVerified = "yes";
            } else if (item.verified === "rejected") {
              normVerified = "rejected";
            } else if (item.verified === false || item.verified === "no") {
              normVerified = "no";
            }

            return {
              ...item,
              tableName: tb,
              verified: normVerified,
              email: emailsMap[item.user_id] || item.registered_by || "",
              member_id: memberIdsMap[item.user_id] || "",
            };
          });

          allReg = [...allReg, ...mapped];
        }
      }

      // Sort by created_at descending
      allReg.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });

      setRegistrations(allReg);
    } catch (err: any) {
      console.error("Error fetching all registration submissions:", err);
      setError(err.message || "Could not retrieve event registration details from the database.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRegistrations();
  }, [fetchAllRegistrations]);

  // Compute Deduplicated/Unique list of people dynamically
  const uniquePeopleList = useMemo(() => {
    const uniqueMap = new Map<string, EventRegistrationRow>();

    registrations.forEach((item) => {
      // Normalize values to create a unique fingerprint for each person
      const nameKey = (item.full_name || "").trim().toLowerCase();
      const classKey = (item.class || "").trim().toLowerCase();
      const secKey = (item.section || "").trim().toLowerCase();
      const rollKey = (item.roll || "").trim().toLowerCase();
      const key = `${nameKey}_class_${classKey}_sec_${secKey}_roll_${rollKey}`;

      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, item);
      } else {
        const existing = uniqueMap.get(key)!;
        // Prioritize verified records over non-verified
        const existingIsVerified = existing.verified === "yes";
        const newIsVerified = item.verified === "yes";

        if (!existingIsVerified && newIsVerified) {
          uniqueMap.set(key, item);
        } else if (existingIsVerified === newIsVerified) {
          // Keep the newer submission if verification status is identical
          const existingTime = existing.created_at ? new Date(existing.created_at).getTime() : 0;
          const newTime = item.created_at ? new Date(item.created_at).getTime() : 0;
          if (newTime > existingTime) {
            uniqueMap.set(key, item);
          }
        }
      }
    });

    return Array.from(uniqueMap.values());
  }, [registrations]);

  // Dynamic set of classes for class filter dropdown
  const classesDropdownList = useMemo(() => {
    const sourceList = showUniqueOnly ? uniquePeopleList : registrations;
    return Array.from(
      new Set(sourceList.map((log) => log.class).filter((c) => c && c.trim() !== ""))
    ).sort((a, b) => {
      const numA = parseInt(a, 10);
      const numB = parseInt(b, 10);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });
  }, [registrations, uniquePeopleList, showUniqueOnly]);

  // Combined Active Dataset
  const activeDataset = showUniqueOnly ? uniquePeopleList : registrations;

  // Filtered List execution
  const filteredRegistrants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return activeDataset.filter((reg) => {
        // Status Filter
        if (statusFilter !== "all" && reg.verified !== statusFilter) {
          return false;
        }
        // Table Level Filter
        if (tableFilter !== "all" && reg.tableName !== tableFilter) {
          return false;
        }
        // Class Filter
        if (classFilter !== "all" && reg.class !== classFilter) {
          return false;
        }
        return true;
      });
    }

    const scoredList = activeDataset
      .map((reg) => {
        // Status Filter
        if (statusFilter !== "all" && reg.verified !== statusFilter) {
          return { item: reg, matches: false, score: 999 };
        }
        // Table Level Filter
        if (tableFilter !== "all" && reg.tableName !== tableFilter) {
          return { item: reg, matches: false, score: 999 };
        }
        // Class Filter
        if (classFilter !== "all" && reg.class !== classFilter) {
          return { item: reg, matches: false, score: 999 };
        }

        const matchRes = matchesSearchWithFuzzy(reg, q, {
          nameField: 'full_name',
          secondaryFields: ['email', 'member_id', 'phone', 'class', 'section', 'roll', 'trxnid', 'bkash_number', 'selected_events']
        });

        return { item: reg, matches: matchRes.matches, score: matchRes.score };
      })
      .filter((res) => res.matches);

    scoredList.sort((a, b) => a.score - b.score);
    return scoredList.map((res) => res.item);
  }, [activeDataset, statusFilter, tableFilter, classFilter, searchQuery]);

  // Metric Summaries
  const metrics = useMemo(() => {
    const totalForms = registrations.length;
    const uniquePeople = uniquePeopleList.length;
    const verifiedUnique = uniquePeopleList.filter(p => p.verified === "yes").length;
    const pendingForms = registrations.filter(r => r.verified === "no").length;

    return {
      totalForms,
      uniquePeople,
      verifiedUnique,
      pendingForms
    };
  }, [registrations, uniquePeopleList]);

  // Export Filtered Table to CSV File
  const handleExportCSV = () => {
    if (filteredRegistrants.length === 0) return;

    // Headers
    const headers = [
      "Full Name",
      "Unique Ticket/Member ID",
      "Class",
      "Section",
      "Roll",
      "Bkash Number",
      "Transaction ID",
      "Amount Paid",
      "Registered Events",
      "Verification Status",
      "Account Email",
      "Submission Date",
      "Registration Portal/Category"
    ];

    // CSV format values
    const rows = filteredRegistrants.map((reg) => [
      `"${reg.full_name.replace(/"/g, '""')}"`,
      `"${reg.member_id || "PENDING"}"`,
      `"${reg.class}"`,
      `"${reg.section.replace(/"/g, '""')}"`,
      `"${reg.roll}"`,
      `"'${reg.bkash_number}"`, // Prefix with ' to treat as text in Excel
      `"${reg.trxnid}"`,
      reg.amount,
      `"${(reg.selected_events || "").replace(/"/g, '""')}"`,
      `"${reg.verified.toUpperCase()}"`,
      `"${reg.email || ""}"`,
      `"${reg.created_at ? new Date(reg.created_at).toLocaleString() : ""}"`,
      `"${reg.tableName.replace(/_/g, " ").toUpperCase()}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const fileName = showUniqueOnly 
      ? "Unique_Event_Registrants_Export.csv" 
      : "All_Registration_Submissions_Export.csv";
      
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black tracking-widest uppercase">
              Registration Audits
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Server Sync
            </span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4 mt-2">
            <Users className="w-8 h-8 text-amber-500" />
            Unique Event Registrants
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Browse, manage, and verify unique people who submitted registrations, alongside their payment details & verification statuses.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredRegistrants.length === 0}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-extrabold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export CSV ({filteredRegistrants.length})
          </button>

          <button
            onClick={fetchAllRegistrations}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading ? "Syncing..." : "Sync Database"}
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* KPI 1 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Form Submissions</div>
            <div className="text-2xl font-black text-white mt-1">{metrics.totalForms}</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Unique People Submitter</div>
            <div className="text-2xl font-black text-purple-400 mt-1">{metrics.uniquePeople}</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/5 rounded-full blur-2xl group-hover:bg-green-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Unique Done / Verified</div>
            <div className="text-2xl font-black text-green-400 mt-1">{metrics.verifiedUnique}</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl group-hover:bg-red-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pending Verification</div>
            <div className="text-2xl font-black text-red-400 mt-1">{metrics.pendingForms}</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold">Fetch Warning</p>
            <p className="text-zinc-500 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Settings Panel & Search Filters */}
      <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2rem] space-y-5">
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
          {/* Unique Toggle selection tab */}
          <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-2xl max-w-sm">
            <button
              onClick={() => {
                setShowUniqueOnly(true);
                setClassFilter("all");
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                showUniqueOnly
                  ? "bg-amber-500 text-black font-black"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Unique People ({metrics.uniquePeople})
            </button>
            <button
              onClick={() => {
                setShowUniqueOnly(false);
                setClassFilter("all");
              }}
              className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                !showUniqueOnly
                  ? "bg-amber-500 text-black font-black"
                  : "text-zinc-500 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              All Submissions ({metrics.totalForms})
            </button>
          </div>

          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
            {showUniqueOnly 
              ? "⚡ DEDUPLICATING multiple submissions by Name + Class + Section + Roll. Showing the highest priority record." 
              : "📋 DISPLAYING raw table logs. Duplicate participants may appear if they made multiple payment attempts."
            }
          </div>
        </div>

        {/* Filter Controls Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          {/* Advanced Search Input */}
          <div className="relative col-span-1 lg:col-span-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people, trxnid, phone, class..."
              className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-xs font-bold"
            />
          </div>

          {/* Status filter dropdown */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl">
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
            >
              <option value="all" className="bg-neutral-900 text-white">All Statuses</option>
              <option value="yes" className="bg-neutral-900 text-white">Verified Only (Done)</option>
              <option value="no" className="bg-neutral-900 text-white">Pending Only</option>
              <option value="rejected" className="bg-neutral-900 text-white">Rejected Only</option>
            </select>
          </div>

          {/* Table Level filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={tableFilter}
              onChange={(e) => {
                setTableFilter(e.target.value);
                setClassFilter("all");
              }}
              className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
            >
              <option value="all" className="bg-neutral-900 text-white">All Table Sections</option>
              <option value="primary_events" className="bg-neutral-900 text-white">Primary (Class 3-5)</option>
              <option value="junior_events" className="bg-neutral-900 text-white">Junior (Class 6-8)</option>
              <option value="secondary_events" className="bg-neutral-900 text-white">Secondary (Class 9-10)</option>
              <option value="higher_secondary_events" className="bg-neutral-900 text-white">Higher Secondary (Class 11-12)</option>
            </select>
          </div>

          {/* Class filter */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl">
            <School className="w-3.5 h-3.5 text-zinc-400" />
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
            >
              <option value="all" className="bg-neutral-900 text-white">All Class Levels</option>
              {classesDropdownList.map((cls) => (
                <option key={cls} value={cls} className="bg-neutral-900 text-white">
                  Class {cls}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid table list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl animate-pulse flex flex-col gap-3">
              <div className="h-4 bg-zinc-800 rounded w-1/4" />
              <div className="h-3 bg-zinc-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredRegistrants.length === 0 ? (
        <div className="bg-white/[0.01] border border-dashed border-white/10 p-16 text-center rounded-[2.5rem] max-w-4xl mx-auto">
          <Users className="w-16 h-16 text-zinc-700 mx-auto mb-6 opacity-35 animate-pulse" />
          <p className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
            No matching participants found
          </p>
          <p className="text-xs text-zinc-600 mt-2 font-medium">
            Adjust your filter presets, toggle raw submissions, or search for other names to view audit records.
          </p>
        </div>
      ) : (
        <div className="bg-[#0b0b0b]/60 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">FullName / Identity</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Unique Ticket ID</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Class / Sec / Roll</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Selected Events</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Payment Gateway Details</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Amount</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {filteredRegistrants.map((reg) => (
                  <tr key={reg.id} className="hover:bg-white/[0.01] transition-all">
                    {/* Identity Info */}
                    <td className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                          <User className="w-4 h-4 text-zinc-400" />
                        </div>
                        <div>
                          <div className="font-bold text-white text-xs">{reg.full_name || "N/A"}</div>
                          <div className="font-mono text-[9px] text-zinc-500 mt-0.5 break-all">
                            {reg.email || "No connected email"}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Unique Ticket ID */}
                    <td className="p-5">
                      {reg.member_id ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="font-mono font-bold text-[11px] text-amber-400 tracking-wider bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            {reg.member_id}
                          </span>
                          {reg.member_id.startsWith("JMC-") ? (
                            <span className="text-[7px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-500/10 px-1 py-0.5 rounded">
                              General Member
                            </span>
                          ) : (
                            <span className="text-[7px] font-extrabold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-1 py-0.5 rounded">
                              Event Ticket
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-zinc-600 font-mono text-[9px] bg-white/5 px-2 py-1 rounded border border-white/5">
                          PENDING VERIFICATION
                        </span>
                      )}
                    </td>

                    {/* Class/Sec/Roll */}
                    <td className="p-5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold text-zinc-300">Class {reg.class}</div>
                        <div className="font-mono text-[9px] text-zinc-500 uppercase tracking-wider">
                          Sec: <span className="text-zinc-300 font-bold">{reg.section}</span> | Roll: <span className="text-zinc-300 font-bold">{reg.roll}</span>
                        </div>
                      </div>
                    </td>

                    {/* Selected Events list */}
                    <td className="p-5">
                      <div className="text-xs text-amber-500 font-black max-w-xs truncate" title={reg.selected_events}>
                        {reg.selected_events}
                      </div>
                    </td>

                    {/* Payment references */}
                    <td className="p-5">
                      <div className="space-y-0.5">
                        <div className="text-xs font-bold font-mono text-zinc-300 flex items-center gap-1.5">
                          <span className="text-[10px] text-zinc-500 bg-white/5 px-1.5 py-0.5 rounded">TrxID</span>
                          {reg.trxnid}
                        </div>
                        <div className="font-mono text-[9px] text-zinc-500">
                          bKash: <span className="text-zinc-400">{reg.bkash_number}</span>
                        </div>
                      </div>
                    </td>

                    {/* Amount money */}
                    <td className="p-5">
                      <span className="text-xs font-black text-white bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded">
                        ৳ {reg.amount}
                      </span>
                    </td>

                    {/* Verified/No/Rejected with clean indicators */}
                    <td className="p-5">
                      {reg.verified === "yes" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-extrabold border border-green-500/20">
                          <span className="w-1 h-1 rounded-full bg-green-400" />
                          VERIFIED
                        </span>
                      ) : reg.verified === "rejected" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500/80 text-[10px] font-extrabold border border-red-500/20">
                          <span className="w-1 h-1 rounded-full bg-red-400" />
                          REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-yellow-500/10 text-yellow-400 text-[10px] font-extrabold border border-yellow-500/20">
                          <span className="w-1 h-1 rounded-full bg-yellow-400 animate-pulse" />
                          PENDING
                        </span>
                      )}
                    </td>

                    {/* Action button */}
                    <td className="p-5 text-right">
                      <button
                        onClick={() => setSelectedRegistrant(reg)}
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-800 hover:border-white/10 transition-all font-bold text-[9px] uppercase tracking-widest cursor-pointer inline-flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-500" />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Registrant Inspector modal popup */}
      {selectedRegistrant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-[#080808] max-w-2xl w-full p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative shadow-2xl">
            {/* Title banner */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
                <h3 className="text-md font-black text-white uppercase tracking-wider">
                  Registrant Detail Invoice Inspect
                </h3>
              </div>
              <button
                onClick={() => setSelectedRegistrant(null)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-500 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Layout details */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Full Legal Name</p>
                  <p className="text-white font-black text-xs mt-1">{selectedRegistrant.full_name}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Unique Ticket/Member ID</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {selectedRegistrant.member_id ? (
                      <>
                        <span className="font-mono font-bold text-xs text-amber-400 tracking-wider bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {selectedRegistrant.member_id}
                        </span>
                        {selectedRegistrant.member_id.startsWith("JMC-") ? (
                          <span className="text-[7.5px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-500/10 px-1 py-0.5 rounded">
                            Member
                          </span>
                        ) : (
                          <span className="text-[7.5px] font-extrabold text-blue-400 uppercase tracking-wider bg-blue-500/10 px-1 py-0.5 rounded">
                            Ticket
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-zinc-600 font-mono text-[9px]">PENDING</span>
                    )}
                  </div>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Connected Profile Identity</p>
                  <p className="text-amber-500 font-mono text-[10px] font-bold mt-1.5 break-all">{selectedRegistrant.email || "No connected user"}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Class Level</p>
                  <p className="text-white font-black text-xs mt-1">Class {selectedRegistrant.class}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Section Name</p>
                  <p className="text-white font-black text-xs mt-1">{selectedRegistrant.section}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Roll Assignment</p>
                  <p className="text-white font-black text-xs mt-1">Roll {selectedRegistrant.roll}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5 col-span-1">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Verification State</p>
                  <div className="mt-2">
                    {selectedRegistrant.verified === "yes" ? (
                      <span className="px-2.5 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[10px]">
                        APPROVED
                      </span>
                    ) : selectedRegistrant.verified === "rejected" ? (
                      <span className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-550 font-black text-[10px]">
                        REJECTED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 font-black text-[10px] animate-pulse">
                        PENDING
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5 col-span-2">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Category Table Sync</p>
                  <p className="text-zinc-300 font-mono text-[10px] font-bold mt-1.5">
                    {selectedRegistrant.tableName.replace(/_/g, " ").toUpperCase()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">bKash Number</p>
                  <p className="text-white font-bold font-mono mt-1">{selectedRegistrant.bkash_number}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Transaction TrxID</p>
                  <p className="text-amber-500 font-bold font-mono mt-1">{selectedRegistrant.trxnid}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Amount Paid</p>
                  <p className="text-green-400 font-black mt-1">৳ {selectedRegistrant.amount}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Registered By</p>
                  <p className="text-white font-bold font-mono mt-1">{selectedRegistrant.registered_by || "Self (Online)"}</p>
                </div>
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Verified/Approved By</p>
                  <p className="text-emerald-400 font-bold font-mono mt-1">{selectedRegistrant.verified_by || (selectedRegistrant.verified === "yes" ? "System / Auto" : "Pending Approval")}</p>
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider mb-2">Registered Events List</p>
                <div className="text-white font-extrabold bg-amber-500/5 px-4 py-3 rounded-2xl border border-amber-500/10 text-xs">
                  {selectedRegistrant.selected_events}
                </div>
              </div>

              <div>
                <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider mb-1.5">Log Metadata</p>
                <div className="font-mono text-[9px] text-zinc-500">
                  Submited on: <span className="text-zinc-300">{selectedRegistrant.created_at ? new Date(selectedRegistrant.created_at).toLocaleString() : "N/A"}</span>
                  <br />
                  Registration reference identification key: <span className="text-zinc-300">{selectedRegistrant.id}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                onClick={() => setSelectedRegistrant(null)}
                className="px-6 py-3 cursor-pointer bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-amber-500/10"
              >
                Close Inspect Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
