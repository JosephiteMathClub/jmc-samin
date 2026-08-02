"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Trash2, Plus, DollarSign, Layers, Clock, Sparkles, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardEventsSectionProps {
  data: any;
  registrationData?: any;
  interSegmentsData?: any[];
  festivalCalendarData?: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  
  updateRegistrationField?: (field: string, value: any) => void;
  updateInterSegments?: (newSegments: any[]) => void;
  updateFestivalCalendar?: (newCal: any) => void;

  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
}

const ICON_OPTIONS = [
  { value: 'Trophy', label: 'Trophy' },
  { value: 'Brain', label: 'Brain / IQ' },
  { value: 'Zap', label: 'Zap / Speed' },
  { value: 'Sparkles', label: 'Sparkles / Innovation' },
  { value: 'Compass', label: 'Compass / Geometry' },
  { value: 'Timer', label: 'Timer / Probability' },
  { value: 'Eye', label: 'Eye / Mystery' },
  { value: 'Lock', label: 'Lock / Cipher' },
  { value: 'HelpCircle', label: 'Help / Logic' },
  { value: 'Grid', label: 'Grid / Sudoku' },
  { value: 'Layers', label: 'Layers / Cube' },
  { value: 'Award', label: 'Award / Professor' },
  { value: 'Activity', label: 'Activity / Calculus' },
  { value: 'Users', label: 'Users / Escape Room' },
  { value: 'Smile', label: 'Smile / Memes' },
  { value: 'FileText', label: 'FileText / Article' },
  { value: 'ImageIcon', label: 'Image / Vision' },
  { value: 'Edit', label: 'Edit / Drawing' },
  { value: 'Construction', label: 'Construction / Truss' },
  { value: 'Layout', label: 'Layout / Wall Magazine' },
  { value: 'Calendar', label: 'Calendar' }
];

