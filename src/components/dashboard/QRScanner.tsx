"use client";
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  fps?: number;
  qrbox?: number;
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan, onClose, fps = 10, qrbox = 250 }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps, 
        qrbox,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ],
        rememberLastUsedCamera: true,
        aspectRatio: 1.0,
      },
      /* verbose= */ false
    );

    scannerRef.current.render(
      (decodedText) => {
        onScan(decodedText);
      },
      (error) => {
        // Silently handle scan errors (common during continuous scanning)
        // console.warn(error);
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
      }
    };
  }, [onScan, fps, qrbox]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card p-4 overflow-hidden border border-amber-500/30">
        <div className="flex items-center justify-between mb-4 px-2">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">QR ID Scanner</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Scanning for Member IDs...</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-zinc-400" />
          </button>
        </div>
        
        <div id="qr-reader" className="w-full rounded-2xl overflow-hidden border border-white/10"></div>
        
        <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
            Position the member's profile QR code within the frame to automatically add them to the participant list.
          </p>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
