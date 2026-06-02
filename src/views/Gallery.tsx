"use client";
import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, X, Search, ArrowLeft, ArrowRight, Tag, Compass, Calendar } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { OptimizedImage } from '../components/OptimizedImage';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  const { shouldReduceGfx } = usePerformance();
  const { content } = useContent();

  // Parse and normalize gallery items
  const galleryItems = useMemo(() => {
    if (!content?.gallery_page?.images || !Array.isArray(content.gallery_page.images)) {
      return [];
    }
    return content.gallery_page.images.map((img: any, i: number) => {
      if (typeof img === 'string') {
        const fallbacks = [
          { title: "Inaugural Math Olympiad", desc: "Our brilliant Josephite participants testing their limits on deep arithmetic formulas." },
          { title: "Weekly Seminar Session", desc: "A seminar showcasing innovative computational algebra theories and interactive discussions." },
          { title: "National Math Fest Banner", desc: "A nostalgic glimpse at the banner unveiling with moderators, members, and guest speakers." },
          { title: "Club Executive Meetup", desc: "Strategizing future workshops, academic newsletters, and upcoming club logistics." },
          { title: "Prize Giving Ceremony", desc: "An esteemed moment recognizing the exemplary achievers and future mathematics champions." },
          { title: "Interactive Workshop", desc: "Fostering collaboration, critical problem-solving skills, and visual logic maps." }
        ];
        const fb = fallbacks[i % fallbacks.length];
        return { 
          id: `gallery-str-${i}`, 
          url: img, 
          title: fb.title, 
          category: 'EVENT', 
          description: fb.desc 
        };
      }
      return {
        id: img.id || `gallery-obj-${i}`,
        url: img.url || '',
        title: img.title || `JMC Legacy Moment ${i + 1}`,
        category: (img.category || 'EVENT').toUpperCase().trim(),
        description: img.description || 'Fascinating captures from the events, competitions, and collaborative math spaces.'
      };
    }).filter((img: any) => !!img.url);
  }, [content?.gallery_page?.images]);

  // Extract all unique categories dynamically
  const categories = useMemo(() => {
    const cats = new Set<string>();
    cats.add('ALL');
    galleryItems.forEach((item: any) => {
      if (item.category) {
        cats.add(item.category);
      }
    });
    return Array.from(cats);
  }, [galleryItems]);

  // Filtered gallery items for visualization
  const filteredItems = useMemo(() => {
    return galleryItems.filter((item: any) => {
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (item.category || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [galleryItems, selectedCategory, searchQuery]);

  // Handle keyboard arrow scrolling in Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;
      const index = filteredItems.findIndex((item: any) => item.id === selectedItem.id);
      if (index === -1) return;

      if (e.key === 'Escape') {
        setSelectedItem(null);
      } else if (e.key === 'ArrowRight') {
        const nextIndex = (index + 1) % filteredItems.length;
        setSelectedItem(filteredItems[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (index - 1 + filteredItems.length) % filteredItems.length;
        setSelectedItem(filteredItems[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, filteredItems]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-amber-500/30 overflow-x-hidden relative">
      {/* High-Performance Passive Ambient Glows */}
      {!shouldReduceGfx && (
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] max-w-[600px] rounded-full bg-amber-500/5 blur-[100px]" />
          <div className="absolute bottom-[20%] right-[-10%] w-[70vw] h-[70vw] max-w-[700px] rounded-full bg-indigo-500/5 blur-[120px]" />
        </div>
      )}

      <Navbar />
      
      <main className="pt-32 pb-24 relative z-10">
        <section className="container-custom mb-12">
          <div className="flex flex-col items-center text-center space-y-6">
            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-[0.4em]">Gallery Archive</span>
            </motion.div>

            <motion.h1 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-8xl font-black tracking-tighter uppercase italic text-white"
            >
              Our <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-300 to-yellow-500">Legacy</span>
            </motion.h1>

            <motion.p 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="max-w-2xl mx-auto text-zinc-400 text-sm md:text-lg font-medium leading-relaxed"
            >
              Explore the rich history and vibrant moments of the Josephite Math Club. 
              An immersive visual archive of our fests, team milestones, and interactive mathematical endeavors.
            </motion.p>
          </div>
        </section>

        {/* Filter and Navigation Shell */}
        <section className="container-custom max-w-6xl mx-auto mb-10 px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between p-4 rounded-3xl bg-zinc-900/60 border border-white/5 backdrop-blur-xl">
            {/* Search inputs */}
            <div className="relative w-full md:w-80 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-hover:text-amber-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Search archive..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-zinc-950/50 border border-white/5 text-xs text-white focus:outline-none focus:border-amber-500/55 focus:bg-zinc-950 transition-all font-medium placeholder:text-zinc-650"
              />
            </div>

            {/* Category selection */}
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-full no-scrollbar py-1">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`relative px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shrink-0 ${
                      isActive 
                        ? 'text-zinc-950 bg-amber-500 shadow-md shadow-amber-500/10' 
                        : 'text-zinc-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Gallery Content Area */}
        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {filteredItems.length === 0 ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-zinc-900/50 border border-white/5 flex items-center justify-center">
                  <Compass className="w-6 h-6 text-zinc-650 animate-spin" style={{ animationDuration: '10s' }} />
                </div>
                <p className="text-zinc-500 font-bold tracking-tight text-sm">No archive items match search parameters</p>
                <p className="text-xs text-zinc-750">Try selecting another category or check your spelling</p>
              </motion.div>
            ) : (
              /* Bento Masonry Grid Mode */
              <motion.div
                key="bento-grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.3 }}
                className="container-custom max-w-6xl mx-auto px-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {filteredItems.map((item: any, index: number) => {
                    // Create bento variable heights based on pattern
                    const isFeature = index % 5 === 0;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`group relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-white/5 cursor-pointer shadow-xl transition-all duration-300 hover:scale-[1.01] hover:border-amber-500/20 hover:shadow-2xl hover:shadow-amber-500/5 ${
                          isFeature ? 'md:col-span-2 aspect-[16/10]' : 'aspect-square'
                        }`}
                      >
                        {/* Shimmer element */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10" />

                        <div className="w-full h-full relative">
                          <OptimizedImage
                            src={item.url}
                            alt={item.title}
                            fill
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                            sizes="(max-width: 768px) 100vw, 400px"
                          />
                        </div>

                        {/* Top Indicator */}
                        <div className="absolute top-4 left-4 z-20 flex gap-2">
                          <span className="px-2.5 py-1 text-[8px] font-mono font-black text-white bg-zinc-950/80 backdrop-blur-md rounded-lg uppercase tracking-wider border border-white/5">
                            {item.category}
                          </span>
                        </div>

                        {/* Hover Overlay */}
                        <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent pt-16 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end">
                          <h3 className="text-lg font-black text-white uppercase tracking-tight">{item.title}</h3>
                          {item.description && (
                            <p className="text-zinc-400 text-xs mt-1.5 line-clamp-2 leading-relaxed font-medium">
                              {item.description}
                            </p>
                          )}
                          <div className="flex items-center gap-1 text-[9px] font-mono text-amber-500 font-extrabold uppercase mt-3 tracking-widest">
                            <Maximize2 className="w-3 h-3" />
                            Expand Capture
                          </div>
                        </div>

                        {/* Inline fallback card name for touch screens */}
                        <div className="absolute bottom-3 left-3 right-3 bg-zinc-950/90 backdrop-blur-md py-2.5 px-3.5 rounded-xl border border-white/5 group-hover:opacity-0 transition-opacity duration-300 flex justify-between items-center">
                          <p className="text-[10px] font-bold text-white truncate max-w-[80%] uppercase tracking-wider">{item.title}</p>
                          <Maximize2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Exquisite Cinematic Lightbox / Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/98 p-4 md:p-8 backdrop-blur-2xl"
            onClick={() => setSelectedItem(null)}
          >
             {/* Left click anchor trigger */}
             <button
               title="Previous Image (Left Arrow)"
               onClick={(e) => {
                 e.stopPropagation();
                 const index = filteredItems.findIndex((item: any) => item.id === selectedItem.id);
                 if (index !== -1) {
                   const prevIndex = (index - 1 + filteredItems.length) % filteredItems.length;
                   setSelectedItem(filteredItems[prevIndex]);
                 }
               }}
               className="absolute left-6 top-1/2 -translate-y-1/2 hidden md:flex w-14 h-14 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/5 text-white transition-all z-[101]"
             >
               <ArrowLeft className="w-6 h-6" />
             </button>

             {/* Right click anchor trigger */}
             <button
               title="Next Image (Right Arrow)"
               onClick={(e) => {
                 e.stopPropagation();
                 const index = filteredItems.findIndex((item: any) => item.id === selectedItem.id);
                 if (index !== -1) {
                   const nextIndex = (index + 1) % filteredItems.length;
                   setSelectedItem(filteredItems[nextIndex]);
                 }
               }}
               className="absolute right-6 top-1/2 -translate-y-1/2 hidden md:flex w-14 h-14 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 hover:border-white/20 border border-white/5 text-white transition-all z-[101]"
             >
               <ArrowRight className="w-6 h-6" />
             </button>

             {/* Top Control Drawer */}
             <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-[102] pointer-events-none">
               <div className="flex items-center gap-3 bg-zinc-900/90 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md pointer-events-auto">
                 <Tag className="w-3.5 h-3.5 text-amber-500" />
                 <span className="text-[10px] font-mono font-black text-zinc-300 uppercase tracking-widest">
                   {selectedItem.category || "LEGACY ARCHIVE"}
                 </span>
               </div>
               
               <button 
                 className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/5 hover:bg-white/15 text-white transition-all pointer-events-auto shadow-lg"
                 onClick={() => setSelectedItem(null)}
               >
                 <X className="w-5 h-5" />
               </button>
             </div>

             {/* Expanded Slide Shell */}
             <motion.div 
               initial={{ scale: 0.96, y: 15, opacity: 0 }}
               animate={{ scale: 1, y: 0, opacity: 1 }}
               exit={{ scale: 0.96, y: -15, opacity: 0 }}
               transition={{ type: "spring", damping: 28, stiffness: 240 }}
               className="relative w-full max-w-5xl aspect-[16/10] md:aspect-[16/9.5] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.08)] bg-zinc-950 border border-white/10 flex flex-col justify-end"
               onClick={(e) => e.stopPropagation()}
             >
                <div className="relative w-full h-full flex-grow">
                  <OptimizedImage
                    src={selectedItem.url}
                    alt={selectedItem.title}
                    fill
                    className="object-contain"
                  />
                </div>
                
                {/* Information Slate */}
                <div className="p-6 md:p-8 bg-zinc-950/95 border-t border-white/10 backdrop-blur-xl relative z-10">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                     <div className="space-y-2 max-w-3xl">
                       <h2 className="text-xl md:text-2xl font-black text-white tracking-tight uppercase">
                         {selectedItem.title}
                       </h2>
                       <p className="text-zinc-400 text-xs md:text-sm leading-relaxed max-w-2xl font-medium">
                         {selectedItem.description}
                       </p>
                     </div>
                     
                     <div className="flex flex-col gap-1 shrink-0 bg-white/5 border border-white/5 p-4 rounded-2xl min-w-[180px]">
                       <div className="flex items-center gap-2 text-[9px] font-mono text-zinc-400 font-extrabold uppercase">
                         <Calendar className="w-3 h-3 text-amber-500" />
                         Record Captured
                       </div>
                       <span className="text-xs font-bold text-white uppercase tracking-wider">JMC History Vault</span>
                     </div>
                   </div>
                   
                   {/* Carousel Mini status */}
                   <div className="flex items-center justify-center gap-1.5 mt-6 pt-4 border-t border-white/5 text-[9px] font-mono font-extrabold text-zinc-500 uppercase tracking-widest">
                     <span>Use</span>
                     <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">←</span>
                     <span>/</span>
                     <span className="px-1.5 py-0.5 rounded bg-zinc-900 border border-white/5 text-zinc-400">→</span>
                     <span>keyboards to switch</span>
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


