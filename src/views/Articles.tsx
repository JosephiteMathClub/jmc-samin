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
              className="glass-card group overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-center space-x-2 text-[var(--c-6-start)] mb-4">
                  <BookOpen className="h-4 w-4" />
                  <span className="mono-label text-xs uppercase tracking-widest">{article.category || 'Mathematics'}</span>
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-4 group-hover:text-[var(--c-6-start)] transition-colors">
                  {article.title}
                </h3>
                <p className="text-zinc-400 mb-8 line-clamp-3">
                  {article.excerpt}
                </p>
                
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
                  <div className="flex items-center space-x-3">
                    <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-zinc-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-zinc-300">{article.author}</span>
                      <span className="text-[10px] text-zinc-500">{article.date}</span>
                    </div>
                  </div>
                  <Link 
                    href={`/articles/${article.slug}`}
                    className="p-2 rounded-full bg-white/5 hover:bg-[var(--c-6-start)] hover:text-black transition-all"
                  >
                    <ArrowRight className="h-4 w-4" />
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
