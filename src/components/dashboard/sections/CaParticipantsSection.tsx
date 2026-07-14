"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Filter,
  User,
  School,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Tag,
  Coins,
  TrendingUp,
  RefreshCw,
  Building2,
  FileText
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { matchesSearchWithFuzzy } from "../../../lib/utils";

interface CaParticipantRow {
  id: string;
  user_id: string;
  full_name: string;
  class: string;
  institution: string; // resolved from section
  ca_code: string; // resolved from roll
  bkash_number: string;
  trxnid: string;
  amount: number;
  selected_events: string;
  verified: "yes" | "no" | "rejected";
  created_at: string;
  tableName: string;
  email?: string;
  phone?: string;
  member_id?: string;
}

export function CaParticipantsSection() {
  const [participants, setParticipants] = useState<CaParticipantRow[]>([]);
  const [caCodesList, setCaCodesList] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters and controls
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCaFilter, setSelectedCaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"date" | "name" | "amount" | "code">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Fetch CA Codes config
  const fetchCaCodes = async () => {
    try {
      const { data, error: err } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'inter_registration_config')
        .maybeSingle();

      if (!err && data && data.value && Array.isArray(data.value.caCodes)) {
        setCaCodesList(data.value.caCodes.map((c: string) => c.toUpperCase().trim()));
      }
    } catch (err) {
      console.error("Failed to load CA Codes settings:", err);
    }
  };

  // Fetch all registrations and filter those with CA Codes
  const fetchCaParticipants = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoading(true);
    setError(null);
    try {
      // Refresh CA codes list first
      await fetchCaCodes();

      const tables = [
        "primary_events",
        "junior_events",
        "secondary_events",
        "higher_secondary_events",
      ];
      let allParticipants: CaParticipantRow[] = [];

      for (const tb of tables) {
        const { data, error: tableErr } = await supabase
          .from(tb)
          .select("*");

        if (tableErr) {
          console.error(`Error fetching from ${tb}:`, tableErr);
          continue;
        }

        if (data && data.length > 0) {
          // Resolve emails/phones/member IDs from users in parallel
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          let emailsMap: Record<string, string> = {};
          let memberPhonesMap: Record<string, string> = {};
          let memberIdsMap: Record<string, string> = {};

          if (userIds.length > 0) {
            const [profsRes, memberRes] = await Promise.all([
              supabase
                .from("profiles")
                .select("id, email")
                .in("id", userIds),
              supabase
                .from("member")
                .select("id, member_id, phone")
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
                memberPhonesMap[m.id] = m.phone;
              });
            }
          }

          // Map and filter rows that have non-empty CA code (stored in roll)
          const mapped = data
            .filter((item: any) => item.roll && item.roll.trim() !== "")
            .map((item: any) => {
              let normVerified: "yes" | "no" | "rejected" = "no";
              if (item.verified === true || item.verified === "yes") {
                normVerified = "yes";
              } else if (item.verified === "rejected") {
                normVerified = "rejected";
              } else {
                normVerified = "no";
              }

              return {
                id: item.id || `${tb}_${item.user_id || Math.random()}`,
                user_id: item.user_id,
                full_name: item.full_name || "Anonymous",
                class: item.class || "",
                institution: item.section || "", // section column holds the institution for inter-events
                ca_code: item.roll.trim().toUpperCase(), // roll column holds the CA code
                bkash_number: item.bkash_number || "",
                trxnid: item.trxnid || "",
                amount: Number(item.amount) || 0,
                selected_events: item.selected_events || "",
                verified: normVerified,
                created_at: item.created_at || "",
                tableName: tb,
                email: emailsMap[item.user_id] || item.registered_by || "",
                phone: item.phone || memberPhonesMap[item.user_id] || "",
                member_id: memberIdsMap[item.user_id] || "",
              };
            });

          allParticipants = [...allParticipants, ...mapped];
        }
      }

      setParticipants(allParticipants);
    } catch (err: any) {
      console.error("Error loading CA participants:", err);
      setError(err.message || "An error occurred while loading participants with CA codes.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCaParticipants();
  }, [fetchCaParticipants]);

  // Aggregate stats
  const metrics = useMemo(() => {
    const active = participants;
    const totalCount = active.length;
    const verifiedCount = active.filter(p => p.verified === "yes").length;
    const pendingCount = active.filter(p => p.verified === "no").length;
    const totalRevenue = active.reduce((acc, p) => acc + p.amount, 0);

    // Leaderboard of CA Codes
    const caMap: Record<string, { count: number; revenue: number }> = {};
    active.forEach(p => {
      const code = p.ca_code;
      if (!caMap[code]) {
        caMap[code] = { count: 0, revenue: 0 };
      }
      caMap[code].count += 1;
      caMap[code].revenue += p.amount;
    });

    const leaderboard = Object.entries(caMap)
      .map(([code, stats]) => ({
        code,
        count: stats.count,
        revenue: stats.revenue,
        isValid: caCodesList.includes(code)
      }))
      .sort((a, b) => b.count - a.count);

    const bestAmbassador = leaderboard[0]?.code || "N/A";

    return {
      totalCount,
      verifiedCount,
      pendingCount,
      totalRevenue,
      leaderboard,
      bestAmbassador
    };
  }, [participants, caCodesList]);

  // Filter & Sort logic
  const filteredAndSortedList = useMemo(() => {
    let list = [...participants];

    // Status filter
    if (statusFilter !== "all") {
      list = list.filter(p => p.verified === statusFilter);
    }

    // CA Code filter
    if (selectedCaFilter !== "all") {
      if (selectedCaFilter === "unconfigured") {
        list = list.filter(p => !caCodesList.includes(p.ca_code));
      } else {
        list = list.filter(p => p.ca_code === selectedCaFilter);
      }
    }

    // Search query
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => 
        matchesSearchWithFuzzy(p.full_name, q) ||
        p.email?.toLowerCase().includes(q) ||
        p.phone?.includes(q) ||
        p.ca_code.toLowerCase().includes(q) ||
        p.institution.toLowerCase().includes(q) ||
        p.trxnid.toLowerCase().includes(q)
      );
    }

    // Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        comparison = dateA - dateB;
      } else if (sortBy === "name") {
        comparison = a.full_name.localeCompare(b.full_name);
      } else if (sortBy === "amount") {
        comparison = a.amount - b.amount;
      } else if (sortBy === "code") {
        comparison = a.ca_code.localeCompare(b.ca_code);
      }

      return sortOrder === "desc" ? -comparison : comparison;
    });

    return list;
  }, [participants, statusFilter, selectedCaFilter, searchQuery, sortBy, sortOrder, caCodesList]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredAndSortedList.length === 0) return;

    const headers = ["Name", "Email", "Phone", "Class", "Institution", "CA Code Used", "Events", "Amount", "bKash TrxnID", "Verified", "Date Registered"];
    const rows = filteredAndSortedList.map(p => [
      p.full_name,
      p.email || "N/A",
      p.phone || "N/A",
      p.class,
      p.institution,
      p.ca_code,
      p.selected_events,
      p.amount,
      p.trxnid,
      p.verified,
      p.created_at ? new Date(p.created_at).toLocaleDateString() : "N/A"
    ]);

    const csvContent = 
      "data:text/csv;charset=utf-8," + 
      [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CA_Participants_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleSort = (field: "date" | "name" | "amount" | "code") => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] font-black tracking-widest uppercase">
              Ambassador Track
            </span>
            <span className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-[9px] font-black tracking-widest uppercase flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> Live Stats
            </span>
          </div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4 mt-2">
            <Tag className="w-8 h-8 text-indigo-400" />
            Participants Using CA Codes
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Sort, filter, and audit participants who put Campus Ambassador (CA) codes during event registration fests.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 self-start lg:self-end">
          <button
            onClick={handleExportCSV}
            disabled={filteredAndSortedList.length === 0}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-extrabold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export CSV ({filteredAndSortedList.length})
          </button>

          <button
            onClick={fetchCaParticipants}
            disabled={isLoading}
            className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/10"
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
        {/* KPI 1: Total Registrations */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-2xl flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total CA Registrations</div>
            <div className="text-2xl font-black text-white mt-1">{metrics.totalCount}</div>
          </div>
        </div>

        {/* KPI 2: Total Revenue Generated */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Total Revenue Generated</div>
            <div className="text-2xl font-black text-emerald-400 mt-1">BDT {metrics.totalRevenue}</div>
          </div>
        </div>

        {/* KPI 3: Best Ambassador */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-2xl flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Best Performing CA</div>
            <div className="text-xl font-black text-purple-400 mt-1 truncate max-w-[140px] uppercase">{metrics.bestAmbassador}</div>
          </div>
        </div>

        {/* KPI 4: Pending Audits */}
        <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl group-hover:bg-amber-500/10 transition-all duration-500" />
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pending Verification</div>
            <div className="text-2xl font-black text-amber-400 mt-1">{metrics.pendingCount}</div>
          </div>
        </div>
      </div>

      {/* Leaderboard Grid */}
      {metrics.leaderboard.length > 0 && (
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6">
          <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> CA Code Leaderboard
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {metrics.leaderboard.map((item, index) => (
              <div 
                key={item.code} 
                onClick={() => setSelectedCaFilter(item.code === selectedCaFilter ? "all" : item.code)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer text-center relative ${
                  selectedCaFilter === item.code 
                    ? "bg-indigo-600/20 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.15)]" 
                    : item.isValid
                      ? "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                      : "bg-red-950/10 border-red-500/20 hover:bg-red-950/20"
                }`}
              >
                {!item.isValid && (
                  <span className="absolute top-2 right-2 text-[8px] bg-red-500/20 text-red-400 px-1 py-0.5 rounded uppercase font-mono font-bold tracking-tighter">
                    Invalid
                  </span>
                )}
                <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Rank #0{index + 1}</div>
                <div className="text-sm font-black text-white mt-1 uppercase truncate">{item.code}</div>
                <div className="text-xs font-black text-indigo-400 mt-2">{item.count} Regs</div>
                <div className="text-[9px] text-zinc-500 mt-0.5 font-mono">BDT {item.revenue}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search and Filters bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-3xl">
        {/* Search */}
        <div className="relative md:col-span-5 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search by name, email, phone, trxID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-xs text-white focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/5 transition-all font-medium placeholder:text-zinc-600"
          />
        </div>

        {/* CA Code Selector dropdown */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl md:col-span-3">
          <Tag className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={selectedCaFilter}
            onChange={(e) => setSelectedCaFilter(e.target.value)}
            className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
          >
            <option value="all" className="bg-neutral-900 text-white">All CA Codes</option>
            {caCodesList.map((code) => (
              <option key={code} value={code} className="bg-neutral-900 text-white">
                {code}
              </option>
            ))}
            <option value="unconfigured" className="bg-neutral-900 text-white">Unconfigured/Invalid Code</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3.5 rounded-2xl md:col-span-2">
          <Filter className="w-3.5 h-3.5 text-zinc-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
          >
            <option value="all" className="bg-neutral-900 text-white">All Statuses</option>
            <option value="yes" className="bg-neutral-900 text-green-400">Verified</option>
            <option value="no" className="bg-neutral-900 text-amber-500">Pending</option>
            <option value="rejected" className="bg-neutral-900 text-red-500">Rejected</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        <button
          onClick={() => {
            setSearchQuery("");
            setSelectedCaFilter("all");
            setStatusFilter("all");
          }}
          className="md:col-span-2 py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer text-center"
        >
          Clear Filters
        </button>
      </div>

      {/* Main Table Card */}
      {error && (
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center gap-4 text-red-500 text-xs font-bold uppercase tracking-widest">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="bg-white/[0.01] border border-white/5 rounded-3xl overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-zinc-500 font-mono tracking-widest uppercase">Fetching CA Participants...</p>
          </div>
        ) : filteredAndSortedList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <Tag className="w-12 h-12 text-zinc-700 mb-4 animate-bounce" />
            <h3 className="text-sm font-black text-white uppercase tracking-wider">No matching participants</h3>
            <p className="text-xs text-zinc-500 max-w-sm mt-2">
              There are no participants in the database matching the chosen CA codes and filter criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.01] text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                  <th className="py-5 px-6">
                    <button onClick={() => toggleSort("name")} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      Participant <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-5 px-6">
                    <button onClick={() => toggleSort("code")} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      CA Code <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-5 px-6">Institution</th>
                  <th className="py-5 px-6">Contact</th>
                  <th className="py-5 px-6">Events</th>
                  <th className="py-5 px-6">
                    <button onClick={() => toggleSort("amount")} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      Amount <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-5 px-6">TrxnID / bKash</th>
                  <th className="py-5 px-6">Status</th>
                  <th className="py-5 px-6">
                    <button onClick={() => toggleSort("date")} className="flex items-center gap-1.5 hover:text-white transition-colors">
                      Date <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs">
                {filteredAndSortedList.map((row) => {
                  const isCaValid = caCodesList.includes(row.ca_code);

                  return (
                    <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                      {/* Name */}
                      <td className="py-5 px-6">
                        <div>
                          <div className="font-black text-white text-sm">{row.full_name}</div>
                          <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
                            Class {row.class} • ID: {row.member_id || "N/A"}
                          </div>
                        </div>
                      </td>

                      {/* CA Code */}
                      <td className="py-5 px-6">
                        <span className={`px-2.5 py-1 rounded-full font-mono text-[10px] font-black uppercase tracking-wider ${
                          isCaValid 
                            ? "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400" 
                            : "bg-red-500/10 border border-red-500/20 text-red-400"
                        }`}>
                          {row.ca_code}
                        </span>
                      </td>

                      {/* Institution */}
                      <td className="py-5 px-6 text-zinc-300 font-medium max-w-[180px] truncate">
                        {row.institution || "N/A"}
                      </td>

                      {/* Contact */}
                      <td className="py-5 px-6 font-mono text-[11px]">
                        <div className="text-zinc-300">{row.email || "No Email"}</div>
                        <div className="text-zinc-500 mt-0.5">{row.phone || "No Phone"}</div>
                      </td>

                      {/* Selected Events */}
                      <td className="py-5 px-6 text-zinc-400 font-medium max-w-[160px] truncate" title={row.selected_events}>
                        {row.selected_events}
                      </td>

                      {/* Amount */}
                      <td className="py-5 px-6 font-black text-white font-mono">
                        BDT {row.amount}
                      </td>

                      {/* TrxnID & bKash */}
                      <td className="py-5 px-6 font-mono text-[11px]">
                        <div className="text-amber-500 uppercase font-black">{row.trxnid}</div>
                        <div className="text-zinc-500 mt-0.5">{row.bkash_number || "N/A"}</div>
                      </td>

                      {/* Status */}
                      <td className="py-5 px-6">
                        {row.verified === "yes" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-black text-[9px] uppercase tracking-wider">
                            <CheckCircle2 className="w-3 h-3" /> Verified
                          </span>
                        ) : row.verified === "rejected" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 font-black text-[9px] uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 font-black text-[9px] uppercase tracking-wider">
                            <AlertCircle className="w-3 h-3" /> Pending
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="py-5 px-6 text-zinc-500 font-mono text-[11px]">
                        {row.created_at ? new Date(row.created_at).toLocaleDateString() : "N/A"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
