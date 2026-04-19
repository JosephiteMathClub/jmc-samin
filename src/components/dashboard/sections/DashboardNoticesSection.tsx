"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Trash2, Plus, Info, AlertTriangle, CheckCircle, Star } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';

interface DashboardNoticesSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  shouldReduceGfx: boolean;
}

const DashboardNoticesSectionComponent: React.FC<DashboardNoticesSectionProps> = ({
  data,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
  shouldReduceGfx
}) => {
  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection icon={Bell} title="Notice Board Header" description="Customize the title and description of the Notice Board page.">
        <div className="grid grid-cols-1 gap-6">
          <DashboardFormField 
            label="Page Title" 
            value={data?.title} 
            onChange={(val) => updateField('title', val)} 
          />
          <DashboardFormField 
            label="Page Subtitle" 
            value={data?.subtitle} 
            onChange={(val) => updateField('subtitle', val)} 
          />
          <DashboardFormField 
            label="Page Description" 
            type="textarea"
            value={data?.description} 
            onChange={(val) => updateField('description', val)} 
          />
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Categories</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.categories || []).map((cat: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                  <button 
                    onClick={() => removeListItem('categories', i)}
                    className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="grid grid-cols-1 gap-3">
                    <DashboardFormField label="ID" value={cat.id} onChange={(val) => updateListItem('categories', i, { id: val })} />
                    <DashboardFormField label="Name" value={cat.name} onChange={(val) => updateListItem('categories', i, { name: val })} />
                    <DashboardFormField 
                      label="Icon" 
                      type="select" 
                      value={cat.icon} 
                      onChange={(val) => updateListItem('categories', i, { icon: val })}
                      options={[
                        { value: 'Bell', label: 'Bell' },
                        { value: 'Info', label: 'Info' },
                        { value: 'AlertTriangle', label: 'Alert' },
                        { value: 'CheckCircle', label: 'Success' },
                        { value: 'Star', label: 'Star' }
                      ]}
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addListItem('categories', { id: 'new', name: 'New Category', icon: 'Bell' })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={Bell} title="Manage Notices" description="Post important announcements and updates.">
        <div className="grid grid-cols-1 gap-8">
          {(data?.notices || []).map((n: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
              <button 
                onClick={() => removeListItem('notices', i)}
                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Notice Title" value={n.title} onChange={(val) => updateListItem('notices', i, { title: val })} />
                <DashboardFormField label="Type" value={n.type} onChange={(val) => updateListItem('notices', i, { type: val })} />
              </div>
              <DashboardFormField label="Content" type="textarea" value={n.content} onChange={(val) => updateListItem('notices', i, { content: val })} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Date" value={n.date} onChange={(val) => updateListItem('notices', i, { date: val })} />
                <DashboardFormField label="Link (Optional)" value={n.link} onChange={(val) => updateListItem('notices', i, { link: val })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Link Text" value={n.linkText} onChange={(val) => updateListItem('notices', i, { linkText: val })} />
                <DashboardFormField 
                  label="Tag" 
                  type="select" 
                  value={n.tag} 
                  onChange={(val) => updateListItem('notices', i, { tag: val })}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'important', label: 'Important' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'success', label: 'Success' }
                  ]}
                />
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id={`pin-${i}`}
                  checked={n.isPinned} 
                  onChange={(e) => updateListItem('notices', i, { isPinned: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-white/5 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor={`pin-${i}`} className="text-sm font-bold text-zinc-400">Pin to top</label>
              </div>
            </div>
          ))}
          <button 
            onClick={() => addListItem('notices', { title: 'New Notice', type: 'General', content: '', date: new Date().toLocaleDateString(), isPinned: false, link: '', linkText: 'View Details', tag: 'general' })}
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" /> Add New Notice
          </button>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardNoticesSection = React.memo(DashboardNoticesSectionComponent);
DashboardNoticesSection.displayName = 'DashboardNoticesSection';
