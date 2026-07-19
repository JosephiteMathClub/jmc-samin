"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Plus, Calendar, HelpCircle } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardHandoutsSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  shouldReduceGfx: boolean;
  uploading?: string | null;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
}

export const DashboardHandoutsSection: React.FC<DashboardHandoutsSectionProps> = ({
  data,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
  shouldReduceGfx,
  uploading,
  handleFileUpload
}) => {
  // Ensure we have a default structure
  const sessions = data?.sessions || [];

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection icon={FileText} title="Session Handouts Header" description="Customize the title and description of the Session Handouts subtab for members.">
        <div className="grid grid-cols-1 gap-6">
          <DashboardFormField 
            label="Page Title" 
            value={data?.title || 'Session Handouts'} 
            onChange={(val) => updateField('title', val)} 
          />
          <DashboardFormField 
            label="Page Description" 
            type="textarea"
            value={data?.description || 'Access official handouts, session notes, and resources compiled by the club moderators.'} 
            onChange={(val) => updateField('description', val)} 
          />
        </div>
      </DashboardSection>

      <DashboardSection icon={FileText} title="Manage Handouts" description="Add or update session handouts. Files can be PDFs or images.">
        <div className="grid grid-cols-1 gap-8">
          {sessions.map((session: any, i: number) => (
            <div key={session.id || i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6 relative">
              <button 
                onClick={() => removeListItem('sessions', i)}
                className="absolute top-4 right-4 z-30 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all hover:scale-110"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              
              <div className="flex flex-col lg:flex-row gap-8 items-start relative">
                {handleFileUpload && (
                  <div className="w-full lg:w-80 lg:sticky lg:top-8 z-20">
                    <DashboardFileUpload 
                      label="Official Handout Document"
                      value={session.fileUrl || ''}
                      uploading={uploading === `handouts-sessions-${i}-file`}
                      onUpload={(ev) => handleFileUpload(ev, ['handouts', 'sessions', i, 'file'], (url) => updateListItem('sessions', i, { fileUrl: url }))}
                      onDelete={() => updateListItem('sessions', i, { fileUrl: '' })}
                      onChange={(_, val) => updateListItem('sessions', i, { fileUrl: val })}
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      description="Upload a PDF or an image containing the session handouts."
                    />
                  </div>
                )}
                
                <div className="flex-grow w-full space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DashboardFormField 
                      label="Session Name / Topic" 
                      value={session.name || ''} 
                      onChange={(val) => updateListItem('sessions', i, { name: val })} 
                      placeholder="e.g. Day One or Intro to Modular Arithmetic"
                    />
                    <DashboardFormField 
                      label="Session Date (Optional)" 
                      value={session.date || ''} 
                      onChange={(val) => updateListItem('sessions', i, { date: val })} 
                      placeholder="e.g. July 19, 2026"
                    />
                  </div>
                  
                  <DashboardFormField 
                    label="Description" 
                    type="textarea" 
                    value={session.description || ''} 
                    onChange={(val) => updateListItem('sessions', i, { description: val })} 
                    placeholder="Provide a small description of the session topics and instructions."
                  />
                </div>
              </div>
            </div>
          ))}

          <button 
            onClick={() => addListItem('sessions', { 
              id: `session-${Date.now()}`,
              name: 'Day One', 
              description: 'This is the description for the session handout.', 
              fileUrl: '', 
              date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
            })}
            className="w-full py-5 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest"
          >
            <Plus className="w-4 h-4" /> Add Session Handout
          </button>
        </div>
      </DashboardSection>
    </motion.div>
  );
};
