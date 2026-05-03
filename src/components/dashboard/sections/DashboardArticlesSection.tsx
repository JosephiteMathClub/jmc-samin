"use client";
import React from 'react';
import { useContent } from '@/context/ContentContext';
import { LayoutDashboard, Plus, Trash2, Edit2, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardArticlesSection = () => {
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

      <div className="grid grid-cols-1 gap-4">
        {articles.map((article: any) => (
          <div key={article.id} className="glass-card p-6 border border-white/5">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 space-y-4">
                {isEditing === article.id ? (
                  <div className="space-y-4 pr-12">
                    <input 
                      type="text" 
                      value={article.title}
                      onChange={(e) => handleUpdateArticle(article.id, { title: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-[var(--c-6-start)]"
                      placeholder="Article Title"
                    />
                    <input 
                      type="text" 
                      value={article.slug}
                      onChange={(e) => handleUpdateArticle(article.id, { slug: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zinc-400 text-sm focus:outline-none focus:border-[var(--c-6-start)]"
                      placeholder="slug-url"
                    />
                    <textarea 
                      value={article.excerpt}
                      onChange={(e) => handleUpdateArticle(article.id, { excerpt: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-zinc-300 min-h-[100px] focus:outline-none focus:border-[var(--c-6-start)]"
                      placeholder="Excerpt..."
                    />
                    <div className="flex space-x-4">
                        <button 
                            onClick={() => setIsEditing(null)}
                            className="bg-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg text-sm font-bold"
                        >
                            Save Changes
                        </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-xl font-bold text-white">{article.title}</h3>
                    <p className="text-zinc-500 text-sm mb-2">{article.slug}</p>
                    <p className="text-zinc-400 line-clamp-2">{article.excerpt}</p>
                  </div>
                )}
              </div>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setIsEditing(isEditing === article.id ? null : article.id)}
                  className="p-2 rounded-lg bg-white/5 text-zinc-400 hover:text-white"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button 
                  onClick={() => handleRemoveArticle(article.id)}
                  className="p-2 rounded-lg bg-red-500/5 text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs mono-label text-zinc-500">
              <span>{article.author}</span>
              <span>•</span>
              <span>{article.date}</span>
              <span>•</span>
              <span className={`px-2 py-0.5 rounded-full ${article.published ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {article.published ? 'Published' : 'Draft'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DashboardArticlesSection;
