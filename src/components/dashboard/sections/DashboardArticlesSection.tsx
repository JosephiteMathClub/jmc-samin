"use client";
import React from 'react';
import { useContent } from '@/context/ContentContext';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import { DashboardFileUpload } from '../DashboardFileUpload';

import Image from 'next/image';

interface DashboardArticlesSectionProps {
  uploading?: string | null;
  handleFileUpload?: (e: React.ChangeEvent<HTMLInputElement>, path?: (string | number)[], callback?: (url: string) => void) => void;
}

const DashboardArticlesSection: React.FC<DashboardArticlesSectionProps> = ({ uploading, handleFileUpload }) => {
  const { content, updateContent } = useContent();
  const [isEditing, setIsEditing] = React.useState<string | null>(null);
  
  const articles = (content as any)?.articles || [];

  const handleAddArticle = () => {
    const newArticle = {
      id: `article-${Date.now()}`,
      title: 'New Math Article',
      slug: 'new-math-article',
      excerpt: 'A short description of the article...',
      content: '',
      pdfUrl: '',
      imageUrl: '',
      author: 'JMC Member',
      date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      category: 'Mathematics',
      published: false
    };
    
    updateContent('articles', [newArticle, ...articles]);
  };

  const handleRemoveArticle = (id: string) => {
    updateContent('articles', articles.filter((a: any) => a.id !== id));
  };

  const handleUpdateArticle = (id: string, updates: any) => {
    updateContent('articles', articles.map((a: any) => a.id === id ? { ...a, ...updates } : a));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Articles Management</h2>
          <p className="text-zinc-500 text-sm">Create and edit articles for the club website.</p>
        </div>
        <button 
          onClick={handleAddArticle}
          className="flex items-center space-x-2 bg-[var(--c-6-start)] text-black px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          <Plus className="h-4 w-4" />
          <span>New Article</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {articles.map((article: any, index: number) => (
          <div key={article.id} className="glass-card p-6 border border-white/5 rounded-3xl group transition-all duration-300">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 space-y-4">
                {isEditing === article.id ? (
                  <div className="space-y-6 pr-12">
                    <div className="flex flex-col lg:flex-row gap-8 items-start relative">
                      <div className="w-full lg:w-80 lg:sticky lg:top-8 z-20 space-y-4">
                        {handleFileUpload && (
                          <>
                            <DashboardFileUpload 
                              label="Cover Image"
                              value={article.imageUrl || ''}
                              uploading={uploading === `articles-image-${index}`}
                              onUpload={(ev) => handleFileUpload(ev, ['articles', 'image', index], (url) => handleUpdateArticle(article.id, { imageUrl: url }))}
                              onDelete={() => handleUpdateArticle(article.id, { imageUrl: '' })}
                              onChange={(_, val) => handleUpdateArticle(article.id, { imageUrl: val })}
                              accept=".jpg,.jpeg,.png,.webp"
                            />
                            <DashboardFileUpload 
                              label="PDF Document"
                              description="Upload a PDF file to allow reading the article natively."
                              value={article.pdfUrl || ''}
                              uploading={uploading === `articles-pdf-${index}`}
                              onUpload={(ev) => handleFileUpload(ev, ['articles', 'pdf', index], (url) => handleUpdateArticle(article.id, { pdfUrl: url }))}
                              onDelete={() => handleUpdateArticle(article.id, { pdfUrl: '' })}
                              onChange={(_, val) => handleUpdateArticle(article.id, { pdfUrl: val })}
                              accept=".pdf"
                            />
                          </>
                        )}
                      </div>

                      <div className="flex-1 w-full space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Title</label>
                            <input 
                              type="text" 
                              value={article.title}
                              onChange={(e) => handleUpdateArticle(article.id, { title: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--c-6-start)] transition-colors"
                              placeholder="Article Title"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Slug / URL</label>
                            <input 
                              type="text" 
                              value={article.slug}
                              onChange={(e) => handleUpdateArticle(article.id, { slug: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-400 focus:outline-none focus:border-[var(--c-6-start)] transition-colors font-mono text-sm"
                              placeholder="slug-url"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Author</label>
                            <input 
                              type="text" 
                              value={article.author}
                              onChange={(e) => handleUpdateArticle(article.id, { author: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[var(--c-6-start)] transition-colors"
                              placeholder="Author Name"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Category</label>
                            <input 
                              type="text" 
                              value={article.category}
                              onChange={(e) => handleUpdateArticle(article.id, { category: e.target.value })}
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-400 focus:outline-none focus:border-[var(--c-6-start)] transition-colors"
                              placeholder="e.g. Mathematics"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Excerpt</label>
                          <textarea 
                            value={article.excerpt}
                            onChange={(e) => handleUpdateArticle(article.id, { excerpt: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-300 min-h-[80px] focus:outline-none focus:border-[var(--c-6-start)] transition-colors resize-none"
                            placeholder="Excerpt..."
                          />
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Content (Text)</label>
                          <textarea 
                            value={article.content}
                            onChange={(e) => handleUpdateArticle(article.id, { content: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-zinc-300 min-h-[240px] focus:outline-none focus:border-[var(--c-6-start)] transition-colors"
                            placeholder="Full article content (optional if uploading PDF)..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 pt-4 border-t border-white/5">
                      <button 
                        onClick={() => handleUpdateArticle(article.id, { published: !article.published })}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${article.published ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30'}`}
                      >
                        {article.published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button 
                         onClick={() => setIsEditing(null)}
                         className="bg-white/10 text-white hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold transition-colors"
                      >
                         Done Editing
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-6">
                     {article.imageUrl && (
                        <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                           <Image src={article.imageUrl} alt={article.title} fill className="object-cover" referrerPolicy="no-referrer" />
                        </div>
                     )}
                     <div>
                       <div className="flex items-center gap-3 mb-2">
                         <h3 className="text-2xl font-display font-medium text-white group-hover:text-[var(--c-6-start)] transition-colors">{article.title}</h3>
                         {article.pdfUrl && (
                           <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 text-[10px] font-bold font-mono border border-red-500/20 uppercase">PDF</span>
                         )}
                       </div>
                       <p className="text-[10px] font-mono text-zinc-500 mb-3">{article.slug}</p>
                       <p className="text-zinc-400 line-clamp-2 text-sm leading-relaxed max-w-3xl">{article.excerpt}</p>
                     </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-2 shrink-0">
                <button 
                  onClick={() => setIsEditing(isEditing === article.id ? null : article.id)}
                  className="w-10 h-10 rounded-xl bg-white/5 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRemoveArticle(article.id)}
                  className="w-10 h-10 rounded-xl bg-red-500/5 text-red-500 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            {!isEditing && (
              <div className="flex items-center space-x-4 mt-6 pt-4 border-t border-white/5 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                <span className="text-zinc-300">{article.author}</span>
                <span>•</span>
                <span>{article.date}</span>
                <span>•</span>
                <span>{article.category}</span>
                <span className="flex-1"></span>
                <span className={`px-3 py-1 rounded-full border ${article.published ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                  {article.published ? 'Published' : 'Draft'}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardArticlesSection;
