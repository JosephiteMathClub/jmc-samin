"use client";
import React, { useEffect, useRef } from 'react';

interface StarFieldProps {
  reduced?: boolean;
}

const StarField: React.FC<StarFieldProps> = ({ reduced = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let particles: Particle[] = [];
    let animationFrameId: number;

    const mouse = {
      x: -9999 as number,
      y: -9999 as number,
    };

    const isMobile = window.innerWidth <= 768 || reduced;
    
    // Config mirroring the codepen
    const particleCount = isMobile ? (window.innerWidth * window.innerHeight) / 10000 : (window.innerWidth * window.innerHeight) / 6000;
    const connectionRadius = isMobile ? 140 : 200;
    const mouseConnectionRadius = isMobile ? 180 : 280;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();

    class Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      radius: number;

      constructor() {
        this.x = Math.random() * canvas!.width;
        this.y = Math.random() * canvas!.height;
        this.vx = (Math.random() - 0.5) * 1.0; // Slower, elegant movement
        this.vy = (Math.random() - 0.5) * 1.0;
        this.radius = Math.random() * 2 + 1; // 1 to 3
      }

      draw() {
        if(!ctx) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#ffffff';
      }

      update() {
        if(!ctx || !canvas) return;
        if (this.x > canvas.width || this.x < 0) this.vx = -this.vx;
        if (this.y > canvas.height || this.y < 0) this.vy = -this.vy;

        this.x += this.vx;
        this.y += this.vy;
        this.draw();
        
        ctx.shadowBlur = 0;
      }
    }

    const init = () => {
      particles = [];
      const count = Math.min(Math.floor(particleCount), 400); // Capped for performance
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const connect = () => {
      if(!ctx) return;
      let opacityValue = 1;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a; b < particles.length; b++) {
          let dx = particles[a].x - particles[b].x;
          let dy = particles[a].y - particles[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < connectionRadius) {
            opacityValue = 1 - (distance / connectionRadius);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 0.8})`; // Increased intensity
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }
        
        // Mouse connection
        if (mouse.x !== -9999 && mouse.y !== -9999) {
          let dx = particles[a].x - mouse.x;
          let dy = particles[a].y - mouse.y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < mouseConnectionRadius) {
            opacityValue = 1 - (distance / mouseConnectionRadius);
            ctx.strokeStyle = `rgba(255, 255, 255, ${opacityValue * 1.0})`; // Stronger mouse connection
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
      }
      connect();
    };

    init();
    animate();

    const handleResize = () => {
      setCanvasSize();
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const handleMouseOut = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseout', handleMouseOut);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseout', handleMouseOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <div className="fixed inset-0 top-0 left-0 bg-[#111111]" style={{ zIndex: -10, pointerEvents: 'auto' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />
    </div>
  );
};

export default StarField;
