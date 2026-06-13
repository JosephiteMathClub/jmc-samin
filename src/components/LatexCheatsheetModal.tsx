"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Search, Copy, Check, Calculator, Sigma, BookOpen, AlertCircle } from "lucide-react";
import { MathJaxNode } from "./MathJaxNode";

interface CheatsheetItem {
  code: string;
  renderText: string; // The wrapped code to pass to MathJax for rendering (e.g., "$...$" or "$$...$")
  name: string;
  description: string;
}

interface CheatsheetCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  items: CheatsheetItem[];
}

export const LatexCheatsheetModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("macros");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories: CheatsheetCategory[] = useMemo(() => [
    {
      id: "macros",
      name: "Club Macros",
      icon: <BookOpen className="w-4 h-4" />,
      items: [
        {
          code: "\\dd x",
          renderText: "$\\dd x$",
          name: "Differential",
          description: "Typesets a straight differential d in math mode.",
        },
        {
          code: "\\dv{y}{x}",
          renderText: "$\\dv{y}{x}$",
          name: "Derivative",
          description: "Standard vertical derivative notation using strait / rm 'd'.",
        },
        {
          code: "\\diff{y}{x}",
          renderText: "$\\diff{y}{x}$",
          name: "Leibniz Derivative",
          description: "Alternative Leibniz differential representation.",
        },
        {
          code: "\\pdv{u}{x}",
          renderText: "$\\pdv{u}{x}$",
          name: "Partial Derivative",
          description: "Standard partial fraction representation.",
        },
        {
          code: "\\pd{u}{x}",
          renderText: "$\\pd{u}{x}$",
          name: "Partial Symbol",
          description: "Alternate short partial boundary representation.",
        },
        {
          code: "\\grad f",
          renderText: "$\\grad f$",
          name: "Gradient",
          description: "Bold nabla gradient operator.",
        },
        {
          code: "\\div \\vec{F}",
          renderText: "$\\div \\vec{F}$",
          name: "Divergence",
          description: "Bold nabla dot product operator.",
        },
        {
          code: "\\curl \\vec{F}",
          renderText: "$\\curl \\vec{F}$",
          name: "Curl",
          description: "Bold nabla cross product operator.",
        },
      ],
    },
    {
      id: "calculus",
      name: "Calculus & Limits",
      icon: <Calculator className="w-4 h-4" />,
      items: [
        {
          code: "\\int_{a}^{b} x^2 \\dd x",
          renderText: "$\\int_{a}^{b} x^2 \\dd x$",
          name: "Definite Integral",
          description: "Integral operator with upper and lower limits.",
        },
        {
          code: "\\oint_{C} \\vec{F} \\cdot \\dd\\vec{r}",
          renderText: "$\\oint_{C} \\vec{F} \\cdot \\dd\\vec{r}$",
          name: "Contour Integral",
          description: "Line or contour integral over a closed loop.",
        },
        {
          code: "\\lim_{x \\to \\infty} \\frac{1}{x}",
          renderText: "$\\lim_{x \\to \\infty} \\frac{1}{x}$",
          name: "Limit",
          description: "Limit equation with subscript approaching infinity.",
        },
        {
          code: "\\sum_{n=1}^{\\infty} a_n",
          renderText: "$\\sum_{n=1}^{\\infty} a_n$",
          name: "Summation",
          description: "Infinite sum operator.",
        },
        {
          code: "\\prod_{i=1}^{k} x_i",
          renderText: "$\\prod_{i=1}^{k} x_i$",
          name: "Product Operator",
          description: "Capital product operator for products of sequences.",
        },
      ],
    },
    {
      id: "greek",
      name: "Greek Letters",
      icon: <Sigma className="w-4 h-4" />,
      items: [
        {
          code: "\\alpha, \\beta, \\gamma",
          renderText: "$\\alpha, \\beta, \\gamma$",
          name: "Lowercase Greek",
          description: "Common variables for angles, constants, and parameters.",
        },
        {
          code: "\\theta, \\lambda, \\pi",
          renderText: "$\\theta, \\lambda, \\pi$",
          name: "More Lowercase",
          description: "Standard mathematical constants and angles.",
        },
        {
          code: "\\Gamma, \\Delta, \\Omega",
          renderText: "$\\Gamma, \\Delta, \\Omega$",
          name: "Uppercase Greek",
          description: "Commonly used for functions, differences, or sets.",
        },
      ],
    },
    {
      id: "symbols",
      name: "Relations & Operators",
      icon: <Sigma className="w-4 h-4" />,
      items: [
        {
          code: "a \\approx b",
          renderText: "$a \\approx b$",
          name: "Approximation",
          description: "Indicates values are approximately equal.",
        },
        {
          code: "a \\neq b",
          renderText: "$a \\neq b$",
          name: "Inequality",
          description: "Not equal to relation.",
        },
        {
          code: "a \\le b, \\quad c \\ge d",
          renderText: "$a \\le b, \\quad c \\ge d$",
          name: "Inequalities",
          description: "Less-than-or-equal and greater-than-or-equal to.",
        },
        {
          code: "\\hbar, \\lambda, \\mu_0",
          renderText: "$\\hbar, \\lambda, \\mu_0$",
          name: "Physics Symbols",
          description: "Reduced Planck constant, wavelength, and permeability.",
        },
      ],
    },
    {
      id: "environments",
      name: "Matrices & Environments",
      icon: <Calculator className="w-4 h-4" />,
      items: [
        {
          code: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}",
          renderText: "$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$$",
          name: "Parenthesis Matrix",
          description: "A standard 2x2 matrix with parenthesized edges.",
        },
        {
          code: "\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}",
          renderText: "$$\\begin{bmatrix} a & b \\\\ c & d \\end{bmatrix}$$",
          name: "Bracket Matrix",
          description: "A standard 2x2 matrix with bracketed edges.",
        },
        {
          code: "f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}",
          renderText: "$$f(x) = \\begin{cases} x & x \\ge 0 \\\\ -x & x < 0 \\end{cases}$$",
          name: "Piecewise Function",
          description: "Define split piecewise logic systems.",
        },
      ],
    },
  ], []);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => {
      setCopiedCode(null);
    }, 2000);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.toLowerCase();
    const results: CheatsheetItem[] = [];
    categories.forEach((cat) => {
      cat.items.forEach((item) => {
        if (
          item.name.toLowerCase().includes(q) ||
          item.code.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q)
        ) {
          results.push(item);
        }
      });
    });
    return results;
  }, [searchQuery, categories]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
        {/* Background Click to Close */}
        <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

        {/* Modal Structure */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl max-h-[85vh] bg-zinc-950 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="p-6 md:p-8 border-b border-white/5 bg-gradient-to-r from-emerald-500/10 via-amber-500/5 to-indigo-500/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                <Calculator className="w-6 h-6 text-emerald-400 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight">
                  LaTeX Mathematical Cheatsheet
                </h3>
                <p className="text-xs text-zinc-400">
                  Quick-reference guide for formulas, mathematical notation, and custom JMC macros.
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/5 rounded-full transition-colors text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Notice */}
          <div className="mx-6 md:mx-8 mt-6 p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div className="text-xs text-zinc-300 leading-relaxed">
              <p className="font-bold text-amber-400 mb-0.5">How to write equations:</p>
              Use standard <code className="px-1.5 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[10px] text-emerald-400">$...$</code> for Inline formulas (e.g., $E = mc^2$) or <code className="px-1.5 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[10px] text-emerald-400">$$...$$</code> (or <code className="px-1.5 py-0.5 bg-black/50 border border-white/10 rounded font-mono text-[10px] text-emerald-400">\[...\]</code>) for Block display formulas. Click any snippet to copy it instantly.
            </div>
          </div>

          {/* Search bar */}
          <div className="px-6 md:px-8 mt-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search symbol, macro, or description (e.g., derivative, integral)..."
                className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/50 transition-all font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-white font-mono"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Main content scroll area with sidebar navigation */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row p-6 md:p-8 gap-6 min-h-0">
            {/* Left Category List (Only shown if NOT searching) */}
            {!searchQuery && (
              <div className="w-full md:w-56 flex md:flex-col overflow-x-auto md:overflow-x-visible md:overflow-y-auto shrink-0 gap-2 pb-2 md:pb-0 pr-0 md:pr-4 border-b md:border-b-0 md:border-r border-white/5 scrollbar-thin">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveTab(cat.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-left text-xs font-semibold whitespace-nowrap transition-all justify-start ${
                      activeTab === cat.id
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 shadow-md"
                        : "border border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                    }`}
                  >
                    {cat.icon}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Right Items Grid */}
            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
              <AnimatePresence mode="wait">
                {filteredItems ? (
                  /* Search Results block */
                  <motion.div
                    key="searchResults"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-4"
                  >
                    <div className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold mb-2">
                      Search Results ({filteredItems.length})
                    </div>
                    {filteredItems.length === 0 ? (
                      <div className="text-zinc-500 text-sm py-12 text-center font-light">
                        No macros or symbols match your search. Try looking in the categories!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredItems.map((item, idx) => (
                          <ItemCard
                            key={idx}
                            item={item}
                            onCopy={handleCopy}
                            copied={copiedCode === item.code}
                          />
                        ))}
                      </div>
                    )}
                  </motion.div>
                ) : (
                  /* Standard Category views */
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-4"
                  >
                    {categories
                      .find((c) => c.id === activeTab)
                      ?.items.map((item, idx) => (
                        <ItemCard
                          key={idx}
                          item={item}
                          onCopy={handleCopy}
                          copied={copiedCode === item.code}
                        />
                      ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="p-6 border-t border-white/5 bg-zinc-950/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
              Josephite Mathematics Club • MathJax Integration
            </span>
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs transition-all uppercase tracking-wider"
            >
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

// Item Card Component for displaying individual snippets nicely
const ItemCard: React.FC<{
  item: CheatsheetItem;
  onCopy: (code: string) => void;
  copied: boolean;
}> = ({ item, onCopy, copied }) => {
  return (
    <motion.div
      onClick={() => onCopy(item.code)}
      className="group relative bg-zinc-9003/30 border border-white/5 hover:border-emerald-500/30 rounded-2xl p-4 cursor-pointer flex flex-col justify-between hover:bg-white/[0.02] transition-all min-h-[140px]"
    >
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-white tracking-tight">{item.name}</span>
          <div className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 group-hover:text-emerald-400 transition-colors">
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
        <p className="text-[10px] text-zinc-400 leading-normal">{item.description}</p>
      </div>

      <div className="mt-auto space-y-2">
        {/* Render Preview */}
        <div className="p-3 bg-black/45 rounded-xl border border-white/5 flex items-center justify-center min-h-[50px] overflow-x-auto scrollbar-thin">
          <MathJaxNode content={item.renderText} inline />
        </div>

        {/* Technical code copy banner */}
        <div className="flex items-center justify-between text-[10px] font-mono bg-zinc-950/70 py-1.5 px-3 rounded-lg text-zinc-500 border border-white/5 group-hover:text-emerald-400/80 transition-colors">
          <span className="truncate max-w-[200px]">{item.code}</span>
          <span className="text-[8px] uppercase tracking-wider text-zinc-600 group-hover:text-emerald-500 font-bold ml-2 shrink-0">
            {copied ? "Copied!" : "Click to Copy"}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
