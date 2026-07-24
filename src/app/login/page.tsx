import React, { Suspense } from 'react';
import Auth from "@/views/Auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Member Login",
  description: "Sign in to the Josephite Math Club portal to track challenge points, register for SJS math events, and manage your student profile.",
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
