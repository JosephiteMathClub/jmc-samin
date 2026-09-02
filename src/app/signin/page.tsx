import React, { Suspense } from 'react';
import Auth from "@/views/Auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In - Josephite Math Club",
  description: "Sign in to your Josephite Math Club account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <Auth />
    </Suspense>
  );
}
