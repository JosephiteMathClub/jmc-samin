import React, { Suspense } from 'react';
import Auth from "@/views/Auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - Josephite Math Club",
  description: "Sign in or register for Josephite Math Club.",
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
