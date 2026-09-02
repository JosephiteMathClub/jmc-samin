"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { 
  Code2, 
  Sparkles, 
  ExternalLink, 
  Award, 
  Workflow, 
  RotateCcw,
  CheckCircle2,
  ShieldCheck,
  ImageIcon
} from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardFileUpload } from '../DashboardFileUpload';
import { resolveImageUrl } from '@/lib/utils';

interface DeveloperProfile {
  name: string;
  role: string;
  alias?: string;
  image: string;
}

interface SupportingDevProfile {
  id: string;
  name: string;
  role: string;
  alias?: string;
  image: string;
}

interface DashboardDevelopersSectionProps {
  data: {
    samin?: DeveloperProfile;
    supporting?: SupportingDevProfile[];
  };
  updateSaminField: (field: string, value: any) => void;
  updateSupportingField: (index: number, field: string, value: any) => void;
  uploading: string | null;
  handleFileUpload: (
    e: React.ChangeEvent<HTMLInputElement>, 
    path?: (string | number)[], 
    callback?: (url: string) => void
  ) => void;
  shouldReduceGfx: boolean;
}

const DEFAULT_DEV_IMAGES = {
  samin: "/images/members/samin.jpg",
  supporting: [
    { id: "tawhid", name: "Tawhid Bin Omar", image: "/images/members/tawhid.jpg", role: "Idea Representer & Debugger", alias: "Idea & Debugging" },
    { id: "sharafi", name: "Sharafi Ahmed", image: "/images/members/sharafi.jpg", role: "Idea Representer & Debugger", alias: "Idea & Debugging" },
    { id: "sanjid", name: "Sanjid Kabir", image: "/images/members/sanjid.jpg", role: "Idea Representer & Debugger", alias: "Idea & Debugging" }
  ]
};

