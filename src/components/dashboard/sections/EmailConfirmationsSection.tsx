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
  School,
  FileText,
  ShieldCheck,
  RefreshCw,
  X,
  Send,
  Sparkles,
  Code,
  Check,
  FileSpreadsheet
} from "lucide-react";
import { supabase, isSupabaseConfigured } from "../../../lib/supabase";
import { useAuth } from "../../../context/AuthContext";

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

function maskPhoneNumber(phone: string): string {
  if (!phone) return "N/A";
  const clean = phone.trim();
  
  if (clean.includes("@")) {
    const parts = clean.split("@");
    if (parts[0].length <= 3) return `***@${parts[1]}`;
    return `${parts[0].substring(0, 3)}***@${parts[1]}`;
  }

  if (clean.length <= 5) return clean;
  // If it starts with +880 and has 14 chars (+8801XXXXXXXXX)
  if (clean.startsWith('+880') && clean.length === 14) {
    return `+880${clean.substring(4, 7)}******${clean.substring(12)}`;
  }
  // Standard BD phone of 11 digits (01XXXXXXXXX)
  if (clean.startsWith('01') && clean.length === 11) {
    return `${clean.substring(0, 5)}******${clean.substring(9)}`;
  }
  // Otherwise mask middle portion
  const visibleStart = Math.min(5, Math.floor(clean.length / 3));
  const visibleEnd = Math.min(2, Math.floor(clean.length / 6));
  const stars = "*".repeat(Math.max(3, clean.length - visibleStart - visibleEnd));
  return `${clean.substring(0, visibleStart)}${stars}${clean.substring(clean.length - visibleEnd)}`;
}

