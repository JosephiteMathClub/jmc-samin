"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  X, 
  Loader2, 
  CheckCircle2, 
  QrCode, 
  Zap, 
  ZoomIn, 
  Contrast, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  SwitchCamera, 
  Upload, 
  Keyboard, 
  Search, 
  AlertCircle, 
  Check, 
  Activity,
  Play,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { Camera } from '@capacitor/camera';
import jsQR from 'jsqr';
import { Html5Qrcode } from 'html5-qrcode';
import { 
  MultiFormatReader, 
  BarcodeFormat, 
  DecodeHintType, 
  RGBLuminanceSource, 
  BinaryBitmap, 
  HybridBinarizer, 
  GlobalHistogramBinarizer,
  InvertedLuminanceSource 
} from '@zxing/library';
import { BrowserQRCodeReader, BrowserMultiFormatReader } from '@zxing/browser';
import { playSuccessSound, playErrorSound } from '../../lib/sound';

export interface QRScannerProps {
  onScan: (decodedText: string) => void;
  onClose?: () => void;
  fps?: number;
  qrbox?: number;
  lastScannedId?: string | null;
  isProcessing?: boolean;
  playSoundOnScan?: boolean;
  inline?: boolean;
  title?: string;
  subtitle?: string;
}

// Request Capacitor native permissions if running inside a Capacitor wrapper
const requestCapacitorPermissions = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const cap = (window as any).Capacitor;
  if (!cap) return false;

  try {
    const status = await Camera.checkPermissions();
    if (status.camera === 'granted') {
      return true;
    }
    const requestStatus = await Camera.requestPermissions({ permissions: ['camera'] });
    return requestStatus.camera === 'granted';
  } catch (e) {
    console.warn("[Capacitor] Camera permission check warning:", e);
    return false;
  }
};

