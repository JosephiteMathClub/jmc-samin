"use client";

import React, { useEffect, useRef } from "react";

interface MathJaxNodeProps {
  content: string;
  inline?: boolean;
  className?: string;
  id?: string;
}

export const MathJaxNode: React.FC<MathJaxNodeProps> = ({
  content,
  inline = false,
  className = "",
  id
}) => {
  const containerRef = useRef<HTMLDivElement | HTMLSpanElement>(null);

  useEffect(() => {
    const typeset = async () => {
      if (typeof window !== "undefined" && (window as any).MathJax) {
        const mj = (window as any).MathJax;
        if (containerRef.current && mj.typesetPromise) {
          try {
            if (mj.typesetClear) {
              mj.typesetClear([containerRef.current]);
            }
            await mj.typesetPromise([containerRef.current]);
          } catch (err) {
            console.warn("MathJax formatting error:", err);
          }
        }
      }
    };

    typeset();
  }, [content]);

  if (inline) {
    return (
      <span ref={containerRef as React.RefObject<HTMLSpanElement>} className={className} id={id}>
        {content}
      </span>
    );
  }

  return (
    <div ref={containerRef as React.RefObject<HTMLDivElement>} className={`${className} whitespace-pre-wrap`} id={id}>
      {content}
    </div>
  );
};
