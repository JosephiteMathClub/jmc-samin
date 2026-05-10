"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  UserCheck, 
  Database, 
  Shield, 
  Award, 
  Trash2, 
  Search, 
  Loader2, 
  ChevronRight,
  DatabaseZap,
  Activity,
  AlertCircle,
  Plus,
  ShieldAlert
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../context/ToastContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';
import { DashboardFormField } from './DashboardFormField';
import { SupportManagement } from './SupportManagement';

export const SuperAdminPanel = () => {
  const { showToast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'database' | 'positions' | 'support'>('users');
  
  // Database Explorer state
  const [tables] = useState<string[]>(['profiles', 'member', 'event_participation', 'site_content', 'support_tickets']);
  const [selectedTable, setSelectedTable] = useState('profiles');
  const [tableData, setTableData] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // Position Management state
  const [participations, setParticipations] = useState<any[]>([]);
  const [loadingParticipations, setLoadingParticipations] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('full_name');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchTableData = useCallback(async (tableName: string) => {
    setLoadingTable(true);
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(100);
      
      if (error) throw error;
      setTableData(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingTable(false);
    }
  }, [showToast]);

  const fetchParticipations = useCallback(async () => {
    setLoadingParticipations(true);
    try {
      const { data, error } = await supabase
        .from('event_participation')
        .select(`
          *,
          member (
            full_name
          )
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setParticipations(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoadingParticipations(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (activeSubTab === 'users') fetchUsers();
    if (activeSubTab === 'database') fetchTableData(selectedTable);
    if (activeSubTab === 'positions') fetchParticipations();
  }, [activeSubTab, selectedTable, fetchUsers, fetchTableData, fetchParticipations]);

  const updateUserRole = async (userId: string, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'member' : 'admin';
    setPromoting(userId);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
      showToast(`User role updated to ${newRole}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setPromoting(null);
    }
  };

  const updatePosition = async (participationId: string, position: string) => {
    try {
      const { error } = await supabase
        .from('event_participation')
        .update({ position: position })
        .eq('id', participationId);
      
      if (error) throw error;
      
      setParticipations(prev => prev.map(p => p.id === participationId ? { ...p, position } : p));
      showToast('Position updated', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const deleteRow = async (tableName: string, rowId: any) => {
    if (!window.confirm('Are you sure you want to delete this row? This action is irreversible.')) return;
    try {
      // Handle different ID types (id for UUID, or specific key for site_content)
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq(idKey, rowId);
      
      if (error) throw error;
      
      setTableData(prev => prev.filter(row => row[idKey] !== rowId));
      showToast('Row deleted successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const editRow = async (tableName: string, row: any) => {
    const field = window.prompt(`Enter column name to edit (Available: ${Object.keys(row).join(', ')}):`);
    if (!field || !row[field]) return;
    
    const newValue = window.prompt(`Enter new value for "${field}" (Current: ${row[field]}):`);
    if (newValue === null) return;

    try {
      const idKey = tableName === 'site_content' ? 'id' : 'id';
      const updates = { [field]: newValue };
      
      const { error } = await supabase
        .from(tableName)
        .update(updates)
        .eq(idKey, row[idKey]);
      
      if (error) throw error;
      
      setTableData(prev => prev.map(r => r[idKey] === row[idKey] ? { ...r, ...updates } : r));
      showToast('Row updated successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const addRow = async (tableName: string) => {
    const dataStr = window.prompt('Enter JSON object for new row (e.g. {"email": "test@example.com", "full_name": "Test User"}):');
    if (!dataStr) return;

    try {
      const data = JSON.parse(dataStr);
      const { error } = await supabase
        .from(tableName)
        .insert(data);
      
      if (error) throw error;
      
      fetchTableData(tableName);
      showToast('Row added successfully', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Sub-tabs header */}
      <div className="flex flex-wrap gap-4 p-1 bg-white/[0.03] border border-white/5 rounded-2xl w-fit">
        {[
          { id: 'users', label: 'Admin Management', icon: Shield },
          { id: 'positions', label: 'Event Positions', icon: Award },
          { id: 'support', label: 'Support Issues', icon: ShieldAlert },
          { id: 'database', label: 'Database Explorer', icon: DatabaseZap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === tab.id 
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20' 
                : 'text-zinc-500 hover:text-white hover:bg-white/5'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Admin Permissions" 
              description="Promote or demote users to normal admin roles."
              icon={Shield}
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
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">User</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Role</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={3} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[10px] font-bold text-zinc-500 uppercase">
                                {u.full_name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white mb-0.5">{u.full_name}</p>
                                <p className="text-[10px] text-zinc-600 font-mono">{u.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                              u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-500' :
                              u.role === 'admin' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-zinc-500/10 text-zinc-500'
                            }`}>
                               {/* Hardcode super admin for UI clarity if needed */}
                               {u.email === 'l47idkpro@gmail.com' ? 'SUPER ADMIN' : u.role}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             {/* Only allow modifying if not the specific super admin email */}
                            {u.email !== 'l47idkpro@gmail.com' ? (
                              <DashboardButton 
                                label={promoting === u.id ? "Updating..." : (u.role === 'admin' ? "Demote to Member" : "Promote to Admin")}
                                onClick={() => updateUserRole(u.id, u.role)}
                                disabled={promoting !== null}
                                variant={u.role === 'admin' ? 'secondary' : 'primary'}
                                className="h-8 text-[9px] px-3"
                                icon={promoting === u.id ? Loader2 : UserCheck}
                              />
                            ) : (
                              <span className="text-[9px] text-zinc-700 font-bold uppercase">Restricted</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'positions' && (
          <motion.div
            key="positions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Event Winners & Positions" 
              description="Assign titles, ranks, or positions to members who participated in events."
              icon={Award}
            >
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Member</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Event</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Category</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">Position</th>
                      <th className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Update</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingParticipations ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={5} className="py-4 px-6 h-16 bg-white/[0.01]" />
                        </tr>
                      ))
                    ) : participations.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-zinc-600 text-xs italic">No participation records found.</td>
                      </tr>
                    ) : (
                      participations.map((p) => (
                        <tr key={p.id} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          <td className="py-4 px-6">
                            <p className="text-xs font-bold text-white">{p.member?.full_name || 'Unknown'}</p>
                            <p className="text-[10px] text-zinc-600 font-mono">{p.member_id}</p>
                          </td>
                          <td className="py-4 px-6">
                            <p className="text-xs text-zinc-400">{p.event_name || 'Unknown'}</p>
                          </td>
                          <td className="py-4 px-6">
                            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">{p.category}</span>
                          </td>
                          <td className="py-4 px-6">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              p.position ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-500/10 text-zinc-500'
                            }`}>
                              {p.position || '—'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-2">
                               {['Champion', 'Runner Up', '3rd Place'].map(pos => (
                                 <button
                                   key={pos}
                                   onClick={() => updatePosition(p.id, pos)}
                                   className={`px-2 py-1 border rounded-lg text-[8px] font-bold transition-all uppercase ${
                                     p.position === pos 
                                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-500' 
                                      : 'bg-white/5 border-white/5 text-zinc-400 hover:text-white hover:border-amber-500/30'
                                   }`}
                                 >
                                   {pos}
                                 </button>
                               ))}
                               <input 
                                 type="text" 
                                 placeholder="Custom..."
                                 onKeyDown={(e) => {
                                   if (e.key === 'Enter') {
                                     updatePosition(p.id, (e.target as HTMLInputElement).value);
                                     (e.target as HTMLInputElement).value = '';
                                   }
                                 }}
                                 className="w-20 px-2 py-1 bg-white/5 border border-white/5 rounded-lg text-[8px] text-white outline-none focus:border-amber-500/30 transition-all"
                               />
                             </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </DashboardSection>
          </motion.div>
        )}

        {activeSubTab === 'support' && (
          <motion.div
            key="support"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <SupportManagement />
          </motion.div>
        )}

        {activeSubTab === 'database' && (
          <motion.div
            key="database"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <DashboardSection 
              title="Database Explorer" 
              description="Directly view and monitor database records. Critical operations only."
              icon={DatabaseZap}
              actions={
                <div className="flex items-center gap-3">
                  <DashboardButton 
                    label="Add Row" 
                    onClick={() => addRow(selectedTable)}
                    icon={Plus}
                    className="h-9 px-4 text-[10px]"
                    variant="secondary"
                  />
                  <select 
                    value={selectedTable}
                    onChange={(e) => setSelectedTable(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-bold text-white outline-none focus:border-amber-500/30 uppercase tracking-widest cursor-pointer"
                  >
                    {tables.map(t => <option key={t} value={t} className="bg-zinc-900">{t}</option>)}
                  </select>
                </div>
              }
            >
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-center gap-4 mb-6">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-500 font-medium leading-relaxed uppercase tracking-widest">
                  Direct database manipulation can cause site-wide instability. Any deletion here will affect live users.
                </p>
              </div>

              <div className="overflow-x-auto min-h-[400px]">
                {loadingTable ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                  </div>
                ) : (
                  <table className="w-full text-left border-collapse table-fixed">
                    <thead>
                      <tr className="border-b border-white/5">
                        {tableData.length > 0 && Object.keys(tableData[0]).slice(0, 6).map(key => (
                          <th key={key} className="py-4 px-6 text-[10px] uppercase tracking-widest text-zinc-500 font-black">{key}</th>
                        ))}
                        <th className="py-4 px-6 w-24 text-[10px] uppercase tracking-widest text-zinc-500 font-black text-right">Admin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((row, i) => (
                        <tr key={i} className="border-b border-white/5 group hover:bg-white/[0.01]">
                          {Object.entries(row).slice(0, 6).map(([key, val]: any, j) => (
                            <td key={j} className="py-4 px-6 overflow-hidden truncate whitespace-nowrap text-[10px] font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors" title={String(val)}>
                              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                            </td>
                          ))}
                          <td className="py-4 px-6 text-right">
                             <div className="flex justify-end gap-1">
                               <button 
                                 onClick={() => editRow(selectedTable, row)}
                                 className="p-2 text-zinc-600 hover:text-amber-500 transition-colors"
                                 title="Edit row"
                               >
                                 <Plus className="w-3.5 h-3.5 rotate-45" />
                               </button>
                               <button 
                                 onClick={() => deleteRow(selectedTable, row.id || row.email || row.member_id)}
                                 className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                                 title="Delete row"
                               >
                                 <Trash2 className="w-3.5 h-3.5" />
                               </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                      {tableData.length === 0 && (
                        <tr>
                          <td colSpan={7} className="py-20 text-center text-zinc-600 text-xs italic">Table is empty.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </DashboardSection>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
