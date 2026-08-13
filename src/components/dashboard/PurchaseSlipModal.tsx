"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Mail, 
  CheckCircle2, 
  ShieldCheck, 
  Sparkles, 
  Ticket, 
  Loader2, 
  AlertCircle,
  Copy,
  Check,
  Building,
  User,
  BookOpen,
  Award,
  Download
} from 'lucide-react';
import QRCode from '../QRCode';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

import { resolveEventNames } from '../../lib/utils';

export interface PurchaseSlipCandidate {
  id: string;
  fullName: string;
  email?: string;
  phone?: string;
  memberId?: string;
  class?: string;
  section?: string;
  roll?: string;
  school?: string;
  trxnid?: string;
  candidateType?: string;
  eventsList?: string[];
  verified?: boolean | string;
  confirmed?: boolean;
}

interface PurchaseSlipModalProps {
  candidate: PurchaseSlipCandidate | null;
  isOpen: boolean;
  onClose: () => void;
  onEmailSent?: () => void;
  autoDownload?: boolean;
}

export function PurchaseSlipModal({ candidate, isOpen, onClose, onEmailSent, autoDownload = false }: PurchaseSlipModalProps) {
  const [sendingEmail, setSendingEmail] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && candidate && autoDownload) {
      const timer = setTimeout(() => {
        handleDownloadPdf();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, candidate, autoDownload]);

  if (!isOpen || !candidate) return null;

  const displayId = candidate.memberId || candidate.id || 'JMC-MEMBER';
  const displayName = candidate.fullName || 'Member Name';
  const displayClass = candidate.class || 'N/A';
  const displaySection = candidate.section || 'N/A';
  const displayRoll = candidate.roll || 'N/A';
  const displaySchool = candidate.school || 'St. Joseph Higher Secondary School';
  const displayTrxn = candidate.trxnid || 'VERIFIED';
  const rawEvents = candidate.eventsList && candidate.eventsList.length > 0 
    ? candidate.eventsList.join(', ') 
    : 'General Event Access Pass';
  const displayEvents = resolveEventNames(rawEvents);

  // Construct structured QR Payload JSON
  const qrPayload = JSON.stringify({
    id: displayId,
    member_id: displayId,
    name: displayName,
    class: displayClass,
    section: displaySection,
    roll: displayRoll,
    trxnid: displayTrxn,
    events: displayEvents,
    type: 'ticket_slip',
    v: '1.0'
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    const node = document.getElementById('purchase-slip-canvas');
    if (!node) return;

    setDownloadingPdf(true);
    try {
      const dataUrl = await toPng(node, {
        quality: 0.95,
        pixelRatio: 2,
        cacheBust: true,
        backgroundColor: '#18181b',
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = 190;
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 10, 15, pdfWidth, pdfHeight);
      pdf.save(`JMC-Verification-Slip-${displayId}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(displayId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = async () => {
    if (!candidate.email) {
      setEmailStatus({ type: 'error', message: 'No email address registered for this candidate.' });
      return;
    }

    setSendingEmail(true);
    setEmailStatus(null);

    try {
      const res = await fetch('/api/admin/send-purchase-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: candidate.email,
          recipientName: displayName,
          memberId: displayId,
          className: displayClass,
          section: displaySection,
          roll: displayRoll,
          trxnid: displayTrxn,
          events: displayEvents,
          school: displaySchool,
          verifiedBy: 'Super Admin'
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to dispatch email');
      }

      setEmailStatus({ type: 'success', message: `Purchase slip emailed successfully to ${candidate.email}!` });
      if (onEmailSent) onEmailSent();
    } catch (err: any) {
      console.error('Failed to send purchase slip email:', err);
      setEmailStatus({ type: 'error', message: err.message || 'Failed to send email.' });
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl bg-zinc-950 border border-white/10 rounded-[2.5rem] p-6 md:p-8 shadow-2xl text-white my-8 max-h-[90vh] overflow-y-auto"
        >
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-4 border-b border-white/10 print:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Ticket className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-display">Purchase Slip & Pass</h3>
                <p className="text-[10px] text-zinc-400">Official Entry Credential & QR Code</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Email Status Alert */}
          {emailStatus && (
            <div className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-center gap-2 print:hidden ${
              emailStatus.type === 'success' 
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' 
                : 'bg-red-500/10 border-red-500/20 text-red-300'
            }`}>
              {emailStatus.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              )}
              <span>{emailStatus.message}</span>
            </div>
          )}

          {/* PRINTABLE PURCHASE SLIP CANVAS */}
          <div 
            id="purchase-slip-canvas"
            className="my-6 p-6 rounded-[2rem] bg-zinc-900 border border-white/10 space-y-6 relative overflow-hidden print:p-0 print:border-none print:bg-white print:text-black"
          >
            
            {/* Watermark / Header */}
            <div className="flex justify-between items-start pb-4 border-b border-white/10 print:border-black/20">
              <div>
                <p className="text-[10px] font-bold text-emerald-400 tracking-widest uppercase print:text-emerald-700">Josephite Math Club</p>
                <h2 className="text-xl font-black text-white tracking-tight font-display mt-0.5 print:text-black">OFFICIAL PURCHASE SLIP</h2>
                <p className="text-[10px] text-zinc-400 mt-0.5 print:text-zinc-600">Issued for Annual Math Festival & Event Participation</p>
              </div>

              <div className="flex flex-col items-end">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 print:bg-emerald-100 print:text-emerald-800 print:border-emerald-300">
                  <ShieldCheck className="w-3 h-3" /> VERIFIED PASS
                </span>
                <span className="text-[9px] font-mono text-zinc-500 mt-1 print:text-zinc-500">Ref: {Date.now().toString().slice(-6)}</span>
              </div>
            </div>

            {/* Main Details and QR Code Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              
              {/* Left Column: Details (2 cols) */}
              <div className="md:col-span-2 space-y-4">
                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Registrant Name</p>
                  <p className="text-lg font-bold text-white font-display print:text-black">{displayName}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Unique Entry ID</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-sm font-mono font-black text-emerald-400 tracking-wider print:text-emerald-800">{displayId}</span>
                      <button 
                        onClick={handleCopyId}
                        className="text-zinc-500 hover:text-white print:hidden cursor-pointer"
                        title="Copy ID"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Transaction Ledger ID</p>
                    <p className="text-xs font-mono text-zinc-300 truncate print:text-black mt-0.5">{displayTrxn}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 p-3 bg-black/40 rounded-xl border border-white/5 text-[11px] font-mono text-zinc-300 print:bg-zinc-100 print:text-black print:border-zinc-300">
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Class</span>
                    <span className="font-bold">{displayClass}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Section</span>
                    <span className="font-bold">{displaySection}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 block">Roll</span>
                    <span className="font-bold">{displayRoll}</span>
                  </div>
                </div>

                <div>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Institution</p>
                  <p className="text-xs text-zinc-300 print:text-black mt-0.5 truncate">{displaySchool}</p>
                </div>
              </div>

              {/* Right Column: Scannable QR Code Box (1 col) */}
              <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl border border-zinc-200 text-center space-y-2 shadow-lg">
                <QRCode value={qrPayload} size={140} level="M" />
                <div>
                  <span className="text-[10px] font-black font-mono text-black block tracking-wider">{displayId}</span>
                  <span className="text-[8px] font-bold text-zinc-500 uppercase block tracking-widest mt-0.5">Scannable Ticket QR</span>
                </div>
              </div>
            </div>

            {/* Registered Events Banner */}
            <div className="pt-4 border-t border-white/10 print:border-black/20 space-y-1.5">
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Registered Event Segments</p>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 text-xs font-semibold text-emerald-300 font-mono print:bg-zinc-100 print:text-black print:border-zinc-300">
                {displayEvents}
              </div>
            </div>

            {/* Perks Included Checklist */}
            <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[10px] font-medium text-zinc-300 flex justify-between items-center print:border-zinc-300 print:text-black">
              <span className="text-emerald-400 font-bold print:text-emerald-800">Entitlements Included:</span>
              <div className="flex gap-3">
                <span>✓ Event Entry</span>
                <span>✓ Snacks</span>
                <span>✓ Souvenir</span>
              </div>
            </div>

          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2 print:hidden">
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-xs font-black text-black transition-all cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-95"
            >
              {downloadingPdf ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {downloadingPdf ? 'Generating PDF...' : 'Download PDF Slip'}
            </button>

            <button
              onClick={handlePrint}
              className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 text-xs font-bold text-white transition-all cursor-pointer border border-white/10 active:scale-95"
            >
              <Printer className="w-4 h-4 text-emerald-400" />
              Print Slip
            </button>

            {candidate.email && (
              <button
                onClick={handleSendEmail}
                disabled={sendingEmail}
                className="flex-1 min-w-[160px] flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-xs font-bold text-black shadow-lg shadow-emerald-500/10 transition-all cursor-pointer active:scale-95"
              >
                {sendingEmail ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4" />
                )}
                {sendingEmail ? 'Sending Email...' : 'Send Slip to Email'}
              </button>
            )}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
