"use client";
import React, { useEffect, useRef, useState } from 'react';
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
  lastScannedId,
  isProcessing
}) => {
  const scannerRef = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);

  const [retryKey, setRetryKey] = useState<number>(0);

  useEffect(() => {
    const isMounted = { current: true };
    let html5QrCode: any = null;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode');
        
        // Safety check in case component unmounted before this async step finished
        if (!isMounted.current) return;

        html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        const isMobile = window.innerWidth < 768;
        const boxSize = isMobile ? Math.min(window.innerWidth - 80, 220) : 250;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps,
            qrbox: { width: boxSize, height: boxSize },
            aspectRatio: 1.0
          },
          (decodedText: string) => {
            if (isMounted.current) {
              onScan(decodedText);
            }
          },
          () => {
            // Silent frame parsing error (normal behavior while searching for codes)
          }
        );

        if (isMounted.current) {
          setIsCameraActive(true);
          setError(null);
        }
      } catch (err: any) {
        console.error("Failed to start direct QR scanner:", err);
        if (isMounted.current) {
          setIsCameraActive(false);
          
          let friendlyError = "Could not access camera. Please make sure that camera permission is granted and no other application is using it.";
          const errStr = err?.message || String(err || "");
          
          if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
            friendlyError = "Camera access denied. Please enable camera permission in your browser settings and try again.";
          } else if (errStr.includes("NotFoundError") || errStr.includes("Device not found")) {
            friendlyError = "No camera hardware detected on this device.";
          } else if (errStr.includes("NotReadableError") || errStr.includes("Could not start video source")) {
            friendlyError = "Your camera is currently blocked or in use by another tab or background application.";
          }
          
          setError(friendlyError);
        }
      }
    };
    
    // Tiny timeout to let the container div finish mounting in DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 150);

    return () => {
      isMounted.current = false;
      clearTimeout(timer);
      
      if (html5QrCode) {
        try {
          if (html5QrCode.isScanning) {
            html5QrCode.stop().catch((e: any) => {
              console.log("Scanner stop callback completed with standard release status.", e);
            });
          }
        } catch (e) {
          // Ignore sync flow assertions
        }
      }
    };
  }, [onScan, fps, retryKey]);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="relative w-full max-w-lg glass-card p-5 overflow-hidden border border-amber-500/30">
        <div className="flex items-center justify-between mb-4 px-1">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-widest">QR ID Scanner</h4>
            <p className="text-[10px] text-zinc-500 font-bold uppercase">Scanning for Member IDs...</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Main scanner display area */}
        <div className="relative w-full aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black flex items-center justify-center">
          {/* Output target for html5-qrcode video */}
          <div id="qr-reader" className="w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full"></div>
          
          {/* Transition Loader */}
          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-10">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Acquiring camera sensor...</p>
            </div>
          )}

          {/* User-friendly error card */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-zinc-950/95 z-20">
              <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-1">
                <X className="w-5 h-5" />
              </div>
              <div className="max-w-xs">
                <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2">Camera Access Blocked</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider">{error}</p>
              </div>
              <button 
                onClick={() => {
                  setError(null);
                  setRetryKey(prev => prev + 1);
                }}
                className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-colors"
              >
                Retry Request
              </button>
            </div>
          )}

          {/* Holographic alignment frame HUD */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none border border-amber-500/20 rounded-2xl z-10">
              {/* Focus target frame */}
              <div className="absolute inset-[15%] border border-dashed border-amber-500/30 rounded-xl flex items-center justify-center">
                <div className="w-full h-0.5 bg-amber-500/30 animate-pulse"></div>
              </div>

              {/* High-tech corner HUD decorations */}
              <div className="absolute top-4 left-4 w-6 h-6 border-t-[3px] border-l-[3px] border-amber-500/70 rounded-tl-md"></div>
              <div className="absolute top-4 right-4 w-6 h-6 border-t-[3px] border-r-[3px] border-amber-500/70 rounded-tr-md"></div>
              <div className="absolute bottom-4 left-4 w-6 h-6 border-b-[3px] border-l-[3px] border-amber-500/70 rounded-bl-md"></div>
              <div className="absolute bottom-4 right-4 w-6 h-6 border-b-[3px] border-r-[3px] border-amber-500/70 rounded-br-md"></div>
            </div>
          )}
        </div>
        
        {/* Status indicator / Scanning feedback bar */}
        <div className="mt-4 flex flex-col gap-3">
          {lastScannedId && (
            <div className={`p-4 rounded-xl border ${isProcessing ? 'bg-amber-500/10 border-amber-500/30' : 'bg-green-500/10 border-green-500/30'} flex items-center justify-between`}>
              <div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Last Scanned Participant</p>
                <code className="text-sm font-mono font-bold text-white">{lastScannedId}</code>
              </div>
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-amber-500 animate-spin" />
                  <span className="text-[10px] font-bold text-amber-500 uppercase">Adding...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span className="text-[10px] font-bold text-green-500 uppercase">Success</span>
                </div>
              )}
            </div>
          )}

          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest text-center leading-relaxed">
              {isProcessing ? "Processing entry into active database list..." : "Position the user's profile QR code within the highlighted focus frame."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
