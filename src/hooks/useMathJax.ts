"use client";

import { useEffect } from "react";

/**
 * A custom React hook that utilizes the 'MutationObserver' API to monitor
 * changes inside a container (or the entire page/main content) and triggers
 * MathJax typeset updates asynchronously when new equations/text are injected.
 * 
 * @param ref An optional React ref of the container element to observe.
 * @param active Boolean flag to enable/disable the observer.
 */
export function useMathJax(ref?: React.RefObject<HTMLElement | null>, active = true) {
  useEffect(() => {
    if (typeof window === "undefined" || !active) return;

    let debounceTimer: any = null;

    const runTypeset = () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }

      debounceTimer = setTimeout(() => {
        const mj = (window as any).MathJax;
        if (mj && mj.typesetPromise) {
          const target = ref?.current || document.getElementById("main-content") || document.querySelector("main") || document.body;
          if (target) {
            mj.typesetPromise([target]).catch((err: any) => {
              console.warn("Dynamic MathJax observer rendering failed:", err);
            });
          }
        }
      }, 100); // Debounce to allow multiple DOM changes to settle
    };

    // Run initial typesetting on activation
    runTypeset();

    // Setup MutationObserver to watch DOM subtree additions
    const observer = new MutationObserver((mutations) => {
      let shouldTypeset = false;

      for (const mutation of mutations) {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          for (let i = 0; i < mutation.addedNodes.length; i++) {
            const node = mutation.addedNodes[i];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node as HTMLElement;
              const text = el.textContent || "";
              // Typical LaTeX indicators: $, \[, \(, \begin{
              if (text.includes("$") || text.includes("\\(") || text.includes("\\[") || text.includes("\\begin{")) {
                shouldTypeset = true;
                break;
              }
            } else if (node.nodeType === Node.TEXT_NODE) {
              const text = node.textContent || "";
              if (text.includes("$") || text.includes("\\(") || text.includes("\\[") || text.includes("\\begin{")) {
                shouldTypeset = true;
                break;
              }
            }
          }
        } else if (mutation.type === "characterData") {
          const text = mutation.target.textContent || "";
          if (text.includes("$") || text.includes("\\(") || text.includes("\\[") || text.includes("\\begin{")) {
            shouldTypeset = true;
          }
        }
        if (shouldTypeset) break;
      }

      if (shouldTypeset) {
        runTypeset();
      }
    });

    const targetNode = ref?.current || document.getElementById("main-content") || document.querySelector("main") || document.body;

    if (targetNode) {
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      observer.disconnect();
    };
  }, [ref, active]);
}
