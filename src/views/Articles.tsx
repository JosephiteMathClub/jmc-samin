"use client";
import React from "react";
import { useContent } from "@/context/ContentContext";
import { motion } from "framer-motion";
import { BookOpen, User, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

const ArticlesView = () => {
  const { content } = useContent();
  const articles = (content as any)?.articles || [];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
            Articles & Insights
          </h1>
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
            Deep dives into mathematical theories, club news, and student research.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {articles.map((article: any, index: number) => (
            <motion.div
              key={article.id || index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className="group relative flex flex-col bg-[#050505] border border-white/5 overflow-hidden transition-all duration-500 hover:border-white/20"
            >
              {/* Background Label Accent */}
              <div className="absolute top-0 right-0 p-8 overflow-hidden pointer-events-none">
                <span className="text-[12rem] font-display font-black text-white/[0.02] leading-none select-none">
                  {(article.category || 'MATH')[0]}
                </span>
              </div>

              <div className="p-10 md:p-12 flex flex-col h-full relative z-10">
                {/* Meta Header */}
                <div className="flex items-center gap-4 mb-10">
                  <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--c-6-start)] bg-[var(--c-6-start)]/5 px-3 py-1 rounded-sm border border-[var(--c-6-start)]/10">
                    {article.category || 'Mathematics'}
                  </span>
                  <div className="h-px flex-grow bg-white/10" />
                </div>

                {/* Primary Content */}
                <div className="flex-grow">
                  <h3 className="text-3xl md:text-5xl font-display font-medium leading-[0.95] tracking-tight mb-8 group-hover:text-[var(--c-6-start)] transition-colors duration-500">
                    {article.title}
                  </h3>
                  <p className="text-zinc-500 text-lg leading-relaxed mb-12 line-clamp-3 font-light">
                    {article.excerpt}
                  </p>
                </div>

                {/* Author Footer */}
                <div className="flex items-end justify-between pt-12 border-t border-white/5 mt-auto">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center border border-white/5">
                        <User className="w-4 h-4 text-zinc-400" />
                      </div>
                      <span className="font-display text-lg text-white">{article.author}</span>
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-600 pl-14">Published: {article.date}</span>
                  </div>

                  <Link 
                    href={`/articles/${article.slug}`}
                    className="flex flex-col items-center gap-2 group/cta"
                  >
                    <div className="w-14 h-14 rounded-full border border-white/10 flex items-center justify-center transition-all duration-500 group-hover/cta:bg-white group-hover/cta:text-black">
                      <ArrowRight className="w-6 h-6 transition-transform group-hover/cta:translate-x-1" />
                    </div>
                    <span className="font-mono text-[9px] uppercase tracking-widest text-zinc-600 group-hover/cta:text-white transition-colors">READ_MORE</span>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {articles.length === 0 && (
          <div className="text-center py-20 bg-white/[0.02] rounded-3xl border border-white/5">
            <BookOpen className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500 font-display">No articles published yet. Check back soon!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArticlesView;