export const QRScanner: React.FC<QRScannerProps> = ({ 
  onScan, 
  onClose, 
  fps = 30, 
  lastScannedId,
  isProcessing = false,
  playSoundOnScan = true,
  inline = false,
  title = "Tickify Live QR Scanner",
  subtitle = "Align any QR code inside camera view for instant verification"
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isScanningActiveRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedTextRef = useRef<string>('');
  const barcodeDetectorRef = useRef<any>(null);

  const [error, setError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Diagnostic states
  const [fpsCount, setFpsCount] = useState<number>(0);
  const [framesScanned, setFramesScanned] = useState<number>(0);
  const [lastScanSuccess, setLastScanSuccess] = useState<string | null>(null);

  // Controls & Enhancements
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [hasZoom, setHasZoom] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [contrastBoost, setContrastBoost] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(playSoundOnScan);
  const [enhancerNotification, setEnhancerNotification] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [fileScanning, setFileScanning] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const fpsTrackerRef = useRef<{ count: number; lastTime: number }>({ count: 0, lastTime: Date.now() });

  // Initialize BarcodeDetector API if available in browser
  useEffect(() => {
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetectorRef.current = new (window as any).BarcodeDetector({ 
          formats: ['qr_code', 'code_128', 'code_39', 'data_matrix', 'aztec'] 
        });
      } catch (e) {
        console.warn("BarcodeDetector init:", e);
      }
    }
  }, []);

  const triggerNotification = useCallback((msg: string) => {
    setEnhancerNotification(msg);
    const t = setTimeout(() => {
      setEnhancerNotification(prev => prev === msg ? null : prev);
    }, 2200);
    return () => clearTimeout(t);
  }, []);

  // Stop camera and cleanup streams
  const stopCamera = useCallback(() => {
    isScanningActiveRef.current = false;
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  }, []);

  // Handle successful scan dispatch
  const handleDecoded = useCallback((decodedText: string, cornerPoints?: Array<{ x: number; y: number }>) => {
    if (!decodedText || !decodedText.trim()) return;
    const clean = decodedText.trim();

    const now = Date.now();
    // Cooldown 1.8 seconds for exact same code to prevent continuous spamming
    if (lastScannedTextRef.current === clean && now - lastScannedTimeRef.current < 1800) {
      return;
    }

    lastScannedTextRef.current = clean;
    lastScannedTimeRef.current = now;
    setLastScanSuccess(clean.slice(0, 45));

    // Draw confirmation polygon on overlay if available
    const overlay = overlayCanvasRef.current;
    if (overlay && cornerPoints && cornerPoints.length >= 4) {
      const oCtx = overlay.getContext('2d');
      if (oCtx) {
        oCtx.lineWidth = 6;
        oCtx.strokeStyle = "#10B981";
        oCtx.fillStyle = "rgba(16, 185, 129, 0.35)";
        oCtx.beginPath();
        oCtx.moveTo(cornerPoints[0].x, cornerPoints[0].y);
        for (let i = 1; i < cornerPoints.length; i++) {
          oCtx.lineTo(cornerPoints[i].x, cornerPoints[i].y);
        }
        oCtx.closePath();
        oCtx.stroke();
        oCtx.fill();
      }
    }

    if (soundEnabled) {
      playSuccessSound(0.2);
    }

    triggerNotification("✓ QR Code Detected!");
    onScan(clean);
  }, [onScan, soundEnabled, triggerNotification]);

  // Main high-performance frame processing loop
  const scanLoop = useCallback(async () => {
    if (!isScanningActiveRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const overlay = overlayCanvasRef.current;

    // Track FPS
    const now = Date.now();
    fpsTrackerRef.current.count++;
    if (now - fpsTrackerRef.current.lastTime >= 1000) {
      setFpsCount(fpsTrackerRef.current.count);
      fpsTrackerRef.current.count = 0;
      fpsTrackerRef.current.lastTime = now;
    }

    if (video && video.readyState >= 2 && canvas) {
      const vWidth = video.videoWidth;
      const vHeight = video.videoHeight;

      if (vWidth > 0 && vHeight > 0) {
        setFramesScanned(prev => (prev + 1) % 10000);

        let detected = false;

        // Method 1: Hardware-accelerated native BarcodeDetector API
        if (barcodeDetectorRef.current) {
          try {
            const barcodes = await barcodeDetectorRef.current.detect(video);
            if (barcodes && barcodes.length > 0) {
              const code = barcodes[0];
              if (code?.rawValue) {
                detected = true;
                handleDecoded(code.rawValue, code.cornerPoints);
              }
            }
          } catch (bErr) {
            // fallback to jsQR below
          }
        }

        // Method 2: jsQR Canvas Pixel Scanning (Full Frame & ROI Center Crop)
        if (!detected) {
          canvas.width = vWidth;
          canvas.height = vHeight;

          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (ctx) {
            ctx.drawImage(video, 0, 0, vWidth, vHeight);

            // 2a. Full Frame Scan
            try {
              const imageData = ctx.getImageData(0, 0, vWidth, vHeight);
              const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "attemptBoth",
              });

              if (qrCode && qrCode.data) {
                detected = true;
                const loc = qrCode.location;
                handleDecoded(qrCode.data, [
                  loc.topLeftCorner,
                  loc.topRightCorner,
                  loc.bottomRightCorner,
                  loc.bottomLeftCorner
                ]);
              }
            } catch (e) {}

            // 2b. Center Crop ROI Scan (High density focus for small / phone QR codes)
            if (!detected) {
              try {
                const cropW = Math.floor(vWidth * 0.7);
                const cropH = Math.floor(vHeight * 0.7);
                const cropX = Math.floor((vWidth - cropW) / 2);
                const cropY = Math.floor((vHeight - cropH) / 2);

                const centerData = ctx.getImageData(cropX, cropY, cropW, cropH);
                const centerQR = jsQR(centerData.data, centerData.width, centerData.height, {
                  inversionAttempts: "attemptBoth",
                });

                if (centerQR && centerQR.data) {
                  detected = true;
                  handleDecoded(centerQR.data);
                }
              } catch (cropErr) {}
            }
          }
        }

        // Clear overlay if nothing detected
        if (!detected && overlay) {
          overlay.width = vWidth;
          overlay.height = vHeight;
          const oCtx = overlay.getContext('2d');
          if (oCtx) {
            oCtx.clearRect(0, 0, vWidth, vHeight);
          }
        }
      }
    }

    if (isScanningActiveRef.current) {
      animFrameIdRef.current = requestAnimationFrame(scanLoop);
    }
  }, [handleDecoded]);

  // Start Camera with flexible constraints
  const startCamera = useCallback(async (devId?: string, fMode?: 'environment' | 'user') => {
    stopCamera();
    setError(null);

    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        await requestCapacitorPermissions();
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera API is not supported in this browser environment. Ensure HTTPS or localhost is used.");
      }

      // Enumerate devices
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevs = devices.filter(d => d.kind === 'videoinput');
        setAvailableDevices(videoDevs);
      } catch (e) {}

      const activeFacing = fMode || facingMode;
      const constraints: MediaStreamConstraints = {
        audio: false,
        video: devId 
          ? { deviceId: { exact: devId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : {
              facingMode: { ideal: activeFacing },
              width: { ideal: 1280, min: 640 },
              height: { ideal: 720, min: 480 }
            }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        video.setAttribute("autoplay", "true");
        video.muted = true;
        
        await video.play().catch(playErr => {
          console.warn("Autoplay promise warning:", playErr);
        });

        isScanningActiveRef.current = true;
        setIsCameraActive(true);

        // Hardware features check (Torch, Zoom, Continuous Focus)
        const track = stream.getVideoTracks()[0];
        if (track) {
          try {
            const capabilities: any = track.getCapabilities?.() || {};
            const settings: any = track.getSettings?.() || {};

            if (capabilities.focusMode?.includes('continuous')) {
              await track.applyConstraints({
                advanced: [{ focusMode: 'continuous' }]
              } as any).catch(() => {});
            }

            if (capabilities.torch) {
              setHasTorch(true);
              setTorchOn(settings.torch || false);
            } else {
              setHasTorch(false);
            }

            if (capabilities.zoom) {
              setHasZoom(true);
              setZoomLevel(settings.zoom || 1);
            } else {
              setHasZoom(false);
            }
          } catch (capErr) {}
        }

        // Start scanning loop
        animFrameIdRef.current = requestAnimationFrame(scanLoop);
      }
    } catch (err: any) {
      console.error("Camera activation error:", err);
      setIsCameraActive(false);

      let msg = "Could not access camera. Please ensure permissions are granted.";
      const errStr = err?.message || String(err || "");
      if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
        msg = "Camera permission was denied. Please allow camera access in browser settings and tap 'Authorize Camera'.";
      } else if (errStr.includes("NotFoundError") || errStr.includes("DevicesNotFoundError")) {
        msg = "No camera found on this device.";
      } else if (errStr.includes("NotReadableError") || errStr.includes("TrackStartError")) {
        msg = "Camera is already in use by another app or browser tab.";
      }
      setError(msg);
    }
  }, [facingMode, scanLoop, stopCamera]);

  // Initial camera startup
  useEffect(() => {
    let isMounted = true;
    const timer = setTimeout(() => {
      if (isMounted) {
        startCamera();
      }
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Switch Facing Mode (Front <-> Back)
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(undefined, nextMode);
    triggerNotification(nextMode === 'environment' ? "Switched to Rear Camera" : "Switched to Front Camera");
  };

  // Toggle Torch / Flashlight
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const next = !torchOn;
      await (track as any).applyConstraints({
        advanced: [{ torch: next }]
      });
      setTorchOn(next);
      triggerNotification(next ? "Flashlight: ON" : "Flashlight: OFF");
    } catch (e) {
      triggerNotification("Hardware flashlight not supported");
    }
  };

  // Cycle Zoom
  const cycleZoom = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;

    try {
      const caps: any = track.getCapabilities?.() || {};
      if (caps.zoom) {
        const min = caps.zoom.min || 1;
        const max = Math.min(3.0, caps.zoom.max || 3.0);
        let next = zoomLevel + 0.5;
        if (next > max) next = min;

        await (track as any).applyConstraints({
          advanced: [{ zoom: next }]
        });
        setZoomLevel(next);
        triggerNotification(`Zoom: ${next.toFixed(1)}x`);
      } else {
        triggerNotification("Zoom not supported by sensor");
      }
    } catch (e) {
      triggerNotification("Zoom constraint unavailable");
    }
  };

  // Toggle Contrast Boost
  const toggleContrastBoost = () => {
    const next = !contrastBoost;
    setContrastBoost(next);
    triggerNotification(next ? "High Contrast: ON" : "High Contrast: OFF");
  };

  // Toggle Sound Chime
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (next) {
      playSuccessSound(0.15);
    }
    triggerNotification(next ? "Audio Feedback: ON" : "Audio Feedback: OFF");
  };

  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Decode QR using multi-engine strategy (Native BarcodeDetector, ZXing MultiFormatReader + Binarizers, BrowserQRCodeReader, Multi-Scale jsQR with Auto-Levels, Sharpening & Thresholding)
  const processImageForQR = async (file: File, img: HTMLImageElement): Promise<string | null> => {
    // 1. Native Hardware BarcodeDetector API (if supported by modern browser)
    if (barcodeDetectorRef.current) {
      try {
        const results = await barcodeDetectorRef.current.detect(img);
        if (results && results.length > 0 && results[0]?.rawValue?.trim()) {
          return results[0].rawValue.trim();
        }
      } catch (e) {}

      try {
        if (typeof createImageBitmap !== 'undefined') {
          const bitmap = await createImageBitmap(file);
          const results = await barcodeDetectorRef.current.detect(bitmap);
          if (results && results.length > 0 && results[0]?.rawValue?.trim()) {
            return results[0].rawValue.trim();
          }
        }
      } catch (e) {}
    }

    // 2. Direct ZXing BrowserQRCodeReader & BrowserMultiFormatReader on image element
    try {
      const browserQrReader = new BrowserQRCodeReader();
      const directQrRes = await browserQrReader.decodeFromImageElement(img);
      if (directQrRes && directQrRes.getText() && directQrRes.getText().trim()) {
        return directQrRes.getText().trim();
      }
    } catch (e) {}

    try {
      const browserMultiReader = new BrowserMultiFormatReader();
      const directMultiRes = await browserMultiReader.decodeFromImageElement(img);
      if (directMultiRes && directMultiRes.getText() && directMultiRes.getText().trim()) {
        return directMultiRes.getText().trim();
      }
    } catch (e) {}

    // 3. MultiFormatReader ZXing Engine setup
    const hints = new Map<DecodeHintType, any>();
    hints.set(DecodeHintType.POSSIBLE_FORMATS, [
      BarcodeFormat.QR_CODE,
      BarcodeFormat.DATA_MATRIX,
      BarcodeFormat.AZTEC,
      BarcodeFormat.PDF_417,
      BarcodeFormat.CODE_128,
      BarcodeFormat.CODE_39
    ]);
    hints.set(DecodeHintType.TRY_HARDER, true);

    const tryZXingDecode = (canvas: HTMLCanvasElement): string | null => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || canvas.width === 0 || canvas.height === 0) return null;

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const len = canvas.width * canvas.height;
        const luminances = new Uint8ClampedArray(len);
        for (let i = 0; i < len; i++) {
          const r = imgData.data[i * 4];
          const g = imgData.data[i * 4 + 1];
          const b = imgData.data[i * 4 + 2];
          luminances[i] = (r * 306 + g * 601 + b * 117) >> 10;
        }

        const lumSource = new RGBLuminanceSource(luminances, canvas.width, canvas.height);
        const zReader = new MultiFormatReader();
        zReader.setHints(hints);

        // Try 1: HybridBinarizer (standard contrast & lighting)
        try {
          const bitmap = new BinaryBitmap(new HybridBinarizer(lumSource));
          const res = zReader.decode(bitmap);
          if (res && res.getText() && res.getText().trim()) return res.getText().trim();
        } catch (e) {}

        // Try 2: GlobalHistogramBinarizer (flat / screenshot contrast)
        try {
          const bitmap = new BinaryBitmap(new GlobalHistogramBinarizer(lumSource));
          const res = zReader.decode(bitmap);
          if (res && res.getText() && res.getText().trim()) return res.getText().trim();
        } catch (e) {}

        // Try 3: InvertedLuminanceSource (inverted light-on-dark QR)
        try {
          const invLumSource = new InvertedLuminanceSource(lumSource);
          const bitmap = new BinaryBitmap(new HybridBinarizer(invLumSource));
          const res = zReader.decode(bitmap);
          if (res && res.getText() && res.getText().trim()) return res.getText().trim();
        } catch (e) {}
      } catch (err) {}

      return null;
    };

    // 4. Multi-Scale & Multi-Filter jsQR Pipeline
    const tryJsQRScan = (canvas: HTMLCanvasElement): string | null => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx || canvas.width === 0 || canvas.height === 0) return null;

      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Pass A: Direct RGBA scan with attemptBoth
        const resA = jsQR(imgData.data, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (resA && resA.data && resA.data.trim()) return resA.data.trim();

        // Pass B: Grayscale + Dynamic Contrast Histogram Stretch (Auto-Levels)
        const d = new Uint8ClampedArray(imgData.data);
        let minLum = 255;
        let maxLum = 0;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          if (lum < minLum) minLum = lum;
          if (lum > maxLum) maxLum = lum;
        }
        const range = maxLum - minLum || 1;
        for (let i = 0; i < d.length; i += 4) {
          const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
          const stretched = Math.min(255, Math.max(0, ((lum - minLum) / range) * 255));
          d[i] = stretched;
          d[i + 1] = stretched;
          d[i + 2] = stretched;
        }
        const resB = jsQR(d, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
        if (resB && resB.data && resB.data.trim()) return resB.data.trim();

        // Pass C: Adaptive Multi-Threshold Binarization
        for (const thresh of [128, 95, 160, 70, 190]) {
          const bData = new Uint8ClampedArray(imgData.data);
          for (let i = 0; i < bData.length; i += 4) {
            const lum = 0.299 * bData[i] + 0.587 * bData[i + 1] + 0.114 * bData[i + 2];
            const v = lum >= thresh ? 255 : 0;
            bData[i] = v;
            bData[i + 1] = v;
            bData[i + 2] = v;
          }
          const resC = jsQR(bData, imgData.width, imgData.height, { inversionAttempts: 'attemptBoth' });
          if (resC && resC.data && resC.data.trim()) return resC.data.trim();
        }
      } catch (err) {}

      return null;
    };

    // Unified scan on any canvas: runs ZXing then jsQR
    const scanCanvas = (canvas: HTMLCanvasElement): string | null => {
      const zx = tryZXingDecode(canvas);
      if (zx) return zx;
      const jq = tryJsQRScan(canvas);
      if (jq) return jq;
      return null;
    };

    // Helper: Create scaled canvas
    const createScaledCanvas = (targetMaxDim: number): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      let w = img.naturalWidth || img.width;
      let h = img.naturalHeight || img.height;
      if (w > targetMaxDim || h > targetMaxDim) {
        if (w > h) {
          h = Math.round((h * targetMaxDim) / w);
          w = targetMaxDim;
        } else {
          w = Math.round((w * targetMaxDim) / h);
          h = targetMaxDim;
        }
      }
      c.width = Math.max(1, w);
      c.height = Math.max(1, h);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, c.width, c.height);
      }
      return c;
    };

    // Helper: Create Sharpened canvas (Unsharp Mask Convolution)
    const createSharpenedCanvas = (sourceCanvas: HTMLCanvasElement): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = sourceCanvas.width;
      c.height = sourceCanvas.height;
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (!ctx) return sourceCanvas;
      ctx.drawImage(sourceCanvas, 0, 0);

      try {
        const srcData = ctx.getImageData(0, 0, c.width, c.height);
        const s = srcData.data;
        const dstData = ctx.createImageData(c.width, c.height);
        const d = dstData.data;
        const w = c.width;
        const h = c.height;

        // 3x3 Sharpen Kernel: [0, -1, 0, -1, 5, -1, 0, -1, 0]
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const idx = (y * w + x) * 4;
            const top = ((y - 1) * w + x) * 4;
            const bottom = ((y + 1) * w + x) * 4;
            const left = (y * w + (x - 1)) * 4;
            const right = (y * w + (x + 1)) * 4;

            for (let cIdx = 0; cIdx < 3; cIdx++) {
              const val = 5 * s[idx + cIdx] - s[top + cIdx] - s[bottom + cIdx] - s[left + cIdx] - s[right + cIdx];
              d[idx + cIdx] = Math.min(255, Math.max(0, val));
            }
            d[idx + 3] = s[idx + 3];
          }
        }
        ctx.putImageData(dstData, 0, 0);
        return c;
      } catch (e) {
        return sourceCanvas;
      }
    };

    // Helper: Create Rotated canvas
    const createRotatedCanvas = (sourceCanvas: HTMLCanvasElement, angleDeg: number): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      const rad = (angleDeg * Math.PI) / 180;
      if (angleDeg === 90 || angleDeg === 270) {
        c.width = sourceCanvas.height;
        c.height = sourceCanvas.width;
      } else {
        c.width = sourceCanvas.width;
        c.height = sourceCanvas.height;
      }
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.translate(c.width / 2, c.height / 2);
        ctx.rotate(rad);
        ctx.drawImage(sourceCanvas, -sourceCanvas.width / 2, -sourceCanvas.height / 2);
      }
      return c;
    };

    // Helper: Create ROI Crop canvas
    const createCroppedCanvas = (sourceCanvas: HTMLCanvasElement, sx: number, sy: number, sw: number, sh: number): HTMLCanvasElement => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.floor(sw));
      c.height = Math.max(1, Math.floor(sh));
      const ctx = c.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, c.width, c.height);
      }
      return c;
    };

    // Helper: Scan Regions of Interest on a canvas
    const scanRois = (baseCanvas: HTMLCanvasElement): string | null => {
      const bw = baseCanvas.width;
      const bh = baseCanvas.height;
      if (bw < 50 || bh < 50) return null;

      const crops = [
        // Center 50% and 75%
        { x: bw * 0.25, y: bh * 0.25, w: bw * 0.5, h: bh * 0.5 },
        { x: bw * 0.125, y: bh * 0.125, w: bw * 0.75, h: bh * 0.75 },
        // Top-Right Quadrant (Standard location for Verification Slip QR)
        { x: bw * 0.45, y: 0, w: bw * 0.55, h: bh * 0.55 },
        // Bottom-Right Quadrant (Standard location for Ticket Pass QR)
        { x: bw * 0.45, y: bh * 0.45, w: bw * 0.55, h: bh * 0.55 },
        // Top-Left Quadrant
        { x: 0, y: 0, w: bw * 0.55, h: bh * 0.55 },
        // Bottom-Left Quadrant
        { x: 0, y: bh * 0.45, w: bw * 0.55, h: bh * 0.55 },
        // Top Half & Bottom Half
        { x: 0, y: 0, w: bw, h: bh * 0.6 },
        { x: 0, y: bh * 0.4, w: bw, h: bh * 0.6 },
        // Left Half & Right Half
        { x: 0, y: 0, w: bw * 0.6, h: bh },
        { x: bw * 0.4, y: 0, w: bw * 0.6, h: bh }
      ];

      for (const cr of crops) {
        const c = createCroppedCanvas(baseCanvas, cr.x, cr.y, cr.w, cr.h);
        const r = scanCanvas(c);
        if (r) return r;
        const rSharp = scanCanvas(createSharpenedCanvas(c));
        if (rSharp) return rSharp;
      }
      return null;
    };

    // Step A: Native unscaled original canvas (Highest fidelity for screenshots and PDF tickets)
    const origW = img.naturalWidth || img.width;
    const origH = img.naturalHeight || img.height;
    if (origW > 0 && origH > 0 && origW <= 4000 && origH <= 4000) {
      const nativeCanvas = document.createElement('canvas');
      nativeCanvas.width = origW;
      nativeCanvas.height = origH;
      const ctx = nativeCanvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        const rNative = scanCanvas(nativeCanvas);
        if (rNative) return rNative;
        
        const rNativeSharp = scanCanvas(createSharpenedCanvas(nativeCanvas));
        if (rNativeSharp) return rNativeSharp;

        const rNativeRois = scanRois(nativeCanvas);
        if (rNativeRois) return rNativeRois;
      }
    }

    // Step B: Multi-Resolution Scaled Processing (2400, 1600, 1200, 800, 500)
    const targetScales = [1600, 1200, 2400, 800, 500];
    for (const scale of targetScales) {
      const canvas = createScaledCanvas(scale);
      
      // Standard scan
      const r = scanCanvas(canvas);
      if (r) return r;

      // Sharpened scan
      const sharpCanvas = createSharpenedCanvas(canvas);
      const rSharp = scanCanvas(sharpCanvas);
      if (rSharp) return rSharp;

      // ROI crops on optimal scale canvases
      if (scale === 1600 || scale === 1200) {
        const rRoi = scanRois(canvas);
        if (rRoi) return rRoi;
      }
    }

    // Step C: Try Rotations (90°, 180°, 270° on 1200px canvas)
    const canvas1200 = createScaledCanvas(1200);
    for (const deg of [90, 180, 270]) {
      const rot = createRotatedCanvas(canvas1200, deg);
      const resRot = scanCanvas(rot);
      if (resRot) return resRot;
      const resRotSharp = scanCanvas(createSharpenedCanvas(rot));
      if (resRotSharp) return resRotSharp;
    }

    // Step D: Html5Qrcode scanFile fallback with offscreen worker
    try {
      const anchorEl = document.getElementById('tickify-photo-scanner-anchor');
      if (anchorEl) {
        const html5QrCode = new Html5Qrcode('tickify-photo-scanner-anchor');
        try {
          const decoded = await html5QrCode.scanFile(file, true);
          html5QrCode.clear();
          if (decoded && decoded.trim()) {
            return decoded.trim();
          }
        } catch (scanErr) {
          html5QrCode.clear();
        }
      }
    } catch (e) {}

    return null;
  };

  // Process selected image file with comprehensive decoding pipeline
  const handleFileProcess = async (file: File) => {
    if (!file) return;

    setFileScanning(true);
    triggerNotification("Deep Scanning QR from Image...");

    try {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.crossOrigin = "anonymous";

      const loadPromise = new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (err) => reject(err);
      });

      img.src = url;
      await loadPromise;

      const decodedCode = await processImageForQR(file, img);
      URL.revokeObjectURL(url);

      if (decodedCode) {
        handleDecoded(decodedCode);
      } else {
        playErrorSound(0.15);
        triggerNotification("No QR code detected. Try taking a closer photo or entering code manually.");
      }
    } catch (err: any) {
      console.error("File QR scan error, trying fallback reader:", err);
      // Fallback via FileReader Data URL
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          try {
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = "anonymous";
            fallbackImg.onload = async () => {
              const res = await processImageForQR(file, fallbackImg);
              if (res) {
                handleDecoded(res);
              } else {
                playErrorSound(0.15);
                triggerNotification("No QR code detected in this photo");
              }
              setFileScanning(false);
            };
            fallbackImg.onerror = () => {
              playErrorSound(0.15);
              triggerNotification("Could not load image format");
              setFileScanning(false);
            };
            fallbackImg.src = ev.target?.result as string;
          } catch (e) {
            playErrorSound(0.15);
            triggerNotification("Failed to analyze photo");
            setFileScanning(false);
          }
        };
        reader.readAsDataURL(file);
        return;
      } catch (readErr) {
        playErrorSound(0.15);
        triggerNotification("Failed to analyze image file");
      }
    } finally {
      setFileScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Scan from uploaded Image File input change
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handleFileProcess(file);
  };

  // Global Clipboard Paste Listener (Ctrl+V / Cmd+V screenshot paste)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            e.preventDefault();
            handleFileProcess(file);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [handleDecoded]);

  // Manual Submission handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleDecoded(manualInput.trim());
    setManualInput('');
  };

  // Quick test simulation for testing without a physical printed QR
  const handleSimulateTestScan = (sampleCode: string) => {
    handleDecoded(sampleCode);
  };

  // Content JSX for scanner
  const scannerContent = (
    <div className={`flex flex-col gap-4 ${inline ? 'w-full' : 'w-full max-w-xl p-6 rounded-3xl bg-zinc-950 border border-emerald-500/30 shadow-2xl backdrop-blur-xl'}`}>
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <QrCode className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-black text-white uppercase tracking-wider font-display">{title}</h4>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE ({fpsCount > 0 ? `${fpsCount} FPS` : 'READY'})
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium">{subtitle}</p>
          </div>
        </div>

        {onClose && !inline && (
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Main Viewfinder Box */}
      <div 
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file && file.type.startsWith('image/')) {
            handleFileProcess(file);
          }
        }}
        className={`relative w-full aspect-video max-h-[380px] sm:max-h-[440px] rounded-2xl overflow-hidden border transition-all bg-black flex items-center justify-center shadow-inner ${
          isDraggingOver ? 'border-emerald-400 ring-4 ring-emerald-500/30' : 'border-emerald-500/30'
        }`}
      >
        
        {/* Hidden internal canvas for frame reading and Html5Qrcode worker anchor */}
        <canvas ref={canvasRef} className="hidden" />
        <div id="tickify-photo-scanner-anchor" className="hidden" style={{ display: 'none' }} />

        {/* Video Element */}
        <video 
          ref={videoRef}
          playsInline
          autoPlay
          muted
          className={`w-full h-full object-cover transition-all ${
            contrastBoost ? 'contrast-[150%] brightness-[110%] saturate-[120%]' : ''
          }`}
        />

        {/* QR Bounding Polygon Canvas (Drawn over live video) */}
        <canvas 
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Drag & Drop Hover Overlay */}
        {isDraggingOver && (
          <div className="absolute inset-0 bg-emerald-950/90 backdrop-blur-sm z-30 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-emerald-400 p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 animate-bounce">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-bold text-white font-display uppercase tracking-wider">Drop Image to Scan QR</p>
              <p className="text-xs text-emerald-300/80">Release to analyze ticket or verification slip</p>
            </div>
          </div>
        )}

        {/* Deep File Scanning Overlay */}
        {fileScanning && (
          <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-md z-30 flex flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-black">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="space-y-1.5 max-w-xs">
              <p className="text-xs font-bold text-white uppercase tracking-wider">Analyzing Photo with Multi-Engine QR AI</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Checking native decoder, ZXing multi-format, high-contrast auto-levels, rotations, and quadrant ROI scans...
              </p>
            </div>
          </div>
        )}

        {/* Scanner Radar Frame Overlay HUD */}
        {isCameraActive && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            {/* Viewfinder Bounding Target */}
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 border-2 border-emerald-500/40 rounded-3xl overflow-hidden shadow-[0_0_30px_rgba(16,185,129,0.15)] flex items-center justify-center">
              
              {/* Laser Scanning Line Animation */}
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-[scanLaser_2.2s_ease-in-out_infinite] shadow-[0_0_12px_#10b981]" />

              {/* Center Crosshair */}
              <div className="w-3 h-3 border border-emerald-400/60 rounded-full" />

              {/* Corner HUD Markers */}
              <div className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
              <div className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
              <div className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
              <div className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
            </div>

            {/* Instruction Badge */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-white/10 text-[10px] font-mono text-zinc-300 font-medium">
              Scanning active • Full-frame & center target
            </div>
          </div>
        )}

        {/* Floating Notification Toast inside Viewfinder */}
        {enhancerNotification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-2xl pointer-events-none z-30 flex items-center gap-1.5 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{enhancerNotification}</span>
          </div>
        )}

        {/* Camera Starting / Loading State */}
        {!isCameraActive && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-zinc-950/90 z-20">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-zinc-300 font-mono">Starting live camera video stream...</p>
          </div>
        )}

        {/* Error / Permission Fallback Screen */}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3 bg-zinc-950/95 z-30">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-bold text-red-400 uppercase tracking-wider">Camera Access Required</p>
              <p className="text-[11px] text-zinc-400 leading-relaxed">{error}</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button 
                onClick={() => startCamera()}
                className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-bold transition-all cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                Authorize & Retry
              </button>
              <button 
                onClick={() => setShowManualInput(true)}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer"
              >
                Manual Code Entry
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Camera Controls Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        
        {/* Switch Camera */}
        <button
          onClick={toggleFacingMode}
          type="button"
          className="p-2.5 rounded-xl border bg-white/5 border-white/10 hover:bg-white/10 active:scale-95 text-zinc-300 hover:text-white flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
          title="Switch between front and back cameras"
        >
          <SwitchCamera className="w-4 h-4 text-emerald-400" />
          <span>Flip Camera</span>
        </button>

        {/* Zoom */}
        <button
          onClick={cycleZoom}
          type="button"
          className={`p-2.5 rounded-xl border active:scale-95 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
            zoomLevel > 1 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
              : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
          }`}
          title="Adjust camera digital zoom"
        >
          <ZoomIn className="w-4 h-4 text-emerald-400" />
          <span>{zoomLevel > 1 ? `${zoomLevel.toFixed(1)}x` : 'Zoom'}</span>
        </button>

        {/* Flashlight */}
        <button
          onClick={toggleTorch}
          type="button"
          disabled={!hasTorch}
          className={`p-2.5 rounded-xl border active:scale-95 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer disabled:opacity-40 disabled:pointer-events-none ${
            torchOn 
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' 
              : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
          }`}
          title="Toggle camera flashlight"
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>{torchOn ? 'Torch ON' : 'Torch'}</span>
        </button>

        {/* Contrast Filter */}
        <button
          onClick={toggleContrastBoost}
          type="button"
          className={`p-2.5 rounded-xl border active:scale-95 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
            contrastBoost 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
              : 'bg-white/5 border-white/10 text-zinc-300 hover:text-white'
          }`}
          title="Boost image contrast for faint or glossy QR screens"
        >
          <Contrast className="w-4 h-4 text-emerald-400" />
          <span>{contrastBoost ? 'Sharp: ON' : 'Enhance'}</span>
        </button>

        {/* Audio Chime */}
        <button
          onClick={toggleSound}
          type="button"
          className={`col-span-2 sm:col-span-1 p-2.5 rounded-xl border active:scale-95 flex items-center justify-center gap-1.5 transition-all text-xs font-semibold cursor-pointer ${
            soundEnabled 
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
              : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
          }`}
          title="Toggle beep sound upon QR recognition"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-zinc-500" />}
          <span>{soundEnabled ? 'Chime ON' : 'Muted'}</span>
        </button>

      </div>

      {/* Actions: Manual Entry & Upload & Test Scan */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        
        {/* File Image Upload Fallback */}
        <input 
          type="file" 
          ref={fileInputRef} 
          accept="image/*" 
          onChange={handleFileUpload} 
          className="hidden" 
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={fileScanning}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {fileScanning ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Upload className="w-4 h-4 text-emerald-400" />}
          <span>Scan from Photo</span>
        </button>

        {/* Manual Input Toggle */}
        <button
          type="button"
          onClick={() => setShowManualInput(prev => !prev)}
          className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-300 hover:text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Keyboard className="w-4 h-4 text-emerald-400" />
          <span>{showManualInput ? 'Hide Keypad' : 'Type Ticket ID / Phone'}</span>
        </button>

        {/* Restart Stream */}
        <button
          type="button"
          onClick={() => startCamera()}
          className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-zinc-400 hover:text-white flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          title="Restart camera stream"
        >
          <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reset Camera</span>
        </button>
      </div>

      {/* Manual Input Form */}
      {showManualInput && (
        <form onSubmit={handleManualSubmit} className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
          <label className="text-xs font-semibold text-zinc-300 block">
            Enter Member ID, Ticket ID, Phone Number or bKash Trxn ID:
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                value={manualInput}
                onChange={(e) => setManualInput(e.target.value)}
                placeholder="e.g. SPOT-10452, 10452, 01712345678, or JMC-10452"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 font-mono"
              />
            </div>
            <button
              type="submit"
              disabled={!manualInput.trim()}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-black text-xs font-bold transition-all cursor-pointer"
            >
              Verify Code
            </button>
          </div>
        </form>
      )}

      {/* Last Scanned Status Indicator */}
      {lastScannedId && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-400/80">Last Successfully Scanned</p>
              <p className="font-mono font-bold text-white text-xs mt-0.5">{lastScannedId}</p>
            </div>
          </div>
          {isProcessing ? (
            <div className="flex items-center gap-1.5 text-[10px] font-bold font-mono text-amber-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>UPDATING...</span>
            </div>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-mono text-[10px] font-bold">
              ✓ VALIDATED
            </span>
          )}
        </div>
      )}

    </div>
  );

  if (inline) {
    return (
      <div className="w-full">
        {scannerContent}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      {scannerContent}
    </div>
  );
};

export default QRScanner;
