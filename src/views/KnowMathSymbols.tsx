"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  HelpCircle, 
  Play, 
  Volume2, 
  Copy, 
  Check, 
  RotateCcw, 
  Award, 
  ArrowRight, 
  BookOpen, 
  Layers, 
  Sliders, 
  Cpu, 
  ExternalLink,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StarField from '@/components/StarField';

interface SymbolItem {
  symbol: string;
  latex: string;
  name: string;
  pronunciation: string;
  category: 'Quantifiers' | 'Set Theory' | 'Logic & Proofs' | 'Number Systems';
  meaning: string;
  exampleStatement: string;
  exampleMeaning: string;
  isTrueInExample: boolean;
  counterexampleOrWitness: string;
}

const MATH_SYMBOLS_DATA: SymbolItem[] = [
  {
    symbol: '∀',
    latex: '\\forall',
    name: 'Universal Quantifier',
    pronunciation: 'For all / For every',
    category: 'Quantifiers',
    meaning: 'Asserts that a predicate holds true for every single element in a specified domain.',
    exampleStatement: '∀ x ∈ ℝ, x² ≥ 0',
    exampleMeaning: 'For every real number x, x squared is greater than or equal to zero.',
    isTrueInExample: true,
    counterexampleOrWitness: 'No counterexample exists because any real number squared is non-negative.'
  },
  {
    symbol: '∃',
    latex: '\\exists',
    name: 'Existential Quantifier',
    pronunciation: 'There exists / For at least one',
    category: 'Quantifiers',
    meaning: 'Asserts that there is at least one element in the domain for which the predicate is true.',
    exampleStatement: '∃ x ∈ ℤ, x + 5 = 2',
    exampleMeaning: 'There exists an integer x such that x plus 5 equals 2.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Witness: x = -3 (since -3 + 5 = 2).'
  },
  {
    symbol: '∃!',
    latex: '\\exists!',
    name: 'Uniqueness Quantifier',
    pronunciation: 'There exists a unique',
    category: 'Quantifiers',
    meaning: 'Asserts that there is exactly one element in the domain satisfying the property.',
    exampleStatement: '∃! x ∈ ℝ, x + 7 = 10',
    exampleMeaning: 'There exists a unique real number x such that x + 7 = 10.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Witness: x = 3 (no other real number satisfies 3 + 7 = 10).'
  },
  {
    symbol: '∈',
    latex: '\\in',
    name: 'Element of / Belongs to',
    pronunciation: 'Is an element of',
    category: 'Set Theory',
    meaning: 'Indicates that an object is a member of a set.',
    exampleStatement: '5 ∈ ℕ',
    exampleMeaning: '5 is an element of the natural numbers set.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Witness: 5 is a positive counting integer.'
  },
  {
    symbol: '∉',
    latex: '\\notin',
    name: 'Not an element of',
    pronunciation: 'Is not an element of',
    category: 'Set Theory',
    meaning: 'Indicates that an object does not belong to a specified set.',
    exampleStatement: '-3 ∉ ℕ',
    exampleMeaning: '-3 is not an element of the set of natural numbers.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Explanation: Natural numbers ℕ are positive integers {1, 2, 3, ...}.'
  },
  {
    symbol: '⊆',
    latex: '\\subseteq',
    name: 'Subset or equal',
    pronunciation: 'Is a subset of',
    category: 'Set Theory',
    meaning: 'Every element of the left set is contained inside the right set.',
    exampleStatement: 'ℤ ⊆ ℝ',
    exampleMeaning: 'The set of all integers is a subset of the set of all real numbers.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Witness: Every integer n can be written as a real number n.0.'
  },
  {
    symbol: '⇒',
    latex: '\\Rightarrow',
    name: 'Logical Implication',
    pronunciation: 'Implies / If ... then',
    category: 'Logic & Proofs',
    meaning: 'If the premise p is true, then the conclusion q must also be true.',
    exampleStatement: '(x = 2) ⇒ (x² = 4)',
    exampleMeaning: 'If x equals 2, then x squared equals 4.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Note: The converse (x² = 4) ⇒ (x = 2) is false due to counterexample x = -2.'
  },
  {
    symbol: '⇔',
    latex: '\\Leftrightarrow',
    name: 'Logical Equivalence',
    pronunciation: 'If and only if (iff)',
    category: 'Logic & Proofs',
    meaning: 'Both implications hold true (p ⇒ q AND q ⇒ p).',
    exampleStatement: 'x² = 0 ⇔ x = 0',
    exampleMeaning: 'x squared is 0 if and only if x is 0.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Bi-implication holds in both directions for all real numbers.'
  },
  {
    symbol: '¬',
    latex: '\\neg',
    name: 'Negation',
    pronunciation: 'Not / It is false that',
    category: 'Logic & Proofs',
    meaning: 'Flips the truth value of a proposition.',
    exampleStatement: '¬(∀ x ∈ ℝ, x > 0)',
    exampleMeaning: 'It is false that every real number is strictly positive.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Counterexample to "∀ x ∈ ℝ, x > 0" is x = 0 (since 0 is not > 0).'
  },
  {
    symbol: '∧',
    latex: '\\land',
    name: 'Logical Conjunction',
    pronunciation: 'And',
    category: 'Logic & Proofs',
    meaning: 'True only when both proposition p AND proposition q are true.',
    exampleStatement: '(x > 0) ∧ (x < 10)',
    exampleMeaning: 'x is greater than 0 AND x is less than 10.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Example value x = 5 satisfies both bounds.'
  },
  {
    symbol: '∨',
    latex: '\\lor',
    name: 'Logical Disjunction',
    pronunciation: 'Or',
    category: 'Logic & Proofs',
    meaning: 'True if at least one of proposition p OR proposition q is true.',
    exampleStatement: '(x = 3) ∨ (x = 5)',
    exampleMeaning: 'x equals 3 OR x equals 5.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Satisfied if x is either 3 or 5.'
  },
  {
    symbol: 'ℝ',
    latex: '\\mathbb{R}',
    name: 'Real Numbers',
    pronunciation: 'The set of real numbers',
    category: 'Number Systems',
    meaning: 'The continuous line of all rational and irrational numbers.',
    exampleStatement: 'π ∈ ℝ, √2 ∈ ℝ',
    exampleMeaning: 'Pi and square root of 2 are both real numbers.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Includes integers, fractions, and non-repeating decimals.'
  },
  {
    symbol: 'ℤ',
    latex: '\\mathbb{Z}',
    name: 'Integers',
    pronunciation: 'The set of integers',
    category: 'Number Systems',
    meaning: 'Set of all positive, negative, and zero whole numbers {... -2, -1, 0, 1, 2 ...}.',
    exampleStatement: '-4 ∈ ℤ, 0 ∈ ℤ, 9 ∈ ℤ',
    exampleMeaning: '-4, 0, and 9 are integers.',
    isTrueInExample: true,
    counterexampleOrWitness: 'Non-example: 0.5 ∉ ℤ.'
  },
  {
    symbol: 'ℕ',
    latex: '\\mathbb{N}',
    name: 'Natural Numbers',
    pronunciation: 'The set of natural numbers',
    category: 'Number Systems',
    meaning: 'Positive counting numbers {1, 2, 3, 4, ...}.',
    exampleStatement: '∀ n ∈ ℕ, n ≥ 1',
    exampleMeaning: 'Every natural number is greater than or equal to 1.',
    isTrueInExample: true,
    counterexampleOrWitness: 'No natural number exists below 1.'
  }
];

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the truth value of the universal statement: ∀ x ∈ ℤ, x² > 0?",
    options: [
      "TRUE, because all integers squared yield positive numbers.",
      "FALSE, because x = 0 is an integer and 0² = 0, which is NOT > 0.",
      "TRUE, because negative integers become positive when squared.",
      "FALSE, because negative integers squared are negative."
    ],
    correctIndex: 1,
    explanation: "Correct! The single counterexample x = 0 disproves the universal statement because 0² = 0, which is not strictly greater than 0."
  },
  {
    id: 2,
    question: "How do you verify an existential statement like ∃ x ∈ ℝ, x² + 2x + 1 = 0?",
    options: [
      "By proving it holds for every single real number.",
      "By constructing at least one valid example (a witness), such as x = -1.",
      "By checking if x = 0 satisfies the equation.",
      "Existential statements cannot be verified mathematically."
    ],
    correctIndex: 1,
    explanation: "Correct! To verify an existential statement (∃), you only need to construct ONE valid witness example. For x = -1: (-1)² + 2(-1) + 1 = 1 - 2 + 1 = 0."
  },
  {
    id: 3,
    question: "Which symbol represents 'there exists a unique' element?",
    options: ["∀", "∃", "∃!", "∈"],
    correctIndex: 2,
    explanation: "Correct! ∃! combines existence with uniqueness, meaning exactly one element satisfies the condition."
  },
  {
    id: 4,
    question: "What is the negation of the universal statement '∀ x ∈ S, P(x)'?",
    options: [
      "∀ x ∈ S, ¬P(x)",
      "∃ x ∈ S, ¬P(x)",
      "¬(∃ x ∈ S, P(x))",
      "∃ x ∉ S, P(x)"
    ],
    correctIndex: 1,
    explanation: "Correct! By De Morgan's laws for quantifiers, ¬(∀ x ∈ S, P(x)) is logically equivalent to ∃ x ∈ S, ¬P(x) ('there exists an x for which P(x) is false')."
  }
];

