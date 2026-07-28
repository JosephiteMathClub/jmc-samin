"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MATH_RESOURCES, 
  RESOURCE_CATEGORIES, 
  MathResource 
} from '@/data/resourcesData';
import { 
  Search, 
  Filter, 
  ExternalLink, 
  FileText, 
  Video, 
  Compass, 
  BookOpen, 
  Sparkles, 
  CheckCircle2, 
  Download, 
  Bookmark, 
  BookmarkCheck, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Share2, 
  Layers, 
  X, 
  ArrowRight,
  Check,
  Grid
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StarField from '@/components/StarField';
import { useContent } from '@/context/ContentContext';

export default function ResourcesView() {
  const { content } = useContent();
  const resourcesList: MathResource[] = useMemo(() => {
    const raw = content?.resources && Array.isArray(content.resources) && content.resources.length > 0
      ? content.resources
      : MATH_RESOURCES;

    return raw.map((res: MathResource) => {
      if (res.id === 'discover-math-play' || res.id === 'know-math-symbols' || res.type === 'Interactive App') {
        return { ...res, category: 'Interactive Apps & Tools' };
      }
      if (res.category !== 'Combinatorics' && res.category !== 'Interactive Apps & Tools') {
        return { ...res, category: 'Combinatorics' };
      }
      return res;
    });
  }, [content]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All Categories');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [sortBy, setSortBy] = useState<'featured' | 'title' | 'category'>('featured');
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [showOnlyBookmarked, setShowOnlyBookmarked] = useState(false);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const resourceTypes = ['All Types', 'Interactive App', 'Video', 'PDF Document', 'Guide / Article', 'Interactive Puzzle'];

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setBookmarkedIds((prev) => 
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleExpand = (id: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const copyShareLink = (resource: MathResource, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(resource.url);
    setCopiedId(resource.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter and Sort logic
  const filteredResources = useMemo(() => {
    return resourcesList.filter((item) => {
      // Category filter
      if (selectedCategory !== 'All Categories' && item.category !== selectedCategory) {
        return false;
      }
      // Type filter
      if (selectedType !== 'All Types' && item.type !== selectedType) {
        return false;
      }
      // Bookmark filter
      if (showOnlyBookmarked && !bookmarkedIds.includes(item.id)) {
        return false;
      }
      // Search Query filter (matches title, description, category, source, tags, teaches)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description.toLowerCase().includes(q);
        const matchesCat = item.category.toLowerCase().includes(q);
        const matchesSource = (item.source || '').toLowerCase().includes(q);
        const matchesTags = item.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchesTeaches = item.teaches.some((point) => point.toLowerCase().includes(q));

        return matchesTitle || matchesDesc || matchesCat || matchesSource || matchesTags || matchesTeaches;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'featured') {
        if (a.featured && !b.featured) return -1;
        if (!a.featured && b.featured) return 1;
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      if (sortBy === 'category') {
        return a.category.localeCompare(b.category);
      }
      return 0;
    });
  }, [searchQuery, selectedCategory, selectedType, showOnlyBookmarked, bookmarkedIds, sortBy]);

  const getTypeIcon = (type: MathResource['type']) => {
    switch (type) {
      case 'Interactive App':
        return <Compass className="w-4 h-4 text-emerald-400" />;
      case 'Video':
        return <Video className="w-4 h-4 text-sky-400" />;
      case 'PDF Document':
        return <FileText className="w-4 h-4 text-rose-400" />;
      case 'Interactive Puzzle':
        return <Grid className="w-4 h-4 text-amber-400" />;
      case 'Guide / Article':
      default:
        return <BookOpen className="w-4 h-4 text-purple-400" />;
    }
  };

  const getTypeBadgeClass = (type: MathResource['type']) => {
    switch (type) {
      case 'Interactive App':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'Video':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
      case 'PDF Document':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'Interactive Puzzle':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Guide / Article':
      default:
        return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    }
  };

  const totalTeachesCount = useMemo(() => {
    return resourcesList.reduce((acc, curr) => acc + (curr.teaches?.length || 0), 0);
  }, [resourcesList]);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-amber-500/30 selection:text-amber-200 relative overflow-x-hidden">
      <StarField />
      <Navbar />

      {/* Main Container */}
      <main className="pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        
        {/* Hero Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-semibold uppercase tracking-widest"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Learning Repository & Library</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-display font-black tracking-tight text-white"
          >
            Mathematical Resources <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-rose-400">
              & Key Learning Outcomes
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base sm:text-lg text-zinc-400 leading-relaxed font-light"
          >
            Explore our interactive suite of mathematical tools and our curated Combinatorics repository — complete with downloadable guides, problem sets, and key learning takeaways.
          </motion.p>

          {/* Quick Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-white/5"
          >
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-mono font-bold text-amber-400">{resourcesList.length}</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">Total Resources</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-mono font-bold text-emerald-400">
                {resourcesList.filter(r => r.type === 'Interactive App' || r.type === 'Interactive Puzzle').length}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">Interactive Tools</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-mono font-bold text-sky-400">
                {resourcesList.filter(r => r.category === 'Combinatorics').length}
              </div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">Combinatorics</div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5">
              <div className="text-2xl font-mono font-bold text-purple-400">{totalTeachesCount}</div>
              <div className="text-xs text-zinc-500 font-mono mt-0.5">Key Outcomes</div>
            </div>
          </motion.div>
        </div>

        {/* Search, Filter & Controls Panel */}
        <div className="mb-12 space-y-6">
          
          {/* Main Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-zinc-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by topic, keyword, title, or key learning point (e.g. 'Similar triangles', 'Magic Square', 'Ramanujan')..."
              className="w-full pl-12 pr-12 py-4 bg-white/[0.03] border border-white/10 rounded-2xl text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:bg-white/[0.06] transition-all duration-300 shadow-xl text-sm sm:text-base"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-zinc-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none scroll-smooth">
            {RESOURCE_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2.5 rounded-xl text-xs font-mono font-medium whitespace-nowrap transition-all duration-200 border ${
                    isActive
                      ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-lg shadow-amber-500/10'
                      : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Secondary Filter & Sort Strip */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5 text-xs text-zinc-400">
            
            {/* Resource Type Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-zinc-500 font-mono text-[11px] uppercase tracking-wider mr-1">Format:</span>
              {resourceTypes.map((t) => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
                    selectedType === t
                      ? 'bg-white/10 border-white/30 text-white font-bold'
                      : 'bg-transparent border-white/5 text-zinc-400 hover:border-white/15'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Bookmarks Toggle & Sort Dropdown */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowOnlyBookmarked(!showOnlyBookmarked)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[11px] font-mono transition-all ${
                  showOnlyBookmarked
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:border-white/20'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${showOnlyBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                <span>Saved ({bookmarkedIds.length})</span>
              </button>

              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 rounded-lg px-3 py-1.5">
                <span className="text-zinc-500 font-mono text-[11px]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  aria-label="Sort resources by"
                  className="bg-transparent text-white font-mono text-[11px] focus:outline-none cursor-pointer"
                >
                  <option value="featured" className="bg-zinc-900 text-white">Featured First</option>
                  <option value="title" className="bg-zinc-900 text-white">Name (A-Z)</option>
                  <option value="category" className="bg-zinc-900 text-white">Category</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Results Counter Bar */}
        <div className="flex items-center justify-between mb-8 text-xs text-zinc-500 font-mono">
          <div>
            Showing <span className="text-white font-bold">{filteredResources.length}</span> of {resourcesList.length} resources
            {selectedCategory !== 'All Categories' && (
              <span> in <span className="text-amber-400">{selectedCategory}</span></span>
            )}
          </div>
          {(searchQuery || selectedCategory !== 'All Categories' || selectedType !== 'All Types' || showOnlyBookmarked) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedType('All Types');
                setShowOnlyBookmarked(false);
              }}
              className="text-amber-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" />
              Reset filters
            </button>
          )}
        </div>

        {/* Empty State */}
        {filteredResources.length === 0 && (
          <div className="text-center py-24 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-zinc-500">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">No resources found matching your search</h3>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Try adjusting your keywords or category filters to find interactive web tools, videos, and PDFs.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All Categories');
                setSelectedType('All Types');
                setShowOnlyBookmarked(false);
              }}
              className="px-6 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-mono text-xs hover:bg-amber-500/30 transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Resource Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredResources.map((resource) => {
              const isBookmarked = bookmarkedIds.includes(resource.id);
              const isExpanded = !!expandedCards[resource.id];
              const displayTeaches = isExpanded ? resource.teaches : resource.teaches.slice(0, 4);
              const hasMoreTeaches = resource.teaches.length > 4;

              return (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                  className={`group relative rounded-3xl bg-zinc-900/40 border transition-all duration-300 flex flex-col justify-between overflow-hidden hover:shadow-2xl hover:shadow-amber-500/5 ${
                    resource.featured
                      ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-amber-500/[0.03] to-transparent'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  {/* Top Bar / Header */}
                  <div className="p-6 sm:p-8 space-y-5">
                    
                    {/* Header Badges */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Type Badge */}
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg border text-[11px] font-mono font-bold tracking-wide ${getTypeBadgeClass(resource.type)}`}>
                          {getTypeIcon(resource.type)}
                          <span>{resource.type}</span>
                        </span>

                        {/* Category Badge */}
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-zinc-400 text-[11px] font-mono">
                          <Tag className="w-3 h-3 text-zinc-500" />
                          <span>{resource.category}</span>
                        </span>

                        {/* Featured Badge */}
                        {resource.featured && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
                            <Sparkles className="w-3 h-3 text-amber-400" />
                            <span>Spotlight</span>
                          </span>
                        )}
                      </div>

                      {/* Bookmark & Copy Buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={(e) => copyShareLink(resource, e)}
                          title="Copy Link"
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white transition-all"
                        >
                          {copiedId === resource.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Share2 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={(e) => toggleBookmark(resource.id, e)}
                          title={isBookmarked ? 'Remove Bookmark' : 'Save Resource'}
                          className={`p-2 rounded-xl border transition-all ${
                            isBookmarked
                              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                              : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title & Source */}
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-white group-hover:text-amber-300 transition-colors leading-snug">
                        {resource.title}
                      </h3>
                      {resource.source && (
                        <p className="text-xs font-mono text-zinc-500 mt-1 flex items-center gap-1.5">
                          <span>Source:</span>
                          <span className="text-zinc-400 font-semibold">{resource.source}</span>
                        </p>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-zinc-300 leading-relaxed font-light">
                      {resource.description}
                    </p>

                    {/* Key Learning Points / "Teaches" Box */}
                    <div className="pt-2">
                      <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                            <GraduationCap className="w-4 h-4" />
                            <span>Teaches & Key Takeaways</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            {resource.teaches.length} points
                          </span>
                        </div>

                        {/* Bullets List */}
                        <ul className="space-y-2 text-xs sm:text-sm text-zinc-200">
                          {displayTeaches.map((point, index) => (
                            <li key={index} className="flex items-start gap-2.5 leading-snug">
                              <span className="text-amber-400 mt-0.5 font-bold shrink-0">◆</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Expand / Collapse Button */}
                        {hasMoreTeaches && (
                          <button
                            onClick={() => toggleExpand(resource.id)}
                            className="pt-1 text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                          >
                            {isExpanded ? (
                              <>
                                <span>Show fewer takeaways</span>
                                <ChevronUp className="w-3.5 h-3.5" />
                              </>
                            ) : (
                              <>
                                <span>+ {resource.teaches.length - 4} more takeaways</span>
                                <ChevronDown className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {resource.tags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] font-mono text-zinc-500 bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/5">
                          #{tag}
                        </span>
                      ))}
                    </div>

                  </div>

                  {/* Footer Action CTA */}
                  <div className="p-6 sm:p-8 pt-0 border-t border-white/5 mt-auto bg-white/[0.01]">
                    {resource.url.startsWith('/') ? (
                      <Link
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-5 rounded-2xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-white hover:text-amber-300 font-mono font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-between group/btn shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          <Compass className="w-4 h-4 text-emerald-400" />
                          <span>Launch Interactive Tool</span>
                        </span>
                        <ExternalLink className="w-4 h-4 text-zinc-400 group-hover/btn:text-amber-300 transition-transform group-hover/btn:translate-x-0.5" />
                      </Link>
                    ) : (
                      <a
                        href={resource.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          if (!resource.url) {
                            e.preventDefault();
                            alert('Resource link will be added by super admin.');
                          }
                        }}
                        className="w-full py-3.5 px-5 rounded-2xl bg-white/5 hover:bg-amber-500/20 border border-white/10 hover:border-amber-500/40 text-white hover:text-amber-300 font-mono font-semibold text-xs sm:text-sm transition-all duration-300 flex items-center justify-between group/btn shadow-lg"
                      >
                        <span className="flex items-center gap-2">
                          {resource.type === 'PDF Document' ? (
                            <Download className="w-4 h-4 text-rose-400" />
                          ) : resource.type === 'Video' ? (
                            <Video className="w-4 h-4 text-sky-400" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-purple-400" />
                          )}
                          <span>View Resources</span>
                        </span>
                        <ExternalLink className="w-4 h-4 text-zinc-400 group-hover/btn:text-amber-300 transition-transform group-hover/btn:translate-x-0.5" />
                      </a>
                    )}
                  </div>

                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

      </main>

      <Footer />
    </div>
  );
}
