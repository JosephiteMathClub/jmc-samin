"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { FileText, Trash2, Plus } from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';

interface DashboardAboutSectionProps {
  data: any;
  updateField: (field: string, value: any) => void;
  updateListItem: (field: string, index: number, value: any) => void;
  addListItem: (field: string, newItem: any) => void;
  removeListItem: (field: string, index: number) => void;
  shouldReduceGfx: boolean;
}

const DashboardAboutSectionComponent: React.FC<DashboardAboutSectionProps> = ({
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
      <DashboardSection icon={FileText} title="About Page Content" description="Define your club's history and mission.">
        <div className="grid grid-cols-1 gap-6">
          <DashboardFormField 
            label="Page Title" 
            value={data?.title} 
            onChange={(val) => updateField('title', val)} 
          />
          <DashboardFormField 
            label="Description" 
            type="textarea"
            value={data?.description} 
            onChange={(val) => updateField('description', val)} 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Vision Tagline" 
              value={data?.visionTagline} 
              onChange={(val) => updateField('visionTagline', val)} 
            />
            <DashboardFormField 
              label="Objectives Title" 
              value={data?.objectivesTitle} 
              onChange={(val) => updateField('objectivesTitle', val)} 
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardFormField 
              label="Path Tagline" 
              value={data?.pathTagline} 
              onChange={(val) => updateField('pathTagline', val)} 
            />
            <DashboardFormField 
              label="Vision Steps Title" 
              value={data?.visionStepsTitle} 
              onChange={(val) => updateField('visionStepsTitle', val)} 
            />
          </div>
          <DashboardFormField 
            label="Mission Statement" 
            type="textarea"
            value={data?.mission} 
            onChange={(val) => updateField('mission', val)} 
          />

          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Statistics</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {(data?.stats || []).map((stat: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                    <button 
                      onClick={() => removeListItem('stats', i)}
                      className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="grid grid-cols-1 gap-3">
                      <DashboardFormField label="Number" value={stat.number} onChange={(val) => updateListItem('stats', i, { number: val })} />
                      <DashboardFormField label="Label" value={stat.label} onChange={(val) => updateListItem('stats', i, { label: val })} />
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('stats', { number: '0', label: 'New Stat' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Stat
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Objectives</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data?.objectives || []).map((obj: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                    <button 
                      onClick={() => removeListItem('objectives', i)}
                      className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="grid grid-cols-1 gap-3">
                      <DashboardFormField label="Title" value={obj.title} onChange={(val) => updateListItem('objectives', i, { title: val })} />
                      <DashboardFormField label="Description" type="textarea" value={obj.description} onChange={(val) => updateListItem('objectives', i, { description: val })} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <DashboardFormField 
                          label="Icon" 
                          type="select" 
                          value={obj.icon} 
                          onChange={(val) => updateListItem('objectives', i, { icon: val })}
                          options={[
                            { value: 'Calculator', label: 'Calculator' },
                            { value: 'Trophy', label: 'Trophy' },
                            { value: 'Lightbulb', label: 'Lightbulb' },
                            { value: 'Heart', label: 'Heart' },
                            { value: 'Award', label: 'Award' },
                            { value: 'Users', label: 'Users' }
                          ]}
                        />
                        <DashboardFormField 
                          label="Color Class" 
                          value={obj.color} 
                          onChange={(val) => updateListItem('objectives', i, { color: val })}
                          placeholder="e.g. text-purple-400"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('objectives', { title: 'New Objective', description: '', icon: 'Lightbulb', color: 'text-amber-400' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Objective
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Vision Steps</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(data?.visionSteps || []).map((step: any, i: number) => (
                  <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group">
                    <button 
                      onClick={() => removeListItem('visionSteps', i)}
                      className="absolute top-2 right-2 p-1 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                    <div className="grid grid-cols-1 gap-3">
                      <DashboardFormField label="Title" value={step.title} onChange={(val) => updateListItem('visionSteps', i, { title: val })} />
                      <DashboardFormField label="Description" type="textarea" value={step.desc} onChange={(val) => updateListItem('visionSteps', i, { desc: val })} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <DashboardFormField 
                          label="Icon" 
                          type="select" 
                          value={step.icon} 
                          onChange={(val) => updateListItem('visionSteps', i, { icon: val })}
                          options={[
                            { value: 'Target', label: 'Target' },
                            { value: 'Zap', label: 'Zap' },
                            { value: 'Rocket', label: 'Rocket' },
                            { value: 'Globe', label: 'Globe' },
                            { value: 'Trophy', label: 'Trophy' }
                          ]}
                        />
                        <DashboardFormField 
                          label="Color Class" 
                          value={step.color} 
                          onChange={(val) => updateListItem('visionSteps', i, { color: val })}
                          placeholder="e.g. bg-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <button 
                  onClick={() => addListItem('visionSteps', { title: 'New Step', desc: '', icon: 'Zap', color: 'bg-indigo-500' })}
                  className="w-full py-4 border-2 border-dashed border-white/10 rounded-xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold text-[10px] uppercase tracking-widest"
                >
                  <Plus className="w-4 h-4" /> Add Vision Step
                </button>
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>
    </motion.div>
  );
};

export const DashboardAboutSection = React.memo(DashboardAboutSectionComponent);
DashboardAboutSection.displayName = 'DashboardAboutSection';
