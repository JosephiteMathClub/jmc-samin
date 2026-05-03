"use client";
import React from "react";
import { useContent } from "@/context/ContentContext";
import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, BookOpen } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

const ArticleDetailView = () => {
  const { slug } = useParams();
  const { content } = useContent();
  const articles = (content as any)?.articles || [];
  const article = articles.find((a: any) => a.slug === slug);

  if (!article) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-24">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-white mb-4">Article Not Found</h2>
          <Link href="/articles" className="text-[var(--c-6-start)] hover:underline">
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          href="/articles"
          className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors mb-12 group"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="mono-label text-xs uppercase tracking-widest">Back to Articles</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center space-x-2 text-[var(--c-6-start)] mb-6">
            <BookOpen className="h-5 w-5" />
            <span className="mono-label text-sm uppercase tracking-widest">{article.category}</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-display font-bold text-white mb-8 leading-tight">
            {article.title}
          </h1>

          <div className="flex items-center space-x-6 mb-12 py-6 border-y border-white/5">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <User className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{article.author}</span>
                <span className="text-xs text-zinc-500">Author</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-zinc-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-white">{article.date}</span>
                <span className="text-xs text-zinc-500">Published</span>
              </div>
            </div>
          </div>

          <div className="prose prose-invert prose-zinc max-w-none">
            {article.content ? (
              <div className="text-zinc-300 leading-relaxed text-lg space-y-6">
                {article.content.split('\n').map((para: string, i: number) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            ) : (
                <p className="text-zinc-400 italic">This article is currently in draft or has no content.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ArticleDetailView;
