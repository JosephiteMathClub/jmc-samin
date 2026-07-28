"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Compass, 
  Box, 
  Triangle, 
  Scale, 
  Activity, 
  Cpu, 
  Sparkles, 
  Globe, 
  RotateCcw, 
  Play, 
  Pause, 
  CheckCircle2, 
  Layers, 
  Ruler, 
  Eye, 
  TrendingUp, 
  Sliders, 
  Award 
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StarField from '@/components/StarField';

export default function DiscoverMathPlayView() {
  const [activeTab, setActiveTab] = useState<'solids' | 'triangles' | 'algebra' | 'physics' | 'examples' | 'challenges'>('solids');

  // --- Module A: 3D Solids State ---
  const [solidType, setSolidType] = useState<'cube' | 'prism' | 'sphere' | 'cylinder' | 'cone'>('prism');
  const [dimW, setDimW] = useState<number>(6);
  const [dimH, setDimH] = useState<number>(8);
  const [dimD, setDimD] = useState<number>(5);
  const [rotationAngle, setRotationAngle] = useState<number>(30);
  const solidsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Module B: Similar Triangles State ---
  const [scaleFactor, setScaleFactor] = useState<number>(1.5);
  const [baseTriangleWidth, setBaseTriangleWidth] = useState<number>(8);
  const [baseTriangleHeight, setBaseTriangleHeight] = useState<number>(6);
  const [shadowDistance, setShadowDistance] = useState<number>(12);
  const trianglesCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // --- Module C: Algebraic Balance Scale State ---
  const [balanceXCountLeft, setBalanceXCountLeft] = useState<number>(3);
  const [balanceUnitsLeft, setBalanceUnitsLeft] = useState<number>(4);
  const [balanceXCountRight, setBalanceXCountRight] = useState<number>(1);
  const [balanceUnitsRight, setBalanceUnitsRight] = useState<number>(12);
  const [targetXValue, setTargetXValue] = useState<number>(4); // (12 - 4) / (3 - 1) = 4

  // --- Module D: Physics Simulator State ---
  const [pendulumLength, setPendulumLength] = useState<number>(150);
  const [pendulumAngle, setPendulumAngle] = useState<number>(45); // degrees
  const [pendulumGravity, setPendulumGravity] = useState<number>(9.8);
  const [isPlayingPhysics, setIsPlayingPhysics] = useState<boolean>(true);
  const physicsCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Render 3D Solids Canvas
  useEffect(() => {
    const canvas = solidsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';

    const rad = (rotationAngle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    const scale = 18;
    const w = dimW * scale;
    const h = dimH * scale;
    const d = dimD * scale;

    if (solidType === 'cube' || solidType === 'prism') {
      const vertices = [
        [-w/2, -h/2, -d/2], [w/2, -h/2, -d/2], [w/2, h/2, -d/2], [-w/2, h/2, -d/2],
        [-w/2, -h/2, d/2],  [w/2, -h/2, d/2],  [w/2, h/2, d/2],  [-w/2, h/2, d/2]
      ];

      const proj = vertices.map(([x, y, z]) => {
        const xRot = x * cosA - z * sinA;
        const zRot = x * sinA + z * cosA;
        const pScale = 200 / (200 + zRot + 100);
        return [cx + xRot * pScale, cy + y * pScale];
      });

      const edges = [
        [0,1],[1,2],[2,3],[3,0],
        [4,5],[5,6],[6,7],[7,4],
        [0,4],[1,5],[2,6],[3,7]
      ];

      ctx.beginPath();
      edges.forEach(([i, j]) => {
        ctx.moveTo(proj[i][0], proj[i][1]);
        ctx.lineTo(proj[j][0], proj[j][1]);
      });
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(proj[0][0], proj[0][1]);
      ctx.lineTo(proj[1][0], proj[1][1]);
      ctx.lineTo(proj[2][0], proj[2][1]);
      ctx.lineTo(proj[3][0], proj[3][1]);
      ctx.closePath();
      ctx.fill();
    } else if (solidType === 'sphere') {
      const r = (dimW * scale) / 2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.3, 0, 0, 2 * Math.PI);
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else if (solidType === 'cylinder') {
      const r = (dimW * scale) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy - h/2, r, r * 0.3, 0, 0, 2 * Math.PI);
      ctx.ellipse(cx, cy + h/2, r, r * 0.3, 0, 0, 2 * Math.PI);
      ctx.moveTo(cx - r, cy - h/2);
      ctx.lineTo(cx - r, cy + h/2);
      ctx.moveTo(cx + r, cy - h/2);
      ctx.lineTo(cx + r, cy + h/2);
      ctx.stroke();
      ctx.fill();
    } else if (solidType === 'cone') {
      const r = (dimW * scale) / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy + h/2, r, r * 0.3, 0, 0, 2 * Math.PI);
      ctx.moveTo(cx - r, cy + h/2);
      ctx.lineTo(cx, cy - h/2);
      ctx.lineTo(cx + r, cy + h/2);
      ctx.stroke();
      ctx.fill();
    }
  }, [solidType, dimW, dimH, dimD, rotationAngle, activeTab]);

  // Render Similar Triangles Canvas
  useEffect(() => {
    const canvas = trianglesCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const bx = 60;
    const by = 220;

    // Original Triangle T1
    const w1 = baseTriangleWidth * 12;
    const h1 = baseTriangleHeight * 12;

    ctx.strokeStyle = '#fbbf24';
    ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.lineTo(bx + w1, by);
    ctx.lineTo(bx, by - h1);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#fbbf24';
    ctx.font = '12px monospace';
    ctx.fillText(`Δ T₁ (b=${baseTriangleWidth}, h=${baseTriangleHeight})`, bx, by + 20);

    // Scaled Similar Triangle T2
    const w2 = w1 * scaleFactor;
    const h2 = h1 * scaleFactor;
    const bx2 = bx + w1 + 60;

    ctx.strokeStyle = '#38bdf8';
    ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';

    ctx.beginPath();
    ctx.moveTo(bx2, by);
    ctx.lineTo(bx2 + w2, by);
    ctx.lineTo(bx2, by - h2);
    ctx.closePath();
    ctx.stroke();
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Δ T₂ (Scale k=${scaleFactor}x: b=${(baseTriangleWidth*scaleFactor).toFixed(1)}, h=${(baseTriangleHeight*scaleFactor).toFixed(1)})`, bx2, by + 20);
  }, [scaleFactor, baseTriangleWidth, baseTriangleHeight, activeTab]);

  // Physics Pendulum Animation Loop
  useEffect(() => {
    if (activeTab !== 'physics' || !isPlayingPhysics) return;
    let animId: number;
    let currentAngle = (pendulumAngle * Math.PI) / 180;
    let angularVel = 0;

    const canvas = physicsCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      const dt = 0.05;
      const angularAccel = (-pendulumGravity / pendulumLength) * Math.sin(currentAngle);
      angularVel += angularAccel * dt;
      currentAngle += angularVel * dt;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const originX = canvas.width / 2;
      const originY = 40;

      const bobX = originX + pendulumLength * Math.sin(currentAngle);
      const bobY = originY + pendulumLength * Math.cos(currentAngle);

      // Support beam
      ctx.strokeStyle = '#52525b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(originX - 40, originY);
      ctx.lineTo(originX + 40, originY);
      ctx.stroke();

      // String
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(bobX, bobY);
      ctx.stroke();

      // Bob
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(bobX, bobY, 16, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.stroke();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [pendulumLength, pendulumAngle, pendulumGravity, isPlayingPhysics, activeTab]);

  // Derived Calculations
  const solidVolume = (dimW * dimH * dimD).toFixed(1);
  const solidSurfaceArea = (2 * (dimW*dimH + dimH*dimD + dimW*dimD)).toFixed(1);
  const hypotenuse = Math.sqrt(baseTriangleWidth**2 + baseTriangleHeight**2).toFixed(2);
  const scaledHypotenuse = (Math.sqrt(baseTriangleWidth**2 + baseTriangleHeight**2) * scaleFactor).toFixed(2);

  // Balance scale calculations
  const leftTotal = balanceXCountLeft * targetXValue + balanceUnitsLeft;
  const rightTotal = balanceXCountRight * targetXValue + balanceUnitsRight;
  const isScaleBalanced = leftTotal === rightTotal;

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      <StarField />
      <Navbar />

      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        
        {/* Host Subdomain Banner */}
        <div className="mb-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-amber-400" />
            <span>Hosted Subdomain Application: <strong className="text-white">discover-math-play.jmc-sjs.org</strong></span>
          </div>
          <span className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-200">Interactive Math & Physics Playground</span>
        </div>

        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-widest"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Interactive Mathematics & Physics Playground</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white">
            Discover Math <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">Play</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            Explore 3D solid geometry, similar triangles, algebraic balance scales, physical pendulum dynamics, and scientific engineering challenges.
          </p>

          {/* Core 9 Takeaways Badges */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-2 text-xs font-mono">
            {[
              'Observation',
              'Measurement',
              'Geometry of solids',
              'Similar triangles',
              'Algebraic manipulation',
              'Mathematical modelling',
              'Engineering thinking',
              'Scientific investigation',
              'Critical thinking'
            ].map((item, idx) => (
              <span key={idx} className="px-3 py-1 rounded-lg bg-white/[0.03] border border-white/10 text-amber-300 flex items-center gap-1.5">
                <span className="text-amber-400 font-bold">◆</span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'solids', label: '3D Geometry of Solids', icon: Box },
            { id: 'triangles', label: 'Similar Triangles & Shadows', icon: Triangle },
            { id: 'algebra', label: 'Algebraic Balance Scale', icon: Scale },
            { id: 'physics', label: 'Physics Pendulum Modelling', icon: Activity },
            { id: 'examples', label: 'Worked Examples & Formulas', icon: Layers },
            { id: 'challenges', label: 'Engineering Challenges', icon: Cpu }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all border ${
                  isActive
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Module A: 3D Solids Explorer */}
        {activeTab === 'solids' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10">
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Box className="w-5 h-5 text-amber-400" />
                  <span>3D Solid Interactive Canvas</span>
                </h3>
                <span className="text-xs font-mono text-zinc-400">Rotate & Adjust Dimensions</span>
              </div>

              <div className="w-full h-80 bg-black/60 rounded-2xl border border-white/10 flex items-center justify-center relative overflow-hidden">
                <canvas ref={solidsCanvasRef} width={500} height={300} className="w-full h-full" />
                <div className="absolute top-4 left-4 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-white/10 text-[11px] font-mono text-amber-300">
                  3D View: {solidType.toUpperCase()}
                </div>
              </div>

              {/* Angle Slider */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Rotation Angle:</span>
                  <span className="text-amber-400">{rotationAngle}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={rotationAngle}
                  onChange={(e) => setRotationAngle(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            {/* Controls Panel */}
            <div className="space-y-6 bg-white/[0.02] p-6 rounded-2xl border border-white/5">
              <h4 className="text-sm font-mono font-bold uppercase text-amber-400">Dimensions & Metrics</h4>

              <div className="space-y-3">
                <label className="text-xs font-mono text-zinc-400">Shape Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['prism', 'sphere', 'cylinder', 'cone'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSolidType(s)}
                      className={`p-2.5 rounded-xl border text-xs font-mono capitalize transition-all ${
                        solidType === s
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Width / Radius Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Width / Radius (w):</span>
                  <span className="text-white">{dimW} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={dimW}
                  onChange={(e) => setDimW(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Height Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Height (h):</span>
                  <span className="text-white">{dimH} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="14"
                  value={dimH}
                  onChange={(e) => setDimH(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Depth Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Depth (d):</span>
                  <span className="text-white">{dimD} units</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={dimD}
                  onChange={(e) => setDimD(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Calculated Outputs */}
              <div className="pt-4 border-t border-white/10 space-y-2 text-xs font-mono">
                <div className="flex justify-between text-zinc-300">
                  <span>Calculated Volume (V):</span>
                  <span className="text-amber-400 font-bold">{solidVolume} u³</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Surface Area (A):</span>
                  <span className="text-amber-400 font-bold">{solidSurfaceArea} u²</span>
                </div>
                <div className="flex justify-between text-zinc-300">
                  <span>Euler Formula (V - E + F):</span>
                  <span className="text-emerald-400 font-bold">2 (Invariant)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Module B: Similar Triangles */}
        {activeTab === 'triangles' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Triangle className="w-5 h-5 text-amber-400" />
                  <span>Similar Triangles & Scale Factor Laboratory</span>
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Demonstrating Thales Theorem: Corresponding angles remain equal while side lengths scale proportionally.
                </p>
              </div>
            </div>

            <div className="w-full h-72 bg-black/60 rounded-2xl border border-white/10 flex items-center justify-center">
              <canvas ref={trianglesCanvasRef} width={600} height={260} className="w-full h-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Scale Factor (k):</span>
                  <span className="text-amber-400 font-bold">{scaleFactor}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="3.0"
                  step="0.1"
                  value={scaleFactor}
                  onChange={(e) => setScaleFactor(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Base Width (b):</span>
                  <span className="text-white">{baseTriangleWidth} u</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="14"
                  value={baseTriangleWidth}
                  onChange={(e) => setBaseTriangleWidth(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Base Height (h):</span>
                  <span className="text-white">{baseTriangleHeight} u</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="14"
                  value={baseTriangleHeight}
                  onChange={(e) => setBaseTriangleHeight(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/20 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono text-amber-200">
              <div>
                <span className="text-zinc-400 block">Original Hypotenuse:</span>
                <strong className="text-white text-sm">{hypotenuse} units</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Scaled Hypotenuse:</span>
                <strong className="text-amber-400 text-sm">{scaledHypotenuse} units</strong>
              </div>
              <div>
                <span className="text-zinc-400 block">Area Ratio (k²):</span>
                <strong className="text-emerald-400 text-sm">{(scaleFactor**2).toFixed(2)}x Area</strong>
              </div>
            </div>
          </div>
        )}

        {/* Module C: Algebraic Balance Scale */}
        {activeTab === 'algebra' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-amber-400" />
                <span>Algebraic Manipulation Balance Scale</span>
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                Isolate variable $x$ by performing equal algebraic operations on both pans of the physical scale.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-black/60 border border-white/10 text-center space-y-6">
              <div className="text-2xl font-mono font-bold text-white">
                {balanceXCountLeft}x + {balanceUnitsLeft} = {balanceXCountRight}x + {balanceUnitsRight}
              </div>

              {/* Physical Balance Visualizer */}
              <div className="relative w-full max-w-md mx-auto h-32 flex items-center justify-between border-b-4 border-zinc-700 px-8">
                {/* Left Pan */}
                <div className="p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs">
                  <div>Left Pan</div>
                  <strong className="text-white text-base">{leftTotal} kg</strong>
                </div>

                {/* Fulcrum Center */}
                <div className="w-0 h-0 border-l-[20px] border-l-transparent border-r-[20px] border-r-transparent border-b-[35px] border-b-amber-500" />

                {/* Right Pan */}
                <div className="p-4 rounded-2xl bg-sky-500/20 border border-sky-500/40 text-sky-300 font-mono text-xs">
                  <div>Right Pan</div>
                  <strong className="text-white text-base">{rightTotal} kg</strong>
                </div>
              </div>

              <div className="text-xs font-mono text-emerald-400 font-bold">
                ✓ Balance State: Scale is Perfectly Balanced when x = {targetXValue}!
              </div>
            </div>

            {/* Manipulation Action Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button
                onClick={() => {
                  if (balanceXCountLeft > 1 && balanceXCountRight > 0) {
                    setBalanceXCountLeft(balanceXCountLeft - 1);
                    setBalanceXCountRight(balanceXCountRight - 1);
                  }
                }}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition-all"
              >
                Subtract 1x from Both Pans
              </button>
              <button
                onClick={() => {
                  if (balanceUnitsLeft > 0 && balanceUnitsRight > 0) {
                    setBalanceUnitsLeft(balanceUnitsLeft - 1);
                    setBalanceUnitsRight(balanceUnitsRight - 1);
                  }
                }}
                className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white transition-all"
              >
                Subtract 1 Unit Weight from Both Pans
              </button>
            </div>
          </div>
        )}

        {/* Module D: Physics Simulator */}
        {activeTab === 'physics' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-amber-400" />
                  <span>Mathematical Modelling: Pendulum Dynamics</span>
                </h3>
                <p className="text-xs text-zinc-400 font-light mt-0.5">
                  Simulating simple harmonic motion: T = 2π√(L/g).
                </p>
              </div>

              <button
                onClick={() => setIsPlayingPhysics(!isPlayingPhysics)}
                className="px-4 py-2 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-xs flex items-center gap-2"
              >
                {isPlayingPhysics ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlayingPhysics ? 'Pause' : 'Play'} Simulation</span>
              </button>
            </div>

            <div className="w-full h-64 bg-black/60 rounded-2xl border border-white/10 flex items-center justify-center">
              <canvas ref={physicsCanvasRef} width={500} height={240} className="w-full h-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Pendulum Length (L):</span>
                  <span className="text-amber-400">{pendulumLength} cm</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="220"
                  value={pendulumLength}
                  onChange={(e) => setPendulumLength(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-mono text-zinc-400">
                  <span>Gravity (g):</span>
                  <span className="text-white">{pendulumGravity} m/s²</span>
                </div>
                <input
                  type="range"
                  min="1.6"
                  max="24.8"
                  step="0.1"
                  value={pendulumGravity}
                  onChange={(e) => setPendulumGravity(parseFloat(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Module E: Worked Examples & Mathematical Derivations */}
        {activeTab === 'examples' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <span>Worked Physical Examples & Mathematical Formulas</span>
              </h3>
              <p className="text-xs text-zinc-400 font-light mt-0.5">
                Step-by-step mathematical solutions for physical geometry, triangulation, algebraic scale isolation, and pendulum harmonic motion.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                {
                  id: 'ex_solids',
                  title: 'Worked Example 1: 3D Rectangular Prism Volume & Surface Area Derivation',
                  formula: 'V = w × h × d  |  SA = 2(w·h + h·d + w·d)',
                  problem: 'Given a rectangular container with Width w = 6m, Height h = 8m, and Depth d = 5m.',
                  steps: [
                    'Step 1 (Volume Calculation): V = 6m × 8m × 5m = 240 m³.',
                    'Step 2 (Face Areas): Front/Back = 6×8 = 48m². Top/Bottom = 6×5 = 30m². Sides = 8×5 = 40m².',
                    'Step 3 (Total Surface Area): SA = 2(48 + 30 + 40) = 2(118) = 236 m².',
                    'Step 4 (Engineering Metric): Volume to Surface Area Ratio = 240 / 236 ≈ 1.017 m.'
                  ],
                  result: 'Volume: 240 m³ | Surface Area: 236 m²'
                },
                {
                  id: 'ex_triangles',
                  title: 'Worked Example 2: Thales Shadow Triangulation Method',
                  formula: 'Height_target / Shadow_target = Height_reference / Shadow_reference',
                  problem: 'A vertical 2m meter stick casts a 3m shadow on flat ground. At the same time, a cathedral tower casts a 45m shadow. Find the height of the tower.',
                  steps: [
                    'Step 1 (Similar Triangles Principle): Solar rays strike the ground at parallel angles, creating similar right triangles.',
                    'Step 2 (Proportionality Equation): H / 45 = 2 / 3.',
                    'Step 3 (Cross Multiplication): 3 × H = 2 × 45 = 90.',
                    'Step 4 (Isolation): H = 90 / 3 = 30 meters.'
                  ],
                  result: 'Tower Height H = 30 meters'
                },
                {
                  id: 'ex_algebra',
                  title: 'Worked Example 3: Dual-Pan Balance Scale Algebraic Isolation',
                  formula: 'Left Pan: 3x + 4  |  Right Pan: x + 12',
                  problem: 'Isolate the unknown weight x from the balanced scale equation 3x + 4 = x + 12.',
                  steps: [
                    'Step 1 (Remove x block from both pans): Subtract x from both sides ⇒ 2x + 4 = 12.',
                    'Step 2 (Remove unit weights from both pans): Subtract 4 from both sides ⇒ 2x = 8.',
                    'Step 3 (Divide both sides by 2): x = 8 / 2 = 4.',
                    'Step 4 (Verification): Left = 3(4) + 4 = 16. Right = 4 + 12 = 16. Scale is balanced!'
                  ],
                  result: 'Unknown Weight x = 4 units'
                },
                {
                  id: 'ex_physics',
                  title: 'Worked Example 4: Pendulum Simple Harmonic Period Formula',
                  formula: 'T = 2π √(L / g)',
                  problem: 'A pendulum has string length L = 0.98m on Earth where gravity g = 9.8 m/s². Compute oscillation period T.',
                  steps: [
                    'Step 1 (Length to Gravity Ratio): L / g = 0.98 / 9.8 = 0.1.',
                    'Step 2 (Square Root Extraction): √(0.1) ≈ 0.316227.',
                    'Step 3 (Multiply by 2π): T = 2 × 3.14159 × 0.316227 ≈ 1.9869 seconds.',
                    'Step 4 (Physical Meaning): The pendulum completes one full back-and-forth swing every ~1.99 seconds.'
                  ],
                  result: 'Period T ≈ 1.99 seconds'
                }
              ].map((ex) => (
                <div key={ex.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <h4 className="text-base font-bold text-white">{ex.title}</h4>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300">
                      {ex.result}
                    </span>
                  </div>

                  <div className="text-sm font-mono font-bold text-amber-300 bg-black/40 p-3 rounded-xl border border-white/5">
                    Formula: {ex.formula}
                  </div>

                  <p className="text-xs text-zinc-300 font-mono leading-relaxed">{ex.problem}</p>

                  <div className="space-y-2 pt-1">
                    {ex.steps.map((s, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 text-xs font-mono text-zinc-300">
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Module F: Engineering Challenges */}
        {activeTab === 'challenges' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-amber-400" />
              <span>Engineering & Scientific Investigation Challenges</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[
                {
                  title: 'Container Surface Optimization',
                  desc: 'Find dimensions for a rectangular box of volume 216 u³ that minimizes total cardboard surface area.',
                  hint: 'Symmetrical cube (6x6x6) yields minimum area 216 u².'
                },
                {
                  title: 'Shadow Height Triangulation',
                  desc: 'A 2m pole casts a 3m shadow. If a tower shadow measures 45m, compute tower height using similar triangles.',
                  hint: 'Height = (2 / 3) * 45 = 30 meters.'
                }
              ].map((c, i) => (
                <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <h4 className="text-base font-bold text-white">{c.title}</h4>
                  <p className="text-xs text-zinc-300 font-light leading-relaxed">{c.desc}</p>
                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/20 text-xs font-mono text-amber-300">
                    💡 Key Answer: {c.hint}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
