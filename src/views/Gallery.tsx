"use client";
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, X } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
import { Fluid3DGallery } from '../components/ui/fluid-3d-gallery';
import { usePerformance } from '../hooks/usePerformance';

import { useContent } from '../context/ContentContext';

export interface GalleryItem {
  id: string;
  url: string;
  title: string;
  category?: string;
  description?: string;
}

export const GalleryView = () => {
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const { shouldReduceGfx } = usePerformance();
  const { content } = useContent();

  const galleryItems = Array.isArray(content?.gallery_page?.images) 
    ? content.gallery_page.images.map((img: any, i: number) => {
        if (typeof img === 'string') {
          return { id: `gallery-${i}`, url: img, title: 'Gallery Image', category: 'EVENT', description: '' };
        }
        return img;
      })
    : [];

  return (
    <div className="min-h-screen bg-transparent text-zinc-100 selection:bg-amber-500/30">
      <Navbar />
      
      <main className="pt-32 pb-20 relative">
        <section className="container-custom relative z-20 mb-10">
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-[0.4em]">Gallery</span>
            </motion.div>

            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter uppercase italic text-white"
            >
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-200">Legacy</span>
            </motion.h1>

            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-zinc-500 text-sm md:text-lg font-medium leading-relaxed"
            >
              Explore the rich history and vibrant moments of the Josephite Math Club. 
              A visual archive of our competitions, events, and mathematical endeavors.
            </motion.p>
          </div>
        </section>

        {/* Fluid 3D Gallery Component */}
        <section className="relative z-10 w-full mb-20 overflow-hidden">
           <Fluid3DGallery 
             items={galleryItems} 
             onSelect={setSelectedItem} 
             shouldReduceGfx={shouldReduceGfx}
           />
           <div className="text-center w-full mt-4 flex items-center justify-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
             <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-600">
               Swipe or Scroll to Navigate Flow
             </span>
           </div>
        </section>
      </main>

      {/* Lightbox / Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 md:p-12 backdrop-blur-xl"
            onClick={() => setSelectedItem(null)}
          >
             <button 
               className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-[101]"
               onClick={() => setSelectedItem(null)}
             >
               <X className="w-6 h-6" />
             </button>

             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               transition={{ type: "spring", damping: 25, stiffness: 300 }}
               className="relative w-full max-w-6xl aspect-video rounded-2xl overflow-hidden shadow-2xl glass border-white/10"
               onClick={(e) => e.stopPropagation()}
             >
                <OptimizedImage
                  src={selectedItem.url}
                  alt={selectedItem.title}
                  fill
                  className="object-contain bg-black"
                />
                
                <div className="absolute inset-x-0 bottom-0 p-8 glass bg-black/60 border-t border-white/10 backdrop-blur-md">
                   <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                     <div>
                       <p className="text-xs font-mono text-amber-500 tracking-widest uppercase mb-2">
                         {selectedItem.category}
                       </p>
                       <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                         {selectedItem.title}
                       </h2>
                       <p className="text-zinc-400 mt-2 max-w-2xl text-sm md:text-base leading-relaxed">
                         {selectedItem.description}
                       </p>
                     </div>
                     <div className="flex items-center gap-4 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                       JMC Visual Archive
                     </div>
                   </div>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
};

