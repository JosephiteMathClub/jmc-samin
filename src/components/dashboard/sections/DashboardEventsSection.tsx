"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trash2, Plus } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardEventsSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
}

const DashboardEventsSectionComponent: React.FC<DashboardEventsSectionProps> = ({
  data,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
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
      <DashboardSection icon={Calendar} title="Events Page Header" description="Customize the title and description of the Events page.">
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
                        { value: 'Calendar', label: 'Calendar' },
                        { value: 'Trophy', label: 'Trophy' },
                        { value: 'BookOpen', label: 'BookOpen' },
                        { value: 'Users', label: 'Users' },
                        { value: 'Star', label: 'Star' }
                      ]}
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addListItem('categories', { id: 'new', name: 'New Category', icon: 'Calendar' })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={Calendar} title="Manage Events" description="Add or edit club competitions and workshops.">
        <div className="grid grid-cols-1 gap-8">
          {(data?.events || []).map((e: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
              <button 
                onClick={() => removeListItem('events', i)}
                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Event Title" value={e.title} onChange={(val) => updateListItem('events', i, { title: val })} />
                <DashboardFormField label="Category" value={e.category} onChange={(val) => updateListItem('events', i, { category: val })} />
              </div>
              <DashboardFormField label="Description" type="textarea" value={e.description} onChange={(val) => updateListItem('events', i, { description: val })} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardFormField label="Date" value={e.date} onChange={(val) => updateListItem('events', i, { date: val })} />
                <DashboardFormField label="Time" value={e.time} onChange={(val) => updateListItem('events', i, { time: val })} />
                <DashboardFormField label="Location" value={e.location} onChange={(val) => updateListItem('events', i, { location: val })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DashboardFormField label="Button Text" value={e.buttonText} onChange={(val) => updateListItem('events', i, { buttonText: val })} />
                <DashboardFormField label="Registration Link" value={e.registrationLink} onChange={(val) => updateListItem('events', i, { registrationLink: val })} />
                <DashboardFormField 
                  label="Tag" 
                  type="select" 
                  value={e.tag} 
                  onChange={(val) => updateListItem('events', i, { tag: val })}
                  options={[
                    { value: 'general', label: 'General' },
                    { value: 'important', label: 'Important' },
                    { value: 'urgent', label: 'Urgent' },
                    { value: 'success', label: 'Success' }
                  ]}
                />
              </div>
              <DashboardFileUpload 
                label="Event Banner" 
                value={e.imageUrl} 
                uploading={uploading === `events-events-${i}`}
                onUpload={(ev) => handleFileUpload(ev, [`events`, `events`, i], (url) => updateListItem('events', i, { imageUrl: url }))} 
              />
            </div>
          ))}
          <button 
            onClick={() => addListItem('events', { title: 'New Event', category: 'Competition', description: '', date: '', time: '', location: '', imageUrl: '', buttonText: 'Register Now', registrationLink: '', tag: 'general' })}
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" /> Add New Event
          </button>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardEventsSection = React.memo(DashboardEventsSectionComponent);
DashboardEventsSection.displayName = 'DashboardEventsSection';
