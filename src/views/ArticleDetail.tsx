"use client";
import React, { useState, useEffect, useRef } from "react";
import { useContent } from "@/context/ContentContext";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowLeft, User, Calendar, BookOpen, Sliders, 
  HelpCircle, X, ChevronRight, Check, Eye, EyeOff,
  Maximize2, Minimize2, Type, Layout, Info
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMathJax } from "../hooks/useMathJax";

// Math notations reference helper data
const CHEAT_SHEET_CATEGORIES = [
  {
    title: "Greek Letters",
    items: [
      { sym: "\\alpha, \\beta, \\gamma", desc: "Angles, coefficients, constant values" },
      { sym: "\\theta, \\phi, \\psi", desc: "Angle parameters in geometry / physics" },
      { sym: "\\lambda", desc: "Eigenvalues, wavelength, Lagrange multipliers" },
      { sym: "\\mu, \\sigma", desc: "Mean and standard deviation in statistics" },
      { sym: "\\pi", desc: "Ratio of circumference to diameter (≈ 3.14159)" },
      { sym: "\\omega, \\Omega", desc: "Angular frequency, sample space, ohms" },
      { sym: "\\Sigma, \\Pi", desc: "Summation and product operators" },
      { sym: "\\Delta, \\delta", desc: "Difference, small change, Dirac delta" },
      { sym: "\\Gamma(z)", desc: "The Gamma Function (factorial extension)" },
    ]
  },
  {
    title: "Calculus & Limits",
    items: [
      { sym: "\\lim_{x \\to a}", desc: "Limit as variable x approaches value a" },
      { sym: "\\diff{y}{x} \\text{ or } \\dd y", desc: "Leibniz derivative or differential" },
      { sym: "\\pdv{f}{x}", desc: "Partial derivative with respect to x" },
      { sym: "\\int f(x) \\dd x", desc: "Indefinite integral / antiderivative" },
      { sym: "\\int_a^b f(x) \\dd x", desc: "Definite integral (area under curve)" },
      { sym: "\\nabla f", desc: "Gradient vector of function f" },
      { sym: "\\nabla \\cdot \\mathbf{F}", desc: "Divergence of vector field F" },
      { sym: "\\nabla \\times \\mathbf{F}", desc: "Curl of vector field F" },
    ]
  },
  {
    title: "Sets & Logic",
    items: [
      { sym: "x \\in A", desc: "Element x belongs to set A" },
      { sym: "A \\subset B", desc: "Set A is a subset of set B" },
      { sym: "A \\cup B, A \\cap B", desc: "Union and intersection of sets" },
      { sym: "\\mathbb{R}, \\mathbb{C}, \\mathbb{N}, \\mathbb{Z}", desc: "Real, Complex, Natural, Integers" },
      { sym: "\\forall, \\exists", desc: "For all, there exists (quantifiers)" },
      { sym: "P \\implies Q", desc: "Logical implication (P implies Q)" },
      { sym: "P \\iff Q", desc: "If and only if (biconditional equivalence)" },
    ]
  },
  {
    title: "Constants & Equations",
    items: [
      { sym: "e \\approx 2.71828", desc: "Euler's number, base of natural logs" },
      { sym: "i^2 = -1", desc: "Imaginary unit for complex numbers" },
      { sym: "\\phi \\approx 1.61803", desc: "Golden Ratio of aesthetic geometry" },
      { sym: "e^{i\\pi} + 1 = 0", desc: "Euler's identity (unifying 5 constants)" },
    ]
  }
];

