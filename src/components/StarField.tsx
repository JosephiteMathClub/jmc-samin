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

    const mathFormulas = [
      '∫ x² dx',
      'd/dx(sin x)',
      'E = mc²',
      '∇·E = ρ/ε₀',
      'ψ(x,t)',
      'F = ma',
      'e^(iπ) + 1 = 0',
      '∇ × B = μ₀J + μ₀ε₀(∂E/∂t)',
      'iℏ(∂ψ/∂t) = Ĥψ',
      'lim(n→∞) (1+1/n)ⁿ = e',
      'A = πr²',
      'pV = nRT',
      'c² = a² + b²',
      'ΔxΔp ≥ ℏ/2',
      '∑ n⁻² = π²/6',
      'φ = (1 + √5) / 2',
      '∇²φ = 0'
    ];

    class Formula {
      x: number;
      y: number;
      text: string;
      opacity: number;
      maxOpacity: number;
      life: number;
      maxLife: number;
      angle: number;
      rotationSpeed: number;
      vx: number;
      vy: number;
      fontSize: number;

      constructor(width: number, height: number) {
        this.text = mathFormulas[Math.floor(Math.random() * mathFormulas.length)];
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.opacity = 0;
        this.maxOpacity = Math.random() * 0.2 + 0.15; // 0.15 to 0.35 opacity
        this.maxLife = Math.random() * 600 + 400; // frames
        this.life = 0;
        this.angle = (Math.random() - 0.5) * 0.4;
        this.rotationSpeed = (Math.random() - 0.5) * 0.001;
        this.vx = (Math.random() - 0.5) * 0.2;
        this.vy = (Math.random() - 0.5) * 0.2 - 0.1; // drift mostly upwards
        this.fontSize = Math.random() * 14 + 18; // slightly larger
      }

      update() {
        this.life++;
        this.x += this.vx;
        this.y += this.vy;
        this.angle += this.rotationSpeed;

        if (this.life < 60) {
          this.opacity = (this.life / 60) * this.maxOpacity;
        } else if (this.life > this.maxLife - 60) {
          this.opacity = Math.max(0, ((this.maxLife - this.life) / 60) * this.maxOpacity);
        } else {
          this.opacity = this.maxOpacity;
        }
      }

      draw() {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.font = `italic ${this.fontSize}px "Caveat", "Chalkboard SE", "Comic Sans MS", cursive, serif`; 
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.shadowBlur = 8;
        ctx.fillText(this.text, 0, 0);
        ctx.restore();
      }
    }

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
        const opacity = (Math.sin(this.twinkleOpacity) + 1) / 2 * 0.4 + 0.05; // Slightly dimmer
        
        ctx.fillStyle = `rgba(${this.color}, ${opacity})`;
        ctx.beginPath();
        // Use rect instead of arc for performance if tiny
        if (this.size < 1) {
          ctx.fillRect(this.x, this.y, this.size, this.size);
        } else {
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fill();
        }
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
        ctx.strokeStyle = `rgba(255, 255, 255, ${this.opacity * 0.4})`;
        ctx.lineWidth = 1.5; 
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x + this.length, this.y - this.length);
        ctx.stroke();

        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Sparkle trailing
        if (!reduced) {
          for (let i = 0; i < 6; i++) {
            const offsetX = Math.random() * this.length;
            const offsetY = -offsetX + (Math.random() - 0.5) * 6; // random spread around the line
            ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity * Math.random() * 0.6})`;
            ctx.beginPath();
            ctx.arc(this.x + offsetX, this.y + offsetY, Math.random() * 1.5, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        ctx.restore();
      }
    }

    let comets: Comet[] = [];
    let formulas: Formula[] = [];
    let parallaxX = 0;
    let parallaxY = 0;

    const init = () => {
      particles = [];
      const divisor = reduced ? 80000 : 30000;
      const numberOfParticles = (window.innerWidth * window.innerHeight) / divisor;
      for (let i = 0; i < numberOfParticles; i++) {
        let x = Math.random() * window.innerWidth;
        let y = Math.random() * window.innerHeight;
        particles.push(new Particle(x, y));
      }
      
      comets = Array.from({ length: 4 }).map(() => new Comet(window.innerWidth, window.innerHeight));
      
      formulas = [];
      const numFormulas = reduced ? 3 : 8;
      for (let i = 0; i < numFormulas; i++) {
        formulas.push(new Formula(window.innerWidth, window.innerHeight));
        // randomize life so they don't all spawn fade together
        formulas[i].life = Math.random() * formulas[i].maxLife;
      }
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
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
      
      const deltaTime = currentTime - lastTime;
      // Allow standard 60fps, skip only if it's absurdly fast to prevent bugs, or just don't throttle
      if (deltaTime < 10) return;
      lastTime = currentTime;

      // Update Parallax
      let targetParallaxX = 0;
      let targetParallaxY = 0;
      if (mouse.x !== -1000) {
        targetParallaxX = (window.innerWidth / 2 - mouse.x) * 0.02;
        targetParallaxY = (window.innerHeight / 2 - mouse.y) * 0.02;
      }
      parallaxX += (targetParallaxX - parallaxX) * 0.05;
      parallaxY += (targetParallaxY - parallaxY) * 0.05;

      // Clear physical buffer reliably
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      ctx.save();
      ctx.translate(parallaxX, parallaxY);

      for (let i = 0; i < particles.length; i++) {
        particles[i].draw();
        particles[i].update(window.innerWidth, window.innerHeight);
      }
      
      for (let i = 0; i < formulas.length; i++) {
        formulas[i].update();
        formulas[i].draw();
        if (formulas[i].life > formulas[i].maxLife) {
          formulas[i] = new Formula(window.innerWidth, window.innerHeight);
        }
      }

      if (!reduced) {
        for (let i = 0; i < comets.length; i++) {
          comets[i].update(window.innerWidth, window.innerHeight);
          comets[i].draw();
        }
      }
      
      ctx.restore();
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0"
    />
  );
};

export default StarField;
