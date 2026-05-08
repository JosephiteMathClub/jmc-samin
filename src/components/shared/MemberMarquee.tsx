"use client";
import React, { useMemo, useRef } from 'react';
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
  const constraintsRef = useRef(null);

  const members = useMemo(() => {
    // Remove duplicates if any and map to full paths
    const unique = Array.from(new Set(PANEL_26_IMAGES));
    return unique.map(img => ({
      url: `/images/members/panel_26/${img}`,
      name: img.split('.')[0].replace(/_/g, ' ')
    }));
  }, []);

  // For infinite marquee, we duplicate enough to cover screen
  const duplicatedMembers = useMemo(() => [...members, ...members], [members]);

  return (
    <div className="relative py-16 md:py-24 overflow-hidden bg-transparent">
      <div className="max-w-7xl mx-auto px-4 mb-10 md:mb-16 text-center">
        <h2 className="text-xl md:text-4xl font-display font-medium text-white tracking-[0.2em] md:tracking-widest uppercase mb-4">
          The <span className="text-[var(--c-6-start)]">Panel</span> Perspective
        </h2>
        <p className="text-zinc-500 font-mono text-[8px] md:text-[10px] uppercase tracking-[0.3em]">Directory_Manifest // Panel_26_Active</p>
      </div>

      <div className="relative" ref={constraintsRef}>
        <div className="flex overflow-hidden">
          <motion.div 
            drag="x"
            dragConstraints={constraintsRef}
            className="flex gap-4 md:gap-8 px-4 cursor-grab active:cursor-grabbing items-center h-36 md:h-64"
            initial={{ x: 0 }}
            animate={!shouldReduceGfx ? {
              x: ["0%", "-50%"],
            } : {}}
            transition={!shouldReduceGfx ? {
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 40,
                ease: "linear",
              },
            } : {}}
          >
            {duplicatedMembers.map((member, i) => (
              <div 
                key={i}
                className="group relative flex-shrink-0 w-28 h-28 md:w-48 md:h-48 rounded-xl overflow-hidden grayscale hover:grayscale-0 transition-all duration-700 bg-zinc-900 border border-white/5"
              >
                <Image
                  src={member.url}
                  alt={member.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 768px) 112px, 192px"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                  <span className="text-[7px] md:text-[10px] font-mono text-white uppercase tracking-tighter truncate w-full">
                    {member.name}
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* HUD Decoration Lines - No Glows */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-white/5" />
        <div className="absolute bottom-0 left-0 w-full h-[1px] bg-white/5" />
      </div>

      {/* Decorative Scanner Line */}
      {!shouldReduceGfx && (
        <motion.div 
          className="absolute bottom-0 left-0 h-[1px] bg-[var(--c-6-start)]/40 w-20"
          animate={{ left: ['0%', '100%', '0%'] }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />
      )}
    </div>
  );
};

export default MemberMarquee;
