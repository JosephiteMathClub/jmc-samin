"use client";
import React, { useMemo } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { usePerformance } from '../../hooks/usePerformance';

const PANEL_26_IMAGES = [
  "intesher_alam_manam.png",
  "shoumik_saha-raj.png",
  "monwar_rafat.png",
  "arefin_anwar.png",
  "utkorsho_mistry_shouvik.png",
  "mahatab_hossain_zihan.png",
  "shirsha_roy.png",
  "ahnaf_abeed.png",
  "shafayet_azmayeen.png",
  "hosain_istiyake_antor.png",
  "mahi_bareed_noor.png",
  "protoy_nandi_ramya.png",
  "ahnaf_abeed.png",
  "arefin_anwar.png",
  "asif_ahmed-tamim.png",
  "emmanuel_gosal.png",
  "fardin_alam_niloy.png",
  "imtiaz_nasif_nur.png",
  "intesher_alam_manam.png",
  "jarif_bin_hossain.png",
  "mahatab_hossain_zihan.png",
  "mahi_bareed_noor.png",
  "monwar_rafat.png",
  "oyshworzo_ashad-dipto.png",
  "protoy_nandi_ramya.png",
  "sayeeb_safwan.png",
  "shafayet_azmayeen.png",
  "shirsha_roy.png",
  "shoumik_saha-raj.png",
  "tahmid_tahsan_pranto.png",
  "tapantar_das.png",
  "utkorsho_mistry_shouvik.png"
];

const MemberMarquee = () => {
  const { shouldReduceGfx } = usePerformance();

  const members = useMemo(() => {
    // Remove duplicates if any and map to full paths
    const unique = Array.from(new Set(PANEL_26_IMAGES));
    return unique.map(img => ({
      url: `/images/members/panel_26/${img}`,
      name: img.split('.')[0].replace(/_/g, ' ')
    }));
  }, []);

  const duplicatedMembers = useMemo(() => [...members, ...members], [members]);

  return (
    <div className="relative py-24 overflow-hidden bg-black/20 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 mb-16 text-center">
        <h2 className="text-2xl md:text-4xl font-display font-medium text-white tracking-widest uppercase mb-4">
          The <span className="text-[var(--c-6-start)]">Panel</span> Perspective
        </h2>
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-[0.3em]">Directory_Manifest // Panel_26_Active</p>
      </div>

      <div className="flex relative items-center">
        {!shouldReduceGfx && (
          <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#050505] to-transparent z-10" />
        )}
        {!shouldReduceGfx && (
          <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-[#050505] to-transparent z-10" />
        )}

        <div className="w-full overflow-hidden">
          <div className={`flex gap-4 md:gap-8 w-max px-4 ${!shouldReduceGfx ? 'animate-marquee marquee-pause hover:[animation-play-state:paused]' : 'overflow-x-auto pb-4 scrollbar-hide'}`}>
            {duplicatedMembers.map((member, i) => (
              <div 
                key={i}
                className="group relative flex-shrink-0 w-32 h-32 md:w-48 md:h-48 rounded-2xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-zinc-900 border border-white/5"
              >
                <Image
                  src={member.url}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 128px, 192px"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-4">
                  <span className="text-[8px] md:text-[10px] font-mono text-white uppercase tracking-tighter truncate w-full">
                    {member.name}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Decorative Scanner Line */}
      {!shouldReduceGfx && (
        <motion.div 
          className="absolute bottom-0 left-0 h-[2px] bg-[var(--c-6-start)]/30 blur-[2px]"
          style={{ width: '10%' }}
          animate={{ left: ['0%', '90%', '0%'] }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
};

export default MemberMarquee;
