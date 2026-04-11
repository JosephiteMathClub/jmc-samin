"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import { usePerformance } from '../hooks/usePerformance';

interface TypewriterTextProps {
  texts: string[];
  delay?: number;
  speed?: number;
  deleteSpeed?: number;
  className?: string;
  cursorClassName?: string;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({ 
  texts, 
  delay = 2000, 
  speed = 80,
  deleteSpeed = 40,
  className = "",
  cursorClassName = ""
}) => {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);
  const { shouldReduceGfx } = usePerformance();

  // Typewriter effect logic
  useEffect(() => {
    if (shouldReduceGfx || index === texts.length) return;

    if (subIndex === texts[index].length + 1 && !reverse) {
      const timeout = setTimeout(() => setReverse(true), delay);
      return () => clearTimeout(timeout);
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % texts.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? deleteSpeed : speed + Math.random() * 40); // Randomness for human feel

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, texts, delay, speed, deleteSpeed, shouldReduceGfx]);

  // Cursor blink logic
  useEffect(() => {
    if (shouldReduceGfx) return;
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink, shouldReduceGfx]);

  if (shouldReduceGfx) {
    return <span className={className}>{texts[0]}</span>;
  }

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span className="relative">
        {texts[index].substring(0, subIndex)}
        <motion.span
          initial={{ opacity: 1 }}
          animate={{ opacity: blink ? 1 : 0 }}
          transition={{ duration: 0.1 }}
          className={`inline-block w-[3px] h-[1.2em] bg-amber-500 ml-1 align-middle shadow-[0_0_8px_rgba(245,158,11,0.5)] ${cursorClassName}`}
        />
      </span>
    </span>
  );
};

export default TypewriterText;
