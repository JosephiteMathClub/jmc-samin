"use client";
import React, { Suspense } from 'react';
import ForgotPassword from "@/views/ForgotPassword";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <ForgotPassword />
    </Suspense>
  );
}
