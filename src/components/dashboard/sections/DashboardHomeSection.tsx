"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Zap, Users, Trash2, Plus } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardHomeSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
}

const DashboardHomeSectionComponent: React.FC<DashboardHomeSectionProps> = ({
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
      <DashboardSection icon={LayoutDashboard} title="Hero Section" description="The first thing visitors see on your homepage.">
        <div className="grid grid-cols-1 gap-6">
          <DashboardFormField 
            label="Hero Title" 
            value={data?.heroTitle} 
            onChange={(val) => updateField('heroTitle', val)} 
          />
          <DashboardFormField 
            label="Hero Subtitle" 
            type="textarea"
            value={data?.heroSubtitle} 
            onChange={(val) => updateField('heroSubtitle', val)} 
          />
          <DashboardFormField 
            label="Hero Tagline" 
            value={data?.heroTagline} 
            onChange={(val) => updateField('heroTagline', val)} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Join Button Text" 
              value={data?.joinButtonText} 
              onChange={(val) => updateField('joinButtonText', val)} 
            />
            <DashboardFormField 
              label="Story Button Text" 
              value={data?.storyButtonText} 
              onChange={(val) => updateField('storyButtonText', val)} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Memories Title" 
              value={data?.memoriesTitle} 
              onChange={(val) => updateField('memoriesTitle', val)} 
            />
            <DashboardFormField 
              label="Memories Tagline" 
              value={data?.memoriesTagline} 
              onChange={(val) => updateField('memoriesTagline', val)} 
            />
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Hero Subtitles (Typewriter)</h4>
            <div className="space-y-3">
              {(data?.heroSubtitles || []).map((text: string, i: number) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1">
                    <DashboardFormField 
                      label={`Subtitle ${i + 1}`} 
                      value={text} 
                      onChange={(val) => {
                        const newList = [...data.heroSubtitles];
                        newList[i] = val;
                        updateField('heroSubtitles', newList);
                      }} 
                    />
                  </div>
                  <button 
                    onClick={() => {
                      const newList = data.heroSubtitles.filter((_: any, idx: number) => idx !== i);
                      updateField('heroSubtitles', newList);
                    }}
                    className="mt-8 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button 
                onClick={() => {
                  const newList = [...(data?.heroSubtitles || []), ""];
                  updateField('heroSubtitles', newList);
                }}
                className="w-full py-2 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-3 h-3" /> Add Subtitle
              </button>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-white/5">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gallery Images</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.gallery || []).map((url: string, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                  <button 
                    onClick={() => {
                       const newList = data.gallery.filter((_: any, idx: number) => idx !== i);
                       updateField('gallery', newList);
                    }}
                    className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <DashboardFileUpload 
                    label={`Image ${i + 1}`} 
                    value={url} 
                    uploading={uploading === `home-gallery-${i}`}
                    onUpload={(e) => handleFileUpload(e, [`home`, `gallery`, i], (newUrl) => {
                      const newList = [...data.gallery];
                      newList[i] = newUrl;
                      updateField('gallery', newList);
                    })} 
                  />
                </div>
              ))}
              <button 
                onClick={() => {
                  const newList = [...(data?.gallery || []), ""];
                  updateField('gallery', newList);
                }}
                className="w-full py-8 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Image
              </button>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={Zap} title="Club Agenda" description="Define the club's mission and regular activities.">
        <div className="grid grid-cols-1 gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Agenda Title" 
              value={data?.agendaTitle} 
              onChange={(val) => updateField('agendaTitle', val)} 
            />
            <DashboardFormField 
              label="Agenda Tagline" 
              value={data?.agendaTagline} 
              onChange={(val) => updateField('agendaTagline', val)} 
            />
          </div>
          <DashboardFormField 
            label="Agenda Description" 
            type="textarea"
            value={data?.agendaDescription} 
            onChange={(val) => updateField('agendaDescription', val)} 
          />
          
          <div className="space-y-4">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Agenda Items</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(data?.agendaItems || []).map((item: any, i: number) => (
                <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                  <button 
                    onClick={() => removeListItem('agendaItems', i)}
                    className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                  <div className="grid grid-cols-1 gap-3">
                    <DashboardFormField label="Title" value={item.title} onChange={(val) => updateListItem('agendaItems', i, { title: val })} />
                    <DashboardFormField 
                      label="Icon" 
                      type="select" 
                      value={item.icon} 
                      onChange={(val) => updateListItem('agendaItems', i, { icon: val })}
                      options={[
                        { value: 'Zap', label: 'Zap' },
                        { value: 'Trophy', label: 'Trophy' },
                        { value: 'Star', label: 'Star' },
                        { value: 'Lightbulb', label: 'Lightbulb' },
                        { value: 'Users', label: 'Users' },
                        { value: 'Award', label: 'Award' },
                        { value: 'BookOpen', label: 'BookOpen' }
                      ]}
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => addListItem('agendaItems', { title: 'New Item', icon: 'Zap' })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>
          </div>
        </div>
      </DashboardSection>

      <DashboardSection icon={Users} title="Testimonials" description="Manage the quotes from club leadership.">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Section Title" 
              value={data?.testimonialsTitle} 
              onChange={(val) => updateField('testimonialsTitle', val)} 
            />
            <DashboardFormField 
              label="Section Tagline" 
              value={data?.testimonialsTagline} 
              onChange={(val) => updateField('testimonialsTagline', val)} 
            />
          </div>
          <div className="grid grid-cols-1 gap-8">
            {data?.testimonials?.map((t: any, i: number) => (
              <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative group">
                <button 
                  onClick={() => removeListItem('testimonials', i)}
                  className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DashboardFormField label="Name" value={t.name} onChange={(val) => updateListItem('testimonials', i, { name: val })} />
                  <DashboardFormField label="Role" value={t.role} onChange={(val) => updateListItem('testimonials', i, { role: val })} />
                </div>
                <DashboardFormField label="Message" type="textarea" value={t.message} onChange={(val) => updateListItem('testimonials', i, { message: val })} />
                <DashboardFileUpload 
                  label="Profile Image" 
                  value={t.imageUrl} 
                  uploading={uploading === `home-testimonials-${i}`}
                  onUpload={(e) => handleFileUpload(e, [`home`, `testimonials`, i], (url) => updateListItem('testimonials', i, { imageUrl: url }))} 
                />
              </div>
            ))}
            <button 
              onClick={() => addListItem('testimonials', { name: '', role: '', message: '', imageUrl: '' })}
              className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
            >
              <Plus className="w-5 h-5" /> Add Testimonial
            </button>
          </div>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardHomeSection = React.memo(DashboardHomeSectionComponent);
DashboardHomeSection.displayName = 'DashboardHomeSection';
;
