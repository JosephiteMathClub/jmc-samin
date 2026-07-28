"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Video, Plus, Trash2, Link as LinkIcon, Sparkles, Check, Upload, HelpCircle } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';
import { MathResource } from '@/data/resourcesData';

interface DashboardResourcesSectionProps {
  resources: MathResource[];
  updateResources: (newResources: MathResource[]) => void;
  shouldReduceGfx?: boolean;
  uploading?: string | null;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
}

export const DashboardResourcesSection: React.FC<DashboardResourcesSectionProps> = ({
  resources = [],
  updateResources,
  shouldReduceGfx = true,
  uploading,
  handleFileUpload
}) => {
  const [filterType, setFilterType] = useState<string>('All');

  const addResource = (type: 'PDF Document' | 'Video') => {
    const newId = `resource-${Date.now()}`;
    const newResource: MathResource = {
      id: newId,
      title: type === 'PDF Document' ? 'New Combinatorics PDF Handout' : 'New Combinatorics Video Lecture',
      url: '',
      category: 'Combinatorics',
      type: type,
      description: 'Comprehensive Combinatorics resource description outlining key problem-solving techniques.',
      source: 'Josephite Math Club Repository',
      featured: true,
      tags: [type === 'PDF Document' ? 'PDF' : 'Video', 'Mathematics', 'Olympiad'],
      teaches: [
        'Key learning outcome point 1',
        'Key learning outcome point 2'
      ]
    };
    updateResources([newResource, ...resources]);
  };

  const updateItem = (index: number, patch: Partial<MathResource>) => {
    const updated = [...resources];
    updated[index] = { ...updated[index], ...patch };
    updateResources(updated);
  };

  const removeItem = (index: number) => {
    const updated = resources.filter((_, i) => i !== index);
    updateResources(updated);
  };

  const filtered = resources.filter((item) => {
    if (filterType === 'All') return true;
    if (filterType === 'PDFs') return item.type === 'PDF Document';
    if (filterType === 'Videos') return item.type === 'Video';
    return true;
  });

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection 
        icon={FileText} 
        title="Super Admin Resource Control Panel" 
        description="Exclusive Super-Admin control to input, update, and upload PDF handouts and video links displayed on the Resources page."
      >
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-200">
          <div className="flex items-center gap-2 text-xs font-mono">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Super Admin Only Access: Total Resources ({resources.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => addResource('PDF Document')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-mono text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add PDF Document</span>
            </button>

            <button
              onClick={() => addResource('Video')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 font-mono text-xs font-bold transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Video Link</span>
            </button>
          </div>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2 pt-2">
          {['All', 'PDFs', 'Videos'].map((f) => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                filterType === f
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </DashboardSection>

      {/* List of editable resource cards */}
      <div className="space-y-6">
        {filtered.map((item, index) => {
          const originalIndex = resources.findIndex((r) => r.id === item.id);
          const isPdf = item.type === 'PDF Document';
          const isVideo = item.type === 'Video';

          return (
            <div 
              key={item.id || index}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-6 relative group"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <span className={`p-2 rounded-xl border ${
                    isPdf ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' : isVideo ? 'bg-sky-500/20 text-sky-400 border-sky-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  }`}>
                    {isPdf ? <FileText className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                  </span>
                  <div>
                    <h4 className="text-base font-bold text-white">{item.title || 'Untitled Resource'}</h4>
                    <span className="text-xs font-mono text-zinc-400">{item.type} • Category: {item.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => removeItem(originalIndex !== -1 ? originalIndex : index)}
                  className="p-2 text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
                  title="Delete Resource"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField
                  label="Title"
                  value={item.title || ''}
                  onChange={(val) => updateItem(originalIndex, { title: val })}
                  placeholder="e.g. Olympiad Geometry Handout 2026"
                />

                <DashboardFormField
                  label="Category"
                  value={item.category || ''}
                  onChange={(val) => updateItem(originalIndex, { category: val })}
                  placeholder="e.g. PDF Handouts & Guides"
                />

                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">Resource Type</label>
                  <select
                    value={item.type}
                    onChange={(e) => updateItem(originalIndex, { type: e.target.value as any })}
                    className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-xs focus:border-amber-500 focus:outline-none"
                  >
                    <option value="PDF Document">PDF Document</option>
                    <option value="Video">Video</option>
                    <option value="Interactive App">Interactive App</option>
                    <option value="Guide / Article">Guide / Article</option>
                    <option value="Interactive Puzzle">Interactive Puzzle</option>
                  </select>
                </div>

                <DashboardFormField
                  label="Source / Publisher"
                  value={item.source || ''}
                  onChange={(val) => updateItem(originalIndex, { source: val })}
                  placeholder="e.g. Josephite Math Club Research Team"
                />
              </div>

              {/* URL or Upload PDF */}
              <div className="space-y-3">
                <DashboardFormField
                  label={isPdf ? "PDF Download / Drive / Direct Link" : "Video URL (YouTube or Vimeo)"}
                  value={item.url || ''}
                  onChange={(val) => updateItem(originalIndex, { url: val })}
                  placeholder={isPdf ? "https://.../handout.pdf" : "https://www.youtube.com/watch?v=..."}
                />

                {isPdf && handleFileUpload && (
                  <div className="pt-2">
                    <DashboardFileUpload
                      label="Upload PDF Document File Directly"
                      value={item.url || ''}
                      uploading={uploading === `resources-${index}`}
                      onUpload={(ev) => handleFileUpload(ev, ['resources', index], (url) => updateItem(originalIndex, { url }))}
                      onDelete={() => updateItem(originalIndex, { url: '' })}
                      onChange={(_, val) => updateItem(originalIndex, { url: val })}
                      accept=".pdf"
                      description="Directly upload a PDF document file to the club server storage."
                    />
                  </div>
                )}
              </div>

              <DashboardFormField
                label="Resource Description"
                type="textarea"
                value={item.description || ''}
                onChange={(val) => updateItem(originalIndex, { description: val })}
                placeholder="Describe what students will learn from this PDF or Video..."
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField
                  label="Teaches Points (Comma-separated)"
                  value={Array.isArray(item.teaches) ? item.teaches.join(', ') : item.teaches || ''}
                  onChange={(val) => updateItem(originalIndex, { teaches: val.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Invariant analysis, Circle theorems, Symmetry"
                />

                <DashboardFormField
                  label="Tags (Comma-separated)"
                  value={Array.isArray(item.tags) ? item.tags.join(', ') : item.tags || ''}
                  onChange={(val) => updateItem(originalIndex, { tags: val.split(',').map((s) => s.trim()).filter(Boolean) })}
                  placeholder="e.g. Geometry, Olympiad, Beginners"
                />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="p-8 text-center rounded-2xl bg-white/[0.02] border border-white/5 text-zinc-500 font-mono text-xs">
            No resources match the selected filter. Click 'Add PDF Document' or 'Add Video Link' above to add one.
          </div>
        )}
      </div>
    </motion.div>
  );
};
