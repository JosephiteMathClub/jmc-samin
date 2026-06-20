"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Loader2, 
  Sparkles, 
  User, 
  BookOpen, 
  Layers, 
  Hash, 
  Trophy, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  QrCode, 
  Play, 
  Cpu, 
  Hourglass, 
  Construction,
  Mail,
  Calendar
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useRouter } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ScrollReveal from '../components/ScrollReveal';

// List of all solo events in the website as hardcoded fallbacks
const SOLO_EVENTS = [
  "Math Olympiad",
  "IQ Test",
  "Probability Pressure",
  "Human Calculator",
  "Calculus Bee",
  "Geometry Dash",
  "Rubik's Cube",
  "Sudoku",
  "Cryptomania",
  "Singularity"
];

const DEFAULT_TEAM_EVENTS = [
  {
    name: "Tic-Tac-Toe",
    price: 300,
    memberCount: 3,
    eligibleCategories: "primary_junior",
    description: "Class 3 to 8 (Primary & Junior) Team Showdown. Includes 3 members."
  },
  {
    name: "Escape Room",
    price: 200,
    memberCount: 2,
    eligibleCategories: "secondary_higher_secondary",
    description: "Class 9 to 12 (Secondary & Higher Secondary) strategic room puzzles. Includes 2 members."
  }
];

