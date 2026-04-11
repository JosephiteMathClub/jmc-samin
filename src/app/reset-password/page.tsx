"use client";
import React, { Suspense } from 'react';
import ResetPassword from "@/views/ResetPassword";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-zinc-400">Loading...</div>}>
      <ResetPassword />
    </Suspense>
  );
}
