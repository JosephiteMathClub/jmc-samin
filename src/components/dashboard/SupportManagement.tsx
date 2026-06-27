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
  RefreshCcw as HistoryIcon,
  Award,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { DashboardSection } from './DashboardSection';
import { DashboardButton } from './DashboardButton';

const REPLY_TEMPLATES = [
  {
    id: 'president',
    name: 'Presidential Resolution',
    title: 'President, Executive Committee',
    designation: 'President, Executive Committee',
    body: (userName: string, issueSubject: string) => `Dear ${userName},

Thank you for contacting the Josephite Math Club Tech Support desk. We are pleased to inform you that the issue regarding "${issueSubject}" has been successfully investigated and resolved by our technical division.

Our technical operations team identified the root cause of the error you described and has successfully deployed a permanent patch. All systems are now fully operational, and you should be able to resume using the platform normally.

St. Joseph Higher Secondary School and the Josephite Math Club hold ourselves to the highest standards of digital excellence. Your proactive report was instrumental in helping us ensure a seamless experience for all students. We thank you for your vigilance.

If you continue to experience any technical friction, please let us know immediately.`
  },
  {
    id: 'tech_secretary',
    name: 'Technical Fix Notice',
    title: 'Tech & IT Secretary, Executive Committee',
    designation: 'Tech & IT Secretary, Executive Committee',
    body: (userName: string, issueSubject: string) => `Dear ${userName},

I am writing to provide a technical update regarding the "${issueSubject}" ticket you submitted. The bug has been successfully resolved.

We analyzed the system logs and runtime trace you provided. The anomalous behavior has been corrected, and a server-side patch has been deployed. Please clear your browser cache and refresh the platform to ensure the updates are fully synchronized.

If you encounter any further technical friction or have suggestions for our digital infrastructure, please let me know. Thank you for supporting the technical operations of the Josephite Math Club.`
  },
  {
    id: 'general_secretary',
    name: 'Official Admin Response',
    title: 'General Secretary, Executive Committee',
    designation: 'General Secretary, Executive Committee',
    body: (userName: string, issueSubject: string) => `Dear ${userName},

On behalf of the Executive Committee of the Josephite Math Club, I would like to express our gratitude for your report on "${issueSubject}". This is to officially confirm that the problem has been fully resolved.

Our team has addressed the disruption to ensure that your participation in the upcoming events and club activities is unimpeded. 

Thank you for being an active and valued member of our math community. We wish you the very best of luck in your upcoming challenges!`
  }
];

