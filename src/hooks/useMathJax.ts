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

    // Dynamic Script Injection: load script if not already added
    if (!(window as any).MathJaxScriptAdded && !document.getElementById("mathjax-dynamic-script")) {
      (window as any).MathJaxScriptAdded = true;
      const script = document.createElement("script");
      script.id = "mathjax-dynamic-script";
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      document.head.appendChild(script);
    }

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
      }, 200); // 200ms debounce to allow multi-element dynamic renders to pool together
    };

    // Run initial typesetting on activation
    runTypeset();

    // Setup highly optimized MutationObserver - no textContent reading to prevent layout thrashing
    const observer = new MutationObserver((mutations) => {
      let shouldTypeset = false;

      for (const mutation of mutations) {
        if (
          (mutation.type === "childList" && mutation.addedNodes.length > 0) ||
          mutation.type === "characterData"
        ) {
          shouldTypeset = true;
          break;
        }
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
