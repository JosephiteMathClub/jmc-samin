"use client";
import React from "react";
import { useContent } from "@/context/ContentContext";
import { motion } from "framer-motion";
import { BookOpen, User, Calendar, ArrowUpRight, ArrowRight, FileText } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const ArticlesView = () => {
  const { content } = useContent();
  const articles = (content as any)?.articles?.filter((a: any) => a.published) || [];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-[1400px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-20"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-300">Journal & Research</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-display font-medium tracking-tight mb-8 text-white">
            Club <span className="bg-gradient-to-r from-emerald-400 via-[var(--c-6-start)] to-blue-500 bg-clip-text text-transparent italic">Articles</span>
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            Explorations, essays, and deep-dives crafted by our brilliant members. Discover the frontiers of mathematics.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article: any, index: number) => {
             const hasPdf = !!article.pdfUrl;
             const targetUrl = article.pdfUrl || `/articles/${article.slug}`;
             
             return (
               <motion.div
                 key={article.id || index}
                 initial={{ opacity: 0, y: 30 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                 className="group relative flex flex-col bg-black/20 backdrop-blur-md border border-white/10 rounded-3xl overflow-hidden hover:bg-black/40 hover:border-white/20 transition-all duration-500"
               >
                 {article.imageUrl && (
                   <div className="relative w-full h-64 overflow-hidden group-hover:h-72 transition-all duration-700 ease-out" style={{ WebkitMaskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)', maskImage: 'linear-gradient(to bottom, black 50%, transparent 100%)' }}>
                     <Image 
                       src={article.imageUrl} 
                       alt={article.title} 
                       fill
                       className="object-cover transform group-hover:scale-105 group-hover:rotate-1 transition-all duration-700 ease-out opacity-80 group-hover:opacity-100" 
                       referrerPolicy="no-referrer"
                     />
                     <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black/90 pointer-events-none" />
                   </div>
                 )}
                 
                 <div className={`p-8 md:p-10 flex flex-col flex-1 relative z-10 ${article.imageUrl ? '-mt-16' : ''}`}>
                   {/* Meta tags */}
                   <div className="flex flex-wrap items-center gap-3 mb-6">
                     <span className="font-mono text-[10px] uppercase tracking-widest text-black bg-white px-3 py-1.5 rounded-full font-bold">
                       {article.category || 'Mathematics'}
                     </span>
                     {hasPdf && (
                       <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-red-100 bg-red-500/20 px-3 py-1.5 rounded-full border border-red-500/30">
                         <FileText className="w-3 h-3" /> PDF
                       </span>
                     )}
                     <div className="flex-grow" />
                     <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500 bg-white/5 px-3 py-1.5 rounded-full border border-white/5 flex items-center gap-2">
                       <Calendar className="w-3 h-3" /> {article.date}
                     </span>
                   </div>

                   {/* Title and Excerpt */}
                   <div className="flex-1">
                     <h3 className="text-3xl md:text-4xl font-display font-medium tracking-tight leading-none mb-6 text-white group-hover:text-emerald-300 transition-colors duration-500">
                       {article.title}
                     </h3>
                     <p className="text-zinc-400 text-sm md:text-base leading-relaxed line-clamp-3 mb-8">
                       {article.excerpt}
                     </p>
                   </div>

                   {/* Footer */}
                   <div className="flex items-center justify-between pt-6 border-t border-white/10 mt-auto">
                     <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/10 shadow-lg group-hover:border-emerald-500/30 transition-colors">
                         <User className="w-4 h-4 text-emerald-400" />
                       </div>
                       <div className="flex flex-col">
                         <span className="font-display font-medium text-white text-base leading-tight">
                           {article.author}
                         </span>
                         <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-500">
                           Author
                         </span>
                       </div>
                     </div>

                     <Link 
                       href={targetUrl}
                       target={hasPdf ? "_blank" : undefined}
                       rel={hasPdf ? "noopener noreferrer" : undefined}
                       className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center border border-white/10 hover:bg-emerald-500 hover:border-emerald-500 text-zinc-400 hover:text-black transition-all duration-300 group-hover:rotate-45"
                     >
                       <ArrowUpRight className="w-5 h-5" />
                     </Link>
                   </div>
                 </div>
               </motion.div>
             );
          })}
        </div>

        {articles.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 bg-black/20 backdrop-blur-md rounded-[3rem] border border-white/5">
            <BookOpen className="h-16 w-16 text-zinc-700 mb-6" />
            <h3 className="text-2xl font-display text-white mb-2">No publications yet</h3>
            <p className="text-zinc-500 font-light max-w-sm text-center">Check back soon for new articles, essays, and club updates.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesView;
