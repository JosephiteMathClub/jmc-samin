"use client";

import React, { useMemo } from 'react';

interface GeometricAvatarProps {
  name: string;
  size?: number | string;
  className?: string;
}

export default function GeometricAvatar({ name, size = "100%", className = "" }: GeometricAvatarProps) {
  // Simple deterministic hash function
  const hash = useMemo(() => {
    const trimmed = (name || "JMC").trim();
    let h = 0;
    for (let i = 0; i < trimmed.length; i++) {
      h = trimmed.charCodeAt(i) + ((h << 5) - h);
    }
    return Math.abs(h);
  }, [name]);

  // Extract given name (first word, sanitized)
  const givenName = useMemo(() => {
    const trimmed = (name || "JMC").trim();
    const firstWord = trimmed.split(/\s+/)[0] || "JMC";
    return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
  }, [name]);

  const initial = useMemo(() => {
    return givenName.charAt(0) || "U";
  }, [givenName]);

  // Generate deterministic visual attributes based on the hash
  const visualConfig = useMemo(() => {
    const h = hash;
    
    // Curated high-contrast math-themed color palettes (hues)
    const palettes = [
      { primary: "#f43f5e", secondary: "#fb7185", accent: "#fda4af", bg: "from-rose-900/50 to-neutral-950" }, // Rose / Ruby
      { primary: "#0ea5e9", secondary: "#38bdf8", accent: "#7dd3fc", bg: "from-sky-900/50 to-neutral-950" },  // Sky / Sapphire
      { primary: "#a855f7", secondary: "#c084fc", accent: "#d8b4fe", bg: "from-purple-900/50 to-neutral-950" },// Violet / Amethyst
      { primary: "#10b981", secondary: "#34d399", accent: "#6ee7b7", bg: "from-emerald-900/50 to-neutral-950" },// Emerald / Jade
      { primary: "#f59e0b", secondary: "#fbbf24", accent: "#fde047", bg: "from-amber-900/50 to-neutral-950" }, // Amber / Topaz
      { primary: "#ec4899", secondary: "#f472b6", accent: "#f9a8d4", bg: "from-pink-900/50 to-neutral-950" },  // Pink / Magenta
      { primary: "#6366f1", secondary: "#818cf8", accent: "#a5b4fc", bg: "from-indigo-900/50 to-neutral-950" }, // Indigo / Cobalt
    ];

    const paletteIndex = h % palettes.length;
    const palette = palettes[paletteIndex];
    
    // Choose geometric style
    const styleType = h % 4; 
    
    // Rotations & geometry offsets
    const rotation1 = (h % 90);
    const rotation2 = ((h >> 2) % 180);
    const numPoints = 5 + (h % 5); // 5 to 9 points
    const ringCount = 2 + (h % 3);   // 2 to 4 rings
    
    return {
      palette,
      styleType,
      rotation1,
      rotation2,
      numPoints,
      ringCount,
    };
  }, [hash]);

  // Generate vertices for SVG polygons
  const pointsString = useMemo(() => {
    const { numPoints } = visualConfig;
    const center = 50;
    const radius = 35;
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2;
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [visualConfig]);

  const innerPointsString = useMemo(() => {
    const { numPoints } = visualConfig;
    const center = 50;
    const radius = 20;
    const pts = [];
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * 2 * Math.PI) / numPoints - Math.PI / 2 + Math.PI; // inverted rotation
      const x = center + radius * Math.cos(angle);
      const y = center + radius * Math.sin(angle);
      pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [visualConfig]);

  return (
    <div 
      className={`relative rounded-full select-none overflow-hidden flex items-center justify-center bg-gradient-to-b ${visualConfig.palette.bg} border border-white/15 shadow-inner ${className}`}
      style={{ width: size, height: size }}
    >
      {/* Dynamic Geometric Vector Layer */}
      <svg 
        viewBox="0 0 100 100" 
        className="absolute inset-0 w-full h-full opacity-60 mix-blend-screen scale-105 pointer-events-none"
      >
        <defs>
          <linearGradient id={`grad-${hash}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={visualConfig.palette.primary} />
            <stop offset="100%" stopColor={visualConfig.palette.secondary} />
          </linearGradient>
          <linearGradient id={`grad-accent-${hash}`} x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={visualConfig.palette.accent} stopOpacity={0.8} />
            <stop offset="100%" stopColor={visualConfig.palette.primary} stopOpacity={0.1} />
          </linearGradient>
        </defs>

        {/* Style 0: Spirograph / Mathematical Rings & Orbit Path */}
        {visualConfig.styleType === 0 && (
          <g transform={`rotate(${visualConfig.rotation1} 50 50)`}>
            {/* Fine outer circular coordinate system lines */}
            <circle cx="50" cy="50" r="44" fill="none" stroke="white" strokeWidth="0.25" strokeDasharray="2,2" opacity="0.3" />
            <circle cx="50" cy="50" r="38" fill="none" stroke={`url(#grad-${hash})`} strokeWidth="1" opacity="0.4" />
            <circle cx="50" cy="50" r="28" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
            
            {/* Orbit rings */}
            <ellipse cx="50" cy="50" rx="42" ry="18" fill="none" stroke={`url(#grad-${hash})`} strokeWidth="1.5" transform={`rotate(${visualConfig.rotation2} 50 50)`} />
            <ellipse cx="50" cy="50" rx="42" ry="18" fill="none" stroke="white" strokeWidth="0.75" transform={`rotate(${visualConfig.rotation2 + 90} 50 50)`} opacity="0.6" />
            <ellipse cx="50" cy="50" rx="30" ry="10" fill="none" stroke={visualConfig.palette.accent} strokeWidth="1" transform={`rotate(${visualConfig.rotation2 - 45} 50 50)`} opacity="0.8" />
          </g>
        )}

        {/* Style 1: Overlapping Rotated Inscribed Polygons */}
        {visualConfig.styleType === 1 && (
          <g transform={`rotate(${visualConfig.rotation2} 50 50)`}>
            {/* Outer polygon */}
            <polygon 
              points={pointsString} 
              fill="none" 
              stroke={`url(#grad-${hash})`} 
              strokeWidth="1.5" 
            />
            {/* Rotated outer polygon */}
            <polygon 
              points={pointsString} 
              fill="none" 
              stroke="white" 
              strokeWidth="0.5" 
              transform={`rotate(25 50 50)`}
              opacity="0.5"
            />
            {/* Inner inverse-rotated polygon */}
            <polygon 
              points={innerPointsString} 
              fill={`url(#grad-accent-${hash})`} 
              fillOpacity="0.15"
              stroke={`url(#grad-${hash})`} 
              strokeWidth="1" 
              transform={`rotate(-25 50 50)`}
            />
            {/* Fine coordinate lines from center */}
            <g opacity="0.3">
              {Array.from({ length: visualConfig.numPoints }).map((_, i) => {
                const angle = (i * 2 * Math.PI) / visualConfig.numPoints - Math.PI / 2;
                const x = 50 + 42 * Math.cos(angle);
                const y = 50 + 42 * Math.sin(angle);
                return (
                  <line 
                    key={i} 
                    x1="50" 
                    y1="50" 
                    x2={x.toFixed(1)} 
                    y2={y.toFixed(1)} 
                    stroke="white" 
                    strokeWidth="0.5" 
                  />
                );
              })}
            </g>
          </g>
        )}

        {/* Style 2: Starburst & Sacred Geometry Lattice */}
        {visualConfig.styleType === 2 && (
          <g transform={`rotate(${visualConfig.rotation1} 50 50)`}>
            {/* Center concentric mesh */}
            {Array.from({ length: visualConfig.ringCount }).map((_, i) => (
              <circle 
                key={i} 
                cx="50" 
                cy="50" 
                r={(15 + i * 11)} 
                fill="none" 
                stroke={i % 2 === 0 ? `url(#grad-${hash})` : "white"} 
                strokeWidth={i % 2 === 0 ? "1.5" : "0.5"} 
                strokeDasharray={i % 2 === 0 ? "" : "3,3"}
                opacity={0.3 + (i * 0.2)}
              />
            ))}
            {/* 12-point star grid rays */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 * Math.PI) / 180;
              const x1 = 50 + 10 * Math.cos(angle);
              const y1 = 50 + 10 * Math.sin(angle);
              const x2 = 50 + 45 * Math.cos(angle);
              const y2 = 50 + 45 * Math.sin(angle);
              return (
                <line 
                  key={i} 
                  x1={x1.toFixed(1)} 
                  y1={y1.toFixed(1)} 
                  x2={x2.toFixed(1)} 
                  y2={y2.toFixed(1)} 
                  stroke={`url(#grad-${hash})`} 
                  strokeWidth="0.75" 
                  opacity="0.5" 
                />
              );
            })}
          </g>
        )}

        {/* Style 3: Overlapping Quantum Fields / Wave Interference */}
        {visualConfig.styleType === 3 && (
          <g>
            <circle cx="35" cy="50" r="28" fill="none" stroke={`url(#grad-${hash})`} strokeWidth="1.5" opacity="0.6" />
            <circle cx="65" cy="50" r="28" fill="none" stroke={`url(#grad-accent-${hash})`} strokeWidth="1.5" opacity="0.6" />
            <circle cx="50" cy="35" r="25" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
            <circle cx="50" cy="65" r="25" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.4" />
            {/* Tiny intersecting points */}
            <circle cx="50" cy="50" r="3" fill={visualConfig.palette.accent} opacity="0.8" />
            <circle cx="50" cy="26" r="2" fill="white" opacity="0.6" />
            <circle cx="50" cy="74" r="2" fill="white" opacity="0.6" />
          </g>
        )}
      </svg>

      {/* Glossy radial overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-tr from-black/25 via-transparent to-white/10 pointer-events-none" />

      {/* Bold display letter representing given name */}
      <span className="relative font-mono font-black text-2xl sm:text-3xl text-white tracking-widest text-shadow drop-shadow-[0_4px_12px_rgba(0,0,0,0.6)] animate-fade-in">
        {initial}
      </span>
    </div>
  );
}
