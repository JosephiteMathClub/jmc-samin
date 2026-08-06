"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  FileSpreadsheet,
  Edit,
  Mail,
  Download,
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../lib/supabase";
import { useToast } from "../../context/ToastContext";
import { useContent } from "../../context/ContentContext";
import { DEFAULT_CONTENT } from "../../data/default-content";
import { DashboardSection } from "./DashboardSection";
import { DashboardButton } from "./DashboardButton";
import { DashboardFormField } from "./DashboardFormField";
import { Skeleton } from "../Skeleton";
import ConfirmModal from "../ConfirmModal";
import dynamic from "next/dynamic";

const QRScanner = dynamic(() => import("./QRScanner"), { ssr: false });

const isValidClassForTable = (
  className: string,
  tableName: string,
): boolean => {
  if (!className) return false;
  const norm = className.trim().toLowerCase();

  // Extract numbers first (e.g., "Class 5" -> 5)
  const numMatch = norm.match(/\d+/);
  if (numMatch) {
    const val = parseInt(numMatch[0], 10);
    if (val >= 3 && val <= 5) return tableName === "primary_events";
    if (val >= 6 && val <= 8) return tableName === "junior_events";
    if (val >= 9 && val <= 10) return tableName === "secondary_events";
    if (val >= 11 && val <= 12) return tableName === "higher_secondary_events";
  }

  // Roman Numerals or words if no digit is found
  if (norm.includes("xii") || norm.includes("twelve")) {
    return tableName === "higher_secondary_events";
  }
  if (norm.includes("xi") || norm.includes("eleven")) {
    return tableName === "higher_secondary_events";
  }
  if (norm.includes("ix") || norm.includes("nine")) {
    return tableName === "secondary_events";
  }
  if (norm.includes("x") || norm.includes("ten")) {
    return tableName === "secondary_events";
  }
  if (norm.includes("viii") || norm.includes("eight")) {
    return tableName === "junior_events";
  }
  if (norm.includes("vii") || norm.includes("seven")) {
    return tableName === "junior_events";
  }
  if (norm.includes("vi") || norm.includes("six")) {
    return tableName === "junior_events";
  }
  if (norm.includes("iv") || norm.includes("four")) {
    return tableName === "primary_events";
  }
  if (norm.includes("iii") || norm.includes("three")) {
    return tableName === "primary_events";
  }
  if (norm.includes("v") || norm.includes("five")) {
    return tableName === "primary_events";
  }

  return tableName === "primary_events"; // fallback
};

const getTicketCode = (reg: any, isGeneralMember: boolean, isEc: boolean, memberId: string | null): string => {
  if (isEc && memberId) {
    const cleanId = String(memberId).replace('JMC-', '').trim();
    const digitsOnly = cleanId.replace(/\D/g, '');
    if (digitsOnly.length >= 3) {
      return digitsOnly.slice(-3);
    }
    return digitsOnly.padStart(3, '0');
  }
  
  if (isGeneralMember) {
    if (memberId) {
      const cleanId = String(memberId).replace('JMC-', '').trim();
      const digitsOnly = cleanId.replace(/\D/g, '');
      if (digitsOnly.length === 5) {
        return digitsOnly.padStart(6, '1');
      } else if (digitsOnly.length >= 6) {
        return digitsOnly.slice(-6);
      }
    }
    if (reg) {
      const str = String(reg.id || "") + (reg.trxnid || "");
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
      }
      const code = Math.abs(hash % 900000) + 100000;
      return String(code);
    }
    return "110101";
  }
  
  if (!reg) return "73812";
  
  const str = String(reg.id || "") + (reg.trxnid || "");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const code = Math.abs(hash % 90000) + 10000;
  return String(code);
};

const CATEGORIES = ["Primary", "Junior", "Secondary", "Higher Secondary"];

const extractMemberId = (input: string): string => {
  let cleaned = (input || "").trim();
  if (!cleaned) return "";

  // 1. Try to parse as JSON first
  try {
    const data = JSON.parse(cleaned);
    if (data && typeof data === "object") {
      const resolved = data.id || data.member_id || data.code || "";
      cleaned = resolved.toString().trim();
    }
  } catch (err) {
    // 2. Not JSON. Check standard string line-by-line / keywords
    // Sift for "PassId:", "MemberId:", "id:", "member_id:"
    const lines = cleaned.split(/\r?\n/);
    for (const line of lines) {
      const passIdMatch = line.match(/PassId:\s*([A-Za-z0-9-]+)/i);
      const idMatch = line.match(/\bid:\s*([A-Za-z0-9-]+)/i);
      const mIdMatch = line.match(/member[-_]id:\s*([A-Za-z0-9-]+)/i);

      if (passIdMatch) {
        cleaned = passIdMatch[1];
        break;
      }
      if (idMatch) {
        cleaned = idMatch[1];
        break;
      }
      if (mIdMatch) {
        cleaned = mIdMatch[1];
        break;
      }
    }
  }

  // 3. Try to parse as HTTP/HTTPS URL
  if (cleaned.toLowerCase().startsWith("http://") || cleaned.toLowerCase().startsWith("https://")) {
    try {
      const url = new URL(cleaned);
      const idParam = url.searchParams.get("id") || url.searchParams.get("code") || url.searchParams.get("member_id");
      if (idParam) {
        cleaned = idParam.trim();
      } else {
        // Check path segments
        const paths = url.pathname.split("/").map(p => p.trim()).filter(Boolean);
        const matchedSegment = paths.find(p => /^\d{3}$|^\d{5}$|^\d{6}$/.test(p));
        if (matchedSegment) {
          cleaned = matchedSegment;
        }
      }
    } catch (e) {
      // Ignore URL parse error
    }
  }

  // Strip "JMC-" prefix
  let code = cleaned.replace(/JMC-/i, "").trim();

  // Extract digits only!
  const digitsOnly = code.replace(/\D/g, "");

  // If we have mapped a 3-digit, 5-digit, or 6-digit number, return it!
  if (digitsOnly.length === 3 || digitsOnly.length === 5 || digitsOnly.length === 6) {
    return digitsOnly;
  }

  // Fallback: match largest group of digits
  const match6 = digitsOnly.match(/\d{6}/);
  if (match6) return match6[0];

  const match5 = digitsOnly.match(/\d{5}/);
  if (match5) return match5[0];

  const match3 = digitsOnly.match(/\d{3}/);
  if (match3) return match3[0];

  return digitsOnly || cleaned.toUpperCase();
};

