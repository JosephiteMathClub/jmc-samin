"use client";
import React, { useEffect, useRef } from 'react';

interface MathVisualizationsProps {
  reduced?: boolean;
}

const MathVisualizations: React.FC<MathVisualizationsProps> = ({ reduced = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;
    let lastTime = 0;
    const isMobile = reduced || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Lorenz Attractor variables
    let x = 0.1, y = 0, z = 0;
    const a = 10, b = 28, c = 8 / 3;
    const dt = 0.01;
    const points: { x: number, y: number, z: number }[] = [];
    const maxPoints = reduced ? 150 : 300; 

    // Offscreen canvas for grid caching
    const gridCanvas = document.createElement('canvas');
    const gridCtx = gridCanvas.getContext('2d');

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);

      // Update grid cache
      gridCanvas.width = canvas.width;
      gridCanvas.height = canvas.height;
      if (gridCtx) {
        gridCtx.scale(dpr, dpr);
        renderGridToCache(gridCtx);
      }
    };

    const renderGridToCache = (gCtx: CanvasRenderingContext2D) => {
      const step = 50;
      gCtx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      gCtx.lineWidth = 1;

      for (let i = 0; i < window.innerWidth; i += step) {
        gCtx.beginPath();
        gCtx.moveTo(i, 0);
        gCtx.lineTo(i, window.innerHeight);
        gCtx.stroke();
      }

      for (let i = 0; i < window.innerHeight; i += step) {
        gCtx.beginPath();
        gCtx.moveTo(0, i);
        gCtx.lineTo(window.innerWidth, i);
        gCtx.stroke();
      }

      // Add coordinate-like markers
      gCtx.fillStyle = 'rgba(245, 158, 11, 0.15)';
      gCtx.font = '8px monospace';
      for (let i = 0; i < window.innerWidth; i += step * 4) {
        for (let j = 0; j < window.innerHeight; j += step * 4) {
          gCtx.fillText(`${i},${j}`, i + 2, j - 2);
          gCtx.beginPath();
          gCtx.arc(i, j, 1.5, 0, Math.PI * 2);
          gCtx.fill();
        }
      }
    };

    // Shards for sci-fi feel
    const shards: { x: number, y: number, length: number, speed: number, alpha: number }[] = [];
    const initShards = () => {
      const count = reduced ? 15 : 30;
      for (let i = 0; i < count; i++) {
        shards.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          length: 20 + Math.random() * 60,
          speed: 0.5 + Math.random() * 2,
          alpha: 0.05 + Math.random() * 0.1
        });
      }
    };

    // Data rings
    const rings: { radius: number, speed: number, angle: number, gaps: number[] }[] = [];
    const initRings = () => {
      if (isMobile) return;
      for (let i = 0; i < 2; i++) { // Reduced count
        rings.push({
          radius: 100 + i * 50,
          speed: (Math.random() - 0.5) * 0.005, // Slower
          angle: Math.random() * Math.PI * 2,
          gaps: [Math.random() * 0.5, Math.random() * 1.5]
        });
      }
    };

    const drawTechnicalRings = () => {
      ctx.save();
      ctx.translate(window.innerWidth * 0.15, window.innerHeight * 0.8);
      
      rings.forEach((ring, i) => {
        ring.angle += ring.speed;
        ctx.beginPath();
        ctx.strokeStyle = `rgba(245, 158, 11, ${0.05 / (i + 1)})`;
        ctx.setLineDash([20, 10, 5, 10]);
        ctx.arc(0, 0, ring.radius, ring.angle, ring.angle + Math.PI * (2 - ring.gaps[0]));
        ctx.stroke();
        
        ctx.setLineDash([]);
        if (i === 1) {
          ctx.font = '7px monospace';
          ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
          ctx.fillText(`ROT_UNIT_${i}: ${(ring.angle % (Math.PI * 2)).toFixed(2)}`, ring.radius + 5, 0);
        }
      });
      ctx.restore();
    };

    let lastHexUpdate = 0;
    let cachedHex: string[] = [];

    const drawHexStream = (timestamp: number) => {
      if (timestamp - lastHexUpdate > 200) { // Update every 200ms
        cachedHex = Array.from({ length: 15 }).map(() => 
          `0x${Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0')}`
        );
        lastHexUpdate = timestamp;
      }

      ctx.save();
      ctx.font = '7px monospace';
      ctx.fillStyle = 'rgba(245, 158, 11, 0.03)';
      const startX = window.innerWidth - 100;
      const startY = window.innerHeight * 0.3;
      
      cachedHex.forEach((hex, r) => {
         ctx.fillText(hex, startX, startY + r * 12);
      });
      ctx.restore();
    };

    const drawShards = () => {
      ctx.save();
      ctx.lineWidth = 1;
      shards.forEach(shard => {
        shard.x += shard.speed;
        if (shard.x > window.innerWidth) {
          shard.x = -shard.length;
          shard.y = Math.random() * window.innerHeight;
        }

        // Avoid creating gradients every frame - use simple opacity for performance
        ctx.strokeStyle = `rgba(245, 158, 11, ${shard.alpha})`;
        ctx.beginPath();
        ctx.moveTo(shard.x, shard.y);
        ctx.lineTo(shard.x + shard.length, shard.y);
        ctx.stroke();

        // Small pulse dots (rarer)
        if (Math.random() < 0.005) {
           ctx.fillStyle = `rgba(255, 255, 255, ${shard.alpha * 1.5})`;
           ctx.beginPath();
           ctx.arc(shard.x + shard.length * 0.5, shard.y, 0.5, 0, Math.PI * 2);
           ctx.fill();
        }
      });
      ctx.restore();
    };

    window.addEventListener('resize', resize);
    resize();
    initShards();
    initRings();

    const drawGrid = () => {
      if (gridCanvas.width > 0 && gridCanvas.height > 0) {
        ctx.drawImage(gridCanvas, 0, 0, window.innerWidth, window.innerHeight);
      }
    };

    const updateLorenz = () => {
      const dx = a * (y - x) * dt;
      const dy = (x * (b - z) - y) * dt;
      const dz = (x * y - c * z) * dt;
      x += dx;
      y += dy;
      z += dz;

      points.push({ x, y, z });
      if (points.length > maxPoints) {
        points.shift();
      }
    };

    const drawLorenz = () => {
      if (points.length < 2) return;

      ctx.save();
      ctx.translate(window.innerWidth * 0.8, window.innerHeight * 0.7);
      ctx.scale(isMobile ? 5 : 7, isMobile ? 5 : 7);
      ctx.rotate(time * 0.1);

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.1)';
      ctx.lineWidth = 0.2;

      for (let i = 1; i < points.length; i++) {
        const p1 = points[i - 1];
        const p2 = points[i];
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawFibonacci = () => {
      ctx.save();
      ctx.translate(window.innerWidth * 0.2, window.innerHeight * 0.3);
      ctx.rotate(time * 0.05);
      
      let a = 0, b = 1, temp;
      let angle = 0;
      const scale = 2;

      ctx.strokeStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();

      for (let i = 0; i < 12; i++) {
        const radius = b * scale;
        ctx.arc(0, 0, radius, angle, angle + Math.PI / 2);
        
        temp = a;
        a = b;
        b = temp + b;
        
        const move = a * scale;
        ctx.translate(move, 0);
        ctx.rotate(Math.PI / 2);
        angle = 0;
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawSineWave = () => {
      ctx.save();
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.lineWidth = 1;
      
      const amplitude = 30; // Better amplitude
      const frequency = 0.01;
      const centerY = window.innerHeight * 0.9;
      const step = 2; // Smoother wave
      
      ctx.moveTo(0, centerY);
      for (let x = 0; x < window.innerWidth; x += step) {
        const y = centerY + Math.sin(x * frequency + time) * amplitude;
        ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();
    };

    const drawGeometricPulse = () => {
      ctx.save();
      ctx.translate(window.innerWidth * 0.5, window.innerHeight * 0.5);
      
      const radius = (Math.sin(time * 0.5) + 1) * 120 + 50;
      const opacity = (Math.cos(time * 0.5) + 1) * 0.02;
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
      ctx.lineWidth = 1.5;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI * 2) / 6 + time * 0.2;
          const hx = Math.cos(angle) * (radius * 0.8);
          const hy = Math.sin(angle) * (radius * 0.8);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();
      
      ctx.restore();
    };

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 40) return; // Throttled to ~25fps
      lastTime = currentTime;

      // Clear physical buffer reliably
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      time += 0.01;

      drawGrid();
      if (!reduced) {
        updateLorenz();
        drawLorenz();
        drawFibonacci();
        drawSineWave();
        drawGeometricPulse();
        drawTechnicalRings();
        drawHexStream(currentTime);
      }
      drawShards();
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-1"
    />
  );
};

export default MathVisualizations;
