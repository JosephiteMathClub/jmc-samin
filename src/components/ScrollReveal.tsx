"use client";
import React from 'react';
import { motion } from 'framer-motion';

import { usePerformance } from '../hooks/usePerformance';

interface ScrollRevealProps {
  children: React.ReactNode;
  width?: "fit-content" | "100%";
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  distance?: number;
  duration?: number;
  className?: string;
}

const ScrollReveal: React.FC<ScrollRevealProps> = ({ 
  children, 
  width = "100%", 
  delay = 0,
  direction = "up",
  distance = 50,
  duration = 0.8,
  className = ""
}) => {
  const { shouldReduceGfx } = usePerformance();

  if (shouldReduceGfx) {
    return <div style={{ position: "relative", width }} className={className}>{children}</div>;
  }

  const getInitialProps = () => {
    switch (direction) {
      case "up": return { y: distance, opacity: 0 };
      case "down": return { y: -distance, opacity: 0 };
      case "left": return { x: distance, opacity: 0 };
      case "right": return { x: -distance, opacity: 0 };
      default: return { y: distance, opacity: 0 };
    }
  };

  return (
    <div style={{ position: "relative", width, overflow: "visible" }} className={className}>
      <motion.div
        variants={{
          hidden: getInitialProps(),
          visible: { x: 0, y: 0, opacity: 1 },
        }}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        style={{ willChange: "transform, opacity" }}
        transition={{ 
          duration, 
          delay, 
          ease: [0.22, 1, 0.36, 1] // Custom cubic-bezier for smooth reveal
        }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default ScrollReveal;
