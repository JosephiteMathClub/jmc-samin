"use client";
import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  Shield, 
  ShieldAlert, 
  Loader2, 
  Plus, 
  Trash2, 
  Search,
  UserPlus
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';
import { DashboardFormField } from './DashboardFormField';
import { usePerformance } from '../../hooks/usePerformance';

import { Skeleton } from '../Skeleton';

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  const [manualUid, setManualUid] = useState('');
  const [promoting, setPromoting] = useState(false);
  const [updatingUser, setUpdatingUser] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { shouldReduceGfx } = usePerformance();

  const fetchUsers = async () => {
    if (!isSupabaseConfigured) return;
    setLoading(false);
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (userId: string, currentRole: string) => {
    if (!isSupabaseConfigured) return;
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setUpdatingUser(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (error) {
      console.error("Error updating user role:", error);
      showToast("Failed to update user role.", 'error');
    } finally {
      setUpdatingUser(null);
    }
  };

  const handlePromoteByUid = async () => {
    if (!manualUid.trim() || !isSupabaseConfigured) return;
    setPromoting(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', manualUid.trim())
        .single();
      
      if (error || !data) {
        showToast("User with this ID does not exist in the database.", 'error');
        return;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', manualUid.trim());
      
      if (updateError) throw updateError;
      
      showToast(`User ${data.email || manualUid} has been promoted to Admin.`, 'success');
      setManualUid('');
      fetchUsers();
    } catch (error) {
      console.error("Error promoting user:", error);
      showToast("Failed to promote user.", 'error');
    } finally {
      setPromoting(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.id.includes(searchTerm)
  );

  return (
    <div className="space-y-12">
      <DashboardSection 
        title="Promote User" 
        description="Manually promote a user to administrator by their unique User ID (UID)."
        icon={UserPlus}
      >
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <DashboardFormField label="User UID" description="Paste the user's Supabase UID here">
              <input
                type="text"
                value={manualUid}
                onChange={(e) => setManualUid(e.target.value)}
                placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                className="w-full px-5 py-3.5 bg-black/20 border border-white/10 rounded-2xl text-white outline-none focus:border-amber-500/50 transition-all font-mono text-sm"
              />
            </DashboardFormField>
          </div>
          <DashboardButton 
            onClick={handlePromoteByUid}
            label={promoting ? "Promoting..." : "Promote to Admin"}
            disabled={promoting || !manualUid.trim()}
            icon={promoting ? Loader2 : Shield}
            className="h-[54px]"
          />
        </div>
      </DashboardSection>

      <DashboardSection 
        title="User Access Control" 
        description="Manage permissions and roles for all registered users."
        icon={UserCheck}
        actions={
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-6 py-2.5 bg-white/5 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-amber-500/30 transition-all w-64"
            />
          </div>
        }
      >
        <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/[0.01]">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">User</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">UID</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Role</th>
                  <th className="px-8 py-5 text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <tr key={i}>
                      <td className="px-8 py-6"><Skeleton className="h-10 w-48 rounded-full" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-8 py-6"><Skeleton className="h-6 w-20 rounded-full" /></td>
                      <td className="px-8 py-6 text-right"><Skeleton className="h-8 w-24 rounded-xl ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-zinc-500">
                      No users found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-500 group-hover:text-amber-500 transition-colors">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white">{user.full_name || 'Anonymous User'}</p>
                            <p className="text-xs text-zinc-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <code className="text-[10px] text-zinc-600 font-mono bg-black/40 px-2 py-1 rounded-md">{user.id}</code>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                          user.role === 'admin' 
                            ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                            : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                        }`}>
                          {user.role || 'member'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          onClick={() => toggleAdmin(user.id, user.role)}
                          disabled={updatingUser === user.id}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                            user.role === 'admin'
                              ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/10'
                              : 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/10'
                          }`}
                        >
                          {updatingUser === user.id ? (
                            <Loader2 className={`w-3 h-3 ${shouldReduceGfx ? '' : 'animate-spin'}`} />
                          ) : user.role === 'admin' ? (
                            'Revoke Admin'
                          ) : (
                            'Make Admin'
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-white/5">
            {loading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-8 w-full rounded-xl" />
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                No users found matching your search.
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="p-6 space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-zinc-900 flex items-center justify-center border border-white/5 text-zinc-500">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{user.full_name || 'Anonymous User'}</p>
                      <p className="text-xs text-zinc-500 truncate">{user.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Role</span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest inline-block ${
                        user.role === 'admin' 
                          ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                          : 'bg-zinc-500/10 text-zinc-500 border border-zinc-500/20'
                      }`}>
                        {user.role || 'member'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 items-end">
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Actions</span>
                      <button
                        onClick={() => toggleAdmin(user.id, user.role)}
                        disabled={updatingUser === user.id}
                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all ${
                          user.role === 'admin'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/10'
                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/10'
                        }`}
                      >
                        {updatingUser === user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : user.role === 'admin' ? (
                          'Revoke'
                        ) : (
                          'Promote'
                        )}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest block mb-1">User ID</span>
                    <code className="text-[10px] text-zinc-500 font-mono bg-black/40 px-2 py-1 rounded w-full block truncate border border-white/5">
                      {user.id}
                    </code>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </DashboardSection>
    </div>
  );
};