export const SupportManagement: React.FC = () => {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [reply, setReply] = useState('');
  const [isReplying, setIsReplying] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDesignation, setSelectedDesignation] = useState('President, Executive Committee');
  const [customAdminName, setCustomAdminName] = useState('');
  
  const { showToast } = useToast();
  const { user } = useAuth();

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
      const response = await fetch('/api/support/reply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          userEmail: selectedTicket.user_email,
          userName: selectedTicket.user_name,
          subject: selectedTicket.subject,
          originalMessage: selectedTicket.message,
          replyMessage: reply,
          adminName: customAdminName.trim() || user?.user_metadata?.full_name || 'Josephite Math Club Executive Committee',
          designation: selectedDesignation
        })
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to dispatch resolution email');
      }

      if (resData.warning) {
        showToast(resData.warning, 'info');
      } else {
        showToast('Official response sent and ticket resolved!', 'success');
      }

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
                <div className="pt-8 border-t border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-amber-500">
                      <MessageSquare className="w-4 h-4" />
                      <h6 className="text-[10px] font-black uppercase tracking-widest">Official Resolution Desk</h6>
                    </div>
                    <span className="text-[9px] bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">
                      Executive Actions
                    </span>
                  </div>

                  {selectedTicket.admin_reply ? (
                    <div className="p-6 bg-zinc-800/50 border border-amber-500/20 rounded-3xl space-y-3">
                      <div className="flex items-center gap-1.5 text-xs text-amber-500/80 font-bold">
                        <Award className="w-4 h-4" />
                        <span>This issue has been formally resolved. Sent response:</span>
                      </div>
                      <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-black/20 p-4 rounded-xl border border-white/5">{selectedTicket.admin_reply}</p>
                      <div className="flex justify-end pt-1">
                        <DashboardButton 
                          label="Formulate New Reply"
                          onClick={() => {
                            setReply(selectedTicket.admin_reply);
                            setSelectedTicket({ ...selectedTicket, admin_reply: null });
                          }}
                          className="h-8 text-[9px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {/* Reply Email Templates Prompt */}
                      <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                        <div className="flex items-center gap-2 text-indigo-400">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-black uppercase tracking-wider">
                            Executive Designation Templates
                          </span>
                        </div>
                        <p className="text-[10px] text-zinc-500">
                          Click any designation to load its corresponding pre-formatted, polite response. You can then edit it below.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                          {REPLY_TEMPLATES.map(tmpl => (
                            <button
                              key={tmpl.id}
                              type="button"
                              onClick={() => {
                                setSelectedDesignation(tmpl.designation);
                                setReply(tmpl.body(selectedTicket.user_name || 'Member', selectedTicket.subject || 'Technical Problem'));
                                showToast(`Loaded "${tmpl.name}" Template`, 'success');
                              }}
                              className="p-3 bg-white/[0.02] hover:bg-indigo-500/10 border border-white/5 hover:border-indigo-500/30 rounded-xl text-left transition-all cursor-pointer group flex flex-col justify-between"
                            >
                              <h6 className="text-[10px] font-black uppercase text-zinc-300 group-hover:text-indigo-400 transition-colors">
                                {tmpl.name}
                              </h6>
                              <span className="text-[8px] text-zinc-500 uppercase tracking-tighter mt-1 font-mono font-bold block">
                                {tmpl.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleReply} className="space-y-4">
                        {/* Designation & Name details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white/[0.01] p-4 border border-white/5 rounded-2xl">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                              Sender Name (Sign-off)
                            </label>
                            <input
                              type="text"
                              value={customAdminName}
                              onChange={(e) => setCustomAdminName(e.target.value)}
                              placeholder={user?.user_metadata?.full_name || 'Executive Committee Member'}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/30 transition-all"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                              High Designation Role
                            </label>
                            <select
                              value={selectedDesignation}
                              onChange={(e) => setSelectedDesignation(e.target.value)}
                              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500/30 transition-all cursor-pointer"
                            >
                              <option value="President, Executive Committee" className="bg-zinc-950 text-white">President, Executive Committee</option>
                              <option value="Vice President, Executive Committee" className="bg-zinc-950 text-white">Vice President, Executive Committee</option>
                              <option value="General Secretary, Executive Committee" className="bg-zinc-950 text-white">General Secretary, Executive Committee</option>
                              <option value="Treasurer, Executive Committee" className="bg-zinc-950 text-white">Treasurer, Executive Committee</option>
                              <option value="Tech & IT Secretary, Executive Committee" className="bg-zinc-950 text-white">Tech & IT Secretary, Executive Committee</option>
                              <option value="Senior Coordinator, Executive Committee" className="bg-zinc-950 text-white">Senior Coordinator, Executive Committee</option>
                              <option value="Executive Committee Member" className="bg-zinc-950 text-white">Executive Committee Member</option>
                              <option value="Moderator, Josephite Math Club" className="bg-zinc-950 text-white">Moderator, Josephite Math Club</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-black uppercase tracking-wider text-zinc-400">
                              Email Message Body
                            </label>
                            {reply.length > 0 && (
                              <button 
                                type="button" 
                                onClick={() => setReply('')} 
                                className="text-[8px] text-red-500 hover:underline uppercase font-bold"
                              >
                                Clear Draft
                              </button>
                            )}
                          </div>
                          <textarea
                            required
                            value={reply}
                            onChange={(e) => setReply(e.target.value)}
                            placeholder="Type or load a high-designation email template to resolve this ticket..."
                            className="w-full bg-white/[0.02] border border-white/10 rounded-2xl p-4 py-3 h-56 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:border-amber-500/30 transition-all font-sans leading-relaxed resize-none"
                          />
                        </div>

                        <div className="flex justify-end gap-3 pt-2">
                          <button
                            disabled={isReplying || !reply.trim()}
                            type="submit"
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
                    </div>
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