export const EventParticipation = ({
  isSuperAdmin = false,
}: {
  isSuperAdmin?: boolean;
}) => {
  const { content } = useContent();
  const { showToast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [activeEvent, setActiveEvent] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("Junior");
  const [participations, setParticipations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const [memberIdInput, setMemberIdInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  const bulkUploadRef = useRef<HTMLInputElement>(null);

  const logAction = async (
    actionType: string,
    target: string,
    details: string,
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle();

      await supabase.from("admin_audit_logs").insert({
        admin_id: user.id,
        admin_email: profile?.email || user.email,
        admin_name: profile?.full_name || "Admin",
        action_type: actionType,
        target: target,
        details: details,
      });
    } catch (e) {
      console.error("Failed to insert audit log:", e);
    }
  };

  // State for sub-tab and verifier
  const [adminSubTab, setAdminSubTab] = useState<"standard" | "verifier" | "attendance">(
    "standard",
  );
  const [pendingList, setPendingList] = useState<any[]>([]);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  // States for Fast Attendance / Check-In
  const [attendanceEvent, setAttendanceEvent] = useState<string>("");
  const [attendanceCategory, setAttendanceCategory] = useState<string>("All");
  const [attendanceSearch, setAttendanceSearch] = useState<string>("");
  const [attendanceStudents, setAttendanceStudents] = useState<any[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [isAbruptModalOpen, setIsAbruptModalOpen] = useState<boolean>(false);
  const [validatingStudentId, setValidatingStudentId] = useState<string | null>(null);

  // Abrupt additions form state
  const [abruptName, setAbruptName] = useState<string>("");
  const [abruptClass, setAbruptClass] = useState<string>("");
  const [abruptSection, setAbruptSection] = useState<string>("");
  const [abruptRoll, setAbruptRoll] = useState<string>("");
  const [abruptId, setAbruptId] = useState<string>("");

  const getCategoryFromClass = (cls: string): string => {
    const norm = String(cls).trim().toLowerCase();
    const numMatch = norm.match(/\d+/);
    if (numMatch) {
      const val = parseInt(numMatch[0], 10);
      if (val >= 3 && val <= 5) return "Primary";
      if (val >= 6 && val <= 8) return "Junior";
      if (val >= 9 && val <= 10) return "Secondary";
      if (val >= 11 && val <= 12) return "Higher Secondary";
    }
    if (norm.includes("xii") || norm.includes("twelve") || norm.includes("xi") || norm.includes("eleven")) {
      return "Higher Secondary";
    }
    if (norm.includes("ix") || norm.includes("nine") || norm.includes("x") || norm.includes("ten")) {
      return "Secondary";
    }
    if (norm.includes("viii") || norm.includes("eight") || norm.includes("vii") || norm.includes("seven") || norm.includes("vi") || norm.includes("six")) {
      return "Junior";
    }
    if (norm.includes("iv") || norm.includes("four") || norm.includes("iii") || norm.includes("three") || norm.includes("v") || norm.includes("five")) {
      return "Primary";
    }
    return "Junior";
  };

  const fetchAttendanceList = useCallback(async (event: string, category: string) => {
    if (!event || !category || !isSupabaseConfigured) return;
    setLoadingAttendance(true);
    try {
      let allRegs: any[] = [];
      if (category === "All") {
        const tables = ["primary_events", "junior_events", "secondary_events", "higher_secondary_events"];
        const results = await Promise.all(
          tables.map(tb => supabase.from(tb).select("*"))
        );
        results.forEach((res, index) => {
          if (res.data) {
            const tblName = tables[index];
            const mappedRegs = res.data.map((r: any) => ({
              ...r,
              tableName: tblName,
              rowCategory: tblName === "primary_events" ? "Primary" :
                           tblName === "junior_events" ? "Junior" :
                           tblName === "secondary_events" ? "Secondary" : "Higher Secondary"
            }));
            allRegs = [...allRegs, ...mappedRegs];
          }
        });
      } else {
        let tableName = "";
        if (category === "Primary") tableName = "primary_events";
        else if (category === "Junior") tableName = "junior_events";
        else if (category === "Secondary") tableName = "secondary_events";
        else if (category === "Higher Secondary") tableName = "higher_secondary_events";

        if (!tableName) {
          setLoadingAttendance(false);
          return;
        }

        const { data: data, error: regError } = await supabase
          .from(tableName)
          .select("*");

        if (regError) throw regError;
        allRegs = (data || []).map((r: any) => ({
          ...r,
          tableName,
          rowCategory: category
        }));
      }

      const filteredRegs = allRegs.filter((reg: any) => {
        if (!reg.selected_events) return false;
        const selectedList = reg.selected_events
          .split(",")
          .map((s: string) => s.trim().toLowerCase());
        return selectedList.includes(event.trim().toLowerCase()) ||
               reg.selected_events.toLowerCase().includes(event.trim().toLowerCase());
      });

      // Extract all userIds from the filtered registrations
      const userIds = filteredRegs.map((reg: any) => reg.user_id).filter(Boolean);

      const userToMemberMap: Record<string, string> = {};
      const verifiedUsers = new Set<string>();

      if (userIds.length > 0) {
        // Query both member and ec_member only for these userIds in parallel
        const [memberRes, ecMemberRes] = await Promise.all([
          supabase
            .from("member")
            .select("id, member_id, verified")
            .in("id", userIds),
          supabase
            .from("ec_member")
            .select("id, member_id, verified")
            .in("id", userIds)
        ]);

        if (memberRes.data) {
          memberRes.data.forEach((m: any) => {
            if (m.id && m.member_id) {
              userToMemberMap[m.id] = m.member_id;
            }
            if (m.id && (m.verified === "yes" || m.verified === true)) {
              verifiedUsers.add(m.id);
            }
          });
        }

        if (ecMemberRes.data) {
          ecMemberRes.data.forEach((m: any) => {
            if (m.id && m.member_id) {
              userToMemberMap[m.id] = m.member_id;
            }
            // EC members are always auto-verified
            if (m.id) {
              verifiedUsers.add(m.id);
            }
          });
        }
      }

      // Filter to keep all registrations except rejected ones to ensure every single person is shown on the fast attendance sheet
      const filtered = filteredRegs.filter((reg: any) => {
        const isRejected = reg.verified === "rejected" || String(reg.verified).toLowerCase() === "rejected";
        return !isRejected;
      });

      // Fetch recorded participations for this specific event and category
      let partQuery = supabase
        .from("event_participation")
        .select("member_id, category")
        .eq("event_name", event);

      if (category !== "All") {
        partQuery = partQuery.eq("category", category);
      }

      const { data: partData, error: partError } = await partQuery;

      const participationSet = new Set<string>();
      if (!partError && partData) {
        partData.forEach((p: any) => {
          if (p.member_id) {
            participationSet.add(p.member_id.trim().toLowerCase());
          }
        });
      }

      const mapped = filtered.map((reg: any) => {
        const memberId = userToMemberMap[reg.user_id];
        const uniqueId = memberId || reg.trxnid || `REG-${reg.id.substring(0, 8)}`;
        const participated = participationSet.has(uniqueId.trim().toLowerCase()) || (memberId ? participationSet.has(memberId.trim().toLowerCase()) : false);

        return {
          ...reg,
          uniqueId,
          participated,
          memberId
        };
      });

      // Fetch EC members (except Academics EC) who can freely enter any event
      let ecMapped: any[] = [];
      const { data: ecData, error: ecErr } = await supabase
        .from("ec_member")
        .select("*");
      
      if (!ecErr && ecData) {
        const eligibleEcMembers = ecData.filter((m: any) => {
          const dept = String(m.department || "").toLowerCase().trim();
          const isAcademic = dept === "academics" || dept.includes("acad");
          return !isAcademic;
        });

        const filteredEcMembers = eligibleEcMembers.filter((ec: any) => {
          if (category !== "All") {
            const rowCategory = getCategoryFromClass(ec.class || "");
            return rowCategory === category;
          }
          return true;
        });

        ecMapped = filteredEcMembers.map((ec: any) => {
          const memberId = ec.member_id || "";
          const uniqueId = memberId || `EC-${ec.id.substring(0, 8)}`;
          const participated = participationSet.has(uniqueId.trim().toLowerCase());

          return {
            id: `ec-${ec.id}`,
            user_id: ec.id,
            full_name: ec.full_name || "",
            class: ec.class || "N/A",
            section: ec.section || "N/A",
            roll: ec.roll || "N/A",
            phone: ec.phone || ec.contact || "N/A",
            tableName: "ec_member",
            rowCategory: getCategoryFromClass(ec.class || ""),
            selected_events: event,
            uniqueId,
            participated,
            memberId,
            isEcMember: true
          };
        });
      }

      // Merge standard registrations and eligible EC members (avoid duplicates by uniqueId)
      const registeredUniqueIds = new Set(mapped.map(m => m.uniqueId.trim().toLowerCase()));
      const ecNotRegistered = ecMapped.filter(ec => !registeredUniqueIds.has(ec.uniqueId.trim().toLowerCase()));
      const combinedMapped = [...mapped, ...ecNotRegistered];

      // Get extra participations that were abruptly added
      const registeredMemberIds = new Set(combinedMapped.map(m => m.uniqueId.trim().toLowerCase()));
      const extraParticipations = (partData || []).filter(p => {
        return p.member_id && !registeredMemberIds.has(p.member_id.trim().toLowerCase());
      });

      if (extraParticipations.length > 0) {
        const extraMemberIds = extraParticipations.map(p => p.member_id);
        
        // Fetch details from both member and ec_member to get full profile info for extras
        const [extraMembersRes, extraEcMembersRes] = await Promise.all([
          supabase
            .from("member")
            .select("member_id, full_name, class, section, roll")
            .in("member_id", extraMemberIds),
          supabase
            .from("ec_member")
            .select("member_id, full_name, class, section, roll")
            .in("member_id", extraMemberIds)
        ]);

        const extraMembersMap: Record<string, any> = {};
        if (extraMembersRes.data) {
          extraMembersRes.data.forEach((m: any) => {
            if (m.member_id) {
              extraMembersMap[m.member_id.trim().toLowerCase()] = m;
            }
          });
        }
        if (extraEcMembersRes.data) {
          extraEcMembersRes.data.forEach((m: any) => {
            if (m.member_id) {
              extraMembersMap[m.member_id.trim().toLowerCase()] = m;
            }
          });
        }

        const extraMapped = extraParticipations.map((p: any) => {
          const key = p.member_id.trim().toLowerCase();
          const mem = extraMembersMap[key];
          return {
            id: `extra-${p.member_id}`,
            full_name: mem?.full_name || "Guest Participant",
            class: mem?.class || "N/A",
            section: mem?.section || "N/A",
            roll: mem?.roll || "N/A",
            uniqueId: p.member_id,
            participated: true,
            isAbrupt: true,
            rowCategory: p.category || category
          };
        });

        setAttendanceStudents([...combinedMapped, ...extraMapped]);
      } else {
        setAttendanceStudents(combinedMapped);
      }
    } catch (err: any) {
      console.error("Error fetching attendance list:", err);
      showToast(err.message, "error");
    } finally {
      setLoadingAttendance(false);
    }
  }, [showToast]);

  const validateStudentParticipation = async (student: any) => {
    const rawCategory = student.rowCategory || attendanceCategory;
    const targetCategory = rawCategory && rawCategory !== "All" ? rawCategory : getCategoryFromClass(student.class || "Junior");
    if (!attendanceEvent || !targetCategory || targetCategory === "All" || !isSupabaseConfigured) return;
    setValidatingStudentId(student.uniqueId);
    try {
      const mId = student.uniqueId;
      
      const { data: dbMem } = await supabase
        .from("member")
        .select("member_id")
        .eq("member_id", mId)
        .maybeSingle();

      if (!dbMem) {
        const insertPayload: any = {
          member_id: mId,
          full_name: student.full_name || "Guest Participant",
          class: student.class || "N/A",
          section: student.section || "N/A",
          roll: student.roll || "N/A",
          phone: "N/A",
          email: student.email || "",
          email_address: student.email || "",
          verified: "yes",
          payment_method: "Sync (Fast Check-In)",
          school: "St Joseph",
          updated_at: new Date().toISOString()
        };
        
        const { error: memberError } = await supabase.from("member").insert(insertPayload);
        if (memberError) throw memberError;
      }

      const { error: partError } = await supabase
        .from("event_participation")
        .insert({
          member_id: mId,
          event_name: attendanceEvent,
          category: targetCategory,
          position: null
        });

      if (partError) throw partError;

      showToast(`Successfully marked ${student.full_name} as participated!`, "success");
      
      await logAction(
        "VALIDATE_EVENT_PARTICIPATION_FAST",
        `${attendanceEvent}:${targetCategory}:${mId}`,
        `Validated participation for ${student.full_name} (${mId}) in event ${attendanceEvent} (${targetCategory}).`
      );

      await fetchAttendanceList(attendanceEvent, attendanceCategory);
    } catch (err: any) {
      console.error("Error validating participation:", err);
      showToast(err.message, "error");
    } finally {
      setValidatingStudentId(null);
    }
  };

  const handleAbruptAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abruptId || !abruptName || !isSupabaseConfigured) {
      showToast("ID and Name are required fields.", "error");
      return;
    }
    setLoading(true);
    try {
      const formattedAbruptId = abruptId.trim();
      const rawCategory = attendanceCategory;
      const targetCategory = rawCategory && rawCategory !== "All" ? rawCategory : getCategoryFromClass(abruptClass);

      // Check duplicate in event_participation
      const { data: existing } = await supabase
        .from("event_participation")
        .select("id")
        .eq("member_id", formattedAbruptId)
        .eq("event_name", attendanceEvent)
        .eq("category", targetCategory)
        .maybeSingle();

      if (existing) {
        throw new Error(`Participant with ID ${formattedAbruptId} has already participated in this event/category.`);
      }

      // Upsert to member
      const insertPayload: any = {
        member_id: formattedAbruptId,
        full_name: abruptName.trim(),
        class: abruptClass.trim() || "N/A",
        section: abruptSection.trim() || "N/A",
        roll: abruptRoll.trim() || "N/A",
        phone: "N/A",
        email: "",
        email_address: "",
        verified: "yes",
        payment_method: "Abrupt Add (Super Admin)",
        school: "St Joseph",
        updated_at: new Date().toISOString()
      };

      const { error: memError } = await supabase.from("member").upsert(insertPayload);
      if (memError) throw memError;

      // Insert to event_participation
      const { error: partError } = await supabase
        .from("event_participation")
        .insert({
          member_id: formattedAbruptId,
          event_name: attendanceEvent,
          category: targetCategory,
          position: null
        });

      if (partError) throw partError;

      showToast(`Abruptly added and validated ${abruptName.trim()}!`, "success");

      await logAction(
        "ABRUPT_ADD_PARTICIPATION",
        `${attendanceEvent}:${targetCategory}:${formattedAbruptId}`,
        `Abruptly added non-registered participant ${abruptName.trim()} (${formattedAbruptId}) in event ${attendanceEvent} (${targetCategory}).`
      );

      // Reset form & state
      setAbruptName("");
      setAbruptClass("");
      setAbruptSection("");
      setAbruptRoll("");
      setAbruptId("");
      setIsAbruptModalOpen(false);

      // Refresh
      await fetchAttendanceList(attendanceEvent, attendanceCategory);
    } catch (err: any) {
      console.error("Error abruptly adding participant:", err);
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCSV = () => {
    try {
      const query = attendanceSearch.toLowerCase().trim();
      const filteredList = attendanceStudents.filter((student) => {
        if (!query) return true;
        return (
          (student.full_name || "").toLowerCase().includes(query) ||
          (student.uniqueId || "").toLowerCase().includes(query) ||
          (student.class || "").toLowerCase().includes(query) ||
          (student.section || "").toLowerCase().includes(query) ||
          (student.roll || "").toLowerCase().includes(query)
        );
      });

      if (filteredList.length === 0) {
        showToast("No records to export matching search criteria.", "error");
        return;
      }

      // Helper to escape values for CSV compatibility
      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        let str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      // Define columns
      const headers = [
        "Participant Name",
        "Class",
        "Section",
        "Roll",
        "Unique ID / Ticket",
        "Status",
        "Type",
        "bKash Number",
        "TrxnID",
        "Amount (BDT)",
        "Email"
      ];

      // Map rows
      const rows = filteredList.map((student) => [
        escapeCSV(student.full_name),
        escapeCSV(student.class),
        escapeCSV(student.section),
        escapeCSV(student.roll),
        escapeCSV(student.uniqueId),
        escapeCSV(student.participated ? "Participated" : "Not Participated"),
        escapeCSV(student.isAbrupt ? "Abrupt Addition" : "Registered Participant"),
        escapeCSV(student.bkash_number || "N/A"),
        escapeCSV(student.trxnid || "N/A"),
        escapeCSV(student.amount !== undefined ? student.amount : "N/A"),
        escapeCSV(student.email || "N/A")
      ]);

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...rows.map(row => row.join(","))
      ].join("\n");

      // Formulate blob and trigger download with UTF-8 BOM for Excel compatibility
      const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      
      const safeEventName = (attendanceEvent || "event").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const safeCategoryName = (attendanceCategory || "category").replace(/[^a-z0-9]/gi, "_").toLowerCase();
      const timestamp = new Date().toISOString().split("T")[0];
      
      link.setAttribute("href", url);
      link.setAttribute("download", `attendance_${safeEventName}_${safeCategoryName}_${timestamp}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast("Successfully generated and downloaded CSV sheet!", "success");
    } catch (err: any) {
      console.error("Error generating CSV:", err);
      showToast("Failed to generate CSV export.", "error");
    }
  };

  // States for Email Confirmations Log Sub-tab
  const [emailLogs, setEmailLogs] = useState<any[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailsError, setEmailsError] = useState<string | null>(null);
  const [emailsSearch, setEmailsSearch] = useState("");
  const [selectedLogPreview, setSelectedLogPreview] = useState<any | null>(null);

  const fetchEmailLogs = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsLoadingEmails(true);
    setEmailsError(null);
    try {
      const { data, error } = await supabase
        .from("email_confirmations_sent")
        .select("*")
        .order("sent_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") {
          setEmailsError("The 'email_confirmations_sent' table does not exist in your database yet. It has been successfully declared in SUPABASE_SETUP.sql for the next schema deployment.");
        } else {
          setEmailsError(error.message);
        }
        setEmailLogs([]);
      } else {
        setEmailLogs(data || []);
      }
    } catch (err: any) {
      console.error("Error fetching email logs:", err);
      setEmailsError(err.message || "An unexpected error occurred while fetching email logs.");
    } finally {
      setIsLoadingEmails(false);
    }
  }, []);


  // States for Editing in Transactions Verifier (Super Admin only)
  const [editRecordId, setEditRecordId] = useState<string | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editClass, setEditClass] = useState("");
  const [editSection, setEditSection] = useState("");
  const [editRoll, setEditRoll] = useState("");
  const [editBkashNumber, setEditBkashNumber] = useState("");
  const [editTrxnId, setEditTrxnId] = useState("");
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editSelectedEvents, setEditSelectedEvents] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const startEditing = (rec: any) => {
    setEditRecordId(rec.id);
    setEditFullName(rec.full_name || "");
    setEditClass(rec.class || "");
    setEditSection(rec.section || "");
    setEditRoll(rec.roll || "");
    setEditBkashNumber(rec.bkash_number || "");
    setEditTrxnId(rec.trxnid || "");
    setEditAmount(rec.amount || 0);
    setEditSelectedEvents(rec.selected_events || "");
  };

  const handleSaveEdit = async (recordId: string, tableName: string) => {
    if (!isSuperAdmin) {
      showToast("Forbidden: Only Super Admins can edit transactions.", "error");
      return;
    }
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          full_name: editFullName,
          class: editClass,
          section: editSection,
          roll: editRoll,
          bkash_number: editBkashNumber,
          trxnid: editTrxnId,
          amount: Number(editAmount),
          selected_events: editSelectedEvents,
        })
        .eq("id", recordId);

      if (error) throw error;

      showToast("Transaction updated successfully", "success");
      await logAction(
        "EDIT_EVENT_TRANSACTION",
        `Table: ${tableName}`,
        `Edited registration details for record ${recordId}.`,
      );
      setEditRecordId(null);
      fetchPendingRegistrations();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setSavingEdit(false);
    }
  };

  // States for deleting transactions (Super Admin only)
  const [deleteTxId, setDeleteTxId] = useState<string | null>(null);
  const [deleteTxTable, setDeleteTxTable] = useState<string>("");
  const [isDeletingTx, setIsDeletingTx] = useState(false);

  const handleDeleteTransaction = async () => {
    if (!deleteTxId || !deleteTxTable) return;
    if (!isSuperAdmin) {
      showToast(
        "Forbidden: Only Super Admins can delete transactions.",
        "error",
      );
      return;
    }
    setIsDeletingTx(true);
    try {
      // Delete strictly this single transaction record
      const { error } = await supabase
        .from(deleteTxTable)
        .delete()
        .eq("id", deleteTxId);

      if (error) throw error;

      showToast(
        "Transaction registration deleted successfully",
        "success",
      );
      await logAction(
        "DELETE_EVENT_TRANSACTION",
        `Table: ${deleteTxTable}`,
        `Permanently deleted registration/transaction record ${deleteTxId}.`,
      );
      setPendingList((prev) => prev.filter((p) => p.id !== deleteTxId));
      setDeleteTxId(null);
      fetchPendingRegistrations();
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingTx(false);
    }
  };

  const fetchPendingRegistrations = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    const tables = [
      "primary_events",
      "junior_events",
      "secondary_events",
      "higher_secondary_events",
    ];
    let allPending: any[] = [];
    
    for (const tb of tables) {
      try {
        let data: any[] | null = null;
        let error: any = null;

        // Try querying with boolean false first (since db_schema says they are boolean)
        const boolRes = await supabase
          .from(tb)
          .select("*")
          .eq("verified", false);

        if (boolRes.error) {
          // Fall back to querying with string 'no' (for text column)
          const strRes = await supabase
            .from(tb)
            .select("*")
            .eq("verified", "no");
          data = strRes.data;
          error = strRes.error;
        } else {
          data = boolRes.data;
          error = boolRes.error;
        }

        if (error) {
          console.error(`Error querying pending from ${tb}:`, error);
          showToast(`Database error loading ${tb.split('_').join(' ')}: ${error.message}`, "error");
          continue;
        }

        if (data && data.length > 0) {
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          let emailsMap: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profs, error: profError } = await supabase
              .from("profiles")
              .select("id, email")
              .in("id", userIds);
            
            if (profError) {
              console.error(`Error querying profiles for ${tb}:`, profError);
            } else {
              profs?.forEach((p: any) => {
                emailsMap[p.id] = p.email;
              });
            }
          }

          const mapped = data.map((item: any) => ({
            ...item,
            tableName: tb,
            email: emailsMap[item.user_id] || "",
          }));
          allPending = [...allPending, ...mapped];
        }
      } catch (err: any) {
        console.error(`Unexpected error loading pending events for ${tb}:`, err);
      }
    }
    setPendingList(allPending);
  }, [showToast]);

  const getBaseTrxnId = useCallback((trxnid: string) => {
    if (!trxnid) return "";
    return trxnid.replace(/-T\d+$/i, "").trim().toUpperCase();
  }, []);

  const groupedPendingTransactions = useMemo(() => {
    const map = new Map<string, {
      key: string;
      baseTrxnId: string;
      tableName: string;
      selectedEvents: string;
      bkashNumber: string;
      totalAmount: number;
      leader: any;
      members: any[];
    }>();

    pendingList.forEach((rec) => {
      const trxnid = rec.trxnid || "";
      const baseTrxn = getBaseTrxnId(trxnid);
      
      const groupKey = baseTrxn && !baseTrxn.startsWith("PROXY-")
        ? `${rec.tableName}_${baseTrxn}_${(rec.selected_events || "").trim().toLowerCase()}`
        : `${rec.tableName}_${rec.id}`;

      if (!map.has(groupKey)) {
        map.set(groupKey, {
          key: groupKey,
          baseTrxnId: baseTrxn || trxnid,
          tableName: rec.tableName,
          selectedEvents: rec.selected_events || "",
          bkashNumber: rec.bkash_number || "",
          totalAmount: Number(rec.amount) || 0,
          leader: rec,
          members: [rec],
        });
      } else {
        const group = map.get(groupKey)!;
        group.members.push(rec);
        if (Number(rec.amount) > group.totalAmount) {
          group.totalAmount = Number(rec.amount);
        }
        if (!trxnid.toUpperCase().includes("-T")) {
          group.leader = rec;
          if (rec.bkash_number) group.bkashNumber = rec.bkash_number;
        }
      }
    });

    return Array.from(map.values());
  }, [pendingList, getBaseTrxnId]);

  useEffect(() => {
    fetchPendingRegistrations();
  }, [fetchPendingRegistrations]);

  const handleVerifyTransaction = async (
    recordId: string,
    tableName: string,
    action: "approve" | "reject",
    emailAddress: string,
  ) => {
    setVerifyingId(recordId);
    try {
      let verifiedBy = "Admin";
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          verifiedBy = user.email || user.id;
        }
      } catch (authErr) {
        console.warn("Could not retrieve logged-in admin auth for verifiedBy:", authErr);
      }

      const res = await fetch("/api/admin/verify-event-registration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recordId, tableName, action, emailAddress, verifiedBy }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(
          data.message || `Transaction verified successfully`,
          "success",
        );
        // Optimistic update: filter out all member records matching targetBaseTrxn or recordId
        const targetRec = pendingList.find((p) => p.id === recordId);
        const targetBaseTrxn = targetRec?.trxnid ? getBaseTrxnId(targetRec.trxnid) : "";
        setPendingList((prev) => prev.filter((p) => {
          if (targetBaseTrxn && p.trxnid) {
            return getBaseTrxnId(p.trxnid) !== targetBaseTrxn;
          }
          return p.id !== recordId;
        }));

        // Log action
        await logAction(
          action === "approve"
            ? "APPROVE_EVENT_REGISTRATION"
            : "REJECT_EVENT_REGISTRATION",
          `Table: ${tableName}`,
          `Processed record ${recordId} for action ${action}.`,
        );
        fetchPendingRegistrations();
      } else {
        throw new Error(data.error || "Failed to process verification call.");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setVerifyingId(null);
    }
  };

  // Event Mode States
  const eventMode = content?.site?.eventMode || false;
  const [viewMode, setViewMode] = useState<
    "select" | "options" | "manual" | "scan"
  >("select");
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  // Modal for deletion
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stats
  const [stats, setStats] = useState({ total: 0, distinctUsers: 0 });

  // Team states
  const activeEventData = events.find((e) => e.title === activeEvent);
  const isTeamEvent = activeEventData?.isTeamEvent || false;
  const teamSize = activeEventData?.teamSize || 1;
  const [teamMemberInputs, setTeamMemberInputs] = useState<string[]>(
    Array(10).fill(""),
  );
  const [scannedTeam, setScannedTeam] = useState<string[]>([]);

  // Load events from content with fallback
  useEffect(() => {
    const rawEvents =
      content?.events?.events || DEFAULT_CONTENT.events?.events || [];
    if (rawEvents.length > 0) {
      const updatedEvents = [...rawEvents];
      
      const hasEscapeRoom = updatedEvents.some(
        (e: any) => e.title.toLowerCase() === "escape room"
      );
      if (!hasEscapeRoom) {
        updatedEvents.push({
          id: "event-team-escape-room",
          title: "Escape Room",
          isTeamEvent: true,
          teamSize: 2,
          category: "Competition",
          description: "Escape Room"
        });
      }
      
      const hasTicTacToe = updatedEvents.some(
        (e: any) => e.title.toLowerCase() === "tic-tac-toe"
      );
      if (!hasTicTacToe) {
        updatedEvents.push({
          id: "event-team-tic-tac-toe",
          title: "Tic-Tac-Toe",
          isTeamEvent: true,
          teamSize: 3,
          category: "Competition",
          description: "Tic-Tac-Toe"
        });
      }

      setEvents(updatedEvents);
      if (
        updatedEvents.length > 0 &&
        (!activeEvent || !updatedEvents.find((e: any) => e.title === activeEvent))
      ) {
        setActiveEvent(updatedEvents[0].title);
      }
      if (
        updatedEvents.length > 0 &&
        (!attendanceEvent || !updatedEvents.find((e: any) => e.title === attendanceEvent))
      ) {
        setAttendanceEvent(updatedEvents[0].title);
      }
    }
  }, [content, activeEvent, attendanceEvent]);

  useEffect(() => {
    if (adminSubTab === "attendance" && attendanceEvent && attendanceCategory) {
      fetchAttendanceList(attendanceEvent, attendanceCategory);
    }
  }, [adminSubTab, attendanceEvent, attendanceCategory, fetchAttendanceList]);

  // Fetch participations for current selection
  const fetchParticipations = useCallback(async () => {
    if (!activeEvent || !isSupabaseConfigured) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("event_participation")
        .select("*")
        .eq("event_name", activeEvent)
        .eq("category", activeCategory);

      if (error) throw error;
      setParticipations(data || []);

      // Update stats for the whole event
      const { data: eventData, error: eventError } = await supabase
        .from("event_participation")
        .select("member_id")
        .eq("event_name", activeEvent);

      if (!eventError && eventData) {
        const unique = new Set(eventData.map((p) => p.member_id));
        setStats({
          total: eventData.length,
          distinctUsers: unique.size,
        });
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [activeEvent, activeCategory, showToast]);

  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  const addParticipantByMemberId = async (
    mId: string,
    forceSuperAdminException = false,
  ) => {
    const formattedId = extractMemberId(mId);
    if (!formattedId || !activeEvent || !activeCategory) return;

    const ensureMemberRegistration = async (m: { id?: string; member_id: string; full_name: string; is_ec?: boolean }) => {
      if (!m || !m.member_id) return;
      
      const { data: dbMem } = await supabase
        .from("member")
        .select("id")
        .eq("member_id", m.member_id)
        .maybeSingle();
        
      if (dbMem) return; // Already synced and exists

      let ecDetails = null;
      if (m.is_ec || (m.member_id && m.member_id.length <= 4)) {
        const { data: ecData } = await supabase
          .from("ec_member")
          .select("*")
          .eq("member_id", m.member_id)
          .maybeSingle();
        if (ecData) {
          ecDetails = ecData;
        }
      }

      const userUUID = m.id && !m.id.startsWith("DUMMY-") ? m.id : (ecDetails?.id || null);

      const insertPayload: any = {
        member_id: m.member_id,
        full_name: ecDetails?.full_name || m.full_name || "Guest Participant",
        class: ecDetails?.class || "N/A",
        section: ecDetails?.section || "N/A",
        roll: ecDetails?.roll || "N/A",
        phone: ecDetails?.phone || "N/A",
        email: ecDetails?.email || "",
        email_address: ecDetails?.email || "",
        verified: "yes",
        is_ec: m.is_ec || (ecDetails ? true : false),
        payment_method: "Sync (Event Check-In)",
        school: "St Joseph",
        updated_at: new Date().toISOString()
      };

      if (userUUID) {
        insertPayload.id = userUUID;
        await supabase.from("member").upsert(insertPayload);
      } else {
        await supabase.from("member").insert(insertPayload);
      }
    };

    try {
      // 1. Check if member exists (try direct, JMC prefix, suffix, computed ticket code match, or fallback scan)
      let member = null;

      // Check member table exact
      const { data: exactMember, error: exactError } = await supabase
        .from("member")
        .select("id, full_name, verified, member_id, is_ec")
        .eq("member_id", formattedId)
        .maybeSingle();

      if (exactError) throw exactError;

      // Check ec_member table exact
      const { data: exactEcMember } = await supabase
        .from("ec_member")
        .select("id, full_name, verified, member_id, is_ec")
        .eq("member_id", formattedId)
        .maybeSingle();

      if (exactMember) {
        member = exactMember;
      } else if (exactEcMember) {
        member = { ...exactEcMember, is_ec: true };
      } else {
        const prependedId = `JMC-${formattedId}`;
        const { data: prependedMember, error: prependedError } = await supabase
          .from("member")
          .select("id, full_name, verified, member_id, is_ec")
          .eq("member_id", prependedId)
          .maybeSingle();

        if (prependedError) throw prependedError;

        const { data: prependedEcMember } = await supabase
          .from("ec_member")
          .select("id, full_name, verified, member_id, is_ec")
          .eq("member_id", prependedId)
          .maybeSingle();

        if (prependedMember) {
          member = prependedMember;
        } else if (prependedEcMember) {
          member = { ...prependedEcMember, is_ec: true };
        } else if (formattedId.length >= 3) {
          const { data: suffixMatches, error: suffixError } = await supabase
            .from("member")
            .select("id, full_name, verified, member_id, is_ec")
            .ilike("member_id", `%${formattedId}`);

          if (suffixError) throw suffixError;

          const { data: suffixEcMatches } = await supabase
            .from("ec_member")
            .select("id, full_name, verified, member_id, is_ec")
            .ilike("member_id", `%${formattedId}`);

          const combinedSuffix = [
            ...(suffixMatches || []),
            ...(suffixEcMatches || []).map((m) => ({ ...m, is_ec: true }))
          ];

          if (combinedSuffix.length > 0) {
            const perfectSub = combinedSuffix.find((m) =>
              m.member_id.endsWith(`-${formattedId}`),
            );
            member = perfectSub || combinedSuffix[0];
          }
        }
      }

      // Check if ID matches a computed ticket-code (e.g. general member 6-digit code or EC 3-digit code)
      if (!member) {
        const tables = [
          "primary_events",
          "junior_events",
          "secondary_events",
          "higher_secondary_events",
        ];
        let foundRegByTicket = null;
        let foundCandidateMember = null;
        for (const tb of tables) {
          const { data: regs } = await supabase
            .from(tb)
            .select("id, full_name, user_id, trxnid, bkash_number, selected_events, verified, class, section, roll");
          if (regs) {
            for (const reg of regs) {
              let isRegMember = false;
              let isRegEc = false;
              let regMemberId = null;
              if (reg.user_id) {
                const { data: mem } = await supabase
                  .from("member")
                  .select("id, full_name, verified, member_id, is_ec")
                  .eq("id", reg.user_id)
                  .maybeSingle();
                if (mem) {
                  regMemberId = mem.member_id;
                  isRegEc = mem.is_ec === true || mem.is_ec === 'yes';
                  const is5Digit = regMemberId && /^\d{5}$/.test(String(regMemberId).trim());
                  isRegMember = (mem.verified === 'yes' || mem.verified === true) && !is5Digit;
                } else {
                  // Fallback: check ec_member table
                  const { data: ecMem } = await supabase
                    .from("ec_member")
                    .select("id, full_name, verified, member_id, is_ec")
                    .eq("id", reg.user_id)
                    .maybeSingle();
                  if (ecMem) {
                    regMemberId = ecMem.member_id;
                    isRegEc = true;
                    const is5Digit = regMemberId && /^\d{5}$/.test(String(regMemberId).trim());
                    isRegMember = (ecMem.verified === 'yes' || ecMem.verified === true) && !is5Digit;
                  }
                }
              }
              const calculatedCode = getTicketCode(reg, isRegMember, isRegEc, regMemberId);
              if (calculatedCode === formattedId) {
                foundRegByTicket = reg;
                foundCandidateMember = {
                  id: reg.user_id || `DUMMY-${reg.id}`,
                  full_name: reg.full_name,
                  verified: reg.verified,
                  member_id: regMemberId || reg.trxnid,
                  is_ec: isRegEc,
                  is_member: isRegMember
                };
                break;
              }
            }
          }
          if (foundRegByTicket) break;
        }

        if (foundCandidateMember) {
          member = foundCandidateMember;
        }
      }

      // Fallback direct scan lookup across event tables if not registered/found yet
      if (!member) {
        const tables = [
          "primary_events",
          "junior_events",
          "secondary_events",
          "higher_secondary_events",
        ];
        let foundReg = null;
        for (const tb of tables) {
          const { data } = await supabase
            .from(tb)
            .select("id, full_name, user_id, trxnid, bkash_number, selected_events, verified")
            .or(`trxnid.eq.${formattedId},bkash_number.eq.${formattedId},full_name.ilike.%${formattedId}%`)
            .limit(1);
          if (data && data.length > 0) {
            foundReg = data[0];
            break;
          }
        }

        if (foundReg) {
          if (foundReg.user_id) {
            const { data: linkedMem } = await supabase
              .from("member")
              .select("id, full_name, verified, member_id, is_ec")
              .eq("id", foundReg.user_id)
              .maybeSingle();
            if (linkedMem) {
              member = linkedMem;
            } else {
              const { data: linkedEcMem } = await supabase
                .from("ec_member")
                .select("id, full_name, verified, member_id, is_ec")
                .eq("id", foundReg.user_id)
                .maybeSingle();
              if (linkedEcMem) {
                member = { ...linkedEcMem, is_ec: true };
              }
            }
          }

          if (!member) {
            member = {
              id: foundReg.user_id || `DUMMY-${foundReg.id}`,
              full_name: foundReg.full_name,
              verified: foundReg.verified,
              member_id: foundReg.trxnid,
              is_ec: false
            };
          }
        }
      }

      if (!member) {
        throw new Error(`Member with ID or criteria "${formattedId}" not found.`);
      }

      // 2. Check if verified for registration of INTRA EVENTS
      let hasVerifiedRegistration = false;
      let isEventRegisteredAtAll = false;
      let matchedRegRecord: any = null;
      let matchedRegTable = "";

      if (member.id && !member.id.startsWith("DUMMY-")) {
        const tables = [
          "primary_events",
          "junior_events",
          "secondary_events",
          "higher_secondary_events",
        ];

        for (const tb of tables) {
          const { data, error } = await supabase
            .from(tb)
            .select("id, trxnid, full_name, selected_events, verified")
            .eq("user_id", member.id);

          if (data && data.length > 0) {
            for (const reg of data) {
              const selectedList = (reg.selected_events || "")
                .split(",")
                .map((s: string) => s.trim().toLowerCase());

              const isMatch = selectedList.includes(activeEvent.toLowerCase());
              if (isMatch) {
                isEventRegisteredAtAll = true;
                matchedRegRecord = reg;
                matchedRegTable = tb;
                if (reg.verified === "yes" || reg.verified === true || member.verified === "yes" || member.verified === true || member.is_ec === true || member.is_ec === "yes") {
                  hasVerifiedRegistration = true;
                }
              }
            }
          }
        }
      } else if (member.id && member.id.startsWith("DUMMY-")) {
        // Dummy fallback direct row match
        const tables = [
          "primary_events",
          "junior_events",
          "secondary_events",
          "higher_secondary_events",
        ];
        const dummyId = member.id.replace("DUMMY-", "");
        for (const tb of tables) {
          const { data } = await supabase
            .from(tb)
            .select("id, trxnid, full_name, selected_events, verified")
            .eq("id", parseInt(dummyId, 10));
          if (data && data.length > 0) {
            for (const reg of data) {
              const selectedList = (reg.selected_events || "")
                .split(",")
                .map((s: string) => s.trim().toLowerCase());

              const isMatch = selectedList.includes(activeEvent.toLowerCase());
              if (isMatch) {
                isEventRegisteredAtAll = true;
                matchedRegRecord = reg;
                matchedRegTable = tb;
                if (reg.verified === "yes" || reg.verified === true || member.verified === "yes" || member.verified === true || member.is_ec === true || member.is_ec === "yes") {
                  hasVerifiedRegistration = true;
                }
              }
            }
          }
        }
      }

      // Handle bypass conditions with exact requirements
      if (member.verified === "yes" || member.verified === true || member.is_ec === true || member.is_ec === "yes") {
        hasVerifiedRegistration = true;
      }

      if (!isEventRegisteredAtAll) {
        if (isSuperAdmin) {
          const confirmBypass = window.confirm(
            `You didn't register for this segment, only super admin can allow one to bypass this system and enter the event.\n\nDo you want to allow this bypass?`
          );
          if (!confirmBypass) {
            throw new Error("You didn't register for this segment, only super admin can allow one to bypass this system and enter the event.");
          }
        } else {
          throw new Error("You didn't register for this segment, only super admin can allow one to bypass this system and enter the event.");
        }
      } else if (!hasVerifiedRegistration && !forceSuperAdminException) {
        if (isSuperAdmin) {
          const confirmBypass = window.confirm(
            `The user ${member.full_name} is registered but their fee verification is still pending.\n\nDo you want to allow a Super Admin exception to force participation?`
          );
          if (!confirmBypass) {
            throw new Error("Registration verification is pending.");
          }
        } else {
          throw new Error("Registration verification is pending.");
        }
      }

      // Check if this is a team event
      const isTeam = activeEventData?.isTeamEvent || false;

      if (isTeam && matchedRegRecord) {
        // Get the root Transaction ID for this team
        const rootTrxnid = matchedRegRecord.trxnid.replace(/-T\d+$/, '');
        const isPlaceholder = !rootTrxnid || 
                              rootTrxnid.trim().length < 4 || 
                              ['n/a', 'na', 'none', 'pending', 'null', 'nil', 'test', '0', 'bkash', 'b-kash', 'payment', 'unpaid', 'placeholder'].includes(rootTrxnid.trim().toLowerCase());

        // Fetch all team registration entries sharing this rootTrxnid across all tables
        const tables = [
          "primary_events",
          "junior_events",
          "secondary_events",
          "higher_secondary_events",
        ];
        let teamRegRecords: any[] = [];
        if (!isPlaceholder) {
          for (const tb of tables) {
            const { data } = await supabase
              .from(tb)
              .select("user_id, trxnid, full_name, selected_events, verified")
              .or(`trxnid.eq.${rootTrxnid},trxnid.eq.${rootTrxnid}-T2,trxnid.eq.${rootTrxnid}-T3`);
            if (data && data.length > 0) {
              teamRegRecords = [...teamRegRecords, ...data.map((d: any) => ({ ...d, tableName: tb }))];
            }
          }
        } else {
          teamRegRecords = [matchedRegRecord];
        }

        // Keep only records that contain the activeEvent
        teamRegRecords = teamRegRecords.filter((or) => {
          const list = (or.selected_events || "").split(",").map((s: string) => s.trim().toLowerCase());
          return list.includes(activeEvent.toLowerCase());
        });

        // Resolve each teammate to canonical member_id and full_name
        const teamMembersToRegister: { member_id: string; full_name: string; id?: string }[] = [];
        for (const tr of teamRegRecords) {
          let canonicalMemberId = tr.trxnid;
          let rName = tr.full_name;
          let uId = tr.user_id;

          if (tr.user_id) {
            const { data: mem } = await supabase
              .from("member")
              .select("member_id, full_name, id")
              .eq("id", tr.user_id)
              .maybeSingle();
            if (mem) {
              canonicalMemberId = mem.member_id || tr.trxnid;
              rName = mem.full_name || tr.full_name;
              uId = mem.id;
            } else {
              const { data: ecMem } = await supabase
                .from("ec_member")
                .select("member_id, full_name, id")
                .eq("id", tr.user_id)
                .maybeSingle();
              if (ecMem) {
                canonicalMemberId = ecMem.member_id || tr.trxnid;
                rName = ecMem.full_name || tr.full_name;
                uId = ecMem.id;
              }
            }
          }
          teamMembersToRegister.push({
            member_id: canonicalMemberId,
            full_name: rName,
            id: uId
          });
        }

        // Ensure each team member has a verified record in the 'member' table to meet the foreign key requirement
        for (const tm of teamMembersToRegister) {
          await ensureMemberRegistration({
            id: tm.id,
            member_id: tm.member_id,
            full_name: tm.full_name,
            is_ec: tm.member_id ? (tm.member_id.length <= 4) : false
          });
        }

        // Check if ANY member's ID in this team already exists in event_participation for this event
        const teamMemberIds = teamMembersToRegister.map(tm => tm.member_id);
        const { data: existingTeamParticipation, error: teamCheckError } = await supabase
          .from("event_participation")
          .select("member_id")
          .eq("event_name", activeEvent)
          .in("member_id", teamMemberIds);

        if (teamCheckError) throw teamCheckError;

        if (existingTeamParticipation && existingTeamParticipation.length > 0) {
          const checkedInId = existingTeamParticipation[0].member_id;
          const checkedInName = teamMembersToRegister.find(tm => tm.member_id === checkedInId)?.full_name || checkedInId;
          throw new Error(`This team has already been checked-in under member "${checkedInName}". Duplicate entries are not allowed.`);
        }

        // Insert all team members as participants
        const inserts = teamMembersToRegister.map(tm => ({
          member_id: tm.member_id,
          event_name: activeEvent,
          category: activeCategory,
          position: null
        }));

        const { error: insertError } = await supabase
          .from("event_participation")
          .insert(inserts);

        if (insertError) throw insertError;

        showToast(
          `Team checked in successfully! All ${teamMembersToRegister.length} members verified for ${activeEvent}.`,
          "success"
        );
        fetchParticipations();
        return true;
      } else {
        // Solo Event participation
        // Ensure solo member exists in standard member table to prevent foreign keys breaking
        await ensureMemberRegistration({
          id: member.id,
          member_id: member.member_id,
          full_name: member.full_name,
          is_ec: member.is_ec === true || member.is_ec === 'yes'
        });

        // 3. Check if already participating in THIS event and category
        const { data: existing, error: checkError } = await supabase
          .from("event_participation")
          .select("id")
          .eq("member_id", member.member_id)
          .eq("event_name", activeEvent)
          .eq("category", activeCategory)
          .maybeSingle();

        if (checkError) throw checkError;
        if (existing) {
          showToast(
            `Checked! ${member.full_name} is already checked-in and verified for "${activeEvent}".`,
            "success",
          );
          return true;
        }

        // 4. Add to participation (using the fully canonical member_id)
        const { error: insertError } = await supabase
          .from("event_participation")
          .insert({
            member_id: member.member_id,
            event_name: activeEvent,
            category: activeCategory,
            position: null
          });

        if (insertError) throw insertError;

        showToast(
          `Welcome, ${member.full_name}! Verified for ${activeEvent}.`,
          "success",
        );
        fetchParticipations();
        return true;
      }
    } catch (err: any) {
      showToast(err.message, "error");
      return false;
    }
  };

  const handleAddParticipant = async () => {
    setAddingMember(true);
    if (!memberIdInput.trim()) {
      showToast("Please enter a member ID or code.", "error");
      setAddingMember(false);
      return;
    }
    const success = await addParticipantByMemberId(memberIdInput);
    if (success) {
      setMemberIdInput("");
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
      // Split by newline, comma, or semicolon and filter out empty strings (allow both JMC- prefix and 3-digit EC IDs)
      const ids = text
        .split(/[\r\n,;]+/)
        .map((id) => id.trim().toUpperCase())
        .filter((id) => id && (id.startsWith("JMC-") || /^\d{3}$/.test(id)));

      if (ids.length === 0) {
        throw new Error("No valid JMC or EC IDs found in the file.");
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
        showToast(
          `Successfully added ${successCount} participants!`,
          "success",
        );
        fetchParticipations();
      }
      if (failCount > 0) {
        showToast(
          `${failCount} entries failed. Check console for details.`,
          "error",
        );
        console.error("Bulk upload errors:", errors);
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsBulkUploading(false);
      if (bulkUploadRef.current) bulkUploadRef.current.value = "";
    }
  };

  const [lastScannedId, setLastScannedId] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const scannedCooldownRef = useRef<{ [key: string]: number }>({});

  const handleQRScan = async (decodedText: string) => {
    if (isScanning) return;

    let scannedId = "";
    try {
      const data = JSON.parse(decodedText);
      scannedId = data.id || "";
    } catch (err) {
      scannedId = decodedText.trim().toUpperCase();
    }

    if (!scannedId) return;

    // Cooldown check (3 seconds per ID) to prevent spamming the same ID
    const now = Date.now();
    if (
      scannedCooldownRef.current[scannedId] &&
      now - scannedCooldownRef.current[scannedId] < 3000
    ) {
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

  const updatePosition = async (
    participationId: string,
    position: number | null,
  ) => {
    try {
      const { error } = await supabase
        .from("event_participation")
        .update({ position })
        .eq("id", participationId);

      if (error) throw error;

      setParticipations((prev) =>
        prev.map((p) => (p.id === participationId ? { ...p, position } : p)),
      );
      showToast("Position updated successfully", "success");

      // Log action
      const pRecord = participations.find((p) => p.id === participationId);
      if (pRecord) {
        await logAction(
          "UPDATE_EVENT_POSITION",
          `Event: ${activeEvent || "Unknown"}`,
          `Updated position for ${pRecord.member_name || pRecord.member_id} in category ${activeCategory} to ${position === null ? "None" : position}.`,
        );
      }
    } catch (err: any) {
      showToast(err.message, "error");
    }
  };

  const removeParticipant = async (id: string) => {
    setIsDeleting(true);
    try {
      const pRecord = participations.find((p) => p.id === id);
      const { error } = await supabase
        .from("event_participation")
        .delete()
        .eq("id", id);

      if (error) throw error;
      setParticipations((prev) => prev.filter((p) => p.id !== id));
      showToast("Participant removed", "success");
      setDeleteId(null);

      // Log action
      if (pRecord) {
        await logAction(
          "DELETE_EVENT_PARTICIPANT",
          `Event: ${activeEvent || "Unknown"}`,
          `Removed participant ${pRecord.member_name || pRecord.member_id} from category ${activeCategory}.`,
        );
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredParticipations = React.useMemo(() => {
    return participations.filter((p) =>
      p.member_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [participations, searchTerm]);

  const winners = React.useMemo(() => {
    return {
      first: participations.find((p) => p.position === 1),
      second: participations.find((p) => p.position === 2),
      third: participations.find((p) => p.position === 3),
    };
  }, [participations]);

  const [isAnnouncing, setIsAnnouncing] = useState(false);

  const announceResults = async () => {
    if (!activeEvent || !activeCategory) return;
    setIsAnnouncing(true);
    showToast("Starting to send requirement emails...", "info");

    try {
      const res = await fetch("/api/admin/announce-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: activeEvent,
          category: activeCategory,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        showToast(
          data.message || `Successfully sent ${data.sentCount} emails!`,
          "success",
        );
        if (data.errors && data.errors.length > 0) {
          console.error("Email errors:", data.errors);
        }

        // Log action
        await logAction(
          "ANNOUNCE_EVENT_RESULTS",
          `Event: ${activeEvent}`,
          `Announced results and emailed ${data.sentCount || 0} participants in category ${activeCategory}.`,
        );
      } else {
        throw new Error(data.error || "Failed to announce results");
      }
    } catch (err: any) {
      showToast(err.message, "error");
    } finally {
      setIsAnnouncing(false);
    }
  };

  return (
    <div className="space-y-12">
      {/* Sub-tabs bar */}
      <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 max-w-3xl flex-wrap gap-1 md:flex-nowrap">
        <button
          onClick={() => setAdminSubTab("standard")}
          className={`flex-1 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            adminSubTab === "standard"
              ? "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/25"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Deployments & Deployers
        </button>
        <button
          onClick={() => setAdminSubTab("verifier")}
          className={`flex-1 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 relative whitespace-nowrap ${
            adminSubTab === "verifier"
              ? "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/25"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Event Transactions Verifier
          {groupedPendingTransactions.length > 0 && (
            <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce absolute top-2 right-2" />
          )}
        </button>
        <button
          onClick={() => setAdminSubTab("attendance")}
          className={`flex-1 py-3.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
            adminSubTab === "attendance"
              ? "bg-amber-500 text-black font-black shadow-lg shadow-amber-500/25"
              : "text-zinc-500 hover:text-white"
          }`}
        >
          Fast Attendance Sheet
        </button>
      </div>

      {adminSubTab === "verifier" ? (
        <div className="space-y-8 animate-fade-in">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
              <Trophy className="w-8 h-8 text-amber-500" />
              Transaction Approver Node
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Evaluate and confirm event registrations against the bKash payment
              portal.
            </p>
          </div>

          {groupedPendingTransactions.length === 0 ? (
            <div className="glass-card p-16 text-center rounded-[2.5rem] border border-dashed border-white/10 max-w-3xl">
              <CheckCircle2 className="w-16 h-16 text-zinc-800 mx-auto mb-6 opacity-30 animate-pulse" />
              <p className="text-sm font-bold text-zinc-500 uppercase tracking-wide">
                No pending event registrations
              </p>
              <p className="text-xs text-zinc-600 mt-2 font-medium">
                All student ledger items are currently confirmed and up-to-date.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {groupedPendingTransactions.map((group) => {
                const rec = group.leader;
                const isEditingThis = editRecordId === rec.id;
                const isMultiMember = group.members.length > 1;

                return isEditingThis ? (
                  <div
                    key={group.key}
                    className="glass-card p-8 rounded-3xl border border-amber-500/30 bg-[#030303]/90 flex flex-col gap-6 animate-fade-in text-left"
                  >
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wide">
                        Editing Details for {rec.full_name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">ID: {rec.id}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={editFullName}
                          onChange={(e) => setEditFullName(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Class
                        </label>
                        <input
                          type="text"
                          value={editClass}
                          onChange={(e) => setEditClass(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Section
                        </label>
                        <input
                          type="text"
                          value={editSection}
                          onChange={(e) => setEditSection(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Roll
                        </label>
                        <input
                          type="text"
                          value={editRoll}
                          onChange={(e) => setEditRoll(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          bKash Number
                        </label>
                        <input
                          type="text"
                          value={editBkashNumber}
                          onChange={(e) => setEditBkashNumber(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          TrxnID
                        </label>
                        <input
                          type="text"
                          value={editTrxnId}
                          onChange={(e) => setEditTrxnId(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Amount
                        </label>
                        <input
                          type="number"
                          value={editAmount}
                          onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                          Selected Events
                        </label>
                        <input
                          type="text"
                          value={editSelectedEvents}
                          onChange={(e) => setEditSelectedEvents(e.target.value)}
                          className="w-full bg-white/5 text-white border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button
                        onClick={() => handleSaveEdit(rec.id, rec.tableName)}
                        disabled={savingEdit}
                        className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                      >
                        {savingEdit ? "Saving..." : "Save Changes"}
                      </button>
                      <button
                        onClick={() => setEditRecordId(null)}
                        className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    key={group.key}
                    className="glass-card p-8 rounded-3xl border border-white/5 hover:border-white/10 transition-all flex flex-col gap-6 text-left"
                  >
                    <div className="flex justify-between items-start flex-wrap gap-4">
                      <div>
                        <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-1">
                          {group.tableName.replace("_events", " events")}
                        </p>
                        <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2 flex-wrap">
                          {group.leader.full_name}
                          {isMultiMember && (
                            <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-lg flex items-center gap-1">
                              <Users className="w-3 h-3" /> Team ({group.members.length} Members)
                            </span>
                          )}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-wider rounded-xl">
                          Pending Verification
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-y border-white/5">
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          Class / Sec / Roll
                        </p>
                        <p className="text-xs text-white font-mono">
                          {isMultiMember ? (
                            `${group.members.length} Team Members Registered`
                          ) : (
                            `Class ${group.leader.class} • Sec ${group.leader.section} • Roll ${group.leader.roll}`
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          BKash No.
                        </p>
                        <p className="text-xs text-white font-mono">
                          {group.bkashNumber || rec.bkash_number}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          TrxnID
                        </p>
                        <p className="text-xs text-amber-500 font-mono font-bold">
                          {group.baseTrxnId}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                          Total Amount
                        </p>
                        <p className="text-xs text-white font-mono">
                          ৳{group.totalAmount}
                        </p>
                      </div>
                    </div>

                    {isMultiMember && (
                      <div className="bg-white/5 rounded-2xl p-4 border border-white/5 space-y-3">
                        <div className="flex justify-between items-center">
                          <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" /> Registered Team Members ({group.members.length})
                          </p>
                          <span className="text-[9px] text-zinc-400 font-mono">1 Grouped Transaction</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {group.members.map((m: any, idx: number) => (
                            <div key={m.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex flex-col gap-1 text-left">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white truncate">{m.full_name}</span>
                                {idx === 0 ? (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-amber-500/20 text-amber-300 font-bold rounded uppercase">Leader</span>
                                ) : (
                                  <span className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 font-bold rounded uppercase">Member {idx + 1}</span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                Class {m.class} • Sec {m.section} • Roll {m.roll}
                              </p>
                              <p className="text-[9px] text-zinc-500 font-mono truncate">
                                TrxID: {m.trxnid}
                              </p>
                              {isSuperAdmin && (
                                <button
                                  onClick={() => startEditing(m)}
                                  className="mt-1 text-[9px] text-orange-400 hover:underline text-left font-bold cursor-pointer"
                                >
                                  Edit Member Details
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Registered Events
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {(group.selectedEvents || "")
                          .split(",")
                          .map((ev: string) => (
                            <span
                              key={ev}
                              className="px-3 py-1.5 bg-white/5 border border-white/5 rounded-lg text-[10px] text-zinc-300 font-bold uppercase tracking-wider"
                            >
                              {ev.trim()}
                            </span>
                          ))}
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-row gap-3 justify-end pt-4 border-t border-white/5 flex-wrap w-full">
                      {verifyingId === rec.id ? (
                        <div className="flex items-center gap-2.5 text-zinc-400 bg-white/5 px-6 py-4 rounded-2xl border border-white/5 text-[10px] font-black uppercase tracking-widest animate-pulse max-w-xs justify-center">
                          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                          Processing...
                        </div>
                      ) : (
                        <>
                          {isSuperAdmin && (
                            <>
                              <button
                                disabled={verifyingId !== null}
                                onClick={() => startEditing(rec)}
                                className="py-3 px-5 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500/20 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <Edit className="w-3.5 h-3.5" /> Edit Details
                              </button>
                              <button
                                disabled={verifyingId !== null}
                                onClick={() => {
                                  setDeleteTxId(rec.id);
                                  setDeleteTxTable(rec.tableName);
                                }}
                                className="py-3 px-5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </>
                          )}
                          <button
                            disabled={verifyingId !== null}
                            onClick={() =>
                              handleVerifyTransaction(
                                rec.id,
                                rec.tableName,
                                "approve",
                                rec.email,
                              )
                            }
                            className="py-3 px-5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,197,94,0.1)] cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve {isMultiMember ? `Team (${group.members.length})` : ""}
                          </button>
                          <button
                            disabled={verifyingId !== null}
                            onClick={() =>
                              handleVerifyTransaction(
                                rec.id,
                                rec.tableName,
                                "reject",
                                rec.email,
                              )
                            }
                            className="py-3 px-5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-black text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                          >
                            Reject {isMultiMember ? `Team (${group.members.length})` : ""}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : adminSubTab === "attendance" ? (() => {
        const query = attendanceSearch.toLowerCase().trim();
        const filteredList = attendanceStudents.filter((student) => {
          if (!query) return true;
          return (
            (student.full_name || "").toLowerCase().includes(query) ||
            (student.uniqueId || "").toLowerCase().includes(query) ||
            (student.class || "").toLowerCase().includes(query) ||
            (student.section || "").toLowerCase().includes(query) ||
            (student.roll || "").toLowerCase().includes(query)
          );
        });

        const verifiedCount = filteredList.filter((s) => s.participated).length;
        const pendingCount = filteredList.length - verifiedCount;
        const totalCount = filteredList.length;

        const verifiedPercent = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
        const pendingPercent = totalCount > 0 ? 100 - verifiedPercent : 0;

        const r = 36;
        const circumference = 2 * Math.PI * r;
        const verifiedArc = totalCount > 0 ? (verifiedCount / totalCount) * circumference : 0;
        const pendingArc = totalCount > 0 ? (pendingCount / totalCount) * circumference : 0;

        return (
          <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="text-left">
                <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                  <Users className="w-8 h-8 text-amber-500" />
                  Fast Event Attendance Sheet
                </h2>
                <p className="text-xs text-zinc-500 font-medium">
                  Rapidly mark participant attendance and check-in status for large events.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 self-start md:self-auto">
                <button
                  onClick={handleDownloadCSV}
                  className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download CSV
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={() => setIsAbruptModalOpen(true)}
                    className="px-5 py-3 bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-amber-500 hover:text-black transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Abruptly Add Non-Participant
                  </button>
                )}
              </div>
            </div>

            {/* Status Distribution Visualization Card */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white/[0.02] border border-white/5 rounded-[32px] p-6 lg:p-8">
              {/* Column 1: Donut Chart and dynamic numbers */}
              <div className="lg:col-span-1 bg-black/30 border border-white/5 rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="relative w-44 h-44 flex items-center justify-center">
                  {/* SVG Donut Chart */}
                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90 animate-fade-in">
                    {/* Background Track */}
                    <circle
                      cx={50}
                      cy={50}
                      r={36}
                      fill="transparent"
                      stroke="#18181b" /* zinc-900 */
                      strokeWidth={8}
                    />
                    {totalCount > 0 ? (
                      <>
                        {/* Verified / Participated Segment (Emerald) */}
                        <circle
                          cx={50}
                          cy={50}
                          r={36}
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth={8}
                          strokeDasharray={`${verifiedArc} ${circumference}`}
                          strokeDashoffset={0}
                          strokeLinecap={verifiedCount > 0 && pendingCount > 0 ? "butt" : "round"}
                          className="transition-all duration-1000 ease-out"
                        />
                        {/* Pending Segment (Amber) */}
                        <circle
                          cx={50}
                          cy={50}
                          r={36}
                          fill="transparent"
                          stroke="#f59e0b"
                          strokeWidth={8}
                          strokeDasharray={`${pendingArc} ${circumference}`}
                          strokeDashoffset={-verifiedArc}
                          strokeLinecap={verifiedCount > 0 && pendingCount > 0 ? "butt" : "round"}
                          className="transition-all duration-1000 ease-out"
                        />
                      </>
                    ) : (
                      <circle
                        cx={50}
                        cy={50}
                        r={36}
                        fill="transparent"
                        stroke="#3f3f46" /* zinc-700 empty state */
                        strokeWidth={8}
                        className="transition-all duration-500"
                      />
                    )}
                  </svg>
                  {/* Center text overlay */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white tracking-tighter">
                      {totalCount}
                    </span>
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
                      Total Listed
                    </span>
                  </div>
                </div>
              </div>

              {/* Column 2 & 3: Detailed Metrics List and Legend */}
              <div className="lg:col-span-2 flex flex-col justify-between gap-6">
                <div className="text-left">
                  <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">
                    Attendance & Check-in Coverage
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    Real-time ratio of registered participants who have been checked in and verified at the venue gates.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Metric 1: Verified (Checked In) */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-emerald-500/20 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 shadow-md group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Verified Check-in
                        </p>
                        <p className="text-2xl font-black text-white mt-1">
                          {verifiedCount}
                          <span className="text-xs font-bold text-zinc-500 ml-1">
                            / {totalCount}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-black rounded-lg">
                        {verifiedPercent}%
                      </span>
                    </div>
                  </div>

                  {/* Metric 2: Pending Verification */}
                  <div className="bg-black/20 border border-white/5 rounded-2xl p-5 flex items-center justify-between gap-4 transition-all hover:border-amber-500/20 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-md group-hover:scale-105 transition-transform">
                        <AlertCircle className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          Pending Gate Check
                        </p>
                        <p className="text-2xl font-black text-white mt-1">
                          {pendingCount}
                          <span className="text-xs font-bold text-zinc-500 ml-1">
                            / {totalCount}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black rounded-lg">
                        {pendingPercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar Visual Representation */}
                <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden flex">
                  <div 
                    className="bg-emerald-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${verifiedPercent}%` }}
                  />
                  <div 
                    className="bg-amber-500 h-full transition-all duration-1000 ease-out"
                    style={{ width: `${pendingPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Controls Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white/5 p-6 rounded-3xl border border-white/10 text-left">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Event
              </label>
              <select
                value={attendanceEvent}
                onChange={(e) => setAttendanceEvent(e.target.value)}
                className="w-full bg-black/40 text-amber-400 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-amber-500/50"
              >
                {events.map((ev) => (
                  <option key={ev.title} value={ev.title} className="bg-zinc-900 text-white font-medium">
                    {ev.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Category
              </label>
              <select
                value={attendanceCategory}
                onChange={(e) => setAttendanceCategory(e.target.value)}
                className="w-full bg-black/40 text-amber-400 border border-white/10 rounded-2xl px-4 py-3 text-xs font-bold uppercase tracking-wider outline-none focus:border-amber-500/50"
              >
                {["All", "Primary", "Junior", "Secondary", "Higher Secondary"].map((cat) => (
                  <option key={cat} value={cat} className="bg-zinc-900 text-white font-medium">
                    {cat === "All" ? "All Categories" : `${cat} Category`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                Search Sheet
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={(e) => setAttendanceSearch(e.target.value)}
                  placeholder="Search by name, ID, class..."
                  className="w-full bg-black/40 text-white placeholder-zinc-600 border border-white/10 rounded-2xl pl-12 pr-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Attendance Sheet Table */}
          <div className="overflow-hidden rounded-[32px] border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Participant Name
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Class
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Section
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Roll
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Unique ID / Ticket
                  </th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">
                    Participation Status & Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loadingAttendance ? (
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td colSpan={6} className="px-8 py-6 text-center">
                        <div className="h-4 bg-white/5 rounded-lg w-1/3 animate-pulse mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : attendanceStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                      No registered students found for {attendanceEvent} ({attendanceCategory} Category).
                    </td>
                  </tr>
                ) : (() => {
                  if (filteredList.length === 0) {
                    return (
                      <tr>
                        <td colSpan={6} className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                          No participants found matching "{attendanceSearch}".
                        </td>
                      </tr>
                    );
                  }

                  return filteredList.map((student, idx) => (
                    <tr key={student.uniqueId || idx} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-5 font-bold text-white text-xs flex items-center gap-2 text-left">
                        {student.full_name}
                        {student.isAbrupt && (
                          <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 text-[8px] font-black uppercase tracking-wider rounded">
                            Abruptly Added
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-zinc-400 font-mono text-xs text-left">
                        {student.class}
                      </td>
                      <td className="px-8 py-5 text-zinc-400 font-mono text-xs text-left">
                        {student.section}
                      </td>
                      <td className="px-8 py-5 text-zinc-400 font-mono text-xs text-left">
                        {student.roll}
                      </td>
                      <td className="px-8 py-5 text-left">
                        <code className="text-[10px] text-amber-500 font-mono bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded">
                          {student.uniqueId}
                        </code>
                      </td>
                      <td className="px-8 py-5 text-right">
                        {student.participated ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-wider rounded-xl">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Participated
                          </span>
                        ) : (
                          <button
                            disabled={validatingStudentId === student.uniqueId}
                            onClick={() => validateStudentParticipation(student)}
                            className="px-4 py-2 bg-amber-500 text-black hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-95"
                          >
                            {validatingStudentId === student.uniqueId ? "Validating..." : "Validate Participation"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>

          {/* Abrupt addition modal */}
          {isAbruptModalOpen && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
              <div className="bg-zinc-950 border border-white/10 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl relative">
                <div className="p-8 border-b border-white/5 bg-white/[0.02] text-left">
                  <h3 className="text-xl font-black text-white uppercase tracking-tight">
                    Abruptly Add Non-Participant
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1 font-medium">
                    Directly registers and validates participation for a non-registered student.
                  </p>
                </div>
                <form onSubmit={handleAbruptAdd} className="p-8 space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={abruptName}
                      onChange={(e) => setAbruptName(e.target.value)}
                      placeholder="e.g. Abdullah Khan"
                      className="w-full bg-white/5 text-white placeholder-zinc-700 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Class
                      </label>
                      <input
                        type="text"
                        value={abruptClass}
                        onChange={(e) => setAbruptClass(e.target.value)}
                        placeholder="e.g. 10"
                        className="w-full bg-white/5 text-white placeholder-zinc-700 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Section
                      </label>
                      <input
                        type="text"
                        value={abruptSection}
                        onChange={(e) => setAbruptSection(e.target.value)}
                        placeholder="e.g. A"
                        className="w-full bg-white/5 text-white placeholder-zinc-700 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                        Roll
                      </label>
                      <input
                        type="text"
                        value={abruptRoll}
                        onChange={(e) => setAbruptRoll(e.target.value)}
                        placeholder="e.g. 42"
                        className="w-full bg-white/5 text-white placeholder-zinc-700 border border-white/10 rounded-2xl px-4 py-3 text-xs font-medium outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
                      Unique ID / JMC ID *
                    </label>
                    <input
                      type="text"
                      required
                      value={abruptId}
                      onChange={(e) => setAbruptId(e.target.value)}
                      placeholder="e.g. JMC-101010 or Custom ID"
                      className="w-full bg-white/5 text-white placeholder-zinc-700 border border-white/10 rounded-2xl px-4 py-3 text-xs font-mono outline-none focus:border-amber-500/50 transition-all"
                    />
                  </div>
                  <div className="flex gap-4 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setIsAbruptModalOpen(false)}
                      className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all text-center"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3.5 bg-amber-500 hover:bg-amber-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-black text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-amber-500/15 text-center"
                    >
                      {loading ? "Adding..." : "Add & Validate"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      );
    })() : eventMode ? (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
                <Zap className="w-8 h-8 text-amber-500" />
                Live Event Mode
              </h2>
              <p className="text-xs text-zinc-500 font-medium">
                Streamlined participation tracking for on-ground events.
              </p>
            </div>
            {viewMode !== "select" && (
              <button
                onClick={() => setViewMode("select")}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-zinc-400 uppercase tracking-widest hover:bg-white/10 hover:text-white transition-all flex items-center gap-2"
              >
                <ArrowLeft className="w-3 h-3" /> Change Event/Category
              </button>
            )}
          </div>

          <AnimatePresence mode="wait">
            {viewMode === "select" ? (
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
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                      Step 1: Select Event
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                    {events.length === 0 ? (
                      <div className="p-8 rounded-2x border border-dashed border-white/10 text-center">
                        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest leading-relaxed">
                          No events found. Add them in the Events tab.
                        </p>
                      </div>
                    ) : (
                      events.map((ev) => (
                        <button
                          key={ev.title}
                          onClick={() => setActiveEvent(ev.title)}
                          className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all border ${
                            activeEvent === ev.title
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                              : "bg-white/5 text-zinc-500 border-transparent hover:border-white/10 hover:text-zinc-300"
                          }`}
                        >
                          {ev.title}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                <div className="glass-card p-8 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg text-indigo-500">
                      <Filter className="w-5 h-5" />
                    </div>
                    <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                      Step 2: Select Category
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`w-full text-left px-6 py-4 rounded-2xl text-xs font-bold transition-all border ${
                          activeCategory === cat
                            ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                            : "bg-white/5 text-zinc-500 border-transparent hover:border-white/10 hover:text-zinc-300"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={() => setViewMode("options")}
                      disabled={!activeEvent || !activeCategory}
                      className="w-full py-5 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                      Continue to Deployment{" "}
                      <ChevronRight className="inline-block w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : viewMode === "options" ? (
              <motion.div
                key="options"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-8"
              >
                <button
                  onClick={() => setViewMode("manual")}
                  className="glass-card group p-12 text-center space-y-6 hover:border-amber-500/50 transition-all border-dashed border-2"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-amber-500 group-hover:text-black transition-all">
                    <Keyboard className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                      Manual Entry
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2">
                      Type in member Unique IDs one by one.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setViewMode("scan");
                    setIsQRScannerOpen(true);
                  }}
                  className="glass-card group p-12 text-center space-y-6 hover:border-indigo-500/50 transition-all border-dashed border-2"
                >
                  <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto group-hover:bg-indigo-500 group-hover:text-white transition-all">
                    <QrCode className="w-10 h-10" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-widest">
                      QR ID Scanner
                    </h3>
                    <p className="text-xs text-zinc-500 mt-2">
                      Continuously scan profile QR codes to add members
                      automatically.
                    </p>
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
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest ">
                      Active Session
                    </p>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">
                      {activeEvent}{" "}
                      <span className="text-zinc-600 mx-2">/</span>{" "}
                      <span className="text-indigo-400">{activeCategory}</span>
                    </h3>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                      <button
                        onClick={() => setViewMode("manual")}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                          viewMode === "manual"
                            ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                            : "text-zinc-500 hover:text-white"
                        }`}
                      >
                        <Keyboard className="w-3.5 h-3.5" /> Manual
                      </button>
                      <button
                        onClick={() => {
                          setViewMode("scan");
                          setIsQRScannerOpen(true);
                        }}
                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 ${
                          viewMode === "scan"
                            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
                            : "text-zinc-500 hover:text-white"
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
                        {isBulkUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        {isBulkUploading ? "Uploading..." : "Bulk Upload"}
                      </button>
                    </div>
                    <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-center">
                      <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                        Entries
                      </p>
                      <p className="text-lg font-black text-white">
                        {participations.length}
                      </p>
                    </div>
                  </div>
                </div>

                {viewMode === "manual" && (
                  <div className="glass-card p-8 flex flex-col gap-4">
                    <div className="flex-1">
                      <DashboardFormField
                        label={isTeamEvent ? "Captain or Teammate's Unique ID" : "Member Unique ID"}
                        description={isTeamEvent ? "Entering any team member's code will automatically register the entire team once" : "Type ID and press Add"}
                      >
                        <div className="relative">
                          <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                          <input
                            type="text"
                            value={memberIdInput}
                            onChange={(e) =>
                              setMemberIdInput(e.target.value.toUpperCase())
                            }
                            onKeyDown={(e) =>
                              e.key === "Enter" && handleAddParticipant()
                            }
                            placeholder="JMC-123456"
                            autoFocus
                            className="w-full pl-12 pr-6 py-4 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono"
                          />
                        </div>
                      </DashboardFormField>
                    </div>
                    <div className="self-end mt-4">
                      <DashboardButton
                        onClick={handleAddParticipant}
                        label={
                          addingMember
                            ? "Adding..."
                            : isTeamEvent
                              ? "Add Team"
                              : "Add Member"
                        }
                        disabled={addingMember || !memberIdInput.trim()}
                        icon={addingMember ? Loader2 : Plus}
                        className="h-[60px] px-12"
                      />
                    </div>
                  </div>
                )}

                {viewMode === "scan" && (
                  <div className="glass-card p-12 text-center space-y-6">
                    <div className="w-24 h-24 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto relative">
                      <QrCode className="w-12 h-12 text-indigo-400" />
                      <div className="absolute inset-0 rounded-[2.5rem] border-2 border-indigo-400/50 animate-ping opacity-20" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-xl font-bold text-white uppercase tracking-tight">
                        QR Scanner Active
                      </h4>
                      {isTeamEvent ? (
                        <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                          Single scan registers the entire team. Position any team member's QR code in front of the camera.
                        </p>
                      ) : (
                        <p className="text-zinc-500 text-xs max-w-xs mx-auto">
                          The scanner is running in the background. Position
                          member IDs in front of the camera.
                        </p>
                      )}
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
                    <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                      Live Participant List
                    </h4>
                    <Search className="w-4 h-4 text-zinc-700" />
                  </div>
                  <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                    {/* Desktop Table View */}
                    <table className="hidden md:table w-full text-left border-collapse">
                      <tbody className="divide-y divide-white/5">
                        {participations.length === 0 ? (
                          <tr>
                            <td className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                              No entries recorded yet.
                            </td>
                          </tr>
                        ) : (
                          [...participations].reverse().map((p) => (
                            <tr
                              key={p.id}
                              className="group hover:bg-white/[0.02] transition-colors"
                            >
                              <td className="px-8 py-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  </div>
                                  <code className="text-sm text-white font-mono">
                                    {p.member_id}
                                  </code>
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

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-white/5">
                      {participations.length === 0 ? (
                        <div className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                          No entries recorded yet.
                        </div>
                      ) : (
                        [...participations].reverse().map((p) => (
                          <div
                            key={p.id}
                            className="flex items-center justify-between p-6"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              </div>
                              <code className="text-sm text-white font-mono">
                                {p.member_id}
                              </code>
                            </div>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="p-3 bg-red-500/5 text-red-500 rounded-xl active:bg-red-500/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
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
              <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4 border-b border-white/5 pb-4">
                Select Event
              </h4>
              {events.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white/5 border border-dashed border-white/10 text-center space-y-4">
                  <Calendar className="w-8 h-8 text-zinc-700 mx-auto" />
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                    No events found. Go to the "Events" tab to add club events
                    first.
                  </p>
                </div>
              ) : (
                events.map((ev) => (
                  <button
                    key={ev.title}
                    onClick={() => setActiveEvent(ev.title)}
                    className={`flex items-center gap-3 px-4 py-4 rounded-2xl text-xs font-bold transition-all text-left ${
                      activeEvent === ev.title
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white border border-transparent"
                    }`}
                  >
                    <Filter className="w-4 h-4" />
                    <span className="truncate">{ev.title}</span>
                    {activeEvent === ev.title && (
                      <ChevronRight className="w-4 h-4 ml-auto" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Categories and Participants */}
            <div className="flex-1 space-y-8">
              <div className="p-2 bg-white/5 rounded-2xl flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                      activeCategory === cat
                        ? "bg-amber-500 text-black shadow-lg"
                        : "text-zinc-500 hover:text-white"
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
                    <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1">
                      Total Entries
                    </p>
                    <p className="text-2xl font-black text-white">
                      {stats.total}
                    </p>
                  </div>
                  <Users className="w-10 h-10 text-amber-500/20" />
                </div>
                <div className="p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                      Unique Users
                    </p>
                    <p className="text-2xl font-black text-white">
                      {stats.distinctUsers}
                    </p>
                  </div>
                  <Award className="w-10 h-10 text-indigo-400/20" />
                </div>
              </div>

              {/* Add Participant Input */}
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1 w-full">
                  <DashboardFormField
                    label={isTeamEvent ? "Captain or Teammate's Unique ID" : "Member Unique ID"}
                    description={isTeamEvent ? "Entering any team member's code will automatically register the entire team once" : "Enter the JMC-XXXXXX code to add a participant"}
                  >
                    <div className="relative">
                      <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                      <input
                        type="text"
                        value={memberIdInput}
                        onChange={(e) =>
                          setMemberIdInput(e.target.value.toUpperCase())
                        }
                        placeholder="JMC-123456"
                        className="w-full pl-12 pr-6 py-3.5 bg-black/40 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono"
                      />
                    </div>
                  </DashboardFormField>
                </div>
                <div className="flex gap-2 h-[54px] w-full md:w-auto">
                  <DashboardButton
                    onClick={handleAddParticipant}
                    label={
                      addingMember
                        ? "Adding..."
                        : isTeamEvent
                          ? "Add Team"
                          : "Add"
                    }
                    disabled={
                      addingMember ||
                      !activeEvent ||
                      !memberIdInput.trim()
                    }
                    icon={addingMember ? Loader2 : Plus}
                    className="flex-1 min-w-[120px]"
                  />

                  <button
                    onClick={() => setIsQRScannerOpen(true)}
                    disabled={!activeEvent || isBulkUploading}
                    className="h-full px-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                    title="Scan QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                    Scan
                  </button>

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
                    {isBulkUploading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4" />
                    )}
                    {isBulkUploading ? "..." : "Bulk"}
                  </button>
                </div>
              </div>

              {/* List Search and Table */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                    Participant List
                  </h4>
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
                  {/* Desktop view */}
                  <table className="hidden md:table w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                          Participant ID
                        </th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                          Position
                        </th>
                        <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {loading ? (
                        [1, 2, 3].map((i) => (
                          <tr key={i}>
                            <td className="px-8 py-6">
                              <Skeleton className="h-4 w-32" />
                            </td>
                            <td className="px-8 py-6">
                              <Skeleton className="h-8 w-40 rounded-xl" />
                            </td>
                            <td className="px-8 py-6 text-right">
                              <Skeleton className="h-8 w-24 rounded-xl ml-auto" />
                            </td>
                          </tr>
                        ))
                      ) : filteredParticipations.length === 0 ? (
                        <tr>
                          <td
                            colSpan={3}
                            className="px-8 py-16 text-center text-zinc-600 italic text-sm"
                          >
                            {searchTerm
                              ? `No participants found matching "${searchTerm}"`
                              : `No participants yet in this category for ${activeEvent}.`}
                          </td>
                        </tr>
                      ) : (
                        filteredParticipations.map((p) => (
                          <tr
                            key={p.id}
                            className="group hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="px-8 py-6">
                              <code className="text-xs text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                {p.member_id}
                              </code>
                            </td>
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-2">
                                <select
                                  value={p.position || ""}
                                  onChange={(e) =>
                                    updatePosition(
                                      p.id,
                                      e.target.value
                                        ? parseInt(e.target.value)
                                        : null,
                                    )
                                  }
                                  className="bg-black/40 text-amber-400 border border-white/10 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider outline-none focus:border-amber-500/50"
                                >
                                  <option
                                    value=""
                                    className="bg-zinc-900 text-zinc-500 italic"
                                  >
                                    No Position
                                  </option>
                                  <option
                                    value="1"
                                    className="bg-zinc-900 text-amber-500 font-bold"
                                  >
                                    1st Position (Gold)
                                  </option>
                                  <option
                                    value="2"
                                    className="bg-zinc-900 text-zinc-300 font-bold"
                                  >
                                    2nd Position (Silver)
                                  </option>
                                  <option
                                    value="3"
                                    className="bg-zinc-900 text-amber-700 font-bold"
                                  >
                                    3rd Position (Bronze)
                                  </option>
                                </select>
                                {p.position === 1 && (
                                  <Medal className="w-4 h-4 text-amber-400" />
                                )}
                                {p.position === 2 && (
                                  <Star className="w-4 h-4 text-zinc-400" />
                                )}
                                {p.position === 3 && (
                                  <Zap className="w-4 h-4 text-amber-800" />
                                )}
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

                  {/* Mobile view */}
                  <div className="md:hidden divide-y divide-white/5">
                    {loading ? (
                      [1, 2, 3].map((i) => (
                        <div key={i} className="p-6 space-y-4">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-10 w-full rounded-xl" />
                        </div>
                      ))
                    ) : filteredParticipations.length === 0 ? (
                      <div className="px-8 py-16 text-center text-zinc-600 italic text-sm">
                        {searchTerm
                          ? `No participants matching "${searchTerm}"`
                          : "No participants yet."}
                      </div>
                    ) : (
                      filteredParticipations.map((p) => (
                        <div key={p.id} className="p-6 space-y-4">
                          <div className="flex items-center justify-between">
                            <code className="text-xs text-white font-mono bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                              {p.member_id}
                            </code>
                            <button
                              onClick={() => setDeleteId(p.id)}
                              className="p-3 bg-red-500/5 text-red-500 rounded-xl"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                          <div className="flex flex-col gap-2">
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                              Assign Position
                            </span>
                            <div className="flex items-center gap-3">
                              <select
                                value={p.position || ""}
                                onChange={(e) =>
                                  updatePosition(
                                    p.id,
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : null,
                                  )
                                }
                                className="flex-1 bg-black/40 text-amber-400 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-bold uppercase tracking-wider"
                              >
                                <option
                                  value=""
                                  className="bg-zinc-900 text-zinc-500"
                                >
                                  No Position
                                </option>
                                <option
                                  value="1"
                                  className="bg-zinc-900 text-amber-500"
                                >
                                  1st (Gold)
                                </option>
                                <option
                                  value="2"
                                  className="bg-zinc-900 text-zinc-300"
                                >
                                  2nd (Silver)
                                </option>
                                <option
                                  value="3"
                                  className="bg-zinc-900 text-amber-700"
                                >
                                  3rd (Bronze)
                                </option>
                              </select>
                              {p.position === 1 && (
                                <Medal className="w-5 h-5 text-amber-400" />
                              )}
                              {p.position === 2 && (
                                <Star className="w-5 h-5 text-zinc-400" />
                              )}
                              {p.position === 3 && (
                                <Zap className="w-5 h-5 text-amber-800" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Leaderboard Summary Visual */}
              <div className="p-8 rounded-[40px] bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/10">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-500 rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)]">
                      <Medal className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white uppercase tracking-wider">
                        Current Leaderboard
                      </h3>
                      <p className="text-xs text-zinc-500 font-medium">
                        {activeEvent} - {activeCategory}
                      </p>
                    </div>
                  </div>
                  {activeEvent && activeCategory && (
                    <button
                      onClick={announceResults}
                      disabled={isAnnouncing}
                      className="px-6 py-3 rounded-2xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isAnnouncing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                      {isAnnouncing ? "Announcing..." : "Announce Results"}
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[1, 2, 3].map((pos) => {
                    const winner =
                      pos === 1
                        ? winners.first
                        : pos === 2
                          ? winners.second
                          : winners.third;
                    const colors =
                      pos === 1
                        ? "text-amber-500"
                        : pos === 2
                          ? "text-zinc-400"
                          : "text-amber-800";
                    return (
                      <div
                        key={pos}
                        className={`p-6 rounded-3xl bg-black/40 border border-white/5 relative overflow-hidden group`}
                      >
                        <div
                          className={`absolute top-0 left-0 w-1 h-full ${pos === 1 ? "bg-amber-500" : pos === 2 ? "bg-zinc-400" : "bg-amber-800"}`}
                        />
                        <p
                          className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${colors}`}
                        >
                          {pos === 1 ? "First" : pos === 2 ? "Second" : "Third"}{" "}
                          Position
                        </p>
                        <p className="text-lg font-mono font-black text-white">
                          {winner?.member_id || "---"}
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

      <ConfirmModal
        isOpen={!!deleteTxId}
        title="Delete Transaction"
        message="Are you sure you want to permanently delete this registration/transaction? This action cannot be undone."
        onConfirm={handleDeleteTransaction}
        onCancel={() => !isDeletingTx && setDeleteTxId(null)}
        confirmLabel={isDeletingTx ? "Deleting..." : "Delete"}
        type="danger"
        disabled={isDeletingTx}
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