const EventRegister = () => {
  const { user, profile, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const { content, loading: contentLoading } = useContent();
  const { showToast } = useToast();
  const router = useRouter();

  // Dynamic config states loaded from db
  const [soloEventsList, setSoloEventsList] = useState<string[]>(SOLO_EVENTS);
  const [teamEventsList, setTeamEventsList] = useState<any[]>(DEFAULT_TEAM_EVENTS);
  const [formConfig, setFormConfig] = useState({
    formDescription: "Specify the category format. Standard events are priced at 100tk each. Select all to enjoy premium package bundles.",
    perEventPriceSolo: 100,
    allEventsSoloPriceGeneral: 100,
    allEventsSoloPriceMember: 50,
    bkashNumber: "01712345678"
  });

  // Form toggle status checks
  const [isFormOpen, setIsFormOpen] = useState<boolean>(true);
  const [checkingFormAvailability, setCheckingFormAvailability] = useState<boolean>(true);

  // Step state (1, 2, 3)
  const [step, setStep] = useState(1);

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [className, setClassName] = useState('');
  const [section, setSection] = useState('');
  const [roll, setRoll] = useState('');
  
  // Event sub-tab ("solo" or "team")
  const [eventTab, setEventTab] = useState<'solo' | 'team'>('solo');
  // Selected solo events
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  // Payment details
  const [bkashNumber, setBkashNumber] = useState('');
  const [trxnid, setTrxnid] = useState('');

  // Teammate 2 States
  const [teamMember2Name, setTeamMember2Name] = useState('');
  const [teamMember2Class, setTeamMember2Class] = useState('');
  const [teamMember2Section, setTeamMember2Section] = useState('');
  const [teamMember2Roll, setTeamMember2Roll] = useState('');
  const [teamMember2Email, setTeamMember2Email] = useState('');
  const [member2Profile, setMember2Profile] = useState<any>(null);

  // Teammate 3 States (only for events requiring 3 members)
  const [teamMember3Name, setTeamMember3Name] = useState('');
  const [teamMember3Class, setTeamMember3Class] = useState('');
  const [teamMember3Section, setTeamMember3Section] = useState('');
  const [teamMember3Roll, setTeamMember3Roll] = useState('');
  const [teamMember3Email, setTeamMember3Email] = useState('');
  const [member3Profile, setMember3Profile] = useState<any>(null);

  // Team Registration Status States
  const [alreadyRegisteredTeam, setAlreadyRegisteredTeam] = useState(false);
  const [userRegisteredTeamEventName, setUserRegisteredTeamEventName] = useState<string | null>(null);
  const [checkingTeammates, setCheckingTeammates] = useState(false);
  const [userRegisteredEvents, setUserRegisteredEvents] = useState<any[]>([]);

  // Flags
  const [isGeneralMember, setIsGeneralMember] = useState(false);
  const [registeredMemberData, setRegisteredMemberData] = useState<any>(null);
  const [fetchingMemberStatus, setFetchingMemberStatus] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmSegmentModal, setShowConfirmSegmentModal] = useState(false);
  const [hasConfirmedSegments, setHasConfirmedSegments] = useState(false);

  // EC member check states
  const [isCurrentUserEc, setIsCurrentUserEc] = useState(false);
  const [currentUserEcId, setCurrentUserEcId] = useState<string | null>(null);
  const [isProxyUserEc, setIsProxyUserEc] = useState(false);
  const [proxyUserEcId, setProxyUserEcId] = useState<string | null>(null);

  // Admin Proxy/Spot Registration States
  const [isProxyRegistration, setIsProxyRegistration] = useState(false);
  const [proxyEmail, setProxyEmail] = useState('');
  const [proxyPhoneNumber, setProxyPhoneNumber] = useState('');
  const [proxyVerified, setProxyVerified] = useState(false);
  const [proxyUserExists, setProxyUserExists] = useState(false);
  const [proxyResolvedUserId, setProxyResolvedUserId] = useState<string | null>(null);
  const [checkingProxyEmail, setCheckingProxyEmail] = useState(false);

  // General Member Check on Load
  useEffect(() => {
    const fetchMemberInfo = async () => {
      if (!user || !isSupabaseConfigured) {
        setFetchingMemberStatus(false);
        return;
      }
      try {
        const { data: memberData } = await supabase
          .from('member')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const { data: ecData } = await supabase
          .from('ec_member')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        const activeData = ecData || memberData;

        if (ecData) {
          setIsCurrentUserEc(true);
          setCurrentUserEcId(ecData.member_id || null);
        }

        if (activeData) {
          setRegisteredMemberData(activeData);
          setFullName(activeData.full_name || '');
          setClassName(activeData.class || '');
          setSection(activeData.section || '');
          setRoll(activeData.roll || '');
          
          if (activeData.verified === 'yes') {
            setIsGeneralMember(true);
          }
        }
      } catch (err) {
        console.error("Error fetching member info:", err);
      } finally {
        setFetchingMemberStatus(false);
      }
    };

    if (user) {
      fetchMemberInfo();
    } else if (!authLoading) {
      setFetchingMemberStatus(false);
    }
  }, [user, authLoading]);

  // Reactive Registered Events Check for active student (supports Proxy and Spot mode)
  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      // Determine actual active user ID we are preparing registration for
      const targetUserId = isProxyRegistration
        ? (proxyUserExists ? proxyResolvedUserId : null)
        : user?.id;

      if (!targetUserId || !isSupabaseConfigured) {
        setUserRegisteredEvents([]);
        setAlreadyRegisteredTeam(false);
        setUserRegisteredTeamEventName(null);
        return;
      }

      try {
        const tables = ['primary_events', 'junior_events', 'secondary_events', 'higher_secondary_events'];
        let matchedTeamEvent = null;
        let allReg: any[] = [];
        
        for (const tb of tables) {
          const { data: evData } = await supabase
            .from(tb)
            .select('*')
            .eq('user_id', targetUserId);
          
          if (evData && evData.length > 0) {
            const mapped = evData.map((item: any) => {
              let normalizedVerified = 'no';
              if (item.verified === true || item.verified === 'yes') {
                normalizedVerified = 'yes';
              } else if (item.verified === 'rejected') {
                normalizedVerified = 'rejected';
              } else if (item.verified === false || item.verified === 'no') {
                normalizedVerified = 'no';
              }
              return {
                ...item,
                tableName: tb,
                verified: normalizedVerified
              };
            });
            allReg = [...allReg, ...mapped];

            for (const r of evData) {
              const evts = (r.selected_events || '').split(',').map((s: string) => s.trim().toLowerCase());
              const match = teamEventsList.find(tc => evts.includes(tc.name.toLowerCase())) 
                || DEFAULT_TEAM_EVENTS.find(tc => evts.includes(tc.name.toLowerCase()));
              if (match) {
                matchedTeamEvent = match.name;
              }
            }
          }
        }

        setUserRegisteredEvents(allReg);

        if (matchedTeamEvent) {
          setAlreadyRegisteredTeam(true);
          setUserRegisteredTeamEventName(matchedTeamEvent);
        } else {
          setAlreadyRegisteredTeam(false);
          setUserRegisteredTeamEventName(null);
        }
      } catch (err) {
        console.error("Error fetching registered events reactive check:", err);
      }
    };

    fetchRegisteredEvents();
  }, [isProxyRegistration, proxyUserExists, proxyResolvedUserId, user, teamEventsList]);

  // Route protection & configuration loader
  useEffect(() => {
    async function checkFormAvailability() {
      if (!isSupabaseConfigured) {
        setCheckingFormAvailability(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'event_registration_enabled')
          .maybeSingle();

        if (error) {
          console.warn('System settings query failed or table does not exist. Defaulting to open registration:', error.message);
          setIsFormOpen(true);
        } else if (data) {
          setIsFormOpen(data.value === true);
        }

        // Fetch custom event/pricing configurations
        const { data: configData } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'event_registration_config')
          .maybeSingle();
        
        if (configData && configData.value) {
          const val = configData.value;
          if (val.soloEvents && Array.isArray(val.soloEvents)) {
            setSoloEventsList(val.soloEvents);
          }
          if (val.teamEvents && Array.isArray(val.teamEvents)) {
            setTeamEventsList(val.teamEvents);
          }
          setFormConfig({
            formDescription: val.formDescription || "Specify the category format. Standard events are priced at 100tk each. Select all to enjoy premium package bundles.",
            perEventPriceSolo: typeof val.perEventPriceSolo === 'number' ? val.perEventPriceSolo : 100,
            allEventsSoloPriceGeneral: typeof val.allEventsSoloPriceGeneral === 'number' ? val.allEventsSoloPriceGeneral : 100,
            allEventsSoloPriceMember: typeof val.allEventsSoloPriceMember === 'number' ? val.allEventsSoloPriceMember : 50,
            bkashNumber: val.bkashNumber || "01712345678"
          });
        }
      } catch (err) {
        console.warn('Handling Gracefully: Error fetching form settings/config:', err);
        // Fallback to true if table doesn't exist yet or query fails
        setIsFormOpen(true);
      } finally {
        setCheckingFormAvailability(false);
      }
    }
    checkFormAvailability();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) {
      const currentPath = window.location.pathname + window.location.search;
      router.push('/login?redirect=' + encodeURIComponent(currentPath));
    }
  }, [user, authLoading, router]);

  // Helper to get Table name based on Class Level input
  const getTargetTable = (cls: string): string => {
    const norm = cls.trim().toLowerCase();
    
    // Parse digits
    const numMatch = norm.match(/\d+/);
    if (numMatch) {
      const val = parseInt(numMatch[0]);
      if (val >= 3 && val <= 5) return 'primary_events';
      if (val >= 6 && val <= 8) return 'junior_events';
      if (val >= 9 && val <= 10) return 'secondary_events';
      if (val >= 11 && val <= 12) return 'higher_secondary_events';
    }
    
    // Fallback parsing roman numerals or names
    if (norm.includes('xii') || norm.includes('12') || norm.includes('eleven') || norm.includes('twelve') || norm.includes('xi') || norm.includes('11')) {
      return 'higher_secondary_events';
    }
    if (norm.includes('ix') || norm.includes('9') || norm.includes('x') || norm.includes('10')) {
      return 'secondary_events';
    }
    if (norm.includes('vi') || norm.includes('6') || norm.includes('vii') || norm.includes('7') || norm.includes('viii') || norm.includes('8') || norm.includes('junior')) {
      return 'junior_events';
    }
    if (norm.includes('iii') || norm.includes('3') || norm.includes('iv') || norm.includes('4') || norm.includes('v') || norm.includes('5') || norm.includes('primary')) {
      return 'primary_events';
    }
    
    return 'junior_events'; // Fallback
  };

  const alreadyRegisteredSolos = React.useMemo(() => {
    const list = new Set<string>();
    userRegisteredEvents.forEach((reg) => {
      if (reg.selected_events) {
        reg.selected_events.split(',').forEach((s: string) => {
          const evName = s.trim();
          if (evName) {
            list.add(evName.toLowerCase());
          }
        });
      }
    });
    return list;
  }, [userRegisteredEvents]);

  const availableSoloEvents = React.useMemo(() => {
    return soloEventsList.filter((event) => !alreadyRegisteredSolos.has(event.toLowerCase()));
  }, [alreadyRegisteredSolos, soloEventsList]);

  // Helper to determine category level grouping based on class name
  const getCategoryType = (cls: string): 'primary_junior' | 'secondary_higher_secondary' | 'unknown' => {
    const table = getTargetTable(cls);
    if (table === 'primary_events' || table === 'junior_events') {
      return 'primary_junior';
    }
    if (table === 'secondary_events' || table === 'higher_secondary_events') {
      return 'secondary_higher_secondary';
    }
    return 'unknown';
  };

  // Helper to calculate total amount based on business rules
  const calculateAmount = () => {
    if (eventTab === 'team') {
      const match = teamEventsList.find(tc => selectedEvents.includes(tc.name));
      return match ? match.price : 0;
    }

    const N = selectedEvents.length;
    if (N === 0) return 0;

    // If only Math Olympiad is selected, it is completely free under all circumstances!
    const isOnlyMathOlympiad = N === 1 && selectedEvents[0].trim().toLowerCase() === "math olympiad";
    if (isOnlyMathOlympiad) {
      return 0;
    }

    // Both general members and non-members follow the same simplified flat charge:
    // If they have registered once before, registering for more events later costs another 100 BDT
    if (userRegisteredEvents.length > 0) {
      return 100;
    }

    // Otherwise, flat fee of 100 BDT (selecting either one, some, or all events is 100tk total)
    return 100;
  };

  const handleSwitchTab = (tab: 'solo' | 'team') => {
    setEventTab(tab);
    setSelectedEvents([]); // reset selections to ensure strict separation of billing models
  };

  const verifyTeammateEmail = async (email: string, memberNum: 2 | 3) => {
    if (!email || !email.trim().includes('@')) {
      showToast("Please enter a valid teammate email address.", "error");
      return;
    }
    
    setCheckingTeammates(true);
    try {
      const trimmedEmail = email.trim().toLowerCase();
      
      // Check both member and ec_member tables under their emails
      const { data: memberData } = await supabase
        .from('member')
        .select('*')
        .or(`email.eq.${trimmedEmail},email_address.eq.${trimmedEmail}`)
        .maybeSingle();

      const { data: ecData } = await supabase
        .from('ec_member')
        .select('*')
        .or(`email.eq.${trimmedEmail},email_address.eq.${trimmedEmail}`)
        .maybeSingle();

      const activeTeammateData = ecData || memberData;

      if (activeTeammateData && activeTeammateData.verified === 'yes') {
        // They are registered and verified as a member! Pull credentials automatically
        const resolvedName = activeTeammateData.full_name || '';
        const resolvedClass = activeTeammateData.class || '';
        const resolvedSection = activeTeammateData.section || '';
        const resolvedRoll = activeTeammateData.roll || '';

        if (memberNum === 2) {
          setMember2Profile({ id: activeTeammateData.id, email: trimmedEmail, isGeneralMember: true });
          setTeamMember2Name(resolvedName);
          setTeamMember2Class(resolvedClass);
          setTeamMember2Section(resolvedSection);
          setTeamMember2Roll(resolvedRoll);
        } else {
          setMember3Profile({ id: activeTeammateData.id, email: trimmedEmail, isGeneralMember: true });
          setTeamMember3Name(resolvedName);
          setTeamMember3Class(resolvedClass);
          setTeamMember3Section(resolvedSection);
          setTeamMember3Roll(resolvedRoll);
        }
        showToast(`Teammate ${memberNum} verified as Member! Credentials pulled.`, "success");
      } else {
        // They are not registered as a general member before.
        // Check if they at least have a profile/account on the site to retrieve user id
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('email', trimmedEmail)
          .maybeSingle();

        const resolvedName = profileData?.full_name || '';

        if (memberNum === 2) {
          setMember2Profile({ id: profileData?.id || null, email: trimmedEmail, isGeneralMember: false });
          setTeamMember2Name(resolvedName);
          setTeamMember2Class('');
          setTeamMember2Section('');
          setTeamMember2Roll('');
        } else {
          setMember3Profile({ id: profileData?.id || null, email: trimmedEmail, isGeneralMember: false });
          setTeamMember3Name(resolvedName);
          setTeamMember3Class('');
          setTeamMember3Section('');
          setTeamMember3Roll('');
        }
        
        if (profileData) {
          showToast(`Teammate ${memberNum} has an account but is not an active General Member. Name auto-loaded. Please manually enter Class, Section, and Roll.`, "info");
        } else {
          showToast(`Teammate ${memberNum} email not found in our database. Since a pre-registered account is not mandatory, please manually input their details (Name, Class, Section, Roll).`, "info");
        }
      }
    } catch (err) {
      console.error("Error verifying teammate:", err);
      showToast("Verification failed due to connectivity issues.", "error");
    } finally {
      setCheckingTeammates(false);
    }
  };

  const handleToggleProxy = (checked: boolean) => {
    setIsProxyRegistration(checked);
    setProxyEmail('');
    setProxyPhoneNumber('');
    setProxyVerified(false);
    setProxyUserExists(false);
    setProxyResolvedUserId(null);
    setIsProxyUserEc(false);
    setProxyUserEcId(null);
    setUserRegisteredEvents([]);
    setAlreadyRegisteredTeam(false);
    setUserRegisteredTeamEventName(null);

    if (!checked) {
      if (registeredMemberData) {
        setFullName(registeredMemberData.full_name || '');
        setClassName(registeredMemberData.class || '');
        setSection(registeredMemberData.section || '');
        setRoll(registeredMemberData.roll || '');
        setIsGeneralMember(registeredMemberData.verified === 'yes');
      } else {
        setFullName('');
        setClassName('');
        setSection('');
        setRoll('');
        setIsGeneralMember(false);
      }
    } else {
      setFullName('');
      setClassName('');
      setSection('');
      setRoll('');
      setIsGeneralMember(false);
    }
  };

  const handleVerifyProxyEmail = async () => {
    if (!proxyEmail || !proxyEmail.trim().includes('@')) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setCheckingProxyEmail(true);
    try {
      const emailToCheck = proxyEmail.trim().toLowerCase();
      
      const { data: profileCheck, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', emailToCheck)
        .maybeSingle();

      if (pError) throw pError;

      const { data: memberCheck } = await supabase
        .from('member')
        .select('*')
        .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}`)
        .maybeSingle();

      const { data: ecCheck } = await supabase
        .from('ec_member')
        .select('*')
        .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}`)
        .maybeSingle();

      const activeMember = ecCheck || memberCheck;
      
      if (ecCheck) {
        setIsProxyUserEc(true);
        setProxyUserEcId(ecCheck.member_id || null);
      } else {
        setIsProxyUserEc(false);
        setProxyUserEcId(null);
      }
      
      if (profileCheck || activeMember) {
        const matchedName = activeMember?.full_name || profileCheck?.full_name || '';
        const matchedClass = activeMember?.class || '';
        const matchedSection = activeMember?.section || '';
        const matchedRoll = activeMember?.roll || '';
        const matchedPhone = activeMember?.phone || '';
        const matchedMemberVerified = activeMember ? activeMember.verified === 'yes' : false;

        setFullName(matchedName);
        setClassName(matchedClass);
        setSection(matchedSection);
        setRoll(matchedRoll);
        setProxyPhoneNumber(matchedPhone);
        setProxyResolvedUserId(profileCheck?.id || activeMember?.id || null);
        setProxyUserExists(true);
        setProxyVerified(true);
        setIsGeneralMember(matchedMemberVerified);
        showToast("Registered student found! General information auto-populated.", "success");
      } else {
        setProxyUserExists(false);
        setProxyVerified(true);
        setProxyResolvedUserId(null);
        setFullName('');
        setClassName('');
        setSection('');
        setRoll('');
        setProxyPhoneNumber('');
        setIsGeneralMember(false);
        setIsProxyUserEc(false);
        setProxyUserEcId(null);
        showToast("Email address not registered. Manual spot registration mode activated.", "info");
      }
    } catch (err: any) {
      console.error("Error verifying proxy email:", err);
      showToast("Proxy verification failed: " + err.message, "error");
    } finally {
      setCheckingProxyEmail(false);
    }
  };

  const handleNextStep1 = () => {
    if (isProxyRegistration) {
      if (!proxyEmail.trim() || !proxyEmail.trim().includes('@')) {
        showToast("Please enter a valid student email address.", "error");
        return;
      }
      if (!proxyVerified) {
        showToast("Please verify the student's email address first.", "error");
        return;
      }
      if (!proxyPhoneNumber.trim() || proxyPhoneNumber.trim().length < 11) {
        showToast("Please enter a valid student contact phone number (at least 11 digits).", "error");
        return;
      }
    }

    if (!fullName.trim() || !className.trim() || !section.trim() || !roll.trim()) {
      showToast("Please fill all general information fields to proceed.", "error");
      return;
    }
    setStep(2);
  };

  const handleNextStep2 = () => {
    if (eventTab === 'team') {
      const selectedEvent = selectedEvents[0];
      if (!selectedEvent) {
        showToast("Please select a team event to participate.", "error");
        return;
      }

      // Auto-initialize teammate 2 profile if typed but not explicitly verified
      let m2Profile = member2Profile;
      if (!m2Profile && teamMember2Email.trim() && teamMember2Name.trim()) {
        m2Profile = { id: null, email: teamMember2Email.trim().toLowerCase(), isGeneralMember: false };
        setMember2Profile(m2Profile);
      }
      
      // Validation for Teammate 2
      if (!teamMember2Email.trim() || !teamMember2Name.trim() || !teamMember2Class.trim() || !teamMember2Section.trim() || !teamMember2Roll.trim()) {
        showToast("Please fill all details for Teammate 2.", "error");
        return;
      }
      
      if (!m2Profile) {
        showToast("Please verify Teammate 2 email first using the verify icon button.", "error");
        return;
      }

      if (teamMember2Email.trim().toLowerCase() === user?.email?.toLowerCase()) {
        showToast("You cannot add yourself as Teammate 2.", "error");
        return;
      }

      // Additional Teammate 3 validation based on dynamic config member Count
      const activeTeamConf = teamEventsList.find(tc => tc.name === selectedEvent);
      if (activeTeamConf && activeTeamConf.memberCount === 3) {
        let m3Profile = member3Profile;
        if (!m3Profile && teamMember3Email.trim() && teamMember3Name.trim()) {
          m3Profile = { id: null, email: teamMember3Email.trim().toLowerCase(), isGeneralMember: false };
          setMember3Profile(m3Profile);
        }

        if (!teamMember3Email.trim() || !teamMember3Name.trim() || !teamMember3Class.trim() || !teamMember3Section.trim() || !teamMember3Roll.trim()) {
          showToast("Please fill all details for Teammate 3.", "error");
          return;
        }
        
        if (!m3Profile) {
          showToast("Please verify Teammate 3 email first using the verify icon button.", "error");
          return;
        }

        if (teamMember3Email.trim().toLowerCase() === user?.email?.toLowerCase()) {
          showToast("You cannot add yourself as Teammate 3.", "error");
          return;
        }

        if (teamMember2Email.trim().toLowerCase() === teamMember3Email.trim().toLowerCase()) {
          showToast("Teammate 2 and Teammate 3 must be different registered individuals.", "error");
          return;
        }
      }
    } else {
      if (selectedEvents.length === 0) {
        showToast("Please select at least one solo event to participate.", "error");
        return;
      }
    }
    setStep(3);
  };

  const handleToggleEvent = (eventName: string) => {
    if (alreadyRegisteredSolos.has(eventName.toLowerCase())) {
      showToast(`You have already registered for ${eventName}.`, "info");
      return;
    }
    if (selectedEvents.includes(eventName)) {
      setSelectedEvents(selectedEvents.filter(e => e !== eventName));
    } else {
      setSelectedEvents([...selectedEvents, eventName]);
    }
  };

  const handleSelectAll = () => {
    if (selectedEvents.length === availableSoloEvents.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents([...availableSoloEvents]);
    }
  };

  const handleSubmitRegistration = async (e?: React.FormEvent, bypassConfirm: boolean = false) => {
    if (e) e.preventDefault();

    // Check if we need to confirm solo segments before submitting
    if (eventTab === 'solo' && !hasConfirmedSegments && !bypassConfirm) {
      setShowConfirmSegmentModal(true);
      return;
    }

    const finalPrice = calculateAmount();
    const isOnlyFreeMathOlympiad = selectedEvents.length === 1 && selectedEvents[0]?.trim().toLowerCase() === "math olympiad";

    let finalBkashNumber = bkashNumber.trim();
    let finalTrxnid = trxnid.trim();

    const isEc = isProxyRegistration ? isProxyUserEc : isCurrentUserEc;
    const ecId = isProxyRegistration ? proxyUserEcId : currentUserEcId;

    if (isProxyRegistration) {
      finalBkashNumber = "PROXY: " + (user?.email || "Admin");
      finalTrxnid = "PROXY-" + Math.floor(100000 + Math.random() * 900000).toString();
    } else if (isEc && ecId) {
      finalBkashNumber = "N/A - EC OFFICER";
      finalTrxnid = ecId;
    } else if (isOnlyFreeMathOlympiad) {
      if (!finalBkashNumber) {
        finalBkashNumber = "N/A - FREE ENTRY";
      }
      if (!finalTrxnid) {
        finalTrxnid = "FREE-MO-" + Math.floor(100000 + Math.random() * 900000).toString();
      }
    } else {
      if (!finalBkashNumber || finalBkashNumber.length < 11) {
        showToast("Please enter a valid bKash Sender Phone Number.", "error");
        return;
      }
      if (!finalTrxnid || finalTrxnid.length < 8) {
        showToast("Please enter a valid Transaction ID.", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      let finalUserId = user?.id;

      if (isProxyRegistration) {
        if (!proxyUserExists || !proxyResolvedUserId) {
          // Trigger spot registration: Call admin create-user route!
          const createRes = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: proxyEmail.trim().toLowerCase(),
              password: proxyPhoneNumber.trim(),
              fullName: fullName.trim()
            })
          });

          const createData = await createRes.json();
          if (!createRes.ok) {
            throw new Error(createData.error || "Failed to create spot registration user account.");
          }

          if (!createData.userId) {
            throw new Error("No user ID returned from spot account creation.");
          }

          finalUserId = createData.userId;
          showToast("Spot registration account created successfully!", "success");
        } else {
          finalUserId = proxyResolvedUserId;
        }
      }

      const targetTable = getTargetTable(className);
      
      const payload: any = {
        user_id: finalUserId,
        full_name: fullName,
        class: className,
        section: section,
        roll: roll,
        bkash_number: finalBkashNumber,
        trxnid: finalTrxnid,
        amount: finalPrice,
        selected_events: selectedEvents.join(', '),
        verified: (isOnlyFreeMathOlympiad || isEc) ? 'yes' : 'no'
      };

      if (isProxyRegistration) {
        payload.registered_by = user?.email || 'Admin';
        payload.verified_by = user?.email || 'Admin';
      }

      let insertedData: any[] | null = null;
      let error: any = null;

      const res = await supabase
        .from(targetTable)
        .insert([payload])
        .select('*');

      insertedData = res.data;
      error = res.error;

      // Graceful fallback for older database versions without registered_by / verified_by column
      if (error && (error.code === '42703' || String(error.message).includes('registered_by') || String(error.message).includes('verified_by'))) {
        console.warn("registered_by or verified_by column does not exist yet. Falling back to insert without them...");
        const fallbackPayload = { ...payload };
        delete fallbackPayload.registered_by;
        delete fallbackPayload.verified_by;
        const retryRes = await supabase
          .from(targetTable)
          .insert([fallbackPayload])
          .select('*');
        insertedData = retryRes.data;
        error = retryRes.error;
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error("This Transaction ID (TrxID) has already been submitted for evaluation.");
        }
        throw error;
      }

      const insertedRow = insertedData && insertedData[0];

      // If team events, save teammate records to database server-side
      if (eventTab === 'team') {
        const teammatesList = [];
        if (member2Profile) {
          teammatesList.push({
            id: member2Profile.id,
            name: teamMember2Name,
            class: teamMember2Class,
            section: teamMember2Section,
            roll: teamMember2Roll
          });
        }
        const activeTeamConf = teamEventsList.find(tc => tc.name === selectedEvents[0]);
        if (activeTeamConf && activeTeamConf.memberCount === 3 && member3Profile) {
          teammatesList.push({
            id: member3Profile.id,
            name: teamMember3Name,
            class: teamMember3Class,
            section: teamMember3Section,
            roll: teamMember3Roll
          });
        }

        if (teammatesList.length > 0) {
          const teamRes = await fetch('/api/events/register-teammates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              trxnid: finalTrxnid,
              bkash_number: finalBkashNumber,
              targetTable,
              event_name: selectedEvents[0],
              teammates: teammatesList
            })
          });

          const teamResData = await teamRes.json();
          if (!teamRes.ok) {
            throw new Error(teamResData.error || "Failed while saving teammate registrations.");
          }
        }
      }

      // Ensure the student gets a member ID automatically if they are not already listed in the 'member' or 'ec_member' table
      let isUserRegisteredGeneral = false;
      let existingMemberId = '';
      try {
        const { data: ecData, error: ecCheckError } = await supabase
          .from('ec_member')
          .select('id, verified, member_id')
          .eq('id', finalUserId)
          .maybeSingle();

        if (!ecCheckError && ecData) {
          isUserRegisteredGeneral = true;
          existingMemberId = ecData.member_id || '';
          console.log("User is an EC member, skipping 5-digit general member ID generation. EC ID is:", existingMemberId);
        } else {
          const { data: memberData, error: memberCheckError } = await supabase
            .from('member')
            .select('id, verified, member_id')
            .eq('id', finalUserId)
            .maybeSingle();
          
          if (!memberCheckError && memberData) {
            isUserRegisteredGeneral = true;
            existingMemberId = memberData.member_id || '';

            // If they selected the free Math Olympiad or was registered via proxy, and are not verified yet, auto-verify their membership!
            if ((isOnlyFreeMathOlympiad || isProxyRegistration) && memberData.verified !== 'yes') {
              const { error: updateVerError } = await supabase
                .from('member')
                .update({ verified: 'yes' })
                .eq('id', finalUserId);
              if (updateVerError) {
                console.error("Failed to auto-verify existing member for special event:", updateVerError);
              } else {
                console.log("Successfully auto-verified existing member for proxy/free Math Olympiad event.");
              }
            }
          }
        }
      } catch (err) {
        console.error("Failed to query member or ec_member table during event registration check:", err);
      }

      // If they are not registered in the member table at all, automatically register them as a non-general member & provide a 5-digit unique ID
      if (!isUserRegisteredGeneral) {
        let resolvedMemberId = '';
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 100) {
          attempts++;
          const digits = Math.floor(10000 + Math.random() * 90000).toString();
          const { data: check } = await supabase
            .from('member')
            .select('id')
            .eq('member_id', digits)
            .maybeSingle();
          if (!check) {
            resolvedMemberId = digits;
            isUnique = true;
          }
        }
        if (!resolvedMemberId) {
          resolvedMemberId = Math.floor(10000 + Math.random() * 90000).toString();
        }
        existingMemberId = resolvedMemberId;

        const { error: autoGenError } = await supabase
          .from('member')
          .upsert({
            id: finalUserId,
            full_name: fullName,
            email: isProxyRegistration ? proxyEmail.trim().toLowerCase() : (user?.email || ''),
            email_address: isProxyRegistration ? proxyEmail.trim().toLowerCase() : (user?.email || ''),
            phone: isProxyRegistration ? proxyPhoneNumber : (bkashNumber.trim() || 'N/A - FREE ENTRY'),
            school: 'St Joseph Higher Secondary School',
            class: className,
            section: section,
            roll: roll,
            photo_url: '',
            payment_method: 'bkash',
            trxnid: finalTrxnid,
            bkash_number: finalBkashNumber,
            verified: (isOnlyFreeMathOlympiad || isProxyRegistration) ? 'yes' : 'no', // mark as verified instantly if proxy
            member_id: resolvedMemberId
          });

        if (autoGenError) {
          console.error("Auto member registration error:", autoGenError);
          showToast("Assigned member ID generation warning: " + autoGenError.message, "info");
        } else {
          console.log("Successfully auto-enrolled non-general member with 5-digit ID:", resolvedMemberId);
          showToast(`Assigned unique Ticket ID: ${resolvedMemberId}`, "success");
        }
      }

      // Also trigger a notification email to the user
      try {
        if (isProxyRegistration && insertedRow) {
          // Trigger instant admin-level verification to auto-create participation rows, verify, and email their UNIQUE 5-digit ID!
          const verifyRes = await fetch('/api/admin/verify-event-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId: insertedRow.id,
              tableName: targetTable,
              action: 'approve',
              emailAddress: proxyEmail.trim().toLowerCase(),
              verifiedBy: user?.email || 'Admin'
            })
          });
          if (!verifyRes.ok) {
            const errData = await verifyRes.json();
            console.error("Auto approval error for proxy registration:", errData);
          } else {
            console.log("Successfully auto-approved and cataloged proxy registration.");
          }
        } else {
          await fetch('/api/admin/bulk-verification-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              members: [{
                email: user?.email,
                fullName: fullName
              }]
            })
          });
        }
      } catch (emailErr) {
        console.warn("Could not fire automatic warning/registration email:", emailErr);
      }

      setIsSuccess(true);
      showToast("Event registration request submitted successfully!", "success");
    } catch (err: any) {
      console.error("Submission Error:", err);
      showToast(err.message || "Failed to submit event registration. Please double check database tables and connection.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || fetchingMemberStatus || contentLoading || checkingFormAvailability) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#020202]">
        <Loader2 className="w-10 h-10 text-[var(--c-6-start)] animate-spin" />
      </div>
    );
  }

  if (!isFormOpen && !isAdmin && !isSuperAdmin) {
    return (
      <div className="relative min-h-screen bg-[#020202] text-white pt-36 pb-24 overflow-hidden" id="registration-closed-container">
        {/* Background Ambience */}
        <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -right-24 opacity-50" />
        <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-2-start)]/5 -bottom-48 -left-24 opacity-50" />

        <div className="max-w-xl mx-auto px-4 relative z-10">
          <div className="glass-card rounded-[2.5rem] p-8 py-12 text-center border border-white/10 bg-[#020202]/95 shadow-lg shadow-black/80 flex flex-col items-center">
            <div className="mx-auto w-16 h-16 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center mb-6">
              <Calendar className="w-9 h-9" />
            </div>
            
            <h2 className="text-2xl font-black font-sans text-white uppercase tracking-tight">
              Registration Periodically Closed
            </h2>
            
            <p className="text-zinc-400 mt-4 leading-relaxed text-xs">
              The event registration forms are currently offline. Super admins open registration periodically for specific trials and math events.
            </p>

            <div className="mt-8 p-5 bg-white/[0.01] rounded-2xl border border-white/5 flex items-start gap-3.5 text-left text-[11px] text-zinc-500 font-bold uppercase tracking-wide">
              <AlertCircle className="w-5 h-5 text-zinc-600 shrink-0" />
              <div>
                <span className="font-extrabold text-white block mb-0.5">Need Assistance?</span>
                For support or membership registration questions, please check announcements on the home dashboard or contact us at <a href="mailto:mathclub@sjs.edu.bd" className="font-semibold text-amber-500 hover:underline">mathclub@sjs.edu.bd</a>.
              </div>
            </div>
            
            <button
              onClick={() => router.push('/')}
              className="mt-8 inline-flex items-center justify-center px-8 py-4 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase tracking-wider rounded-xl transition-all duration-150 text-xs shadow-md shadow-amber-500/10"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const finalAmount = calculateAmount();

  return (
    <div className="relative min-h-screen bg-[#020202] text-white pt-36 pb-24 overflow-hidden">
      {/* Background Ambience */}
      <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-6-start)]/5 -top-48 -right-24 opacity-50" />
      <div className="atmospheric-glow w-[500px] h-[500px] bg-[var(--c-2-start)]/5 -bottom-48 -left-24 opacity-50" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        
        {/* Main Title Section */}
        <div className="text-center mb-12">
          <button 
            onClick={() => router.push('/events')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all mb-6"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Listing
          </button>
          
          <h1 className="text-4xl md:text-5xl font-display font-black uppercase tracking-tight mb-4">
            Event & Segment <span className="text-amber-500">Registration</span>
          </h1>
          <p className="text-zinc-500 uppercase tracking-widest text-[10px] font-bold">
            Josephite Math Club * Dynamic Checkout System
          </p>
        </div>

        {/* Existing Registered Events for Non-general members */}
        {!isGeneralMember && userRegisteredEvents.length > 0 && (
          <div className="mb-8 p-6 md:p-8 rounded-[2rem] bg-white/[0.02] border border-white/10 backdrop-blur-xl">
            <div className="flex items-center gap-3.5 mb-6 border-b border-white/5 pb-4">
              <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Your Registered Events</h3>
                <p className="text-[9px] text-[var(--c-6-start)] font-black uppercase tracking-widest mt-0.5">As a general registrant, your active transactions are displayed here</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userRegisteredEvents.map((reg) => {
                const events = (reg.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                return events.map((evt, idx) => (
                  <div key={`${reg.tableName}-${reg.id}-${idx}`} className="p-5 rounded-2xl bg-black/40 border border-white/5 flex flex-col justify-between gap-2 relative">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                        {reg.tableName === 'primary_events' ? 'Primary (Class 3-5)' :
                         reg.tableName === 'junior_events' ? 'Junior (Class 6-8)' :
                         reg.tableName === 'secondary_events' ? 'Secondary (Class 9-10)' :
                         'Higher Secondary (Class 11-12)'}
                      </p>
                      <p className="text-xs font-bold text-white mt-1">{evt}</p>
                      <p className="text-[9px] font-mono font-medium text-zinc-400 mt-0.5">TrxID: {reg.trxnid}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-500 font-sans">Status</span>
                      <span className={`text-[9px] font-bold uppercase tracking-wider ${
                        reg.verified === 'yes' ? 'text-green-400' :
                        reg.verified === 'rejected' ? 'text-red-400' : 'text-amber-400 animate-pulse'
                      }`}>
                        {reg.verified === 'yes' ? 'Verified' :
                         reg.verified === 'rejected' ? 'Rejected' : 'Verification Pending'}
                      </span>
                    </div>
                  </div>
                ));
              })}
            </div>
          </div>
        )}

        {isSuccess ? (
          /* SUCCESS SCREEN */
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-12 text-center max-w-2xl mx-auto rounded-[2.5rem] border border-green-500/30 bg-gradient-to-b from-[#0e2714]/60 to-[#020202]/90 flex flex-col items-center"
          >
            <div className="p-5 rounded-full bg-green-500/10 text-green-400 mb-8 animate-bounce">
              <CheckCircle2 className="w-16 h-16" />
            </div>
            
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
              {finalAmount === 0 ? "Entry Approved!" : "Successfully Submitted!"}
            </h2>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              {finalAmount === 0 ? (
                <span>
                  Hey <strong>{fullName}</strong>, your free entry for <strong className="text-amber-500">Math Olympiad</strong> is approved! We have <strong>automatically verified</strong> your spot and generated your digital ticket instantly.
                </span>
              ) : (
                <span>
                  Hey <strong>{fullName}</strong>, your transaction verification details (bKash number and transaction ID: <code>{trxnid}</code>) are saved successfully. Please allow up to a few hours for club administrators to verify and confirm your records in the <strong>{getTargetTable(className).split('_').join(' ').toUpperCase()}</strong>.
                </span>
              )}
            </p>

            <p className="text-amber-400 text-xs font-bold mb-8 uppercase tracking-wider bg-amber-500/5 px-6 py-3 rounded-xl border border-amber-500/10">
              {finalAmount === 0 ? (
                "You can view your ticket on the profile page or register for more events later!"
              ) : (
                "A notification email was fired. Confirmed events will list in your Profile section."
              )}
            </p>

            <button
              onClick={() => {
                window.location.href = '/profile';
              }}
              className="py-5 px-12 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(34,197,94,0.3)]"
            >
              Go to Profile
            </button>
          </motion.div>
        ) : (
          /* MAIN STEPPED FORM */
          <div className="glass-card rounded-[2.5rem] overflow-hidden border border-white/10 bg-[#020202]/95 shadow-[0_0_80px_rgba(0,0,0,0.8)]">
            
            {/* Elegant Header Progress Bar */}
            <div className="px-8 pt-8 pb-4 border-b border-white/5 bg-white/[0.01]">
              <div className="flex justify-between items-center mb-4 px-2">
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 1 ? 'text-amber-500' : 'text-zinc-600'}`}>
                  1. Profile Info
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 2 ? 'text-amber-500' : 'text-zinc-600'}`}>
                  2. Participation Options
                </span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= 3 ? 'text-amber-500' : 'text-zinc-600'}`}>
                  3. Payment Gateway
                </span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 rounded-full"
                  animate={{ width: `${(step / 3) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* STEP WRAPPER */}
            <div className="p-8 md:p-12">
              <AnimatePresence mode="wait">
                
                {/* STEP 1: GENERAL INFORMATION */}
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                        <User className="w-6 h-6 text-amber-500" /> General Information
                      </h2>
                      <p className="text-zinc-500 text-xs">
                        Enter your class credentials. General member profiles will automatically resolve from St Joseph archives.
                      </p>
                    </div>

                    {/* Admin/Super Admin Proxy Options */}
                    {(isAdmin || isSuperAdmin) && (
                      <div className="p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-white">Proxy / Spot Registration</h3>
                            <p className="text-[10px] text-zinc-400 mt-1">Admin feature: register segments on behalf of other students and auto-create spot accounts.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleToggleProxy(!isProxyRegistration)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-150 ${
                              isProxyRegistration 
                                ? 'bg-indigo-500 text-white shadow-lg' 
                                : 'bg-white/5 text-zinc-400 border border-white/5 hover:bg-white/10'
                            }`}
                          >
                            {isProxyRegistration ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>

                        {isProxyRegistration && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                            {/* Student Email Input */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Email Address</label>
                              <div className="flex gap-2">
                                <div className="relative flex-1">
                                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                  <input
                                    type="email"
                                    placeholder="student@example.com"
                                    value={proxyEmail}
                                    onChange={(e) => {
                                      setProxyEmail(e.target.value);
                                      setProxyVerified(false);
                                    }}
                                    className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
                                <button
                                  type="button"
                                  onClick={handleVerifyProxyEmail}
                                  disabled={checkingProxyEmail}
                                  className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                                >
                                  {checkingProxyEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                  Search
                                </button>
                              </div>
                            </div>

                            {/* Student Phone Number Field */}
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                                Student's Contact Phone Number {proxyVerified && !proxyUserExists && <span className="text-amber-500">(Password)</span>}
                              </label>
                              <div className="relative">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="text"
                                  placeholder="017XXXXXXXX"
                                  value={proxyPhoneNumber}
                                  onChange={(e) => setProxyPhoneNumber(e.target.value)}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isGeneralMember && !isProxyRegistration && (
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-4">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">JMC General Member Detected</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            Your Profile credentials are pre-populated. Selecting ALL events will qualify you for the exclusive <strong>50 BDT member bundle discount</strong>.
                          </p>
                        </div>
                      </div>
                    )}

                    {isProxyRegistration && proxyVerified && (
                      <div className={`p-5 rounded-2xl flex items-start gap-4 ${
                        proxyUserExists 
                          ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                          : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
                      }`}>
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">
                            {proxyUserExists ? 'Registered Account Found' : 'Unregistered Student Spot Mode'}
                          </p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {proxyUserExists 
                              ? 'Credentials pulled automatically from database archives. Form inputs are pre-populated & locked.' 
                              : 'This email is not registered in our database. Since a pre-registered account is not mandatory, manual credentials input is enabled. A new account will be auto-generated upon registration.'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      
                      {/* Name */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Full Name</label>
                        <div className="relative group">
                          <User className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            type="text"
                            placeholder="YOUR FULL NAME"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            disabled={(!isProxyRegistration && isGeneralMember) || (isProxyRegistration && (!proxyVerified || proxyUserExists))}
                            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      {/* Class */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Class (Numeric: 3 - 12)</label>
                        <div className="relative group">
                          <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                          <select 
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            disabled={(!isProxyRegistration && isGeneralMember) || (isProxyRegistration && (!proxyVerified || proxyUserExists))}
                            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60 appearance-none cursor-pointer"
                          >
                            <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase tracking-wider">SELECT CLASS</option>
                            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <option key={n} value={String(n)} className="bg-zinc-950 text-white font-extrabold uppercase">Class {n}</option>
                            ))}
                          </select>
                        </div>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                          Maps to events: 3-5 Primary | 6-8 Junior | 9-10 Secondary | 11-12 Higher Secondary
                        </p>
                      </div>

                      {/* Section */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Section</label>
                        <div className="relative group">
                          <Layers className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            type="text"
                            placeholder="YOUR SECTION (E.G. SC-A)"
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            disabled={(!isProxyRegistration && isGeneralMember) || (isProxyRegistration && (!proxyVerified || proxyUserExists))}
                            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      {/* Roll */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Class Roll</label>
                        <div className="relative group">
                          <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                          <input 
                            type="text"
                            placeholder="CLASS ROLL (E.G. 42)"
                            value={roll}
                            onChange={(e) => setRoll(e.target.value)}
                            disabled={(!isProxyRegistration && isGeneralMember) || (isProxyRegistration && (!proxyVerified || proxyUserExists))}
                            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60"
                          />
                        </div>
                      </div>

                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleNextStep1}
                        className="py-5 px-10 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-2 group"
                      >
                        Proceed to Events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: EVENT PARTICIPATION */}
                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-amber-500" /> Event Participation
                      </h2>
                      <p className="text-zinc-500 text-xs">
                        {formConfig.formDescription}
                      </p>
                    </div>

                    {/* Sub-tabs selection */}
                    <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10 max-w-md">
                      <button
                        onClick={() => handleSwitchTab('solo')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          eventTab === 'solo' 
                            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/25' 
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Solo Events
                      </button>
                      <button
                        onClick={() => handleSwitchTab('team')}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                          eventTab === 'team' 
                            ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/25' 
                            : 'text-zinc-500 hover:text-white'
                        }`}
                      >
                        Team Events
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      
                      {/* SOLO EVENTS SUBCONTENT */}
                      {eventTab === 'solo' ? (
                        <motion.div
                          key="solo-events"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          <div className="flex justify-between items-center bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                            <span className="text-xs font-bold text-zinc-400">
                              Selected <strong>{selectedEvents.length}</strong> / {availableSoloEvents.length} Available Solo Competitions
                            </span>
                            {availableSoloEvents.length > 0 && (
                              <button
                                onClick={handleSelectAll}
                                className="text-[10px] font-black uppercase text-amber-500 hover:text-amber-400 tracking-wider transition-colors"
                              >
                                {selectedEvents.length === availableSoloEvents.length ? "Deselect All" : "Select All Available"}
                              </button>
                            )}
                          </div>

                          {availableSoloEvents.length === 0 ? (
                            <div className="p-8 text-center rounded-3xl bg-green-500/5 border border-green-500/10 text-green-400 space-y-4">
                              <CheckCircle2 className="w-12 h-12 mx-auto text-green-400" />
                              <h3 className="text-lg font-black uppercase tracking-wider font-display">All Solo Competitions Registered</h3>
                              <p className="text-zinc-400 text-xs max-w-sm mx-auto leading-relaxed font-bold">
                                You have already registered for all available solo competitions! Check your profile page to access your ID card and transaction records.
                              </p>
                            </div>
                          ) : (
                            /* Grid with Checkboxes */
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
                              {SOLO_EVENTS.map((eventTitle) => {
                                const isAlreadyRegistered = alreadyRegisteredSolos.has(eventTitle.toLowerCase());
                                const isChecked = selectedEvents.includes(eventTitle);
                                
                                if (isAlreadyRegistered) {
                                  return (
                                    <div
                                      key={eventTitle}
                                      className="p-4 rounded-xl border border-white/5 bg-zinc-950/40 text-left flex items-center justify-between cursor-not-allowed opacity-50 select-none"
                                      title="Already Registered"
                                    >
                                      <div className="flex flex-col">
                                        <span className="text-xs font-bold text-zinc-500 line-through">{eventTitle}</span>
                                        <span className="text-[9px] text-green-500 font-bold uppercase tracking-wider mt-0.5">Registered</span>
                                      </div>
                                      <div className="w-5 h-5 rounded-full flex items-center justify-center border border-green-500/30 bg-green-500/10 text-green-500">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                  );
                                }

                                 return (
                                  <button
                                    key={eventTitle}
                                    onClick={() => handleToggleEvent(eventTitle)}
                                    className={`p-4 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                      isChecked 
                                        ? 'bg-amber-500/10 border-amber-500/30 text-white border-amber-500/40' 
                                        : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/10 hover:text-white'
                                    }`}
                                  >
                                    <div className="flex flex-col gap-0.5">
                                      <span className="text-xs font-bold">{eventTitle}</span>
                                      {eventTitle.toLowerCase() === "math olympiad" && (
                                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded w-max mt-1">
                                          FREE ENTRY
                                        </span>
                                      )}
                                    </div>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                      isChecked 
                                        ? 'bg-amber-500 border-transparent text-black' 
                                        : 'border-zinc-700 bg-black/40'
                                    }`}>
                                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          )}

                           {/* Price Tracker Badge card */}
                          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dynamic Valuation</p>
                              <p className="text-xs text-amber-500 font-bold mt-1">
                                {selectedEvents.length === 1 && selectedEvents[0].toLowerCase() === "math olympiad" ? (
                                  <span className="text-emerald-400 font-black uppercase">Math Olympiad is completely FREE. Grab your ticket now!</span>
                                ) : userRegisteredEvents.length > 0 ? (
                                  <span className="text-red-400 font-black uppercase">⚠️ Subsequent Registration Charge: 100 BDT applies!</span>
                                ) : (
                                  <span>
                                    🏅 Flat Participation Fee: Only <strong className="text-white">100 BDT</strong> total for selecting any number of solo events.
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Cost</p>
                              <p className="text-3xl font-display font-black text-white mt-1">
                                {finalAmount} <span className="text-xs font-bold uppercase">BDT</span>
                              </p>
                            </div>
                          </div>

                        </motion.div>
                      ) : (
                        /* TEAM EVENTS ACTIVE SECTION */
                        <motion.div
                          key="team-events"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="space-y-6"
                        >
                          {alreadyRegisteredTeam ? (
                            <div className="p-8 text-center rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 space-y-4">
                              <AlertCircle className="w-12 h-12 mx-auto text-indigo-400" />
                              <h3 className="text-lg font-black uppercase tracking-wider">Teammate Record Exists</h3>
                              <p className="text-zinc-400 text-xs max-w-md mx-auto leading-relaxed">
                                Our database suggests that you have already registered (or been registered by your team caption) for the team event: <strong className="text-amber-500 uppercase">{userRegisteredTeamEventName}</strong>.
                              </p>
                              <p className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">
                                Individuals are restricted to a single team event category.
                              </p>
                            </div>
                          ) : (
                            <>
                              <div className="bg-white/[0.02] p-5 rounded-2xl border border-white/5">
                                <p className="text-xs font-bold text-zinc-400">
                                  Select team category event available for your class level (Current: <strong className="text-amber-500">{className}</strong>).
                                </p>
                              </div>

                              <div className="grid grid-cols-1 gap-4">
                                {teamEventsList.filter(tc => tc.eligibleCategories === 'all' || tc.eligibleCategories === getCategoryType(className)).map((tc) => (
                                  <button
                                    key={tc.name}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEvents([tc.name]);
                                    }}
                                    className={`p-6 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                                      selectedEvents.includes(tc.name) 
                                        ? 'bg-indigo-500/10 border-indigo-500/30 text-white border-indigo-500/40' 
                                        : 'bg-white/5 border-transparent text-zinc-400 hover:border-white/10 hover:text-white'
                                    }`}
                                  >
                                    <div className="space-y-1">
                                      <span className="text-sm font-black block text-white">{tc.name} (BDT {tc.price})</span>
                                      <span className="text-xs text-zinc-500 block leading-relaxed">{tc.description || `Includes ${tc.memberCount} members.`}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
                                      selectedEvents.includes(tc.name) 
                                        ? 'bg-indigo-500 border-transparent text-white' 
                                        : 'border-zinc-700 bg-black/40'
                                    }`}>
                                      {selectedEvents.includes(tc.name) && <Check className="w-3.5 h-3.5 stroke-[4]" />}
                                    </div>
                                  </button>
                                ))}

                                {teamEventsList.filter(tc => tc.eligibleCategories === 'all' || tc.eligibleCategories === getCategoryType(className)).length === 0 && (
                                  <div className="p-8 text-center rounded-2xl bg-amber-500/5 border border-dashed border-amber-500/20 text-xs text-zinc-500">
                                    Please specify a numeric class (Class 3 - 12) in Step 1 to unlock your eligible team events.
                                  </div>
                                )}
                              </div>

                              {/* TEAMMATES DATA INPUT FIELDS */}
                              {selectedEvents.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: 15 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-6 pt-4"
                                >
                                  <div className="border-b border-white/5 pb-2">
                                    <h3 className="text-base font-black uppercase tracking-wider text-indigo-400 flex items-center gap-2">
                                      <User className="w-4 h-4" /> Team Members Profiles
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 mt-1 uppercase font-bold">
                                      Member 1 (Leader): {fullName} ({user?.email}) - Filled automatically
                                    </p>
                                  </div>

                                  {/* TEAMMATE 2 CARD */}
                                  <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">Team Member 2</h4>
                                      {member2Profile && (
                                        <div className="flex items-center gap-2">
                                          {member2Profile.isGeneralMember ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                              <CheckCircle2 className="w-2.5 h-2.5" /> JMC Member Auto-Pulled
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                              <AlertCircle className="w-2.5 h-2.5" /> Manual Entry Mode
                                            </span>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setMember2Profile(null);
                                              setTeamMember2Name('');
                                              setTeamMember2Class('');
                                              setTeamMember2Section('');
                                              setTeamMember2Roll('');
                                              setTeamMember2Email('');
                                            }}
                                            className="text-[9px] underline font-bold text-zinc-500 hover:text-zinc-300"
                                          >
                                            Change
                                          </button>
                                        </div>
                                      )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Email Address</label>
                                        <div className="flex gap-2">
                                          <div className="relative flex-1">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                              type="email"
                                              placeholder="teammate2@example.com"
                                              disabled={!!member2Profile}
                                              value={teamMember2Email}
                                              onChange={(e) => setTeamMember2Email(e.target.value)}
                                              className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            />
                                          </div>
                                          {!member2Profile && (
                                            <button
                                              type="button"
                                              onClick={() => verifyTeammateEmail(teamMember2Email, 2)}
                                              disabled={checkingTeammates}
                                              className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-500/10"
                                            >
                                              {checkingTeammates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                              Verify
                                            </button>
                                          )}
                                        </div>
                                        <p className="text-[9px] text-zinc-500">Verification checks general membership and loads records.</p>
                                      </div>

                                      <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Name</label>
                                        <div className="relative">
                                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                          <input
                                            type="text"
                                            placeholder={member2Profile ? "Member Name" : "Verify Email First"}
                                            disabled={!member2Profile || member2Profile.isGeneralMember}
                                            value={teamMember2Name}
                                            onChange={(e) => setTeamMember2Name(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                              (!member2Profile || member2Profile.isGeneralMember)
                                                ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                : 'text-white border-white/15'
                                            }`}
                                          />
                                        </div>
                                      </div>

                                      <div className="grid grid-cols-3 md:col-span-2 gap-3">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Class</label>
                                          <select
                                            disabled={!member2Profile || member2Profile.isGeneralMember}
                                            value={teamMember2Class}
                                            onChange={(e) => setTeamMember2Class(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                                              (!member2Profile || member2Profile.isGeneralMember)
                                                ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                : 'text-white border-white/15'
                                            }`}
                                          >
                                            <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">CLASS</option>
                                            {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                              <option key={n} value={String(n)} className="bg-zinc-950 text-white font-extrabold uppercase">Class {n}</option>
                                            ))}
                                          </select>
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Section</label>
                                          <input
                                            type="text"
                                            placeholder="Section"
                                            disabled={!member2Profile || member2Profile.isGeneralMember}
                                            value={teamMember2Section}
                                            onChange={(e) => setTeamMember2Section(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                              (!member2Profile || member2Profile.isGeneralMember)
                                                ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                : 'text-white border-white/15'
                                            }`}
                                          />
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Roll Number</label>
                                          <input
                                            type="text"
                                            placeholder="Roll"
                                            disabled={!member2Profile || member2Profile.isGeneralMember}
                                            value={teamMember2Roll}
                                            onChange={(e) => setTeamMember2Roll(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                              (!member2Profile || member2Profile.isGeneralMember)
                                                ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                : 'text-white border-white/15'
                                            }`}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* TEAMMATE 3 CARD (TIC-TAC-TOE ONLY) */}
                                  {selectedEvents.includes("Tic-Tac-Toe") && (
                                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                                      <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">Team Member 3</h4>
                                        {member3Profile && (
                                          <div className="flex items-center gap-2">
                                            {member3Profile.isGeneralMember ? (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle2 className="w-2.5 h-2.5" /> JMC Member Auto-Pulled
                                              </span>
                                            ) : (
                                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                                <AlertCircle className="w-2.5 h-2.5" /> Manual Entry Mode
                                              </span>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setMember3Profile(null);
                                                setTeamMember3Name('');
                                                setTeamMember3Class('');
                                                setTeamMember3Section('');
                                                setTeamMember3Roll('');
                                                setTeamMember3Email('');
                                              }}
                                              className="text-[9px] underline font-bold text-zinc-500 hover:text-zinc-300"
                                            >
                                              Change
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Email Address</label>
                                          <div className="flex gap-2">
                                            <div className="relative flex-1">
                                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                              <input
                                                type="email"
                                                placeholder="teammate3@example.com"
                                                disabled={!!member3Profile}
                                                value={teamMember3Email}
                                                onChange={(e) => setTeamMember3Email(e.target.value)}
                                                className="w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                              />
                                            </div>
                                            {!member3Profile && (
                                              <button
                                                type="button"
                                                onClick={() => verifyTeammateEmail(teamMember3Email, 3)}
                                                disabled={checkingTeammates}
                                                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-indigo-500/10"
                                              >
                                                {checkingTeammates ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                Verify
                                              </button>
                                            )}
                                          </div>
                                          <p className="text-[9px] text-zinc-500">Verification checks general membership and loads records.</p>
                                        </div>

                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Name</label>
                                          <div className="relative">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                              type="text"
                                              placeholder={member3Profile ? "Member Name" : "Verify Email First"}
                                              disabled={!member3Profile || member3Profile.isGeneralMember}
                                              value={teamMember3Name}
                                              onChange={(e) => setTeamMember3Name(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                                (!member3Profile || member3Profile.isGeneralMember)
                                                  ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                  : 'text-white border-white/15'
                                              }`}
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-3 md:col-span-2 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Class</label>
                                            <select
                                              disabled={!member3Profile || member3Profile.isGeneralMember}
                                              value={teamMember3Class}
                                              onChange={(e) => setTeamMember3Class(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                                                (!member3Profile || member3Profile.isGeneralMember)
                                                  ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                  : 'text-white border-white/15'
                                              }`}
                                            >
                                              <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">CLASS</option>
                                              {[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                                                <option key={n} value={String(n)} className="bg-zinc-950 text-white font-extrabold uppercase">Class {n}</option>
                                              ))}
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Section</label>
                                            <input
                                              type="text"
                                              placeholder="Section"
                                              disabled={!member3Profile || member3Profile.isGeneralMember}
                                              value={teamMember3Section}
                                              onChange={(e) => setTeamMember3Section(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                                (!member3Profile || member3Profile.isGeneralMember)
                                                  ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                  : 'text-white border-white/15'
                                              }`}
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Roll Number</label>
                                            <input
                                              type="text"
                                              placeholder="Roll"
                                              disabled={!member3Profile || member3Profile.isGeneralMember}
                                              value={teamMember3Roll}
                                              onChange={(e) => setTeamMember3Roll(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                                (!member3Profile || member3Profile.isGeneralMember)
                                                  ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                  : 'text-white border-white/15'
                                              }`}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                  {/* Team Price Tracker Badge card */}
                                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                    <div>
                                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Dynamic Valuation</p>
                                      <p className="text-xs text-indigo-400 font-bold mt-1">
                                        🛡️ Team Package Rate: {selectedEvents[0]} includes {teamEventsList.find(tc => tc.name === selectedEvents[0])?.memberCount || 2} members total at {finalAmount}tk. All teammates registered instantly!
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Estimated Cost</p>
                                      <p className="text-3xl font-display font-black text-white mt-1">
                                        {finalAmount} <span className="text-xs font-bold uppercase">BDT</span>
                                      </p>
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </>
                          )}
                        </motion.div>
                      )}

                    </AnimatePresence>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => setStep(1)}
                        className="py-5 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleNextStep2}
                        disabled={selectedEvents.length === 0}
                        className="py-5 px-10 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Continue to Checkout <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>

                  </motion.div>
                )}

                {/* STEP 3: PAYMENT AND CHECKOUT */}
                {step === 3 && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="space-y-8"
                  >
                    <div>
                      <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-2 flex items-center gap-2">
                        <QrCode className="w-6 h-6 text-amber-500" /> Payment & Checkout
                      </h2>
                      <p className="text-zinc-500 text-xs">
                        Execute transaction via bKash. Standard verification will be logged for audits.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Checkout Stats */}
                      <div className="p-8 rounded-3xl bg-white/[0.01] border border-white/10 space-y-6">
                        <h3 className="text-xs font-black uppercase tracking-widest text-zinc-500">Order Summary</h3>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                            <span>Participant Name:</span>
                            <span className="text-white">{fullName}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                            <span>Academic Status:</span>
                            <span className="text-white">Class {className} (Sec {section}, Roll {roll})</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                            <span>Events Selected ({selectedEvents.length}):</span>
                            <span className="text-white text-right max-w-[200px] truncate block">{selectedEvents.join(', ')}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
                            <span>Supabase Group:</span>
                            <span className="text-amber-500 font-extrabold uppercase">{getTargetTable(className).split('_').join(' ')}</span>
                          </div>
                        </div>



                        <div className="pt-6 border-t border-white/5 flex justify-between items-center">
                          <span className="text-sm font-bold text-zinc-400">Amount Due:</span>
                          <span className="text-4xl font-display font-black text-amber-500">
                            {finalAmount} BDT
                          </span>
                        </div>
                      </div>

                      {/* Payment inputs */}
                      <form onSubmit={handleSubmitRegistration} className="space-y-6">
                        {isProxyRegistration ? (
                          <div className="bg-indigo-500/10 p-6 rounded-3xl border border-indigo-500/20 text-indigo-400 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">ADMINISTRATOR PROXY MODE ACTIVE</p>
                            <p className="text-xs leading-relaxed text-zinc-400 font-medium">
                              You are executing a proxy registration for this student. No bKash mobile number or transaction ID is required. All chosen events will be automatically verified and approved instantly.
                            </p>
                          </div>
                        ) : finalAmount === 0 ? (
                          <div className="bg-green-500/5 p-6 rounded-3xl border border-green-500/20 text-green-400 space-y-3">
                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400">FREE CO-PARTICIPATION BENEFITS</p>
                            <p className="text-xs leading-relaxed text-zinc-400 font-medium">
                              Because you selected <strong className="text-amber-500 uppercase">Math Olympiad</strong> exclusively, entry is completely free. No bKash payment, transaction tracking, or manual verification is needed. This ticket will be auto-approved instantly upon submission!
                            </p>
                          </div>
                        ) : (
                          <>
                            <div className="bg-amber-500/5 p-5 rounded-3xl border border-amber-500/10">
                              <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Instructions</p>
                              <ol className="text-[10px] space-y-2 text-zinc-400 list-decimal pl-4 font-bold">
                                <li>Send BDT <strong className="text-white">{finalAmount}</strong> to bKash Number: <strong className="text-white">{formConfig.bkashNumber}</strong> (Send Money)</li>
                                <li>Type your Send Money transaction ID (TrxID) and mobile number details below.</li>
                                <li>An administrator will perform confirmation checks on the bank ledger.</li>
                              </ol>
                            </div>

                            {/* bKash Phone */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">bKash Phone Number</label>
                              <div className="relative group">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                  type="tel"
                                  placeholder="01XXXXXXXXX"
                                  value={bkashNumber}
                                  onChange={(e) => setBkashNumber(e.target.value)}
                                  className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600"
                                />
                              </div>
                            </div>

                            {/* TrxID */}
                            <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Transaction ID (TrxID)</label>
                              <div className="relative group">
                                <Hash className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                                <input 
                                  type="text"
                                  placeholder="E.G. A1B2C3D4E5"
                                  value={trxnid}
                                  onChange={(e) => setTrxnid(e.target.value.toUpperCase())}
                                  className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={submitting}
                          className="w-full py-5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_40px_rgba(245,158,11,0.25)] flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting Request...
                            </>
                          ) : (
                            <>
                              Confirm & Register <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-4 border-t border-white/5">
                      <button
                        onClick={() => setStep(2)}
                        disabled={submitting}
                        className="py-5 px-8 rounded-2xl bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white font-black text-xs uppercase tracking-[0.2em] transition-all border border-white/10 disabled:opacity-50"
                      >
                        Back
                      </button>
                    </div>

                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </div>
        )}

      </div>

      {/* Dynamic Segment Confirmation Modal */}
      <AnimatePresence>
        {showConfirmSegmentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="w-full max-w-md bg-[#0d0d0d] border border-white/10 rounded-3xl p-8 relative overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.1)] text-center"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
              
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-8 h-8" />
              </div>

              <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mb-3">
                Are you absolutely sure?
              </h3>
              
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                You can <strong className="text-white">only register for segments once</strong>. 
                Before submitting, make sure you have selected all desired segments. If you decide to register for more segments later on, you will have to pay another <strong className="text-amber-500">100 BDT flat charge (fine/penalty)</strong>.
              </p>

              <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-6 text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Currently Selected Segments</p>
                <p className="text-xs font-black text-white">
                  {selectedEvents.join(', ') || 'None'}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => {
                    setShowConfirmSegmentModal(false);
                    setHasConfirmedSegments(true);
                    handleSubmitRegistration(undefined, true);
                  }}
                  className="w-full py-4.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-[0.2em] transition-all"
                >
                  Yes, I'm Sure. Register Now
                </button>
                
                <button
                  onClick={() => setShowConfirmSegmentModal(false)}
                  className="w-full py-4.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-[0.2em] border border-white/10 transition-all"
                >
                  No, Let me select more
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EventRegister;
