import React, { Suspense } from 'react';
import ForgotPassword from "@/views/ForgotPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reset Account Password",
  description: "Recover your Josephite Math Club account credentials safely.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <ForgotPassword />
    </Suspense>
  );
}
