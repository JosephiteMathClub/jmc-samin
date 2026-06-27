"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Search, 
  Filter, 
  CheckCircle2, 
  IdCard, 
  Calendar, 
  Mail, 
  Phone, 
  Trophy, 
  RefreshCw, 
  Eye, 
  X, 
  SlidersHorizontal,
  Download,
  AlertCircle
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { Skeleton } from '../../Skeleton';
import { matchesSearchWithFuzzy } from '../../../lib/utils';

interface EventRegistrationRow {
  id: string;
  user_id: string;
  full_name: string;
  class: string;
  section: string;
  roll: string;
  phone: string;
  trxnid: string;
  bkash_number: string;
  amount: number;
  selected_events: string;
  verified: "yes" | "no" | "rejected";
  registered_by?: string;
  verified_by?: string;
  created_at: string;
  tableName: string;
  email?: string;
  member_id?: string;
}

interface VerifiedParticipant {
  full_name: string;
  class: string;
  section: string;
  roll: string;
  phone: string;
  email?: string;
  user_id?: string;
  member_id: string;
  idType: "EC Member (3-Digit)" | "Guest Ticket (5-Digit)" | "Club Member (6-Digit)" | "Pending/N/A";
  registrations: EventRegistrationRow[];
  created_at: string;
}

