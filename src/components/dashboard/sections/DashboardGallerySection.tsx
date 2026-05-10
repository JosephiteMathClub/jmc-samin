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
      <DashboardSection icon={LayoutDashboard} title="Gallery Archive" description="Manage the high-resolution images displayed on the dedicated Gallery page.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {(data?.images || []).map((item: any, i: number) => {
              const url = typeof item === 'string' ? item : item.url;
              return (
                <div key={item.id || i} className="group relative flex flex-col gap-3">
                  <DashboardFileUpload 
                    value={url} 
                    uploading={uploading === `gallery_page-images-${i}`}
                    onUpload={(ev) => handleFileUpload(ev, [`gallery_page`, `images`, i], (newUrl) => {
                      const newList = [...data.images];
                      if (typeof newList[i] === 'string') {
                        newList[i] = { url: newUrl, title: '', description: '', category: '' };
                      } else {
                        newList[i] = { ...newList[i], url: newUrl };
                      }
                      updateField('images', newList);
                    })} 
                    onDelete={() => {
                      const newList = [...data.images];
                      if (typeof newList[i] === 'string') newList[i] = '';
                      else newList[i] = { ...newList[i], url: '' };
                      updateField('images', newList);
                    }}
                    onChange={(_, val) => {
                       const newList = [...data.images];
                       if (typeof newList[i] === 'string') newList[i] = val;
                       else newList[i] = { ...newList[i], url: val };
                       updateField('images', newList);
                    }}
                  />
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      placeholder="Title"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                      value={typeof item === 'string' ? '' : item.title || ''}
                      onChange={(e) => {
                        const newList = [...data.images];
                        if (typeof newList[i] === 'string') newList[i] = { url: newList[i], title: e.target.value };
                        else newList[i] = { ...newList[i], title: e.target.value };
                        updateField('images', newList);
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Category"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500/50 outline-none"
                      value={typeof item === 'string' ? '' : item.category || ''}
                      onChange={(e) => {
                        const newList = [...data.images];
                        if (typeof newList[i] === 'string') newList[i] = { url: newList[i], category: e.target.value };
                        else newList[i] = { ...newList[i], category: e.target.value };
                        updateField('images', newList);
                      }}
                    />
                    <textarea
                      placeholder="Description"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-amber-500/50 outline-none h-20 resize-none"
                      value={typeof item === 'string' ? '' : item.description || ''}
                      onChange={(e) => {
                        const newList = [...data.images];
                        if (typeof newList[i] === 'string') newList[i] = { url: newList[i], description: e.target.value };
                        else newList[i] = { ...newList[i], description: e.target.value };
                        updateField('images', newList);
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newList = data.images.filter((_: any, idx: number) => idx !== i);
                      updateField('images', newList);
                    }}
                    className="absolute -top-3 -right-3 z-20 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all shadow-lg scale-90 group-hover:scale-100 border-2 border-black"
                    title="Remove Entire Entry"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
            
            <button 
              onClick={() => {
                const newList = [...(data?.images || []), { id: `gallery-new-${Date.now()}`, url: "", title: "", description: "", category: "EVENT" }];
                updateField('images', newList);
              }}
            className="mt-3 min-h-[250px] w-full border-2 border-dashed border-white/10 rounded-3xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex flex-col items-center justify-center gap-3 font-bold text-[10px] uppercase tracking-widest bg-white/[0.01]"
          >
            <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Plus className="w-6 h-6 text-amber-500" />
            </div>
            <span>Deploy New Asset</span>
          </button>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardGallerySection = React.memo(DashboardGallerySectionComponent);
DashboardGallerySection.displayName = 'DashboardGallerySection';
