"use client";
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Loader2, CheckCircle2, QrCode, Zap, ZoomIn, Contrast, Sparkles } from 'lucide-react';
import { Camera } from '@capacitor/camera';

interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  fps?: number;
  qrbox?: number;
  lastScannedId?: string | null;
  isProcessing?: boolean;
}

// Helper to request Capacitor native permissions if we are inside a Capacitor container
const requestCapacitorPermissions = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;

  console.log("[Capacitor] Native environment detected. Attempting to request native camera permissions...");
  let granted = false;

  // 1. Try modern @capacitor/camera directly
  try {
    const status = await Camera.checkPermissions();
    if (status.camera === 'granted') {
      console.log("[Capacitor] camera permission is already granted.");
      granted = true;
    } else {
      console.log("[Capacitor] camera permission not granted yet. Requesting...");
      const requestStatus = await Camera.requestPermissions({ permissions: ['camera'] });
      if (requestStatus.camera === 'granted') {
        console.log("[Capacitor] camera permission successfully granted after prompt.");
        granted = true;
      } else {
        console.warn("[Capacitor] camera permission was denied.");
      }
    }
  } catch (e) {
    console.warn("[Capacitor] Failed to request permissions using modern @capacitor/camera:", e);
  }

  // 2. Try BarcodeScanner plugin if installed
  if (!granted && cap.Plugins?.BarcodeScanner) {
    try {
      const status = await cap.Plugins.BarcodeScanner.checkPermission({ force: true });
      if (status.granted) {
        console.log("[Capacitor] BarcodeScanner permission granted.");
        granted = true;
      }
    } catch (e) {
      console.warn("[Capacitor] BarcodeScanner permission request failed:", e);
    }
  }

  // 3. Try Camera plugin via global plugins fallback if installed
  if (!granted && cap.Plugins?.Camera) {
    try {
      const permissionResult = await cap.Plugins.Camera.requestPermissions({ permissions: ['camera'] });
      console.log("[Capacitor] Legacy Camera permission result:", permissionResult);
      if (permissionResult?.camera === 'granted') {
        granted = true;
      }
    } catch (e) {
      console.warn("[Capacitor] Capacitor Camera request failed:", e);
    }
  }

  // 4. Try Permissions plugin if standard plugins aren't available but permission check is supported
  if (!granted && cap.Plugins?.Permissions) {
    try {
      const result = await cap.Plugins.Permissions.query({ name: 'camera' });
      if (result.state === 'granted') {
        granted = true;
      } else {
        const reqResult = await cap.Plugins.Permissions.request({ name: 'camera' });
        if (reqResult.state === 'granted') granted = true;
      }
    } catch (e) {
      console.warn("[Capacitor] General Permissions plugin request failed:", e);
    }
  }

  return granted;
};

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
  const [isCapacitor, setIsCapacitor] = useState<boolean>(false);

  // Focus and Enhancements
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrastBoost, setContrastBoost] = useState(true); // Enabled by default to enhance blurry feeds!
  const [enhancerNotification, setEnhancerNotification] = useState<string | null>("Auto-Contrast Enhancer Engaged");

  // Check if loaded inside Capacitor on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      setIsCapacitor(true);
    }
  }, []);

  // A functional start wrapper that doesn't use any timers
  // to ensure a direct synchronous user-gesture-to-permission chain
  const startScanner = useCallback(async () => {
    try {
      // 1. Request Capacitor Native permissions if we are running in a Capacitor webview wrapper
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        await requestCapacitorPermissions();
      }

      const { Html5Qrcode } = await import('html5-qrcode');
      
      const element = document.getElementById("qr-reader");
      if (!element) {
        console.warn("Scanner container '#qr-reader' is not yet in the DOM.");
        return;
      }

      // Stop any existing scanner instances
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
        } catch (e) {
          // Ignore release sync flows
        }
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      const isMobile = window.innerWidth < 768;
      const boxSize = isMobile ? Math.min(window.innerWidth - 80, 220) : 250;

      // Start html5QrCode with environment camera & native barcode detector enhancements
      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps,
          qrbox: { width: boxSize, height: boxSize },
          aspectRatio: 1.0,
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          }
        } as any,
        (decodedText: string) => {
          onScan(decodedText);
        },
        () => {
          // Silent frame tracking
        }
      );

      setIsCameraActive(true);
      setError(null);

      // Check capabilities of the active camera track (useful for anti-blur continuous focus, zoom, and torch)
      try {
        const track = (html5QrCode as any).getRunningTrack();
        if (track) {
          const capabilities = (track as any).getCapabilities?.() || {};
          const settings = track.getSettings?.() || {};

          // Optimize auto-focus constraints dynamically to continuously keep QR code in focus (anti-blur)
          if (capabilities.focusMode?.includes('continuous')) {
            await track.applyConstraints({
              advanced: [{ focusMode: 'continuous' }]
            } as any).catch((e: any) => console.log("Failed to set continuous focusMode constraint:", e));
          }

          if (capabilities.torch) {
            setHasTorch(true);
            setTorchOn(settings.torch || false);
          }
          if (capabilities.zoom) {
            setHasZoom(true);
            setZoomLevel(settings.zoom || 1);
          }
        }
      } catch (capErr) {
        console.warn("Camera hardware capability query bypassed:", capErr);
      }
    } catch (err: any) {
      console.error("Failed to start direct QR scanner:", err);
      setIsCameraActive(false);
      
      let friendlyError = "Could not access camera. Please make sure that camera permission is granted and no other application is using it.";
      const errStr = err?.message || String(err || "");
      
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        friendlyError = "Camera permission is denied or blocked. Mobile apps require a manual gesture to show the authorization dialog. Tap the button below to trigger it.";
      } else if (errStr.includes("NotFoundError") || errStr.includes("Device not found")) {
        friendlyError = "No camera hardware detected on this device.";
      } else if (errStr.includes("NotReadableError") || errStr.includes("Could not start video source")) {
        friendlyError = "The camera stream is blocked, restricted, or in use by another browser tab or local background application.";
      }
      
      setError(friendlyError);
    }
  }, [onScan, fps]);

  // Auto-init on mount, which succeeds on already-granted desktop/mobile environments
  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      if (active) {
        startScanner();
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
      
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().catch((e: any) => {
              console.log("Scanner released during unmount.", e);
            });
          }
        } catch (e) {
          // ignore synchronous stop assertions
        }
      }
    };
  }, [startScanner]);

  const handleAuthorizeClick = () => {
    setError(null);
    startScanner(); // This is called 100% synchronously on user tap!
  };

  const toggleTorch = async () => {
    if (!scannerRef.current) return;
    try {
      const track = (scannerRef.current as any).getRunningTrack();
      if (track) {
        const nextTorch = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextTorch }]
        } as any);
        setTorchOn(nextTorch);
        triggerNotification(nextTorch ? "Flashlight Activated" : "Flashlight Deactivated");
      }
    } catch (e) {
      console.error("Failed to toggle camera flashlight:", e);
      triggerNotification("Hardware Flashlight not supported");
    }
  };

  const cycleZoom = async () => {
    if (!scannerRef.current) return;
    try {
      const track = (scannerRef.current as any).getRunningTrack();
      if (track) {
        const capabilities = (track as any).getCapabilities?.() || {};
        if (capabilities.zoom) {
          const min = capabilities.zoom.min || 1;
          const max = capabilities.zoom.max || 3.0;
          // cycle zoom: 1.0x -> 1.5x -> 2.0x -> 2.5x -> 1.0x
          let nextZoom = zoomLevel + 0.5;
          if (nextZoom > Math.min(3.0, max)) {
            nextZoom = min;
          }
          await track.applyConstraints({
            advanced: [{ zoom: nextZoom }]
          } as any);
          setZoomLevel(nextZoom);
          triggerNotification(`Camera Zoom: ${nextZoom.toFixed(1)}x`);
        } else {
          triggerNotification("Zoom not supported by sensor");
        }
      }
    } catch (e) {
      console.error("Failed to apply camera zoom:", e);
      triggerNotification("Native Zoom unavailable");
    }
  };

  const toggleContrastBoost = () => {
    const nextBoost = !contrastBoost;
    setContrastBoost(nextBoost);
    triggerNotification(nextBoost ? "Image Sharpness Boost: ON" : "Image Sharpness Boost: OFF");
  };

  const triggerNotification = (msg: string) => {
    setEnhancerNotification(msg);
    const t = setTimeout(() => {
      setEnhancerNotification(prev => prev === msg ? null : prev);
    }, 2500);
  };

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
          <div 
            id="qr-reader" 
            className={`w-full h-full [&>video]:object-cover [&>video]:w-full [&>video]:h-full transition-all ${
              contrastBoost ? '[&>video]:contrast-[165%] [&>video]:brightness-[110%] [&>video]:saturate-[125%] [&>video]:grayscale' : ''
            }`}
          ></div>

          {/* Hardware & Software Enhancer Floating Notifications */}
          {isCameraActive && enhancerNotification && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-amber-500/90 text-black text-[9px] font-black uppercase tracking-[0.15em] px-3.5 py-1.5 rounded-full shadow-lg pointer-events-none z-30 flex items-center gap-1.5 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{enhancerNotification}</span>
            </div>
          )}
          
          {/* Transition Loader */}
          {!isCameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-10">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Acquiring camera sensor...</p>
            </div>
          )}

          {/* User-friendly error card with direct user interaction button */}
          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4 bg-zinc-950/95 z-20 overflow-y-auto">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-1 shrink-0">
                <QrCode className="w-5 h-5" />
              </div>
              <div className="max-w-xs">
                <p className="text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">Camera Permission Required</p>
                <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-wider mb-2">{error}</p>
                
                {isCapacitor ? (
                  <div className="p-3 my-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left">
                    <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">Capacitor App Configuration</p>
                    <p className="text-[9px] text-zinc-400 leading-normal mb-1">
                      For your Capacitor Android/iOS app shell to use the camera, you must include the native camera permissions in your shell project files:
                    </p>
                    <div className="space-y-1 mt-2 text-[9px] text-zinc-300">
                      <div>
                        1. In <code className="text-[8px] bg-black px-1 py-0.5 font-mono text-zinc-200">AndroidManifest.xml</code>, add:
                        <code className="text-[7px] bg-black block p-1.5 font-mono text-amber-400 rounded mt-0.5 leading-tight overflow-x-auto select-all">
                          &lt;uses-permission android:name="android.permission.CAMERA" /&gt;
                        </code>
                      </div>
                      <div className="pt-1">
                        2. In your iOS <code className="text-[8px] bg-black px-1 py-0.5 font-mono text-zinc-200">Info.plist</code>, add:
                        <code className="text-[7px] bg-black block p-1.5 font-mono text-amber-400 rounded mt-0.5 leading-tight overflow-x-auto select-all">
                          &lt;key&gt;NSCameraUsageDescription&lt;/key&gt;<br/>
                          &lt;string&gt;Camera access is needed to scan member QR codes.&lt;/string&gt;
                        </code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-[9px] text-zinc-650 uppercase tracking-widest leading-tight">
                    (If running as a standalone Android/iOS app, ensure system-level camera permissions are turned on in App Permissions.)
                  </p>
                )}
              </div>
              <button 
                onClick={handleAuthorizeClick}
                className="px-6 py-3 rounded-xl bg-amber-500 border border-amber-600 text-[10px] font-black text-black uppercase tracking-widest hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 active:scale-95 shrink-0"
              >
                Authorize & Start Camera
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

        {/* Anti-Blur Camera Tools HUD */}
        {isCameraActive && (
          <div className="mt-3 grid grid-cols-3 gap-2">
            <button
              onClick={toggleContrastBoost}
              type="button"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/5 active:scale-95 ${
                contrastBoost 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Contrast className="w-4 h-4" />
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-center h-5 flex items-center">Auto Contrast</span>
              <span className="text-[7px] text-zinc-500 uppercase font-black tracking-wider leading-none">{contrastBoost ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={cycleZoom}
              type="button"
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all hover:bg-white/5 active:scale-95 ${
                zoomLevel > 1 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <ZoomIn className="w-4 h-4" />
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-center h-5 flex items-center">Macro Zoom</span>
              <span className="text-[7px] text-zinc-500 uppercase font-black tracking-wider leading-none">{zoomLevel.toFixed(1)}x</span>
            </button>

            <button
              onClick={toggleTorch}
              type="button"
              disabled={!hasTorch}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all disabled:opacity-30 disabled:pointer-events-none hover:bg-white/5 active:scale-95 ${
                torchOn 
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-500 font-extrabold' 
                  : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span className="text-[8px] font-extrabold uppercase tracking-widest text-center h-5 flex items-center">Flashlight</span>
              <span className="text-[7px] text-zinc-500 uppercase font-black tracking-wider leading-none">
                {!hasTorch ? 'N/A' : torchOn ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        )}
        
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
