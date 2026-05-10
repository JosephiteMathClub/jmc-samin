"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface RevealProps {
  children: React.ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  className?: string;
  triggerOnce?: boolean;
}

export const Reveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 1,
  className = "",
  triggerOnce = true,
}: RevealProps) => {
  const elementRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const getInitialProps = () => {
      switch (direction) {
        case "up": return { y: 60, opacity: 0 };
        case "down": return { y: -60, opacity: 0 };
        case "left": return { x: 60, opacity: 0 };
        case "right": return { x: -60, opacity: 0 };
        default: return { y: 60, opacity: 0 };
      }
    };

    gsap.fromTo(
      element,
      getInitialProps(),
      {
        x: 0,
        y: 0,
        opacity: 1,
        duration: duration,
        delay: delay,
        ease: "power3.out",
        scrollTrigger: {
          trigger: element,
          start: "top 85%",
          toggleActions: triggerOnce ? "play none none none" : "play none none reverse",
        },
      }
    );
  }, [direction, delay, duration, triggerOnce]);

  return (
    <div ref={elementRef} className={className} style={{ opacity: 0 }}>
      {children}
    </div>
  );
};
