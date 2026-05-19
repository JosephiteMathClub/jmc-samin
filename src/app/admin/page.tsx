"use client";
import dynamic from 'next/dynamic';
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import { redirect } from 'next/navigation';

const AdminDashboard = dynamic(() => import("@/views/AdminDashboard"), {
  loading: () => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#050505] gap-4">
      <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
      <span className="text-xs font-mono font-bold text-amber-500/60 uppercase tracking-[0.2em]">Assembling Terminal...</span>
    </div>
  ),
  ssr: false
});

export default function Page() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!user || !isAdmin) {
    redirect('/login');
    return null;
  }

  return <AdminDashboard />;
}
