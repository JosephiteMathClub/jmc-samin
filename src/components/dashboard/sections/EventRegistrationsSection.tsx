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
  Sparkles,
  ArrowUpDown,
  Mail,
  Send,
  Ticket
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { matchesSearchWithFuzzy, resolveEventNames } from "../../../lib/utils";
import { PurchaseSlipModal, PurchaseSlipCandidate } from "../PurchaseSlipModal";

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
  phone?: string;
}

export function EventRegistrationsSection() {
  const [registrations, setRegistrations] = useState<EventRegistrationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Controls
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "yes" | "no" | "rejected">("all");
  const [tableFilter, setTableFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [sectionFilter, setSectionFilter] = useState<string>("all");
  const [specificEventFilter, setSpecificEventFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "7days" | "30days">("all");
  const [amountFilter, setAmountFilter] = useState<"all" | "paid" | "free" | "tier1" | "tier2">("all");
  const [showUniqueOnly, setShowUniqueOnly] = useState<boolean>(true); // default to true to show unique participants
  const [selectedRegistrant, setSelectedRegistrant] = useState<EventRegistrationRow | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<"all" | "solo" | "team">("all");
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "name_asc" | "name_desc" | "class_asc" | "class_desc" | "event_asc">("date_desc");

  // Purchase Slip Modal & Bulk Dispatch State
  const [selectedSlipCandidate, setSelectedSlipCandidate] = useState<PurchaseSlipCandidate | null>(null);
  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [bulkDispatching, setBulkDispatching] = useState(false);
  const [dispatchNotice, setDispatchNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleBulkDispatchSlips = async () => {
    // Find all verified registrants with email address
    const verifiedList = registrations.filter(r => r.verified === 'yes' && r.email && r.email.trim() !== '');

    if (verifiedList.length === 0) {
      setDispatchNotice({
        type: 'error',
        message: 'No verified registrants with email addresses found.'
      });
      return;
    }

    if (!confirm(`Are you sure you want to dispatch purchase slips with QR codes to ${verifiedList.length} verified registrants?`)) {
      return;
    }

    setBulkDispatching(true);
    setDispatchNotice(null);

    const recipients = verifiedList.map(item => ({
      recipientEmail: item.email,
      recipientName: item.full_name,
      memberId: item.member_id || item.user_id || item.id,
      className: item.class,
      section: item.section || 'N/A',
      roll: item.roll || 'N/A',
      trxnid: item.trxnid,
      events: item.selected_events,
      school: 'St. Joseph Higher Secondary School'
    }));

    try {
      const res = await fetch('/api/admin/send-purchase-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipients,
          verifiedBy: 'Super Admin'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch purchase slips');
      }

      setDispatchNotice({
        type: 'success',
        message: `Purchase Slips successfully dispatched to ${data.results?.filter((r: any) => r.success).length || recipients.length} verified registrants!`
      });
    } catch (err: any) {
      console.error('Bulk dispatch error:', err);
      setDispatchNotice({
        type: 'error',
        message: err.message || 'Failed to dispatch purchase slips'
      });
    } finally {
      setBulkDispatching(false);
    }
  };

  const fetchAllRegistrations = useCallback(async (isSilent = false) => {
    if (!isSupabaseConfigured) return;
    if (isSilent) {
      setIsSyncing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    try {
      const tables = [
        "primary_events",
        "junior_events",
        "secondary_events",
        "higher_secondary_events",
      ];

      // 1. Fetch all four event tables in parallel for maximum speed
      const tableResults = await Promise.all(
        tables.map(async (tb) => {
          const { data, error: tableErr } = await supabase
            .from(tb)
            .select("*")
            .order("created_at", { ascending: false });
          return { tb, data: data || [], error: tableErr };
        })
      );

      let rawRowsWithTable: (any & { tableName: string })[] = [];
      tableResults.forEach(({ tb, data, error: tableErr }) => {
        if (tableErr) {
          console.error(`Error fetching registrations from ${tb}:`, tableErr);
        } else if (data) {
          data.forEach(item => {
            rawRowsWithTable.push({ ...item, tableName: tb });
          });
        }
      });

      // 2. Batch fetch profiles and member IDs in a single query for all user_ids
      const allUserIds = Array.from(
        new Set(rawRowsWithTable.map((r: any) => r.user_id).filter(Boolean))
      );

      let emailsMap: Record<string, string> = {};
      let memberIdsMap: Record<string, string> = {};
      let memberPhonesMap: Record<string, string> = {};

      if (allUserIds.length > 0) {
        const [profsRes, memberRes] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, email")
            .in("id", allUserIds),
          supabase
            .from("member")
            .select("id, member_id, phone")
            .in("id", allUserIds)
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

      // 3. Normalize registration records
      const allReg: EventRegistrationRow[] = rawRowsWithTable.map((item: any) => {
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
          tableName: item.tableName,
          verified: normVerified,
          email: emailsMap[item.user_id] || item.registered_by || "",
          member_id: memberIdsMap[item.user_id] || "",
          phone: item.phone || memberPhonesMap[item.user_id] || "",
        };
      });

      // Sort by created_at descending (newest submissions first)
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
      setIsSyncing(false);
    }
  }, []);

  // Set up instant real-time listener and background auto-refresh
  useEffect(() => {
    fetchAllRegistrations(false);

    // Silent background poll every 30 seconds as fallback (no full UI unmount/skeleton)
    const intervalId = setInterval(() => {
      fetchAllRegistrations(true);
    }, 30000);

    // Supabase Realtime channel for postgres_changes
    let channel: any = null;
    if (isSupabaseConfigured) {
      channel = supabase
        .channel("event_registrations_realtime_sync")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "primary_events" },
          () => fetchAllRegistrations(true)
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "junior_events" },
          () => fetchAllRegistrations(true)
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "secondary_events" },
          () => fetchAllRegistrations(true)
        )
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "higher_secondary_events" },
          () => fetchAllRegistrations(true)
        )
        .subscribe();
    }

    return () => {
      clearInterval(intervalId);
      if (channel && isSupabaseConfigured) {
        supabase.removeChannel(channel);
      }
    };
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
        
        // CRITICAL: ALWAYS PRIORITIZE PENDING ("no") REGISTRATIONS OVER VERIFIED ("yes") ONES
        // so admins can see and verify new pending money/transaction submissions!
        const existingIsPending = existing.verified === "no";
        const newIsPending = item.verified === "no";

        if (!existingIsPending && newIsPending) {
          // New record is pending, existing is verified/rejected -> replace with pending!
          uniqueMap.set(key, item);
        } else if (existingIsPending === newIsPending) {
          // If both have same pending/verified state, keep the newer submission
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

  // Dynamic set of sections for section filter dropdown
  const sectionsDropdownList = useMemo(() => {
    const sourceList = showUniqueOnly ? uniquePeopleList : registrations;
    return Array.from(
      new Set(sourceList.map((log) => (log.section || "").trim()).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
  }, [registrations, uniquePeopleList, showUniqueOnly]);

  // Combined Active Dataset (Guarantees all pending submissions are shown when filtering by Pending)
  const activeDataset = useMemo(() => {
    if (statusFilter === "no") {
      return registrations;
    }
    return showUniqueOnly ? uniquePeopleList : registrations;
  }, [statusFilter, showUniqueOnly, uniquePeopleList, registrations]);

  // Dynamic list of resolved individual segment/event names
  const specificEventsDropdownList = useMemo(() => {
    const eventsSet = new Set<string>();
    activeDataset.forEach((reg) => {
      const resolved = resolveEventNames(reg.selected_events);
      if (resolved && resolved !== "N/A") {
        resolved.split(',').forEach((ev) => {
          const cleanEv = ev.trim();
          if (cleanEv) eventsSet.add(cleanEv);
        });
      }
    });
    return Array.from(eventsSet).sort((a, b) => a.localeCompare(b));
  }, [activeDataset]);

  // Reset all filters
  const handleResetFilters = useCallback(() => {
    setSearchQuery("");
    setStatusFilter("all");
    setTableFilter("all");
    setClassFilter("all");
    setSectionFilter("all");
    setSpecificEventFilter("all");
    setDateFilter("all");
    setAmountFilter("all");
    setEventTypeFilter("all");
    setSortBy("date_desc");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return (
      searchQuery.trim() !== "" ||
      statusFilter !== "all" ||
      tableFilter !== "all" ||
      classFilter !== "all" ||
      sectionFilter !== "all" ||
      specificEventFilter !== "all" ||
      dateFilter !== "all" ||
      amountFilter !== "all" ||
      eventTypeFilter !== "all" ||
      sortBy !== "date_desc"
    );
  }, [
    searchQuery,
    statusFilter,
    tableFilter,
    classFilter,
    sectionFilter,
    specificEventFilter,
    dateFilter,
    amountFilter,
    eventTypeFilter,
    sortBy
  ]);

  // Determine if a registration row is part of a team event
  const isTeamRegistration = useCallback((reg: EventRegistrationRow) => {
    const events = (reg.selected_events || "").toLowerCase();
    return (
      events.includes("tic-tac-toe") ||
      events.includes("escape room") ||
      reg.trxnid.includes("-T")
    );
  }, []);

  // Helper to check if event string includes Tic-Tac-Toe
  const isTicTacToeEvent = useCallback((eventStr: string) => {
    if (!eventStr) return false;
    const lower = eventStr.toLowerCase();
    const resolved = resolveEventNames(eventStr).toLowerCase();
    return lower.includes("tic-tac-toe") || lower.includes("tic tac toe") || lower.includes("tictactoe") || resolved.includes("tic-tac-toe");
  }, []);

  // Helper to strip the teammate suffix (-T2, -T3) to find the parent Transaction ID
  const getBaseTrxnId = useCallback((trxnid: string) => {
    if (!trxnid) return "";
    return trxnid.replace(/-T\d+$/, "").trim().toUpperCase();
  }, []);

  // Universal Filter Evaluator
  const passesFilters = useCallback((reg: EventRegistrationRow, q: string) => {
    if (statusFilter !== "all" && reg.verified !== statusFilter) {
      return false;
    }
    if (tableFilter !== "all" && reg.tableName !== tableFilter) {
      return false;
    }
    if (classFilter !== "all" && reg.class !== classFilter) {
      return false;
    }
    if (sectionFilter !== "all" && (reg.section || "").trim().toLowerCase() !== sectionFilter.toLowerCase()) {
      return false;
    }
    if (specificEventFilter !== "all") {
      const resolved = resolveEventNames(reg.selected_events).toLowerCase();
      const raw = (reg.selected_events || "").toLowerCase();
      const target = specificEventFilter.toLowerCase();
      if (!resolved.includes(target) && !raw.includes(target)) {
        return false;
      }
    }
    if (dateFilter !== "all" && reg.created_at) {
      const regTime = new Date(reg.created_at).getTime();
      const now = Date.now();
      if (dateFilter === "today") {
        const todayStart = new Date().setHours(0, 0, 0, 0);
        if (regTime < todayStart) return false;
      } else if (dateFilter === "7days") {
        if (regTime < now - 7 * 86400 * 1000) return false;
      } else if (dateFilter === "30days") {
        if (regTime < now - 30 * 86400 * 1000) return false;
      }
    }
    if (amountFilter !== "all") {
      const amt = reg.amount || 0;
      if (amountFilter === "paid" && amt <= 0) return false;
      if (amountFilter === "free" && amt > 0) return false;
      if (amountFilter === "tier1" && (amt <= 0 || amt > 200)) return false;
      if (amountFilter === "tier2" && amt <= 200) return false;
    }
    if (q) {
      const matchRes = matchesSearchWithFuzzy(reg, q, {
        nameField: 'full_name',
        secondaryFields: ['email', 'member_id', 'phone', 'class', 'section', 'roll', 'trxnid', 'bkash_number', 'selected_events']
      });
      const resolvedEvts = resolveEventNames(reg.selected_events).toLowerCase();
      const matchesResolvedEvents = resolvedEvts.includes(q);
      if (!matchRes.matches && !matchesResolvedEvents) return false;
    }
    return true;
  }, [statusFilter, tableFilter, classFilter, sectionFilter, specificEventFilter, dateFilter, amountFilter]);

  const soloRegistrantsList = useMemo(() => {
    return activeDataset.filter(reg => !isTeamRegistration(reg));
  }, [activeDataset, isTeamRegistration]);

  const groupedTeamsList = useMemo(() => {
    const teamsMap = new Map<string, {
      id: string;
      baseTrxnId: string;
      eventName: string;
      amount: number;
      bkash_number: string;
      verified: "yes" | "no" | "rejected";
      created_at: string;
      tableName: string;
      members: EventRegistrationRow[];
    }>();

    activeDataset.forEach((reg) => {
      if (isTeamRegistration(reg)) {
        const baseTrxn = getBaseTrxnId(reg.trxnid);
        const eventName = resolveEventNames(reg.selected_events);
        const key = `${baseTrxn}_${eventName}`;

        if (!teamsMap.has(key)) {
          teamsMap.set(key, {
            id: key,
            baseTrxnId: baseTrxn,
            eventName: eventName,
            amount: reg.amount,
            bkash_number: reg.bkash_number,
            verified: reg.verified,
            created_at: reg.created_at,
            tableName: reg.tableName,
            members: [reg]
          });
        } else {
          const team = teamsMap.get(key)!;
          team.members.push(reg);
          if (reg.amount > team.amount) {
            team.amount = reg.amount;
          }
          if (!reg.trxnid.includes("-T")) {
            team.verified = reg.verified;
            team.created_at = reg.created_at;
            team.bkash_number = reg.bkash_number;
          }
        }
      }
    });

    return Array.from(teamsMap.values());
  }, [activeDataset, isTeamRegistration, getBaseTrxnId]);

  const filteredSoloRegistrants = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return soloRegistrantsList.filter((reg) => passesFilters(reg, q));
  }, [soloRegistrantsList, passesFilters, searchQuery]);

  const filteredTeamRegistrations = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    
    return groupedTeamsList.filter((team) => {
      if (statusFilter !== "all" && team.verified !== statusFilter) return false;
      if (tableFilter !== "all" && team.tableName !== tableFilter) return false;
      if (classFilter !== "all") {
        if (!team.members.some(m => m.class === classFilter)) return false;
      }
      if (sectionFilter !== "all") {
        if (!team.members.some(m => (m.section || "").trim().toLowerCase() === sectionFilter.toLowerCase())) return false;
      }
      if (specificEventFilter !== "all") {
        const target = specificEventFilter.toLowerCase();
        const matchesTeamEvent = team.eventName.toLowerCase().includes(target);
        const matchesMemberEvent = team.members.some(m => resolveEventNames(m.selected_events).toLowerCase().includes(target));
        if (!matchesTeamEvent && !matchesMemberEvent) return false;
      }
      if (dateFilter !== "all" && team.created_at) {
        const teamTime = new Date(team.created_at).getTime();
        const now = Date.now();
        if (dateFilter === "today") {
          const todayStart = new Date().setHours(0, 0, 0, 0);
          if (teamTime < todayStart) return false;
        } else if (dateFilter === "7days") {
          if (teamTime < now - 7 * 86400 * 1000) return false;
        } else if (dateFilter === "30days") {
          if (teamTime < now - 30 * 86400 * 1000) return false;
        }
      }
      if (amountFilter !== "all") {
        const amt = team.amount || 0;
        if (amountFilter === "paid" && amt <= 0) return false;
        if (amountFilter === "free" && amt > 0) return false;
        if (amountFilter === "tier1" && (amt <= 0 || amt > 200)) return false;
        if (amountFilter === "tier2" && amt <= 200) return false;
      }
      if (q) {
        const matchesSearch = team.members.some((m) => passesFilters(m, q));
        const matchesTeamFields = 
          team.baseTrxnId.toLowerCase().includes(q) ||
          team.bkash_number.toLowerCase().includes(q) ||
          team.eventName.toLowerCase().includes(q);
          
        if (!matchesSearch && !matchesTeamFields) return false;
      }
      
      return true;
    });
  }, [groupedTeamsList, statusFilter, tableFilter, classFilter, sectionFilter, specificEventFilter, dateFilter, amountFilter, passesFilters, searchQuery]);

  // Individual team member list flat-mapped and sorted
  const individualTeamRegistrants = useMemo(() => {
    const allMembers: (EventRegistrationRow & { 
      baseTrxnId: string; 
      eventName: string; 
      teamId: string;
      teammatesList: string[];
    })[] = [];

    filteredTeamRegistrations.forEach((team) => {
      team.members.forEach((member) => {
        const otherTeammates = team.members
          .filter(m => m.id !== member.id)
          .map(m => m.full_name);

        allMembers.push({
          ...member,
          baseTrxnId: team.baseTrxnId,
          eventName: team.eventName,
          teamId: team.id,
          teammatesList: otherTeammates
        });
      });
    });

    return [...allMembers].sort((a, b) => {
      if (sortBy === "name_asc") return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "name_desc") return (b.full_name || "").localeCompare(a.full_name || "");
      if (sortBy === "class_asc" || sortBy === "class_desc") {
        const classA = parseInt(a.class || "0", 10);
        const classB = parseInt(b.class || "0", 10);
        const diff = (!isNaN(classA) && !isNaN(classB)) ? classA - classB : (a.class || "").localeCompare(b.class || "");
        return sortBy === "class_asc" ? diff : -diff;
      }
      if (sortBy === "event_asc") return (a.eventName || "").localeCompare(b.eventName || "");
      if (sortBy === "date_asc") {
        return (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0);
      }
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredTeamRegistrations, sortBy]);

  const sortedSoloRegistrants = useMemo(() => {
    return [...filteredSoloRegistrants].sort((a, b) => {
      if (sortBy === "name_asc") return (a.full_name || "").localeCompare(b.full_name || "");
      if (sortBy === "name_desc") return (b.full_name || "").localeCompare(a.full_name || "");
      if (sortBy === "class_asc" || sortBy === "class_desc") {
        const classA = parseInt(a.class || "0", 10);
        const classB = parseInt(b.class || "0", 10);
        const diff = (!isNaN(classA) && !isNaN(classB)) ? classA - classB : (a.class || "").localeCompare(b.class || "");
        return sortBy === "class_asc" ? diff : -diff;
      }
      if (sortBy === "event_asc") return resolveEventNames(a.selected_events).localeCompare(resolveEventNames(b.selected_events));
      if (sortBy === "date_asc") {
        return (a.created_at ? new Date(a.created_at).getTime() : 0) - (b.created_at ? new Date(b.created_at).getTime() : 0);
      }
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return dateB - dateA;
    });
  }, [filteredSoloRegistrants, sortBy]);

  const filteredRegistrants = useMemo(() => {
    if (eventTypeFilter === 'all') {
      return [...sortedSoloRegistrants, ...individualTeamRegistrants];
    } else if (eventTypeFilter === 'solo') {
      return sortedSoloRegistrants;
    } else {
      return individualTeamRegistrants;
    }
  }, [eventTypeFilter, sortedSoloRegistrants, individualTeamRegistrants]);

  // Metric Summaries
  const metrics = useMemo(() => {
    const totalForms = registrations.length;
    const uniquePeople = uniquePeopleList.length;
    const verifiedUnique = uniquePeopleList.filter(p => p.verified === "yes").length;
    const pendingForms = registrations.filter(r => r.verified === "no").length;
    const ticTacToeUnique = uniquePeopleList.filter(p => isTicTacToeEvent(p.selected_events)).length;
    const ticTacToeTotal = registrations.filter(p => isTicTacToeEvent(p.selected_events)).length;

    return {
      totalForms,
      uniquePeople,
      verifiedUnique,
      pendingForms,
      ticTacToeUnique,
      ticTacToeTotal
    };
  }, [registrations, uniquePeopleList, isTicTacToeEvent]);

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
      "Phone Number",
      "Bkash Number",
      "Transaction ID",
      "Amount Paid (BDT)",
      "Format",
      "Registered Events / Segments",
      "Verification Status",
      "Account Email",
      "Submission Date",
      "Registration Portal / Category"
    ];

    // CSV format values
    const rows = filteredRegistrants.map((reg) => {
      const isTeam = isTeamRegistration(reg);
      const resolvedEvents = resolveEventNames(reg.selected_events);
      const cleanPhone = reg.phone || "";
      const cleanBkash = reg.bkash_number || "";
      
      return [
        `"${(reg.full_name || "").replace(/"/g, '""')}"`,
        `"${reg.member_id || "PENDING"}"`,
        `"${reg.class || ""}"`,
        `"${(reg.section || "").replace(/"/g, '""')}"`,
        `"${reg.roll || ""}"`,
        `"'${cleanPhone}"`,
        `"'${cleanBkash}"`,
        `"${reg.trxnid || ""}"`,
        reg.amount || 0,
        `"${isTeam ? "TEAM" : "SOLO"}"`,
        `"${resolvedEvents.replace(/"/g, '""')}"`,
        `"${(reg.verified || "no").toUpperCase()}"`,
        `"${(reg.email || "").replace(/"/g, '""')}"`,
        `"${reg.created_at ? new Date(reg.created_at).toLocaleString() : ""}"`,
        `"${(reg.tableName || "").replace(/_/g, " ").toUpperCase()}"`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    
    const dateStamp = new Date().toISOString().slice(0, 10);
    const fileName = `Filtered_Event_Registrants_${filteredRegistrants.length}_items_${dateStamp}.csv`;
      
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
        <div className="flex flex-wrap items-center gap-3 self-start lg:self-end">
          <button
            onClick={handleBulkDispatchSlips}
            disabled={bulkDispatching || registrations.filter(r => r.verified === 'yes').length === 0}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
            title="Send purchase slips & QR codes to all verified registrants via email"
          >
            {bulkDispatching ? (
              <Loader2 className="w-4 h-4 animate-spin text-black" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {bulkDispatching ? "Dispatching..." : `Send Slips to Verified (${registrations.filter(r => r.verified === 'yes').length})`}
          </button>

          <button
            onClick={handleExportCSV}
            disabled={filteredRegistrants.length === 0}
            className="px-5 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 hover:text-white font-extrabold uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            Export CSV ({filteredRegistrants.length})
          </button>

          <button
            onClick={() => fetchAllRegistrations(true)}
            disabled={isLoading || isSyncing}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:bg-amber-500/50 text-black font-black uppercase text-[10px] tracking-widest transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/10"
          >
            {isLoading || isSyncing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            {isLoading || isSyncing ? "Syncing..." : "Sync Database"}
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

      {/* Pending Verifications Banner */}
      {metrics.pendingForms > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-left shadow-lg shadow-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <AlertCircle className="w-5 h-5 text-amber-400 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-mono">
                {metrics.pendingForms} Pending Registration{metrics.pendingForms > 1 ? "s" : ""} Awaiting Verification
              </h4>
              <p className="text-xs text-zinc-400 mt-0.5">
                Participants have submitted payment details for event registration. Instant live sync is active.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setStatusFilter("no");
              setShowUniqueOnly(false);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all shrink-0 cursor-pointer shadow-md"
          >
            Inspect Pending Registrations ({metrics.pendingForms})
          </button>
        </div>
      )}

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
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Unique Toggle selection tab */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-2xl">
              <button
                onClick={() => {
                  setShowUniqueOnly(true);
                  setClassFilter("all");
                }}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  showUniqueOnly
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Unique ({metrics.uniquePeople})
              </button>
              <button
                onClick={() => {
                  setShowUniqueOnly(false);
                  setClassFilter("all");
                }}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer ${
                  !showUniqueOnly
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All ({metrics.totalForms})
              </button>
            </div>

            {/* Event Type Filter (Solo vs Team) */}
            <div className="flex items-center gap-2 bg-black/40 border border-white/10 p-1 rounded-2xl">
              <button
                onClick={() => setEventTypeFilter("all")}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  eventTypeFilter === "all"
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                All Events
              </button>
              <button
                onClick={() => setEventTypeFilter("solo")}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  eventTypeFilter === "solo"
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Solo ({filteredSoloRegistrants.length})
              </button>
              <button
                onClick={() => setEventTypeFilter("team")}
                className={`flex-1 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                  eventTypeFilter === "team"
                    ? "bg-amber-500 text-black font-black"
                    : "text-zinc-500 hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                Teams ({filteredTeamRegistrations.length})
              </button>
            </div>
          </div>

          {showUniqueOnly && (
            <div className="p-5 bg-gradient-to-r from-purple-950/40 via-purple-900/20 to-pink-950/20 border border-purple-500/40 rounded-3xl space-y-3 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-purple-500/20 pb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-xl">
                    🎯
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-purple-200 flex items-center gap-2 font-mono">
                      Unique Registrants View — Tic-Tac-Toe Special Event Tracking
                    </h3>
                    <p className="text-[10px] text-purple-300/80 font-medium mt-0.5">
                      Tic-Tac-Toe requires a 3-member team (Leader + 2 Teammates). In this Unique Registrants view, Tic-Tac-Toe entries are highlighted with a distinct purple border and team badges for immediate audit clarity.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-3 py-1.5 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-200 text-xs font-mono font-black">
                    {metrics.ticTacToeUnique} Unique Tic-Tac-Toe Registrations
                  </span>
                  <button
                    onClick={() => {
                      setSpecificEventFilter("Tic-Tac-Toe");
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-500/30 hover:bg-purple-500/50 border border-purple-500/50 text-white text-[10px] font-black uppercase tracking-wider font-mono transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    🎯 Filter Tic-Tac-Toe
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
            {showUniqueOnly 
              ? "⚡ DEDUPLICATING multiple submissions by Name + Class + Section + Roll. Showing the highest priority record." 
              : "📋 DISPLAYING raw table logs. Duplicate participants may appear if they made multiple payment attempts."
            }
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="space-y-3 pt-2">
          {/* Row 1: Search, Event Segment, Status, Portal Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Advanced Search Input */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search name, phone, trxnid, email, roll..."
                className="w-full pl-11 pr-8 py-3 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-xs font-bold"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs p-1 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Specific Event / Segment Filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <select
                value={specificEventFilter}
                onChange={(e) => setSpecificEventFilter(e.target.value)}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full truncate"
              >
                <option value="all" className="bg-neutral-900 text-white">All Events & Segments</option>
                {specificEventsDropdownList.map((ev) => (
                  <option key={ev} value={ev} className="bg-neutral-900 text-white">
                    {ev}
                  </option>
                ))}
              </select>
            </div>

            {/* Status filter dropdown */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <Filter className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
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
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <Layers className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={tableFilter}
                onChange={(e) => {
                  setTableFilter(e.target.value);
                  setClassFilter("all");
                }}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
              >
                <option value="all" className="bg-neutral-900 text-white">All Categories / Portals</option>
                <option value="primary_events" className="bg-neutral-900 text-white">Primary (Class 3-5)</option>
                <option value="junior_events" className="bg-neutral-900 text-white">Junior (Class 6-8)</option>
                <option value="secondary_events" className="bg-neutral-900 text-white">Secondary (Class 9-10)</option>
                <option value="higher_secondary_events" className="bg-neutral-900 text-white">Higher Secondary (Class 11-12)</option>
              </select>
            </div>
          </div>

          {/* Row 2: Class, Section, Date Range, Amount, Sorting */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Class filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <School className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
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

            {/* Section filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
              >
                <option value="all" className="bg-neutral-900 text-white">All Sections</option>
                {sectionsDropdownList.map((sec) => (
                  <option key={sec} value={sec} className="bg-neutral-900 text-white">
                    Section {sec}
                  </option>
                ))}
              </select>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
              >
                <option value="all" className="bg-neutral-900 text-white">All Time</option>
                <option value="today" className="bg-neutral-900 text-white">Today (24 Hours)</option>
                <option value="7days" className="bg-neutral-900 text-white">Last 7 Days</option>
                <option value="30days" className="bg-neutral-900 text-white">Last 30 Days</option>
              </select>
            </div>

            {/* Amount filter */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <span className="text-xs text-amber-500 font-black">৳</span>
              <select
                value={amountFilter}
                onChange={(e) => setAmountFilter(e.target.value as any)}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
              >
                <option value="all" className="bg-neutral-900 text-white">All Payment Amounts</option>
                <option value="paid" className="bg-neutral-900 text-white">Paid Registrations (&gt; 0 BDT)</option>
                <option value="free" className="bg-neutral-900 text-white">Free Registrations (0 BDT)</option>
                <option value="tier1" className="bg-neutral-900 text-white">1 - 200 BDT</option>
                <option value="tier2" className="bg-neutral-900 text-white">200+ BDT</option>
              </select>
            </div>

            {/* Sort selection dropdown */}
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-3 rounded-2xl">
              <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer w-full"
              >
                <option value="date_desc" className="bg-neutral-900 text-white">Date: Newest First</option>
                <option value="date_asc" className="bg-neutral-900 text-white">Date: Oldest First</option>
                <option value="name_asc" className="bg-neutral-900 text-white">Name: A to Z</option>
                <option value="name_desc" className="bg-neutral-900 text-white">Name: Z to A</option>
                <option value="class_asc" className="bg-neutral-900 text-white">Class: Ascending</option>
                <option value="class_desc" className="bg-neutral-900 text-white">Class: Descending</option>
                <option value="event_asc" className="bg-neutral-900 text-white">Event Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filter Badges & Results Bar */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">
                Active Filters:
              </span>

              {searchQuery && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                  Search: "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {specificEventFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold">
                  Event: {specificEventFilter}
                  <button onClick={() => setSpecificEventFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {statusFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-bold">
                  Status: {statusFilter === "yes" ? "Verified" : statusFilter === "no" ? "Pending" : "Rejected"}
                  <button onClick={() => setStatusFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {tableFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
                  Portal: {tableFilter.replace(/_/g, " ").toUpperCase()}
                  <button onClick={() => setTableFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {classFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-bold">
                  Class: {classFilter}
                  <button onClick={() => setClassFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {sectionFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                  Section: {sectionFilter}
                  <button onClick={() => setSectionFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {dateFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] font-bold">
                  Date: {dateFilter === "today" ? "Today" : dateFilter === "7days" ? "Last 7 Days" : "Last 30 Days"}
                  <button onClick={() => setDateFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}

              {amountFilter !== "all" && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold">
                  Amount: {amountFilter.toUpperCase()}
                  <button onClick={() => setAmountFilter("all")} className="hover:text-white font-bold cursor-pointer">✕</button>
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-400">
                Showing {filteredRegistrants.length} matching registrants
              </span>
              <button
                onClick={handleResetFilters}
                className="px-3 py-1 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          </div>
        )}
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
        <div className="space-y-8">
          {/* SOLO EVENTS RENDER BLOCK */}
          {(eventTypeFilter === "all" || eventTypeFilter === "solo") && sortedSoloRegistrants.length > 0 && (
            <div className="space-y-4">
              {eventTypeFilter === "all" && (
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider">
                    Solo Event Registrants ({sortedSoloRegistrants.length})
                  </h3>
                </div>
              )}
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
                      {sortedSoloRegistrants.map((reg) => {
                        const isTic = isTicTacToeEvent(reg.selected_events);
                        return (
                          <tr 
                            key={reg.id} 
                            className={isTic ? "bg-purple-950/20 border-l-4 border-l-purple-500 hover:bg-purple-900/30 transition-all" : "hover:bg-white/[0.01] transition-all"}
                          >
                            {/* Identity Info */}
                            <td className="p-5">
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-full border flex items-center justify-center ${
                                  isTic ? "bg-purple-500/20 border-purple-500/40 text-purple-300" : "bg-white/5 border-white/10 text-zinc-400"
                                }`}>
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs flex items-center gap-1.5">
                                    {reg.full_name || "N/A"}
                                    {isTic && (
                                      <span className="text-[9px] font-mono text-purple-300 font-extrabold bg-purple-500/20 px-1.5 py-0.5 rounded border border-purple-500/30">
                                        🎯 Tic-Tac-Toe
                                      </span>
                                    )}
                                  </div>
                                  <div className="font-mono text-[9px] text-zinc-500 mt-0.5 break-all">
                                    {reg.email || "No connected email"}
                                  </div>
                                  {reg.phone && (
                                    <div className="font-mono text-[9px] text-amber-500 font-bold mt-0.5">
                                      📞 {reg.phone}
                                    </div>
                                  )}
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
                              <div className="space-y-1">
                                <div className="text-xs text-amber-500 font-black max-w-xs truncate" title={resolveEventNames(reg.selected_events)}>
                                  {resolveEventNames(reg.selected_events)}
                                </div>
                                {isTic && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/40 text-purple-300 font-extrabold text-[9px] uppercase tracking-wider font-mono">
                                    🎯 Tic-Tac-Toe (3-Member Event)
                                  </span>
                                )}
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
                      );
                    })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TEAM EVENTS RENDERING SECTION */}
          {(eventTypeFilter === "all" || eventTypeFilter === "team") && filteredTeamRegistrations.length > 0 && (
            <div className="space-y-6">
              {eventTypeFilter === "all" && (
                <div className="flex items-center gap-3 border-b border-purple-500/20 pb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
                  <h3 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                    Team Registrations ({filteredTeamRegistrations.length} Teams)
                  </h3>
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-6">
                {filteredTeamRegistrations.map((team) => {
                  const leader = team.members.find(m => !m.trxnid.includes("-T")) || team.members[0];
                  const teammates = team.members.filter(m => m.id !== leader.id);
                  const isApproved = team.verified === "yes";
                  const isRejected = team.verified === "rejected";

                  return (
                    <div 
                      key={team.id}
                      className={`bg-[#0c0c0e]/90 border rounded-[2.5rem] p-6 sm:p-8 space-y-6 shadow-2xl relative transition-all ${
                        isApproved 
                          ? "border-green-500/30 shadow-green-500/5" 
                          : isRejected 
                          ? "border-red-500/30 shadow-red-500/5" 
                          : "border-amber-500/30 shadow-amber-500/5"
                      }`}
                    >
                      {/* Team Card Top Bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black tracking-wider uppercase flex items-center gap-1.5 font-mono">
                              <Users className="w-3.5 h-3.5 text-amber-400" />
                              {resolveEventNames(team.eventName)}
                            </span>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                              TRX: <strong className="text-white">{team.baseTrxnId}</strong>
                            </span>
                            <span className="text-[10px] font-mono font-bold text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full">
                              bKash: <strong className="text-zinc-200">{team.bkash_number || "N/A"}</strong>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs font-black text-white bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl font-mono">
                            ৳ {team.amount} BDT
                          </span>
                          {isApproved ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-extrabold border border-green-500/30 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                              VERIFIED
                            </span>
                          ) : isRejected ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-extrabold border border-red-500/30 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                              REJECTED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold border border-amber-500/30 font-mono">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                              PENDING
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Team Members Grid - Singular Large Card containing Leader and Teammate Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* TEAM LEADER CARD SECTION */}
                        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 space-y-3 relative">
                          <div className="flex items-center justify-between border-b border-amber-500/20 pb-2.5">
                            <span className="px-2.5 py-0.5 rounded text-[8px] font-black bg-amber-500/20 text-amber-400 uppercase tracking-widest font-mono flex items-center gap-1">
                              👑 Team Leader
                            </span>
                            {leader.member_id && (
                              <span className="font-mono text-[9px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                                {leader.member_id}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1 text-left">
                            <h4 className="font-extrabold text-white text-sm">{leader.full_name}</h4>
                            <p className="font-mono text-[10px] text-zinc-400">
                              Class {leader.class} | Sec: <strong className="text-zinc-200">{leader.section}</strong> | Roll: <strong className="text-zinc-200">{leader.roll}</strong>
                            </p>
                            {leader.email && (
                              <p className="font-mono text-[10px] text-zinc-500 truncate" title={leader.email}>
                                ✉️ {leader.email}
                              </p>
                            )}
                            {leader.phone && (
                              <p className="font-mono text-[10px] text-amber-400 font-bold mt-1">
                                📞 {leader.phone}
                              </p>
                            )}
                          </div>

                          <div className="pt-2 border-t border-amber-500/10 flex justify-end">
                            <button
                              onClick={() => setSelectedRegistrant(leader)}
                              className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                            >
                              <Eye className="w-3 h-3" /> Inspect Leader
                            </button>
                          </div>
                        </div>

                        {/* TEAMMATES CARD SECTIONS */}
                        {teammates.map((tm, idx) => (
                          <div key={tm.id || idx} className="bg-white/[0.02] border border-white/10 rounded-2xl p-5 space-y-3 relative">
                            <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                              <span className="px-2.5 py-0.5 rounded text-[8px] font-black bg-purple-500/20 text-purple-300 uppercase tracking-widest font-mono flex items-center gap-1">
                                👥 Teammate {idx + 1}
                              </span>
                              {tm.member_id && (
                                <span className="font-mono text-[9px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                  {tm.member_id}
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-left">
                              <h4 className="font-extrabold text-white text-sm">{tm.full_name}</h4>
                              <p className="font-mono text-[10px] text-zinc-400">
                                Class {tm.class} | Sec/Inst: <strong className="text-zinc-200">{tm.section}</strong> | Roll: <strong className="text-zinc-200">{tm.roll}</strong>
                              </p>
                              {tm.email && (
                                <p className="font-mono text-[10px] text-zinc-500 truncate" title={tm.email}>
                                  ✉️ {tm.email}
                                </p>
                              )}
                              {tm.phone && (
                                <p className="font-mono text-[10px] text-amber-400 font-bold mt-1">
                                  📞 {tm.phone}
                                </p>
                              )}
                            </div>

                            <div className="pt-2 border-t border-white/5 flex justify-end">
                              <button
                                onClick={() => setSelectedRegistrant(tm)}
                                className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-lg text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                              >
                                <Eye className="w-3 h-3 text-amber-500" /> Inspect Member
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Team Card Footer */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-zinc-500 pt-3 border-t border-white/5">
                        <span>Registered: {team.created_at ? new Date(team.created_at).toLocaleString() : 'N/A'}</span>
                        <span className="text-zinc-400 font-bold">Total Team Size: {team.members.length} Members</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white/[0.01] p-4 rounded-xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Registered Phone</p>
                  <p className="text-amber-500 font-bold font-mono mt-1">{selectedRegistrant.phone || "N/A"}</p>
                </div>
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
                  {resolveEventNames(selectedRegistrant.selected_events)}
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
            <div className="flex justify-between items-center pt-2 border-t border-white/5">
              {selectedRegistrant.verified === "yes" && (
                <button
                  onClick={() => {
                    setSelectedSlipCandidate({
                      id: selectedRegistrant.id,
                      fullName: selectedRegistrant.full_name,
                      email: selectedRegistrant.email,
                      phone: selectedRegistrant.phone,
                      memberId: selectedRegistrant.member_id || selectedRegistrant.user_id || selectedRegistrant.id,
                      class: selectedRegistrant.class,
                      section: selectedRegistrant.section,
                      roll: selectedRegistrant.roll,
                      school: 'St. Joseph Higher Secondary School',
                      trxnid: selectedRegistrant.trxnid,
                      eventsList: [resolveEventNames(selectedRegistrant.selected_events)],
                      verified: true
                    });
                    setIsSlipModalOpen(true);
                  }}
                  className="px-5 py-3 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <Ticket className="w-4 h-4" /> View Purchase Slip & QR
                </button>
              )}

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

      {/* Purchase Slip Modal */}
      <PurchaseSlipModal
        candidate={selectedSlipCandidate}
        isOpen={isSlipModalOpen}
        onClose={() => setIsSlipModalOpen(false)}
      />
    </div>
  );
}
