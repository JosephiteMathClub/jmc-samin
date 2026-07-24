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
  const [executiveTab, setExecutiveTab] = useState<'current' | 'former'>('current');
  const [selectedFormerIndex, setSelectedFormerIndex] = useState<number>(0);

  const formerPanels = Array.isArray(data?.executive?.former) ? data.executive.former : [];
  const activeIndex = Math.min(selectedFormerIndex, Math.max(0, formerPanels.length - 1));

  const getEditorPath = (subPath: string[]): string[] => {
    if (executiveTab === 'current') {
      return ['panel', 'executive', 'current', ...subPath];
    } else {
      return ['panel', 'executive', 'former', activeIndex.toString(), ...subPath];
    }
  };

  const handleAddFormerYear = () => {
    const newYearObj = {
      id: "panel-" + Date.now().toString(),
      year: "Panel XX (2025-2026)",
      president: [],
      deputyPresidents: [],
      generalSecretary: [],
      vicePresidents: [],
      departments: [],
      secretaries: {
        asstGeneralSecretary: [],
        jointSecretary: [],
        organizingSecretary: [],
        correspondingSecretary: []
      }
    };
    addDeepListItem(['panel', 'executive', 'former'], newYearObj);
    setSelectedFormerIndex(formerPanels.length);
  };

  const handleDeleteFormerYear = (indexToDelete: number) => {
    removeDeepListItem(['panel', 'executive', 'former'], indexToDelete);
    if (selectedFormerIndex >= Math.max(1, formerPanels.length - 1)) {
      setSelectedFormerIndex(Math.max(0, formerPanels.length - 2));
    }
  };

  const shouldRenderEditors = executiveTab === 'current' || formerPanels.length > 0;

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
                className="absolute top-4 right-4 z-30 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all hover:scale-110"
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

      <DashboardSection icon={ShieldAlert} title="Executive Body Management" description="Manage the current and former executive members.">
        <div className="space-y-8">
          {/* Executive Body Tabs */}
          <div className="flex p-1 bg-white/5 rounded-xl border border-white/10">
            {[
              { id: 'current', label: 'Current Panel' },
              { id: 'former', label: 'Former Panels' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setExecutiveTab(tab.id as any)}
                className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${
                  executiveTab === tab.id 
                    ? 'bg-amber-500 text-black shadow-lg' 
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Former Years Selector & Editor */}
          {executiveTab === 'former' && (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500">Manage Former Panel Years</h4>
                <button 
                  onClick={handleAddFormerYear}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Add Panel Year
                </button>
              </div>

              {formerPanels.length === 0 ? (
                <p className="text-xs text-zinc-500 italic text-center py-4">No former panels exist. Create one to get started!</p>
              ) : (
                <div className="space-y-4">
                  {/* Years list */}
                  <div className="flex flex-wrap gap-2">
                    {formerPanels.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedFormerIndex(idx)}
                          className={`px-4 py-2 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider transition-all border ${
                            activeIndex === idx 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' 
                              : 'bg-white/5 text-zinc-500 border-transparent hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p.year || `Unnamed Year ${idx}`}
                        </button>
                        <button 
                          onClick={() => handleDeleteFormerYear(idx)}
                          className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete this panel year"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Year Title Editor */}
                  {formerPanels[activeIndex] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <DashboardFormField 
                        label="Edit Panel Year Title (e.g. Panel 25 (2024-2025))" 
                        value={formerPanels[activeIndex]?.year} 
                        onChange={(val) => updateDeepListItem(['panel', 'executive', 'former'], activeIndex, { year: val })} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!shouldRenderEditors ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Please add a former panel year to manage its members.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {[
                { id: 'president', label: 'President', icon: Star, single: true },
                { id: 'generalSecretary', label: 'General Secretary', icon: Briefcase, single: true },
                { id: 'deputyPresidents', label: 'Deputy Presidents', icon: Award },
                { id: 'vicePresidents', label: 'Vice Presidents', icon: Award },
                { id: 'departments', label: 'Department Heads', icon: Users, isDept: true },
              ].map((category) => {
                const list = (executiveTab === 'current' 
                  ? data?.executive?.current?.[category.id] 
                  : data?.executive?.former?.[activeIndex]?.[category.id]) || [];
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <category.icon className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white">{category.label}</h4>
                      </div>
                      {(!category.single || list.length === 0) && (
                        <button 
                          onClick={() => addDeepListItem(getEditorPath([category.id]), 
                            category.isDept ? { dept: 'New Dept', name: '', imageUrl: '' } : { name: '', role: category.label, imageUrl: '' }
                          )}
                          className="p-1 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {list.map((m: any, i: number) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                          <button 
                            onClick={() => removeDeepListItem(getEditorPath([category.id]), i)}
                            className="absolute top-2 right-2 z-30 p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {category.isDept && (
                              <DashboardFormField label="Department" value={m.dept} onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { dept: val })} />
                            )}
                            <DashboardFormField label="Name" value={m.name} onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { name: val })} />
                            {!category.isDept && !category.single && (
                              <DashboardFormField label="Role" value={m.role} onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { role: val })} />
                            )}
                          </div>
                          <div className="mt-4">
                            <DashboardFileUpload 
                              label="Photo" 
                              value={m.imageUrl} 
                              uploading={uploading === `panel-executive-${executiveTab}-${executiveTab === 'former' ? activeIndex : ''}-${category.id}-${i}`}
                              onUpload={(ev) => handleFileUpload(ev, [...getEditorPath([category.id]), i], (url) => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: url }))} 
                              onDelete={() => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: '' })}
                              onChange={(path, val) => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: val })}
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
                    const list = (executiveTab === 'current'
                      ? data?.executive?.current?.secretaries?.[sec.id]
                      : data?.executive?.former?.[activeIndex]?.secretaries?.[sec.id]) || [];
                    return (
                      <div key={sec.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{sec.label}</h5>
                          <button 
                            onClick={() => addDeepListItem(getEditorPath(['secretaries', sec.id]), { name: '', imageUrl: '' })}
                            className="p-1 text-amber-500 hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="space-y-2">
                          {list.map((s: any, i: number) => (
                            <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 flex flex-col gap-3 relative group">
                              <button 
                                onClick={() => removeDeepListItem(getEditorPath(['secretaries', sec.id]), i)}
                                className="absolute top-2 right-2 z-30 p-1.5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <DashboardFormField label="Name" value={s.name} onChange={(val) => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { name: val })} />
                              <DashboardFileUpload 
                                label="Photo" 
                                value={s.imageUrl} 
                                uploading={uploading === `panel-executive-${executiveTab}-${executiveTab === 'former' ? activeIndex : ''}-secretaries-${sec.id}-${i}`}
                                onUpload={(ev) => handleFileUpload(ev, [...getEditorPath(['secretaries', sec.id]), i], (url) => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { imageUrl: url }))} 
                                onDelete={() => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { imageUrl: '' })}
                                onChange={(path, val) => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { imageUrl: val })}
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
          )}
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardPanelSection = React.memo(DashboardPanelSectionComponent);
DashboardPanelSection.displayName = 'DashboardPanelSection';
