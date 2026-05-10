'use client'

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  ShieldAlert, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Bug,
  User,
  ChevronRight,
  Terminal,
  Send,
  Loader2,
  Search,
  Filter,
  RefreshCcw as HistoryIcon
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';

export const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { showToast } = useToast();

  const fetchTickets = React.useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTickets(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || (!reply.trim() && selectedTicket.status === 'resolved')) return;

    setIsReplying(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({
          admin_reply: reply,
          status: 'resolved', // Auto-resolve on reply for simplicity, or we could have a toggle
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedTicket.id);

      if (error) throw error;

      showToast('Reply sent and ticket resolved', 'success');
      setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, admin_reply: reply, status: 'resolved' } : t));
      setSelectedTicket({ ...selectedTicket, admin_reply: reply, status: 'resolved' });
      setReply('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsReplying(false);
    }
  };

  const updateStatus = async (ticketId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('support_tickets')
        .update({ status })
        .eq('id', ticketId);

      if (error) throw error;
      setTickets(tickets.map(t => t.id === ticketId ? { ...t, status } : t));
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status });
      }
      showToast(`Status updated to ${status}`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredTickets = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter;
    const matchesSearch = t.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.user_email?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertCircle className="w-4 h-4 text-amber-500" />;
      case 'resolved': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Tickets List */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search tickets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/30 transition-all"
              />
            </div>
            <div className="flex gap-2">
              <select 
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="flex-grow bg-white/[0.03] border border-white/5 rounded-xl px-4 py-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest focus:outline-none focus:border-amber-500/30 cursor-pointer"
              >
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="resolved">Resolved</option>
              </select>
              <DashboardButton 
                onClick={fetchTickets}
                label=""
                icon={HistoryIcon}
                className="px-4 h-[46px]"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-zinc-600">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest leading-none">Scanning Database...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-20 text-center border border-dashed border-white/5 rounded-3xl text-zinc-600 italic text-xs">
                No tickets found.
              </div>
            ) : (
              filteredTickets.map(ticket => (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedTicket?.id === ticket.id 
                    ? 'bg-amber-500/10 border-amber-500/30' 
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <span className={`text-[8px] font-black uppercase tracking-widest ${
                        ticket.status === 'open' ? 'text-amber-500' : 
                        ticket.status === 'resolved' ? 'text-emerald-500' : 
                        'text-zinc-500'
                      }`}>
                        {ticket.status}
                      </span>
                    </div>
                    <span className="text-[8px] text-zinc-600 font-mono">
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-white mb-1 truncate">{ticket.subject}</h4>
                  <p className="text-[10px] text-zinc-500 line-clamp-1">{ticket.user_name}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="lg:col-span-8">
          {selectedTicket ? (
            <DashboardSection
              title="Ticket Details"
              description={`Viewing ticket from ${selectedTicket.user_name}`}
              icon={ShieldAlert}
              actions={
                <div className="flex gap-2">
                   <select 
                    value={selectedTicket.status}
                    onChange={(e) => updateStatus(selectedTicket.id, e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-[8px] font-bold text-white uppercase tracking-widest focus:outline-none focus:border-amber-500/30 cursor-pointer"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                  </select>
                </div>
              }
            >
              <div className="space-y-8">
                {/* User Info */}
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="p-3 bg-zinc-800 rounded-xl">
                    <User className="w-5 h-5 text-zinc-400" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white">{selectedTicket.user_name}</h5>
                    <p className="text-[10px] text-zinc-500 font-mono">{selectedTicket.user_email}</p>
                  </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Problem Description</h6>
                  <div className="p-6 bg-white/[0.03] border border-white/5 rounded-3xl text-sm text-zinc-300 leading-relaxed italic">
                    "{selectedTicket.message}"
                  </div>
                </div>

                {/* Technical Context */}
                {selectedTicket.error_context && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-red-400/80">
                      <Bug className="w-4 h-4" />
                      <h6 className="text-[10px] font-black uppercase tracking-widest">Automatic Error Log</h6>
                    </div>
                    <div className="p-6 bg-black/40 border border-red-500/10 rounded-3xl space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Error Type</span>
                          <p className="text-[10px] text-red-400 font-mono">{selectedTicket.error_context.type || 'Runtime Error'}</p>
                        </div>
                        <div className="space-y-1">
                          <span className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Timestamp</span>
                          <p className="text-[10px] text-zinc-400 font-mono">{new Date(selectedTicket.error_context.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] text-zinc-600 uppercase font-black tracking-tighter">Location</span>
                        <p className="text-[10px] text-zinc-400 font-mono truncate">{selectedTicket.error_context.url}</p>
                      </div>
                      <div className="space-y-2">
                         <div className="flex items-center gap-2 py-0.5 px-2 bg-zinc-800 rounded-md w-fit">
                            <Terminal className="w-3 h-3 text-zinc-500" />
                            <span className="text-[8px] text-zinc-500 font-mono uppercase">Full Trace Breakdown</span>
                         </div>
                         <pre className="text-[9px] text-zinc-500 font-mono bg-black/40 p-4 rounded-xl overflow-x-auto max-h-60 scrollbar-thin border border-white/[0.02]">
                           {selectedTicket.error_context.error}
                         </pre>
                      </div>
                    </div>
                  </div>
                )}

                {/* Reply Section */}
                <div className="pt-8 border-t border-white/5 space-y-4">
                   <div className="flex items-center gap-2 text-amber-500">
                    <MessageSquare className="w-4 h-4" />
                    <h6 className="text-[10px] font-black uppercase tracking-widest">Admin's Response</h6>
                  </div>

                  {selectedTicket.admin_reply ? (
                    <div className="p-6 bg-zinc-800/50 border border-amber-500/20 rounded-3xl">
                      <p className="text-sm text-amber-500/80">{selectedTicket.admin_reply}</p>
                      <div className="mt-4 flex justify-end">
                        <DashboardButton 
                          label="Edit Reply"
                          onClick={() => {
                            setReply(selectedTicket.admin_reply);
                            setSelectedTicket({ ...selectedTicket, admin_reply: null });
                          }}
                          className="h-8 text-[9px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleReply} className="space-y-4">
                      <textarea
                        required
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your response to the member..."
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl p-4 py-3 h-32 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/20 transition-all resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          disabled={isReplying || !reply.trim()}
                          className="px-8 py-3 bg-amber-500 text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-400 transition-all flex items-center gap-2 group disabled:opacity-50"
                        >
                          {isReplying ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Send className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                              Send & Resolve
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              </div>
            </DashboardSection>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-20 border-2 border-dashed border-white/5 rounded-[3rem] text-zinc-700 bg-white/[0.01]">
              <MessageSquare className="w-16 h-16 mb-6 opacity-20" />
              <h4 className="text-lg font-bold mb-2">No Ticket Selected</h4>
              <p className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-800">Select a support ticket from the side to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