export default function KnowMathSymbolsView() {
  const [activeTab, setActiveTab] = useState<'symbols' | 'builder' | 'sandbox' | 'examples' | 'practice' | 'quiz'>('symbols');
  const [selectedSymbol, setSelectedSymbol] = useState<SymbolItem>(MATH_SYMBOLS_DATA[0]);
  const [copiedSymbol, setCopiedSymbol] = useState<string | null>(null);

  // Practice state
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [practiceChecked, setPracticeChecked] = useState<Record<number, boolean>>({});

  // Builder State
  const [builderQuantifier, setBuilderQuantifier] = useState<'∀' | '∃'>('∀');
  const [builderSet, setBuilderSet] = useState<'ℝ' | 'ℤ' | 'ℕ'>('ℤ');
  const [builderCondition, setBuilderCondition] = useState<string>('x² ≥ 0');

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [submittedQuiz, setSubmittedQuiz] = useState(false);

  // Sandbox state
  const [sandboxInputs, setSandboxInputs] = useState<{ [key: string]: string }>({});

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSymbol(text);
    setTimeout(() => setCopiedSymbol(null), 2000);
  };

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Evaluator logic for Builder
  const builderResult = useMemo(() => {
    let isTrue = false;
    let detail = '';
    let counterexampleOrWitness = '';

    if (builderQuantifier === '∀') {
      if (builderCondition === 'x² ≥ 0') {
        isTrue = true;
        detail = 'Universal statement holds! Every number in ' + builderSet + ' when squared is non-negative.';
      } else if (builderCondition === 'x² > 0') {
        if (builderSet === 'ℕ') {
          isTrue = true;
          detail = 'Universal statement holds in ℕ because natural numbers start at 1 (1² = 1 > 0).';
        } else {
          isTrue = false;
          detail = 'Universal statement FAILS in ' + builderSet + '!';
          counterexampleOrWitness = 'Counterexample: x = 0 (since 0² = 0, which is NOT > 0).';
        }
      } else if (builderCondition === 'x + 1 > x') {
        isTrue = true;
        detail = 'Universal statement holds! Adding 1 strictly increases any real or integer value.';
      } else if (builderCondition === 'x/2 ∈ ℤ') {
        isTrue = false;
        detail = 'Universal statement FAILS in ' + builderSet + '! Not every integer is even.';
        counterexampleOrWitness = 'Counterexample: x = 1 (1/2 = 0.5 ∉ ℤ).';
      }
    } else {
      // ∃ (Existential)
      if (builderCondition === 'x² = 2') {
        if (builderSet === 'ℝ') {
          isTrue = true;
          detail = 'Existential statement holds in ℝ!';
          counterexampleOrWitness = 'Witness: x = √2 ≈ 1.41421... (since (√2)² = 2).';
        } else {
          isTrue = false;
          detail = 'Existential statement FAILS in ' + builderSet + '! √2 is an irrational real number, not an integer or natural number.';
        }
      } else if (builderCondition === 'x + 10 = 0') {
        if (builderSet === 'ℕ') {
          isTrue = false;
          detail = 'Existential statement FAILS in ℕ! No natural number satisfies x + 10 = 0.';
        } else {
          isTrue = true;
          detail = 'Existential statement holds in ' + builderSet + '!';
          counterexampleOrWitness = 'Witness: x = -10 (since -10 + 10 = 0).';
        }
      } else {
        isTrue = true;
        detail = 'Existential statement holds! At least one element in ' + builderSet + ' satisfies this predicate.';
        counterexampleOrWitness = 'Witness exists for this condition.';
      }
    }

    return { isTrue, detail, counterexampleOrWitness };
  }, [builderQuantifier, builderSet, builderCondition]);

  // Quiz Score Calculation
  const quizScore = useMemo(() => {
    let score = 0;
    QUIZ_QUESTIONS.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score++;
    });
    return score;
  }, [quizAnswers]);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200 relative overflow-x-hidden">
      <StarField />
      <Navbar />

      <main className="pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
        
        {/* Host Banner Notice */}
        <div className="mb-6 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-mono flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400" />
            <span>Hosted Subdomain Application: <strong className="text-white">know-math-symbols.jmc-sjs.org</strong></span>
          </div>
          <span className="text-[11px] bg-cyan-500/20 px-2 py-0.5 rounded text-cyan-200">Interactive Logic & Symbols Engine</span>
        </div>

        {/* Hero Banner */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono font-bold uppercase tracking-widest"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Formal Mathematical Logic & Quantifiers</span>
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white">
            Know Math <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-blue-500">Symbols</span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 font-light leading-relaxed">
            Master first-order predicate logic, universal (∀) and existential (∃) quantifiers, counterexamples, and formal mathematical notation.
          </p>

          {/* Core Learning Takeaways Pill Grid */}
          <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-2 text-left text-xs font-mono">
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Interpret meanings of ∀ ("for all") and ∃ ("there exists")</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Distinguish universal vs existential statements</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Use counterexamples to disprove universal statements</span>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>Verify existential statements by constructing valid examples</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'symbols', label: 'Symbol Library', icon: BookOpen },
            { id: 'builder', label: 'Statement Builder & Proofs', icon: Sliders },
            { id: 'sandbox', label: 'Counterexample Sandbox', icon: Zap },
            { id: 'examples', label: 'Worked Examples & Proofs', icon: Layers },
            { id: 'practice', label: 'Interactive Practice Sets', icon: CheckCircle2 },
            { id: 'quiz', label: 'Mastery Quiz', icon: Award }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-mono font-bold transition-all border ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 shadow-lg shadow-cyan-500/10'
                    : 'bg-white/[0.02] border-white/5 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Symbol Library */}
        {activeTab === 'symbols' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {MATH_SYMBOLS_DATA.map((item) => {
                const isSelected = selectedSymbol.symbol === item.symbol;
                return (
                  <button
                    key={item.symbol}
                    onClick={() => setSelectedSymbol(item)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-200 relative group ${
                      isSelected
                        ? 'bg-cyan-500/10 border-cyan-500/50 text-white shadow-xl shadow-cyan-500/5'
                        : 'bg-zinc-900/40 border-white/10 hover:border-white/20 text-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-3xl font-mono font-black text-cyan-400">{item.symbol}</span>
                      <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-white group-hover:text-cyan-300">{item.name}</div>
                    <div className="text-xs font-mono text-zinc-400 mt-1">{item.pronunciation}</div>
                  </button>
                );
              })}
            </div>

            {/* Expanded Selected Symbol Details */}
            {selectedSymbol && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 sm:p-8 rounded-3xl bg-zinc-900/60 border border-cyan-500/30 space-y-6 shadow-2xl"
              >
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-4xl font-mono font-bold text-cyan-300">
                      {selectedSymbol.symbol}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedSymbol.name}</h2>
                      <p className="text-sm font-mono text-cyan-400">Pronunciation: "{selectedSymbol.pronunciation}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakText(`${selectedSymbol.name}. ${selectedSymbol.pronunciation}`)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-all"
                    >
                      <Volume2 className="w-4 h-4 text-cyan-400" />
                      <span>Audio Pronounce</span>
                    </button>
                    <button
                      onClick={() => handleCopy(selectedSymbol.latex)}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-mono text-cyan-300 transition-all"
                    >
                      {copiedSymbol === selectedSymbol.latex ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                      <span>Copy LaTeX ({selectedSymbol.latex})</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-zinc-400">Formal Meaning</span>
                    <p className="text-sm text-zinc-200 leading-relaxed font-light">{selectedSymbol.meaning}</p>
                  </div>

                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                    <span className="text-xs font-mono font-bold uppercase text-amber-400">Example Logic Statement</span>
                    <div className="text-base font-mono font-bold text-cyan-300">{selectedSymbol.exampleStatement}</div>
                    <p className="text-xs text-zinc-300">{selectedSymbol.exampleMeaning}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 flex items-start gap-3 text-xs font-mono text-cyan-200">
                  <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white uppercase block mb-0.5">Verification Analysis:</strong>
                    <span>{selectedSymbol.counterexampleOrWitness}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Tab 2: Quantifier Statement Builder */}
        {activeTab === 'builder' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Interactive Quantifier Statement Builder</h2>
              <p className="text-sm text-zinc-400 font-light mt-1">
                Construct formal logic statements and observe instant proof/disproof analysis with counterexamples and witnesses.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-6 rounded-2xl bg-white/[0.02] border border-white/5">
              {/* Quantifier Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">1. Select Quantifier</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setBuilderQuantifier('∀')}
                    className={`p-3 rounded-xl border text-center font-mono font-bold text-lg transition-all ${
                      builderQuantifier === '∀'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    ∀ (For All)
                  </button>
                  <button
                    onClick={() => setBuilderQuantifier('∃')}
                    className={`p-3 rounded-xl border text-center font-mono font-bold text-lg transition-all ${
                      builderQuantifier === '∃'
                        ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    ∃ (There Exists)
                  </button>
                </div>
              </div>

              {/* Set Domain Selection */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">2. Select Domain Set</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['ℝ', 'ℤ', 'ℕ'] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setBuilderSet(s)}
                      className={`p-3 rounded-xl border text-center font-mono font-bold text-base transition-all ${
                        builderSet === s
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                          : 'bg-white/5 border-white/10 text-zinc-400'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predicate Condition */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-zinc-400">3. Select Predicate Condition</label>
                <select
                  value={builderCondition}
                  onChange={(e) => setBuilderCondition(e.target.value)}
                  className="w-full p-3 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                >
                  <option value="x² ≥ 0">x² ≥ 0</option>
                  <option value="x² > 0">x² &gt; 0</option>
                  <option value="x + 1 > x">x + 1 &gt; x</option>
                  <option value="x² = 2">x² = 2</option>
                  <option value="x + 10 = 0">x + 10 = 0</option>
                  <option value="x/2 ∈ ℤ">x/2 ∈ ℤ</option>
                </select>
              </div>
            </div>

            {/* Generated Statement Display */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-cyan-950/40 via-zinc-900 to-sky-950/40 border border-cyan-500/30 text-center space-y-3">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-widest">Constructed Formal Statement</span>
              <div className="text-3xl font-mono font-bold text-white">
                {builderQuantifier} x ∈ {builderSet}, {builderCondition}
              </div>
            </div>

            {/* Real-time Proof / Disproof Analysis Box */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              builderResult.isTrue 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                {builderResult.isTrue ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-rose-400" />
                )}
                <div>
                  <h4 className="text-lg font-bold text-white">
                    Truth Value: {builderResult.isTrue ? 'STATEMENT IS TRUE' : 'STATEMENT IS FALSE'}
                  </h4>
                  <p className="text-xs font-mono mt-0.5">{builderResult.detail}</p>
                </div>
              </div>

              {builderResult.counterexampleOrWitness && (
                <div className="p-4 rounded-xl bg-black/40 border border-white/10 text-xs font-mono text-zinc-200">
                  <strong className="text-amber-400 block mb-1">
                    {builderResult.isTrue ? '✓ Valid Witness Example:' : '❌ Disproving Counterexample:'}
                  </strong>
                  <span>{builderResult.counterexampleOrWitness}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Counterexample Sandbox */}
        {activeTab === 'sandbox' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white">Counterexample & Witness Constructor</h2>
              <p className="text-sm text-zinc-400 font-light mt-1">
                Test your mathematical intuition! Input values for $x$ to find counterexamples that disprove universal statements or valid witnesses that satisfy existential statements.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  id: 'c1',
                  statement: '∀ x ∈ ℤ, x² > x',
                  type: 'universal',
                  goal: 'Find a counterexample x ∈ ℤ where x² ≤ x',
                  check: (val: number) => val * val <= val
                },
                {
                  id: 'c2',
                  statement: '∃ x ∈ ℝ, x² + 4x + 4 = 0',
                  type: 'existential',
                  goal: 'Construct a witness x ∈ ℝ satisfying x² + 4x + 4 = 0',
                  check: (val: number) => Math.abs(val * val + 4 * val + 4) < 0.0001
                },
                {
                  id: 'c3',
                  statement: '∀ x ∈ ℝ, |x| > 0',
                  type: 'universal',
                  goal: 'Find a counterexample x ∈ ℝ where |x| ≤ 0',
                  check: (val: number) => Math.abs(val) <= 0
                }
              ].map((item) => {
                const rawVal = sandboxInputs[item.id] || '';
                const numVal = parseFloat(rawVal);
                const isValidInput = !isNaN(numVal);
                const isPassed = isValidInput && item.check(numVal);

                return (
                  <div key={item.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-lg font-mono font-bold text-cyan-300">{item.statement}</span>
                      <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-md">
                        {item.goal}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        placeholder="Enter value for x (e.g. 0, -2, 1)"
                        value={rawVal}
                        onChange={(e) => setSandboxInputs({ ...sandboxInputs, [item.id]: e.target.value })}
                        className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-sm focus:border-cyan-500 focus:outline-none"
                      />
                      {rawVal && (
                        <div className={`px-4 py-3 rounded-xl text-xs font-mono font-bold flex items-center gap-2 ${
                          isPassed ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {isPassed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{isPassed ? 'Correct!' : 'Try another value'}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: Worked Examples & Proof Walkthroughs */}
        {activeTab === 'examples' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Layers className="w-6 h-6 text-cyan-400" />
                <span>Step-by-Step Worked Logic Examples</span>
              </h2>
              <p className="text-sm text-zinc-400 font-light mt-1">
                Detailed step-by-step mathematical proofs, quantifier translations, witness constructions, and counterexample derivations.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {[
                {
                  id: 'ex1',
                  title: 'Example 1: Disproving Universal Quantifier via Counterexample',
                  statement: '∀ x ∈ ℝ, x² > x',
                  steps: [
                    'Step 1 (Statement Analysis): Translate to plain English: "For every real number x, its square is strictly greater than x."',
                    'Step 2 (Testing Values): Try x = 2 → 2² = 4 > 2 (Holds). Try x = -1 → (-1)² = 1 > -1 (Holds). Try x = 0.5 → (0.5)² = 0.25, which is NOT > 0.5!',
                    'Step 3 (Counterexample Formal Proof): Let x = 0.5 ∈ ℝ. Then x² = 0.25. Since 0.25 ≤ 0.5, the condition fails for at least one element.',
                    'Step 4 (Conclusion): A single counterexample disproves a universal statement. Thus, "∀ x ∈ ℝ, x² > x" is FALSE.'
                  ],
                  outcome: 'FALSE (Counterexample x = 0.5 or x = 0)'
                },
                {
                  id: 'ex2',
                  title: 'Example 2: Proving Existential Quantifier via Witness Construction',
                  statement: '∃ x ∈ ℤ, x³ - 3x + 2 = 0',
                  steps: [
                    'Step 1 (Statement Analysis): Translate to plain English: "There exists at least one integer x such that x³ - 3x + 2 = 0."',
                    'Step 2 (Witness Search): We only need ONE valid integer x in ℤ. Test small integers: x = 0 → 0 - 0 + 2 = 2 ≠ 0. Test x = 1 → 1³ - 3(1) + 2 = 1 - 3 + 2 = 0.',
                    'Step 3 (Formal Witness Verification): Let x = 1 ∈ ℤ. Direct evaluation yields 1³ - 3(1) + 2 = 0.',
                    'Step 4 (Conclusion): Presenting x = 1 as a witness proves the existential statement. Thus, "∃ x ∈ ℤ, x³ - 3x + 2 = 0" is TRUE.'
                  ],
                  outcome: 'TRUE (Witness x = 1)'
                },
                {
                  id: 'ex3',
                  title: 'Example 3: Negating Quantified Logic Statements (De Morgan)',
                  statement: '¬ ( ∀ n ∈ ℕ, n² + 1 is prime )',
                  steps: [
                    'Step 1 (De Morgan Transformation Rule): ¬(∀ x ∈ S, P(x)) ≡ ∃ x ∈ S, ¬P(x).',
                    'Step 2 (Rewriting in Natural Notation): "There exists a natural number n such that n² + 1 is NOT prime (i.e. composite)."',
                    'Step 3 (Witness Discovery): Test n = 1 → 1² + 1 = 2 (Prime). Test n = 2 → 2² + 1 = 5 (Prime). Test n = 3 → 3² + 1 = 10 (Composite: 2 × 5).',
                    'Step 4 (Conclusion): Since n = 3 ∈ ℕ yields 10 which is composite, the negated statement is TRUE.'
                  ],
                  outcome: 'TRUE (Witness n = 3 yields composite 10)'
                },
                {
                  id: 'ex4',
                  title: 'Example 4: Order of Nested Quantifiers (∀∃ vs ∃∀)',
                  statement: 'Compare: (A) ∀ x ∈ ℝ, ∃ y ∈ ℝ, x + y = 0  VS  (B) ∃ y ∈ ℝ, ∀ x ∈ ℝ, x + y = 0',
                  steps: [
                    'Step 1 (Analyzing Statement A): "For every real number x, there exists a y such that x + y = 0." Here, y can depend on x. For any given x, choose y = -x. Since -x is always real, (A) is TRUE.',
                    'Step 2 (Analyzing Statement B): "There exists a single real number y that makes x + y = 0 for ALL real numbers x simultaneously." Here, y must be fixed first.',
                    'Step 3 (Disproving B): If y = 0, then x + 0 = 0 fails for x = 1. If y = -5, then 2 + (-5) = -3 ≠ 0. No single fixed y works for all x.',
                    'Step 4 (Conclusion): Quantifier order matters! ∀∃ allows y to depend on x, whereas ∃∀ requires a single uniform y.'
                  ],
                  outcome: 'Statement A is TRUE; Statement B is FALSE'
                }
              ].map((ex) => (
                <div key={ex.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                    <h3 className="text-base font-bold text-white">{ex.title}</h3>
                    <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/20 border border-cyan-500/40 text-cyan-300">
                      {ex.outcome}
                    </span>
                  </div>

                  <div className="text-lg font-mono font-bold text-cyan-300 bg-black/40 p-3.5 rounded-xl border border-white/5">
                    {ex.statement}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    {ex.steps.map((step, idx) => (
                      <div key={idx} className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 text-xs sm:text-sm font-mono text-zinc-300 leading-relaxed">
                        {step}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Guided Practice Sets */}
        {activeTab === 'practice' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                <span>Guided Interactive Practice Exercises</span>
              </h2>
              <p className="text-sm text-zinc-400 font-light mt-1">
                Solve formal logic problems, select counterexamples, and verify statement translations with instant feedback.
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  id: 1,
                  question: 'Exercise 1: Disprove the universal statement "∀ x ∈ ℝ, |x| > 0". Which value of x serves as a valid counterexample?',
                  options: ['x = -5', 'x = 0', 'x = 1', 'x = 0.1'],
                  correct: 1,
                  explanation: 'Correct! At x = 0, |0| = 0, which is NOT strictly greater than 0. This single counterexample disproves the universal statement.'
                },
                {
                  id: 2,
                  question: 'Exercise 2: Select the correct formal logic translation for: "There exists a natural number that is both even and prime."',
                  options: [
                    '∀ x ∈ ℕ, Even(x) ∧ Prime(x)',
                    '∃ x ∈ ℕ, Even(x) ∧ Prime(x)',
                    '∃ x ∈ ℕ, Even(x) → Prime(x)',
                    '∀ x ∈ ℕ, Even(x) ∨ Prime(x)'
                  ],
                  correct: 1,
                  explanation: 'Correct! "There exists" translates to ∃ x ∈ ℕ, and the conjunction "both even AND prime" translates to Even(x) ∧ Prime(x). (The witness is x = 2).'
                },
                {
                  id: 3,
                  question: 'Exercise 3: Construct a witness to prove the existential statement "∃ x ∈ ℤ, 2x + 5 = 13". What is the correct value of x?',
                  options: ['x = 3', 'x = 4', 'x = 5', 'x = 8'],
                  correct: 1,
                  explanation: 'Correct! Solving 2x + 5 = 13 gives 2x = 8 ⇒ x = 4. Since 4 is an integer (4 ∈ ℤ), x = 4 is a valid witness proving the statement.'
                },
                {
                  id: 4,
                  question: 'Exercise 4: What is the logical negation of the statement "∀ x ∈ ℝ, x² ≥ 0"?',
                  options: [
                    '∀ x ∈ ℝ, x² < 0',
                    '∃ x ∈ ℝ, x² < 0',
                    '∃ x ∈ ℝ, x² ≤ 0',
                    '¬(∃ x ∈ ℝ, x² ≥ 0)'
                  ],
                  correct: 1,
                  explanation: 'Correct! Negating a universal statement flips the quantifier to existential and negates the predicate: ¬(∀ x ∈ ℝ, x² ≥ 0) ≡ ∃ x ∈ ℝ, x² < 0.'
                }
              ].map((p) => {
                const selected = practiceAnswers[p.id];
                const checked = practiceChecked[p.id];
                return (
                  <div key={p.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                    <h3 className="text-base font-bold text-white font-mono">{p.question}</h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {p.options.map((opt, idx) => {
                        const isOptSelected = selected === idx;
                        const isOptCorrect = p.correct === idx;
                        let btnStyle = "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10";
                        if (checked) {
                          if (isOptCorrect) btnStyle = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold";
                          else if (isOptSelected) btnStyle = "bg-rose-500/20 border-rose-500/50 text-rose-200";
                        } else if (isOptSelected) {
                          btnStyle = "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              setPracticeAnswers({ ...practiceAnswers, [p.id]: idx });
                              setPracticeChecked({ ...practiceChecked, [p.id]: false });
                            }}
                            className={`p-3.5 rounded-xl border text-left text-xs font-mono transition-all ${btnStyle}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        disabled={selected === undefined}
                        onClick={() => setPracticeChecked({ ...practiceChecked, [p.id]: true })}
                        className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300 disabled:opacity-40 transition-all"
                      >
                        Check Answer
                      </button>

                      {checked && (
                        <div className={`text-xs font-mono font-bold flex items-center gap-1.5 ${
                          selected === p.correct ? 'text-emerald-400' : 'text-rose-400'
                        }`}>
                          {selected === p.correct ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          <span>{selected === p.correct ? 'Correct Answer!' : 'Incorrect'}</span>
                        </div>
                      )}
                    </div>

                    {checked && (
                      <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200 mt-2">
                        {p.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Mastery Quiz */}
        {activeTab === 'quiz' && (
          <div className="p-6 sm:p-10 rounded-3xl bg-zinc-900/50 border border-white/10 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-2xl font-bold text-white">Quantifier & Symbols Mastery Quiz</h2>
                <p className="text-sm text-zinc-400 font-light mt-1">
                  Test your understanding of logic notation, universal quantification, and counterexamples.
                </p>
              </div>

              {submittedQuiz && (
                <div className="px-6 py-3 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-base">
                  Score: {quizScore} / {QUIZ_QUESTIONS.length}
                </div>
              )}
            </div>

            <div className="space-y-8">
              {QUIZ_QUESTIONS.map((q, idx) => (
                <div key={q.id} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                  <h3 className="text-base font-bold text-white">
                    {idx + 1}. {q.question}
                  </h3>

                  <div className="grid grid-cols-1 gap-2">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = quizAnswers[q.id] === optIdx;
                      const isCorrect = q.correctIndex === optIdx;

                      let btnClass = "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10";
                      if (submittedQuiz) {
                        if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200 font-bold";
                        else if (isSelected) btnClass = "bg-rose-500/20 border-rose-500/50 text-rose-200";
                      } else if (isSelected) {
                        btnClass = "bg-cyan-500/20 border-cyan-500/50 text-cyan-200 font-bold";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={submittedQuiz}
                          onClick={() => setQuizAnswers({ ...quizAnswers, [q.id]: optIdx })}
                          className={`p-3.5 rounded-xl border text-left text-xs sm:text-sm font-mono transition-all ${btnClass}`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>

                  {submittedQuiz && (
                    <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs font-mono text-cyan-200">
                      {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!submittedQuiz ? (
              <button
                onClick={() => setSubmittedQuiz(true)}
                disabled={Object.keys(quizAnswers).length < QUIZ_QUESTIONS.length}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-mono font-bold text-sm hover:brightness-110 disabled:opacity-40 transition-all shadow-xl"
              >
                Submit Answers & View Score
              </button>
            ) : (
              <button
                onClick={() => {
                  setSubmittedQuiz(false);
                  setQuizAnswers({});
                }}
                className="w-full py-4 rounded-2xl bg-white/10 border border-white/20 text-white font-mono font-bold text-sm hover:bg-white/20 transition-all"
              >
                Retake Quiz
              </button>
            )}
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
