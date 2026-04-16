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
    const maxPoints = isMobile ? 100 : 300; // Reduced points

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
      gCtx.strokeStyle = 'rgba(245, 158, 11, 0.03)';
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

      gCtx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      for (let i = 0; i < window.innerWidth; i += step * 5) {
        for (let j = 0; j < window.innerHeight; j += step * 5) {
          gCtx.beginPath();
          gCtx.arc(i, j, 2, 0, Math.PI * 2);
          gCtx.fill();
        }
      }
    };

    window.addEventListener('resize', resize);
    resize();

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
      if (isMobile) return; // Skip on mobile for performance
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
      
      const amplitude = isMobile ? 10 : 20;
      const frequency = 0.01;
      const centerY = window.innerHeight * 0.9;
      const step = isMobile ? 8 : 4; // Skip pixels for performance
      
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
      
      const radius = (Math.sin(time * 0.5) + 1) * (isMobile ? 50 : 100) + 50;
      const opacity = (Math.cos(time * 0.5) + 1) * 0.02;
      
      ctx.beginPath();
      ctx.strokeStyle = `rgba(245, 158, 11, ${opacity})`;
      ctx.lineWidth = 1.5;
      ctx.arc(0, 0, radius, 0, Math.PI * 2);
      ctx.stroke();
      
      if (!isMobile) {
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
      }
      
      ctx.restore();
    };

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Throttle to ~30fps
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 32) return; 
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      time += 0.01;

      drawGrid();
      updateLorenz();
      drawLorenz();
      drawFibonacci();
      drawSineWave();
      drawGeometricPulse();
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-20"
    />
  );
};

export default MathVisualizations;