// Rich detailed mathematical fallback articles
const getFallbackContent = (title: string): string => {
  const norm = (title || '').trim().toLowerCase();
  
  if (norm.includes('gamma')) {
    return `# The Gamma Function: Extending the Factorial

The Gamma Function, denoted by \\(\\Gamma(z)\\), is one of the most elegant and deeply integrated functions in mathematical analysis, number theory, and statistics. It serves as the natural extension of the factorial function to real and complex numbers.

## 1. Integral Definition

For any complex number \\(z\\) with a positive real part (\\(\\Re(z) > 0\\)), the Gamma Function is defined by the following absolutely convergent improper integral:

\\[ \\Gamma(z) = \\int_{0}^{\\infty} t^{z-1} e^{-t} \\dd t \\]

Through analytic continuation, the domain of \\(\\Gamma(z)\\) can be extended to the entire complex plane, excluding the non-positive integers (\\(0, -1, -2, -3, \\dots\\)), where the function exhibits simple poles.

## 2. Key Algebraic Properties

The Gamma Function satisfies several beautiful functional equations. The most fundamental is the recurrence relation, which can be proved using integration by parts:

\\[ \\Gamma(z+1) = z \\Gamma(z) \\]

When \\(n\\) is a positive integer (\\(n \\in \\mathbb{N}\\)), this recurrence relation, together with the base case \\(\\Gamma(1) = 1\\), yields the connection to factorials:

\\[ \\Gamma(n) = (n-1)! \\]

### Euler's Reflection Formula

Another remarkable result is Euler's reflection formula, which relates \\(\\Gamma(z)\\) and \\(\\Gamma(1-z)\\):

\\[ \\Gamma(z) \\Gamma(1-z) = \\frac{\\pi}{\\sin(\\pi z)} \\]

Substituting \\(z = 1/2\\) into the reflection formula yields a famous result:

\\[ \\Gamma\\left(\\frac{1}{2}\\right) = \\sqrt{\\pi} \\]

This can also be verified by evaluating the Gaussian integral:

\\[ \\int_{-\\infty}^{\\infty} e^{-x^2} \\dd x = \\sqrt{\\pi} \\]

### Legendre Duplication Formula

The duplication formula simplifies products of Gamma functions of half-arguments:

\\[ \\Gamma(z) \\Gamma\\left(z + \\frac{1}{2}\\right) = 2^{1-2z} \\sqrt{\\pi} \\Gamma(2z) \\]

## 3. Stirling's Approximation

When dealing with extremely large values of \\(z\\), evaluating the factorial or the Gamma function directly becomes computationally difficult. Stirling's approximation provides an asymptotic formula for the Gamma function:

\\[ \\Gamma(z+1) \\approx \\sqrt{2 \\pi z} \\left(\\frac{z}{e}\\right)^z \\]

This approximation is critical in statistical mechanics, thermodynamics, and probability theory, where systems typically contain a massive number of particles (on the order of Avogadro's number, \\(10^{23}\\)).`;
  }

  if (norm.includes('point') || norm.includes('radical') || norm.includes('circle')) {
    return `# Power of a Point & The Radical Axis

In Euclidean geometry, the Power of a Point is an algebraic measure of the relative distance of a given point to a circle. It is a foundational concept in olympiad-level geometry, providing a bridge between synthetic proofs and algebraic properties.

## 1. Defining the Power of a Point

Let \\(\\omega\\) be a circle with center \\(O\\) and radius \\(R\\). For any point \\(P\\) in the plane, the power of \\(P\\) with respect to \\(\\omega\\), denoted by \\(\\mathcal{P}(P, \\omega)\\), is defined as:

\\[ \\mathcal{P}(P, \\omega) = d^2 - R^2 \\]

where \\(d = OP\\) is the distance from \\(P\\) to the center \\(O\\).

* If \\(P\\) is **outside** the circle, the power is positive (\\(\\mathcal{P}(P, \\omega) > 0\\)).
* If \\(P\\) is **on** the circle, the power is zero (\\(\\mathcal{P}(P, \\omega) = 0\\)).
* If \\(P\\) is **inside** the circle, the power is negative (\\(\\mathcal{P}(P, \\omega) < 0\\)).

## 2. Geometric Interpretation and Theorems

### Case 1: Point Outside the Circle

Let a line through \\(P\\) intersect the circle at two points \\(A\\) and \\(B\\). A second line through \\(P\\) intersects the circle at \\(C\\) and \\(D\\). The Intersecting Secants Theorem states:

\\[ PA \\cdot PB = PC \\cdot PD = d^2 - R^2 \\]

If a tangent line from \\(P\\) touches the circle at \\(T\\), then:

\\[ PT^2 = d^2 - R^2 \\]

Hence, the power of an external point represents the square of the length of the tangent segment from \\(P\\) to the circle.

### Case 2: Point Inside the Circle

If \\(P\\) is inside the circle, any chord through \\(P\\) with endpoints \\(A\\) and \\(B\\) satisfies:

\\[ PA \\cdot PB = R^2 - d^2 \\]

Taking the directed segments into account, the product \\( \\vec{PA} \\cdot \\vec{PB} \\) is always equal to \\( d^2 - R^2 \\).

## 3. The Radical Axis

Given two non-concentric circles \\(\\omega_1\\) (with center \\(O_1\\), radius \\(R_1\\)) and \\(\\omega_2\\) (with center \\(O_2\\), radius \\(R_2\\)), the Radical Axis is defined as the locus of all points \\(P\\) in the plane that have equal power with respect to both circles:

\\[ \\mathcal{P}(P, \\omega_1) = \\mathcal{P}(P, \\omega_2) \\]

Expanding this definition using coordinates reveals that the radical axis is always a straight line perpendicular to the line connecting the centers of the two circles (\\(O_1O_2\\)).

### Radical Center of Three Circles

For three circles with non-collinear centers, the radical axes of the three pairs of circles intersect at a single point called the **Radical Center**. This point has equal power with respect to all three circles.`;
  }

  if (norm.includes('eigen') || norm.includes('vector')) {
    return `# Eigenvalues and Eigenvectors: Linear Transformations Unveiled

In linear algebra, matrix operations can often feel abstract. Eigenvalues and eigenvectors provide a geometric lens through which we can understand exactly what a matrix transformation does to a vector space.

## 1. The Core Equation

Let \\(A\\) be an \\(n \\times n\\) square matrix. A non-zero vector \\(\\mathbf{v\\) is called an **eigenvector** of \\(A\\) if multiplying \\(A\\) by \\(\\mathbf{v\\) results in a scalar multiple of \\(\\mathbf{v\\):

\\[ A \\mathbf{v} = \\lambda \\mathbf{v} \\]

where \\(\\lambda\\) is a scalar known as the **eigenvalue** corresponding to \\(\\mathbf{v\\).

Geometrically, when a vector space undergoes the linear transformation represented by \\(A\\), eigenvectors are the special directions that do not change orientation; they are only stretched, shrunk, or flipped by the factor \\(\\lambda\\).

## 2. Finding Eigenvalues: The Characteristic Equation

To solve the equation \\(A\\mathbf{v} = \\lambda\\mathbf{v}\\), we can rewrite it using the identity matrix \\(I\\):

\\[ (A - \\lambda I) \\mathbf{v} = \\mathbf{0} \\]

Since \\(\\mathbf{v}\\) is a non-zero vector, the matrix \\((A - \\lambda I)\\) must be singular (non-invertible). Therefore, its determinant must equal zero:

\\[ \\det(A - \\lambda I) = 0 \\]

This equation is a polynomial in \\(\\lambda\\) of degree \\(n\\), called the **characteristic polynomial**. The roots of this polynomial are the eigenvalues of \\(A\\).

### Example Calculation

Let \\(A = \\begin{pmatrix} 4 & 1 \\\\ 2 & 3 \\end{pmatrix}\\). The characteristic equation is:

\\[ \\det\\begin{pmatrix} 4-\\lambda & 1 \\\\ 2 & 3-\\lambda \\end{pmatrix} = 0 \\]
\\[ (4-\\lambda)(3-\\lambda) - 2 = 0 \\]
\\[ \\lambda^2 - 7\\lambda + 10 = 0 \\]

Factoring this yields \\((\\lambda - 5)(\\lambda - 2) = 0\\), so the eigenvalues are \\(\\lambda_1 = 5\\) and \\(\\lambda_2 = 2\\).

## 3. Applications of Eigenvalues

### Diagonalization

If a matrix \\(A\\) has \\(n\\) linearly independent eigenvectors, we can form a matrix \\(P\\) whose columns are these eigenvectors. Then, \\(A\\) can be diagonalized:

\\[ P^{-1} A P = D \\]

where \\(D\\) is a diagonal matrix containing the eigenvalues of \\(A\\). This is extremely useful for computing powers of matrices, since \\(A^k = P D^k P^{-1}\\).`;
  }

  if (norm.includes('physics') || norm.includes('statistical')) {
    return `# Statistical Physics: Bridging the Micro and Macro Worlds

Statistical physics is the powerful framework that bridges the microscopic world of atoms and molecules with the macroscopic world of thermodynamic properties. By applying probability theory and statistics, it explains how the collective, randomized behavior of billions of particles directly gives rise to observable variables like temperature, pressure, and entropy.

## 1. The Microstate and Macrostate

A **microstate** is a specific configuration of a system, specifying the exact positions and momenta of every individual particle. For a gas of \\(N\\) particles, this requires \\(6N\\) coordinates.

A **macrostate** is defined by macroscopic parameters of the system, such as total energy \\(E\\), volume \\(V\\), and number of particles \\(N\\).

The fundamental postulate of statistical mechanics states that **all accessible microstates of an isolated system are equally likely**.

## 2. Boltzmann Entropy

Ludwig Boltzmann formulated a beautiful relationship connecting the macroscopic concept of entropy \\(S\\) to the number of microstates \\(\\Omega\\) corresponding to a given macrostate:

\\[ S = k_B \\ln \\Omega \\]

where \\(k_B \\approx 1.38 \\times 10^{-23} \\text{ J/K}\\) is the Boltzmann constant. This equation, famously engraved on Boltzmann's tombstone, provides the statistical definition of the Second Law of Thermodynamics: systems naturally evolve toward macrostates with the highest number of microstates (maximum entropy).

## 3. The Boltzmann Distribution

In a system that can exchange energy with a heat reservoir at temperature \\(T\\), the probability \\(P_i\\) of the system occupying a specific microstate \\(i\\) with energy \\(E_i\\) is given by the Boltzmann distribution:

\\[ P_i = \\frac{e^{-\\beta E_i}}{Z} \\]

where:
* \\(\\beta = \\frac{1}{k_B T}\\) is the thermodynamic beta.
* \\(Z\\) is the **Partition Function**, which acts as the normalization factor.

### The Partition Function

The Partition Function \\(Z\\) is the central object in statistical mechanics, summing the Boltzmann factors over all possible states:

\\[ Z = \\sum_{i} e^{-\\beta E_i} \\]

Once \\(Z\\) is known, all thermodynamic properties of the system can be derived through differentiation. For instance, the average energy \\(\\langle E \\rangle\\) is given by:

\\[ \\langle E \\rangle = -\\frac{\\partial \\ln Z}{\\partial \\beta} \\]`;
  }

  // General fallback math article
  return `# Foundations of Mathematical Analysis

Mathematical analysis is the branch of mathematics dealing with limits and related theories, such as differentiation, integration, measure, infinite series, and analytic functions. 

## 1. The Real Number System and Completeness

At the heart of analysis is the concept of the real number system. The defining property of real numbers that separates them from the rational numbers is the **Completeness Axiom** (or the Least Upper Bound property):

> **Completeness Axiom:** Every non-empty set of real numbers that is bounded above has a least upper bound (supremum) in \\(\\mathbb{R}\\).

This axiom guarantees that there are no "holes" in the real line, allowing for the rigorous definition of limits, continuity, and convergence.

## 2. Limits and Convergence

A sequence of real numbers \\(\\{a_n\\}\\) is said to converge to a limit \\(L\\) if, for every \\(\\varepsilon > 0\\), there exists an integer \\(N \\in \\mathbb{N}\\) such that for all \\(n \\ge N\\):

\\[ |a_n - L| < \\varepsilon \\]

Using this definition, we can build the foundational framework of calculus. For instance, the derivative of a function \\(f(x)\\) at a point \\(x\\) is defined as:

\\[ f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h} \\]

## 3. Fundamental Theorem of Calculus

The Fundamental Theorem of Calculus establishes a beautiful connection between differentiation and integration, showing that they are essentially inverse operations.

If \\(f\\) is continuous on \\([a, b]\\) and \\(F\\) is an antiderivative of \\(f\\) such that \\(F'(x) = f(x)\\), then:

\\[ \\int_{a}^{b} f(x) \\dd x = F(b) - F(a) \\]

This elegant result allows us to evaluate area under curves analytically rather than approximating sums.`;
};

