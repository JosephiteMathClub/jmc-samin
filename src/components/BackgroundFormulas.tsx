"use client";
import React, { useEffect, useRef } from 'react';

const formulas = [
  "f(x) = x\u00B2",
  "\u03C0 \u2248 3.14159",
  "a\u00B2 + b\u00B2 = c\u00B2",
  "e = mc\u00B2",
  "e^i\u03C0 + 1 = 0",
  "sin\u00B2\u03B8 + cos\u00B2\u03B8 = 1",
  "d/dx(ln x) = 1/x",
  "\u222B x dx = x\u00B2/2 + C",
  "lim x\u21920 (sin x / x) = 1",
  "JMC \u2665 Math",
  "Keep Solving!",
  "1 + 1 = 2",
  "i\u00B2 = -1",
  "y = mx + c",
  "\u03C6 \u2248 1.618",
  "log(10) = 1",
  "V = \u03C0r\u00B2h",
  "A = \u03C0r\u00B2",
  "n!",
  "\u221E",
  "\u2211"
];

class Formula {
  text: string;
  x: number;
  y: number;
  opacity: number;
  targetOpacity: number;
  fadeSpeed: number;
  fontSize: number;
  rotation: number;
  state: 'hidden' | 'fading-in' | 'visible' | 'fading-out';
  timer: number;
  width: number;
  height: number;

  constructor(width: number, height: number, ctx: CanvasRenderingContext2D, fontFamily: string) {
    this.text = formulas[Math.floor(Math.random() * formulas.length)];
    this.x = Math.random() * width;
    this.y = Math.random() * height;
    this.opacity = 0;
    this.targetOpacity = 0;
    this.fadeSpeed = 0.006 + Math.random() * 0.008; // Faster toggle
    this.fontSize = 14 + Math.random() * 14; 
    this.rotation = (Math.random() - 0.5) * 0.15; 
    this.state = 'hidden';
    this.timer = 0;
    this.width = 0;
    this.height = 0;
    this.calculateBounds(ctx, fontFamily);
  }

  calculateBounds(ctx: CanvasRenderingContext2D, fontFamily: string) {
    ctx.font = `${this.fontSize}px ${fontFamily}`;
    this.width = ctx.measureText(this.text).width;
    this.height = this.fontSize;
  }

  checkOverlap(others: Formula[]) {
    const margin = 20;
    const thisLeft = this.x;
    const thisRight = this.x + this.width;
    const thisTop = this.y - this.height;
    const thisBottom = this.y;

    for (const other of others) {
      if (other === this || other.state === 'hidden') continue;
      
      const otherLeft = other.x - margin;
      const otherRight = other.x + other.width + margin;
      const otherTop = other.y - other.height - margin;
      const otherBottom = other.y + margin;

      if (!(thisLeft > otherRight || 
            thisRight < otherLeft || 
            thisTop > otherBottom || 
            thisBottom < otherTop)) {
        return true;
      }
    }
    return false;
  }

  update(width: number, height: number, others: Formula[], ctx: CanvasRenderingContext2D, fontFamily: string) {
    if (this.state === 'hidden') {
      if (Math.random() < 0.02) { // Less frequent spawn
        for (let attempt = 0; attempt < 50; attempt++) { 
          this.x = Math.random() * (width - this.width - 100) + 50;
          this.y = Math.random() * (height - 150) + 100;
          if (!this.checkOverlap(others)) {
            this.state = 'fading-in';
            this.targetOpacity = 0.2 + Math.random() * 0.2; // Subtler
            break;
          }
        }
      }
    } else if (this.state === 'fading-in') {
      this.opacity += this.fadeSpeed;
      if (this.opacity >= this.targetOpacity) {
        this.opacity = this.targetOpacity;
        this.state = 'visible';
        this.timer = 40 + Math.random() * 80; // Shorter lifetime
      }
    } else if (this.state === 'visible') {
      this.timer--;
      if (this.timer <= 0) {
        this.state = 'fading-out';
      }
    } else if (this.state === 'fading-out') {
      this.opacity -= this.fadeSpeed;
      if (this.opacity <= 0) {
        this.opacity = 0;
        this.state = 'hidden';
        this.text = formulas[Math.floor(Math.random() * formulas.length)];
        this.calculateBounds(ctx, fontFamily);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, fontFamily: string) {
    if (this.opacity <= 0) return;

    // Safety check: if width is 0, recalc (might happen if fonts were delayed)
    if (this.width === 0) {
      this.calculateBounds(ctx, fontFamily);
    }

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity; 
    
    ctx.fillStyle = '#FBBC05'; // Golden Yellow
    ctx.font = `${this.fontSize}px ${fontFamily}`; // Removed bold for cleaner look
    ctx.textBaseline = 'middle';
    
    ctx.fillText(this.text, 0, 0);

    ctx.restore();
  }
}

interface BackgroundFormulasProps {
  reduced?: boolean;
}

const BackgroundFormulas: React.FC<BackgroundFormulasProps> = ({ reduced = false }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let formulaObjects: Formula[] = [];
    let cachedFontFamily = 'var(--font-handwritten)';
    let lastTime = 0;
    const isMobile = reduced || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const updateFont = () => {
      // Direct use of Caveat if standard check fails
      cachedFontFamily = 'Caveat, "Architects Daughter", cursive';
    };

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      updateFont();
      
      // Create a pool of formulas
      const count = reduced ? 15 : 30;
      formulaObjects = Array.from({ length: count }).map(() => new Formula(window.innerWidth, window.innerHeight, ctx, cachedFontFamily));
      
      // Pre-spawn some formulas
      const initialSpawnCount = reduced ? 2 : 5;
      for (let i = 0; i < initialSpawnCount; i++) {
        const f = formulaObjects[i];
        f.state = 'visible';
        f.opacity = 0.15 + Math.random() * 0.2;
        f.timer = 20 + Math.random() * 80;
        // Ensure they don't overlap too much initially by simple random spread
        f.x = Math.random() * (window.innerWidth - 100) + 50;
        f.y = Math.random() * (window.innerHeight - 150) + 100;
      }
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      updateFont();
    };

    window.addEventListener('resize', handleResize);
    init();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 32) return; // Throttled to ~30fps
      lastTime = currentTime;

      // Clear physical buffer reliably
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      
      formulaObjects.forEach(f => {
        f.update(window.innerWidth, window.innerHeight, formulaObjects, ctx, cachedFontFamily);
        f.draw(ctx, cachedFontFamily);
      });
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-20" // Higher z within the container
    />
  );
};

export default BackgroundFormulas;
