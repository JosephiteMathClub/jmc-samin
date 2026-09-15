"use client";
import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import { redirect } from 'next/navigation';
import Link from 'next/link';

const AdminDashboard = dynamic(() => import("@/views/AdminDashboard"), {
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
      <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
      <span className="text-xs font-mono font-bold text-purple-500/60 uppercase tracking-[0.2em]">Loading Super Admin Dashboard...</span>
    </div>
  ),
  ssr: false
});

export default function SuperAdminPage() {
  const { user, isAdmin, isSuperAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
        <Loader2 className="w-10 h-10 text-purple-500 animate-spin" />
        <span className="text-xs font-mono font-bold text-purple-500/60 uppercase tracking-[0.2em]">Verifying Root Credentials...</span>
      </div>
    );
  }

  if (!user || !isAdmin) {
    redirect('/login');
    return null;
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full p-8 lg:p-12 rounded-3xl bg-zinc-950/90 border border-purple-500/20 backdrop-blur-2xl text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-center mx-auto text-purple-400">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold uppercase tracking-[0.25em] text-purple-400 bg-purple-500/10 border border-purple-500/20 px-3 py-1 rounded-full inline-block mb-3">
              Root Access Only
            </span>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Super Admin Access Denied</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Only verified Super Administrators have access to the Super Admin dashboard. Your account is not authorized.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <Link
              href="/admin/events"
              className="px-6 py-3 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest text-center hover:bg-amber-400 transition-colors"
            >
              Back to Admin Dashboard
            </Link>
            <Link
              href="/"
              className="px-6 py-3 rounded-xl bg-white/5 text-zinc-300 font-bold text-xs uppercase tracking-widest text-center hover:bg-white/10 transition-colors"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard initialSection="super_admin" />;
}
