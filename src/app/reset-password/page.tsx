import React, { Suspense } from 'react';
import ResetPassword from "@/views/ResetPassword";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Update Password",
  description: "Set a new password for your Josephite Math Club account.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
