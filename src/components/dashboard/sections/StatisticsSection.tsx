"use client";

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Shield, 
  Award, 
  CheckCircle2, 
  BarChart3, 
  RefreshCw, 
  Search, 
  UserCheck, 
  Sparkles,
  Info,
  Calendar,
  GraduationCap,
  Hammer,
  FileText,
  X,
  Layers
} from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../../../lib/supabase';
import { Skeleton } from '../../Skeleton';

interface MemberRow {
  id: string;
  full_name: string;
  class?: string;
  roll?: string;
  created_at?: string;
  member_id?: string;
}

interface EcMemberRow {
  id: string;
  full_name: string;
  department: 'management' | 'logistics' | 'academics' | string;
  designation?: string;
  class?: string;
  roll?: string;
}

interface VerifiedRegRow {
  id: string;
  user_id?: string;
  full_name: string;
  class?: string;
  roll?: string;
  tableName: string;
  selected_events?: string;
  phone?: string;
}

export function StatisticsSection() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // States for raw data
  const [generalMembers, setGeneralMembers] = useState<MemberRow[]>([]);
  const [ecMembers, setEcMembers] = useState<EcMemberRow[]>([]);
  const [verifiedRegistrations, setVerifiedRegistrations] = useState<VerifiedRegRow[]>([]);

  // Selected slice state for interactive pie chart
  const [activeSlice, setActiveSlice] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  // Search inside focused group
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSupabaseConfigured) return;
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    setError(null);

    try {
      // 1. Fetch general members
      const { data: memberData, error: memberErr } = await supabase
        .from('member')
        .select('id, full_name, class, roll, created_at, member_id');
      
      if (memberErr) throw memberErr;

      // 2. Fetch EC members
      const { data: ecData, error: ecErr } = await supabase
        .from('ec_member')
        .select('id, full_name, department, class, roll');

      if (ecErr) throw ecErr;

      // 3. Fetch verified event registrations across all 4 tables
      const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
      let allVerified: VerifiedRegRow[] = [];

      for (const tb of tables) {
        const { data, error: tableErr } = await supabase
          .from(tb)
          .select('id, user_id, full_name, class, roll, selected_events, phone')
          .or("verified.eq.yes,verified.eq.true");

        if (tableErr) {
          console.error(`Error fetching verified from ${tb}:`, tableErr);
          continue;
        }

        if (data) {
          allVerified = [
            ...allVerified,
            ...data.map((row) => ({
              ...row,
              tableName: tb
            }))
          ];
        }
      }

      setGeneralMembers(memberData || []);
      setEcMembers(ecData || []);
      setVerifiedRegistrations(allVerified);
    } catch (err: any) {
      console.error("Error loading stats data:", err);
      setError(err.message || "Failed to load club statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Filter generalMembers to exclude EC members and event-only teammates (with 5 digit numeric IDs)
  const actualGeneralMembers = useMemo(() => {
    const ecIds = new Set(ecMembers.map(m => m.id));
    return generalMembers.filter(m => {
      // Exclude if in ec_member table
      if (ecIds.has(m.id)) return false;
      // Exclude event-only/teammate registrants (5 digit IDs, e.g. "54321")
      if (m.member_id && /^\d{5}$/.test(m.member_id)) return false;
      return true;
    });
  }, [generalMembers, ecMembers]);

  // Breakdown metrics
  const stats = useMemo(() => {
    const generalCount = actualGeneralMembers.length;
    const verifiedRegistrantsCount = verifiedRegistrations.length;
    
    // EC Breakdown
    let managementCount = 0;
    let logisticsCount = 0;
    let academicsCount = 0;

    ecMembers.forEach((m) => {
      const dept = String(m.department || "").toLowerCase().trim();
      if (dept === "management" || dept.includes("manage") || dept.includes("admin")) {
        managementCount++;
      } else if (dept === "logistics" || dept.includes("logis")) {
        logisticsCount++;
      } else if (dept === "academics" || dept.includes("acad")) {
        academicsCount++;
      } else {
        // Fallback to management if undefined
        managementCount++;
      }
    });

    const ecTotal = ecMembers.length;
    const totalHeadcount = generalCount + verifiedRegistrantsCount + ecTotal;

    return {
      generalCount,
      verifiedRegistrantsCount,
      managementCount,
      logisticsCount,
      academicsCount,
      ecTotal,
      totalHeadcount
    };
  }, [actualGeneralMembers, ecMembers, verifiedRegistrations]);

  // Pie chart segments definition
  const segments = useMemo(() => {
    const {
      generalCount,
      verifiedRegistrantsCount,
      managementCount,
      logisticsCount,
      academicsCount,
      totalHeadcount
    } = stats;

    if (totalHeadcount === 0) return [];

    const rawSegments = [
      {
        id: 'general_members',
        label: 'General Members',
        value: generalCount,
        color: '#14b8a6', // Teal 500
        hoverColor: '#2dd4bf', // Teal 400
        description: 'Standard registered members of JMC',
        icon: Users
      },
      {
        id: 'verified_registrants',
        label: 'Verified Registrants',
        value: verifiedRegistrantsCount,
        color: '#06b6d4', // Cyan 500
        hoverColor: '#22d3ee', // Cyan 400
        description: 'Validated participants of club events',
        icon: Calendar
      },
      {
        id: 'ec_management',
        label: 'EC Management',
        value: managementCount,
        color: '#f59e0b', // Amber 500
        hoverColor: '#fbbf24', // Amber 400
        description: 'President, Vice President, Secretaries, Treasurers, etc.',
        icon: Shield
      },
      {
        id: 'ec_logistics',
        label: 'EC Logistics',
        value: logisticsCount,
        color: '#e11d48', // Rose 600
        hoverColor: '#f43f5e', // Rose 500
        description: 'Event operations, inventory, and coordination heads',
        icon: Hammer
      },
      {
        id: 'ec_academics',
        label: 'EC Academics',
        value: academicsCount,
        color: '#8b5cf6', // Violet 500
        hoverColor: '#a78bfa', // Violet 400
        description: 'Problem setters, answer script evaluation, and mentors',
        icon: GraduationCap
      }
    ];

    // Filter segments with count > 0 to build standard Pie Chart
    let currentPercentage = 0;
    return rawSegments
      .filter(s => s.value > 0)
      .map(s => {
        const percentage = s.value / totalHeadcount;
        const startPercentage = currentPercentage;
        currentPercentage += percentage;
        return {
          ...s,
          percentage,
          startPercentage
        };
      });
  }, [stats]);

  // Set default active slice when data loads
  useEffect(() => {
    if (segments.length > 0 && !activeSlice) {
      setActiveSlice(segments[0].id);
    }
  }, [segments, activeSlice]);

  // Fetch list of members for the active slice
  const activeList = useMemo(() => {
    if (!activeSlice) return [];

    if (activeSlice === 'general_members') {
      return actualGeneralMembers.map(m => ({
        name: m.full_name,
        role: `Club Member (${m.class ? `Class ${m.class}` : 'N/A'})`,
        id: m.member_id || m.id.substring(0, 8),
        extra: m.roll ? `Roll: ${m.roll}` : ''
      }));
    }

    if (activeSlice === 'verified_registrants') {
      return verifiedRegistrations.map(r => ({
        name: r.full_name,
        role: `${r.tableName.replace("_events", " Events")} registrant`,
        id: r.id.substring(0, 8),
        extra: r.selected_events ? `Events: ${r.selected_events}` : ''
      }));
    }

    if (activeSlice.startsWith('ec_')) {
      const targetDept = activeSlice.replace('ec_', '');
      return ecMembers
        .filter(m => {
          const dept = String(m.department || "").toLowerCase().trim();
          if (targetDept === 'management') {
            return dept === "management" || dept.includes("manage") || dept.includes("admin") || (!dept);
          }
          if (targetDept === 'logistics') {
            return dept === "logistics" || dept.includes("logis");
          }
          if (targetDept === 'academics') {
            return dept === "academics" || dept.includes("acad");
          }
          return false;
        })
        .map(m => ({
          name: m.full_name,
          role: m.designation || (m.department ? `${m.department.charAt(0).toUpperCase()}${m.department.slice(1)} Officer` : 'EC Officer'),
          id: m.id.substring(0, 8),
          extra: m.class ? `Class ${m.class} (Roll: ${m.roll || 'N/A'})` : ''
        }));
    }

    return [];
  }, [activeSlice, actualGeneralMembers, ecMembers, verifiedRegistrations]);

  // Filter list with search query
  const filteredActiveList = useMemo(() => {
    if (!searchQuery.trim()) return activeList;
    const q = searchQuery.toLowerCase().trim();
    return activeList.filter(item => 
      item.name.toLowerCase().includes(q) || 
      item.role.toLowerCase().includes(q) || 
      item.id.toLowerCase().includes(q) ||
      item.extra.toLowerCase().includes(q)
    );
  }, [activeList, searchQuery]);

  // Render variables for SVG Pie Chart
  const radius = 70;
  const strokeWidth = 24;
  const centerCoord = 100;
  const circumference = 2 * Math.PI * radius;

  const currentActiveSegment = segments.find(s => s.id === activeSlice);

  if (loading) {
    return (
      <div className="space-y-8 p-1">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
          <Skeleton className="h-32 rounded-3xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-96 rounded-3xl" />
          <Skeleton className="h-96 rounded-3xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center">
        <p className="text-rose-400 font-medium mb-4">{error}</p>
        <button 
          onClick={() => fetchData()}
          className="px-6 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl flex items-center gap-2 transition-all"
        >
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-1" id="statistics-section-container">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 glass-card rounded-3xl border border-white/10 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
              <BarChart3 className="h-5 w-5" />
            </span>
            <h2 className="text-xl font-display font-black text-white uppercase tracking-tight">
              Club Roll & Statistics
            </h2>
          </div>
          <p className="text-xs text-zinc-400 max-w-xl">
            Live interactive analytics of the Josephite Math Club membership headcount, validated event registrations, and executive committee configurations.
          </p>
        </div>
        <button 
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 active:scale-95 text-xs text-zinc-300 font-bold tracking-wider rounded-xl border border-white/5 flex items-center gap-2 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'REFRESHING...' : 'REFRESH STATS'}
        </button>
      </div>

      {/* Headcount Stat Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Total Headcount */}
        <div 
          className="p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden glass-card border-white/10 hover:border-white/20"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-indigo-400 uppercase tracking-widest">Total Headcount</span>
              <h3 className="text-4xl font-display font-black text-white">{stats.totalHeadcount}</h3>
            </div>
            <span className="p-3 bg-indigo-500/15 text-indigo-400 rounded-2xl">
              <Layers className="h-6 w-6" />
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-mono">
            General, EC members, and verified registrants
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500/30 overflow-hidden">
            <div className="h-full bg-indigo-500 w-full" />
          </div>
        </div>

        {/* Card 2: General Members */}
        <div 
          onClick={() => setActiveSlice('general_members')}
          className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${activeSlice === 'general_members' ? 'bg-teal-500/10 border-teal-500/50 shadow-lg shadow-teal-500/5' : 'glass-card border-white/10 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-teal-400 uppercase tracking-widest">General Members</span>
              <h3 className="text-4xl font-display font-black text-white">{stats.generalCount}</h3>
            </div>
            <span className="p-3 bg-teal-500/15 text-teal-400 rounded-2xl">
              <Users className="h-6 w-6" />
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-mono">
            {((stats.generalCount / (stats.totalHeadcount || 1)) * 100).toFixed(1)}% of JMC headcount
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-500/30 overflow-hidden">
            <motion.div 
              className="h-full bg-teal-500" 
              initial={{ width: 0 }} 
              animate={{ width: `${(stats.generalCount / (stats.totalHeadcount || 1)) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Card 3: Verified Registrants */}
        <div 
          onClick={() => setActiveSlice('verified_registrants')}
          className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${activeSlice === 'verified_registrants' ? 'bg-cyan-500/10 border-cyan-500/50 shadow-lg shadow-cyan-500/5' : 'glass-card border-white/10 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-cyan-400 uppercase tracking-widest">Verified Registrations</span>
              <h3 className="text-4xl font-display font-black text-white">{stats.verifiedRegistrantsCount}</h3>
            </div>
            <span className="p-3 bg-cyan-500/15 text-cyan-400 rounded-2xl">
              <UserCheck className="h-6 w-6" />
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 mt-4 font-mono">
            {((stats.verifiedRegistrantsCount / (stats.totalHeadcount || 1)) * 100).toFixed(1)}% of JMC headcount
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-cyan-500/30 overflow-hidden">
            <motion.div 
              className="h-full bg-cyan-500" 
              initial={{ width: 0 }} 
              animate={{ width: `${(stats.verifiedRegistrantsCount / (stats.totalHeadcount || 1)) * 100}%` }}
              transition={{ duration: 1 }}
            />
          </div>
        </div>

        {/* Card 4: Executive Committee */}
        <div 
          onClick={() => {
            // Focus on management by default if clicking EC card
            setActiveSlice('ec_management');
          }}
          className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer relative overflow-hidden ${activeSlice?.startsWith('ec_') ? 'bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/5' : 'glass-card border-white/10 hover:border-white/20'}`}
        >
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <span className="text-[10px] font-mono font-black text-amber-400 uppercase tracking-widest">Executive Committee</span>
              <h3 className="text-4xl font-display font-black text-white">{stats.ecTotal}</h3>
            </div>
            <span className="p-3 bg-amber-500/15 text-amber-400 rounded-2xl">
              <Shield className="h-6 w-6" />
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-4 text-[9px] font-mono">
            <div className="bg-white/5 p-1 rounded-md text-center">
              <span className="text-zinc-500 block">MGMT</span>
              <span className="text-amber-400 font-extrabold">{stats.managementCount}</span>
            </div>
            <div className="bg-white/5 p-1 rounded-md text-center">
              <span className="text-zinc-500 block">LOGS</span>
              <span className="text-rose-400 font-extrabold">{stats.logisticsCount}</span>
            </div>
            <div className="bg-white/5 p-1 rounded-md text-center">
              <span className="text-zinc-500 block">ACAD</span>
              <span className="text-violet-400 font-extrabold">{stats.academicsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Pie Chart & Group Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Interactive Pie Chart Container */}
        <div className="p-6 glass-card rounded-3xl border border-white/10 flex flex-col justify-between min-h-[460px]">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Membership Pie Chart</h3>
            <p className="text-[11px] text-zinc-400">Hover or click slices to dynamically view details</p>
          </div>

          {/* Pie Chart SVG and Center Display */}
          <div className="flex items-center justify-center my-8 relative">
            <svg 
              width="240" 
              height="240" 
              viewBox="0 0 200 200"
              className="transform rotate-[-90deg] transition-transform duration-500"
            >
              <defs>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {segments.map((seg) => {
                const isHovered = hoveredSlice === seg.id;
                const isActive = activeSlice === seg.id;
                
                // Calculate stroke properties using precise stroke-dashoffset placement
                const strokeOffset = -seg.startPercentage * circumference;

                return (
                  <circle
                    key={seg.id}
                    cx={centerCoord}
                    cy={centerCoord}
                    r={radius}
                    fill="transparent"
                    stroke={seg.color}
                    strokeWidth={isActive ? strokeWidth + 6 : isHovered ? strokeWidth + 3 : strokeWidth}
                    strokeDasharray={`${(seg.percentage || 0) * circumference} ${circumference}`}
                    strokeDashoffset={strokeOffset || 0}
                    className="transition-all duration-300 cursor-pointer"
                    onMouseEnter={() => setHoveredSlice(seg.id)}
                    onMouseLeave={() => setHoveredSlice(null)}
                    onClick={() => setActiveSlice(seg.id)}
                    style={{
                      opacity: hoveredSlice ? (isHovered ? 1 : 0.6) : (isActive ? 1 : 0.95),
                      filter: isActive ? 'url(#glow)' : 'none',
                    }}
                  />
                );
              })}
            </svg>

            {/* Inner Ring Circle Text Overlay */}
            <div className="absolute w-[100px] h-[100px] rounded-full bg-zinc-950/95 border border-white/10 flex flex-col items-center justify-center text-center pointer-events-none p-3 shadow-inner">
              {currentActiveSegment ? (
                <>
                  <span className="text-[9px] font-mono font-black uppercase tracking-widest text-zinc-500 block line-clamp-1 max-w-[80px]">
                    {currentActiveSegment.label.replace('EC ', '')}
                  </span>
                  <span className="text-xl font-display font-black text-white mt-0.5">
                    {currentActiveSegment.value}
                  </span>
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5">
                    {(currentActiveSegment.percentage * 100).toFixed(1)}%
                  </span>
                </>
              ) : (
                <>
                  <span className="text-[9px] font-mono font-black text-zinc-500 uppercase tracking-widest">Total</span>
                  <span className="text-xl font-display font-black text-white mt-0.5">{stats.totalHeadcount}</span>
                  <span className="text-[9px] font-mono text-zinc-400 mt-0.5">Members</span>
                </>
              )}
            </div>
          </div>

          {/* Legend Items */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/5">
            {segments.map((seg) => {
              const isActive = activeSlice === seg.id;
              const isHovered = hoveredSlice === seg.id;
              return (
                <div 
                  key={seg.id}
                  onMouseEnter={() => setHoveredSlice(seg.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => setActiveSlice(seg.id)}
                  className={`flex items-center gap-2 p-1.5 rounded-xl cursor-pointer transition-all ${isActive ? 'bg-white/5 border border-white/10' : 'hover:bg-white/5 border border-transparent'}`}
                >
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0" 
                    style={{ backgroundColor: seg.color }}
                  />
                  <div className="truncate text-left">
                    <span className="text-[10px] font-medium text-white truncate block">{seg.label}</span>
                    <span className="text-[9px] text-zinc-500 font-mono block">{seg.value} ({ (seg.percentage * 100).toFixed(1) }%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Category Details & Listings */}
        <div className="flex flex-col glass-card rounded-3xl border border-white/10 overflow-hidden min-h-[460px]">
          {/* Header information for focused slice */}
          {currentActiveSegment ? (
            <div className="p-6 border-b border-white/15" style={{ borderLeft: `4px solid ${currentActiveSegment.color}` }}>
              <div className="flex items-center gap-3">
                <span className="p-2 rounded-xl" style={{ backgroundColor: `${currentActiveSegment.color}15`, color: currentActiveSegment.color }}>
                  {React.createElement(currentActiveSegment.icon, { className: "h-5 w-5" })}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">{currentActiveSegment.label}</h3>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-zinc-400">
                      {currentActiveSegment.value} Members
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">{currentActiveSegment.description}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 border-b border-white/10 text-center">
              <p className="text-xs text-zinc-400">No segment selected</p>
            </div>
          )}

          {/* Quick Search inside List */}
          <div className="p-4 bg-zinc-950/20 border-b border-white/5 flex items-center gap-2">
            <Search className="h-3.5 w-3.5 text-zinc-500 shrink-0" />
            <input 
              type="text"
              placeholder={`Search in ${currentActiveSegment?.label || 'focused category'}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent border-none text-[11px] text-zinc-200 placeholder-zinc-500 outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Active Slice Members List */}
          <div className="flex-1 overflow-y-auto max-h-[280px] p-2 divide-y divide-white/5 scrollbar-thin">
            <AnimatePresence mode="popLayout">
              {filteredActiveList.length > 0 ? (
                filteredActiveList.map((item, index) => (
                  <motion.div 
                    key={item.id + index}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.3) }}
                    className="flex items-center justify-between p-3 hover:bg-white/5 rounded-xl transition-all"
                  >
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-bold text-white leading-tight">{item.name}</h4>
                      <p className="text-[10px] text-zinc-400 leading-none">{item.role}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[9px] font-mono text-zinc-500 block leading-tight">{item.id}</span>
                      {item.extra && (
                        <span className="text-[9px] font-mono text-amber-500/80 block mt-0.5 leading-none">
                          {item.extra}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-zinc-500">
                  <Info className="h-6 w-6 mb-2 opacity-30" />
                  <p className="text-xs font-mono">
                    {searchQuery ? 'No matching members found' : 'No members found in this segment'}
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