const DashboardEventsSectionComponent: React.FC<DashboardEventsSectionProps> = ({
  data,
  registrationData,
  interSegmentsData = [],
  festivalCalendarData,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
  updateRegistrationField,
  updateInterSegments,
  updateFestivalCalendar,
  uploading,
  handleFileUpload,
  shouldReduceGfx
}) => {
  const { isSuperAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'events' | 'registration' | 'segments' | 'calendar'>('segments');
  const [searchTerm, setSearchTerm] = useState('');

  // Local state for segments list if updateInterSegments is provided
  const segments = Array.isArray(interSegmentsData) && interSegmentsData.length > 0 
    ? interSegmentsData 
    : [];

  const handleSegmentChange = (index: number, key: string, val: any) => {
    if (!updateInterSegments) return;
    const updated = [...segments];
    updated[index] = { ...updated[index], [key]: val };
    updateInterSegments(updated);
  };

  const handleAddSegment = () => {
    if (!updateInterSegments) return;
    const newSeg = {
      id: `new-segment-${Date.now()}`,
      name: "New Event Segment",
      tagline: "Short tagline or snippet for segment card.",
      category: "Solo track",
      icon: "Trophy",
      isTeamEvent: false,
      teamSize: 1,
      isFree: false,
      bannerUrl: "",
      description: "Detailed breakdown of rulebook, prerequisites, and competition details."
    };
    updateInterSegments([...segments, newSeg]);
  };

  const handleRemoveSegment = (index: number) => {
    if (!updateInterSegments) return;
    const updated = segments.filter((_, i) => i !== index);
    updateInterSegments(updated);
  };

  const filteredSegments = segments.filter((s: any) => 
    (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      {/* Sub-tab Switcher for Events Management */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-black/60 border border-white/10 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveTab('segments')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'segments'
              ? 'bg-pink-600 text-white shadow-lg shadow-pink-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Layers className="w-4 h-4" /> Registration Event Segments ({segments.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('registration')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'registration'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <DollarSign className="w-4 h-4" /> Fees & Instructions
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'calendar'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" /> Festival Calendar Schedule
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
              : 'text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Calendar className="w-4 h-4" /> Club Events Page
        </button>
      </div>

      {/* 1. REGISTRATION EVENT SEGMENTS EDITOR */}
      {activeTab === 'segments' && (
        <DashboardSection 
          icon={Layers} 
          title="Inter-School Registration Segments (Editable to Single Detail)" 
          description="Customize segment titles, descriptions, banner images, taglines, free/paid status, team sizes, and icon styling."
        >
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/60 p-4 border border-white/10 rounded-2xl">
              <input
                type="text"
                placeholder="Search segments by name or track category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 px-4 py-2.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500"
              />
              <button
                type="button"
                onClick={handleAddSegment}
                className="w-full sm:w-auto px-5 py-2.5 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-pink-500/20"
              >
                <Plus className="w-4 h-4" /> Add New Segment
              </button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {filteredSegments.map((seg: any, idx: number) => {
                const originalIndex = segments.findIndex((s: any) => (s.id || s.name) === (seg.id || seg.name));
                const realIdx = originalIndex !== -1 ? originalIndex : idx;

                return (
                  <div key={realIdx} className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-6 relative group hover:border-pink-500/40 transition-all">
                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-400 font-mono font-bold text-xs flex items-center justify-center">
                          #{realIdx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-wider">{seg.name || "Untitled Segment"}</h4>
                          <span className="text-[10px] text-pink-400 font-mono font-bold uppercase">{seg.category || "Solo track"} • {seg.isFree ? "Free Entry" : "Paid Entry"}</span>
                        </div>
                      </div>

                      <button 
                        type="button"
                        onClick={() => handleRemoveSegment(realIdx)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                        title="Delete this segment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <DashboardFormField 
                        label="Segment Name" 
                        value={seg.name} 
                        onChange={(val) => handleSegmentChange(realIdx, 'name', val)} 
                      />
                      <DashboardFormField 
                        label="Track / Category" 
                        value={seg.category} 
                        onChange={(val) => handleSegmentChange(realIdx, 'category', val)} 
                      />
                      <DashboardFormField 
                        label="Card Icon" 
                        type="select" 
                        value={seg.icon || 'Trophy'} 
                        onChange={(val) => handleSegmentChange(realIdx, 'icon', val)} 
                        options={ICON_OPTIONS}
                      />
                    </div>

                    <DashboardFormField 
                      label="Card Tagline / Short Teaser" 
                      value={seg.tagline} 
                      onChange={(val) => handleSegmentChange(realIdx, 'tagline', val)} 
                    />

                    <DashboardFormField 
                      label="Detailed Rulebook & Segment Description" 
                      type="textarea" 
                      value={seg.description} 
                      onChange={(val) => handleSegmentChange(realIdx, 'description', val)} 
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <DashboardFormField 
                        label="Is Free Entry Segment?" 
                        type="select" 
                        value={seg.isFree ? 'yes' : 'no'} 
                        onChange={(val) => handleSegmentChange(realIdx, 'isFree', val === 'yes')} 
                        options={[{ value: 'no', label: 'No (Paid Entry)' }, { value: 'yes', label: 'Yes (Free Entry)' }]}
                      />

                      <DashboardFormField 
                        label="Is Team Event?" 
                        type="select" 
                        value={seg.isTeamEvent ? 'yes' : 'no'} 
                        onChange={(val) => handleSegmentChange(realIdx, 'isTeamEvent', val === 'yes')} 
                        options={[{ value: 'no', label: 'No (Individual Solo)' }, { value: 'yes', label: 'Yes (Team Competition)' }]}
                      />

                      {seg.isTeamEvent && (
                        <DashboardFormField 
                          label="Team Member Capacity" 
                          type="number" 
                          value={seg.teamSize || 3} 
                          onChange={(val) => handleSegmentChange(realIdx, 'teamSize', parseInt(val) || 1)} 
                        />
                      )}
                    </div>

                    <DashboardFileUpload 
                      label="Segment Banner Header Image" 
                      value={seg.bannerUrl} 
                      uploading={uploading === `interSegments-${realIdx}`}
                      onUpload={(ev) => handleFileUpload(ev, [`interSegments`, realIdx], (url) => handleSegmentChange(realIdx, 'bannerUrl', url))} 
                      onChange={(_, val) => handleSegmentChange(realIdx, 'bannerUrl', val)}
                      onDelete={() => handleSegmentChange(realIdx, 'bannerUrl', '')}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </DashboardSection>
      )}

      {/* 2. REGISTRATION FEES & PAYMENT INSTRUCTIONS */}
      {activeTab === 'registration' && (
        <DashboardSection 
          icon={DollarSign} 
          title="Registration Fees & Bkash Payment Instructions" 
          description="Configure fee amounts, bKash numbers, cash payment guidance, and toggle overall registration status."
        >
          <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardFormField 
                label="Registration Fee Amount (e.g. 200 BDT)" 
                value={registrationData?.fee} 
                onChange={(val) => updateRegistrationField && updateRegistrationField('fee', val)} 
              />
              <DashboardFormField 
                label="Official bKash Send Money Number" 
                value={registrationData?.bkashNumber} 
                onChange={(val) => updateRegistrationField && updateRegistrationField('bkashNumber', val)} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardFormField 
                label="Registration Form Status" 
                type="select" 
                value={registrationData?.registrationOpen ? 'open' : 'closed'} 
                onChange={(val) => updateRegistrationField && updateRegistrationField('registrationOpen', val === 'open')} 
                options={[{ value: 'open', label: 'Registration Open & Active' }, { value: 'closed', label: 'Registration Closed / Disabled' }]}
              />

              {!registrationData?.registrationOpen && (
                <DashboardFormField 
                  label="Registration Closed Notice Message" 
                  value={registrationData?.registrationClosedMessage} 
                  onChange={(val) => updateRegistrationField && updateRegistrationField('registrationClosedMessage', val)} 
                />
              )}
            </div>

            <DashboardFormField 
              label="Cash Payment Instructions" 
              type="textarea" 
              value={registrationData?.cashInstructions} 
              onChange={(val) => updateRegistrationField && updateRegistrationField('cashInstructions', val)} 
            />

            <DashboardFormField 
              label="Declaration & Terms Agreement Text" 
              type="textarea" 
              value={registrationData?.declaration} 
              onChange={(val) => updateRegistrationField && updateRegistrationField('declaration', val)} 
            />
          </div>
        </DashboardSection>
      )}

      {/* 3. FESTIVAL CALENDAR SCHEDULE */}
      {activeTab === 'calendar' && (
        <DashboardSection 
          icon={Clock} 
          title="Festival Calendar Schedule (24, 25 & 26 September Dates)" 
          description="Configure auto-calendar schedule dates, titles, venue location, and day-by-day event descriptions."
        >
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DashboardFormField 
                label="Festival Title" 
                value={festivalCalendarData?.title || "10th Josephite National Math Festival"} 
                onChange={(val) => updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, title: val })} 
              />
              <DashboardFormField 
                label="Primary Venue Location" 
                value={festivalCalendarData?.location || "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207"} 
                onChange={(val) => updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, location: val })} 
              />
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-indigo-400">Festival Days Schedule</h4>
              
              {(festivalCalendarData?.events || [
                { day: "Day 1", dateStr: "24 Sept 2026", isoDate: "2026-09-24", title: "10th Josephite National Math Festival - Day 1 (Solo Segments)", description: "Solo Math Olympiad, Speed Math, Rubik's Cube, Sudoku & IQ Test. Venue: St. Joseph Higher Secondary School campus.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" },
                { day: "Day 2", dateStr: "25 Sept 2026", isoDate: "2026-09-25", title: "10th Josephite National Math Festival - Day 2 (Team Mania & Workshops)", description: "Team Math Mania, Game of Games, Math Quiz, Escape Room & Interactive Math Workshops.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" },
                { day: "Day 3", dateStr: "26 Sept 2026", isoDate: "2026-09-26", title: "10th Josephite National Math Festival - Grand Finale & Awards", description: "Grand Finale, Exhibition, Closing Ceremony & Prize Distribution. St. Joseph Campus.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" }
              ]).map((ev: any, i: number) => (
                <div key={i} className="p-5 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <DashboardFormField 
                      label="Day Label" 
                      value={ev.day} 
                      onChange={(val) => {
                        const updated = [...(festivalCalendarData?.events || [])];
                        updated[i] = { ...updated[i], day: val };
                        updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, events: updated });
                      }} 
                    />
                    <DashboardFormField 
                      label="Date String (e.g. 24 Sept 2026)" 
                      value={ev.dateStr} 
                      onChange={(val) => {
                        const updated = [...(festivalCalendarData?.events || [])];
                        updated[i] = { ...updated[i], dateStr: val };
                        updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, events: updated });
                      }} 
                    />
                    <DashboardFormField 
                      label="ISO Date (e.g. 2026-09-24)" 
                      value={ev.isoDate} 
                      onChange={(val) => {
                        const updated = [...(festivalCalendarData?.events || [])];
                        updated[i] = { ...updated[i], isoDate: val };
                        updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, events: updated });
                      }} 
                    />
                  </div>

                  <DashboardFormField 
                    label="Day Event Title" 
                    value={ev.title} 
                    onChange={(val) => {
                      const updated = [...(festivalCalendarData?.events || [])];
                      updated[i] = { ...updated[i], title: val };
                      updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, events: updated });
                    }} 
                  />

                  <DashboardFormField 
                    label="Day Event Description" 
                    type="textarea"
                    value={ev.description} 
                    onChange={(val) => {
                      const updated = [...(festivalCalendarData?.events || [])];
                      updated[i] = { ...updated[i], description: val };
                      updateFestivalCalendar && updateFestivalCalendar({ ...festivalCalendarData, events: updated });
                    }} 
                  />
                </div>
              ))}
            </div>
          </div>
        </DashboardSection>
      )}

      {/* 4. CLUB EVENTS PAGE HEADER & COMPETITIONS */}
      {activeTab === 'events' && (
        <>
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
            </div>
          </DashboardSection>

          <DashboardSection icon={Calendar} title="Manage Intra-Club Events" description="Add or edit club competitions and workshops.">
            <div className="grid grid-cols-1 gap-8">
              {(data?.events || []).map((e: any, i: number) => (
                <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
                  <button 
                    onClick={() => removeListItem('events', i)}
                    className="absolute top-4 right-4 z-30 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all hover:scale-110"
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
                  <DashboardFileUpload 
                    label="Event Banner" 
                    value={e.imageUrl} 
                    uploading={uploading === `events-events-${i}`}
                    onUpload={(ev) => handleFileUpload(ev, [`events`, `events`, i], (url) => updateListItem('events', i, { imageUrl: url }))} 
                    onChange={(path, val) => updateListItem('events', i, { imageUrl: val })}
                    onDelete={() => updateListItem('events', i, { imageUrl: '' })}
                  />
                </div>
              ))}
              <button 
                onClick={() => addListItem('events', { title: 'New Event', category: 'Competition', description: '', date: '', time: '', location: '', imageUrl: '', buttonText: 'Register Now', registrationLink: '', tag: 'general', isTeamEvent: false, teamSize: 3 })}
                className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
              >
                <Plus className="w-5 h-5" /> Add New Event
              </button>
            </div>
          </DashboardSection>
        </>
      )}
    </motion.div>
  );
};

export const DashboardEventsSection = React.memo(DashboardEventsSectionComponent);
DashboardEventsSection.displayName = 'DashboardEventsSection';
