"use client";
import React, { useEffect, useRef } from 'react';
import { X, Loader2, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  fps?: number;
  qrbox?: number;
  lastScannedId?: string | null;
  isProcessing?: boolean;
}

const QRScanner: React.FC<QRScannerProps> = ({ 
  onScan, 
  onClose, 
  fps = 10, 
  qrbox = 250,
  lastScannedId,
  isProcessing
}) => {
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    let scanner: any = null;

    const startScanner = async () => {
      try {
        const { Html5QrcodeScanner, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
        
        scanner = new Html5QrcodeScanner(
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

        scanner.render(
          (decodedText: string) => {
            onScan(decodedText);
          },
          (error: any) => {
            // Silently handle scan errors
          }
        );
        
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Failed to initialize scanner", err);
      }
    };

    startScanner();

    return () => {
      if (scanner) {
        scanner.clear().catch((err: any) => console.error("Failed to clear scanner", err));
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
        
        <div className="mt-4 flex flex-col gap-3">
          {lastScannedId && (
            <div className={`p-4 rounded-xl border ${isProcessing ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'} flex items-center justify-between`}>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Last Scanned</p>
                <code className="text-sm font-mono font-bold text-white">{lastScannedId}</code>
              </div>
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Processing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold text-green-500 uppercase">Done</span>
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
              {isProcessing ? "Adding participant to list..." : "Position the member's profile QR code within the frame."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
