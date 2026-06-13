"use client";

import React, { useEffect, useRef, useState } from "react";

interface MathJaxNodeProps {
  content: string;
  inline?: boolean;
  className?: string;
  id?: string;
}

export const useMathJaxTypeset = (
  containerRef: React.RefObject<HTMLElement | null>,
  content: string,
  mathjaxReady: boolean,
  prepareMathContent: (text: string) => string
) => {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const container = containerRef.current;
    if (!container) return;

    // Synchronously set container text to raw unformatted LaTeX so MathJax starts fresh
    const processed = prepareMathContent(content);
    container.textContent = processed || "";

    if (!mathjaxReady) return;

    let isObsolete = false;

    // Small debounce to allow React DOM mutations to settle and prevent overlapping typeset runs
    const timer = setTimeout(() => {
      if (isObsolete) return;

      const mj = (window as any).MathJax;
      if (mj && mj.typesetPromise) {
        try {
          if (mj.typesetClear) {
            mj.typesetClear([container]);
          }

          mj.typesetPromise([container])
            .then(() => {
              if (isObsolete) return;

              // Self-healing check:
              // If raw indicators like $ or \ are still visual, and no MathJax elements got injected,
              // it means the render got skipped or was interrupted. Trigger an immediate fallback typeset.
              const html = container.innerHTML || "";
              const hasRawLaTeX = html.includes("$") || html.includes("\\(") || html.includes("\\[") || (html.includes("\\") && !html.includes("mjx-"));
              const hasMjx = html.includes("mjx-") || html.includes("MathJax");

              if (hasRawLaTeX && !hasMjx) {
                console.log("[MathJax] Self-healing typesetting triggered");
                setTimeout(() => {
                  if (!isObsolete && mj.typesetPromise) {
                    mj.typesetClear?.([container]);
                    mj.typesetPromise([container]);
                  }
                }, 100);
              }
            })
            .catch((err: any) => {
              console.warn("MathJax typeset Promise failed in hook:", err);
            });
        } catch (err) {
          console.warn("MathJax typesetting call failed in hook:", err);
        }
      }
    }, 40);

    return () => {
      isObsolete = true;
      clearTimeout(timer);
    };
  }, [content, mathjaxReady, containerRef, prepareMathContent]);
};

export const MathJaxNode: React.FC<MathJaxNodeProps> = ({
  content,
  inline = false,
  className = "",
  id
}) => {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);
  const [mathjaxReady, setMathjaxReady] = useState(false);

  // Poll for MathJax availability if it's not ready yet on page load
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
      setMathjaxReady(true);
      return;
    }

    const interval = setInterval(() => {
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        setMathjaxReady(true);
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Formats and prepends/appends delimiters if they are missing
  const prepareMathContent = React.useCallback((contentStr: string): string => {
    if (!contentStr) return "";
    const trimmed = contentStr.trim();
    if (!trimmed) return "";

    // If already contains any math delimiters, let MathJax handle it as-is
    const hasDelimiters = 
      contentStr.includes("$") || 
      contentStr.includes("\\(") || 
      contentStr.includes("\\[") || 
      contentStr.includes("\\begin{") || 
      contentStr.includes("$$");
      
    if (hasDelimiters) {
      return contentStr;
    }

    // If there are no delimiters, but there are backslashes
    if (contentStr.includes("\\")) {
      // 1. If it starts with backslash, OR has mostly math and very few plain English words,
      // wrap the entire thing in math delimiters.
      // We count english-like words of length >= 4 that do not start with a backslash
      const plainWords = trimmed.split(/[^a-zA-Z]+/).filter(w => {
        if (w.length < 4) return false;
        const idx = trimmed.indexOf(w);
        if (idx > 0 && trimmed[idx - 1] === '\\') return false;
        return true;
      });

      if (trimmed.startsWith("\\") || plainWords.length <= 1) {
        return `$${trimmed}$`;
      }

      // 2. Otherwise, find individual LaTeX commands and wrap them in $.
      return trimmed.replace(
        /(\\[a-zA-Z]+(?:\{[^{}]*\}|_[a-zA-Z0-9]+|\^[a-zA-Z0-9]+)*)/g,
        "$$$1$"
      );
    }

    return contentStr;
  }, []);

  // Apply our custom robust typeset hook
  useMathJaxTypeset(containerRef, content, mathjaxReady, prepareMathContent);

  if (inline) {
    return (
      <span
        ref={containerRef as React.RefObject<HTMLSpanElement>}
        className={className}
        id={id}
      />
    );
  }

  return (
    <div
      ref={containerRef as React.RefObject<HTMLDivElement>}
      className={`${className} whitespace-pre-wrap`}
      id={id}
    />
  );
};