const ArticleDetailView = () => {
  const params = useParams();
  const slug = params?.slug;
  const { content } = useContent();
  const articles = (content as any)?.articles || [];
  const article = articles.find((a: any) => a.slug === slug);

  // Reading Mode Customization States
  const [immersive, setImmersive] = useState(false);
  const [theme, setTheme] = useState<'default' | 'sepia' | 'light' | 'charcoal'>('default');
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg' | 'xl' | '2xl'>('lg');
  const [fontFamily, setFontFamily] = useState<'sans' | 'serif' | 'mono'>('serif');
  const [lineHeight, setLineHeight] = useState<'normal' | 'relaxed' | 'loose'>('relaxed');
  const [containerWidth, setContainerWidth] = useState<'narrow' | 'standard' | 'wide'>('standard');
  const [focusMode, setFocusMode] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Elite, highly-optimized Math Reading Mode Toggle
  const [readingMode, setReadingMode] = useState(false);
  const prevSettingsRef = useRef<{
    theme: typeof theme;
    fontSize: typeof fontSize;
    fontFamily: typeof fontFamily;
    lineHeight: typeof lineHeight;
    containerWidth: typeof containerWidth;
    focusMode: typeof focusMode;
  } | null>(null);

  const toggleReadingMode = () => {
    if (!readingMode) {
      // Save current settings
      prevSettingsRef.current = { theme, fontSize, fontFamily, lineHeight, containerWidth, focusMode };
      // Apply optimal long-form mathematical reading settings
      setTheme('sepia');
      setFontSize('xl');
      setFontFamily('serif');
      setLineHeight('loose');
      setContainerWidth('standard');
      setFocusMode(true);
      setReadingMode(true);
    } else {
      // Restore previous settings
      if (prevSettingsRef.current) {
        setTheme(prevSettingsRef.current.theme);
        setFontSize(prevSettingsRef.current.fontSize);
        setFontFamily(prevSettingsRef.current.fontFamily);
        setLineHeight(prevSettingsRef.current.lineHeight);
        setContainerWidth(prevSettingsRef.current.containerWidth);
        setFocusMode(prevSettingsRef.current.focusMode);
      } else {
        setTheme('default');
        setFontSize('lg');
        setFontFamily('serif');
        setLineHeight('relaxed');
        setContainerWidth('standard');
        setFocusMode(false);
      }
      setReadingMode(false);
    }
  };
  
  // Interactive Helper States
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useMathJax();

  // Watch scroll in full-screen immersive container
  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const progress = scrollHeight - clientHeight > 0 
        ? (scrollTop / (scrollHeight - clientHeight)) * 100 
        : 0;
      setScrollProgress(progress);
    }
  };

  // Listen to keyboard shortcut (Esc to exit immersive mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setImmersive(false);
      }
    };
    if (immersive) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden"; // block main page scrolling
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [immersive]);

  // Whenever preferences change, re-run MathJax rendering on document
  useEffect(() => {
    const mj = (window as any).MathJax;
    if (mj && mj.typesetPromise) {
      setTimeout(() => {
        mj.typesetPromise().catch((err: any) => console.log("MathJax typesetting err:", err));
      }, 100);
    }
  }, [theme, fontSize, fontFamily, lineHeight, immersive, focusMode, readingMode]);

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

  // Get raw article content or build rich fallback math content
  const rawContent = article.content || getFallbackContent(article.title);
  const paragraphs = rawContent.split("\n").filter((p: string) => p.trim().length > 0);

  // CSS mappings based on customized properties
  const themeClassMap = {
    default: "bg-[#050505] text-zinc-300 border-white/10",
    sepia: "bg-[#fbf6ec] text-[#433422] border-[#ebdcb9] selection:bg-amber-200/50",
    light: "bg-[#faf9f6] text-zinc-800 border-zinc-200 selection:bg-blue-100",
    charcoal: "bg-[#18181b] text-zinc-300 border-zinc-800 selection:bg-zinc-700/50"
  };

  const textThemeClassMap = {
    default: "text-zinc-300",
    sepia: "text-[#433422]",
    light: "text-zinc-700",
    charcoal: "text-zinc-300"
  };

  const titleThemeClassMap = {
    default: "text-white",
    sepia: "text-[#1e140a]",
    light: "text-zinc-900",
    charcoal: "text-white"
  };

  const fontSizeClassMap = {
    sm: "text-sm md:text-sm",
    base: "text-base md:text-base",
    lg: "text-lg md:text-lg",
    xl: "text-lg md:text-xl",
    "2xl": "text-xl md:text-2xl"
  };

  const fontFamilyClassMap = {
    sans: "font-sans",
    serif: "font-serif",
    mono: "font-mono"
  };

  const lineHeightClassMap = {
    normal: "leading-normal",
    relaxed: "leading-relaxed",
    loose: "leading-loose"
  };

  const widthClassMap = {
    narrow: "max-w-2xl",
    standard: "max-w-3xl",
    wide: "max-w-5xl"
  };

  // Custom Paragraph Renderer supporting Basic Markdown & Focus Mode
  const renderParagraph = (text: string, index: number) => {
    const trimmed = text.trim();
    if (!trimmed) return null;

    // Sub-heading Level 3 (###)
    if (trimmed.startsWith('### ')) {
      return (
        <h3 
          key={index} 
          className={`font-display font-bold mt-8 mb-4 ${
            theme === 'sepia' ? 'text-[#1e140a]' : theme === 'light' ? 'text-zinc-900' : 'text-white'
          } text-lg md:text-xl`}
        >
          {trimmed.replace('### ', '')}
        </h3>
      );
    }
    // Sub-heading Level 2 (##)
    if (trimmed.startsWith('## ')) {
      return (
        <h2 
          key={index} 
          className={`font-display font-bold mt-10 mb-5 border-b pb-2 ${
            theme === 'sepia' ? 'text-[#1e140a] border-[#ebdcb9]' : theme === 'light' ? 'text-zinc-900 border-zinc-200' : 'text-white border-white/10'
          } text-xl md:text-2xl`}
        >
          {trimmed.replace('## ', '')}
        </h2>
      );
    }
    // Main heading inside content (#)
    if (trimmed.startsWith('# ')) {
      return (
        <h1 
          key={index} 
          className={`font-display font-bold mt-12 mb-6 ${
            theme === 'sepia' ? 'text-[#1e140a]' : theme === 'light' ? 'text-zinc-900' : 'text-white'
          } text-2xl md:text-3xl`}
        >
          {trimmed.replace('# ', '')}
        </h1>
      );
    }

    // Bullet list points
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      return (
        <ul key={index} className="list-disc pl-6 space-y-2 my-4">
          <li className={textThemeClassMap[theme]}>{trimmed.substring(2)}</li>
        </ul>
      );
    }

    // Numbered list points
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(/^(\d+\.\s)(.*)/);
      return (
        <ol key={index} className="list-decimal pl-6 space-y-2 my-4">
          <li className={textThemeClassMap[theme]}>{match ? match[2] : trimmed}</li>
        </ol>
      );
    }

    // Blockquotes / Mathematical Theorems
    if (trimmed.startsWith('> ')) {
      return (
        <blockquote 
          key={index} 
          className={`border-l-4 pl-6 py-3 italic my-6 rounded-r-2xl ${
            theme === 'sepia' 
              ? 'border-amber-600 bg-amber-500/10 text-amber-900' 
              : theme === 'light' 
                ? 'border-blue-500 bg-blue-500/5 text-zinc-800' 
                : 'border-[var(--c-6-start)] bg-white/5 text-zinc-200'
          }`}
        >
          {trimmed.replace('> ', '')}
        </blockquote>
      );
    }

    // Handle normal paragraphs with optional paragraph-focus mode
    const isDimmed = focusMode && hoveredIndex !== null && hoveredIndex !== index;
    const isFocused = focusMode && hoveredIndex === index;

    return (
      <p 
        key={index} 
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        className={`transition-all duration-300 transform cursor-text ${
          isDimmed ? 'opacity-20 filter blur-[0.4px] scale-[0.99]' : 'opacity-100 scale-100'
        } ${
          isFocused 
            ? theme === 'sepia' 
              ? 'bg-amber-100/60 -mx-4 px-4 rounded-xl py-1.5 shadow-sm' 
              : theme === 'light' 
                ? 'bg-zinc-100/90 -mx-4 px-4 rounded-xl py-1.5 shadow-sm' 
                : 'bg-white/5 -mx-4 px-4 rounded-xl py-1.5 shadow-sm' 
            : ''
        }`}
      >
        {trimmed}
      </p>
    );
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 relative">
      
      {/* PERSISTENT FLOATING INITIATOR BUTTONS */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col space-y-3 md:space-y-4">
        <button
          onClick={toggleReadingMode}
          title={readingMode ? "Turn Off Reading Mode" : "Turn On Reading Mode"}
          className={`p-4 font-bold uppercase rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl cursor-pointer group ${
            readingMode 
              ? "bg-gradient-to-tr from-emerald-500 to-teal-500 text-black shadow-emerald-500/20"
              : "bg-gradient-to-tr from-amber-500 to-orange-500 text-black shadow-orange-500/20"
          }`}
        >
          <BookOpen className="h-6 w-6 group-hover:animate-pulse" />
        </button>
        <button
          onClick={() => {
            setImmersive(true);
          }}
          title="Open Immersive Reading Mode"
          className="p-4 bg-zinc-800 border border-white/10 text-white font-bold uppercase rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-xl shadow-black/40 cursor-pointer"
        >
          <Maximize2 className="h-6 w-6" />
        </button>
      </div>

      <div className="max-w-4xl mx-auto">
        
        {/* TOP LEVEL ROUTE NAV & IMMERSIVE ENTRANCE */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
          <Link 
            href="/articles"
            className="inline-flex items-center space-x-2 text-zinc-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            <span className="mono-label text-xs uppercase tracking-widest">Back to Articles</span>
          </Link>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={toggleReadingMode}
              className={`inline-flex items-center space-x-2.5 px-5 py-2.5 rounded-2xl transition-all duration-300 text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm ${
                readingMode 
                  ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-black border border-emerald-400/50 shadow-emerald-500/10"
                  : "bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/25 text-amber-300 hover:from-amber-500/25 hover:to-orange-500/25 hover:border-amber-500/50 shadow-amber-500/5"
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>{readingMode ? "Reading Mode: ON" : "Reading Mode: OFF"}</span>
            </button>

            <button
              onClick={() => {
                setImmersive(true);
              }}
              className="inline-flex items-center space-x-2.5 px-5 py-2.5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/25 text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 hover:border-amber-500/50 rounded-2xl transition-all duration-300 text-xs font-bold uppercase tracking-wider shadow-sm shadow-amber-500/5 cursor-pointer"
            >
              <Maximize2 className="h-3.5 w-3.5" />
              <span>Immersive Reading Mode</span>
            </button>
          </div>
        </div>

        {/* INLINE MATH READING SETTINGS ACCORDION */}
        <div className="mb-10 bg-white/5 border border-white/10 rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 text-zinc-300">
              <Sliders className="h-4 w-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-widest">Quick Reading Setup</span>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="text-xs text-zinc-400 hover:text-white transition-colors underline cursor-pointer"
            >
              {showSettings ? "Hide Settings" : "Show Settings"}
            </button>
          </div>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mt-4 pt-4 border-t border-white/5"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs text-zinc-400">
                  
                  {/* Font Sizes */}
                  <div className="space-y-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block">Font Size</span>
                    <div className="flex items-center space-x-1 bg-black/30 p-1 rounded-xl">
                      {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map((sz) => (
                        <button
                          key={sz}
                          onClick={() => setFontSize(sz)}
                          className={`flex-1 py-1 rounded-lg text-center uppercase font-bold transition-all text-[10px] cursor-pointer ${
                            fontSize === sz ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Themes */}
                  <div className="space-y-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block">Contrast Preset</span>
                    <div className="flex items-center space-x-1 bg-black/30 p-1 rounded-xl">
                      {(['default', 'sepia', 'light', 'charcoal'] as const).map((th) => (
                        <button
                          key={th}
                          onClick={() => setTheme(th)}
                          className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                            theme === th ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          {th}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fonts */}
                  <div className="space-y-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block">Font Family</span>
                    <div className="flex items-center space-x-1 bg-black/30 p-1 rounded-xl">
                      {(['sans', 'serif', 'mono'] as const).map((fam) => (
                        <button
                          key={fam}
                          onClick={() => setFontFamily(fam)}
                          className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                            fontFamily === fam ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          {fam}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Line Height */}
                  <div className="space-y-2">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-500 block">Line Spacing</span>
                    <div className="flex items-center space-x-1 bg-black/30 p-1 rounded-xl">
                      {(['normal', 'relaxed', 'loose'] as const).map((lh) => (
                        <button
                          key={lh}
                          onClick={() => setLineHeight(lh)}
                          className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                            lineHeight === lh ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-zinc-300'
                          }`}
                        >
                          {lh}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Reading Focus Mode */}
                  <div className="space-y-2 flex flex-col justify-end">
                    <div className="flex items-center justify-between bg-black/30 p-2.5 rounded-xl">
                      <div className="flex items-center space-x-2">
                        {focusMode ? <Eye className="h-4 w-4 text-amber-400" /> : <EyeOff className="h-4 w-4 text-zinc-500" />}
                        <span className="font-bold text-[10px] uppercase tracking-wider text-zinc-300 block">Paragraph Focus</span>
                      </div>
                      <button
                        onClick={() => setFocusMode(!focusMode)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                          focusMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/5 text-zinc-400 border border-white/5'
                        }`}
                      >
                        {focusMode ? "ON" : "OFF"}
                      </button>
                    </div>
                  </div>

                  {/* Informational Hint */}
                  <div className="text-[10px] leading-relaxed text-zinc-500 flex items-center bg-white/5 p-2 rounded-xl">
                    <Info className="h-4 w-4 text-amber-500/50 mr-2 flex-shrink-0" />
                    <span>Focus mode dims adjacent text blocks, isolating mathematical formulas for deep reading.</span>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* PRIMARY ARTICLE VIEWPORT OVERRIDES */}
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

          {/* RENDERING WRAPPER APPLYING ACTIVE THEMES IN-PLACE */}
          <div className={`prose max-w-none transition-all duration-300 p-8 rounded-3xl ${themeClassMap[theme]}`}>
            {article.pdfUrl && (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 text-center flex flex-col items-center mb-8">
                <BookOpen className="w-16 h-16 text-[var(--c-6-start)] mb-6" />
                <h3 className="text-2xl font-display text-white mb-4">Interactive PDF Document</h3>
                <p className="text-zinc-400 mb-8 max-w-md mx-auto">This article is available as a full-format PDF document. Below, you can explore the long-form text companion.</p>
                <a 
                  href={article.pdfUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-8 py-4 bg-[var(--c-6-start)] text-black font-bold uppercase tracking-widest text-xs rounded-full hover:bg-[var(--c-6-end)] transition-colors shadow-lg shadow-[var(--c-6-start)]/20 cursor-pointer"
                >
                  Open PDF in New Tab
                </a>
              </div>
            )}

            {/* TEXT ENGINE WITH ACTIVE STYLES */}
            <div className={`space-y-6 ${fontSizeClassMap[fontSize]} ${fontFamilyClassMap[fontFamily]} ${lineHeightClassMap[lineHeight]} ${widthClassMap[containerWidth]} mx-auto`}>
              {paragraphs.map((para: string, i: number) => renderParagraph(para, i))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ========================================================= */}
      {/* FULL-SCREEN IMMERSIVE DISTRACTION-FREE READING CANVAS     */}
      {/* ========================================================= */}
      <AnimatePresence>
        {immersive && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
            className={`fixed inset-0 z-50 overflow-hidden flex flex-col h-full w-full ${themeClassMap[theme]} transition-colors duration-300`}
          >
            
            {/* TOP PROGRESS BAR */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-white/5 z-50">
              <div 
                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>

            {/* STICKY MINIMALIST HEADER BAR */}
            <header className="w-full flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-inherit z-40 bg-inherit/90 backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setImmersive(false)}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-inherit text-xs uppercase font-bold tracking-wider hover:opacity-85 transition-opacity cursor-pointer`}
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Exit Immersive</span>
                </button>
                <div className="hidden md:flex flex-col max-w-sm">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-zinc-500">Reading Mode</span>
                  <span className="text-xs font-semibold truncate max-w-xs">{article.title}</span>
                </div>
              </div>

              {/* ACTION TOGGLES */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowCheatSheet(!showCheatSheet)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showCheatSheet 
                      ? 'bg-amber-500 text-black border-amber-500' 
                      : 'border-inherit hover:bg-white/5 text-inherit'
                  }`}
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                  <span>Math Helper</span>
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    showSettings 
                      ? 'bg-amber-500 text-black border-amber-500' 
                      : 'border-inherit hover:bg-white/5 text-inherit'
                  }`}
                >
                  <Sliders className="h-3.5 w-3.5" />
                  <span>Settings</span>
                </button>
              </div>
            </header>

            {/* EXPANDED SETTINGS DRAWER OVERLAY */}
            <AnimatePresence>
              {showSettings && (
                <motion.div 
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="w-full border-b border-inherit bg-inherit/95 backdrop-blur-lg px-6 py-6 z-30 shadow-lg"
                >
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2">
                        <Sliders className="h-4 w-4 text-amber-500" />
                        <h4 className="text-xs font-black uppercase tracking-widest text-inherit">Reader Customizations</h4>
                      </div>
                      <button 
                        onClick={() => setShowSettings(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-inherit cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 text-xs text-inherit">
                      
                      {/* Contrasts / Themes */}
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 block">Theme</span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {(['default', 'sepia', 'light', 'charcoal'] as const).map((th) => (
                            <button
                              key={th}
                              onClick={() => setTheme(th)}
                              className={`py-1.5 rounded-lg text-center capitalize font-semibold border transition-all text-[10px] cursor-pointer ${
                                theme === th 
                                  ? 'bg-amber-500 text-black border-amber-500 font-bold' 
                                  : 'border-zinc-500/20 hover:bg-white/5 text-inherit'
                              }`}
                            >
                              {th}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Sizes */}
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 block">Size</span>
                        <div className="flex items-center space-x-1 bg-zinc-500/10 p-1 rounded-xl">
                          {(['sm', 'base', 'lg', 'xl', '2xl'] as const).map((sz) => (
                            <button
                              key={sz}
                              onClick={() => setFontSize(sz)}
                              className={`flex-1 py-1 rounded-lg text-center uppercase font-bold transition-all text-[10px] cursor-pointer ${
                                fontSize === sz ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-inherit'
                              }`}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Font Families */}
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 block">Font</span>
                        <div className="flex items-center space-x-1 bg-zinc-500/10 p-1 rounded-xl">
                          {(['sans', 'serif', 'mono'] as const).map((fam) => (
                            <button
                              key={fam}
                              onClick={() => setFontFamily(fam)}
                              className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                                fontFamily === fam ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-inherit'
                              }`}
                            >
                              {fam}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Line Spacings */}
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 block">Line Height</span>
                        <div className="flex items-center space-x-1 bg-zinc-500/10 p-1 rounded-xl">
                          {(['normal', 'relaxed', 'loose'] as const).map((lh) => (
                            <button
                              key={lh}
                              onClick={() => setLineHeight(lh)}
                              className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                                lineHeight === lh ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-inherit'
                              }`}
                            >
                              {lh}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Container Width */}
                      <div className="space-y-2">
                        <span className="font-bold text-[10px] uppercase tracking-wider opacity-60 block">Width</span>
                        <div className="flex items-center space-x-1 bg-zinc-500/10 p-1 rounded-xl">
                          {(['narrow', 'standard', 'wide'] as const).map((wd) => (
                            <button
                              key={wd}
                              onClick={() => setContainerWidth(wd)}
                              className={`flex-1 py-1 rounded-lg text-center capitalize font-semibold transition-all text-[10px] cursor-pointer ${
                                containerWidth === wd ? 'bg-amber-500 text-black' : 'hover:bg-white/5 text-inherit'
                              }`}
                            >
                              {wd === 'narrow' ? 'Slim' : wd === 'standard' ? 'Mid' : 'Wide'}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    <div className="mt-4 pt-4 border-t border-zinc-500/10 flex items-center justify-between text-[11px] opacity-75">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setFocusMode(!focusMode)}
                          className={`px-3 py-1 rounded-lg font-bold uppercase transition-all cursor-pointer ${
                            focusMode ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-zinc-500/10 text-inherit border border-zinc-500/10'
                          }`}
                        >
                          Focus Mode: {focusMode ? "Enabled" : "Disabled"}
                        </button>
                        <span className="opacity-60 hidden sm:inline">| Highlights the active mathematical block and dims distractions.</span>
                      </div>
                      <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Shortcut: Press ESC to exit</span>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* IMMERSIVE MAIN WORKSPACE SPLIT (CONTENT + MATH CHEATSHEET) */}
            <div className="flex-1 w-full flex overflow-hidden relative">
              
              {/* READING SCROLL WORKSPACE */}
              <div 
                ref={scrollRef}
                onScroll={handleScroll}
                className="flex-1 h-full overflow-y-auto px-6 py-12 md:py-16 scroll-smooth"
              >
                <div className={`${widthClassMap[containerWidth]} mx-auto space-y-8 pb-32`}>
                  
                  {/* IMMERSIVE HEADER METADATA */}
                  <div className="space-y-4 border-b border-inherit pb-8 mb-12">
                    <span className="text-xs uppercase font-mono tracking-widest text-[var(--c-6-start)] bg-zinc-500/10 px-3 py-1.5 rounded-full inline-block">
                      {article.category}
                    </span>
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-tight tracking-tight">
                      {article.title}
                    </h1>
                    <div className="flex items-center space-x-4 text-xs opacity-60 font-medium">
                      <span>By <strong>{article.author}</strong></span>
                      <span>•</span>
                      <span>Published on {article.date}</span>
                    </div>
                  </div>

                  {/* PARAGRAPH ITERATOR */}
                  <div className={`${fontSizeClassMap[fontSize]} ${fontFamilyClassMap[fontFamily]} ${lineHeightClassMap[lineHeight]} text-inherit space-y-6 md:space-y-7`}>
                    {paragraphs.map((para: string, i: number) => renderParagraph(para, i))}
                  </div>

                </div>
              </div>

              {/* MATH NOTATIONS QUICK CHEATSHEET SLIDEOUT */}
              <AnimatePresence>
                {showCheatSheet && (
                  <motion.aside
                    initial={{ x: "100%", opacity: 0.9 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: "100%", opacity: 0.9 }}
                    className="w-full max-w-sm h-full border-l border-inherit bg-inherit/95 backdrop-blur-lg flex flex-col z-20 shadow-2xl absolute right-0 top-0 md:relative"
                  >
                    <div className="p-5 border-b border-inherit flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center space-x-2">
                        <HelpCircle className="h-5 w-5 text-amber-500" />
                        <h3 className="font-display font-bold text-sm uppercase tracking-widest text-inherit">Math Symbol Guide</h3>
                      </div>
                      <button
                        onClick={() => setShowCheatSheet(false)}
                        className="p-1 rounded-lg hover:bg-white/10 text-inherit cursor-pointer"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-5 space-y-6">
                      <p className="text-[11px] leading-relaxed opacity-75">
                        Quick-reference cheat sheet for mathematical notations and LaTeX commands used in Josephite Math publications.
                      </p>

                      {CHEAT_SHEET_CATEGORIES.map((cat, idx) => (
                        <div key={idx} className="space-y-3">
                          <h4 className="text-[11px] font-black uppercase tracking-widest text-amber-500/80 border-b border-inherit pb-1.5">
                            {cat.title}
                          </h4>
                          <div className="space-y-3">
                            {cat.items.map((item, itemIdx) => (
                              <div key={itemIdx} className="space-y-1.5 p-2.5 rounded-xl bg-zinc-500/5 hover:bg-zinc-500/10 transition-colors border border-inherit">
                                <div className="font-mono text-sm font-semibold select-all text-amber-600 dark:text-amber-400">
                                  ${item.sym}$
                                </div>
                                <div className="text-[10px] opacity-70 font-medium">
                                  {item.desc}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.aside>
                )}
              </AnimatePresence>

            </div>

          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default ArticleDetailView;
