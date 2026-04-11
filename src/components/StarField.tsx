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

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let particles: Particle[] = [];
    let lastTime = 0;
    const mouse = { x: -1000, y: -1000 };
    const isMobile = reduced || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    class Particle {
      x: number;
      y: number;
      size: number;
      baseX: number;
      baseY: number;
      density: number;
      color: string;
      angle: number;
      velocity: number;
      twinkleSpeed: number;
      twinkleOpacity: number;

      constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 1.5 + 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
        this.density = (Math.random() * 30) + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.velocity = Math.random() * 0.2 + 0.05;
        this.twinkleSpeed = Math.random() * 0.02 + 0.005;
        this.twinkleOpacity = Math.random();
        
        const isGold = Math.random() > 0.7;
        this.color = isGold ? '245, 158, 11' : '255, 255, 255';
      }

      draw() {
        if (!ctx) return;
        this.twinkleOpacity += this.twinkleSpeed;
        const opacity = (Math.sin(this.twinkleOpacity) + 1) / 2 * 0.6 + 0.1;
        
        ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.closePath();
        ctx.fill();
      }

      update(width: number, height: number) {
        // Subtle floating movement
        this.baseX += Math.cos(this.angle) * this.velocity;
        this.baseY += Math.sin(this.angle) * this.velocity;
        
        // Wrap around screen
        if (this.baseX < 0) this.baseX = width;
        if (this.baseX > width) this.baseX = 0;
        if (this.baseY < 0) this.baseY = height;
        if (this.baseY > height) this.baseY = 0;

        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < 150) {
          let forceDirectionX = dx / distance;
          let forceDirectionY = dy / distance;
          let maxDistance = 150;
          let force = (maxDistance - distance) / maxDistance;
          let directionX = forceDirectionX * force * this.density;
          let directionY = forceDirectionY * force * this.density;
          this.x -= directionX;
          this.y -= directionY;
        } else {
          if (this.x !== this.baseX) {
            this.x -= (this.x - this.baseX) / 15;
          }
          if (this.y !== this.baseY) {
            this.y -= (this.y - this.baseY) / 15;
          }
        }
      }
    }

    class Comet {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
      active: boolean;

      constructor(width: number, height: number) {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.length = Math.random() * 80 + 50;
        this.speed = Math.random() * 15 + 10;
        this.opacity = 0;
        this.active = false;
      }

      reset(width: number) {
        this.x = Math.random() * width + width * 0.5;
        this.y = Math.random() * -100;
        this.length = Math.random() * 80 + 50;
        this.speed = Math.random() * 15 + 10;
        this.opacity = 0;
        this.active = true;
      }

      update(width: number, height: number) {
        if (!this.active) {
          if (Math.random() < 0.005) this.reset(width);
          return;
        }

        this.x -= this.speed;
        this.y += this.speed;
        this.opacity = Math.min(1, this.opacity + 0.1);

        if (this.x < -this.length || this.y > height + this.length) {
          this.active = false;
        }
      }

      draw() {
        if (!this.active || !ctx) return;
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.5})`;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y - this.length);
        ctx.stroke();

        // Head glow
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, 4);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    let comets: Comet[] = [];

    const init = () => {
      particles = [];
      const divisor = isMobile ? 40000 : 25000; // Increased divisor = fewer particles
      const numberOfParticles = (canvas.width * canvas.height) / divisor;
      for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * canvas.width;
        let y = Math.random() * canvas.height;
        particles.push(new Particle(x, y));
      }
      
      comets = Array.from({ length: isMobile ? 1 : 2 }).map(() => new Comet(canvas.width, canvas.height));
    };

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      init();
    };

    const handleMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('mousemove', handleMouseMove);
    handleResize();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Throttle to ~30fps
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 32) return; 
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update(canvas.width, canvas.height);
      }
      for (let i = 0; i < comets.length; i++) {
        comets[i].update(canvas.width, canvas.height);
        comets[i].draw();
      }
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-20"
      style={{ filter: 'blur(0.5px)' }}
    />
  );
};

export default StarField;
