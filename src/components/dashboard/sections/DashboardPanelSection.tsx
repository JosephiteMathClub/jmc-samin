"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Trash2, Plus, Star, Briefcase, Award, FileText, ShieldAlert } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';

interface DashboardPanelSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  updateDeepListItem: (path: string[], index: number, value: any) => void;
  addDeepListItem: (path: string[], newItem: any) => void;
  removeDeepListItem: (path: string[], index: number) => void;
  uploading: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
  shouldReduceGfx: boolean;
}

const DashboardPanelSectionComponent: React.FC<DashboardPanelSectionProps> = ({
  data,
  updateField,
  updateListItem,
  addListItem,
  removeListItem,
  updateDeepListItem,
  addDeepListItem,
  removeDeepListItem,
  uploading,
  handleFileUpload,
  shouldReduceGfx
}) => {
  const [executiveTab, setExecutiveTab] = useState<'current' | 'recent' | 'former'>('current');

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection title="Panel Page Content" description="Manage titles and subtitles for the Panel page" icon={Users}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DashboardFormField label="Moderators Title" value={data?.moderatorsTitle} onChange={(val) => updateField('moderatorsTitle', val)} />
          <DashboardFormField label="Executive Title" value={data?.executiveTitle} onChange={(val) => updateField('executiveTitle', val)} />
          <DashboardFormField label="Executive Subtitle" value={data?.executiveSubtitle} onChange={(val) => updateField('executiveSubtitle', val)} />
          <DashboardFormField label="Departments Title" value={data?.departmentsTitle} onChange={(val) => updateField('departmentsTitle', val)} />
          <DashboardFormField label="Departments Subtitle" value={data?.departmentsSubtitle} onChange={(val) => updateField('departmentsSubtitle', val)} />
          <DashboardFormField label="Secretaries Title" value={data?.secretariesTitle} onChange={(val) => updateField('secretariesTitle', val)} />
        </div>
      </DashboardSection>

      <DashboardSection icon={Users} title="Moderators" description="Manage the club's moderators who are always displayed at the top of the Panel page.">
        <div className="grid grid-cols-1 gap-8">
          {(data?.moderators || []).map((m: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
              <button 
                onClick={() => removeListItem('moderators', i)}
                className="absolute top-4 right-4 p-2 text-zinc-600 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DashboardFormField label="Name" value={m.name} onChange={(val) => updateListItem('moderators', i, { name: val })} />
                <DashboardFormField label="Role" value={m.role} onChange={(val) => updateListItem('moderators', i, { role: val })} />
              </div>
              <DashboardFileUpload 
                label="Profile Image" 
                value={m.imageUrl} 
                uploading={uploading === `panel-moderators-${i}`}
                onUpload={(ev) => handleFileUpload(ev, [`panel`, `moderators`, i], (url) => updateListItem('moderators', i, { imageUrl: url }))} 
                onDelete={() => updateListItem('moderators', i, { imageUrl: '' })}
                onChange={(path, val) => updateListItem('moderators', i, { imageUrl: val })}
              />
            </div>
          ))}
          <button 
            onClick={() => addListItem('moderators', { name: '', role: 'Moderator', imageUrl: '' })}
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" /> Add Moderator
          </button>
        </div>
      </DashboardSection>

      <DashboardSection icon={ShieldAlert} title="Executive Body Management" description="Manage the current, recent, and former executive members.">
        <div className="space-y-8">
          {/* Executive Body Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
            {['current', 'recent', 'former'].map((tab) => (
              <button
                key={tab}
                onClick={() => setExecutiveTab(tab as any)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  executiveTab === tab 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-12">
            {[
              { id: 'president', label: 'President', icon: Star, single: true },
              { id: 'generalSecretary', label: 'General Secretary', icon: Briefcase, single: true },
              { id: 'deputyPresidents', label: 'Deputy Presidents', icon: Award },
              { id: 'vicePresidents', label: 'Vice Presidents', icon: Award },
              { id: 'departments', label: 'Department Heads', icon: Users, isDept: true },
            ].map((category) => {
              const list = data?.executive?.[executiveTab]?.[category.id] || [];
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <category.icon className="w-4 h-4 text-amber-500" />
                      <h4 className="text-xs font-bold uppercase tracking-widest text-white">{category.label}</h4>
                    </div>
                    {(!category.single || list.length === 0) && (
                      <button 
                        onClick={() => addDeepListItem(['panel', 'executive', executiveTab, category.id], 
                          category.isDept ? { dept: 'New Dept', name: '', imageUrl: '' } : { name: '', role: category.label, imageUrl: '' }
                        )}
                        className="p-1 text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {list.map((m: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                        <button 
                          onClick={() => removeDeepListItem(['panel', 'executive', executiveTab, category.id], i)}
                          className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {category.isDept && (
                            <DashboardFormField label="Department" value={m.dept} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { dept: val })} />
                          )}
                          <DashboardFormField label="Name" value={m.name} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { name: val })} />
                          {!category.isDept && !category.single && (
                            <DashboardFormField label="Role" value={m.role} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { role: val })} />
                          )}
                        </div>
                        <div className="mt-4">
                          <DashboardFileUpload 
                            label="Photo" 
                            value={m.imageUrl} 
                            uploading={uploading === `panel-executive-${executiveTab}-${category.id}-${i}`}
                            onUpload={(ev) => handleFileUpload(ev, [`panel`, `executive`, executiveTab, category.id, i], (url) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: url }))} 
                            onDelete={() => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: '' })}
                            onChange={(path, val) => updateDeepListItem(['panel', 'executive', executiveTab, category.id], i, { imageUrl: val })}
                          />
                        </div>
                      </div>
                    ))}
                    {list.length === 0 && (
                      <p className="text-[10px] text-zinc-600 italic">No members added to this category.</p>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Secretaries Section */}
            <div className="space-y-6 pt-6 border-t border-white/5">
              <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Secretary Positions
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { id: 'asstGeneralSecretary', label: 'Asst. General Secretary' },
                  { id: 'jointSecretary', label: 'Joint Secretary' },
                  { id: 'organizingSecretary', label: 'Organizing Secretary' },
                  { id: 'correspondingSecretary', label: 'Corresponding Secretary' }
                ].map((sec) => {
                  const list = data?.executive?.[executiveTab]?.secretaries?.[sec.id] || [];
                  return (
                    <div key={sec.id} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{sec.label}</h5>
                        <button 
                          onClick={() => addDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], { name: '', imageUrl: '' })}
                          className="p-1 text-amber-500 hover:text-amber-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="space-y-2">
                        {list.map((s: any, i: number) => (
                          <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3 relative group">
                            <button 
                              onClick={() => removeDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i)}
                              className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <DashboardFormField label="Name" value={s.name} onChange={(val) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { name: val })} />
                            <DashboardFileUpload 
                              label="Photo" 
                              value={s.imageUrl} 
                              uploading={uploading === `panel-executive-${executiveTab}-secretaries-${sec.id}-${i}`}
                              onUpload={(ev) => handleFileUpload(ev, [`panel`, `executive`, executiveTab, `secretaries`, sec.id, i], (url) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: url }))} 
                              onDelete={() => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: '' })}
                              onChange={(path, val) => updateDeepListItem(['panel', 'executive', executiveTab, 'secretaries', sec.id], i, { imageUrl: val })}
                            />
                          </div>
                        ))}
                        {list.length === 0 && (
                          <p className="text-[10px] text-zinc-600 italic">None</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardPanelSection = React.memo(DashboardPanelSectionComponent);
DashboardPanelSection.displayName = 'DashboardPanelSection';
