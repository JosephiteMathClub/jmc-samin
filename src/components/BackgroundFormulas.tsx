"use client";
import React, { useEffect, useRef } from 'react';

const formulas = [
  "\u222B e^x dx = e^x + C",
  "\u222B 1/x dx = ln|x| + C",
  "\u222B x^n dx = x^(n+1)/(n+1) + C",
  "\u222B sin x dx = -cos x + C",
  "\u222B cos x dx = sin x + C",
  "\u222B 1/(1+x^2) dx = arctan x + C",
  "\u222B u dv = uv - \u222B v du",
  "\u222B a^x dx = a^x/ln a + C",
  "\u222B sec^2 x dx = tan x + C",
  "\u222B csc^2 x dx = -cot x + C",
  "\u222B tan x dx = ln|sec x| + C",
  "\u03A3 n=1 to \u221E 1/n^2 = \u03C0^2/6",
  "e^i\u03C0 + 1 = 0",
  "lim n->\u221E (1+1/n)^n = e",
  "\u2207 \u00D7 E = -\u2202B/\u2202t",
  "\u222E B \u00B7 dl = \u03BC\u2080I"
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
    this.fadeSpeed = 0.01 + Math.random() * 0.02;
    this.fontSize = 20 + Math.random() * 30; // Much smaller, subtle size
    this.rotation = (Math.random() - 0.5) * 0.2;
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
    const margin = 30;
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
      if (Math.random() < 0.005) { // Reduced spawn rate check frequency
        for (let attempt = 0; attempt < 20; attempt++) { // Reduced attempts
          this.x = Math.random() * (width - this.width - 100) + 50;
          this.y = Math.random() * (height - 150) + 100;
          if (!this.checkOverlap(others)) {
            this.state = 'fading-in';
            this.targetOpacity = 0.2 + Math.random() * 0.2;
            break;
          }
        }
      }
    } else if (this.state === 'fading-in') {
      this.opacity += this.fadeSpeed;
      if (this.opacity >= this.targetOpacity) {
        this.opacity = this.targetOpacity;
        this.state = 'visible';
        this.timer = 50 + Math.random() * 100;
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

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.globalAlpha = this.opacity; // Subtle visibility
    ctx.fillStyle = '#F59E0B'; // Amber-500
    ctx.font = `${this.fontSize}px ${fontFamily}`;
    
    // Removed expensive shadowBlur for performance
    
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
    let cachedFontFamily = 'Caveat, cursive';
    let lastTime = 0;
    const isMobile = reduced || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    const updateFont = () => {
      cachedFontFamily = getComputedStyle(document.body).getPropertyValue('--font-handwritten') || 'Caveat, cursive';
    };

    const init = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      updateFont();
      
      // Create a pool of formulas - reduced count on mobile
      const count = isMobile ? 6 : 12;
      formulaObjects = Array.from({ length: count }).map(() => new Formula(window.innerWidth, window.innerHeight, ctx, cachedFontFamily));
    };

    const handleResize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      ctx.scale(dpr, dpr);
      updateFont();
      
      // Re-init positions on resize
      formulaObjects.forEach(f => {
        f.x = Math.random() * window.innerWidth;
        f.y = Math.random() * window.innerHeight;
        f.calculateBounds(ctx, cachedFontFamily);
      });
    };

    window.addEventListener('resize', handleResize);
    init();

    const animate = (currentTime: number) => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Throttle to ~30fps for background elements
      const deltaTime = currentTime - lastTime;
      if (deltaTime < 32) return; 
      lastTime = currentTime;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      formulaObjects.forEach(f => {
        f.update(window.innerWidth, window.innerHeight, formulaObjects, ctx, cachedFontFamily);
        f.draw(ctx, cachedFontFamily);
      });
    };

    requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [reduced]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none -z-10"
    />
  );
};

export default BackgroundFormulas;
