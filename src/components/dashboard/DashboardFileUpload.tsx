"use client";
import React from 'react';
import Image from 'next/image';
import { 
  Upload, 
  Trash2, 
  Image as ImageIcon, 
  FileText, 
  Loader2, 
  Link as LinkIcon,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePerformance } from '../../hooks/usePerformance';
import { resolveImageUrl } from '../../lib/utils';

interface DashboardFileUploadProps {
  path?: (string | number)[];
  value: string;
  label?: string;
  uploading?: boolean;
  onUpload?: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[]) => void;
  onDelete?: (path?: (string | number)[]) => void;
  onChange?: (path: (string | number)[], value: string) => void;
  onValueChange?: (value: string) => void;
  accept?: string;
  description?: string;
}

export const DashboardFileUpload: React.FC<DashboardFileUploadProps> = ({ 
  path = [], 
  value, 
  label, 
  uploading = false, 
  onUpload, 
  onDelete, 
  onChange,
  onValueChange,
  accept = ".jpg,.jpeg,.png",
  description
}) => {
  const { shouldReduceGfx } = usePerformance();
  const isPdf = value?.toLowerCase().endsWith('.pdf');
  const fileName = value ? value.split('/').pop() : null;

  return (
    <div className="space-y-3">
      {label && (
        <div className="flex flex-col">
          <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
            {label}
          </label>
          {description && (
            <p className="text-[10px] text-zinc-600 font-medium leading-relaxed mt-1">
              {description}
            </p>
          )}
        </div>
      )}
      
      <div className="flex flex-col gap-4 p-6 bg-white/[0.02] border border-white/5 rounded-3xl group hover:border-amber-500/20 transition-all duration-300">
        <div className="flex items-center gap-6">
          {/* Preview Area */}
          <div className="relative h-20 w-20 rounded-2xl overflow-hidden bg-zinc-900 flex-shrink-0 border border-white/5 shadow-inner">
            <AnimatePresence mode="wait">
              {value ? (
                <motion.div
                  key="preview"
                  initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, scale: 1 }}
                  exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
                  className="h-full w-full"
                >
                  {isPdf ? (
                    <div className="h-full w-full flex items-center justify-center bg-red-500/10">
                      <FileText className="w-8 h-8 text-red-500" />
                    </div>
                  ) : (
                    <Image 
                      src={resolveImageUrl(value)} 
                      alt="Preview" 
                      fill
                      className="object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="placeholder"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full w-full flex items-center justify-center"
                >
                  <ImageIcon className="w-8 h-8 text-zinc-800" />
                </motion.div>
              )}
            </AnimatePresence>
            
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                <Loader2 className={`w-6 h-6 text-amber-500 ${shouldReduceGfx ? '' : 'animate-spin'}`} />
              </div>
            )}
          </div>
          
          {/* Info & Actions */}
          <div className="flex-grow min-w-0 space-y-1">
            <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em]">
              {value ? (isPdf ? 'PDF Document' : 'Image Asset') : 'No File Selected'}
            </div>
            <div className="text-[10px] text-zinc-600 truncate font-mono bg-black/20 px-2 py-1 rounded-md inline-block max-w-full">
              {fileName || `Recommended: ${accept.includes('pdf') ? 'Images or PDF' : '800x1000px'}`}
            </div>
            
            <div className="flex gap-2 pt-2">
              <label className="cursor-pointer h-9 px-4 bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-wider border border-amber-500/10">
                <Upload className="w-3.5 h-3.5" />
                {value ? 'Replace' : 'Upload'}
                <input 
                  type="file" 
                  className="hidden" 
                  accept={accept}
                  onChange={(e) => onUpload?.(e, path)}
                />
              </label>
              
              {value && (
                <button
                  onClick={() => onDelete?.(path)}
                  className="w-9 h-9 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl transition-all flex items-center justify-center border border-red-500/10"
                  title="Remove File"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Manual URL Input */}
        <div className="pt-5 border-t border-white/5">
          <div className="flex items-center gap-2 mb-2 px-1">
            <LinkIcon className="w-3 h-3 text-zinc-600" />
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Direct URL Path</span>
          </div>
          <div className="relative">
            <input
              type="text"
              value={value || ''}
              onChange={(e) => {
                onChange?.(path, e.target.value);
                onValueChange?.(e.target.value);
              }}
              placeholder="e.g. /api/local-images/photo.jpg"
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-[11px] outline-none focus:border-amber-500/50 transition-all font-mono placeholder:text-zinc-700"
            />
            {value && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/50" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
