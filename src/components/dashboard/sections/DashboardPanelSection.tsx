"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trash2, 
  Plus, 
  Star, 
  Briefcase, 
  Award, 
  FileText, 
  ShieldAlert,
  Archive,
  Layers,
  ArrowUp,
  ArrowDown,
  Sparkles,
  X,
  Camera,
  Calendar,
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFormField } from '../DashboardFormField';
import { DashboardFileUpload } from '../DashboardFileUpload';
import { useToast } from '../../../context/ToastContext';
import { resolveImageUrl } from '../../../lib/utils';
import Image from 'next/image';

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
  const { showToast } = useToast();
  const [executiveTab, setExecutiveTab] = useState<'current' | 'former'>('current');
  const [selectedFormerIndex, setSelectedFormerIndex] = useState<number>(0);

  // Push Panel / New Panel Modal State
  const [isPushModalOpen, setIsPushModalOpen] = useState(false);
  const [pushMode, setPushMode] = useState<'push_and_new' | 'push_only'>('push_and_new');
  const [sessionYearInput, setSessionYearInput] = useState('');
  const [sessionYearError, setSessionYearError] = useState<string | null>(null);

  // New Panel Warning Modal
  const [isNewPanelModalOpen, setIsNewPanelModalOpen] = useState(false);

  // Quick Manual Member Placement Modal State
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [placeCategory, setPlaceCategory] = useState<string>('president');
  const [placeName, setPlaceName] = useState<string>('');
  const [placeRole, setPlaceRole] = useState<string>('President');
  const [placeDept, setPlaceDept] = useState<string>('Internal Affairs');
  const [placeImageUrl, setPlaceImageUrl] = useState<string>('');

  // Inline feedback message
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const formerPanels = Array.isArray(data?.executive?.former) ? data.executive.former : [];
  const activeIndex = Math.min(selectedFormerIndex, Math.max(0, formerPanels.length - 1));

  // Count active members in current panel
  const currentPanelMembersCount = useMemo(() => {
    const cur = data?.executive?.current;
    if (!cur) return 0;
    let count = 0;
    count += (cur.president?.length || 0);
    count += (cur.deputyPresidents?.length || 0);
    count += (cur.generalSecretary?.length || 0);
    count += (cur.vicePresidents?.length || 0);
    count += (cur.departments?.length || 0);
    const secs = cur.secretaries || {};
    count += (secs.asstGeneralSecretary?.length || 0);
    count += (secs.jointSecretary?.length || 0);
    count += (secs.organizingSecretary?.length || 0);
    count += (secs.correspondingSecretary?.length || 0);
    return count;
  }, [data?.executive?.current]);

  // Derive suggested session year string based on existing panels
  const suggestedSessionYear = useMemo(() => {
    if (formerPanels.length > 0) {
      for (const p of formerPanels) {
        const match = (p.year || '').match(/Panel\s*(\d+)/i);
        if (match) {
          const nextNum = parseInt(match[1], 10) + 1;
          const currentYear = new Date().getFullYear();
          return `Panel ${nextNum} (${currentYear}-${currentYear + 1})`;
        }
      }
    }
    const curYear = new Date().getFullYear();
    return `Panel 26 (${curYear}-${curYear + 1})`;
  }, [formerPanels]);

  const getEditorPath = (subPath: string[]): string[] => {
    if (executiveTab === 'current') {
      return ['panel', 'executive', 'current', ...subPath];
    } else {
      return ['panel', 'executive', 'former', activeIndex.toString(), ...subPath];
    }
  };

  // Open Push Panel dialog with preset mode
  const openPushModal = (mode: 'push_and_new' | 'push_only') => {
    setPushMode(mode);
    setSessionYearInput(suggestedSessionYear);
    setSessionYearError(null);
    setIsPushModalOpen(true);
  };

  // Open New Panel confirmation or start
  const handleNewPanelClick = () => {
    if (currentPanelMembersCount > 0) {
      setIsNewPanelModalOpen(true);
    } else {
      // Current panel is already empty
      showToast("Current Panel is already clean and ready for manual placement.", "info");
      setExecutiveTab('current');
    }
  };

  // Execution: Push current panel to former panel
  const handleConfirmPushPanel = () => {
    const trimmedYear = sessionYearInput.trim();
    if (!trimmedYear) {
      setSessionYearError("Please manually type in the corresponding panel's session (year)");
      return;
    }

    const currentExec = data?.executive || {};
    const currentPanel = currentExec.current || {};
    const currentFormer = Array.isArray(currentExec.former) ? currentExec.former : [];

    // Clone current panel to former
    const archivedPanel = {
      id: "panel-" + Date.now().toString(),
      year: trimmedYear,
      president: Array.isArray(currentPanel.president) ? JSON.parse(JSON.stringify(currentPanel.president)) : [],
      deputyPresidents: Array.isArray(currentPanel.deputyPresidents) ? JSON.parse(JSON.stringify(currentPanel.deputyPresidents)) : [],
      generalSecretary: Array.isArray(currentPanel.generalSecretary) ? JSON.parse(JSON.stringify(currentPanel.generalSecretary)) : [],
      vicePresidents: Array.isArray(currentPanel.vicePresidents) ? JSON.parse(JSON.stringify(currentPanel.vicePresidents)) : [],
      departments: Array.isArray(currentPanel.departments) ? JSON.parse(JSON.stringify(currentPanel.departments)) : [],
      secretaries: {
        asstGeneralSecretary: Array.isArray(currentPanel.secretaries?.asstGeneralSecretary) ? JSON.parse(JSON.stringify(currentPanel.secretaries.asstGeneralSecretary)) : [],
        jointSecretary: Array.isArray(currentPanel.secretaries?.jointSecretary) ? JSON.parse(JSON.stringify(currentPanel.secretaries.jointSecretary)) : [],
        organizingSecretary: Array.isArray(currentPanel.secretaries?.organizingSecretary) ? JSON.parse(JSON.stringify(currentPanel.secretaries.organizingSecretary)) : [],
        correspondingSecretary: Array.isArray(currentPanel.secretaries?.correspondingSecretary) ? JSON.parse(JSON.stringify(currentPanel.secretaries.correspondingSecretary)) : []
      }
    };

    const newFormerList = [archivedPanel, ...currentFormer];

    if (pushMode === 'push_and_new') {
      const emptyNewPanel = {
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

      updateField('executive', {
        ...currentExec,
        former: newFormerList,
        current: emptyNewPanel
      });

      setExecutiveTab('current');
      showToast(`Panel archived to Former Panels under "${trimmedYear}" and New Panel initialized!`, 'success');
      setStatusMessage(`Active committee archived as "${trimmedYear}". New Panel is ready for manual member placement.`);
    } else {
      updateField('executive', {
        ...currentExec,
        former: newFormerList
      });

      showToast(`Current panel copied to Former Panels under "${trimmedYear}"!`, 'success');
      setStatusMessage(`Current panel archived as "${trimmedYear}". Current panel remains active.`);
    }

    setIsPushModalOpen(false);
    setSessionYearInput('');
  };

  // Execution: Start blank panel without pushing
  const handleConfirmBlankNewPanel = () => {
    const currentExec = data?.executive || {};
    const emptyNewPanel = {
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

    updateField('executive', {
      ...currentExec,
      current: emptyNewPanel
    });

    setExecutiveTab('current');
    setIsNewPanelModalOpen(false);
    showToast("New Panel initialized. Manually place member photos, names, and designations below.", "success");
    setStatusMessage("New Panel initialized. Ready for manual member placement.");
  };

  // Helper to re-order members within a category list
  const moveMember = (categorySubPath: string[], fromIndex: number, toIndex: number) => {
    const currentExec = data?.executive || { current: {}, former: [] };
    const execCopy = JSON.parse(JSON.stringify(currentExec));

    let targetList: any[] | null = null;
    if (executiveTab === 'current') {
      if (categorySubPath[0] === 'secretaries') {
        targetList = execCopy.current?.secretaries?.[categorySubPath[1]];
      } else {
        targetList = execCopy.current?.[categorySubPath[0]];
      }
    } else {
      const former = execCopy.former?.[activeIndex];
      if (former) {
        if (categorySubPath[0] === 'secretaries') {
          targetList = former.secretaries?.[categorySubPath[1]];
        } else {
          targetList = former[categorySubPath[0]];
        }
      }
    }

    if (Array.isArray(targetList) && fromIndex >= 0 && toIndex >= 0 && fromIndex < targetList.length && toIndex < targetList.length) {
      const [movedItem] = targetList.splice(fromIndex, 1);
      targetList.splice(toIndex, 0, movedItem);
      updateField('executive', execCopy);
    }
  };

  // Helper to quickly populate standard blank starter position slots
  const handlePopulateStarterSlots = () => {
    const currentExec = data?.executive || { current: {}, former: [] };
    const execCopy = JSON.parse(JSON.stringify(currentExec));
    const target = executiveTab === 'current' ? execCopy.current : execCopy.former?.[activeIndex];

    if (!target) return;

    if (!Array.isArray(target.president)) target.president = [];
    if (!Array.isArray(target.generalSecretary)) target.generalSecretary = [];
    if (!Array.isArray(target.deputyPresidents)) target.deputyPresidents = [];
    if (!Array.isArray(target.vicePresidents)) target.vicePresidents = [];
    if (!Array.isArray(target.departments)) target.departments = [];
    if (!target.secretaries) target.secretaries = {};
    if (!Array.isArray(target.secretaries.asstGeneralSecretary)) target.secretaries.asstGeneralSecretary = [];
    if (!Array.isArray(target.secretaries.jointSecretary)) target.secretaries.jointSecretary = [];
    if (!Array.isArray(target.secretaries.organizingSecretary)) target.secretaries.organizingSecretary = [];
    if (!Array.isArray(target.secretaries.correspondingSecretary)) target.secretaries.correspondingSecretary = [];

    // Add 1 blank President if empty
    if (target.president.length === 0) {
      target.president.push({ name: '', role: 'President', imageUrl: '' });
    }
    // Add 1 blank GS if empty
    if (target.generalSecretary.length === 0) {
      target.generalSecretary.push({ name: '', role: 'General Secretary', imageUrl: '' });
    }
    // Add 1 blank DP if empty
    if (target.deputyPresidents.length === 0) {
      target.deputyPresidents.push({ name: '', role: 'Deputy President', imageUrl: '' });
    }
    // Add 2 blank VPs if empty
    if (target.vicePresidents.length === 0) {
      target.vicePresidents.push({ name: '', role: 'Vice President', imageUrl: '' });
      target.vicePresidents.push({ name: '', role: 'Vice President', imageUrl: '' });
    }
    // Add standard departments if empty
    if (target.departments.length === 0) {
      const defaultDepts = [
        "Internal Affairs",
        "External Affairs",
        "Photography",
        "Events",
        "Writings",
        "Equity",
        "Decoration"
      ];
      for (const dept of defaultDepts) {
        target.departments.push({ dept, name: '', role: `Head of ${dept}`, imageUrl: '' });
      }
    }
    // Add 1 blank slot for each secretary position if empty
    if (target.secretaries.jointSecretary.length === 0) {
      target.secretaries.jointSecretary.push({ name: '', role: 'Joint Secretary', imageUrl: '' });
    }
    if (target.secretaries.organizingSecretary.length === 0) {
      target.secretaries.organizingSecretary.push({ name: '', role: 'Organizing Secretary', imageUrl: '' });
    }
    if (target.secretaries.asstGeneralSecretary.length === 0) {
      target.secretaries.asstGeneralSecretary.push({ name: '', role: 'Assistant General Secretary', imageUrl: '' });
    }
    if (target.secretaries.correspondingSecretary.length === 0) {
      target.secretaries.correspondingSecretary.push({ name: '', role: 'Corresponding Secretary', imageUrl: '' });
    }

    updateField('executive', execCopy);
    showToast("Standard position slots added. Manually fill in each member's photo, name, and designation.", "success");
  };

  // Execution: Manual member placement form submit
  const handlePlaceMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!placeName.trim()) {
      showToast("Please enter the member's full name", "error");
      return;
    }

    const currentExec = data?.executive || { current: {}, former: [] };
    const execCopy = JSON.parse(JSON.stringify(currentExec));
    const target = executiveTab === 'current' ? execCopy.current : execCopy.former?.[activeIndex];

    if (!target) return;

    const newMemberObj: any = {
      name: placeName.trim(),
      role: placeRole.trim() || 'Executive Member',
      imageUrl: placeImageUrl.trim()
    };

    if (placeCategory === 'departments') {
      newMemberObj.dept = placeDept.trim() || 'General';
      if (!Array.isArray(target.departments)) target.departments = [];
      target.departments.push(newMemberObj);
    } else if (placeCategory.startsWith('secretaries.')) {
      const secKey = placeCategory.replace('secretaries.', '');
      if (!target.secretaries) target.secretaries = {};
      if (!Array.isArray(target.secretaries[secKey])) target.secretaries[secKey] = [];
      target.secretaries[secKey].push(newMemberObj);
    } else {
      if (!Array.isArray(target[placeCategory])) target[placeCategory] = [];
      target[placeCategory].push(newMemberObj);
    }

    updateField('executive', execCopy);
    showToast(`Added ${newMemberObj.name} (${newMemberObj.role}) to ${executiveTab === 'current' ? 'Current Panel' : 'Former Panel'}!`, "success");

    // Reset form
    setPlaceName('');
    setPlaceImageUrl('');
    setIsAddMemberModalOpen(false);
  };

  const handleAddFormerYear = () => {
    const newYearObj = {
      id: "panel-" + Date.now().toString(),
      year: `Panel ${formerPanels.length + 1} (${new Date().getFullYear() - 1}-${new Date().getFullYear()})`,
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
      {/* Title & Description Fields */}
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

      {/* Moderators Management */}
      <DashboardSection icon={Users} title="Moderators" description="Manage the club's moderators who are always displayed at the top of the Panel page.">
        <div className="grid grid-cols-1 gap-8">
          {(data?.moderators || []).map((m: any, i: number) => (
            <div key={i} className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4 relative">
              <button 
                onClick={() => removeListItem('moderators', i)}
                className="absolute top-4 right-4 z-30 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all hover:scale-110 cursor-pointer"
                title="Remove Moderator"
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
            className="w-full py-4 border-2 border-dashed border-white/10 rounded-2xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <Plus className="w-5 h-5" /> Add Moderator
          </button>
        </div>
      </DashboardSection>

      {/* Executive Body Management with Push Panel & New Panel Controls */}
      <DashboardSection 
        icon={ShieldAlert} 
        title="Executive Body Management" 
        description="Manage the current active executive panel and archived former panels. Push current panel to former panels and manually place new panel member photos, names, and designations."
      >
        <div className="space-y-8">
          
          {/* Top Panel Lifecycle & Action Toolbar */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/20 backdrop-blur-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                    Panel Transition & Lifecycle
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-[10px] font-mono font-semibold">
                    {currentPanelMembersCount} Active Members
                  </span>
                </div>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Push the current panel into former panels under a manually typed session year, then initialize a clean new panel to manually place members.
                </p>
              </div>

              {/* Action Buttons: Push Panel & New Panel */}
              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                <button
                  onClick={() => openPushModal('push_and_new')}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black font-mono font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  title="Push current panel to former panels and start a fresh panel"
                >
                  <Archive className="w-4 h-4 text-black" />
                  <span>Push Panel & New Panel</span>
                </button>

                <button
                  onClick={() => openPushModal('push_only')}
                  className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Archive current panel to former panels without clearing current"
                >
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Push Panel</span>
                </button>

                <button
                  onClick={handleNewPanelClick}
                  className="px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 text-zinc-300 hover:text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Initialize a new empty panel"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-400" />
                  <span>New Panel</span>
                </button>
              </div>
            </div>

            {statusMessage && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs text-emerald-300 font-mono">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{statusMessage}</span>
                </div>
                <button 
                  onClick={() => setStatusMessage(null)}
                  className="text-zinc-500 hover:text-white p-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Current / Former Panel Navigation Tabs */}
          <div className="flex items-center justify-between gap-4 p-1.5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex flex-1 gap-1">
              {[
                { id: 'current', label: 'Current Panel', count: currentPanelMembersCount },
                { id: 'former', label: 'Former Panels', count: formerPanels.length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setExecutiveTab(tab.id as any)}
                  className={`flex-1 py-2.5 px-4 text-xs font-mono font-bold uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    executiveTab === tab.id 
                      ? 'bg-amber-500 text-black shadow-lg font-black' 
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                    executiveTab === tab.id ? 'bg-black/20 text-black font-black' : 'bg-white/10 text-zinc-400'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {executiveTab === 'current' && (
              <div className="flex items-center gap-2 pr-1">
                <button
                  onClick={() => setIsAddMemberModalOpen(true)}
                  className="px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Place Member</span>
                </button>
                {currentPanelMembersCount === 0 && (
                  <button
                    onClick={handlePopulateStarterSlots}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Add standard blank starter positions for fast manual placement"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>Starter Slots</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Former Years Selector & Editor */}
          {executiveTab === 'former' && (
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> Manage Former Panel Sessions
                  </h4>
                  <p className="text-[11px] text-zinc-500">
                    Select an archived panel session below to view or modify its members.
                  </p>
                </div>
                <button 
                  onClick={handleAddFormerYear}
                  className="px-4 py-2 bg-amber-500 text-black rounded-lg text-xs font-mono font-bold uppercase tracking-wider hover:bg-amber-400 transition-all flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" /> Add Panel Session
                </button>
              </div>

              {formerPanels.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-white/10 rounded-xl">
                  <Archive className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                  <p className="text-xs text-zinc-500">No former panels archived yet.</p>
                  <p className="text-[10px] text-zinc-600 mt-1">Use the &quot;Push Panel&quot; button above to archive the current panel session here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Years list pills */}
                  <div className="flex flex-wrap gap-2">
                    {formerPanels.map((p: any, idx: number) => (
                      <div key={p.id || idx} className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedFormerIndex(idx)}
                          className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all border cursor-pointer ${
                            activeIndex === idx 
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-md shadow-amber-500/5' 
                              : 'bg-white/5 text-zinc-400 border-transparent hover:text-white hover:bg-white/10'
                          }`}
                        >
                          {p.year || `Unnamed Session ${idx}`}
                        </button>
                        <button 
                          onClick={() => handleDeleteFormerYear(idx)}
                          className="p-1.5 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete this archived panel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Year Title Editor */}
                  {formerPanels[activeIndex] && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                      <DashboardFormField 
                        label="Edit Panel Session Title (e.g. Panel 25 (2024-2025))" 
                        value={formerPanels[activeIndex]?.year} 
                        onChange={(val) => updateDeepListItem(['panel', 'executive', 'former'], activeIndex, { year: val })} 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Member Card Editors */}
          {!shouldRenderEditors ? (
            <div className="text-center py-12 border border-dashed border-white/10 rounded-2xl">
              <Users className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <p className="text-xs text-zinc-500">Please add an archived panel session to manage its members.</p>
            </div>
          ) : (
            <div className="space-y-12">
              
              {/* Empty panel notice with starter slots trigger */}
              {executiveTab === 'current' && currentPanelMembersCount === 0 && (
                <div className="p-8 rounded-2xl border border-dashed border-amber-500/30 bg-amber-500/[0.02] text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div className="max-w-md mx-auto space-y-1">
                    <h4 className="text-sm font-mono font-bold text-white uppercase tracking-wider">
                      New Panel Ready for Member Placement
                    </h4>
                    <p className="text-xs text-zinc-400">
                      You can manually place new panel member photos, names, and designations below. Click &quot;+ Add&quot; under any position or use the starter template.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsAddMemberModalOpen(true)}
                      className="px-4 py-2.5 bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400 transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ Manually Place Member</span>
                    </button>
                    <button
                      onClick={handlePopulateStarterSlots}
                      className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>+ Add Standard Starter Slots</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Core Executive Categories */}
              {[
                { id: 'president', label: 'President', icon: Star, defaultRole: 'President' },
                { id: 'generalSecretary', label: 'General Secretary', icon: Briefcase, defaultRole: 'General Secretary' },
                { id: 'deputyPresidents', label: 'Deputy Presidents', icon: Award, defaultRole: 'Deputy President' },
                { id: 'vicePresidents', label: 'Vice Presidents', icon: Award, defaultRole: 'Vice President' },
                { id: 'departments', label: 'Department Heads', icon: Users, isDept: true, defaultRole: 'Head of Department' },
              ].map((category) => {
                const list = (executiveTab === 'current' 
                  ? data?.executive?.current?.[category.id] 
                  : data?.executive?.former?.[activeIndex]?.[category.id]) || [];
                return (
                  <div key={category.id} className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <category.icon className="w-4 h-4 text-amber-400" />
                        <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-white">{category.label}</h4>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                          {list.length}
                        </span>
                      </div>
                      
                      <button 
                        onClick={() => addDeepListItem(
                          getEditorPath([category.id]), 
                          category.isDept 
                            ? { dept: 'Internal Affairs', name: '', role: 'Head of Internal Affairs', imageUrl: '' } 
                            : { name: '', role: category.defaultRole, imageUrl: '' }
                        )}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                        title={`Add ${category.label} member`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add {category.label}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {list.map((m: any, i: number) => (
                        <div key={i} className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 hover:border-white/20 transition-colors relative group">
                          {/* Top Controls: Reorder and Delete */}
                          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-black/40 backdrop-blur-md p-1 rounded-xl border border-white/5">
                            {i > 0 && (
                              <button
                                onClick={() => moveMember([category.id], i, i - 1)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Move up in order"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {i < list.length - 1 && (
                              <button
                                onClick={() => moveMember([category.id], i, i + 1)}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                                title="Move down in order"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button 
                              onClick={() => removeDeepListItem(getEditorPath([category.id]), i)}
                              className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                              title="Delete member"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Member Photo Column */}
                            <div className="lg:col-span-1 space-y-3">
                              <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                                  {m.imageUrl ? (
                                    <Image 
                                      src={resolveImageUrl(m.imageUrl)} 
                                      alt={m.name || 'Member Photo'} 
                                      fill 
                                      className="object-cover" 
                                      sizes="64px" 
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                                      <category.icon className="w-6 h-6 text-zinc-600" />
                                    </div>
                                  )}
                                </div>
                                <div className="space-y-1">
                                  <p className="text-xs font-mono font-bold text-white truncate max-w-[160px]">
                                    {m.name || 'Untitled Member'}
                                  </p>
                                  <p className="text-[10px] font-mono text-amber-400 truncate max-w-[160px]">
                                    {m.role || category.defaultRole}
                                  </p>
                                </div>
                              </div>

                              <DashboardFileUpload 
                                label="Upload Photo" 
                                value={m.imageUrl} 
                                uploading={uploading === `panel-executive-${executiveTab}-${executiveTab === 'former' ? activeIndex : ''}-${category.id}-${i}`}
                                onUpload={(ev) => handleFileUpload(ev, [...getEditorPath([category.id]), i], (url) => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: url }))} 
                                onDelete={() => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: '' })}
                                onChange={(path, val) => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: val })}
                              />

                              <DashboardFormField 
                                label="Photo URL (Direct / CDN)" 
                                value={m.imageUrl} 
                                placeholder="https://... or /images/..."
                                onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { imageUrl: val })} 
                              />
                            </div>

                            {/* Member Name and Designation Column */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <DashboardFormField 
                                label="Full Name *" 
                                value={m.name} 
                                placeholder="e.g. John Doe"
                                onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { name: val })} 
                              />

                              <DashboardFormField 
                                label="Designation / Role *" 
                                value={m.role || category.defaultRole} 
                                placeholder={`e.g. ${category.defaultRole}`}
                                onChange={(val) => updateDeepListItem(getEditorPath([category.id]), i, { role: val })} 
                              />

                              {category.isDept && (
                                <div className="md:col-span-2">
                                  <DashboardFormField 
                                    label="Department Name *" 
                                    value={m.dept} 
                                    placeholder="e.g. Internal Affairs, Photography, Events"
                                    onChange={(val) => {
                                      updateDeepListItem(getEditorPath([category.id]), i, { 
                                        dept: val,
                                        role: m.role ? m.role : `Head of ${val}`
                                      });
                                    }} 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {list.length === 0 && (
                        <div className="p-4 rounded-xl border border-dashed border-white/10 text-center">
                          <p className="text-xs text-zinc-500 italic">
                            No {category.label.toLowerCase()} added yet. Click &quot;Add {category.label}&quot; to manually place a member.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Secretaries Section */}
              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-amber-500 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Secretary Positions
                  </h4>
                  <p className="text-[11px] text-zinc-500 hidden sm:block">
                    Manually place photo, name, and designation for all secretary roles
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[
                    { id: 'asstGeneralSecretary', label: 'Asst. General Secretary', defaultRole: 'Assistant General Secretary' },
                    { id: 'jointSecretary', label: 'Joint Secretary', defaultRole: 'Joint Secretary' },
                    { id: 'organizingSecretary', label: 'Organizing Secretary', defaultRole: 'Organizing Secretary' },
                    { id: 'correspondingSecretary', label: 'Corresponding Secretary', defaultRole: 'Corresponding Secretary' }
                  ].map((sec) => {
                    const list = (executiveTab === 'current'
                      ? data?.executive?.current?.secretaries?.[sec.id]
                      : data?.executive?.former?.[activeIndex]?.secretaries?.[sec.id]) || [];
                    return (
                      <div key={sec.id} className="space-y-4 p-5 rounded-2xl bg-white/[0.02] border border-white/5">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-300">{sec.label}</h5>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                              {list.length}
                            </span>
                          </div>
                          <button 
                            onClick={() => addDeepListItem(getEditorPath(['secretaries', sec.id]), { 
                              name: '', 
                              role: sec.defaultRole,
                              imageUrl: '' 
                            })}
                            className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-mono font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          {list.map((s: any, i: number) => (
                            <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/10 relative group space-y-3">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-mono text-zinc-500">#{i + 1}</span>
                                <div className="flex items-center gap-1">
                                  {i > 0 && (
                                    <button
                                      onClick={() => moveMember(['secretaries', sec.id], i, i - 1)}
                                      className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Move up"
                                    >
                                      <ArrowUp className="w-3 h-3" />
                                    </button>
                                  )}
                                  {i < list.length - 1 && (
                                    <button
                                      onClick={() => moveMember(['secretaries', sec.id], i, i + 1)}
                                      className="p-1 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer"
                                      title="Move down"
                                    >
                                      <ArrowDown className="w-3 h-3" />
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => removeDeepListItem(getEditorPath(['secretaries', sec.id]), i)}
                                    className="p-1 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                                    title="Delete member"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DashboardFormField 
                                  label="Full Name" 
                                  value={s.name} 
                                  placeholder="Full Name"
                                  onChange={(val) => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { name: val })} 
                                />
                                <DashboardFormField 
                                  label="Designation / Role" 
                                  value={s.role || sec.defaultRole} 
                                  placeholder={sec.defaultRole}
                                  onChange={(val) => updateDeepListItem(getEditorPath(['secretaries', sec.id]), i, { role: val })} 
                                />
                              </div>

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
                            <p className="text-[11px] text-zinc-600 italic py-2">No members placed for {sec.label}.</p>
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

      {/* ========================================================================= */}
      {/* MODAL 1: Push Panel & New Panel Dialog                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isPushModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setIsPushModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Archive className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-mono font-black uppercase tracking-wider text-white">
                    {pushMode === 'push_and_new' ? 'Push Panel & New Panel' : 'Push Current Panel'}
                  </h3>
                  <p className="text-xs text-zinc-400">
                    {pushMode === 'push_and_new' 
                      ? 'Put the current active committee into Former Panels and initialize a clean New Panel.'
                      : 'Copy current active committee into Former Panels archive under a session year.'
                    }
                  </p>
                </div>
              </div>

              {/* Current Panel Snapshot */}
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-2">
                <p className="text-[10px] font-mono uppercase tracking-widest text-amber-400">Current Committee Snapshot</p>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-zinc-500">President: </span>
                    <span className="text-white font-bold">{data?.executive?.current?.president?.[0]?.name || 'Not placed'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Gen. Secretary: </span>
                    <span className="text-white font-bold">{data?.executive?.current?.generalSecretary?.[0]?.name || 'Not placed'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Total Members: </span>
                    <span className="text-emerald-400 font-bold">{currentPanelMembersCount} members</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Existing Former Panels: </span>
                    <span className="text-zinc-300 font-bold">{formerPanels.length} panels</span>
                  </div>
                </div>
              </div>

              {/* Session / Year Input Field (Required) */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold uppercase tracking-widest text-amber-300 flex items-center justify-between">
                  <span>Corresponding Panel&apos;s Session (Year) *</span>
                  <span className="text-[10px] text-zinc-500 lowercase">e.g. Panel 26 (2025-2026)</span>
                </label>
                <input
                  type="text"
                  value={sessionYearInput}
                  onChange={(e) => {
                    setSessionYearInput(e.target.value);
                    if (sessionYearError) setSessionYearError(null);
                  }}
                  placeholder="e.g. Panel 26 (2025-2026)"
                  className="w-full px-4 py-3 bg-white/5 border border-white/15 focus:border-amber-500 rounded-xl text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none transition-colors"
                  autoFocus
                />
                {sessionYearError && (
                  <p className="text-xs text-red-400 font-mono flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {sessionYearError}
                  </p>
                )}

                {/* Quick Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Suggested:</span>
                  {[
                    suggestedSessionYear,
                    `Panel ${formerPanels.length + 1} (${new Date().getFullYear()}-${new Date().getFullYear() + 1})`,
                    `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`
                  ].map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSessionYearInput(sug)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-amber-300 hover:text-white transition-all cursor-pointer"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Toggle Checkbox */}
              <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pushMode === 'push_and_new'}
                    onChange={(e) => setPushMode(e.target.checked ? 'push_and_new' : 'push_only')}
                    className="w-4 h-4 rounded border-white/20 bg-zinc-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-0"
                  />
                  <div className="space-y-0.5">
                    <p className="text-xs font-mono font-bold text-white">
                      Clear & Initialize New Panel
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      If checked, Current Panel will be reset to an empty state ready for manual member placement.
                    </p>
                  </div>
                </label>
              </div>

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPushModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPushPanel}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-black text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                >
                  <Archive className="w-4 h-4 text-black" />
                  <span>Confirm & Push Panel</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 2: New Panel Confirmation Dialog                                    */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isNewPanelModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-zinc-950 border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative"
            >
              <button
                onClick={() => setIsNewPanelModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-mono font-black uppercase tracking-wider text-white">
                    Start a New Panel?
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    The current panel currently has <span className="text-amber-400 font-bold">{currentPanelMembersCount} active members</span>.
                    To avoid losing records, you can push the current panel into Former Panels first.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsNewPanelModalOpen(false);
                    openPushModal('push_and_new');
                  }}
                  className="w-full p-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-mono font-black text-xs uppercase tracking-wider transition-all flex items-center justify-between gap-4 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Archive className="w-5 h-5" />
                    <div>
                      <p className="font-black">Push to Former Panels First (Recommended)</p>
                      <p className="text-[10px] text-black/70 font-normal">Saves active committee under a session year, then prepares new panel</p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleConfirmBlankNewPanel}
                  className="w-full p-4 rounded-2xl bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/30 text-zinc-300 hover:text-red-400 font-mono font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Plus className="w-5 h-5" />
                    <div>
                      <p>Start Blank Panel Without Pushing</p>
                      <p className="text-[10px] text-zinc-500 font-normal">Overwrites current panel with empty slots immediately</p>
                    </div>
                  </div>
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewPanelModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL 3: Manual Member Placement Dialog                                   */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAddMemberModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl bg-zinc-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => setIsAddMemberModalOpen(false)}
                className="absolute top-5 right-5 p-2 text-zinc-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <UserPlus className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-mono font-black uppercase tracking-wider text-white">
                    Manually Place Panel Member
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Manually enter the member&apos;s photo, full name, and designation for {executiveTab === 'current' ? 'Current Panel' : 'Former Panel'}.
                  </p>
                </div>
              </div>

              <form onSubmit={handlePlaceMemberSubmit} className="space-y-5">
                {/* Designation / Position Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Position Category *
                  </label>
                  <select
                    value={placeCategory}
                    onChange={(e) => {
                      const cat = e.target.value;
                      setPlaceCategory(cat);
                      if (cat === 'president') setPlaceRole('President');
                      else if (cat === 'generalSecretary') setPlaceRole('General Secretary');
                      else if (cat === 'deputyPresidents') setPlaceRole('Deputy President');
                      else if (cat === 'vicePresidents') setPlaceRole('Vice President');
                      else if (cat === 'departments') setPlaceRole('Head of ' + placeDept);
                      else if (cat === 'secretaries.jointSecretary') setPlaceRole('Joint Secretary');
                      else if (cat === 'secretaries.organizingSecretary') setPlaceRole('Organizing Secretary');
                      else if (cat === 'secretaries.asstGeneralSecretary') setPlaceRole('Assistant General Secretary');
                      else if (cat === 'secretaries.correspondingSecretary') setPlaceRole('Corresponding Secretary');
                    }}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-colors cursor-pointer"
                  >
                    <option value="president" className="bg-zinc-900 text-white">President</option>
                    <option value="generalSecretary" className="bg-zinc-900 text-white">General Secretary</option>
                    <option value="deputyPresidents" className="bg-zinc-900 text-white">Deputy President</option>
                    <option value="vicePresidents" className="bg-zinc-900 text-white">Vice President</option>
                    <option value="departments" className="bg-zinc-900 text-white">Department Head</option>
                    <option value="secretaries.jointSecretary" className="bg-zinc-900 text-white">Joint Secretary</option>
                    <option value="secretaries.organizingSecretary" className="bg-zinc-900 text-white">Organizing Secretary</option>
                    <option value="secretaries.asstGeneralSecretary" className="bg-zinc-900 text-white">Assistant General Secretary</option>
                    <option value="secretaries.correspondingSecretary" className="bg-zinc-900 text-white">Corresponding Secretary</option>
                  </select>
                </div>

                {/* Department Name input if Department Head */}
                {placeCategory === 'departments' && (
                  <div className="space-y-2">
                    <label className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                      Department Name *
                    </label>
                    <input
                      type="text"
                      value={placeDept}
                      onChange={(e) => {
                        setPlaceDept(e.target.value);
                        setPlaceRole(`Head of ${e.target.value}`);
                      }}
                      placeholder="e.g. Internal Affairs, Photography, Events"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-colors"
                    />
                  </div>
                )}

                {/* Designation / Role Input */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Designation / Role Title *
                  </label>
                  <input
                    type="text"
                    value={placeRole}
                    onChange={(e) => setPlaceRole(e.target.value)}
                    placeholder="e.g. President, Deputy President (Logistics), Joint Secretary"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-colors"
                  />
                </div>

                {/* Member Full Name */}
                <div className="space-y-2">
                  <label className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={placeName}
                    onChange={(e) => setPlaceName(e.target.value)}
                    placeholder="e.g. Intesher Alam Manam"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 focus:border-amber-500 rounded-xl text-white font-mono text-xs focus:outline-none transition-colors"
                    required
                  />
                </div>

                {/* Member Photo */}
                <div className="space-y-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                  <label className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400 flex items-center justify-between">
                    <span>Member Photo</span>
                    <span className="text-[10px] text-zinc-500">Upload or direct URL</span>
                  </label>

                  <div className="flex items-center gap-4">
                    <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                      {placeImageUrl ? (
                        <Image 
                          src={resolveImageUrl(placeImageUrl)} 
                          alt="Preview" 
                          fill 
                          className="object-cover" 
                          sizes="64px" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600 bg-zinc-900">
                          <ImageIcon className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={placeImageUrl}
                        onChange={(e) => setPlaceImageUrl(e.target.value)}
                        placeholder="Paste image URL (or upload below)"
                        className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white font-mono text-xs focus:outline-none"
                      />
                      <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white font-mono text-[11px] cursor-pointer border border-white/10 transition-colors">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span>Choose Photo File</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,.webp"
                          className="hidden"
                          onChange={(e) => {
                            handleFileUpload(e, undefined, (uploadedUrl) => {
                              setPlaceImageUrl(uploadedUrl);
                            });
                          }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddMemberModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-mono font-black uppercase tracking-wider transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-black" />
                    <span>Place Member in Panel</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export const DashboardPanelSection = React.memo(DashboardPanelSectionComponent);
DashboardPanelSection.displayName = 'DashboardPanelSection';
