"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Database, 
  Shield, 
  Award, 
  Trash2, 
  Search, 
  Loader2, 
  ChevronRight,
  DatabaseZap,
  Activity,
  AlertCircle,
  Plus,
  ShieldAlert,
  Mail,
  CheckCircle2,
  XCircle,
  Utensils,
  Lock,
  Unlock,
  Volume2,
  QrCode,
  Printer,
  Sliders,
  Coins,
  Save,
  Trophy,
  SlidersHorizontal,
  Globe,
  ImageIcon,
  Upload,
  Check
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';
import { DashboardFormField } from './DashboardFormField';
import { SupportManagement } from './SupportManagement';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { cleanDisplayEmail } from '../../lib/utils';

const QRCode = dynamic(() => import('../QRCode'), { ssr: false });

interface SuperAdminPanelProps {
  isSuperAdmin?: boolean;
}

export function RegistrationToggleControl() {
  const [isEnabled, setIsEnabled] = useState<boolean>(true);
  const [isIntraEnabled, setIsIntraEnabled] = useState<boolean>(true);
  const [isInterEnabled, setIsInterEnabled] = useState<boolean>(true);
  const [isInterRegEnabled, setIsInterRegEnabled] = useState<boolean>(true);
  const [primaryRegTarget, setPrimaryRegTarget] = useState<'intra' | 'inter'>('inter');
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStatuses() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('key, value');

        if (error) throw error;
        
        if (data) {
          const reg = data.find(item => item.key === 'event_registration_enabled');
          const intra = data.find(item => item.key === 'visit_intra_enabled');
          const inter = data.find(item => item.key === 'visit_inter_enabled');
          const interReg = data.find(item => item.key === 'inter_registration_enabled');
          const targetItem = data.find(item => item.key === 'primary_registration_target');

          if (reg) setIsEnabled(reg.value === true);
          if (intra) setIsIntraEnabled(intra.value === true);
          if (inter) setIsInterEnabled(inter.value === true);
          if (interReg) setIsInterRegEnabled(interReg.value === true);
          if (targetItem) setPrimaryRegTarget(targetItem.value === 'intra' ? 'intra' : 'inter');

          // Insert defaults if missing
          if (!intra) {
            await supabase.from('system_settings').upsert({ key: 'visit_intra_enabled', value: true });
            setIsIntraEnabled(true);
          }
          if (!inter) {
            await supabase.from('system_settings').upsert({ key: 'visit_inter_enabled', value: true });
            setIsInterEnabled(true);
          }
          if (!interReg) {
            await supabase.from('system_settings').upsert({ key: 'inter_registration_enabled', value: true });
            setIsInterRegEnabled(true);
          }
          if (!targetItem) {
            await supabase.from('system_settings').upsert({ key: 'primary_registration_target', value: 'inter' });
            setPrimaryRegTarget('inter');
          }
        } else {
          // Attempt to insert default values
          await supabase.from('system_settings').upsert({ key: 'event_registration_enabled', value: true });
          await supabase.from('system_settings').upsert({ key: 'visit_intra_enabled', value: true });
          await supabase.from('system_settings').upsert({ key: 'visit_inter_enabled', value: true });
          await supabase.from('system_settings').upsert({ key: 'inter_registration_enabled', value: true });
          await supabase.from('system_settings').upsert({ key: 'primary_registration_target', value: 'inter' });
        }
      } catch (err: any) {
        if (err?.code === '42P01') {
          console.warn("Table 'system_settings' does not exist yet. Please run DB setup schema.", err);
        } else {
          console.warn('Failed to load status values gracefully:', err);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchStatuses();
  }, []);

  const handleToggleRegTarget = async (target: 'intra' | 'inter') => {
    setUpdating(true);
    setStatusMessage(null);
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'primary_registration_target',
          value: target,
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.message?.includes("relation") || error.code === '42P01') {
          throw new Error("The settings table ('system_settings') is not yet created in Supabase.");
        }
        throw error;
      }
      setPrimaryRegTarget(target);
      setStatusMessage(`Default "Register Now" form target set to ${target.toUpperCase()}-SCHOOL REGISTRATION.`);
    } catch (err: any) {
      console.error('Failed to update primary_registration_target status', err);
      setStatusMessage(`Error: ${err.message || 'Could not update target.'}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleToggleKey = async (key: string, currentValue: boolean, setter: (val: boolean) => void, label: string) => {
    setUpdating(true);
    setStatusMessage(null);
    const nextState = !currentValue;
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: key,
          value: nextState,
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.message?.includes("relation") || error.code === '42P01') {
          throw new Error("The settings table ('system_settings') is not yet created in Supabase. Please execute the SQL schema creation block first.");
        }
        throw error;
      }
      setter(nextState);
      setStatusMessage(`${label} is now ${nextState ? 'ONLINE & ENABLED' : 'OFFLINE & LOCKED'}.`);
    } catch (err: any) {
      console.error(`Failed to update ${key} status`, err);
      setStatusMessage(`Error: ${err.message || 'Could not update status.'}`);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse bg-white/[0.02] border border-white/5 rounded-3xl p-8 flex items-center justify-between">
            <div className="space-y-2 w-1/2">
              <div className="h-4 bg-white/10 rounded w-1/3"></div>
              <div className="h-3 bg-white/5 rounded w-2/3"></div>
            </div>
            <div className="h-8 bg-white/10 rounded-full w-14"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8">
      {/* 1. Registration form toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${isEnabled ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Event Registration Form Toggle</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              Control whether normal users can access any event/segment registration forms. Setting this offline blocks new submissions and acts as a firewall.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleKey('event_registration_enabled', isEnabled, setIsEnabled, 'Event registration')}
          disabled={updating}
          className={`relative inline-flex h-9 w-18 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isEnabled ? 'bg-green-500' : 'bg-zinc-850'
          } ${updating ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              isEnabled ? 'translate-x-[40px]' : 'translate-x-[4px]'
            }`}
          />
        </button>
      </div>

      {/* 2. Intra events visit toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${isIntraEnabled ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Intra-School Event Page Access</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              Control whether users can visit the Intra-school Mathematics Competitions Hub. Setting this offline displays an "Access Disabled" message.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleKey('visit_intra_enabled', isIntraEnabled, setIsIntraEnabled, 'Intra-school event page access')}
          disabled={updating}
          className={`relative inline-flex h-9 w-18 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isIntraEnabled ? 'bg-indigo-500' : 'bg-zinc-850'
          } ${updating ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              isIntraEnabled ? 'translate-x-[40px]' : 'translate-x-[4px]'
            }`}
          />
        </button>
      </div>

      {/* 3. Inter events visit toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${isInterEnabled ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Inter-School Event Page Access</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              Control whether users can visit the Inter-school Mathematics Portal. Setting this offline displays an "Access Disabled" message.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleKey('visit_inter_enabled', isInterEnabled, setIsInterEnabled, 'Inter-school event page access')}
          disabled={updating}
          className={`relative inline-flex h-9 w-18 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isInterEnabled ? 'bg-purple-500' : 'bg-zinc-850'
          } ${updating ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              isInterEnabled ? 'translate-x-[40px]' : 'translate-x-[4px]'
            }`}
          />
        </button>
      </div>

      {/* 4. Inter events registration gateway toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-white/5">
        <div className="flex items-start gap-4">
          <div className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${isInterRegEnabled ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-red-500/10 border-red-500/20 text-red-500 animate-pulse'}`}>
            <Globe className="w-7 h-7" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Inter-School Registration Gateway</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              Toggle the visitor Inter-School registration form availability. Locking this disables registrations and shows a "Registration Locked" warning.
            </p>
          </div>
        </div>

        <button
          onClick={() => handleToggleKey('inter_registration_enabled', isInterRegEnabled, setIsInterRegEnabled, 'Inter-school registration gateway')}
          disabled={updating}
          className={`relative inline-flex h-9 w-18 items-center rounded-full transition-colors duration-300 focus:outline-none ${
            isInterRegEnabled ? 'bg-pink-500' : 'bg-zinc-850'
          } ${updating ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-7 w-7 transform rounded-full bg-white transition-transform duration-300 shadow-lg ${
              isInterRegEnabled ? 'translate-x-[40px]' : 'translate-x-[4px]'
            }`}
          />
        </button>
      </div>

      {/* 5. Primary Registration Form Target Toggle (Intra vs Inter) */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-4 rounded-2xl flex items-center justify-center border bg-gradient-to-br from-pink-500/20 to-purple-500/20 border-pink-500/30 text-pink-400">
            <SlidersHorizontal className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-white text-lg uppercase tracking-tight">Default "Register Now" Target</h3>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest text-pink-400 px-2 py-0.5 bg-pink-500/10 rounded border border-pink-500/20">
                ACTIVE: {primaryRegTarget.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-zinc-500 mt-1 max-w-md leading-relaxed">
              Select which registration form opens when visitors click "Register Now" buttons across the platform.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-zinc-900/90 p-1.5 rounded-2xl border border-white/10 shadow-inner">
          <button
            type="button"
            onClick={() => handleToggleRegTarget('intra')}
            disabled={updating}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 select-none ${
              primaryRegTarget === 'intra' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 border border-indigo-400/30' 
                : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🏫 Intra-School
          </button>
          <button
            type="button"
            onClick={() => handleToggleRegTarget('inter')}
            disabled={updating}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 select-none ${
              primaryRegTarget === 'inter' 
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg shadow-pink-500/30 border border-pink-400/30' 
                : 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10 border border-transparent'
            } ${updating ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            🌐 Inter-School
          </button>
        </div>
      </div>

      {statusMessage && (
        <div className={`flex items-start gap-3 p-4 rounded-2xl border text-xs font-bold uppercase tracking-wide leading-relaxed ${
          statusMessage.startsWith('Error') 
            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
            : 'bg-green-500/10 border-green-500/20 text-green-400'
        }`}>
          {statusMessage.startsWith('Error') ? <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 mt-0.5 shrink-0" />}
          <div className="flex-1">
            <p className="font-extrabold">{statusMessage}</p>
            {statusMessage.includes("relation") && (
              <div className="mt-2 text-[10px] text-zinc-400 font-mono tracking-normal normal-case border-t border-white/5 pt-2 space-y-1 bg-black/20 p-2.5 rounded-lg border">
                <p className="font-bold text-amber-500/90 uppercase tracking-wider text-[9px]">⚠️ Setup Action Required:</p>
                <p>Run the SQL in your Supabase SQL Editor to provision the settings table:</p>
                <pre className="text-zinc-500 mt-1 select-all overflow-x-auto whitespace-pre p-2 rounded bg-black">
{`CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
INSERT INTO public.system_settings (key, value) VALUES ('event_registration_enabled', 'true'::jsonb);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access to system settings" ON public.system_settings FOR SELECT USING (true);
CREATE POLICY "Allow admins to insert/update system settings" ON public.system_settings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);`}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Database Schema Setup & Integration Helper Box */}
      <div className="p-6 rounded-2xl bg-amber-500/5 border border-amber-500/10 space-y-3.5">
        <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2">
           <Activity className="w-4 h-4 text-amber-500" />
           Integration Ledger Guide
        </h4>
        <div className="space-y-2 text-[10px] text-zinc-400 leading-relaxed uppercase tracking-wider">
          <p>1. <strong className="text-white">Authorizing controls</strong>: The status database switch reflects instantly system-wide.</p>
          <p>2. <strong className="text-white">Standard Users</strong>: Access is completely firewalled. Attempting to click registration URLs redirects to the registration closed dashboard.</p>
          <p>3. <strong className="text-white">Admin override</strong>: Administrators and Super Admins retain the license to bypass registration lockdowns for testing purposes.</p>
        </div>
      </div>
    </div>
  );
}

interface TeamEventConfig {
  name: string;
  price: number;
  memberCount: number;
  eligibleCategories: string;
  description: string;
}

export function EventRegistrationConfigEditor({ showToast }: { showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  // Settings Form States
  const [formDescription, setFormDescription] = useState<string>('');
  const [bkashNumber, setBkashNumber] = useState<string>('');
  const [perEventPriceSolo, setPerEventPriceSolo] = useState<number>(100);
  const [allEventsSoloPriceGeneral, setAllEventsSoloPriceGeneral] = useState<number>(100);
  const [allEventsSoloPriceMember, setAllEventsSoloPriceMember] = useState<number>(50);
  
  // Lists States
  const [soloEvents, setSoloEvents] = useState<string[]>([]);
  const [teamEvents, setTeamEvents] = useState<TeamEventConfig[]>([]);
  const [classSectionsMap, setClassSectionsMap] = useState<Record<string, string[]>>({});
  
  // Inline addition helper states
  const [selectedClassForSectionEdit, setSelectedClassForSectionEdit] = useState<string>('3');
  const [newSectionName, setNewSectionName] = useState<string>('');
  const [newSoloName, setNewSoloName] = useState<string>('');
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamPrice, setNewTeamPrice] = useState<number>(200);
  const [newTeamMemberCount, setNewTeamMemberCount] = useState<number>(2);
  const [newTeamCategory, setNewTeamCategory] = useState<string>('secondary_higher_secondary');
  const [newTeamDesc, setNewTeamDesc] = useState<string>('');

  const DEFAULT_CONFIG = {
    formDescription: "Specify the category format. Standard events are priced at 100tk each. Select all to enjoy premium package bundles.",
    perEventPriceSolo: 100,
    allEventsSoloPriceGeneral: 100,
    allEventsSoloPriceMember: 50,
    bkashNumber: "01712345678",
    soloEvents: [
      "Math Olympiad",
      "IQ Test",
      "Probability Pressure",
      "Human Calculator",
      "Calculus Bee",
      "Geometry Dash",
      "Rubik's Cube",
      "Sudoku",
      "Cryptomania",
      "Singularity"
    ],
    teamEvents: [
      {
        name: "Tic-Tac-Toe",
        price: 300,
        memberCount: 3,
        eligibleCategories: "primary_junior",
        description: "Class 3 to 8 (Primary & Junior) Team Showdown. Includes 3 members."
      },
      {
        name: "Escape Room",
        price: 200,
        memberCount: 2,
        eligibleCategories: "secondary_higher_secondary",
        description: "Class 9 to 12 (Secondary & Higher Secondary) strategic room puzzles. Includes 2 members."
      }
    ],
    classSectionsMap: {
      "3": ["Hawks", "Eagles", "Falcons"],
      "4": ["Tigers", "Lions", "Mountain Lions"],
      "5": ["Hornets", "Drones", "Wasps"],
      "6": ["Wildcats", "Bears", "Polar Bears"],
      "7": ["Leopards", "Jaguars"],
      "8": ["Comets", "Meteors", "Asteroids"],
      "9": ["Jets", "Concords", "Rockets"],
      "10": ["Stars", "Giants", "Titans"],
      "11": ["Venus", "Jupiter", "Mercury", "Haumea", "Eris", "Mars", "Saturn", "Vulcan"],
      "12": ["Pluto", "Uranus", "Phobos", "Pollux", "Ceres", "Earth", "Neptune", "Diebos"]
    }
  };

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'event_registration_config')
          .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
          const val = data.value;
          setFormDescription(val.formDescription || DEFAULT_CONFIG.formDescription);
          setBkashNumber(val.bkashNumber || DEFAULT_CONFIG.bkashNumber);
          setPerEventPriceSolo(typeof val.perEventPriceSolo === 'number' ? val.perEventPriceSolo : DEFAULT_CONFIG.perEventPriceSolo);
          setAllEventsSoloPriceGeneral(typeof val.allEventsSoloPriceGeneral === 'number' ? val.allEventsSoloPriceGeneral : DEFAULT_CONFIG.allEventsSoloPriceGeneral);
          setAllEventsSoloPriceMember(typeof val.allEventsSoloPriceMember === 'number' ? val.allEventsSoloPriceMember : DEFAULT_CONFIG.allEventsSoloPriceMember);
          setSoloEvents(val.soloEvents || DEFAULT_CONFIG.soloEvents);
          setTeamEvents(val.teamEvents || DEFAULT_CONFIG.teamEvents);
          setClassSectionsMap(val.classSectionsMap || DEFAULT_CONFIG.classSectionsMap);
        } else {
          // Initialize DB row
          await supabase
            .from('system_settings')
            .upsert({ key: 'event_registration_config', value: DEFAULT_CONFIG });

          setFormDescription(DEFAULT_CONFIG.formDescription);
          setBkashNumber(DEFAULT_CONFIG.bkashNumber);
          setPerEventPriceSolo(DEFAULT_CONFIG.perEventPriceSolo);
          setAllEventsSoloPriceGeneral(DEFAULT_CONFIG.allEventsSoloPriceGeneral);
          setAllEventsSoloPriceMember(DEFAULT_CONFIG.allEventsSoloPriceMember);
          setSoloEvents(DEFAULT_CONFIG.soloEvents);
          setTeamEvents(DEFAULT_CONFIG.teamEvents);
          setClassSectionsMap(DEFAULT_CONFIG.classSectionsMap);
        }
      } catch (err: any) {
        console.warn("Failed to load custom settings row:", err);
        // Fallback states to original defaults
        setFormDescription(DEFAULT_CONFIG.formDescription);
        setBkashNumber(DEFAULT_CONFIG.bkashNumber);
        setPerEventPriceSolo(DEFAULT_CONFIG.perEventPriceSolo);
        setAllEventsSoloPriceGeneral(DEFAULT_CONFIG.allEventsSoloPriceGeneral);
        setAllEventsSoloPriceMember(DEFAULT_CONFIG.allEventsSoloPriceMember);
        setSoloEvents(DEFAULT_CONFIG.soloEvents);
        setTeamEvents(DEFAULT_CONFIG.teamEvents);
        setClassSectionsMap(DEFAULT_CONFIG.classSectionsMap);
      } finally {
        setLoading(false);
      }
    }
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      formDescription,
      bkashNumber,
      perEventPriceSolo: Number(perEventPriceSolo),
      allEventsSoloPriceGeneral: Number(allEventsSoloPriceGeneral),
      allEventsSoloPriceMember: Number(allEventsSoloPriceMember),
      soloEvents,
      teamEvents,
      classSectionsMap
    };

    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'event_registration_config',
          value: payload,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast("Event registration wizard parameters updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to save event parameters: " + (err.message || err.details || "Check RLS policies."), "error");
    } finally {
      setSaving(false);
    }
  };

  const latestSaveRef = React.useRef(handleSave);
  React.useEffect(() => {
    latestSaveRef.current = handleSave;
  });

  React.useEffect(() => {
    const handleGlobalSave = () => {
      latestSaveRef.current();
    };
    window.addEventListener('admin-dashboard-save', handleGlobalSave);
    return () => {
      window.removeEventListener('admin-dashboard-save', handleGlobalSave);
    };
  }, []);

  const handleResetToDefault = () => {
    if (window.confirm("Are you sure you want to reset all registration configuration properties back to factory JMC defaults?")) {
      setFormDescription(DEFAULT_CONFIG.formDescription);
      setBkashNumber(DEFAULT_CONFIG.bkashNumber);
      setPerEventPriceSolo(DEFAULT_CONFIG.perEventPriceSolo);
      setAllEventsSoloPriceGeneral(DEFAULT_CONFIG.allEventsSoloPriceGeneral);
      setAllEventsSoloPriceMember(DEFAULT_CONFIG.allEventsSoloPriceMember);
      setSoloEvents(DEFAULT_CONFIG.soloEvents);
      setTeamEvents(DEFAULT_CONFIG.teamEvents);
      setClassSectionsMap(DEFAULT_CONFIG.classSectionsMap);
      showToast("Fields reverted locally. Make sure to click save to write changes permanently.", "info");
    }
  };

  // Solo events helper actions
  const addSoloEvent = () => {
    const trimmed = newSoloName.trim();
    if (!trimmed) return;
    if (soloEvents.some(se => se.toLowerCase() === trimmed.toLowerCase())) {
      showToast("Event already exists in the catalog.", "error");
      return;
    }
    setSoloEvents([...soloEvents, trimmed]);
    setNewSoloName('');
  };

  const removeSoloEvent = (indexToRemove: number) => {
    setSoloEvents(soloEvents.filter((_, idx) => idx !== indexToRemove));
  };

  // Sections helper actions
  const addSectionForClass = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    const currentSections = classSectionsMap[selectedClassForSectionEdit] || [];
    if (currentSections.some(sec => sec.toLowerCase() === trimmed.toLowerCase())) {
      showToast(`Section "${trimmed}" already exists for Class ${selectedClassForSectionEdit}.`, "error");
      return;
    }
    setClassSectionsMap({
      ...classSectionsMap,
      [selectedClassForSectionEdit]: [...currentSections, trimmed]
    });
    setNewSectionName('');
  };

  const removeSectionFromClass = (sectionToRemove: string) => {
    const currentSections = classSectionsMap[selectedClassForSectionEdit] || [];
    setClassSectionsMap({
      ...classSectionsMap,
      [selectedClassForSectionEdit]: currentSections.filter(sec => sec !== sectionToRemove)
    });
  };

  // Team events helper actions
  const addTeamEvent = () => {
    const nameTrimmed = newTeamName.trim();
    if (!nameTrimmed) {
      showToast("Please provide a team event identifier title.", "error");
      return;
    }
    if (teamEvents.some(te => te.name.toLowerCase() === nameTrimmed.toLowerCase())) {
      showToast("Team event with that identifier already exists.", "error");
      return;
    }
    
    const newEvent: TeamEventConfig = {
      name: nameTrimmed,
      price: Number(newTeamPrice),
      memberCount: Number(newTeamMemberCount),
      eligibleCategories: newTeamCategory,
      description: newTeamDesc.trim() || `${nameTrimmed} general championship`
    };

    setTeamEvents([...teamEvents, newEvent]);
    setNewTeamName('');
    setNewTeamPrice(200);
    setNewTeamMemberCount(2);
    setNewTeamCategory('secondary_higher_secondary');
    setNewTeamDesc('');
    showToast(`Added team event "${nameTrimmed}" to configuration list.`, "success");
  };

  const removeTeamEvent = (indexToRemove: number) => {
    setTeamEvents(teamEvents.filter((_, idx) => idx !== indexToRemove));
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-4">
        <div className="h-4 bg-white/10 rounded w-1/4"></div>
        <div className="h-20 bg-white/5 rounded w-full"></div>
        <div className="h-10 bg-white/5 rounded w-1/3"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8">
      {/* Basic Form parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 col-span-1 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Form Promotional Description / Category Tagline</label>
          <textarea
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all [resize:none]"
            placeholder="Introduce the solo event prices and bundle details..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Official bKash Target Number (Receiver)</label>
          <input
            type="text"
            value={bkashNumber}
            onChange={(e) => setBkashNumber(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
            placeholder="01XXXXXXXXX"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Solo Event Price (Per Checked Segment BDT)</label>
          <input
            type="number"
            value={perEventPriceSolo}
            onChange={(e) => setPerEventPriceSolo(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
            placeholder="50"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">All-Solo-Events Bundle - General Users (BDT)</label>
          <input
            type="number"
            value={allEventsSoloPriceGeneral}
            onChange={(e) => setAllEventsSoloPriceGeneral(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
            placeholder="100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">All-Solo-Events Bundle - JMC Members (BDT)</label>
          <input
            type="number"
            value={allEventsSoloPriceMember}
            onChange={(e) => setAllEventsSoloPriceMember(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
            placeholder="50"
          />
        </div>
      </div>

      {/* Solo Events List Component */}
      <div className="space-y-4 pb-6 border-b border-white/5">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Trophy className="w-4 h-4 text-indigo-400" />
            1. Solo-Event Catalog Catalysts ({soloEvents.length})
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1">Manage standard solo challenges that users can register for in Step 2 of the form.</p>
        </div>

        <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-black/20 border border-white/5">
          {soloEvents.length === 0 ? (
            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider py-1">No solo events configured.</span>
          ) : (
            soloEvents.map((event, idx) => (
              <span 
                key={idx} 
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white"
              >
                {event}
                <button 
                  type="button" 
                  onClick={() => removeSoloEvent(idx)} 
                  className="text-zinc-500 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex gap-2 max-w-md">
          <input
            type="text"
            value={newSoloName}
            onChange={(e) => setNewSoloName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSoloEvent())}
            placeholder="E.g. Math Relay Championship"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
          />
          <button
            type="button"
            onClick={addSoloEvent}
            className="px-4 py-2 text-xs bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
          >
            <Plus className="w-3.5 h-3.5" /> ADD
          </button>
        </div>
      </div>

      {/* Class Sections Configuration */}
      <div className="space-y-4 pb-6 border-b border-white/5">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-indigo-400" />
            2. Class-wise Section Dropdowns
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1">Configure dropdown choices for sections based on the participant's Class. (Be sure to click Save below to persist your modifications!)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Select Class to Configure</label>
            <select
              value={selectedClassForSectionEdit}
              onChange={(e) => setSelectedClassForSectionEdit(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all cursor-pointer"
            >
              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                <option key={n} value={String(n)} className="bg-zinc-950 text-white">Class {n}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-3">
            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-500">Current Sections for Class {selectedClassForSectionEdit}</label>
            
            <div className="flex flex-wrap gap-2.5 p-4 rounded-2xl bg-black/20 border border-white/5 min-h-[58px]">
              {!(classSectionsMap[selectedClassForSectionEdit]) || classSectionsMap[selectedClassForSectionEdit].length === 0 ? (
                <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider py-1">No sections configured for Class {selectedClassForSectionEdit}.</span>
              ) : (
                classSectionsMap[selectedClassForSectionEdit].map((sec, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-wider text-white"
                  >
                    {sec}
                    <button 
                      type="button" 
                      onClick={() => removeSectionFromClass(sec)} 
                      className="text-zinc-500 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>

            <div className="flex gap-2 max-w-md">
              <input
                type="text"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSectionForClass())}
                placeholder="E.g. Hawks"
                className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all"
              />
              <button
                type="button"
                onClick={addSectionForClass}
                className="px-4 py-2 text-xs bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/10"
              >
                <Plus className="w-3.5 h-3.5" /> ADD
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Team Events config */}
      <div className="space-y-4 pb-6">
        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-400" />
            3. Team Event Configurations ({teamEvents.length})
          </h4>
          <p className="text-[10px] text-zinc-500 mt-1">Configure active team category registrations, including registration price and teammate caps.</p>
        </div>

        {/* Existing Team Events list */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {teamEvents.map((te, idx) => (
            <div key={idx} className="p-5 rounded-2xl bg-black/30 border border-white/10 relative overflow-hidden group">
              <button
                type="button"
                onClick={() => removeTeamEvent(idx)}
                className="absolute right-4 top-4 text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                title="Delete this event"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="space-y-2">
                <span className="px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                  {te.eligibleCategories === 'all' ? 'All Classes' : te.eligibleCategories === 'primary_junior' ? 'Class 3-8' : 'Class 9-12'}
                </span>
                <h5 className="text-xs font-extrabold text-white uppercase tracking-tight">{te.name}</h5>
                <p className="text-[10px] text-zinc-500 leading-relaxed font-semibold italic">"{te.description}"</p>
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  <div>
                    <span className="block text-[8px] text-zinc-600">Entry BDT Fee:</span>
                    <span className="text-white font-black">{te.price} BDT</span>
                  </div>
                  <div>
                    <span className="block text-[8px] text-zinc-600">Required Members:</span>
                    <span className="text-white font-black">{te.memberCount} Participants</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Builder Panel to add team event */}
        <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
          <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Add Custom Team Category Challenge</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Event Name Title</span>
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="E.g. Math Relays"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Registration Price / BDT</span>
              <input
                type="number"
                value={newTeamPrice}
                onChange={(e) => setNewTeamPrice(Number(e.target.value))}
                placeholder="300"
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Mandatory Member Count</span>
              <select
                value={newTeamMemberCount}
                onChange={(e) => setNewTeamMemberCount(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value={2} className="bg-zinc-900 text-white">2 Members total</option>
                <option value={3} className="bg-zinc-900 text-white">3 Members total</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-1">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Class Category Grouping</span>
              <select
                value={newTeamCategory}
                onChange={(e) => setNewTeamCategory(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none cursor-pointer"
              >
                <option value="primary_junior" className="bg-zinc-900 text-white">Class 3 to 8 (Primary & Junior)</option>
                <option value="secondary_higher_secondary" className="bg-zinc-900 text-white">Class 9 to 12 (Secondary & Higher Secondary)</option>
                <option value="all" className="bg-zinc-900 text-white">All Class Levels</option>
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <span className="text-[8px] font-black uppercase tracking-wider text-zinc-500">Short Subheading Description</span>
              <input
                type="text"
                value={newTeamDesc}
                onChange={(e) => setNewTeamDesc(e.target.value)}
                placeholder="Class 3 to 8 speed math relay challenge..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={addTeamEvent}
              className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500 text-indigo-400 hover:text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-500/30"
            >
              <Plus className="w-3.5 h-3.5" /> ADD TEAM EVENT TYPE
            </button>
          </div>
        </div>
      </div>

      {/* Editor footer actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-4 border-t border-white/5">
        <button
          type="button"
          onClick={handleResetToDefault}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/5 hover:bg-white/5 text-zinc-400 hover:text-white text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
        >
          Reset to Factory Defaults
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-500 hover:bg-indigo-400 hover:scale-[1.02] text-white active:scale-95 text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          SAVE EVENT AND PRICING VALUES
        </button>
      </div>
    </div>
  );
}

export function InterEventRegistrationConfigEditor({ showToast }: { showToast: (msg: string, type: 'success' | 'error' | 'info') => void }) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  
  const [bkashNumber, setBkashNumber] = useState<string>('');
  const [paymentDescription, setPaymentDescription] = useState<string>('');
  const [pricePerSegment, setPricePerSegment] = useState<number>(150);
  const [caCodes, setCaCodes] = useState<string[]>([]);
  const [newCaCode, setNewCaCode] = useState<string>('');

  // Event Page Launch & Teaser Video States
  const [isEventPageLaunched, setIsEventPageLaunched] = useState<boolean>(false);
  const [teaserVideoEnabled, setTeaserVideoEnabled] = useState<boolean>(true);
  const [teaserVideoUrl, setTeaserVideoUrl] = useState<string>('https://vjs.zencdn.net/v/oceans.mp4');
  const [uploadingVideo, setUploadingVideo] = useState<boolean>(false);

  // Segment Banners & Brief Descriptions Customizer States
  const [segmentBanners, setSegmentBanners] = useState<Record<string, string>>({});
  const [segmentDescriptions, setSegmentDescriptions] = useState<Record<string, string>>({});
  const [selectedSegmentForEdit, setSelectedSegmentForEdit] = useState<string>("Math Olympiad (Find-based)");
  const [editingBannerUrl, setEditingBannerUrl] = useState<string>("");
  const [editingDescription, setEditingDescription] = useState<string>("");
  const [uploadingSegmentBanner, setUploadingSegmentBanner] = useState<boolean>(false);

  const ALL_INTER_SEGMENT_NAMES = [
    "Math Olympiad (Find-based)",
    "Math Olympiad (Proof-based)",
    "IQ Test",
    "Human Calculator",
    "Genesis",
    "Geometry Dash",
    "Probability Pressure",
    "Murder Mystery",
    "Crack the Code",
    "Complex Calamity",
    "Sudoku",
    "Rubik’s Cube Showdown",
    "5 min Professor",
    "Calculus Bee",
    "Escape Room",
    "Combi Verse",
    "Math Memes",
    "Math Article",
    "Math Vision",
    "Math Drawing",
    "Truss",
    "Wall Magazine Display"
  ];

  const DEFAULT_INTER_CONFIG = {
    bkashNumber: "01789456123",
    paymentDescription: "Please pay BDT 150 per event segment to our bKash personal/merchant account. Highlighted Phone: 01789456123. If you use a valid Campus Ambassador (CA) code, you will get a discount!",
    pricePerSegment: 150,
    caCodes: [],
    isEventPageLaunched: false,
    teaserVideoEnabled: true,
    teaserVideoUrl: "https://vjs.zencdn.net/v/oceans.mp4",
    segmentBanners: {},
    segmentDescriptions: {}
  };

  useEffect(() => {
    async function loadInterConfig() {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'inter_registration_config')
          .maybeSingle();

        if (error) throw error;

        if (data && data.value) {
          let val = data.value;
          if (typeof val === 'string') {
            try {
              val = JSON.parse(val);
            } catch (e) {
              console.warn("Could not parse inter_registration_config JSON string in admin panel:", e);
            }
          }
          if (val && typeof val === 'object') {
            setBkashNumber(val.bkashNumber || DEFAULT_INTER_CONFIG.bkashNumber);
            setPaymentDescription(val.paymentDescription || DEFAULT_INTER_CONFIG.paymentDescription);
            setPricePerSegment(typeof val.pricePerSegment === 'number' ? val.pricePerSegment : DEFAULT_INTER_CONFIG.pricePerSegment);
            setCaCodes(val.caCodes || DEFAULT_INTER_CONFIG.caCodes);
            setIsEventPageLaunched(Boolean(val.isEventPageLaunched));
            setTeaserVideoEnabled(val.teaserVideoEnabled !== false);
            setTeaserVideoUrl(val.teaserVideoUrl || DEFAULT_INTER_CONFIG.teaserVideoUrl);
            if (val.segmentBanners && typeof val.segmentBanners === 'object') {
              setSegmentBanners(val.segmentBanners);
            }
            if (val.segmentDescriptions && typeof val.segmentDescriptions === 'object') {
              setSegmentDescriptions(val.segmentDescriptions);
            }
          }
        } else {
          // Seed
          await supabase
            .from('system_settings')
            .upsert({ key: 'inter_registration_config', value: DEFAULT_INTER_CONFIG });

          setBkashNumber(DEFAULT_INTER_CONFIG.bkashNumber);
          setPaymentDescription(DEFAULT_INTER_CONFIG.paymentDescription);
          setPricePerSegment(DEFAULT_INTER_CONFIG.pricePerSegment);
          setCaCodes(DEFAULT_INTER_CONFIG.caCodes);
          setIsEventPageLaunched(DEFAULT_INTER_CONFIG.isEventPageLaunched);
          setTeaserVideoEnabled(DEFAULT_INTER_CONFIG.teaserVideoEnabled);
          setTeaserVideoUrl(DEFAULT_INTER_CONFIG.teaserVideoUrl);
          setSegmentBanners({});
          setSegmentDescriptions({});
        }
      } catch (err) {
        console.warn("Failed to load inter config", err);
        setBkashNumber(DEFAULT_INTER_CONFIG.bkashNumber);
        setPaymentDescription(DEFAULT_INTER_CONFIG.paymentDescription);
        setPricePerSegment(DEFAULT_INTER_CONFIG.pricePerSegment);
        setCaCodes(DEFAULT_INTER_CONFIG.caCodes);
        setIsEventPageLaunched(DEFAULT_INTER_CONFIG.isEventPageLaunched);
        setTeaserVideoEnabled(DEFAULT_INTER_CONFIG.teaserVideoEnabled);
        setTeaserVideoUrl(DEFAULT_INTER_CONFIG.teaserVideoUrl);
      } finally {
        setLoading(false);
      }
    }
    loadInterConfig();
  }, []);

  // Synchronize active segment being edited in Super Admin editor
  useEffect(() => {
    setEditingBannerUrl(segmentBanners[selectedSegmentForEdit] || '');
    setEditingDescription(segmentDescriptions[selectedSegmentForEdit] || '');
  }, [selectedSegmentForEdit, segmentBanners, segmentDescriptions]);

  const handleApplySegmentEdit = () => {
    setSegmentBanners(prev => ({ ...prev, [selectedSegmentForEdit]: editingBannerUrl }));
    setSegmentDescriptions(prev => ({ ...prev, [selectedSegmentForEdit]: editingDescription }));
    showToast(`Updated parameters for "${selectedSegmentForEdit}". Click 'Save System Settings' to publish!`, "success");
  };

  const handleSegmentBannerFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast("Please select a valid image file (.png, .jpg, .webp, .jpeg)", "error");
      return;
    }

    setUploadingSegmentBanner(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const url = data.url || data.publicUrl || data.fileUrl;
        if (url) {
          setEditingBannerUrl(url);
          setSegmentBanners(prev => ({ ...prev, [selectedSegmentForEdit]: url }));
          showToast(`Banner image uploaded & set for "${selectedSegmentForEdit}"!`, "success");
        }
      } else {
        showToast("Upload failed, please try an external image URL or check network", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error uploading segment banner image", "error");
    } finally {
      setUploadingSegmentBanner(false);
    }
  };

  const handleSave = async (updatedLaunchState?: boolean) => {
    setSaving(true);
    const targetLaunch = updatedLaunchState !== undefined ? updatedLaunchState : isEventPageLaunched;
    const payload = {
      bkashNumber,
      paymentDescription,
      pricePerSegment: Number(pricePerSegment),
      caCodes,
      isEventPageLaunched: targetLaunch,
      teaserVideoEnabled,
      teaserVideoUrl,
      segmentBanners,
      segmentDescriptions
    };
    try {
      const { error } = await supabase
        .from('system_settings')
        .upsert({
          key: 'inter_registration_config',
          value: payload,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      showToast("Inter-school registration parameters updated successfully!", "success");
    } catch (err: any) {
      console.error(err);
      showToast("Failed to save inter configuration: " + (err.message || "Check Supabase settings"), "error");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleLaunch = async (launch: boolean) => {
    setIsEventPageLaunched(launch);
    await handleSave(launch);
    if (launch) {
      showToast("🚀 EVENT PAGE LAUNCHED SUCCESSFULLY! Visitors now access the registration form directly.", "success");
    } else {
      showToast("↺ REVERTED TO PRE-LAUNCH MODE! Video teaser & Coming Soon window are active.", "info");
    }
  };

  const handleVideoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      showToast("Please select a valid video file (.mp4, .webm, .mov)", "error");
      return;
    }

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url || data.publicUrl || data.fileUrl) {
          const url = data.url || data.publicUrl || data.fileUrl;
          setTeaserVideoUrl(url);
          showToast("Teaser video uploaded successfully!", "success");
          setUploadingVideo(false);
          return;
        }
      }

      // Supabase direct bucket upload fallback
      const sanitizeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
      const filename = `teaser-video-${Date.now()}-${sanitizeName}`;
      const { error: uploadErr } = await supabase.storage
        .from('images')
        .upload(filename, file, { upsert: true });

      if (uploadErr) throw uploadErr;

      const { data: publicUrlData } = supabase.storage
        .from('images')
        .getPublicUrl(filename);

      if (publicUrlData?.publicUrl) {
        setTeaserVideoUrl(publicUrlData.publicUrl);
        showToast("Teaser video uploaded to storage bucket!", "success");
      } else {
        throw new Error("Could not retrieve public video URL");
      }
    } catch (err: any) {
      console.error("Video upload error:", err);
      showToast("Video upload failed: " + (err.message || "You can paste a direct video URL instead"), "error");
    } finally {
      setUploadingVideo(false);
    }
  };

  const addCaCode = () => {
    const code = newCaCode.trim().toUpperCase();
    if (!code) return;
    if (caCodes.includes(code)) {
      showToast("CA Code already exists.", "error");
      return;
    }
    setCaCodes([...caCodes, code]);
    setNewCaCode('');
    showToast(`Added CA Code: ${code}`, "success");
  };

  const removeCaCode = (code: string) => {
    setCaCodes(caCodes.filter(c => c !== code));
    showToast(`Removed CA Code: ${code}`, "info");
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white/[0.01] border border-white/5 rounded-3xl p-8 space-y-4">
        <div className="h-4 bg-white/10 rounded w-1/4"></div>
        <div className="h-12 bg-white/5 rounded w-full"></div>
      </div>
    );
  }

  return (
    <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-8 shadow-2xl space-y-8">
      {/* SUPER ADMIN EVENT PAGE LAUNCH CONTROL */}
      <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-black border border-indigo-500/30 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                isEventPageLaunched 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
              }`}>
                {isEventPageLaunched ? "🟢 STATUS: EVENT PAGE LAUNCHED (LIVE)" : "⏳ STATUS: PRE-LAUNCH TEASER & COMING SOON ACTIVE"}
              </span>
            </div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight pt-2">Super Admin Event Page Launch Trigger</h3>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              When <strong>Unlaunched</strong>, visitors clicking the Inter Event page will be presented with the forceful full-screen video teaser with sound, which transitions into the Coming Soon window. Initiating <strong>EVENT PAGE LAUNCH</strong> will bypass both the video and Coming Soon window, loading visitors directly into the inter event registration form.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {!isEventPageLaunched ? (
              <button
                onClick={() => handleToggleLaunch(true)}
                disabled={saving}
                className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "🚀 INITIATE EVENT PAGE LAUNCH"}
              </button>
            ) : (
              <button
                onClick={() => handleToggleLaunch(false)}
                disabled={saving}
                className="px-8 py-4 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "↺ REVERT TO PRE-LAUNCH (SHOW TEASER & COMING SOON)"}
              </button>
            )}
          </div>
        </div>

        {/* TEASER INTRO VIDEO MANAGEMENT */}
        <div className="space-y-6 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                🎥 Teaser Intro Video Configuration
              </h4>
              <p className="text-[11px] text-zinc-400 mt-0.5">
                Upload or set the video that will play with sounds in full-screen mode before transitioning to the Coming Soon window.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer bg-black/40 px-4 py-2 rounded-xl border border-white/10 hover:border-indigo-500/30 transition-all">
              <input
                type="checkbox"
                checked={teaserVideoEnabled}
                onChange={(e) => setTeaserVideoEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider">Enable Teaser Video</span>
            </label>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input & Upload */}
            <div className="space-y-4 bg-black/40 p-5 rounded-2xl border border-white/5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Teaser Video Direct URL (MP4 / WebM)</label>
                <input
                  type="text"
                  value={teaserVideoUrl}
                  onChange={(e) => setTeaserVideoUrl(e.target.value)}
                  placeholder="https://.../teaser-video.mp4"
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <label className="px-5 py-2.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer">
                  {uploadingVideo ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading Video...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Upload Video File (.mp4/.webm)
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    className="hidden"
                    onChange={handleVideoFileUpload}
                    disabled={uploadingVideo}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setTeaserVideoUrl("https://vjs.zencdn.net/v/oceans.mp4");
                    showToast("Loaded preset sample teaser video URL", "info");
                  }}
                  className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-zinc-300 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border border-white/5 cursor-pointer"
                >
                  Use Sample Video
                </button>
              </div>
            </div>

            {/* Video Preview Player */}
            <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono block mb-2">Video Preview</span>
              {teaserVideoUrl ? (
                <div className="relative rounded-xl overflow-hidden aspect-video bg-black border border-white/10">
                  {teaserVideoUrl.includes('youtube.com') || teaserVideoUrl.includes('youtu.be') || teaserVideoUrl.includes('vimeo.com') || teaserVideoUrl.includes('drive.google.com') ? (
                    <iframe
                      src={(() => {
                        if (teaserVideoUrl.includes('youtube.com') || teaserVideoUrl.includes('youtu.be')) {
                          const m = teaserVideoUrl.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|shorts\/|watch\?v=|\&v=)([^#\&\?]*).*/);
                          return m && m[2] ? `https://www.youtube.com/embed/${m[2]}` : teaserVideoUrl;
                        }
                        if (teaserVideoUrl.includes('drive.google.com')) {
                          const m = teaserVideoUrl.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || teaserVideoUrl.match(/id=([a-zA-Z0-9_-]+)/);
                          return m && m[1] ? `https://drive.google.com/file/d/${m[1]}/preview` : teaserVideoUrl;
                        }
                        return teaserVideoUrl;
                      })()}
                      title="Teaser Preview"
                      className="w-full h-full border-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <video
                      src={teaserVideoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )}
                </div>
              ) : (
                <div className="aspect-video bg-zinc-900 rounded-xl flex items-center justify-center text-xs text-zinc-600 font-mono border border-white/5">
                  No Teaser Video Set
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
        <div className="space-y-2 col-span-1 md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">Payment Instruction Description (Highlights Phone Number)</label>
          <textarea
            value={paymentDescription}
            onChange={(e) => setPaymentDescription(e.target.value)}
            rows={3}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 transition-all [resize:none]"
            placeholder="Specify bKash transfer guidelines. Highlight the target number..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">Official bKash Target Number (Highlighted)</label>
          <input
            type="text"
            value={bkashNumber}
            onChange={(e) => setBkashNumber(e.target.value)}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 transition-all"
            placeholder="E.G. 01789456123"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">Price Per Segment (BDT)</label>
          <input
            type="number"
            value={pricePerSegment}
            onChange={(e) => setPricePerSegment(Number(e.target.value))}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 transition-all"
            placeholder="150"
          />
        </div>
      </div>

      {/* Selective CA Codes Management */}
      <div className="space-y-4 pb-6 border-b border-white/5">
        <div>
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">Campus Ambassador (CA) Codes List</h4>
          <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider font-semibold font-mono">
            Manage valid selective CA codes that visitors can choose from on the registration form.
          </p>
        </div>

        <div className="flex gap-4 max-w-md">
          <input
            type="text"
            value={newCaCode}
            onChange={(e) => setNewCaCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') addCaCode(); }}
            placeholder="E.G. CA-JMC-101"
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500/50 transition-all uppercase"
          />
          <button
            onClick={addCaCode}
            className="px-6 py-3 bg-pink-600 hover:bg-pink-500 text-white rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer flex items-center gap-1 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Code
          </button>
        </div>

        {caCodes.length === 0 ? (
          <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl bg-black/20 text-zinc-500 text-xs font-semibold uppercase tracking-wider font-mono">
            No selective CA codes added yet. The dropdown will be empty/unused until configured.
          </div>
        ) : (
          <div className="flex flex-wrap gap-3 pt-2">
            {caCodes.map((code) => (
              <div key={code} className="px-3.5 py-2 bg-zinc-900 border border-white/10 rounded-xl flex items-center gap-2.5">
                <span className="text-xs font-mono font-bold text-pink-400">{code}</span>
                <button
                  onClick={() => removeCaCode(code)}
                  className="text-zinc-500 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Segment Banners & Brief Descriptions Customizer */}
      <div className="space-y-6 pb-6 border-b border-white/5 bg-zinc-950/60 border border-white/10 rounded-2xl p-6">
        <div>
          <h4 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-pink-400" /> Event Segment Banners & Brief Descriptions Customizer
          </h4>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-wider font-semibold font-mono">
            Upload custom banner images and write custom brief descriptions for any of the 22 championship segments. Changes appear inside expandable segment cards on the registration portal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Segment Selector & Edit Controls */}
          <div className="lg:col-span-2 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-pink-400 font-mono">Select Championship Segment to Customize</label>
              <select
                value={selectedSegmentForEdit}
                onChange={(e) => setSelectedSegmentForEdit(e.target.value)}
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold text-white focus:outline-none focus:border-pink-500 transition-all cursor-pointer"
              >
                {ALL_INTER_SEGMENT_NAMES.map(name => (
                  <option key={name} value={name} className="bg-zinc-950 text-white font-sans">
                    {name} {segmentBanners[name] ? '🖼️ (Custom Banner Set)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Segment Banner Image URL</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editingBannerUrl}
                  onChange={(e) => setEditingBannerUrl(e.target.value)}
                  placeholder="https://.../segment-banner.jpg"
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono text-white focus:outline-none focus:border-pink-500/50 transition-all"
                />
                <label className="px-4 py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer shrink-0">
                  {uploadingSegmentBanner ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                  ) : (
                    <Upload className="w-4 h-4 text-indigo-400" />
                  )}
                  <span>Upload Image</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSegmentBannerFileUpload}
                    disabled={uploadingSegmentBanner}
                  />
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono">Brief Segment Description / Rules / Guidelines</label>
              <textarea
                value={editingDescription}
                onChange={(e) => setEditingDescription(e.target.value)}
                rows={4}
                placeholder={`Detailed rules and brief description for ${selectedSegmentForEdit}...`}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-xs font-medium text-white focus:outline-none focus:border-pink-500/50 transition-all [resize:none]"
              />
            </div>

            <button
              type="button"
              onClick={handleApplySegmentEdit}
              className="px-6 py-2.5 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Apply Changes to Segment
            </button>
          </div>

          {/* Banner Preview Card */}
          <div className="space-y-2 bg-black/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 font-mono block mb-2">Banner & Card Preview</span>
              <div className="relative rounded-xl overflow-hidden aspect-video bg-zinc-900 border border-white/10 group">
                {editingBannerUrl ? (
                  <img
                    src={editingBannerUrl}
                    alt={selectedSegmentForEdit}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-zinc-600 font-mono text-[11px] space-y-1">
                    <ImageIcon className="w-6 h-6 opacity-40 mb-1" />
                    <span>No custom banner uploaded</span>
                    <span className="text-[9px] text-zinc-500">Default math banner will be displayed</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-black text-white uppercase tracking-tight line-clamp-1">{selectedSegmentForEdit}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-zinc-400 line-clamp-3 italic pt-2 border-t border-white/5">
              "{editingDescription || 'Default brief description will be shown on expandable card.'}"
            </p>
          </div>
        </div>
      </div>

      {/* Save Action */}
      <div className="flex justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => handleSave()}
          disabled={saving}
          className="w-full sm:w-auto px-8 py-3 rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-lg shadow-pink-600/20 cursor-pointer"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          SAVE INTER REGISTRATION PARAMETERS
        </button>
      </div>
    </div>
  );
}

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ isSuperAdmin = false }) => {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'database' | 'positions' | 'support' | 'email' | 'food' | 'cards' | 'transactions' | 'registration' | 'manual_announce' | 'bulk_name_notice'>('users');
  
  // Member ID Cards state
  const [members, setMembers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberRoleFilter, setMemberRoleFilter] = useState<'all' | 'general' | 'ec'>('all');
  const [selectedMembers, setSelectedMembers] = useState<Record<string, boolean>>({});
  const [printLayout, setPrintLayout] = useState<'single' | 'grid2x2'>('grid2x2');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfProgress, setPdfProgress] = useState(0);
  const [activePdfMember, setActivePdfMember] = useState<any | null>(null);
  const [activePdfEcMember, setActivePdfEcMember] = useState<any | null>(null);
  
  // Food distribution management state
  const [foodConfig, setFoodConfig] = useState<any>(null);
  const [loadingFoodConfig, setLoadingFoodConfig] = useState(false);
  const [savingFoodConfig, setSavingFoodConfig] = useState(false);
  const [newSlotName, setNewSlotName] = useState('');
  const [newSlotMaxServings, setNewSlotMaxServings] = useState(1);

  // Email state
  const [emailConfig, setEmailConfig] = useState<any>(null);
  const [loadingEmailConfig, setLoadingEmailConfig] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);

  // Manual Email Announcements state
  const [announcementSubject, setAnnouncementSubject] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const [confirmBroadcast, setConfirmBroadcast] = useState(false);
  const [announcementTargetType, setAnnouncementTargetType] = useState<'all' | 'individual'>('all');
  const [announcementIndividualEmail, setAnnouncementIndividualEmail] = useState('');

  // Bulk Name Notice state
  const [bulkNameSubject, setBulkNameSubject] = useState('[ACTION REQUIRED] Please update your registered profile name to Given Name only');
  const [bulkNameTemplate, setBulkNameTemplate] = useState(`<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; background-color: #0b0b0f; color: #ffffff; border-radius: 24px; border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 20px 40px rgba(0,0,0,0.5);">
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="display: inline-block; padding: 12px; background-color: rgba(245, 158, 11, 0.1); border-radius: 16px; color: #f59e0b; font-size: 24px;">⚠️</div>
  </div>
  <h2 style="color: #f59e0b; text-transform: uppercase; letter-spacing: 0.1em; border-bottom: 1px solid rgba(255, 255, 255, 0.08); padding-bottom: 15px; margin-top: 0; font-size: 20px; font-weight: 800; text-align: center;">Action Required: Update Your Profile Name</h2>
  <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Dear <strong>{NAME}</strong>,</p>
  <p style="font-size: 14px; line-height: 1.6; color: #ccc;">We noticed you have registered using a multi-word name (e.g., full name <strong>{NAME}</strong>). To comply with our event standards and database indexing, we require you to update your profile name to your <strong>Given Name</strong> only.</p>
  
  <div style="background-color: rgba(245, 158, 11, 0.05); border: 1px solid rgba(245, 158, 11, 0.2); border-radius: 16px; padding: 18px; margin: 25px 0;">
    <p style="font-size: 14px; margin: 0 0 10px 0; color: #f59e0b; font-weight: bold; text-transform: uppercase; letter-spacing: 0.05em;">💡 Example of Name Correction:</p>
    <ul style="font-size: 13px; color: #bbb; padding-left: 20px; margin: 0; line-height: 1.6;">
      <li><strong>Current (Multi-word):</strong> Samin Tausif</li>
      <li><strong>Correct (Given name only):</strong> Samin</li>
    </ul>
    <p style="font-size: 13px; margin: 12px 0 0 0; color: #aaa; font-style: italic;">Based on your current name, we suggest changing it to: <strong style="color: #f59e0b;">{GIVEN_NAME}</strong></p>
  </div>

  <p style="font-size: 14px; line-height: 1.6; color: #ccc;">Please click the button below to log in and instantly correct your name to your given name.</p>
  
  <div style="text-align: center; margin: 30px 0;">
    <a href="{REDIRECT_URL}" style="background-color: #f59e0b; color: #000000; font-weight: 900; text-decoration: none; padding: 14px 32px; border-radius: 12px; display: inline-block; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; box-shadow: 0 8px 20px rgba(245, 158, 11, 0.25); transition: all 0.2s ease;">Correct My Name Now</a>
  </div>

  <p style="font-size: 12px; color: #666; text-align: center; margin-top: 45px; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 20px;">Josephite Math Club &copy; 2026. All rights reserved.</p>
</div>`);
  const [sendingBulkNameNotice, setSendingBulkNameNotice] = useState(false);
  const [confirmBulkName, setConfirmBulkName] = useState(false);
  const [multiWordProfiles, setMultiWordProfiles] = useState<any[]>([]);
  const [loadingMultiWordProfiles, setLoadingMultiWordProfiles] = useState(false);
  const [bulkNameSearchTerm, setBulkNameSearchTerm] = useState('');

  const [emailSuggestions, setEmailSuggestions] = useState<{ email: string; full_name: string }[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);

  const fetchEmailSuggestions = async (val: string) => {
    if (!val || val.trim().length < 2) {
      setEmailSuggestions([]);
      return;
    }
    setSuggestionsLoading(true);
    try {
      const mergedMap = new Map<string, string>();

      // Fetch profiles
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('email, full_name')
          .ilike('email', `%${val}%`)
          .limit(8);
        if (!error && data) {
          data.forEach(item => {
            if (item.email) mergedMap.set(item.email.trim().toLowerCase(), item.full_name || '');
          });
        }
      } catch (e) {
        console.warn('Profiles fetch failed:', e);
      }

      // Fetch from member table
      try {
        const { data, error } = await supabase
          .from('member')
          .select('email, full_name')
          .ilike('email', `%${val}%`)
          .limit(8);
        if (!error && data) {
          data.forEach(item => {
            if (item.email) mergedMap.set(item.email.trim().toLowerCase(), item.full_name || '');
          });
        }
      } catch (e) {
        console.warn('Member fetch failed:', e);
      }

      // Fetch ec_member
      try {
        const { data, error } = await supabase
          .from('ec_member')
          .select('email, full_name')
          .ilike('email', `%${val}%`)
          .limit(8);
        if (!error && data) {
          data.forEach(item => {
            if (item.email) mergedMap.set(item.email.trim().toLowerCase(), item.full_name || '');
          });
        }
      } catch (e) {
        console.warn('EC member fetch failed:', e);
      }

      const list = Array.from(mergedMap.entries()).map(([email, full_name]) => ({
        email,
        full_name
      }));

      setEmailSuggestions(list);
    } catch (err) {
      console.error('Error fetching email suggestions:', err);
    } finally {
      setSuggestionsLoading(false);
    }
  };

  // Debounced search for email suggestions
  useEffect(() => {
    const handler = setTimeout(() => {
      fetchEmailSuggestions(announcementIndividualEmail);
    }, 250);
    return () => clearTimeout(handler);
  }, [announcementIndividualEmail]);

  const sendManualAnnouncement = async () => {
    if (!announcementSubject.trim() || !announcementBody.trim()) {
      showToast('Subject and Body are required.', 'error');
      return;
    }

    if (announcementTargetType === 'individual' && (!announcementIndividualEmail.trim() || !announcementIndividualEmail.includes('@'))) {
      showToast('Please provide a valid individual email address.', 'error');
      return;
    }

    if (!confirmBroadcast) {
      showToast('Please confirm the broadcast safety checkbox.', 'error');
      return;
    }

    setSendingAnnouncement(true);
    showToast(announcementTargetType === 'individual' ? 'Sending targeted email...' : 'Broadcasting email announcement...', 'info');

    try {
      const res = await fetch('/api/admin/send-manual-announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: announcementSubject,
          body: announcementBody,
          targetType: announcementTargetType,
          individualEmail: announcementTargetType === 'individual' ? announcementIndividualEmail.trim() : undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(
          announcementTargetType === 'individual' 
            ? `Email sent successfully to ${announcementIndividualEmail}!` 
            : `Successfully broadcasted! Sent: ${data.sentCount} emails, Failed: ${data.failedCount}`, 
          'success'
        );
        setAnnouncementSubject('');
        setAnnouncementBody('');
        setAnnouncementIndividualEmail('');
        setConfirmBroadcast(false);
      } else {
        throw new Error(data.error || 'Failed to send announcement email');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const fetchMultiWordProfiles = useCallback(async () => {
    setLoadingMultiWordProfiles(true);
    try {
      const res = await fetch('/api/admin/bulk-name-notice');
      const data = await res.json();
      if (res.ok) {
        setMultiWordProfiles(data.profiles || []);
      } else {
        throw new Error(data.error || 'Failed to fetch profiles');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingMultiWordProfiles(false);
    }
  }, [showToast]);

  const sendBulkNameNotice = async () => {
    if (!bulkNameSubject.trim() || !bulkNameTemplate.trim()) {
      showToast('Subject and HTML Template are required.', 'error');
      return;
    }

    if (!confirmBulkName) {
      showToast('Please check the authorization box to proceed.', 'error');
      return;
    }

    setSendingBulkNameNotice(true);
    showToast('Initiating name correction broadcast...', 'info');

    try {
      const res = await fetch('/api/admin/bulk-name-notice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: bulkNameSubject,
          htmlTemplate: bulkNameTemplate,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(`Successfully completed! Total Targeted: ${data.totalTargeted || 0}, Sent: ${data.sentCount || 0}, Failed: ${data.failedCount || 0}`, 'success');
        setConfirmBulkName(false);
        // Refresh profiles list
        fetchMultiWordProfiles();
      } else {
        throw new Error(data.error || 'Failed to send bulk name notice emails');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSendingBulkNameNotice(false);
    }
  };

  // Database Explorer state
  const [tables] = useState([
    'profiles', 
    'member', 
    'ec_member', 
    'primary_events', 
    'junior_events', 
    'secondary_events', 
    'higher_secondary_events', 
    'event_participation', 
    'site_content', 
    'support_tickets'
  ]);
  const [selectedTable, setSelectedTable] = useState('profiles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Position Management state
  const [participations, setParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  // Verified Transactions state
  const [verifiedTransactions, setVerifiedTransactions] = useState<any[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [txSearchTerm, setTxSearchTerm] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState<'all' | 'online' | 'spot'>('all');

  const fetchEmailConfig = useCallback(async () => {
    setLoadingEmailConfig(true);
    try {
      const res = await fetch('/api/admin/check-email-config');
      const data = await res.json();
      setEmailConfig(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingEmailConfig(false);
    }
  }, []);

  const testEmail = async () => {
    setTestingEmail(true);
    showToast('Sending test email...', 'info');
    try {
      const res = await fetch('/api/debug-email');
      const data = await res.json();
      if (res.ok) {
        showToast('Test email sent! Check l47idkpro@gmail.com', 'success');
      } else {
        throw new Error(data.details?.message || data.error || 'Failed to send test email');
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setTestingEmail(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchTableData = useCallback(async (tableName: string) => {
    setLoadingTable(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);
      
      if (error) throw error;
      setTableData(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingTable(false);
    }
  }, [showToast]);

  const fetchParticipations = useCallback(async () => {
    setLoadingParticipations(true);
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select(`
          *,
          member (
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setParticipations(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingParticipations(false);
    }
  }, [showToast]);

  const fetchVerifiedTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
    let allVerified: any[] = [];
    try {
      // Fetch APPROVE_TRANSACTION audit logs to match with transactions
      const { data: auditLogs, error: auditError } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .eq('action_type', 'APPROVE_TRANSACTION');

      const auditMap: Record<string, string> = {};
      if (!auditError && auditLogs) {
        auditLogs.forEach((log: any) => {
          if (log.target) {
            auditMap[log.target] = log.admin_name || '';
          }
          try {
            if (log.details) {
              const detailsObj = typeof log.details === 'string' ? JSON.parse(log.details) : log.details;
              if (detailsObj && detailsObj.trxnid) {
                auditMap[`trxnid:${detailsObj.trxnid}`] = log.admin_name || '';
              }
            }
          } catch (e) {
            // ignore
          }
        });
      }

      for (const tb of tables) {
        let data: any[] | null = null;
        let error: any = null;

        // Try querying with boolean true first (since db_schema says they are boolean)
        const boolRes = await supabase
          .from(tb)
          .select('*')
          .eq('verified', true);

        if (boolRes.error) {
          // Fall back to querying with string 'yes' (for text column)
          const strRes = await supabase
            .from(tb)
            .select('*')
            .eq('verified', 'yes');
          data = strRes.data;
          error = strRes.error;
        } else {
          data = boolRes.data;
          error = boolRes.error;
        }
        
        if (error) throw error;
        
        if (data && data.length > 0) {
          const userIds = data.map((d: any) => d.user_id).filter(Boolean);
          let emailsMap: Record<string, string> = {};
          if (userIds.length > 0) {
            const { data: profs } = await supabase
              .from('profiles')
              .select('id, email')
              .in('id', userIds);
            profs?.forEach((p: any) => {
              emailsMap[p.id] = p.email;
            });
          }

          const mapped = data.map((item: any) => {
            const auditAdmin = auditMap[`${tb}:${item.id}`] || auditMap[`trxnid:${item.trxnid}`];
            return {
              ...item,
              tableName: tb,
              email: emailsMap[item.user_id] || '',
              verified_by_audit: auditAdmin || ''
            };
          });
          allVerified = [...allVerified, ...mapped];
        }
      }
      
      allVerified.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
      setVerifiedTransactions(allVerified);
    } catch (err: any) {
      console.error("Error loading verified transactions:", err);
      showToast(err.message || "Failed to load verified transactions", "error");
    } finally {
      setLoadingTransactions(false);
    }
  }, [showToast]);

  const exportVerifiedTransactionsCSV = () => {
    if (verifiedTransactions.length === 0) {
      showToast("No verified transactions to export", "error");
      return;
    }

    const headers = [
      "Record ID",
      "Category",
      "Full Name",
      "Email Address",
      "Class",
      "Section",
      "Roll No",
      "bKash Number",
      "Transaction ID",
      "Amount (BDT)",
      "Registered Segments",
      "Registered By",
      "Verified By",
      "Verification Time"
    ];

    const getCategoryName = (tbName: string) => {
      switch (tbName) {
        case 'primary_events': return 'Primary (Class 3-5)';
        case 'junior_events': return 'Junior (Class 6-8)';
        case 'secondary_events': return 'Secondary (Class 9-10)';
        case 'higher_secondary_events': return 'Higher Secondary (Class 11-12)';
        default: return tbName;
      }
    };

    const csvRows = [
      headers.join(','),
      ...verifiedTransactions.map(tx => {
        const category = getCategoryName(tx.tableName);
        
        let registeredBy = "Self (Online)";
        let bKashField = tx.bkash_number || '';

        if (tx.registered_by) {
          registeredBy = tx.registered_by;
        } else if (bKashField.startsWith("PROXY: ")) {
          registeredBy = bKashField.replace("PROXY: ", "");
          bKashField = "N/A - PROXY INSTANT";
        }

        let verifiedBy = tx.verified_by || tx.verified_by_audit || "System/Auto";
        if (!tx.verified_by && !tx.verified_by_audit && registeredBy && registeredBy !== "Self (Online)") {
          verifiedBy = registeredBy;
        }

        const values = [
          tx.id || '',
          category,
          tx.full_name || '',
          tx.email || '',
          tx.class || '',
          tx.section || '',
          tx.roll || '',
          bKashField,
          tx.trxnid || '',
          tx.amount || '0',
          tx.selected_events || '',
          registeredBy,
          verifiedBy,
          tx.created_at || ''
        ];

        const escapedValues = values.map(val => {
          const stringVal = String(val).replace(/"/g, '""');
          return `"${stringVal}"`;
        });

        return escapedValues.join(',');
      })
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `verified_transactions_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Verified transaction list exported successfully as CSV!", "success");
  };

  const fetchFoodConfig = useCallback(async () => {
    setLoadingFoodConfig(true);
    try {
      const { data, error } = await supabase
        .from('site_content')
        .select('data')
        .eq('id', 'food_management')
        .maybeSingle();

      if (error) throw error;
      if (data && data.data) {
        setFoodConfig(data.data);
      } else {
        const defaultPayload = {
          settings: {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks',
            distribution_enabled: false
          },
          logs: []
        };
        setFoodConfig(defaultPayload);
      }
    } catch (err: any) {
      console.error("Error fetching food config in SuperAdminPanel:", err);
      showToast(err.message || "Failed to load food config", "error");
    } finally {
      setLoadingFoodConfig(false);
    }
  }, [showToast]);

  const updateFoodDistributionStatus = async (enabled: boolean) => {
    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks'
          }),
          distribution_enabled: enabled
        },
        logs: foodConfig?.logs || []
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast(
        enabled 
          ? "Food distribution has been successfully ANNOUNCED. Normal admins can now scan and distribute food." 
          : "Food distribution has been STOPPED. Normal admins are now blocked from scanning.",
        "success"
      );
    } catch (err: any) {
      console.error("Error updating food config in SuperAdminPanel:", err);
      showToast(err.message || "Failed to save food config status", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleSetActiveSlot = async (slotId: string) => {
    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ]
          }),
          active_slot_id: slotId
        }
      };
      
      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Changed active portions distribution category target", "success");
    } catch (err: any) {
      console.error("Error setting active slot:", err);
      showToast(err.message || "Failed to change active portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const toggleSlotAvailability = async (slotId: string) => {
    setSavingFoodConfig(true);
    try {
      const currentAvailable = foodConfig?.settings?.available_slots || [];
      const updatedAvailable = currentAvailable.includes(slotId)
        ? currentAvailable.filter((id: string) => id !== slotId)
        : [...currentAvailable, slotId];

      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            slots: [
              { id: 'snacks', name: 'Snacks', max_servings: 1 },
              { id: 'lunch', name: 'Lunch', max_servings: 1 },
              { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
            ],
            active_slot_id: 'snacks',
            distribution_enabled: false
          }),
          available_slots: updatedAvailable
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast(
        updatedAvailable.includes(slotId)
          ? "Slot is now available to normal admins."
          : "Slot is now hidden/unavailable to normal admins.",
        "success"
      );
    } catch (err: any) {
      console.error("Error toggling slot availability:", err);
      showToast(err.message || "Failed to toggle slot availability", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlotName.trim()) return;

    const newId = newSlotName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    const existingSlots = foodConfig?.settings?.slots || [
      { id: 'snacks', name: 'Snacks', max_servings: 1 },
      { id: 'lunch', name: 'Lunch', max_servings: 1 },
      { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
    ];

    if (existingSlots.some((s: any) => s.id === newId)) {
      showToast("Portion slot already exists", "error");
      return;
    }

    const newSlot = {
      id: newId,
      name: newSlotName,
      max_servings: Math.max(1, newSlotMaxServings)
    };

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {
            active_slot_id: newId,
            distribution_enabled: false
          }),
          slots: [...existingSlots, newSlot]
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      setNewSlotName('');
      setNewSlotMaxServings(1);
      showToast(`Added portion slot: ${newSlot.name}`, "success");
    } catch (err: any) {
      console.error("Error adding slot:", err);
      showToast(err.message || "Failed to add portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleRemoveSlot = async (slotId: string) => {
    const existingSlots = foodConfig?.settings?.slots || [];
    if (existingSlots.length <= 1) {
      showToast("At least one food slot must remain active.", "error");
      return;
    }

    const updatedSlots = existingSlots.filter((s: any) => s.id !== slotId);
    let nextActiveId = foodConfig?.settings?.active_slot_id;
    if (nextActiveId === slotId) {
      nextActiveId = updatedSlots[0].id;
    }

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        settings: {
          ...(foodConfig?.settings || {}),
          slots: updatedSlots,
          active_slot_id: nextActiveId
        }
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Portion distribution slot removed.", "info");
    } catch (err: any) {
      console.error("Error removing slot:", err);
      showToast(err.message || "Failed to remove portion slot", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const handleResetLogs = async () => {
    if (!window.confirm("Are you absolutely sure you want to clear/reset all scanned QR entries for today? This action cannot be undone and resets food claims for a new day.")) {
      return;
    }

    setSavingFoodConfig(true);
    try {
      const updatedConfig = {
        ...foodConfig,
        logs: []
      };

      const { error } = await supabase
        .from('site_content')
        .upsert({
          id: 'food_management',
          data: updatedConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;
      setFoodConfig(updatedConfig);
      showToast("Portions claims reset. Ready for a new day of scans!", "success");
    } catch (err: any) {
      console.error("Error resetting logs:", err);
      showToast(err.message || "Failed to reset scan logs", "error");
    } finally {
      setSavingFoodConfig(false);
    }
  };

  const fetchVerifiedMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const { data: standardData, error: standardError } = await supabase
        .from('member')
        .select('*')
        .eq('verified', 'yes')
        .order('full_name');
      
      if (standardError) throw standardError;

      let ecData: any[] = [];
      try {
        const { data: ecRes, error: ecError } = await supabase
          .from('ec_member')
          .select('*')
          .eq('verified', 'yes');
        if (!ecError && ecRes) {
          ecData = ecRes.map(m => ({ ...m, is_ec: true }));
        }
      } catch (e) {
        console.error("Failed to fetch verified EC members:", e);
      }

      // Deduplicate by email or member ID to prevent React key collision warnings and merge legacy duplicates
      const uniqueMembersMap = new Map<string, any>();
      const emailToIdMap = new Map<string, string>(); // maps lowercase email to member uuid

      (standardData || []).forEach(m => {
        if (m.id) {
          const emailKey = (m.email || m.email_address || '').toLowerCase().trim();
          uniqueMembersMap.set(m.id, { ...m, is_ec: m.is_ec || false });
          if (emailKey) {
            emailToIdMap.set(emailKey, m.id);
          }
        }
      });

      ecData.forEach(m => {
        if (m.id) {
          const emailKey = (m.email || m.email_address || '').toLowerCase().trim();
          // Find if there is an existing standard member with either the same id or the same email
          let existingId = m.id;
          if (emailKey && emailToIdMap.has(emailKey)) {
            existingId = emailToIdMap.get(emailKey)!;
          }

          if (uniqueMembersMap.has(existingId)) {
            const existing = uniqueMembersMap.get(existingId);
            uniqueMembersMap.set(existingId, { ...existing, ...m, id: existingId, is_ec: true });
          } else {
            uniqueMembersMap.set(m.id, m);
            if (emailKey) {
              emailToIdMap.set(emailKey, m.id);
            }
          }
        }
      });
      const combined = Array.from(uniqueMembersMap.values());
      setMembers(combined);
      
      // Initially select all verified members for printing
      const initialSelection: Record<string, boolean> = {};
      combined.forEach((m: any) => {
        initialSelection[m.id] = true;
      });
      setSelectedMembers(initialSelection);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch verified members', 'error');
    } finally {
      setLoadingMembers(false);
    }
  }, [showToast]);

  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  const generateBulkPdf = async () => {
    const selectedList = members.filter(m => selectedMembers[m.id]);
    if (selectedList.length === 0) {
      showToast('Please select at least one member to generate PDF', 'error');
      return;
    }

    setGeneratingPdf(true);
    setPdfProgress(0);
    showToast(`Initializing PDF engine for ${selectedList.length} members...`, 'info');

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const total = selectedList.length;
      const images: string[] = [];

      for (let i = 0; i < total; i++) {
        const member = selectedList[i];
        setActivePdfMember(member);
        
        // Brief pause to allow the single DOM capture node to fully paint
        await new Promise((resolve) => setTimeout(resolve, 80));
        
        const node = document.getElementById('pdf-sandbox-card');
        if (!node) {
          throw new Error('PDF Sandbox card node not found in DOM.');
        }

        const dataUrl = await toPng(node, {
          pixelRatio: 2, // Double DPI factor for unpixelated high-resolution output
          skipFonts: false,
          cacheBust: true,
        });

        images.push(dataUrl);
        setPdfProgress(Math.round(((i + 1) / total) * 100));
      }

      // Hide the template sandbox immediately
      setActivePdfMember(null);

      // Create PDF and place 4 dynamic ID cards in a 2x2 grid per page
      const pdf = new jsPDF('p', 'mm', 'a4');
      const cardsPerPage = 4;
      const chunks = chunkArray(images, cardsPerPage);

      for (let pageIdx = 0; pageIdx < chunks.length; pageIdx++) {
        if (pageIdx > 0) {
          pdf.addPage();
        }

        const chunk = chunks[pageIdx];
        
        for (let cardIdx = 0; cardIdx < chunk.length; cardIdx++) {
          const imgData = chunk[cardIdx];
          
          let x = 10;
          let y = 6.25;

          if (cardIdx === 1) { // Top Right
            x = 115;
          } else if (cardIdx === 2) { // Bottom Left
            y = 154.75;
          } else if (cardIdx === 3) { // Bottom Right
            x = 115;
            y = 154.75;
          }

          pdf.addImage(imgData, 'PNG', x, y, 85, 136, undefined, 'FAST');
        }
      }

      pdf.save(`st-joseph-math-club-id-cards-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Printers-ready bulk 2x2 grid PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('PDF Export Error:', err);
      showToast(err.message || 'Error occurred during PDF generation', 'error');
    } finally {
      setGeneratingPdf(false);
      setActivePdfMember(null);
      setPdfProgress(0);
    }
  };

  const generateEcIdsPdf = async () => {
    const ecList = members.filter(m => m.is_ec);
    if (ecList.length === 0) {
      showToast('No verified EC members found to generate ID cards.', 'error');
      return;
    }

    setGeneratingPdf(true);
    setPdfProgress(0);
    showToast(`Generating print-ready double-sided cards for ${ecList.length} EC members...`, 'info');

    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const total = ecList.length;
      const images: string[] = [];

      for (let i = 0; i < total; i++) {
        const member = ecList[i];
        setActivePdfEcMember(member);
        
        // Pause to allow DOM paint and image loader
        await new Promise((resolve) => setTimeout(resolve, 150));
        
        const node = document.getElementById('pdf-ec-sandbox-card');
        if (!node) {
          throw new Error('EC PDF Sandbox node not found in DOM.');
        }

        const dataUrl = await toPng(node, {
          pixelRatio: 2, // Double DPI for crisp printing
          skipFonts: false,
          cacheBust: true,
        });

        images.push(dataUrl);
        setPdfProgress(Math.round(((i + 1) / total) * 100));
      }

      // Clear sandbox state
      setActivePdfEcMember(null);

      const pdf = new jsPDF('p', 'mm', 'a4');

      for (let i = 0; i < images.length; i++) {
        if (i > 0) {
          pdf.addPage();
        }
        
        const imgData = images[i];
        // Draw centered on portrait A4 page
        const cardWidth = 180;
        const cardHeight = 142;
        const x = 15;
        const y = (297 - cardHeight) / 2;

        pdf.addImage(imgData, 'PNG', x, y, cardWidth, cardHeight, undefined, 'FAST');
      }

      pdf.save(`st-joseph-math-club-ec-id-cards-${new Date().toISOString().split('T')[0]}.pdf`);
      showToast('Double-sided folding EC ID cards PDF downloaded successfully!', 'success');
    } catch (err: any) {
      console.error('EC PDF Export Error:', err);
      showToast(err.message || 'Error occurred during EC PDF generation', 'error');
    } finally {
      setGeneratingPdf(false);
      setActivePdfEcMember(null);
      setPdfProgress(0);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'users') fetchUsers();
    if (activeSubTab === 'database') fetchTableData(selectedTable);
    if (activeSubTab === 'positions') fetchParticipations();
    if (activeSubTab === 'email') fetchEmailConfig();
    if (activeSubTab === 'food') fetchFoodConfig();
    if (activeSubTab === 'cards') fetchVerifiedMembers();
    if (activeSubTab === 'transactions') fetchVerifiedTransactions();
    if (activeSubTab === 'bulk_name_notice') fetchMultiWordProfiles();
  }, [
    activeSubTab, 
    selectedTable, 
    fetchUsers, 
    fetchTableData, 
    fetchParticipations, 
    fetchEmailConfig, 
    fetchFoodConfig, 
    fetchVerifiedMembers,
    fetchVerifiedTransactions,
    fetchMultiWordProfiles
  ]);

  const updateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setPromoting(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPromoting(null);
    }
  };

  const updatePosition = async (participationId: string, position: string | null) => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .update({ position: position || null })
        .eq('id', participationId);
      
      if (error) throw error;
      
      setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, position: position || null } : p));
      showToast(position ? 'Position updated' : 'Position revoked completely', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteRow = async (tableName: string, rowId: any) => {
    if (!isSuperAdmin) {
      showToast('Only Super Admins can delete database records.', 'error');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this row? This action is irreversible.')) return;
    try {
      // Handle different ID types (id for UUID, or specific key for site_content)
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idKey, rowId);
      
      if (error) throw error;
      
      setTableData(prev => prev.filter(row => row[idKey] !== rowId));
      showToast('Row deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const editRow = async (tableName: string, row: any) => {
    if (!isSuperAdmin) {
      showToast('Only Super Admins can edit database records.', 'error');
      return;
    }
    const field = window.prompt(`Enter column name to edit (Available: ${Object.keys(row).join(', ')}):`);
    if (!field || !(field in row)) return;
    
    const newValue = window.prompt(`Enter new value for "${field}" (Current: ${row[field] !== undefined ? String(row[field]) : ''}):`);
    if (newValue === null) return;

    try {
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const updates = { [field]: newValue };
      
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idKey, row[idKey]);
      
      if (error) throw error;
      
      setTableData(prev => prev.map(r => r[idKey] === row[idKey] ? { ...r, ...updates } : r));
      showToast('Row updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const addRow = async (tableName: string) => {
    const dataStr = window.prompt('Enter JSON object for new row (e.g. {"email": "test@example.com", "full_name": "Test User"}):');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const { error } = await supabase
        .from(tableName)
        .insert(data);
      
      if (error) throw error;
      
      fetchTableData(tableName);
      showToast('Row added successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransactions = verifiedTransactions.filter(tx => {
    const matchesSearch = 
      tx.full_name?.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      tx.trxnid?.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      tx.email?.toLowerCase().includes(txSearchTerm.toLowerCase()) ||
      tx.class?.toLowerCase().includes(txSearchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const registeredBy = tx.registered_by || '';
    const bkashNumber = tx.bkash_number || '';
    const trxnid = tx.trxnid || '';

    const isSpot = 
      (registeredBy && registeredBy !== 'Self (Online)') || 
      bkashNumber.startsWith('PROXY:') || 
      trxnid.startsWith('PROXY-');

    if (txTypeFilter === 'online') {
      return !isSpot;
    }
    if (txTypeFilter === 'spot') {
      return isSpot;
    }
    return true;
  });

  if (mounted && !isSuperAdmin) {
    return (
      <div className="p-12 text-center rounded-[2.5rem] border border-red-500/20 bg-red-500/5 max-w-2xl mx-auto my-12 flex flex-col items-center">
        <div className="p-5 rounded-full bg-red-500/10 text-red-400 mb-6">
          <ShieldAlert className="w-10 h-10 animate-pulse" />
        </div>
        <h3 className="text-xl font-black text-white uppercase tracking-tight mb-2">Access Restrained</h3>
        <p className="text-xs text-zinc-400 leading-relaxed max-w-md">
          Only Super Admins possess the root level credentials required to initialize database schema mutations, edit user forms, or adjust club structures.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Sub-tabs header */}
      <div className="flex flex-wrap gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Admin Management', icon: Shield },
          { id: 'positions', label: 'Event Positions', icon: Award },
          { id: 'support', label: 'Support Issues', icon: ShieldAlert },
          { id: 'email', label: 'Email Status', icon: Mail },
          { id: 'manual_announce', label: 'Email Announcements Manually', icon: Mail },
          { id: 'bulk_name_notice', label: 'Bulk Name Notice', icon: AlertCircle },
          { id: 'food', label: 'Food Management', icon: Utensils },
          { id: 'cards', label: 'Member ID Cards', icon: QrCode },
          { id: 'transactions', label: 'Verified Transactions', icon: CheckCircle2 },
          { id: 'registration', label: 'Registration Toggle', icon: ShieldAlert },
          { id: 'database', label: 'Database Explorer', icon: DatabaseZap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Admin Permissions" 
              description="Promote or demote users to normal admin roles."
              icon={Shield}
              actions={
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-64"
                  />
                </div>
              }
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">User</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Role</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={3} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                {u.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{u.full_name}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">{cleanDisplayEmail(u.email)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-500' :
                              u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-zinc-500/10 text-zinc-500'
                            }`}>
                               {/* Hardcode super admin for UI clarity if needed */}
                               {u.email === 'l47idkpro@gmail.com' ? 'SUPER ADMIN' : u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             {/* Only allow modifying if not the specific super admin email */}
                            {u.email !== 'l47idkpro@gmail.com' ? (
                              <DashboardButton 
                                label={promoting === u.id ? "Updating..." : (u.role === 'admin' ? "Demote to Member" : "Promote to Admin")}
                                onClick={() => updateUserRole(u.id, u.role)}
                                disabled={promoting !== null}
                                variant={u.role === 'admin' ? 'secondary' : 'primary'}
                                className="h-8 text-[9px] px-3"
                                icon={promoting === u.id ? Loader2 : UserCheck}
                              />
                            ) : (
                              <span className="text-[9px] text-zinc-700 font-bold uppercase">Restricted</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'positions' && (
          <motion.div
            key="positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Event Winners & Positions" 
              description="Assign titles, ranks, or positions to members who participated in events."
              icon={Award}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Member</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Event</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Category</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Position</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingParticipations ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : participations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-600 text-xs italic">No participation records found.</td>
                      </tr>
                    ) : (
                      participations.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <p className="text-xs font-bold text-white">{p.member?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-zinc-600 font-mono">{p.member_id}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-zinc-400">{p.event_name || 'Unknown'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{p.category}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.position ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-500'
                            }`}>
                              {p.position || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-2">
                               {['Champion', 'Runner Up', '3rd Place'].map(pos => (
                                 <button
                                   key={pos}
                                   onClick={() => updatePosition(p.id, pos)}
                                   className={`px-2 py-1 border rounded-lg text-[8px] font-bold transition-all uppercase ${
                                     p.position === pos 
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30'
                                   }`}
                                 >
                                   {pos}
                                 </button>
                               ))}
                               {p.position && (
                                 <button
                                   onClick={() => {
                                     if (confirm("Are you absolutely sure you want to revoke this user's position/rank? This will clear their historical achievements for this event.")) {
                                       updatePosition(p.id, null);
                                     }
                                   }}
                                   className="px-2 py-1 bg-red-500/10 hover:bg-red-600 border border-red-500/20 hover:border-red-500 text-red-400 hover:text-white rounded-lg text-[8px] font-bold transition-all uppercase font-sans"
                                 >
                                   Revoke
                                 </button>
                               )}
                               <input 
                                 type="text" 
                                 placeholder="Custom..."
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     updatePosition(p.id, (e.target as HTMLInputElement).value);
                                     (e.target as HTMLInputElement).value = '';
                                   }
                                 }}
                                 className="w-20 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] text-white outline-none focus:border-amber-500/30 transition-all"
                               />
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SupportManagement />
          </motion.div>
        )}

        {activeSubTab === 'email' && (
          <motion.div
            key="email"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Email System Health" 
              description="Monitor SMTP and API configurations. Ensure reliable communication."
              icon={Mail}
              actions={
                <DashboardButton 
                  label={testingEmail ? "Sending..." : "Send Test Email"} 
                  onClick={testEmail}
                  disabled={testingEmail}
                  icon={testingEmail ? Loader2 : Mail}
                  variant="primary"
                  className="h-9 px-4 text-[10px]"
                />
              }
            >
              {loadingEmailConfig ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : emailConfig ? (
                <div className="space-y-8">
                  <div className={`p-6 rounded-3xl border ${emailConfig.is_api_mode ? 'bg-green-500/5 border-green-500/20' : 'bg-amber-500/5 border-amber-500/20'}`}>
                     <div className="flex items-center gap-4 mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${emailConfig.is_api_mode ? 'bg-green-500/20 text-green-500' : 'bg-amber-500/20 text-amber-500'}`}>
                          {emailConfig.is_api_mode ? <CheckCircle2 className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                            {emailConfig.is_api_mode ? 'API Mode Active' : 'SMTP Mode (Prone to IP Issues)'}
                          </h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{emailConfig.recommendation}</p>
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { label: 'Brevo API Key', status: emailConfig.BREVO_API_KEY, env: 'BREVO_API_KEY' },
                      { label: 'SMTP Pass/Key', status: emailConfig.SMTP_PASS, env: 'SMTP_PASS' },
                      { label: 'Sender Email', status: emailConfig.SMTP_FROM_EMAIL, env: 'SMTP_FROM_EMAIL', val: emailConfig.current_from_email },
                      { label: 'SMTP User', status: emailConfig.SMTP_USER, env: 'SMTP_USER' }
                    ].map((item, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                        <div>
                          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">{item.label}</p>
                          <p className="text-xs font-mono text-zinc-400">{item.env}</p>
                          {item.val && <p className="text-[10px] text-amber-500/60 mt-1">{item.val}</p>}
                        </div>
                        <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${item.status ? 'text-green-500' : 'text-red-500'}`}>
                          {item.status ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {item.status ? 'Configured' : 'Missing'}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-8 rounded-3xl bg-indigo-500/5 border border-indigo-500/10 space-y-4">
                    <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                       <Shield className="w-4 h-4" />
                       How to Fix permanently
                    </h4>
                    <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed uppercase tracking-wider">
                      <p>1. Go to Brevo Dashbord &gt; Settings &gt; SMTP &amp; API.</p>
                      <p>2. Generate a new <strong className="text-white">API Key</strong> (V3).</p>
                      <p>3. Set <strong className="text-white">BREVO_API_KEY</strong> environment variable in your host settings.</p>
                      <p>4. Go to Brevo &gt; Senders &gt; Domains and ensure <strong className="text-white">{emailConfig.current_from_email.split('@')[1]}</strong> is verified.</p>
                      <p>5. In Brevo &gt; Settings &gt; Security &gt; Authorized IPs, <strong className="text-red-500">REMOVE</strong> all IP addresses if using SMTP.</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'manual_announce' && (
          <motion.div
            key="manual_announce"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Manual Email Announcements" 
              description="Craft and broadcast custom emails directly to every registered member in our database."
              icon={Mail}
            >
              <div className="space-y-6 max-w-4xl">
                <div className="p-6 rounded-3xl border border-amber-500/10 bg-amber-500/[0.02] flex items-start gap-4">
                  <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">Super Admin Override Center</h4>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      This system bypasses all non-critical filters to email every registered account (member, EC member, student, admin, etc.) in the database. Please exercise high caution.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <DashboardFormField 
                    label="Recipient Selection" 
                    type="select"
                    value={announcementTargetType} 
                    onChange={(val) => setAnnouncementTargetType(val as any)} 
                    options={[
                      { value: 'all', label: 'All Registered Members & Profiles' },
                      { value: 'individual', label: 'Send to Individual Email Address' }
                    ]}
                    description="Decide whether to broadcast this email to every single user or target a single direct email recipient."
                  />

                  {announcementTargetType === 'individual' && (
                    <DashboardFormField 
                      label="Target Email Address" 
                      description="Enter the exact email address you want to target."
                    >
                      <div className="relative">
                        <input
                          type="text"
                          value={announcementIndividualEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnnouncementIndividualEmail(val);
                            setShowSuggestionsDropdown(true);
                          }}
                          onFocus={() => {
                            setShowSuggestionsDropdown(true);
                          }}
                          onBlur={() => {
                            setShowSuggestionsDropdown(false);
                          }}
                          placeholder="e.g. member@example.com"
                          className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.05] transition-all"
                        />
                        {suggestionsLoading && (
                          <div className="absolute right-4 top-1/2 -translate-y-1/2">
                            <Loader2 className="w-4 h-4 text-zinc-500 animate-spin" />
                          </div>
                        )}
                        
                        {showSuggestionsDropdown && emailSuggestions.length > 0 && (
                          <div className="absolute left-0 right-0 top-full mt-2 z-50 max-h-[200px] overflow-y-auto rounded-xl bg-[#0a0a0a] border border-white/10 backdrop-blur-xl shadow-2xl py-1">
                            {emailSuggestions.map((item, index) => (
                              <button
                                key={`${item.email}-${index}`}
                                type="button"
                                onMouseDown={() => {
                                  setAnnouncementIndividualEmail(item.email);
                                  setShowSuggestionsDropdown(false);
                                }}
                                className="w-full text-left px-5 py-3 hover:bg-white/[0.05] transition-colors flex flex-col gap-0.5 border-b border-white/[0.02] last:border-0"
                              >
                                {item.full_name && (
                                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                                    {item.full_name}
                                  </span>
                                )}
                                <span className="text-xs text-neutral-200 font-medium">
                                  {item.email}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </DashboardFormField>
                  )}

                  <DashboardFormField 
                    label="Email Subject Line" 
                    type="text"
                    value={announcementSubject} 
                    onChange={setAnnouncementSubject} 
                    placeholder="e.g. Important Announcement: National Math Olympiad 2026 Registration"
                    description="The main subject header of the recipient's email inbox."
                  />

                  <DashboardFormField 
                    label="Email Material Body Text" 
                    type="textarea"
                    value={announcementBody} 
                    onChange={setAnnouncementBody} 
                    placeholder="Dear {{name}},&#10;&#10;We are proud to announce the next phase of Josephite Math Club events. Join us at...&#10;&#15;Sincerely,&#10;The JMC Committee"
                    description="You can use the tag {{name}} to dynamically insert each recipient's full name, or {{email}} to inject their email address."
                  />
                  
                  {/* Safety verification check */}
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 select-none">
                    <input
                      type="checkbox"
                      id="confirm-broadcast-checkbox"
                      checked={confirmBroadcast}
                      onChange={(e) => setConfirmBroadcast(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-850 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer"
                    />
                    <label htmlFor="confirm-broadcast-checkbox" className="text-xs text-zinc-400 leading-relaxed cursor-pointer selection:bg-transparent">
                      <strong className="text-white block font-semibold mb-0.5">
                        {announcementTargetType === 'individual' ? "I certify that this email delivery is safe" : "I certify that this email broadcast is safe"}
                      </strong>
                      {announcementTargetType === 'individual' 
                        ? "I confirm that the contents of this email subject and body are fully verified and contain no placeholder notations. I authorize sending this email to the targeted individual address."
                        : "I confirm that the contents of this email subject and body are fully verified, contain no raw draft notations, and follow our club security policies. I authorize sending this email to all registered accounts."
                      }
                    </label>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <DashboardButton 
                      label={sendingAnnouncement ? "Sending..." : (announcementTargetType === 'individual' ? "Send Email to Recipient" : "Broadcast Announcement via Email")} 
                      onClick={sendManualAnnouncement}
                      disabled={
                        sendingAnnouncement || 
                        !confirmBroadcast || 
                        !announcementSubject.trim() || 
                        !announcementBody.trim() ||
                        (announcementTargetType === 'individual' && (!announcementIndividualEmail.trim() || !announcementIndividualEmail.includes('@')))
                      }
                      icon={sendingAnnouncement ? Loader2 : Mail}
                      variant="primary"
                    />
                  </div>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'bulk_name_notice' && (
          <motion.div
            key="bulk_name_notice"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Bulk Name Correction Center" 
              description="Notify users who registered with multi-word full names to update their profile to Given Name only."
              icon={AlertCircle}
            >
              <div className="space-y-8 max-w-6xl">
                {/* Information Header card */}
                <div className="p-6 rounded-3xl border border-amber-500/10 bg-amber-500/[0.02] flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400">
                      <AlertCircle className="w-6 h-6 animate-pulse" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Aesthetic & Compliant Name Policies</h4>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-2xl">
                        To maintain a clean database and elegant ticket displays, users should have single-word Given Names (e.g., changing <span className="text-amber-400 font-semibold">"Samin Tausif"</span> to <span className="text-green-400 font-semibold">"Samin"</span>). This utility broadcasts notice emails to profiles matching this filter, complete with a live example and secure update links.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-center bg-zinc-900 border border-white/5 rounded-2xl px-6 py-4 justify-center md:self-stretch min-w-[140px] md:flex-shrink-0">
                    <span className="text-2xl font-black text-amber-500">{multiWordProfiles.length}</span>
                    <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider mt-1 text-center">Profiles Flagged</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Left panel: Form editor */}
                  <div className="lg:col-span-7 space-y-6">
                    <div className="p-6 rounded-3xl bg-zinc-950 border border-white/5 space-y-4">
                      <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 border-b border-white/5 pb-3">Craft Notice Broadcast</h3>

                      <DashboardFormField 
                        label="Email Subject Line" 
                        type="text"
                        value={bulkNameSubject} 
                        onChange={setBulkNameSubject} 
                        placeholder="e.g. Action Required: Please update your registered profile name"
                        description="Subject line for the notification. Placeholders available: {NAME}, {GIVEN_NAME}, {EMAIL}."
                      />

                      <DashboardFormField 
                        label="HTML Template Body" 
                        type="textarea"
                        value={bulkNameTemplate} 
                        onChange={setBulkNameTemplate} 
                        placeholder="HTML email body..."
                        description="Placeholders: {NAME} (Current Name), {GIVEN_NAME} (Guessed Name, e.g. Samin), {EMAIL}, {REDIRECT_URL} (Redirect link to change profile name)."
                      />

                      {/* Safety verification check */}
                      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex items-start gap-3 select-none">
                        <input
                          type="checkbox"
                          id="confirm-bulk-name-checkbox"
                          checked={confirmBulkName}
                          onChange={(e) => setConfirmBulkName(e.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-850 text-amber-500 focus:ring-amber-500/20 focus:ring-offset-0 cursor-pointer"
                        />
                        <label htmlFor="confirm-bulk-name-checkbox" className="text-xs text-zinc-400 leading-relaxed cursor-pointer selection:bg-transparent">
                          <strong className="text-white block font-semibold mb-0.5">
                            I authorize this bulk email broadcast
                          </strong>
                          I verify that this email will be delivered only to the {multiWordProfiles.length} identified profiles with multi-word names. It specifies the "Given Name only" rule with the exact example "Samin Tausif, given name Samin".
                        </label>
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <DashboardButton 
                          label={sendingBulkNameNotice ? "Broadcasting..." : `Send Bulk Notice to ${multiWordProfiles.length} Users`} 
                          onClick={sendBulkNameNotice}
                          disabled={
                            sendingBulkNameNotice || 
                            !confirmBulkName || 
                            !bulkNameSubject.trim() || 
                            !bulkNameTemplate.trim() ||
                            multiWordProfiles.length === 0
                          }
                          icon={sendingBulkNameNotice ? Loader2 : Mail}
                          variant="primary"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right panel: Flagged users & interactive search */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="p-6 rounded-3xl bg-zinc-950 border border-white/5 space-y-4 flex flex-col h-[650px]">
                      <div className="flex items-center justify-between border-b border-white/5 pb-3">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400">Flagged Profiles</h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                          {multiWordProfiles.filter(p => {
                            const term = bulkNameSearchTerm.trim().toLowerCase();
                            if (!term) return true;
                            return (p.full_name || '').toLowerCase().includes(term) || (p.email || '').toLowerCase().includes(term);
                          }).length} of {multiWordProfiles.length}
                        </span>
                      </div>

                      {/* Interactive search input */}
                      <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search flagged profiles..."
                          value={bulkNameSearchTerm}
                          onChange={(e) => setBulkNameSearchTerm(e.target.value)}
                          className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/5 rounded-xl text-xs text-white placeholder:text-zinc-500 outline-none focus:border-amber-500/30 transition-all"
                        />
                      </div>

                      {/* List container */}
                      <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                        {loadingMultiWordProfiles ? (
                          <div className="flex flex-col items-center justify-center py-20 gap-3">
                            <Loader2 className="w-6 h-6 text-amber-500 animate-spin" />
                            <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">Analyzing Name Formats...</span>
                          </div>
                        ) : multiWordProfiles.filter(p => {
                          const term = bulkNameSearchTerm.trim().toLowerCase();
                          if (!term) return true;
                          return (p.full_name || '').toLowerCase().includes(term) || (p.email || '').toLowerCase().includes(term);
                        }).length === 0 ? (
                          <div className="text-center py-12 text-zinc-500 text-xs">
                            No matching flagged profiles found.
                          </div>
                        ) : (
                          multiWordProfiles.filter(p => {
                            const term = bulkNameSearchTerm.trim().toLowerCase();
                            if (!term) return true;
                            return (p.full_name || '').toLowerCase().includes(term) || (p.email || '').toLowerCase().includes(term);
                          }).map((p) => {
                            const guessedGiven = (p.full_name || '').trim().split(/\s+/)[0] || '';
                            return (
                              <div key={p.id} className="p-4 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 transition-all space-y-2">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="min-w-0 flex-1">
                                    <p className="text-xs font-black text-white truncate uppercase tracking-wide">
                                      {p.full_name}
                                    </p>
                                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">
                                      {p.email}
                                    </p>
                                  </div>
                                  <span className="px-2 py-0.5 rounded bg-amber-500/5 border border-amber-500/10 text-[9px] font-black uppercase text-amber-400 tracking-widest whitespace-nowrap self-start">
                                    Flagged
                                  </span>
                                </div>
                                <div className="pt-2 border-t border-white/[0.03] flex items-center justify-between text-[10px]">
                                  <span className="text-zinc-500 font-medium">Guessed Given Name:</span>
                                  <span className="text-green-400 font-bold uppercase">{guessedGiven}</span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'food' && (
          <motion.div
            key="food"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Food Distribution Control" 
              description="Announce start of food distribution and manage permission overrides for normal admins."
              icon={Utensils}
            >
              {loadingFoodConfig ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Current Active Status Showcase */}
                  <div className={`p-6 rounded-3xl border ${foodConfig?.settings?.distribution_enabled ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${foodConfig?.settings?.distribution_enabled ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500 animate-pulse'}`}>
                          {foodConfig?.settings?.distribution_enabled ? <Unlock className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white uppercase tracking-widest">
                            Distribution Status: {foodConfig?.settings?.distribution_enabled ? 'ANNOUNCED & ACTIVE' : 'LOCKED / DEACTIVATED'}
                          </h4>
                          <p className="text-[10px] text-zinc-500 uppercase tracking-widest">
                            {foodConfig?.settings?.distribution_enabled 
                              ? 'Normal admins are allowed to open the scanner to distribute food portions.' 
                              : 'Normal admins are strictly blocked from scanning QR codes or accessing the manual portion register.'}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => updateFoodDistributionStatus(!foodConfig?.settings?.distribution_enabled)}
                        disabled={savingFoodConfig}
                        className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md active:scale-95 flex items-center gap-2 ${
                          foodConfig?.settings?.distribution_enabled 
                            ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/10' 
                            : 'bg-green-600 hover:bg-green-500 text-white shadow-green-600/10'
                        } ${savingFoodConfig ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {savingFoodConfig && <Loader2 className="w-4 h-4 animate-spin" />}
                        {foodConfig?.settings?.distribution_enabled ? (
                          <>
                            <Lock className="w-4 h-4" />
                            Stop Distribution
                          </>
                        ) : (
                          <>
                            <Unlock className="w-4 h-4" />
                            Announce Start
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Informational Guidelines Card */}
                  <div className="p-8 rounded-3xl bg-amber-500/5 border border-amber-500/10 space-y-4">
                    <h4 className="text-sm font-bold text-amber-500 uppercase tracking-widest flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-500" />
                      About Food Distribution Announcement
                    </h4>
                    <div className="space-y-3 text-[11px] text-zinc-400 leading-relaxed uppercase tracking-wider">
                      <p>1. <strong className="text-white">Announcing the start</strong> of food distribution switches the live setting to active across the application instantly.</p>
                      <p>2. Normal admins can access the <strong className="text-white">Food Management Tab</strong> to capture student profile QR codes using live camera access.</p>
                      <p>3. If the event breaks or concludes, click <strong className="text-white">Stop Distribution</strong>. This instantly shuts down and locks normal admin inputs, preventing unexpected, accidental, or duplicate claims.</p>
                      <p>4. Super admins retain the absolute authority to override scan records even when the distribution status is locked.</p>
                    </div>
                  </div>

                  {/* Settings and Slots Configuration Panel */}
                  <div className="border-t border-white/5 pt-8 space-y-6">
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-white uppercase tracking-widest text-amber-500">Food Schedule & Portion Settings</h4>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Configure food portion slots, adjust distribution claim limits, or reset the daily claim registry logs.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Slots List */}
                      <div className="space-y-4">
                        <span className="text-[10.5px] font-black text-white uppercase tracking-widest block border-b border-white/5 pb-2">Active Slots Inventory</span>
                        
                        <div className="space-y-2.5">
                          {(foodConfig?.settings?.slots || [
                            { id: 'snacks', name: 'Snacks', max_servings: 1 },
                            { id: 'lunch', name: 'Lunch', max_servings: 1 },
                            { id: 'refreshments', name: 'Refreshments', max_servings: 1 }
                          ]).map((slot: any) => {
                            const isAvailable = (foodConfig?.settings?.available_slots !== undefined)
                              ? (foodConfig?.settings?.available_slots || []).includes(slot.id)
                              : true;

                            return (
                              <div 
                                key={slot.id} 
                                className={`p-4 rounded-xl border flex items-center justify-between transition-all ${slot.id === (foodConfig?.settings?.active_slot_id || 'snacks') ? 'bg-amber-500/5 border-amber-500/35' : 'bg-white/5 border-white/5'}`}
                              >
                                <div>
                                  <p className="text-xs font-bold text-white uppercase tracking-wide flex items-center gap-2">
                                    {slot.name}
                                    {slot.id === (foodConfig?.settings?.active_slot_id || 'snacks') && <span className="text-[8px] bg-amber-500 text-black px-1.5 py-0.5 rounded font-black tracking-widest uppercase">Active Target</span>}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider mt-1">
                                    Limit: {slot.max_servings} distribution claim(s)
                                  </p>
                                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 mt-2 rounded text-[8px] font-black tracking-widest uppercase border ${
                                    isAvailable 
                                      ? 'bg-green-500/10 border-green-500/20 text-green-400' 
                                      : 'bg-red-500/10 border-red-500/20 text-red-500'
                                  }`}>
                                    {isAvailable ? 'Available to Admins' : 'Locked for Admins'}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => toggleSlotAvailability(slot.id)}
                                    disabled={savingFoodConfig}
                                    className={`px-3 py-1.5 text-[9px] rounded-lg font-black uppercase tracking-wider transition-all border ${
                                      isAvailable 
                                        ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' 
                                        : 'bg-zinc-800/50 border-white/5 text-zinc-400 hover:text-white hover:bg-zinc-850'
                                    }`}
                                    title="Toggle availability for normal admins"
                                  >
                                    {isAvailable ? 'Revoke Access' : 'Allow Access'}
                                  </button>

                                  {slot.id !== (foodConfig?.settings?.active_slot_id || 'snacks') && (
                                    <button 
                                      onClick={() => handleSetActiveSlot(slot.id)}
                                      disabled={savingFoodConfig}
                                      className="px-3 py-1.5 text-[9px] bg-white/5 border border-white/10 rounded-lg text-zinc-400 hover:text-white hover:border-white/20 font-black uppercase tracking-wider transition-all disabled:opacity-50"
                                    >
                                      Activate
                                    </button>
                                  )}
                                  
                                  <button 
                                    onClick={() => handleRemoveSlot(slot.id)}
                                    disabled={savingFoodConfig}
                                    className="p-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500 hover:text-white text-red-500 rounded-lg transition-all disabled:opacity-50"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Slot Creator Form */}
                      <div className="p-6 bg-white/[0.01] border border-white/5 rounded-2xl space-y-4">
                        <span className="text-[10.5px] font-black text-white uppercase tracking-widest block border-b border-white/5 pb-2">Add New Portions Slot</span>
                        
                        <form onSubmit={handleAddSlot} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Slot Name</label>
                            <input 
                              type="text"
                              required
                              value={newSlotName}
                              onChange={(e) => setNewSlotName(e.target.value)}
                              placeholder="e.g. BREAKFAST, DINNER"
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs uppercase focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-zinc-600"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest ml-1">Max Allowable Distributions</label>
                            <input 
                              type="number"
                              required
                              min={1}
                              max={5}
                              value={newSlotMaxServings}
                              onChange={(e) => setNewSlotMaxServings(parseInt(e.target.value) || 1)}
                              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-bold text-xs focus:outline-none focus:border-amber-500/50 transition-all"
                            />
                          </div>

                          <button 
                            type="submit"
                            disabled={savingFoodConfig}
                            className="w-full py-3 bg-amber-500 border border-amber-600 hover:bg-amber-400 text-black font-black text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md shadow-amber-500/5 flex items-center justify-center gap-2"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Register Food Item Slot
                          </button>
                        </form>
                      </div>
                    </div>

                    {/* Dangerous maintenance actions */}
                    <div className="p-5 border border-red-900/40 bg-red-950/5 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-8">
                      <div>
                        <p className="text-xs font-bold text-red-500 uppercase tracking-wide flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          End of Day Operations
                        </p>
                        <p className="text-[9.5px] text-zinc-500 uppercase tracking-widest leading-loose max-w-xl">
                          Clearing the logs will erase all food portion scans recorded for today. Normal admins will be able to scanning new QR codes of members again on a fresh session for the next day.
                        </p>
                      </div>
                      <button 
                        onClick={handleResetLogs}
                        disabled={savingFoodConfig}
                        className="px-6 py-3 bg-red-600 border border-red-700 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-lg active:scale-95 text-center disabled:opacity-50"
                      >
                        Clear portion claim logs & Reset Day
                      </button>
                    </div>
                  </div>

                </div>
              )}
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'database' && (
          <motion.div
            key="database"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Database Explorer" 
              description="Directly view and monitor database records. Critical operations only."
              icon={DatabaseZap}
              actions={
                <div className="flex items-center gap-3">
                  <DashboardButton 
                    label="Add Row" 
                    onClick={() => addRow(selectedTable)}
                    icon={Plus}
                    className="h-9 px-4 text-[10px]"
                    variant="secondary"
                  />
                  <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500/30 uppercase tracking-widest cursor-pointer"
                  >
                    {tables.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
              }
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-500 font-medium leading-relaxed uppercase tracking-widest">
                  Direct database manipulation can cause site-wide instability. Any deletion here will affect live users.
                </p>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                {loadingTable ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-white/5">
                        {tableData.length > 0 && Object.keys(tableData[0]).slice(0, 6).map(key => (
                          <th key={key} className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">{key}</th>
                        ))}
                        <th className="py-4 px-6 w-24 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          {Object.entries(row).slice(0, 6).map(([key, val]: any, j) => (
                            <td key={j} className="py-4 px-6 overflow-hidden truncate whitespace-nowrap text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors" title={val !== null && val !== undefined ? String(val) : ''}>
                              {val === null || val === undefined 
                                ? '' 
                                : typeof val === 'object' 
                                  ? (React.isValidElement(val) ? val : '[Object]') 
                                  : String(val)}
                            </td>
                          ))}
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-1">
                               <button 
                                 onClick={() => editRow(selectedTable, row)}
                                 className="p-2 text-zinc-600 hover:text-amber-500 transition-colors"
                                 title="Edit row"
                               >
                                 <Plus className="w-3.5 h-3.5 rotate-45" />
                               </button>
                               <button 
                                 onClick={() => deleteRow(selectedTable, row.id || row.email || row.member_id)}
                                 className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                 title="Delete row"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {tableData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-zinc-600 text-xs italic">Table is empty.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'cards' && (
          <motion.div
            key="cards"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Verified Member ID Cards" 
              description="View, verify, and generate printable multi-page print sheets of all verified members' ID cards. Highly optimized for saving as a PDF file."
              icon={QrCode}
              actions={
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search verified members..."
                      value={memberSearchTerm}
                      onChange={(e) => setMemberSearchTerm(e.target.value)}
                      className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-full"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const allSelected = members.every(m => selectedMembers[m.id]);
                      const nextSelection: Record<string, boolean> = {};
                      members.forEach(m => {
                        nextSelection[m.id] = !allSelected;
                      });
                      setSelectedMembers(nextSelection);
                    }}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white font-heavy text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    {members.every(m => selectedMembers[m.id]) ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={() => {
                      const noneSelected = !Object.values(selectedMembers).some(Boolean);
                      if (noneSelected) {
                        showToast('Please select at least one member to print', 'error');
                        return;
                      }
                      window.print();
                    }}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-heavy text-[10px] uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 text-center"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Print Selected ({Object.values(selectedMembers).filter(Boolean).length})
                  </button>
                </div>
              }
            >
              {loadingMembers ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Print and PDF Generation Configuration Dashboard */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-white uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Print Layout & PDF Output Settings
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Select single-page formats or an A4-optimized 2x2 grid. Zero margin-of-error page splitting.
                      </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                      <div className="flex items-center gap-1.5 bg-black/20 p-1.5 rounded-xl border border-white/5 w-full sm:w-auto">
                        <button
                          onClick={() => setPrintLayout('grid2x2')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            printLayout === 'grid2x2' 
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          2x2 Grid (A4)
                        </button>
                        <button
                          onClick={() => setPrintLayout('single')}
                          className={`flex-1 sm:flex-none px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                            printLayout === 'single' 
                              ? 'bg-amber-500 text-black shadow-md shadow-amber-500/10' 
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          1 Card / Page
                        </button>
                      </div>

                      <button
                        onClick={generateBulkPdf}
                        disabled={generatingPdf}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] font-black text-white uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all ${
                          generatingPdf 
                            ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed' 
                            : 'bg-purple-600 hover:bg-purple-500 shadow-lg shadow-purple-600/15'
                        }`}
                      >
                        {generatingPdf && !activePdfEcMember ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                            Rendering ({pdfProgress}%)
                          </>
                        ) : (
                          <>
                            <Database className="w-3.5 h-3.5 text-purple-300" />
                            Download 2x2 PDF
                          </>
                        )}
                      </button>

                      <button
                        onClick={generateEcIdsPdf}
                        disabled={generatingPdf}
                        className={`w-full sm:w-auto px-5 py-3 rounded-xl text-[9px] font-black text-black uppercase tracking-widest cursor-pointer flex items-center justify-center gap-2 transition-all ${
                          generatingPdf 
                            ? 'bg-zinc-800 border border-zinc-700 text-zinc-500 cursor-not-allowed' 
                            : 'bg-amber-500 hover:bg-amber-400 shadow-lg shadow-amber-500/15'
                        }`}
                      >
                        {generatingPdf && activePdfEcMember ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                            Generating EC ({pdfProgress}%)
                          </>
                        ) : (
                          <>
                            <QrCode className="w-3.5 h-3.5 text-black" />
                            Download EC Cards (Print & Fold)
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Member Stats Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div 
                      onClick={() => setMemberRoleFilter('general')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        memberRoleFilter === 'general' 
                          ? 'bg-purple-500/10 border-purple-500/50 shadow-lg shadow-purple-500/5' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">General Members</p>
                          <h3 className="text-3xl font-black text-white font-mono">
                            {members.filter(m => !m.is_ec).length}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          JMC ID (6-digit)
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">
                        Click to filter and view standard verified club members, their names, classes, sections, rolls, and unique JMC IDs.
                      </p>
                    </div>

                    <div 
                      onClick={() => setMemberRoleFilter('ec')}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                        memberRoleFilter === 'ec' 
                          ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' 
                          : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-1">EC Officers</p>
                          <h3 className="text-3xl font-black text-white font-mono">
                            {members.filter(m => m.is_ec).length}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 text-[8px] font-black uppercase tracking-wider rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30">
                          EC ID (3-digit)
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-2 font-medium leading-relaxed">
                        Click to filter and view Executive Committee officers, their positions, classes, sections, rolls, and 3-digit IDs.
                      </p>
                    </div>
                  </div>

                  {/* Filter Sub-Tabs */}
                  <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMemberRoleFilter('all')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          memberRoleFilter === 'all'
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'text-zinc-500 hover:text-white border border-transparent'
                        }`}
                      >
                        All ({members.length})
                      </button>
                      <button
                        onClick={() => setMemberRoleFilter('general')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          memberRoleFilter === 'general'
                            ? 'bg-purple-600/20 text-purple-400 border border-purple-500/30'
                            : 'text-zinc-500 hover:text-purple-400 border border-transparent'
                        }`}
                      >
                        General ({members.filter(m => !m.is_ec).length})
                      </button>
                      <button
                        onClick={() => setMemberRoleFilter('ec')}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                          memberRoleFilter === 'ec'
                            ? 'bg-amber-600/20 text-amber-400 border border-amber-500/30'
                            : 'text-zinc-500 hover:text-amber-400 border border-transparent'
                        }`}
                      >
                        EC ({members.filter(m => m.is_ec).length})
                      </button>
                    </div>
                    
                    <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase hidden sm:block">
                      Showing: {memberRoleFilter === 'all' ? 'All Club Members' : memberRoleFilter === 'general' ? 'General Members' : 'EC Officers'}
                    </p>
                  </div>

                  {/* Grid list of members */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {members
                      .filter(m => {
                        if (memberRoleFilter === 'general' && m.is_ec) return false;
                        if (memberRoleFilter === 'ec' && !m.is_ec) return false;
                        return true;
                      })
                      .filter(m => 
                        m.full_name?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.member_id?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.email?.toLowerCase().includes(memberSearchTerm.toLowerCase()) ||
                        m.class?.toLowerCase().includes(memberSearchTerm.toLowerCase())
                      )
                      .map((m) => {
                        const isSelected = !!selectedMembers[m.id];
                        return (
                          <div 
                            key={m.id}
                            onClick={() => {
                              setSelectedMembers(prev => ({
                                ...prev,
                                [m.id]: !prev[m.id]
                              }));
                            }}
                            className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5' 
                                : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              {/* Selection Indicator */}
                              <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                isSelected 
                                  ? 'bg-amber-500 border-amber-500 text-black' 
                                  : 'border-zinc-700 hover:border-white'
                              }`}>
                                {isSelected && (
                                  <svg className="w-2.5 h-2.5 stroke-[3]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                  </svg>
                                )}
                              </div>

                              {/* Member basic info */}
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{m.full_name}</p>
                                <p className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-1">{m.member_id}</p>
                                <div className="flex items-center gap-2 text-[9px] text-zinc-400 font-semibold">
                                  <span>C: {m.class}</span>
                                  <span>•</span>
                                  <span>S: {m.section}</span>
                                  <span>•</span>
                                  <span>R: {m.roll}</span>
                                </div>
                              </div>
                            </div>

                            {/* Little Badge info */}
                            <span className="text-[8px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400">
                              {m.is_ec ? 'EC' : 'General'}
                            </span>
                          </div>
                        );
                      })}
                  </div>

                  {members.length === 0 && (
                    <div className="text-center py-20 text-zinc-550 text-xs italic">
                      No verified club members found. Verified members will appear here.
                    </div>
                  )}
                </div>
              )}
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Verified Transactions & Export" 
              description="Monitor all verified event registrations. Export details as a CSV file."
              icon={CheckCircle2}
              actions={
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                    <input
                      type="text"
                      placeholder="Search transactions..."
                      value={txSearchTerm}
                      onChange={(e) => setTxSearchTerm(e.target.value)}
                      className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-full font-bold"
                    />
                  </div>
                  <button
                    onClick={exportVerifiedTransactionsCSV}
                    disabled={loadingTransactions || verifiedTransactions.length === 0}
                    className="w-full sm:w-auto px-5 py-2.5 bg-green-500 text-black font-black text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(34,197,94,0.15)] flex items-center justify-center gap-2 hover:bg-green-400 cursor-pointer disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" /> Export as CSV
                  </button>
                </div>
              }
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4">
                  <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  <p className="text-[10px] text-amber-500 font-medium leading-relaxed uppercase tracking-widest">
                    Showing authenticated, verified registrations only. These records have been confirmed, paid, and verified by administrators.
                  </p>
                </div>
                <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex flex-col justify-center gap-1">
                  <div className="flex items-center gap-2">
                    <DatabaseZap className="w-4 h-4 text-blue-400" />
                    <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">Database Optimization Option</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 leading-normal uppercase tracking-wider">
                    To store verifying admin emails directly in the event tables, run this SQL statement in your Supabase SQL Editor:
                  </p>
                  <code className="text-[9px] font-mono text-zinc-300 bg-black/40 p-1.5 rounded-lg border border-white/5 select-all overflow-x-auto whitespace-pre">
                    {`ALTER TABLE public.primary_events ADD COLUMN IF NOT EXISTS verified_by TEXT;\nALTER TABLE public.junior_events ADD COLUMN IF NOT EXISTS verified_by TEXT;\nALTER TABLE public.secondary_events ADD COLUMN IF NOT EXISTS verified_by TEXT;\nALTER TABLE public.higher_secondary_events ADD COLUMN IF NOT EXISTS verified_by TEXT;`}
                  </code>
                </div>
              </div>

              {/* Type Filter Tabs */}
              <div className="flex flex-wrap gap-2 mb-6 border-b border-white/5 pb-4">
                {[
                  { id: 'all', label: 'All Transactions', count: verifiedTransactions.length },
                  { 
                    id: 'online', 
                    label: 'Online Paid', 
                    count: verifiedTransactions.filter(tx => {
                      const registeredBy = tx.registered_by || '';
                      const bkashNumber = tx.bkash_number || '';
                      const trxnid = tx.trxnid || '';
                      return !(
                        (registeredBy && registeredBy !== 'Self (Online)') || 
                        bkashNumber.startsWith('PROXY:') || 
                        trxnid.startsWith('PROXY-')
                      );
                    }).length 
                  },
                  { 
                    id: 'spot', 
                    label: 'Spot / Admin Proxy', 
                    count: verifiedTransactions.filter(tx => {
                      const registeredBy = tx.registered_by || '';
                      const bkashNumber = tx.bkash_number || '';
                      const trxnid = tx.trxnid || '';
                      return (
                        (registeredBy && registeredBy !== 'Self (Online)') || 
                        bkashNumber.startsWith('PROXY:') || 
                        trxnid.startsWith('PROXY-')
                      );
                    }).length 
                  }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTxTypeFilter(tab.id as 'all' | 'online' | 'spot')}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer ${
                      txTypeFilter === tab.id
                        ? 'bg-amber-500 text-black border-amber-500'
                        : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab.label}
                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${
                      txTypeFilter === tab.id ? 'bg-black/20 text-black' : 'bg-white/10 text-zinc-400'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                {loadingTransactions ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="py-20 text-center text-zinc-650 text-xs italic">
                    No verified transactions found matching your criteria.
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Full Name</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Table / Category</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Class / Sec / Roll</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Verified By</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Transaction ID</th>
                        <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx, idx) => {
                        const registeredBy = tx.registered_by || '';
                        const bkashNumber = tx.bkash_number || '';
                        const trxnid = tx.trxnid || '';
                        
                        const isSpot = 
                          (registeredBy && registeredBy !== 'Self (Online)') || 
                          bkashNumber.startsWith('PROXY:') || 
                          trxnid.startsWith('PROXY-');

                        return (
                          <tr key={`${tx.tableName}-${tx.id}-${idx}`} className="border-b border-white/5 group hover:bg-white/[0.01]">
                            <td className="py-4 px-6">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="text-xs font-bold text-white mb-0.5">{tx.full_name}</p>
                                  {isSpot ? (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                      Spot/Proxy
                                    </span>
                                  ) : (
                                    <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      Online Paid
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-500 font-mono">{cleanDisplayEmail(tx.email) || 'No email profile'}</p>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                {tx.tableName.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-xs font-semibold text-zinc-300">
                                Class: {tx.class} | {tx.section} | #{tx.roll}
                              </p>
                            </td>
                            <td className="py-4 px-6">
                              <p className="text-xs font-mono text-zinc-400">
                                {tx.verified_by || tx.verified_by_audit || (tx.registered_by && tx.registered_by !== 'Self (Online)' ? tx.registered_by : '') || (tx.bkash_number?.startsWith("PROXY: ") ? tx.bkash_number.replace("PROXY: ", "") : '') || 'System/Auto'}
                              </p>
                            </td>
                            <td className="py-4 px-6 font-mono text-xs font-black text-green-500 uppercase">
                              {tx.trxnid}
                            </td>
                            <td className="py-4 px-6 text-xs text-white font-bold">
                              {tx.amount} BDT
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'registration' && (
          <motion.div
            key="registration"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <DashboardSection 
              title="Form Toggle & Gatekeepers" 
              description="Dynamically unlock or lock all user-facing event registration systems."
              icon={ShieldAlert}
            >
              <RegistrationToggleControl />
            </DashboardSection>

            <DashboardSection
              title="Event Registration Parameters Editor"
              description="Completely customize solo events, team events, participant sizes, pricing structures, and payment instructions."
              icon={SlidersHorizontal}
            >
              <EventRegistrationConfigEditor showToast={showToast} />
            </DashboardSection>

            <DashboardSection
              title="Inter-School Event Registration Parameters Editor"
              description="Customize payment guidelines, bKash receiver, selective Campus Ambassador (CA) codes, and event segment price points."
              icon={SlidersHorizontal}
            >
              <InterEventRegistrationConfigEditor showToast={showToast} />
            </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>

      {mounted && typeof document !== 'undefined' && createPortal(
        <div className="print-container-portal hidden print:block bg-transparent text-white">
          {printLayout === 'grid2x2' ? (
            chunkArray(members.filter(m => selectedMembers[m.id]), 4).map((chunk, pageIdx) => (
              <div 
                key={pageIdx} 
                className="print-page-grid-2x2"
              >
                {chunk.map((m) => {
                  const isEc = !!m.is_ec;
                  const brandingColor = isEc ? '#F59E0B' : '#8475FF';
                  
                  return (
                    <div 
                      key={m.id} 
                      className="print-grid-cell"
                    >
                      <div 
                        className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center id-card-print-node-scaled"
                        style={{
                          borderColor: `${brandingColor}66`,
                          boxShadow: 'none',
                          WebkitPrintColorAdjust: 'exact',
                          printColorAdjust: 'exact',
                        } as any}
                      >
                        {/* Blank Background Template Image */}
                        <Image 
                          src={isEc ? "/images/ec_id_card_bg.jpeg" : "/images/id-card-bg.png"} 
                          alt="ID Card Background" 
                          fill
                          className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                          referrerPolicy="no-referrer" 
                        />

                        {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                        <div className="absolute inset-0 z-10 pointer-events-none">
                          
                          {/* QR Code */}
                          <div 
                            className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                            style={{
                              top: '353px',
                              left: '182px',
                              width: '274px',
                              height: '274px',
                              padding: '17px',
                              boxShadow: 'none'
                            }}
                          >
                            <QRCode 
                              value={JSON.stringify({
                                name: m.full_name,
                                id: m.member_id,
                                class: m.class,
                                section: m.section,
                                roll: m.roll,
                                role: isEc ? 'EC Officer' : 'General Member',
                                is_ec: isEc,
                                v: '1.0'
                              })}
                              size={240}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          {/* Name */}
                          <div 
                            className="absolute flex items-center justify-start pointer-events-auto"
                            style={{
                              top: isEc ? '814px' : '825px',
                              left: '186px',
                              width: '390px',
                              height: '32px',
                            }}
                          >
                            <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                              (m.full_name || "").length > 20 
                                ? 'text-[15px]' 
                                : (m.full_name || "").length > 15 
                                  ? 'text-[17px]' 
                                  : 'text-[20px]'
                            }`}>
                              {m.full_name || "—"}
                            </span>
                          </div>

                          {/* Class */}
                          <div 
                            className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                            style={{
                              top: isEc ? '870px' : '880px',
                              left: isEc ? '183px' : '150px',
                              width: '80px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                              {m.class || "—"}
                            </span>
                          </div>

                          {/* Section */}
                          <div 
                            className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                            style={{
                              top: isEc ? '870px' : '880px',
                              left: isEc ? '423px' : '390px',
                              width: '60px',
                              height: '24px',
                            }}
                          >
                             <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                              (m.section || "").length > 5
                                ? 'text-[12px] tracking-tight'
                                : 'text-[16px]'
                            }`}>
                              {m.section || "—"}
                            </span>
                          </div>

                          {/* Roll */}
                          <div 
                            className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                            style={{
                              top: isEc ? '870px' : '880px',
                              left: '544px',
                              width: '50px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                              {m.roll || "—"}
                            </span>
                          </div>

                          {/* ID No */}
                          <div 
                            className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                            style={{
                              top: isEc ? '934px' : '940px',
                              left: '213px',
                              width: '260px',
                              height: '24px',
                            }}
                          >
                            <span className={`text-white font-black tracking-widest leading-none select-all ${
                              (m.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                            }`}>
                              {m.member_id || "—"}
                            </span>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          ) : (
            members
              .filter(m => selectedMembers[m.id])
              .map((m) => {
              const isEc = !!m.is_ec;
              const brandingColor = isEc ? '#F59E0B' : '#8475FF';
              
              return (
                <div 
                  key={m.id} 
                  className="print-page-wrapper"
                  style={{ 
                    pageBreakAfter: 'always', 
                    breakAfter: 'page',
                    pageBreakInside: 'avoid',
                    breakInside: 'avoid',
                    width: '100%',
                    height: '100vh',
                    boxSizing: 'border-box',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'transparent'
                  }}
                >
                  <div 
                    className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-gradient-to-b from-[#11053D] via-[#090225] to-[#01000B] text-center text-white flex flex-col items-center id-card-print-node-scaled"
                    style={{
                      borderColor: `${brandingColor}66`,
                      boxShadow: isEc ? '0 0 60px rgba(245, 158, 11, 0.35)' : '0 0 60px rgba(58, 31, 241, 0.35)',
                      transform: 'scale(0.62)',
                      transformOrigin: 'center center',
                      WebkitPrintColorAdjust: 'exact',
                      printColorAdjust: 'exact',
                    } as any}
                  >
                    {/* Blank Background Template Image */}
                    <Image 
                      src={isEc ? "/images/ec_id_card_bg.jpeg" : "/images/id-card-bg.png"} 
                      alt="ID Card Background" 
                      fill
                      className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                      referrerPolicy="no-referrer" 
                    />

                    {/* Absolute Pixel-Perfect Overlay Layer for coordinates dynamic fields */}
                    <div className="absolute inset-0 z-10 pointer-events-none">
                      
                          {/* QR Code */}
                          <div 
                            className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                            style={{
                              top: '353px',
                              left: '182px',
                              width: '274px',
                              height: '274px',
                              padding: '17px',
                              boxShadow: isEc ? '0 0 40px rgba(245, 158, 11, 0.25)' : '0 0 40px rgba(58, 31, 241, 0.25)'
                            }}
                          >
                            <QRCode 
                              value={JSON.stringify({
                                name: m.full_name,
                                id: m.member_id,
                                class: m.class,
                                section: m.section,
                                roll: m.roll,
                                role: isEc ? 'EC Officer' : 'General Member',
                                is_ec: isEc,
                                v: '1.0'
                              })}
                              size={240}
                              level="H"
                              includeMargin={false}
                            />
                          </div>

                          {/* Name */}
                          <div 
                            className="absolute flex items-center justify-start pointer-events-auto"
                            style={{
                              top: isEc ? '814px' : '825px',
                              left: '186px',
                              width: '390px',
                              height: '32px',
                            }}
                          >
                            <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                              (m.full_name || "").length > 20 
                                ? 'text-[15px]' 
                                : (m.full_name || "").length > 15 
                                  ? 'text-[17px]' 
                                  : 'text-[20px]'
                            }`}>
                              {m.full_name || "—"}
                            </span>
                          </div>

                          {/* Class */}
                          <div 
                            className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                            style={{
                              top: isEc ? '870px' : '880px',
                              left: isEc ? '183px' : '150px',
                              width: '80px',
                              height: '24px',
                            }}
                          >
                            <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                              {m.class || "—"}
                            </span>
                          </div>

                          {/* Section */}
                          <div 
                            className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                            style={{
                              top: isEc ? '870px' : '880px',
                              left: isEc ? '423px' : '390px',
                              width: '60px',
                              height: '24px',
                            }}
                          >
                             <span className={`text-[#ffffff] font-black leading-none truncate select-all uppercase ${
                               (m.section || "").length > 5
                                 ? 'text-[12px] tracking-tight'
                                 : 'text-[16px]'
                             }`}>
                               {m.section || "—"}
                             </span>
                          </div>

                      {/* Roll */}
                      <div 
                        className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                        style={{
                          top: isEc ? '870px' : '880px',
                          left: '544px',
                          width: '50px',
                          height: '24px',
                        }}
                      >
                        <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                          {m.roll || "—"}
                        </span>
                      </div>

                      {/* ID No */}
                      <div 
                        className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                        style={{
                          top: isEc ? '934px' : '940px',
                          left: '213px',
                          width: '260px',
                          height: '24px',
                        }}
                      >
                        <span className={`text-white font-black tracking-widest leading-none select-all ${
                          (m.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                        }`}>
                          {m.member_id || "—"}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>,
        document.body
      )}

      {/* Dynamic offscreen sandbox card for programmatic PDF exports */}
      {activePdfMember && (
        <div 
          id="pdf-sandbox-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '638px',
            height: '1012px',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
        >
          <div 
            id="pdf-sandbox-card"
            className="relative w-[638px] h-[1012px] rounded-[52px] border-4 overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center"
            style={{
              borderColor: activePdfMember.is_ec ? '#F59E0B66' : '#8475FF66',
              boxShadow: 'none',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            <Image 
              src={activePdfMember.is_ec ? "/images/ec_id_card_bg.jpeg" : "/images/id-card-bg.png"} 
              alt="ID Card Background" 
              fill
              className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 z-10 pointer-events-none">
              
              {/* QR Code */}
              <div 
                className="absolute bg-white rounded-[24px] flex items-center justify-center select-all pointer-events-auto"
                style={{
                  top: '353px',
                  left: '182px',
                  width: '274px',
                  height: '274px',
                  padding: '17px',
                  boxShadow: activePdfMember.is_ec ? '0 0 40px rgba(245, 158, 11, 0.25)' : '0 0 40px rgba(58, 31, 241, 0.25)'
                }}
              >
                <QRCode 
                  value={JSON.stringify({
                    name: activePdfMember.full_name,
                    id: activePdfMember.member_id,
                    class: activePdfMember.class,
                    section: activePdfMember.section,
                    roll: activePdfMember.roll,
                    role: activePdfMember.is_ec ? 'EC Officer' : 'General Member',
                    is_ec: !!activePdfMember.is_ec,
                    v: '1.0'
                  })}
                  size={240}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Name */}
              <div 
                className="absolute flex items-center justify-start pointer-events-auto"
                style={{
                  top: activePdfMember.is_ec ? '814px' : '825px',
                  left: '186px',
                  width: '390px',
                  height: '32px',
                }}
              >
                <span className={`font-black uppercase text-white tracking-widest truncate w-full block text-left leading-none ${
                  (activePdfMember.full_name || "").length > 20 
                    ? 'text-[15px]' 
                    : (activePdfMember.full_name || "").length > 15 
                      ? 'text-[17px]' 
                      : 'text-[20px]'
                }`}>
                  {activePdfMember.full_name || "—"}
                </span>
              </div>

              {/* Class */}
              <div 
                className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                style={{
                  top: activePdfMember.is_ec ? '870px' : '880px',
                  left: activePdfMember.is_ec ? '183px' : '150px',
                  width: '80px',
                  height: '24px',
                }}
              >
                <span className="text-[16px] text-white font-black leading-none select-all uppercase">
                  {activePdfMember.class || "—"}
                </span>
              </div>

              {/* Section */}
              <div 
                className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                style={{
                  top: activePdfMember.is_ec ? '870px' : '880px',
                  left: activePdfMember.is_ec ? '423px' : '390px',
                  width: '60px',
                  height: '24px',
                }}
              >
                 <span className={`text-[#ffffff] font-black leading-none truncate tracking-wide select-all uppercase ${
                  (activePdfMember.section || "").length > 5
                    ? 'text-[12px] tracking-tight'
                    : 'text-[16px]'
                }`}>
                  {activePdfMember.section || "—"}
                </span>
              </div>

              {/* Roll */}
              <div 
                className="absolute flex items-center justify-center text-center pointer-events-auto font-extrabold"
                style={{
                  top: activePdfMember.is_ec ? '870px' : '880px',
                  left: '544px',
                  width: '50px',
                  height: '24px',
                }}
              >
                <span className="text-[16px] text-white font-black leading-none tracking-wide select-all font-extrabold">
                  {activePdfMember.roll || "—"}
                </span>
              </div>

              {/* ID No */}
              <div 
                className="absolute flex items-center justify-start text-left pointer-events-auto font-mono font-bold"
                style={{
                  top: activePdfMember.is_ec ? '934px' : '940px',
                  left: '213px',
                  width: '260px',
                  height: '24px',
                }}
              >
                <span className={`text-white font-black tracking-widest leading-none select-all ${
                  (activePdfMember.member_id || "").length > 14 ? 'text-[14px]' : 'text-[17px]'
                }`}>
                  {activePdfMember.member_id || "—"}
                </span>
              </div>

            </div>
          </div>
        </div>
      )}

      {activePdfEcMember && (
        <div 
          id="pdf-ec-sandbox-container"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: '-9999px',
            width: '1282px',
            height: '1012px',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
        >
          <div 
            id="pdf-ec-sandbox-card"
            className="relative flex items-center bg-[#090225]"
            style={{
              width: '1282px',
              height: '1012px',
              boxShadow: 'none',
              WebkitPrintColorAdjust: 'exact',
              printColorAdjust: 'exact',
            }}
          >
            {/* FRONT SIDE (LEFT) */}
            <div 
              className="relative w-[638px] h-[1012px] overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center flex-shrink-0"
              style={{
                borderRadius: '52px',
                border: '4px solid #F59E0B66',
              }}
            >
              <Image 
                src="/images/ec_front.png" 
                alt="EC ID Card Front" 
                fill
                className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                referrerPolicy="no-referrer" 
              />
              {/* Overlaid 3-Digit ID */}
              <div 
                className="absolute flex items-center justify-center text-center pointer-events-auto font-mono font-black"
                style={{
                  top: '543px',
                  left: '0',
                  width: '638px',
                  height: '120px',
                }}
              >
                <div className="flex flex-col items-center">
                  <span className="text-[12px] uppercase tracking-[0.25em] text-zinc-400 font-bold mb-1">EC Member ID</span>
                  <span className="text-[52px] font-black text-[#F59E0B] tracking-wider leading-none drop-shadow-[0_0_15px_rgba(245,158,11,0.5)]">
                    {(() => {
                      const m = activePdfEcMember;
                      if (!m.member_id) return '000';
                      const match = m.member_id.match(/\d{3}/);
                      if (match) return match[0];
                      const numStr = String(m.member_id).replace(/\D/g, '');
                      if (numStr.length >= 3) {
                        return numStr.slice(-3);
                      }
                      return numStr.padStart(3, '0');
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* FOLDING CREASE / GUIDE LINE */}
            <div className="w-[6px] h-full flex flex-col items-center justify-between py-10 relative z-20">
              <div className="absolute inset-y-0 left-[2.5px] border-l-2 border-dashed border-amber-500/40" />
              <span className="text-[8px] font-black tracking-widest text-amber-500/70 uppercase transform -rotate-90 origin-center whitespace-nowrap bg-[#090225] py-2 shrink-0">
                ✂️ CUT & FOLD GUIDE
              </span>
            </div>

            {/* BACK SIDE (RIGHT) */}
            <div 
              className="relative w-[638px] h-[1012px] overflow-hidden bg-[#000000] text-center text-white flex flex-col items-center flex-shrink-0"
              style={{
                borderRadius: '52px',
                border: '4px solid #F59E0B66',
              }}
            >
              <Image 
                src="/images/ec_back.png" 
                alt="EC ID Card Back" 
                fill
                className="absolute inset-0 w-full h-full object-fill rounded-[48px] pointer-events-none z-0"
                referrerPolicy="no-referrer" 
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
