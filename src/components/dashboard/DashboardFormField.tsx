"use client";
import React from 'react';

interface DashboardFormFieldProps {
  label: string;
  description?: string;
  value?: string;
  onChange?: (val: string) => void;
  type?: 'text' | 'textarea' | 'number' | 'email' | 'url' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
  error?: string;
  children?: React.ReactNode;
}

export const DashboardFormField: React.FC<DashboardFormFieldProps> = ({ 
  label, 
  description, 
  value,
  onChange,
  type = 'text',
  options,
  placeholder,
  error,
  children
}) => (
  <div className="space-y-2 group">
    <div className="flex flex-col">
      <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest group-hover:text-amber-500 transition-colors">
        {label}
      </label>
      {description && (
        <p className="text-[10px] text-zinc-500 font-medium leading-relaxed mt-1">
          {description}
        </p>
      )}
    </div>
    <div className="relative">
      {children ? children : (
        type === 'textarea' ? (
          <textarea
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all min-h-[120px] resize-none"
          />
        ) : type === 'select' ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all appearance-none"
          >
            {options?.map((opt) => (
              <option key={opt.value} value={opt.value} className="bg-[#080808] text-white">
                {opt.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
          />
        )
      )}
      {error && (
        <p className="text-[10px] text-red-500 font-bold mt-1 uppercase tracking-wider">
          {error}
        </p>
      )}
    </div>
  </div>
);
