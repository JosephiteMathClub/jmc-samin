"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { usePerformance } from '../../hooks/usePerformance';

interface DashboardButtonProps {
  onClick: (e: React.MouseEvent) => void;
  icon?: LucideIcon;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  loading?: boolean;
}

export const DashboardButton: React.FC<DashboardButtonProps> = ({ 
  onClick, 
  icon: Icon, 
  label, 
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  loading = false
}) => {
  const { shouldReduceGfx } = usePerformance();

  const variants = {
    primary: 'bg-gradient-to-b from-[#00B4DB] to-[#162E65] text-white shadow-lg shadow-[#00B4DB]/20 border border-white/10',
    secondary: 'bg-white/5 text-white hover:bg-white/10 border border-white/5',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10',
    ghost: 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/5',
    outline: 'bg-transparent text-white border border-white/20 hover:border-white/40 hover:bg-white/5'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-[10px]',
    md: 'px-5 py-2.5 text-[11px]',
    lg: 'px-8 py-4 text-sm'
  };

  return (
    <motion.button
      whileHover={shouldReduceGfx || disabled || loading ? {} : { scale: 1.02 }}
      whileTap={shouldReduceGfx || disabled || loading ? {} : { scale: 0.98 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        flex items-center justify-center gap-2 rounded-xl font-bold uppercase tracking-widest transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      ) : (
        Icon && <Icon className={`${size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'}`} />
      )}
      {label}
    </motion.button>
  );
};
