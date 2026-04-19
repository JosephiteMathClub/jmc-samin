"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trash2, Plus } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardGallerySectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
}

const DashboardGallerySectionComponent: React.FC<DashboardGallerySectionProps> = ({
  data,
  updateField,
  uploading,
  handleFileUpload,
  shouldReduceGfx
}) => {
  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection icon={LayoutDashboard} title="Gallery Page Management" description="Manage the images displayed on the dedicated Gallery page.">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data?.images || []).map((url: string, i: number) => (
            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
              <button 
                onClick={() => {
                  const newList = data.images.filter((_: any, idx: number) => idx !== i);
                  updateField('images', newList);
                }}
                className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-3 h-3" />
              </button>
              <DashboardFileUpload 
                label={`Gallery Image ${i + 1}`} 
                value={url} 
                uploading={uploading === `gallery_page-images-${i}`}
                onUpload={(ev) => handleFileUpload(ev, [`gallery_page`, `images`, i], (newUrl) => {
                  const newList = [...data.images];
                  newList[i] = newUrl;
                  updateField('images', newList);
                })} 
                onDelete={() => {
                  const newList = [...data.images];
                  newList[i] = '';
                  updateField('images', newList);
                }}
              />
            </div>
          ))}
          <button 
            onClick={() => {
              const newList = [...(data?.images || []), ""];
              updateField('images', newList);
            }}
            className="w-full py-12 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
          >
            <Plus className="w-5 h-5" /> Add Image to Gallery
          </button>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardGallerySection = React.memo(DashboardGallerySectionComponent);
DashboardGallerySection.displayName = 'DashboardGallerySection';