export const DashboardDevelopersSection: React.FC<DashboardDevelopersSectionProps> = ({
  data,
  updateSaminField,
  updateSupportingField,
  uploading,
  handleFileUpload,
  shouldReduceGfx
}) => {
  const saminData: DeveloperProfile = {
    name: data?.samin?.name || "Samin Tausif",
    role: data?.samin?.role || "Lead Developer & Architect",
    alias: data?.samin?.alias || "Chief Platform Creator",
    image: data?.samin?.image || DEFAULT_DEV_IMAGES.samin
  };

  const supportingList: SupportingDevProfile[] = DEFAULT_DEV_IMAGES.supporting.map((defaultDev, idx) => {
    const saved = data?.supporting?.[idx];
    return {
      id: saved?.id || defaultDev.id,
      name: saved?.name || defaultDev.name,
      role: saved?.role || defaultDev.role,
      alias: saved?.alias || defaultDev.alias,
      image: saved?.image || defaultDev.image
    };
  });

  return (
    <motion.div
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-10"
    >
      {/* Top Banner & Quick Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-zinc-900/60 to-purple-500/10 border border-amber-500/20 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 shadow-lg shadow-amber-500/10">
            <Code2 size={24} />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-tight font-display flex items-center gap-2">
              Developer Page Images <Sparkles size={16} className="text-amber-400" />
            </h3>
            <p className="text-xs text-zinc-400 font-sans mt-0.5">
              Upload official photos for Samin Tausif and the Idea Representers & Debuggers on the <code className="text-amber-300 font-mono">/developers</code> page.
            </p>
          </div>
        </div>

        <a 
          href="/developers" 
          target="_blank" 
          rel="noopener noreferrer"
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white hover:text-amber-300 border border-white/10 hover:border-amber-400/30 text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0"
        >
          <span>Live /developers Page</span>
          <ExternalLink size={14} />
        </a>
      </div>

      {/* SECTION 1: LEAD ARCHITECT (SAMIN TAUSIF) */}
      <DashboardSection
        icon={Award}
        title="Chief Platform Creator & Lead Architect"
        description="Official profile portrait for Samin Tausif rendered in the spotlight 3D monolithic card."
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Preview Box */}
          <div className="lg:col-span-4 flex flex-col items-center">
            <div className="relative aspect-square w-full max-w-[240px] rounded-3xl overflow-hidden bg-gradient-to-br from-amber-500/20 via-zinc-900 to-black border-2 border-amber-500/40 shadow-2xl group">
              <Image
                src={resolveImageUrl(saminData.image)}
                alt={saminData.name}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.target as any).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent flex flex-col justify-end p-4">
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-amber-400">
                  {saminData.alias}
                </span>
                <p className="text-sm font-bold text-white">
                  {saminData.name}
                </p>
                <p className="text-[10px] text-zinc-400">
                  {saminData.role}
                </p>
              </div>

              {/* Holographic Accents */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-amber-400 pointer-events-none" />
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-amber-400 pointer-events-none" />
            </div>

            <div className="mt-3 flex items-center gap-2 text-[10px] font-mono text-emerald-400 font-bold">
              <ShieldCheck size={13} />
              <span>Spotlight Card Active</span>
            </div>
          </div>

          {/* Upload Controls */}
          <div className="lg:col-span-8 space-y-4">
            <DashboardFileUpload
              label="Upload Samin Tausif's Photo"
              description="Recommended: High-resolution square or portrait photo (800x800px or higher, .jpg, .png, .webp)."
              value={saminData.image}
              path={['developers', 'samin', 'image']}
              uploading={uploading === 'developers-samin-image'}
              accept="image/jpeg,image/png,image/webp,image/jpg"
              onUpload={handleFileUpload}
              onValueChange={(val) => updateSaminField('image', val)}
              onDelete={() => updateSaminField('image', DEFAULT_DEV_IMAGES.samin)}
            />

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <div className="text-[11px] text-zinc-500 font-mono flex items-center gap-1.5">
                <ImageIcon size={13} className="text-amber-400" />
                <span>Formats: JPG, PNG, WebP (Max 10MB)</span>
              </div>

              {saminData.image !== DEFAULT_DEV_IMAGES.samin && (
                <button
                  type="button"
                  onClick={() => updateSaminField('image', DEFAULT_DEV_IMAGES.samin)}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw size={12} />
                  <span>Reset to Default Image</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* SECTION 2: IDEA REPRESENTERS & DEBUGGERS */}
      <DashboardSection
        icon={Workflow}
        title="Idea Representers & System Debuggers"
        description="Upload individual photos for Tawhid Bin Omar, Sharafi Ahmed, and Sanjid Kabir."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {supportingList.map((dev, index) => {
            const defaultDev = DEFAULT_DEV_IMAGES.supporting[index];
            const uploadPathKey = `developers-supporting-${index}-image`;
            const isCustomImage = dev.image !== defaultDev.image;

            return (
              <div 
                key={dev.id || index}
                className="p-5 rounded-3xl bg-zinc-950/80 border border-white/10 hover:border-amber-500/30 transition-all flex flex-col justify-between space-y-5"
              >
                {/* Header info */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[9px] font-mono font-bold uppercase tracking-wider text-amber-400">
                      {dev.alias}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      #{index + 1}
                    </span>
                  </div>

                  {/* Thumbnail Avatar Preview */}
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-zinc-900 border border-white/5 shadow-inner group">
                    <Image
                      src={resolveImageUrl(dev.image)}
                      alt={dev.name}
                      fill
                      className="object-cover transition-all duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.target as any).style.display = 'none';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-4">
                      <h4 className="text-base font-bold text-white font-display">
                        {dev.name}
                      </h4>
                      <p className="text-[10px] font-mono text-zinc-300 mt-0.5">
                        {dev.role}
                      </p>
                    </div>
                  </div>

                  {/* Upload Control */}
                  <DashboardFileUpload
                    label={`Upload Photo for ${dev.name.split(' ')[0]}`}
                    value={dev.image}
                    path={['developers', 'supporting', index, 'image']}
                    uploading={uploading === uploadPathKey}
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onUpload={handleFileUpload}
                    onValueChange={(val) => updateSupportingField(index, 'image', val)}
                    onDelete={() => updateSupportingField(index, 'image', defaultDev.image)}
                  />
                </div>

                {/* Footer Reset & Status */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[10px] font-mono">
                  <span className="text-zinc-500 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    <span>Sync Ready</span>
                  </span>

                  {isCustomImage && (
                    <button
                      type="button"
                      onClick={() => updateSupportingField(index, 'image', defaultDev.image)}
                      className="text-zinc-400 hover:text-amber-400 transition-colors flex items-center gap-1"
                      title="Reset to default image"
                    >
                      <RotateCcw size={11} />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </DashboardSection>
    </motion.div>
  );
};
