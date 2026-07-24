"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-black text-white flex items-center justify-center p-6 text-center">
        <div className="max-w-md w-full space-y-8 p-12 border border-red-500/20 bg-zinc-950 rounded-3xl">
          <h1 className="text-3xl font-bold uppercase tracking-tighter">System Error</h1>
          <p className="text-zinc-500 text-sm">
            A critical system error occurred. Please try again.
          </p>
          {error && (
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-red-400/80 break-all">
                {error.message || "A fatal error occurred inside the root layout."}
              </p>
            </div>
          )}
          <button
            onClick={() => reset()}
            className="w-full py-4 bg-white text-black font-bold rounded-xl hover:bg-white/95 transition-all uppercase text-xs tracking-widest cursor-pointer"
          >
            Reset Application
          </button>
        </div>
      </body>
    </html>
  );
}
