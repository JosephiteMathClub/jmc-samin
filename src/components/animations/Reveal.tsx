"use client";

import { motion } from "framer-motion";

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
  const getInitialProps = () => {
    switch (direction) {
      case "up": return { y: 60, opacity: 0 };
      case "down": return { y: -60, opacity: 0 };
      case "left": return { x: 60, opacity: 0 };
      case "right": return { x: -60, opacity: 0 };
      default: return { y: 60, opacity: 0 };
    }
  };

  return (
    <motion.div
      initial={getInitialProps()}
      whileInView={{ x: 0, y: 0, opacity: 1 }}
      viewport={{ once: triggerOnce, margin: "-15%" }}
      transition={{
        duration: duration,
        delay: delay,
        ease: [0.16, 1, 0.3, 1], // Expo-out like
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
