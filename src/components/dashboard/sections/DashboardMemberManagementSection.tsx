"use client";
import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Trash2, 
  Plus, 
  Search, 
  Award, 
  Loader2, 
  AlertCircle, 
  User as UserIcon, 
  Camera,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { DashboardSection } from '../DashboardSection';
import { DashboardButton } from '../DashboardButton';
import Image from 'next/image';
import { resolveImageUrl } from '../../../lib/utils';
import ConfirmModal from '../../ConfirmModal';

interface DashboardMemberManagementSectionProps {
  members: any[];
  loadingMembers: boolean;
  memberError: string | null;
  fetchMembers: () => Promise<void>;
  toggleVerified: (memberId: string, currentStatus: string) => Promise<void>;
  deleteMember: (member: any) => Promise<void>;
  addMember: (memberData: { full_name: string, class: string, section: string, roll: string }) => Promise<any>;
  handleMemberPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>, memberId: string) => Promise<void>;
  uploading: string | null;
  shouldReduceGfx: boolean;
  isDeletingMember: boolean;
}

const DashboardMemberManagementSectionComponent: React.FC<DashboardMemberManagementSectionProps> = ({
  members,
  loadingMembers,
  memberError,
  fetchMembers,
  toggleVerified,
  deleteMember,
  addMember,
  handleMemberPhotoUpload,
  uploading,
  shouldReduceGfx,
  isDeletingMember
}) => {
  const [memberSearch, setMemberSearch] = useState('');
  const [memberFilter, setMemberFilter] = useState('yes'); // Default to 'yes' as per request
  const [memberToDelete, setMemberToDelete] = useState<any | null>(null);
  const [isManualAddOpen, setIsManualAddOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    full_name: '',
    class: '',
    section: '',
    roll: ''
  });

  const handleManualAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const data = await addMember(formData);
      setSuccessData(data);
      setFormData({ full_name: '', class: '', section: '', roll: '' });
      // Don't close immediately, show success first
    } catch (err) {
      // Error handled by addMember toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const name = m.full_name || '';
      const email = m.email_address || m.email || '';
      const id = m.member_id || '';
      
      const matchesSearch = name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                          email.toLowerCase().includes(memberSearch.toLowerCase()) ||
                          id.toLowerCase().includes(memberSearch.toLowerCase());
      const matchesFilter = memberFilter === 'all' || m.verified === memberFilter;
      return matchesSearch && matchesFilter;
    });
  }, [members, memberSearch, memberFilter]);

  return (
    <motion.div
      key="members"
      initial={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: 20 }}
      animate={shouldReduceGfx ? { opacity: 1 } : { opacity: 1, x: 0 }}
      exit={shouldReduceGfx ? { opacity: 0 } : { opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <DashboardSection 
        icon={Plus} 
        title="Add New Member" 
        description="Manually register a member and verify their payment automatically."
      >
        <div className="space-y-6">
          {!isManualAddOpen ? (
            <button 
              onClick={() => {
                setIsManualAddOpen(true);
                setSuccessData(null);
              }}
              className="w-full py-12 border-2 border-dashed border-white/10 rounded-3xl text-zinc-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-black transition-all">
                <Plus className="w-5 h-5" />
              </div>
              Start Manual Registration
            </button>
          ) : (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 rounded-3xl bg-white/[0.02] border border-white/5 space-y-8"
            >
              {successData ? (
                <div className="text-center space-y-6 py-6 font-display">
                  <div className="w-20 h-20 bg-green-500/20 border border-green-500/20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-10 h-10 text-green-500" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-2xl font-bold text-white uppercase tracking-tight">Registration Approved</h4>
                    <p className="text-zinc-500 text-sm">Member has been added and verified.</p>
                  </div>
                  <div className="p-6 bg-amber-500/10 border border-amber-500/20 rounded-2xl inline-block min-w-[300px]">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-2">Unique Member ID</span>
                    <span className="text-3xl font-mono font-bold text-white tracking-[0.2em]">{successData.member_id}</span>
                  </div>
                  <div className="flex justify-center gap-4">
                    <button 
                      onClick={() => setSuccessData(null)}
                      className="px-8 py-4 rounded-xl bg-amber-500 text-black font-bold text-xs uppercase tracking-widest hover:bg-amber-400 transition-all"
                    >
                      Add Another
                    </button>
                    <button 
                      onClick={() => setIsManualAddOpen(false)}
                      className="px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Close Form
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleManualAdd} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Full Name</label>
                      <input 
                        type="text"
                        required
                        value={formData.full_name}
                        onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                        placeholder="ENTER NAME"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Class</label>
                      <input 
                        type="text"
                        required
                        value={formData.class}
                        onChange={(e) => setFormData({...formData, class: e.target.value})}
                        placeholder="e.g. 10"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Section</label>
                      <input 
                        type="text"
                        required
                        value={formData.section}
                        onChange={(e) => setFormData({...formData, section: e.target.value})}
                        placeholder="e.g. A"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">Roll</label>
                      <input 
                        type="text"
                        required
                        value={formData.roll}
                        onChange={(e) => setFormData({...formData, roll: e.target.value})}
                        placeholder="e.g. 42"
                        className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white font-bold text-xs"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-4 pt-4 border-t border-white/5">
                    <button 
                      type="button"
                      onClick={() => setIsManualAddOpen(false)}
                      className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isSubmitting}
                      className="px-10 py-3 rounded-xl bg-amber-500 text-black font-bold text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                      Register & Verify
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          )}
        </div>
      </DashboardSection>

      <DashboardSection 
        icon={Award} 
        title="Member Management" 
        description="Verify member registrations and manage payment statuses."
      >
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search by name or email..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-amber-500/50 transition-all text-white text-xs font-bold uppercase tracking-widest"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
              {['all', 'yes', 'no'].map((status) => (
                <button
                  key={status}
                  onClick={() => setMemberFilter(status)}
                  className={`px-4 py-2.5 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest whitespace-nowrap ${
                    memberFilter === status 
                      ? 'bg-amber-500 border-amber-500 text-black' 
                      : 'bg-white/5 border-white/10 text-zinc-400 hover:border-white/20'
                  }`}
                >
                  {status === 'all' ? 'All' : status === 'yes' ? 'Verified' : 'Pending'}
                </button>
              ))}
              <button 
                onClick={fetchMembers}
                disabled={loadingMembers}
                className="p-2.5 text-amber-500 hover:bg-amber-500/10 border border-white/10 rounded-xl transition-all"
              >
                <Loader2 className={`w-4 h-4 ${loadingMembers ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {memberError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              <span>Error: {memberError}</span>
              <button 
                onClick={fetchMembers}
                className="ml-auto underline hover:text-red-400"
              >
                Retry
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.01]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Unique ID</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Name</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Class/Section</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Roll</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">Payment</th>
                  <th className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredMembers.map((m) => (
                  <tr key={m.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-mono font-bold text-amber-500">{m.member_id || 'PENDING'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative group/avatar">
                            {m.photo_url ? (
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-white/10 flex-shrink-0 relative">
                                <Image 
                                  src={resolveImageUrl(m.photo_url)} 
                                  alt="" 
                                  fill 
                                  className="object-cover" 
                                  unoptimized={!m.photo_url?.startsWith('http') && !m.photo_url?.startsWith('/uploads/')}
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                <UserIcon className="w-4 h-4 text-zinc-500" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white">{m.full_name}</span>
                            <span className="text-[9px] text-zinc-500">{m.email_address || m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{m.class} / {m.section || '-'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-[10px] font-mono text-zinc-400">{m.roll}</span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${m.verified === 'yes' ? 'text-green-500' : 'text-amber-500'}`}>
                            {m.verified === 'yes' ? 'Confirmed' : 'Pending'}
                          </span>
                          <span className="text-[8px] text-zinc-600 uppercase tracking-tighter">{m.payment_method}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2 text-right">
                          <button
                            onClick={() => toggleVerified(m.id, m.verified)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all ${
                              m.verified === 'yes'
                                ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                            }`}
                          >
                            {m.verified === 'yes' ? 'Unverify' : 'Verify'}
                          </button>
                          <button
                            onClick={() => setMemberToDelete(m)}
                            className="p-1.5 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20 transition-all opacity-40 hover:opacity-100"
                            title="Delete Member From Database"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                {filteredMembers.length === 0 && !loadingMembers && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-600 italic text-xs">
                      No members found matching your criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </DashboardSection>

      <ConfirmModal
        isOpen={!!memberToDelete}
        title="Delete Registered Member"
        message={`Are you sure you want to delete ${memberToDelete?.full_name}? This will permanently remove them from the database and clear their participation history.`}
        onConfirm={async () => {
          if (memberToDelete) {
            await deleteMember(memberToDelete);
            setMemberToDelete(null);
          }
        }}
        onCancel={() => !isDeletingMember && setMemberToDelete(null)}
        confirmLabel={isDeletingMember ? "Deleting..." : "Delete Permanently"}
        type="danger"
        disabled={isDeletingMember}
      />
    </motion.div>
  );
};

export const DashboardMemberManagementSection = React.memo(DashboardMemberManagementSectionComponent);
DashboardMemberManagementSection.displayName = 'DashboardMemberManagementSection';
