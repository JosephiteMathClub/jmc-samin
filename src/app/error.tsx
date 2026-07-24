"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Router error occurred:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-transparent flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 glass-card p-12 border border-red-500/20 rounded-3xl">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>
        
        <div className="space-y-4">
          <h1 className="text-3xl font-sans font-bold text-white uppercase tracking-tighter">
            Something went wrong
          </h1>
          <p className="text-zinc-500 text-sm leading-relaxed">
            We encountered an unexpected error. This might be due to a connection issue or a temporary glitch.
          </p>
          {error && (
            <div className="p-4 bg-black/40 rounded-xl border border-white/5 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-red-400/80 break-all">
                {error.message || "An unexpected error occurred."}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 pt-4">
          <button
            onClick={() => reset()}
            className="w-full py-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="w-full py-4 rounded-xl bg-white/5 text-white font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