export function VerifiedEventParticipatorsSection() {
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search/Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [idTypeFilter, setIdTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedParticipant, setSelectedParticipant] = useState<VerifiedParticipant | null>(null);

  // Exporting status
  const [isExporting, setIsExporting] = useState(false);

  const fetchVerifiedRegistrations = useCallback(async () => {
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
      let allVerified: EventRegistrationRow[] = [];

      for (const tb of tables) {
        // Fetch only verified rows
        const { data, error: tableErr } = await supabase
          .from(tb)
          .select("*")
          .or("verified.eq.yes,verified.eq.true");

        if (tableErr) {
          console.error(`Error fetching verified entries from ${tb}:`, tableErr);
          continue;
        }

        if (data && data.length > 0) {
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          let emailsMap: Record<string, string> = {};
          let memberIdsMap: Record<string, string> = {};

          if (userIds.length > 0) {
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
            return {
              ...item,
              tableName: tb,
              verified: "yes" as const,
              email: emailsMap[item.user_id] || item.registered_by || "",
              member_id: memberIdsMap[item.user_id] || "",
            };
          });

          allVerified = [...allVerified, ...mapped];
        }
      }

      setRegistrations(allVerified);
    } catch (err: any) {
      console.error("Error retrieving verified data:", err);
      setError(err.message || "Failed to load verified event participants.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerifiedRegistrations();
  }, [fetchVerifiedRegistrations]);

  // Aggregate and Group Verified Registrations into unique participants
  const verifiedParticipantsList = useMemo(() => {
    const participantsMap = new Map<string, VerifiedParticipant>();

    registrations.forEach((item) => {
      // Create primary key for mapping: prioritize user_id if present, fallback to name_class_roll
      const nameKey = (item.full_name || "").trim().toLowerCase();
      const classKey = (item.class || "").trim().toLowerCase();
      const rollKey = (item.roll || "").trim().toLowerCase();
      const groupKey = item.user_id ? `usr_${item.user_id}` : `${nameKey}_${classKey}_${rollKey}`;

      let currentMemberId = item.member_id || "";

      // Deduce ID type based on length
      // 3-digit: EC Member
      // 5-digit: Guest Ticket
      // 6-digit or more (e.g. JMC-XXXXXX): Club Member
      let idType: VerifiedParticipant["idType"] = "Pending/N/A";
      const cleanId = currentMemberId.replace("JMC-", "").trim();
      if (cleanId) {
        if (cleanId.length === 3) {
          idType = "EC Member (3-Digit)";
        } else if (cleanId.length === 5) {
          idType = "Guest Ticket (5-Digit)";
        } else if (cleanId.length >= 6) {
          idType = "Club Member (6-Digit)";
        }
      }

      const existing = participantsMap.get(groupKey);
      if (existing) {
        // Append registration
        existing.registrations.push(item);
        // Prioritize non-empty member_id
        if (!existing.member_id && currentMemberId) {
          existing.member_id = currentMemberId;
          existing.idType = idType;
        }
      } else {
        participantsMap.set(groupKey, {
          full_name: item.full_name,
          class: item.class,
          section: item.section || "",
          roll: item.roll || "",
          phone: item.phone || "",
          email: item.email || "",
          user_id: item.user_id,
          member_id: currentMemberId,
          idType: idType,
          registrations: [item],
          created_at: item.created_at || ""
        });
      }
    });

    return Array.from(participantsMap.values()).sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [registrations]);

  // Filter and Sort List Dynamically
  const filteredParticipants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) {
      return verifiedParticipantsList.filter((p) => {
        // ID Type Filter
        let matchesIdType = true;
        if (idTypeFilter !== "all") {
          matchesIdType = p.idType === idTypeFilter;
        }
        // Class Filter
        let matchesClass = true;
        if (classFilter !== "all") {
          matchesClass = (p.class || "").trim().toLowerCase() === classFilter.toLowerCase();
        }
        return matchesIdType && matchesClass;
      });
    }

    // When there is a query, fuzzy match and sort by closeness score
    const scoredList = verifiedParticipantsList
      .map((p) => {
        // ID Type Filter
        let matchesIdType = true;
        if (idTypeFilter !== "all") {
          matchesIdType = p.idType === idTypeFilter;
        }
        // Class Filter
        let matchesClass = true;
        if (classFilter !== "all") {
          matchesClass = (p.class || "").trim().toLowerCase() === classFilter.toLowerCase();
        }

        if (!matchesIdType || !matchesClass) {
          return { item: p, matches: false, score: 999 };
        }

        const matchRes = matchesSearchWithFuzzy(p, q, {
          nameField: 'full_name',
          secondaryFields: ['email', 'member_id', 'phone', 'class']
        });

        return { item: p, matches: matchRes.matches, score: matchRes.score };
      })
      .filter((res) => res.matches);

    // Sort by best score ascending (lower score = closer match)
    scoredList.sort((a, b) => a.score - b.score);
    return scoredList.map((res) => res.item);
  }, [verifiedParticipantsList, searchQuery, idTypeFilter, classFilter]);

  // Unique lists for dropdown filters
  const classesDropdownList = useMemo(() => {
    const list = new Set<string>();
    verifiedParticipantsList.forEach((p) => {
      if (p.class) list.add(p.class.trim());
    });
    return Array.from(list).sort();
  }, [verifiedParticipantsList]);

  // Stats Counters
  const stats = useMemo(() => {
    let ecCount = 0;
    let guestCount = 0;
    let memberCount = 0;

    verifiedParticipantsList.forEach((p) => {
      if (p.idType === "EC Member (3-Digit)") ecCount++;
      else if (p.idType === "Guest Ticket (5-Digit)") guestCount++;
      else if (p.idType === "Club Member (6-Digit)") memberCount++;
    });

    return {
      total: verifiedParticipantsList.length,
      ecCount,
      guestCount,
      memberCount
    };
  }, [verifiedParticipantsList]);

  // Handle Export to CSV
  const handleExportCSV = () => {
    if (filteredParticipants.length === 0) {
      alert("No data available to export.");
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        "Full Name",
        "Unique ID",
        "ID Type",
        "Class",
        "Section",
        "Roll",
        "Contact Contact",
        "Email",
        "Registered Categories",
        "All Verified Events"
      ];

      const csvRows = [headers.join(",")];

      filteredParticipants.forEach((p) => {
        const categories = Array.from(new Set(p.registrations.map(r => {
          if (r.tableName === "primary_events") return "Primary";
          if (r.tableName === "junior_events") return "Junior";
          if (r.tableName === "secondary_events") return "Secondary";
          return "Higher Secondary";
        }))).join(" | ");

        const events = p.registrations.map(r => r.selected_events).filter(Boolean).join(" ; ");

        const row = [
          `"${(p.full_name || "").replace(/"/g, '""')}"`,
          `"${p.member_id || "N/A"}"`,
          `"${p.idType}"`,
          `"${p.class || ""}"`,
          `"${p.section || ""}"`,
          `"${p.roll || ""}"`,
          `"${p.phone || ""}"`,
          `"${p.email || ""}"`,
          `"${categories}"`,
          `"${events.replace(/"/g, '""')}"`
        ];
        csvRows.push(row.join(","));
      });

      const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `verified_event_participators_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Export failure:", err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <IdCard className="w-8 h-8 text-amber-500" />
            Verified Event Participators
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Browse and query verified participants and their specific 3-digit, 5-digit, or 6-digit identification badges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchVerifiedRegistrations}
            disabled={isLoading}
            className="p-3.5 rounded-2xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer flex items-center justify-center"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={isExporting || filteredParticipants.length === 0}
            className="px-5 py-3.5 rounded-2xl bg-emerald-555/10 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs font-black uppercase tracking-wider hover:bg-emerald-500 hover:text-black transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
      </div>

      {/* Stats Counter Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Total Verified people</p>
          <p className="text-2xl font-black text-white mt-1">{stats.total}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">EC Executives (3-Digit)</p>
          <p className="text-2xl font-black text-amber-400 mt-1">{stats.ecCount}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Guest entries (5-Digit)</p>
          <p className="text-2xl font-black text-indigo-400 mt-1">{stats.guestCount}</p>
        </div>
        <div className="glass-card p-6 rounded-3xl border border-white/5 bg-white/[0.01]">
          <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Club Members (6-Digit)</p>
          <p className="text-2xl font-black text-blue-400 mt-1">{stats.memberCount}</p>
        </div>
      </div>

      {/* Search & Sliders */}
      <div className="glass-card p-6 rounded-[2rem] border border-white/5 bg-white/[0.01] space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, unique ID, email, or contact phone..."
              className="w-full pl-11 pr-5 py-3.5 rounded-2xl bg-white/[0.02] border border-white/5 focus:border-amber-500/50 text-white placeholder-zinc-500 text-xs font-semibold focus:outline-none focus:ring-0 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-2xl text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5 text-zinc-500" />
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Filter ID:</span>
              <select
                value={idTypeFilter}
                onChange={(e) => setIdTypeFilter(e.target.value)}
                className="bg-transparent text-white border-none outline-none text-xs font-bold cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#121212]">All ID Types</option>
                <option value="EC Member (3-Digit)" className="bg-[#121212]">EC (3-Digit)</option>
                <option value="Guest Ticket (5-Digit)" className="bg-[#121212]">Guest (5-Digit)</option>
                <option value="Club Member (6-Digit)" className="bg-[#121212]">Member (6-Digit)</option>
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-4 py-2.5 rounded-2xl text-xs">
              <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Filter Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-transparent text-white border-none outline-none text-xs font-bold cursor-pointer pr-1"
              >
                <option value="all" className="bg-[#121212]">All Classes</option>
                {classesDropdownList.map((c) => (
                  <option key={c} value={c} className="bg-[#121212]">Class {c}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-6 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-400 text-xs flex gap-3 items-center">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      ) : filteredParticipants.length === 0 ? (
        <div className="bg-white/[0.01] border border-white/5 p-16 rounded-[2.5rem] text-center space-y-4">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-zinc-400 text-sm font-black uppercase tracking-wider">No matching verified participants found</p>
          <p className="text-xs text-zinc-600 max-w-sm mx-auto">
            Try adjusting your search criteria or double check that event registrations are approved and verified.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden rounded-[2.5rem] border border-white/5 bg-white/[0.01]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Participant</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Unique Verification ID</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Class/Roll details</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Verified Registrations</th>
                  <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredParticipants.map((p, idx) => {
                  let badgeColorClass = "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
                  if (p.idType === "EC Member (3-Digit)") {
                    badgeColorClass = "bg-amber-500/10 text-amber-400 border-amber-500/25";
                  } else if (p.idType === "Guest Ticket (5-Digit)") {
                    badgeColorClass = "bg-indigo-500/10 text-indigo-400 border-indigo-500/25";
                  } else if (p.idType === "Club Member (6-Digit)") {
                    badgeColorClass = "bg-blue-500/10 text-blue-400 border-blue-500/25";
                  }

                  return (
                    <motion.tr 
                      key={p.member_id || idx}
                      className="hover:bg-white/[0.01] transition-all text-xs"
                    >
                      <td className="p-5">
                        <p className="font-extrabold text-white text-sm">{p.full_name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium mt-0.5">{p.email || p.phone}</p>
                      </td>
                      
                      <td className="p-5">
                        {p.member_id ? (
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-xs tracking-widest bg-zinc-900 border border-white/15 px-2.5 py-1 rounded-lg text-white">
                              {p.member_id}
                            </span>
                            <span className={`text-[8px] font-black uppercase tracking-wider border px-2 py-0.5 rounded-md ${badgeColorClass}`}>
                              {p.idType.split(' ')[0]}
                            </span>
                          </div>
                        ) : (
                          <span className="text-zinc-600 font-bold uppercase tracking-wider text-[9px]">PENDING ID</span>
                        )}
                      </td>

                      <td className="p-5 font-bold text-zinc-300">
                        <span className="bg-zinc-850 bg-[#161616] px-2 py-1 rounded border border-white/5 inline-block text-[10px]">
                          Class {p.class} • Sec {p.section || "-"} • Roll {p.roll || "-"}
                        </span>
                      </td>

                      <td className="p-5">
                        <div className="flex flex-wrap gap-1.5 max-w-sm">
                          {p.registrations.map((reg) => {
                            let categoryLabel = "Primary";
                            let catColor = "bg-green-500/10 text-green-400 border-green-500/20";
                            if (reg.tableName === "junior_events") {
                              categoryLabel = "Junior";
                              catColor = "bg-cyan-500/10 text-cyan-400 border-cyan-500/20";
                            } else if (reg.tableName === "secondary_events") {
                              categoryLabel = "Secondary";
                              catColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                            } else if (reg.tableName === "higher_secondary_events") {
                              categoryLabel = "Higher Sec";
                              catColor = "bg-rose-500/10 text-rose-400 border-rose-500/20";
                            }

                            return (
                              <span 
                                key={reg.id} 
                                className={`text-[8.5px] font-extrabold px-2 py-0.5 rounded-full border ${catColor}`}
                                title={reg.selected_events}
                              >
                                {categoryLabel}
                              </span>
                            );
                          })}
                        </div>
                      </td>

                      <td className="p-5 text-right">
                        <button
                          onClick={() => setSelectedParticipant(p)}
                          className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-wider inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500" />
                          Inspect
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Inspector Modal Drawer */}
      <AnimatePresence>
        {selectedParticipant && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/85 backdrop-blur-sm">
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-screen bg-[#070707] border-l border-white/10 p-8 overflow-y-auto space-y-8 flex flex-col text-left"
            >
              {/* Drawer Title Bar */}
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Participating Identity Card</h3>
                    <p className="text-[10px] text-zinc-500 font-medium tracking-wide">Detailed verified application trace logs</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedParticipant(null)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Inspector Content */}
              <div className="space-y-6 flex-1 text-xs">
                {/* Visual Digital Ticket Block */}
                <div className="bg-gradient-to-br from-amber-500/10 via-transparent to-transparent p-6 rounded-3xl border border-amber-500/20 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-widest">Josephite Math Club</p>
                      <h4 className="text-xl font-black text-white uppercase mt-0.5">{selectedParticipant.full_name}</h4>
                      <p className="text-[10px] font-mono text-amber-400 font-black mt-1">
                        UNIFIED ID: {selectedParticipant.member_id || "NOT ASSIGNED"}
                      </p>
                    </div>
                    <span className="text-[7.5px] font-extrabold text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-1 rounded uppercase tracking-wider">
                      {selectedParticipant.idType}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div>
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Academic Class</p>
                      <p className="text-white font-extrabold mt-0.5">Class {selectedParticipant.class}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Section</p>
                      <p className="text-white font-extrabold mt-0.5">{selectedParticipant.section || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Roll No</p>
                      <p className="text-white font-extrabold mt-0.5">{selectedParticipant.roll || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Contact Trace details */}
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider border-b border-white/5 pb-2">Profile Trace Parameters</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 select-all">
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Identity Email</p>
                      <p className="text-white/80 font-mono mt-1 break-all">{selectedParticipant.email || "No email profile"}</p>
                    </div>
                    <div className="bg-white/[0.01] p-4 rounded-2xl border border-white/5 select-all">
                      <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Contact Phone</p>
                      <p className="text-white/80 font-mono mt-1">{selectedParticipant.phone || "No phone registered"}</p>
                    </div>
                  </div>
                </div>

                {/* Category submissions */}
                <div className="space-y-4">
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-wider border-b border-white/5 pb-2">Verified Submissions</p>
                  
                  <div className="space-y-3">
                    {selectedParticipant.registrations.map((reg, index) => {
                      let categoryName = "Primary Category (Class 3-5)";
                      if (reg.tableName === "junior_events") {
                        categoryName = "Junior Category (Class 6-8)";
                      } else if (reg.tableName === "secondary_events") {
                        categoryName = "Secondary Category (Class 9-10)";
                      } else if (reg.tableName === "higher_secondary_events") {
                        categoryName = "Higher Secondary Category (Class 11-12)";
                      }

                      return (
                        <div key={reg.id} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-zinc-400 font-black uppercase tracking-wider">{categoryName}</span>
                            <span className="text-[8px] font-bold text-green-500 tracking-wider bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20 uppercase">
                              Verified Spot
                            </span>
                          </div>

                          <div className="space-y-1">
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-wider">Selected Challenges</p>
                            <p className="text-white text-xs font-bold leading-relaxed">{reg.selected_events}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-2.5 mt-2.5 text-[11px]">
                            <div>
                              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">bKash Sender No</p>
                              <p className="text-zinc-300 font-mono mt-0.5 font-bold">{reg.bkash_number || "AUTO-APPROVED"}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Transaction ID</p>
                              <p className="text-amber-500 font-mono mt-0.5 font-bold break-all">{reg.trxnid || "N/A"}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-2.5 mt-2.5 text-[11px]">
                            <div>
                              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Registered By</p>
                              <p className="text-zinc-300 font-mono mt-0.5 font-bold">{reg.registered_by || "Self (Online)"}</p>
                            </div>
                            <div>
                              <p className="text-zinc-500 text-[8px] font-black uppercase tracking-wider">Verified/Approved By</p>
                              <p className="text-emerald-400 font-mono mt-0.5 font-bold break-all">{reg.verified_by || "System / Auto"}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Close footer button */}
              <button
                onClick={() => setSelectedParticipant(null)}
                className="w-full py-4 text-xs font-black text-black uppercase tracking-widest bg-amber-500 hover:bg-amber-400 rounded-2xl transition-all cursor-pointer text-center"
              >
                Done Inspecting
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