export function EmailConfirmationsSection() {
  const { isSuperAdmin } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<"logs" | "bulk" | "sms" | "name_notice">("logs");
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for Phone Broadcast Notice Campaign
  const [nameNoticeProfiles, setNameNoticeProfiles] = useState<any[]>([]);
  const [isLoadingNameNotice, setIsLoadingNameNotice] = useState(false);
  const [isSendingNameNotice, setIsSendingNameNotice] = useState(false);
  const [nameNoticeResult, setNameNoticeResult] = useState<any>(null);
  const [nameNoticeSubject, setNameNoticeSubject] = useState("[ACTION REQUIRED] Please update/verify your Phone Number for quick sign-in");
  const [nameNoticeTemplate, setNameNoticeTemplate] = useState(`<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0c4a6e; padding-bottom: 15px;">
    <h1 style="color: #0c4a6e; margin: 0; font-size: 24px; font-weight: 800;">JOSEPHITE MATH CLUB</h1>
    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.1em; font-weight: 600;">OFFICIAL NOTICE: LOGIN SYSTEM UPDATE & PHONE NUMBER VERIFICATION</p>
  </div>
  <p>Hello <strong>{NAME}</strong>,</p>
  <p>We have updated the login system for Josephite Math Club. <strong>Logging in using full names or given names has been disabled.</strong> Sign-in is now strictly available via <strong>Phone Number or Email Address</strong>.</p>
  
  <p>To ensure you can easily log in to your dashboard at any time, please log in and ensure your <strong>active contact phone number</strong> is updated in your profile.</p>

  <div style="background-color: #f0fdf4; border-left: 4px solid #16a34a; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #14532d;">
    <strong>How to Sign In:</strong><br />
    • <strong>Option 1:</strong> Use your registered <strong>Phone Number</strong> (e.g. 017XXXXXXXX) + Password<br />
    • <strong>Option 2:</strong> Use your registered <strong>Email Address</strong> + Password
  </div>

  <div style="text-align: center; margin: 30px 0;">
    <a href="{REDIRECT_URL}" style="background-color: #0c4a6e; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(12, 74, 110, 0.2);">Verify & Update Phone Number Now</a>
  </div>

  <p>Alternatively, visit: <a href="{REDIRECT_URL}" style="color: #0c4a6e; word-break: break-all;">{REDIRECT_URL}</a></p>

  <p style="margin-top: 30px;">For any questions, please reply to this email or contact support on the JMC portal.</p>
  <br/>
  <p style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; margin-bottom: 0;">Sincerely,<br/><strong>The Josephite Math Club Executive Committee</strong></p>
</div>`);

  const fetchNameNoticeProfiles = useCallback(async () => {
    if (!isSuperAdmin) return;
    setIsLoadingNameNotice(true);
    try {
      const response = await fetch('/api/admin/bulk-name-notice', { method: 'GET' });
      const data = await response.json();
      if (response.ok) {
        setNameNoticeProfiles(data.profiles || []);
      } else {
        console.error('Error fetching multi-word names:', data.error);
      }
    } catch (err) {
      console.error('Network error fetching multi-word names:', err);
    } finally {
      setIsLoadingNameNotice(false);
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    if (activeSubTab === "name_notice") {
      fetchNameNoticeProfiles();
    }
  }, [activeSubTab, fetchNameNoticeProfiles]);

  const sendNameNoticeEmails = async () => {
    if (!isSuperAdmin) return;
    if (!nameNoticeSubject || !nameNoticeTemplate) {
      alert("Please provide email subject and body template.");
      return;
    }

    if (nameNoticeProfiles.length === 0) {
      alert("No active recipients match the targets.");
      return;
    }

    const confirmSend = window.confirm(`Are you absolutely sure you want to broadcast this notice to all ${nameNoticeProfiles.length} users with multi-word full names?`);
    if (!confirmSend) return;

    setIsSendingNameNotice(true);
    setNameNoticeResult(null);

    try {
      const response = await fetch('/api/admin/bulk-name-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: nameNoticeSubject,
          htmlTemplate: nameNoticeTemplate
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected broadcast request');
      }

      setNameNoticeResult({
        success: true,
        totalTargeted: data.totalTargeted || nameNoticeProfiles.length,
        sentCount: data.sentCount || 0,
        failedCount: data.failedCount || 0,
        errors: data.errors || []
      });

      // Refresh logs
      fetchEmailLogs();
      fetchNameNoticeProfiles();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "An error occurred during broadcasting.");
    } finally {
      setIsSendingNameNotice(false);
    }
  };
  
  // Search and Filter States for Logs
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "sent" | "failed">("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [selectedLog, setSelectedLog] = useState<EmailLog | null>(null);

  // Search and Filter States for SMS History
  const [smsSearchQuery, setSmsSearchQuery] = useState("");
  const [smsStatusFilter, setSmsStatusFilter] = useState<"all" | "sent" | "failed">("all");

  // States for Admin user Context
  const [adminEmail, setAdminEmail] = useState<string>("Admin");

  // States for Bulk Broadcast Campaign
  const [targetTable, setTargetTable] = useState<string>("all");
  const [targetVerification, setTargetVerification] = useState<string>("all");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignTemplate, setCampaignTemplate] = useState("");
  const [selectedTemplateType, setSelectedTemplateType] = useState<string>("custom");
  const [recipientsPreview, setRecipientsPreview] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState<{
    success: boolean;
    totalTargeted: number;
    sentCount: number;
    failedCount: number;
    errors: string[];
  } | null>(null);

  // Load Admin profile info
  useEffect(() => {
    async function loadAdminUser() {
      if (!isSupabaseConfigured) return;
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setAdminEmail(data.user.email);
      }
    }
    loadAdminUser();
  }, []);

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

  // Pre-designed templates for event reminders
  const templates = {
    custom: {
      subject: "",
      html: ""
    },
    reminder: {
      subject: "Important Reminder: Upcoming Math Club Event & Registration Details",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0c4a6e; padding-bottom: 15px;">
    <h1 style="color: #0c4a6e; margin: 0; font-size: 24px; font-weight: 800;">JOSEPHITE MATH CLUB</h1>
    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.1em; font-weight: 600;">OFFICIAL COMMUNIQUE & EVENT REMINDER</p>
  </div>
  <p>Hello <strong>{NAME}</strong>,</p>
  <p>This is an official administrative reminder regarding your upcoming Josephite Math Club events and participation instructions. Please confirm your registration details below:</p>
  
  <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0;">
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr><td style="padding: 4px 0; color: #64748b; width: 140px;"><strong>Participant Name:</strong></td><td style="color: #1e293b;">{NAME}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;"><strong>Class Category:</strong></td><td style="color: #1e293b;">{CATEGORY}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;"><strong>Class / Roll:</strong></td><td style="color: #1e293b;">Class {CLASS} (Roll: {ROLL})</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;"><strong>Selected Segment:</strong></td><td style="color: #0c4a6e; font-weight: bold;">{EVENTS}</td></tr>
      <tr><td style="padding: 4px 0; color: #64748b;"><strong>Approval Status:</strong></td><td><strong style="color: #15803d;">{STATUS}</strong></td></tr>
    </table>
  </div>
  
  <h4 style="color: #0c4a6e; font-size: 16px; margin-top: 25px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Critical Instructions Checklist</h4>
  <ul style="padding-left: 20px; color: #334155; line-height: 1.6;">
    <li style="margin-bottom: 8px;">🎯 <strong>Schedule Check:</strong> Ensure you verify your respective event timing on our official schedule board.</li>
    <li style="margin-bottom: 8px;">🆔 <strong>Digital Entrance Pass:</strong> Keep your digital QR code ready on your phone (navigable from your User Profile page) to scan at physical registration booths.</li>
    <li style="margin-bottom: 8px;">🎒 <strong>Logistics:</strong> Bring classic geometric tools, pens, and pencils. Calculators are only permitted in events explicitly authorized.</li>
  </ul>

  <p style="margin-top: 30px;">For any last-minute amendments or general support inquiries, feel free to reply to this conversation directly or generate an online assistance ticket.</p>
  <br/>
  <p style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; margin-bottom: 0;">Sincerely,<br/><strong>The Josephite Math Club Organizing Committee</strong></p>
</div>`
    },
    prep: {
      subject: "Event Preparation Checklist & Rules - Josephite Math Club",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #0d9488; padding-bottom: 15px;">
    <h1 style="color: #0d9488; margin: 0; font-size: 24px; font-weight: 800;">JOSEPHITE MATH CLUB</h1>
    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.1em; font-weight: 600;">SEGMENT PREPARATION CHECKS</p>
  </div>
  <p>Dear <strong>{NAME}</strong>,</p>
  <p>As the mathematical challenge looms closer, we want to ensure you are fully prepped for your registered segments. Details of your upcoming evaluation workspace:</p>

  <div style="background-color: #f0fdfa; border-left: 4px solid #0d9488; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px;">
    <strong>Enlisted Segments:</strong> {EVENTS}<br/>
    <strong>Demographics Class:</strong> Class {CLASS} (<strong>{CATEGORY}</strong> category)
  </div>

  <h3 style="color: #0d9488; font-size: 16px; margin-top: 25px; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Required Prep Steps</h3>
  <ol style="padding-left: 20px; color: #334155; line-height: 1.6;">
    <li style="margin-bottom: 10px;">🎒 <strong>Geometry Toolkits:</strong> Highly suggested for constructive mathematical segments.</li>
    <li style="margin-bottom: 10px;">📋 <strong>Entrance QR Code:</strong> Access your profile pass and verify that it renders correctly.</li>
    <li style="margin-bottom: 10px;">⏰ <strong>Punctuality:</strong> Competitions will start sharp on scheduled hours. Be seated 15 minutes prior.</li>
  </ol>

  <p style="margin-top: 25px;">Follow official bulletins continuously in the JMC notices feed for latest event room assignments.</p>
  <br/>
  <p style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; margin-bottom: 0;">Prepare diligently and excel!<br/><strong>Josephite Math Club Executive Team</strong></p>
</div>`
    },
    payment: {
      subject: "Attention Required: Verify your Registration Payment Details",
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
  <div style="text-align: center; margin-bottom: 25px; border-bottom: 2px solid #b45309; padding-bottom: 15px;">
    <h1 style="color: #b45309; margin: 0; font-size: 24px; font-weight: 800;">JOSEPHITE MATH CLUB</h1>
    <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 0.1em; font-weight: 600;">URGENT VERIFICATION INCOMPLETE</p>
  </div>
  <p>Hello <strong>{NAME}</strong>,</p>
  <p>Our verification crew noticed that your registration status is currently pending audit. Please crosscheck your submitted ledger:</p>
  
  <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 14px; color: #78350f;">
    <strong>Submitted bKash TrxID:</strong> {TRXNID}<br/>
    <strong>Assigned Category:</strong> {CATEGORY}<br/>
    <strong>Selected Segments:</strong> {EVENTS}
  </div>

  <p>If there's any typo in your bKash Transaction ID <strong>{TRXNID}</strong> or if we need to reconcile wallets, please submit a correction request via the portal or reach out to our team instantly to avoid cancellation.</p>
  
  <br/>
  <p style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #64748b; margin-bottom: 0;">Best regards,<br/><strong>JMC Treasury & Verification Unit</strong></p>
</div>`
    }
  };

  // Switch template
  const handleTemplateSelection = (type: string) => {
    setSelectedTemplateType(type);
    const selected = (templates as any)[type];
    if (selected) {
      setCampaignSubject(selected.subject);
      setCampaignTemplate(selected.html);
    }
  };

  // Preview estimated recipients count and details
  const previewAudienceSize = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setIsPreviewLoading(true);
    try {
      // Fetch all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      
      const profilesMap: Record<string, string> = {};
      if (profiles) {
        profiles.forEach(p => {
          if (p.id && p.email) {
            profilesMap[p.id] = p.email;
          }
        });
      }

      const targetTables = targetTable !== 'all' 
        ? [targetTable] 
        : ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];

      let loadedList: any[] = [];

      for (const table of targetTables) {
        let query = supabase.from(table).select('id, full_name, user_id, class, section, roll, trxnid, verified, selected_events, registered_by');
        if (targetVerification !== 'all') {
          query = query.eq('verified', targetVerification);
        }

        const { data, error } = await query;
        if (!error && data) {
          data.forEach((row: any) => {
            let matchedEmail = profilesMap[row.user_id] || '';
            if (!matchedEmail && row.registered_by?.includes('@')) {
              matchedEmail = row.registered_by;
            }

            if (matchedEmail) {
              loadedList.push({
                ...row,
                tableName: table,
                email: matchedEmail
              });
            }
          });
        }
      }

      setRecipientsPreview(loadedList);
    } catch (err) {
      console.error('Error previewing audience size', err);
    } finally {
      setIsPreviewLoading(false);
    }
  }, [targetTable, targetVerification]);

  useEffect(() => {
    if (activeSubTab === "bulk") {
      previewAudienceSize();
    }
  }, [activeSubTab, previewAudienceSize]);

  // Execute actual broadcast
  const sendBulkBroadcast = async () => {
    if (!campaignSubject || !campaignTemplate) {
      alert("Please provide email subject and body template.");
      return;
    }

    if (recipientsPreview.length === 0) {
      alert("No active recipients match your targets.");
      return;
    }

    const confirmSend = window.confirm(`Are you absolutely sure you want to broadcast this email to all ${recipientsPreview.length} matched event registrants via Brevo API?`);
    if (!confirmSend) return;

    setIsSendingBroadcast(true);
    setBroadcastResult(null);

    try {
      const response = await fetch('/api/admin/bulk-event-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          customRecipients: recipientsPreview,
          tableNameFilter: targetTable,
          verificationFilter: targetVerification,
          subject: campaignSubject,
          htmlTemplate: campaignTemplate,
          verifiedBy: adminEmail
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Server rejected broadcast payload request');
      }

      setBroadcastResult({
        success: true,
        totalTargeted: data.totalTargeted || recipientsPreview.length,
        sentCount: data.sentCount || 0,
        failedCount: data.failedCount || 0,
        errors: data.errors || []
      });

      // Refresh logs database in background
      fetchEmailLogs();
    } catch (e: any) {
      console.error(e);
      setBroadcastResult({
        success: false,
        totalTargeted: recipientsPreview.length,
        sentCount: 0,
        failedCount: recipientsPreview.length,
        errors: [e.message || "An execution error occurred."]
      });
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  // Dynamic template placeholder preview helper
  const renderLivePreview = () => {
    if (!campaignTemplate) return "<p style='color: #64748b;'>Begin entering body template content or select a pre-made JMC template...</p>";
    
    // Sample preview details
    const sampleRow = {
      full_name: "Tausif Samin",
      class: "12",
      section: "A",
      roll: "105",
      trxnid: "BKASH_TRX782BG",
      verified: "yes",
      selected_events: "Math Olympiad, Team Solve, Rubik's Cube",
      tableName: targetTable !== "all" ? targetTable : "higher_secondary_events"
    };

    const category = sampleRow.tableName === 'primary_events' ? 'Primary' :
                     sampleRow.tableName === 'junior_events' ? 'Junior' :
                     sampleRow.tableName === 'secondary_events' ? 'Secondary' : 'Higher Secondary';
    const status = sampleRow.verified === 'yes' ? 'Approved' : 'Pending Verification';

    let preview = campaignTemplate
      .replace(/{NAME}/g, sampleRow.full_name)
      .replace(/{EVENTS}/g, sampleRow.selected_events)
      .replace(/{CATEGORY}/g, category)
      .replace(/{CLASS}/g, sampleRow.class)
      .replace(/{ROLL}/g, sampleRow.roll)
      .replace(/{TRXNID}/g, sampleRow.trxnid)
      .replace(/{STATUS}/g, status)
      .replace(/{EMAIL}/g, "tausif.samin@sjs.edu.bd");

    return preview;
  };

  // Unique Classes for filtering logs list
  const classesList = Array.from(
    new Set(
      emailLogs
        .map((log) => log.recipient_class)
        .filter((c) => c && c.trim() !== "")
    )
  ).sort();

  // Filter & Search Logic inside Logs
  const filteredLogs = emailLogs.filter((log) => {
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (classFilter !== "all" && log.recipient_class !== classFilter) return false;

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

  const totalSentCount = emailLogs.filter(l => l.status === "sent").length;
  const totalFailedCount = emailLogs.filter(l => l.status === "failed").length;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* Premium Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tight flex items-center gap-4">
            <Mail className="w-8 h-8 text-amber-500 animate-pulse" />
            Email Communications Console
          </h2>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Dispatch bulk templates, inspect deliverability logs, and personalize segments interactively.
          </p>
        </div>

        {/* Sub-tab Switchers */}
        <div className="flex bg-white/5 border border-white/10 p-1.5 rounded-2xl gap-1 shrink-0 self-start lg:self-center">
          <button
            onClick={() => setActiveSubTab("logs")}
            className={`px-4 py-2.5 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "logs" 
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Dispatch Logs
          </button>
          <button
            onClick={() => {
              setActiveSubTab("bulk");
              setBroadcastResult(null);
            }}
            className={`px-4 py-2.5 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "bulk" 
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            Bulk Broadcast
          </button>
          <button
            onClick={() => {
              setActiveSubTab("sms");
            }}
            className={`px-4 py-2.5 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "sms" 
                ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20" 
                : "text-zinc-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            SMS History
          </button>
          {isSuperAdmin && (
            <button
              onClick={() => {
                setActiveSubTab("name_notice");
                setNameNoticeResult(null);
              }}
              className={`px-4 py-2.5 rounded-xl uppercase text-[10px] font-black tracking-widest transition-all cursor-pointer flex items-center gap-2 ${
                activeSubTab === "name_notice" 
                  ? "bg-rose-500 text-black shadow-lg shadow-rose-500/20" 
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              Name Corrections
            </button>
          )}
        </div>
      </div>

      {activeSubTab === "logs" && (
        <>
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

          {/* Logs table */}
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
                Adjust filters or execute event approvals to record transactions.
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

                        <td className="p-5">
                          <div className="text-xs text-zinc-300 max-w-xs truncate" title={log.subject}>
                            {log.subject}
                          </div>
                        </td>

                        <td className="p-5">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
                            <span className="px-2.5 py-1 rounded bg-white/5 border border-white/10 text-amber-500 text-[10px] font-mono">
                              {log.verified_by || "System / Auto"}
                            </span>
                          </div>
                        </td>

                        <td className="p-5 text-xs text-zinc-400 font-medium whitespace-nowrap">
                          {log.sent_at ? new Date(log.sent_at).toLocaleString() : "N/A"}
                        </td>

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
        </>
      )}

      {activeSubTab === "bulk" && (
        /* Bulk composer form layout */
        <div className="space-y-8 animate-fade-in text-left">
          {/* Main Workspace Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Hand: Controls Panel */}
            <div className="lg:col-span-7 bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Target Audience & Content
                </h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                  Specify categories to match and customize the dynamic layout values.
                </p>
              </div>

              {/* Filters setup */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Class Category</label>
                  <select
                    value={targetTable}
                    onChange={(e) => setTargetTable(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-bold focus:border-amber-500/50 cursor-pointer"
                  >
                    <option value="all">All event registrants</option>
                    <option value="primary_events">Primary (Class 3-5)</option>
                    <option value="junior_events">Junior (Class 6-8)</option>
                    <option value="secondary_events">Secondary (Class 9-10)</option>
                    <option value="higher_secondary_events">Higher Secondary (Class 11-12)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Registration Status</label>
                  <select
                    value={targetVerification}
                    onChange={(e) => setTargetVerification(e.target.value)}
                    className="w-full bg-neutral-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none font-bold focus:border-amber-500/50 cursor-pointer"
                  >
                    <option value="all">All Registrations</option>
                    <option value="yes">Verified Registrations only</option>
                    <option value="no">Unverified/Pending Only</option>
                  </select>
                </div>
              </div>

              {/* Audience Preview Badge info */}
              <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 px-5 py-4 rounded-2xl justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-amber-500" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Identified Audience Size</span>
                    <span className="text-sm font-bold text-white mt-0.5 inline-block">
                      {isPreviewLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                      ) : (
                        <span>{recipientsPreview.length} matched registrants</span>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={previewAudienceSize}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-[10px] font-black cursor-pointer tracking-wider uppercase"
                >
                  Recalculate
                </button>
              </div>

              {/* JMC Templates Setup list */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Premade Reminder Templates</label>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleTemplateSelection("custom")}
                    className={`p-3 rounded-xl border text-[10px] font-extrabold tracking-widest uppercase transition-all cursor-pointer ${
                      selectedTemplateType === "custom" 
                        ? "bg-white/10 border-amber-500 text-white" 
                        : "bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Custom
                  </button>
                  <button
                    onClick={() => handleTemplateSelection("reminder")}
                    className={`p-3 rounded-xl border text-[10px] font-extrabold tracking-widest uppercase transition-all cursor-pointer ${
                      selectedTemplateType === "reminder" 
                        ? "bg-white/10 border-amber-500 text-white" 
                        : "bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Event Reminder
                  </button>
                  <button
                    onClick={() => handleTemplateSelection("prep")}
                    className={`p-3 rounded-xl border text-[10px] font-extrabold tracking-widest uppercase transition-all cursor-pointer ${
                      selectedTemplateType === "prep" 
                        ? "bg-white/10 border-amber-500 text-white" 
                        : "bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Prep Guide
                  </button>
                  <button
                    onClick={() => handleTemplateSelection("payment")}
                    className={`p-3 rounded-xl border text-[10px] font-extrabold tracking-widest uppercase transition-all cursor-pointer ${
                      selectedTemplateType === "payment" 
                        ? "bg-white/10 border-amber-500 text-white" 
                        : "bg-white/[0.01] border-white/5 text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Payment Warning
                  </button>
                </div>
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Subject Header</label>
                <input
                  type="text"
                  value={campaignSubject}
                  onChange={(e) => setCampaignSubject(e.target.value)}
                  placeholder="e.g. Schedule Updates: Prepare for JMC Math Olympiads!"
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 outline-none focus:border-amber-500/50 transition-all font-bold"
                />
              </div>

              {/* Body Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email HTML Body Content</label>
                  <span className="text-[9px] text-zinc-500 font-mono font-bold flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> HTML allowed
                  </span>
                </div>
                <textarea
                  value={campaignTemplate}
                  onChange={(e) => setCampaignTemplate(e.target.value)}
                  rows={14}
                  placeholder="Write clear, professional HTML or text body coordinates..."
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-2xl text-xs text-zinc-200 placeholder-zinc-700 outline-none focus:border-amber-500/50 transition-all font-mono leading-relaxed resize-y scrollbar-thin"
                />
              </div>

              {/* Dynamic Guidelines panel */}
              <div className="bg-[#0c0c0c] border border-white/5 p-4 rounded-2xl font-mono text-[9.5px] leading-relaxed text-zinc-500">
                <p className="font-extrabold text-zinc-400 uppercase tracking-widest mb-1.5">Interactive Placeholders</p>
                <p>Use these variables to customize email output dynamically:</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 font-bold text-amber-500">
                  <span>{"{NAME}"} : Participant Name</span>
                  <span>{"{EVENTS}"} : Enlisted segments</span>
                  <span>{"{CATEGORY}"} : Class Category</span>
                  <span>{"{CLASS}"} : Numerical Class</span>
                  <span>{"{ROLL}"} : Student Roll</span>
                  <span>{"{TRXNID}"} : bKash TransID</span>
                  <span>{"{STATUS}"} : Approval status</span>
                  <span>{"{EMAIL}"} : Member email</span>
                </div>
              </div>

              {/* Form submit/Cancel row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("logs");
                    setBroadcastResult(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white uppercase text-[10px] tracking-wider font-black cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={sendBulkBroadcast}
                  disabled={isSendingBroadcast || recipientsPreview.length === 0}
                  className="px-8 py-3.5 rounded-xl bg-amber-500 text-black uppercase text-[10px] font-black tracking-widest hover:bg-amber-400 disabled:bg-amber-500/20 disabled:text-zinc-500 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-amber-500/10"
                >
                  {isSendingBroadcast ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Broadcasting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Broadcast to {recipientsPreview.length} users
                    </>
                  )}
                </button>
              </div>

              {/* Broadcast Results display */}
              {broadcastResult && (
                <div className={`p-6 rounded-2xl border ${
                  broadcastResult.success 
                    ? "bg-green-500/5 border-green-500/15 text-green-400" 
                    : "bg-red-500/5 border-red-500/15 text-red-400"
                } text-xs space-y-3`}>
                  <div className="flex items-center gap-2 font-black uppercase text-[10px] tracking-wider">
                    {broadcastResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    )}
                    Campaign Executed successfully
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-center mt-2 font-mono">
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Identified</p>
                      <p className="text-white font-black text-sm mt-1">{broadcastResult.totalTargeted}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Delivered</p>
                      <p className="text-green-400 font-black text-sm mt-1">{broadcastResult.sentCount}</p>
                    </div>
                    <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                      <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Failed</p>
                      <p className="text-red-400 font-black text-sm mt-1">{broadcastResult.failedCount}</p>
                    </div>
                  </div>
                  {broadcastResult.errors.length > 0 && (
                    <div className="mt-3">
                      <p className="font-bold text-[9px] text-zinc-500 uppercase tracking-wider mb-1">Detailed errors</p>
                      <div className="bg-black/60 p-3 rounded-xl font-mono text-[9.5px] text-zinc-400 max-h-24 overflow-y-auto leading-relaxed scrollbar-thin">
                        {broadcastResult.errors.map((e, i) => (
                          <div key={i} className="mb-0.5">• {e}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Hand: Interactive Email Preview Screen */}
            <div className="lg:col-span-5 bg-[#070707] border border-white/10 rounded-[2.5rem] p-6 space-y-4 lg:sticky lg:top-8 shadow-2xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-4">
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider">Device Preview</h4>
                  <p className="text-[9px] text-zinc-500 font-medium">Standard Desktop Email Simulator (Live sample variables rendering)</p>
                </div>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
              </div>

              {/* Simulated browser header bar */}
              <div className="bg-neutral-900 border border-white/5 p-4 rounded-2xl text-[10px] text-zinc-400 space-y-2">
                <p><strong>From:</strong> Samin | Josephite Math Club <span className="font-mono text-zinc-600">&lt;mathclub@sjs.edu.bd&gt;</span></p>
                <p><strong>To:</strong> Tausif Samin <span className="font-mono text-zinc-600">&lt;tausif.samin@sjs.edu.bd&gt;</span></p>
                <p className="text-white border-t border-white/5 pt-2 font-bold truncate"><strong>Subject:</strong> {campaignSubject || "Upcoming JMC Math Club notification"}</p>
              </div>

              {/* Dynamic Live iframe-style rendering */}
              <div className="bg-[#121212] rounded-3xl p-4 border border-white/5 min-h-[440px] max-h-[550px] overflow-y-auto scrollbar-thin">
                <div 
                  className="preview-iframe-mock text-left"
                  dangerouslySetInnerHTML={{ __html: renderLivePreview() }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "sms" && (
        <div className="space-y-8 animate-fade-in text-left">
          {/* Metrics Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center font-bold">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Total Sent SMS</div>
                <div className="text-2xl font-black text-white mt-1">
                  {emailLogs.filter(log => log.subject.includes('[SMS]') || /^[+0-9]/.test(log.recipient_email) || !log.recipient_email.includes('@')).length}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Delivered Successfully</div>
                <div className="text-2xl font-black text-green-400 mt-1">
                  {emailLogs.filter(log => (log.subject.includes('[SMS]') || /^[+0-9]/.test(log.recipient_email) || !log.recipient_email.includes('@')) && log.status === 'sent').length}
                </div>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/5 p-6 rounded-3xl flex items-center gap-5">
              <div className="w-12 h-12 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl flex items-center justify-center font-bold">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Failed Deliveries</div>
                <div className="text-2xl font-black text-red-400 mt-1">
                  {emailLogs.filter(log => (log.subject.includes('[SMS]') || /^[+0-9]/.test(log.recipient_email) || !log.recipient_email.includes('@')) && log.status === 'failed').length}
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Search Control Grid */}
          <div className="bg-white/[0.01] border border-white/5 p-6 rounded-3xl space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  value={smsSearchQuery}
                  onChange={(e) => setSmsSearchQuery(e.target.value)}
                  placeholder="Search by recipient name, phone number, subject or content..."
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all text-xs font-bold"
                />
              </div>

              <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl">
                <Filter className="w-3.5 h-3.5 text-zinc-400" />
                <select
                  value={smsStatusFilter}
                  onChange={(e) => setSmsStatusFilter(e.target.value as any)}
                  className="bg-transparent border-none text-white text-xs outline-none font-bold pr-4 cursor-pointer"
                >
                  <option value="all" className="bg-neutral-900 text-white">All Statuses</option>
                  <option value="sent" className="bg-neutral-900 text-white">Delivered Only</option>
                  <option value="failed" className="bg-neutral-900 text-white">Failed Only</option>
                </select>
              </div>
            </div>
          </div>

          {/* SMS logs table */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-6 bg-white/[0.01] border border-white/5 rounded-3xl animate-pulse flex flex-col gap-3">
                  <div className="h-4 bg-zinc-800 rounded w-1/4" />
                  <div className="h-3 bg-zinc-800 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : emailLogs.filter(log => log.subject.includes('[SMS]') || /^[+0-9]/.test(log.recipient_email) || !log.recipient_email.includes('@')).length === 0 ? (
            <div className="bg-white/[0.01] border border-dashed border-white/10 p-16 text-center rounded-[2.5rem] max-w-4xl mx-auto">
              <FileText className="w-16 h-16 text-zinc-700 mx-auto mb-6 opacity-30 animate-pulse" />
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-wide">
                No SMS history found
              </p>
              <p className="text-xs text-zinc-600 mt-2 font-medium">
                Sent event result SMS notifications or manual broadcasts will be displayed here.
              </p>
            </div>
          ) : (
            <div className="bg-[#0b0b0b]/60 overflow-hidden rounded-[2.5rem] border border-white/10 shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.02]">
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Recipient Name</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Masked Phone Number</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Message Type / Event</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Message Content Preview</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Sent At</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                      <th className="p-5 text-[9px] font-black uppercase tracking-widest text-zinc-400 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {emailLogs
                      .filter(log => log.subject.includes('[SMS]') || /^[+0-9]/.test(log.recipient_email) || !log.recipient_email.includes('@'))
                      .filter(log => {
                        if (smsStatusFilter !== "all" && log.status !== smsStatusFilter) return false;
                        if (smsSearchQuery.trim() !== "") {
                          const q = smsSearchQuery.toLowerCase();
                          const name = (log.recipient_name || "").toLowerCase();
                          const phone = (log.recipient_email || "").toLowerCase();
                          const body = (log.body_text || "").toLowerCase();
                          const subject = (log.subject || "").toLowerCase();
                          return name.includes(q) || phone.includes(q) || body.includes(q) || subject.includes(q);
                        }
                        return true;
                      })
                      .map((log) => (
                        <tr key={log.id} className="hover:bg-white/[0.01] transition-all">
                          <td className="p-5">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <User className="w-4 h-4 text-zinc-400" />
                              </div>
                              <div className="font-bold text-white text-xs">
                                {log.recipient_name || "Anonymous Member"}
                              </div>
                            </div>
                          </td>

                          <td className="p-5 font-mono text-xs text-amber-500">
                            {maskPhoneNumber(log.recipient_email)}
                          </td>

                          <td className="p-5">
                            <div className="text-xs text-zinc-300 max-w-xs truncate" title={log.subject}>
                              {log.subject.replace('[SMS] ', '')}
                            </div>
                          </td>

                          <td className="p-5">
                            <div className="text-xs text-zinc-400 max-w-sm truncate" title={log.body_text}>
                              {log.body_text}
                            </div>
                          </td>

                          <td className="p-5 text-xs text-zinc-400 font-medium whitespace-nowrap">
                            {log.sent_at ? new Date(log.sent_at).toLocaleString() : "N/A"}
                          </td>

                          <td className="p-5">
                            {log.status === "sent" ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-500/10 text-green-400 text-[10px] font-extrabold border border-green-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                                DELIVERED
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

                          <td className="p-5 text-right whitespace-nowrap">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-400 hover:text-white text-[10px] uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ml-auto"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === "name_notice" && isSuperAdmin && (
        <div className="space-y-8 animate-fade-in text-left">
          {/* Main Workspace Frame */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Hand: Controls Panel */}
            <div className="lg:col-span-7 bg-white/[0.01] border border-white/5 p-8 rounded-[2.5rem] space-y-6">
              <div className="border-b border-white/5 pb-4">
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-rose-500" />
                  Given Name Correction Notice Campaign
                </h3>
                <p className="text-[10px] text-zinc-500 font-semibold mt-1">
                  Send a bulk email to members registered with multi-word full names asking them to change to their given name.
                </p>
              </div>

              {/* Audience Preview Badge info */}
              <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 px-5 py-4 rounded-2xl justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-5 h-5 text-rose-500" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">Identified Affected Members</span>
                    <span className="text-sm font-bold text-white mt-0.5 inline-block">
                      {isLoadingNameNotice ? (
                        <Loader2 className="w-4 h-4 animate-spin inline mr-1" />
                      ) : (
                        <span>{nameNoticeProfiles.length} members with multi-word names</span>
                      )}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={fetchNameNoticeProfiles}
                  className="px-3.5 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/5 hover:border-white/10 text-zinc-300 hover:text-white text-[10px] font-black cursor-pointer tracking-wider uppercase"
                >
                  Refresh Audience
                </button>
              </div>

              {/* Subject Input */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email Subject Header</label>
                <input
                  type="text"
                  value={nameNoticeSubject}
                  onChange={(e) => setNameNoticeSubject(e.target.value)}
                  placeholder="e.g. Action Required: Update your full name to Given Name only"
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-600 outline-none focus:border-rose-500/50 transition-all font-bold"
                />
              </div>

              {/* Body Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Email HTML Body Content</label>
                  <span className="text-[9px] text-zinc-500 font-mono font-bold flex items-center gap-1">
                    <Code className="w-3.5 h-3.5" /> HTML allowed
                  </span>
                </div>
                <textarea
                  value={nameNoticeTemplate}
                  onChange={(e) => setNameNoticeTemplate(e.target.value)}
                  rows={12}
                  placeholder="Write clear, professional HTML or text body..."
                  className="w-full px-4 py-3 bg-neutral-900 border border-white/10 rounded-2xl text-xs text-zinc-200 placeholder-zinc-700 outline-none focus:border-rose-500/50 transition-all font-mono leading-relaxed resize-y scrollbar-thin"
                />
              </div>

              {/* Dynamic Guidelines panel */}
              <div className="bg-[#0c0c0c] border border-white/5 p-4 rounded-2xl font-mono text-[9.5px] leading-relaxed text-zinc-500">
                <p className="font-extrabold text-zinc-400 uppercase tracking-widest mb-1.5">Interactive Placeholders</p>
                <p>Use these variables to customize email output dynamically:</p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2 font-bold text-rose-400">
                  <span>{"{NAME}"} : Full Name</span>
                  <span>{"{GIVEN_NAME}"} : Given Name</span>
                  <span>{"{EMAIL}"} : Member email</span>
                  <span>{"{REDIRECT_URL}"} : Action link</span>
                </div>
              </div>

              {/* Form submit/Cancel row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-6 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setActiveSubTab("logs");
                    setNameNoticeResult(null);
                  }}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white uppercase text-[10px] tracking-wider font-black cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  onClick={sendNameNoticeEmails}
                  disabled={isSendingNameNotice || nameNoticeProfiles.length === 0}
                  className="px-8 py-3.5 rounded-xl bg-rose-500 text-black uppercase text-[10px] font-black tracking-widest hover:bg-rose-400 disabled:bg-rose-500/20 disabled:text-zinc-500 transition-all flex items-center gap-2 cursor-pointer shadow-xl shadow-rose-500/10"
                >
                  {isSendingNameNotice ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Broadcasting Notice...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Broadcast to {nameNoticeProfiles.length} users
                    </>
                  )}
                </button>
              </div>

              {nameNoticeResult && (
                <div className={`p-5 rounded-2xl border ${nameNoticeResult.success ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-400'} font-medium space-y-2`}>
                  <p className="text-xs font-black uppercase tracking-widest">Broadcast Campaign Complete</p>
                  <div className="grid grid-cols-3 gap-4 text-center py-2 font-mono text-[11px] bg-black/40 rounded-xl">
                    <div>
                      <div className="text-zinc-500 text-[9px] uppercase">Targeted</div>
                      <div className="text-sm font-bold text-white">{nameNoticeResult.totalTargeted}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-[9px] uppercase">Delivered</div>
                      <div className="text-sm font-bold text-green-400">{nameNoticeResult.sentCount}</div>
                    </div>
                    <div>
                      <div className="text-zinc-500 text-[9px] uppercase">Failed</div>
                      <div className="text-sm font-bold text-red-400">{nameNoticeResult.failedCount}</div>
                    </div>
                  </div>
                  {nameNoticeResult.errors && nameNoticeResult.errors.length > 0 && (
                    <div className="mt-2 text-[10px] font-mono max-h-24 overflow-y-auto bg-black/50 p-2.5 rounded-lg border border-red-500/10 space-y-1">
                      {nameNoticeResult.errors.map((e: string, i: number) => (
                        <p key={i}>{e}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Hand: Affected Members List & Live Preview */}
            <div className="lg:col-span-5 space-y-6">
              {/* Affected Members list */}
              <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <h4 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Audience Recipient Directory ({nameNoticeProfiles.length})
                </h4>
                <p className="text-[10px] text-zinc-500 leading-relaxed">
                  The following accounts currently have multi-word names in their profile and will be targeted.
                </p>
                <div className="max-h-48 overflow-y-auto border border-white/5 rounded-2xl bg-black/45 scrollbar-thin divide-y divide-white/5">
                  {isLoadingNameNotice ? (
                    <div className="p-8 text-center text-zinc-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading profiles...
                    </div>
                  ) : nameNoticeProfiles.length === 0 ? (
                    <div className="p-8 text-center text-zinc-500 text-xs">
                      No members matching multi-word full names found! Everyone is compliant.
                    </div>
                  ) : (
                    nameNoticeProfiles.map((p, i) => (
                      <div key={p.id || i} className="p-3 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-white">{p.full_name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono">{p.email}</p>
                        </div>
                        <span className="text-[9px] px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold rounded-lg uppercase">
                          Needs update
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Live Preview Container */}
              <div className="bg-white/[0.01] border border-white/5 p-6 rounded-[2.5rem] space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-rose-500" />
                    Live Content Template Frame
                  </h4>
                  <span className="text-[9px] px-2.5 py-1 rounded-full bg-zinc-900 border border-white/10 font-bold font-mono text-zinc-500 uppercase">
                    Responsive Preview
                  </span>
                </div>

                {/* Simulated browser header bar */}
                <div className="bg-neutral-900 border border-white/5 p-4 rounded-2xl text-[10px] text-zinc-400 space-y-2">
                  <p><strong>From:</strong> Samin | Josephite Math Club <span className="font-mono text-zinc-600">&lt;mathclub@sjs.edu.bd&gt;</span></p>
                  <p><strong>To:</strong> Sample Recipient <span className="font-mono text-zinc-600">&lt;sample@email.com&gt;</span></p>
                  <p className="text-white border-t border-white/5 pt-2 font-bold truncate"><strong>Subject:</strong> {nameNoticeSubject || "Action Required: Update your profile name"}</p>
                </div>

                {/* Dynamic Live iframe-style rendering */}
                <div className="bg-[#121212] rounded-3xl p-4 border border-white/5 min-h-[300px] max-h-[420px] overflow-y-auto scrollbar-thin">
                  <div 
                    className="preview-iframe-mock text-left"
                    dangerouslySetInnerHTML={{ 
                      __html: (nameNoticeTemplate || "")
                        .replace(/{NAME}/g, "Samin Tausif")
                        .replace(/{GIVEN_NAME}/g, "Samin")
                        .replace(/{EMAIL}/g, "tausif.samin@sjs.edu.bd")
                        .replace(/{REDIRECT_URL}/g, "/profile/change-name")
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Popover receipt Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in text-left">
          <div className="bg-[#080808] max-w-2xl w-full p-8 rounded-[2.5rem] border border-white/10 space-y-6 relative shadow-2xl">
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

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <p className="text-zinc-500 text-[9px] font-black uppercase tracking-wider">Recipient Name</p>
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

export default EmailConfirmationsSection;
