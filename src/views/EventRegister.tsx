"use client";
import React, { useState, useEffect, useCallback } from 'react';
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
  Calendar,
  RefreshCw,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { useToast } from '../context/ToastContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import ScrollReveal from '../components/ScrollReveal';
import { cleanDisplayEmail } from '../lib/utils';
import InterEventRegister from './InterEventRegister';

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

const DEFAULT_CLASS_SECTIONS: Record<string, string[]> = {
  "3": ["Hawks", "Eagles", "Falcons"],
  "4": ["Tigers", "Lions", "Mountain Lions"],
  "5": ["Hornets", "Drones", "Wasps"],
  "6": ["Wildcats", "Bears", "Polar Bears"],
  "7": ["Leopards", "Jaguars"],
  "8": ["Comets", "Meteors", "Asteroids"],
  "9": ["Jets", "Concords", "Rockets"],
  "10": ["Stars", "Giants", "Titans"],
  "11": ["Venus", "Jupiter", "Mercury", "Haumea", "Eris", "Mars", "Saturn", "Vulcan"],
  "12": ["Pluto", "Uranus", "Phobos", "Pollux", "Ceres", "Earth", "Neptune", "Diebos"]
};

const EventRegister = () => {
  const { user, profile, loading: authLoading, isAdmin, isSuperAdmin } = useAuth();
  const { content, loading: contentLoading } = useContent();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Inter Mode States
  const isInterParam = searchParams ? searchParams.get('type') === 'inter' : false;
  const [isInterMode, setIsInterMode] = useState(isInterParam);
  const [interIsGeneralMemberQuestion, setInterIsGeneralMemberQuestion] = useState<boolean | null>(null);
  const [interGeneralMemberEmail, setInterGeneralMemberEmail] = useState('');
  const [interVerifyingEmail, setInterVerifyingEmail] = useState(false);
  const [interEmailVerified, setInterEmailVerified] = useState(false);
  const [interUniqueId, setInterUniqueId] = useState('');
  const [interAccountEmail, setInterAccountEmail] = useState('');
  const [interAccountPassword, setInterAccountPassword] = useState('');

  useEffect(() => {
    if (searchParams) {
      const type = searchParams.get('type');
      if (type === 'inter') {
        setIsInterMode(true);
      }
    }
  }, [searchParams]);

  // Dynamic config states loaded from db
  const [soloEventsList, setSoloEventsList] = useState<string[]>(SOLO_EVENTS);
  const [teamEventsList, setTeamEventsList] = useState<any[]>(DEFAULT_TEAM_EVENTS);
  const [classSectionsMap, setClassSectionsMap] = useState<Record<string, string[]>>(DEFAULT_CLASS_SECTIONS);
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
  const [phone, setPhone] = useState('');
  
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
  const [guestEmail, setGuestEmail] = useState('');
  const [wasGuestRegistered, setWasGuestRegistered] = useState(false);
  const [showConfirmSegmentModal, setShowConfirmSegmentModal] = useState(false);
  const [hasConfirmedSegments, setHasConfirmedSegments] = useState(false);

  // EC member check states
  const [isCurrentUserEc, setIsCurrentUserEc] = useState(false);
  const [currentUserEcId, setCurrentUserEcId] = useState<string | null>(null);
  const [isProxyUserEc, setIsProxyUserEc] = useState(false);
  const [proxyUserEcId, setProxyUserEcId] = useState<string | null>(null);

  // Admin Proxy/Spot Registration States
  const [isProxyRegistration, setIsProxyRegistration] = useState(false);
  const [proxyMethod, setProxyMethod] = useState<'email' | 'phone'>('email');
  const [proxyEmail, setProxyEmail] = useState('');
  const [proxyPhoneNumber, setProxyPhoneNumber] = useState('');
  const [proxyVerified, setProxyVerified] = useState(false);
  const [proxyUserExists, setProxyUserExists] = useState(false);
  const [proxyResolvedUserId, setProxyResolvedUserId] = useState<string | null>(null);
  const [checkingProxyEmail, setCheckingProxyEmail] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [proxyNameEditable, setProxyNameEditable] = useState(true);
  const [proxyClassEditable, setProxyClassEditable] = useState(true);
  const [proxySectionEditable, setProxySectionEditable] = useState(true);
  const [proxyRollEditable, setProxyRollEditable] = useState(true);

  // Verification of general member email for inter mode
  const handleVerifyInterGeneralMemberEmail = async () => {
    if (!interGeneralMemberEmail.trim() || !interGeneralMemberEmail.includes('@')) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    setInterVerifyingEmail(true);
    try {
      const { data: memberData, error } = await supabase
        .from('member')
        .select('*')
        .or(`email_address.eq.${interGeneralMemberEmail.trim().toLowerCase()},email.eq.${interGeneralMemberEmail.trim().toLowerCase()}`)
        .eq('verified', 'yes')
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (memberData) {
        setIsGeneralMember(true);
        setInterEmailVerified(true);
        
        // Auto-fill their details if they exist to make registration ultra-smooth!
        if (memberData.full_name) setFullName(memberData.full_name);
        if (memberData.class) setClassName(memberData.class);
        if (memberData.section) setSection(memberData.section);
        if (memberData.roll) setRoll(memberData.roll);
        if (memberData.phone) setPhone(memberData.phone);
        // Also set guest email since they register as visitor/guest
        setGuestEmail(interGeneralMemberEmail.trim().toLowerCase());

        showToast("Success! Your General Membership was verified. 50% discount applied!", "success");
      } else {
        showToast("No verified General Membership found with this email. Please check spelling or select 'No'.", "error");
      }
    } catch (err: any) {
      console.error("Error verifying general member email:", err);
      showToast("Verification failed. Please try again or select 'No'.", "error");
    } finally {
      setInterVerifyingEmail(false);
    }
  };

  // General Member Check on Load
  const fetchMemberInfo = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setFetchingMemberStatus(false);
      return;
    }
    setFetchingMemberStatus(true);
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
        setPhone(activeData.phone || '');
        
        if (activeData.verified === 'yes') {
          setIsGeneralMember(true);
          setInterIsGeneralMemberQuestion(true);
          setInterEmailVerified(true);
          setInterGeneralMemberEmail(activeData.email_address || activeData.email || user.email || '');
        }
      }
    } catch (err) {
      console.error("Error fetching member info:", err);
    } finally {
      setFetchingMemberStatus(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMemberInfo();
    } else if (!authLoading) {
      setFetchingMemberStatus(false);
    }
  }, [user, authLoading, fetchMemberInfo]);

  // Reactive Registered Events Check for active student (supports Proxy and Spot mode)
  const fetchRegisteredEvents = useCallback(async () => {
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
  }, [isProxyRegistration, proxyUserExists, proxyResolvedUserId, user, teamEventsList]);

  useEffect(() => {
    fetchRegisteredEvents();
  }, [fetchRegisteredEvents]);

  const handleManualRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchMemberInfo(),
        fetchRegisteredEvents()
      ]);
      showToast("Registration status and events synced successfully!", "success");
    } catch (e) {
      showToast("Failed to refresh database state.", "error");
    } finally {
      setIsRefreshing(false);
    }
  };

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
          if (val.classSectionsMap && typeof val.classSectionsMap === 'object' && !Array.isArray(val.classSectionsMap)) {
            setClassSectionsMap(val.classSectionsMap);
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
    // Non-logged-in users are allowed to register for events without an account.
    // An account will be automatically generated for them upon form submission.
    if (!user && !authLoading) {
      console.log("Guest mode active: user is unregistered/not logged in.");
    }
  }, [user, authLoading]);

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
    let basePrice = 0;
    if (eventTab === 'team') {
      const match = teamEventsList.find(tc => selectedEvents.includes(tc.name));
      basePrice = match ? match.price : 0;
    } else {
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
        basePrice = 100;
      } else if (isGeneralMember && N === soloEventsList.length) {
        basePrice = formConfig.allEventsSoloPriceMember || 50;
      } else {
        basePrice = 100;
      }
    }

    // Apply 50% discount for general members in inter-school registration
    if (isInterMode && isGeneralMember) {
      return basePrice * 0.5;
    }

    return basePrice;
  };

  const handleSwitchTab = (tab: 'solo' | 'team') => {
    setEventTab(tab);
    setSelectedEvents([]); // reset selections to ensure strict separation of billing models
  };

  const verifyTeammateEmail = async (email: string, memberNum: 2 | 3) => {
    const trimmedInput = (email || '').trim();
    if (!trimmedInput) {
      showToast("Please enter a valid teammate email address, phone, or Full Name.", "error");
      return;
    }

    const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);
    const isEmailInput = trimmedInput.includes('@');
    const isNameInput = !isPhoneInput && !isEmailInput;
    
    setCheckingTeammates(true);
    try {
      let trimmedEmail = trimmedInput.toLowerCase();
      if (isPhoneInput) {
        trimmedEmail = `${trimmedInput.toLowerCase()}@josephitre.club`;
      }

      const slugifyName = (name: string): string => {
        return (name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '_')
          .replace(/__+/g, '_')
          .replace(/^_+|_+$/g, '');
      };

      let memberData: any = null;
      let ecData: any = null;
      let profileData: any = null;

      if (isNameInput) {
        const slug = slugifyName(trimmedInput);
        const virtualEmail = `${slug}@josephitre.club`;

        // Look up member by full name or virtual email
        const { data: mList } = await supabase
          .from('member')
          .select('*')
          .or(`full_name.ilike.%${trimmedInput}%,email.eq.${virtualEmail},email_address.eq.${virtualEmail}`)
          .limit(1);
        if (mList && mList.length > 0) memberData = mList[0];

        const { data: eList } = await supabase
          .from('ec_member')
          .select('*')
          .or(`full_name.ilike.%${trimmedInput}%,email.eq.${virtualEmail},email_address.eq.${virtualEmail}`)
          .limit(1);
        if (eList && eList.length > 0) ecData = eList[0];

        const { data: pList } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .or(`full_name.ilike.%${trimmedInput}%,email.eq.${virtualEmail}`)
          .limit(1);
        if (pList && pList.length > 0) profileData = pList[0];
      } else {
        // Look up member by email or phone
        const { data: mList } = await supabase
          .from('member')
          .select('*')
          .or(`email.eq.${trimmedEmail},email_address.eq.${trimmedEmail}${isPhoneInput ? `,phone.eq.${trimmedInput}` : ''}`);
        
        if (mList && mList.length > 1) {
          showToast(`Multiple general members found with this email. We loaded the first one. For specificity, search by teammate's Full Name.`, "info");
          memberData = mList[0];
        } else if (mList && mList.length === 1) {
          memberData = mList[0];
        }

        const { data: eList } = await supabase
          .from('ec_member')
          .select('*')
          .or(`email.eq.${trimmedEmail},email_address.eq.${trimmedEmail}${isPhoneInput ? `,phone.eq.${trimmedInput}` : ''}`);
        
        if (eList && eList.length > 1) {
          ecData = eList[0];
        } else if (eList && eList.length === 1) {
          ecData = eList[0];
        }

        const { data: pList } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('email', trimmedEmail);
        
        if (pList && pList.length > 0) {
          profileData = pList[0];
        }
      }

      const activeTeammateData = ecData || memberData;

      if (activeTeammateData && activeTeammateData.verified === 'yes') {
        // They are registered and verified as a member! Pull credentials automatically
        const resolvedName = activeTeammateData.full_name || '';
        const resolvedClass = activeTeammateData.class || '';
        const resolvedSection = activeTeammateData.section || '';
        const resolvedRoll = activeTeammateData.roll || '';
        const teammateEmailAddress = activeTeammateData.email_address || activeTeammateData.email || trimmedEmail;

        if (memberNum === 2) {
          setMember2Profile({ id: activeTeammateData.id, email: teammateEmailAddress, isGeneralMember: true });
          setTeamMember2Name(resolvedName);
          setTeamMember2Class(resolvedClass);
          setTeamMember2Section(resolvedSection);
          setTeamMember2Roll(resolvedRoll);
        } else {
          setMember3Profile({ id: activeTeammateData.id, email: teammateEmailAddress, isGeneralMember: true });
          setTeamMember3Name(resolvedName);
          setTeamMember3Class(resolvedClass);
          setTeamMember3Section(resolvedSection);
          setTeamMember3Roll(resolvedRoll);
        }
        showToast(`Teammate ${memberNum} verified as Member! Credentials pulled.`, "success");
      } else {
        const resolvedName = profileData?.full_name || '';
        const teammateEmailAddress = profileData?.email || trimmedEmail;

        if (memberNum === 2) {
          setMember2Profile({ id: profileData?.id || null, email: teammateEmailAddress, isGeneralMember: false });
          setTeamMember2Name(resolvedName);
          setTeamMember2Class('');
          setTeamMember2Section('');
          setTeamMember2Roll('');
        } else {
          setMember3Profile({ id: profileData?.id || null, email: teammateEmailAddress, isGeneralMember: false });
          setTeamMember3Name(resolvedName);
          setTeamMember3Class('');
          setTeamMember3Section('');
          setTeamMember3Roll('');
        }
        
        if (profileData) {
          showToast(`Teammate ${memberNum} has an account but is not an active General Member. Name auto-loaded. Please manually enter Class, Section, and Roll.`, "info");
        } else {
          showToast(`Teammate ${memberNum} details not found. Please manually input their Name, Class, Section, and Roll.`, "info");
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
    setProxyMethod('email');
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
    setProxyNameEditable(true);
    setProxyClassEditable(true);
    setProxySectionEditable(true);
    setProxyRollEditable(true);

    if (!checked) {
      if (registeredMemberData) {
        setFullName(registeredMemberData.full_name || '');
        setClassName(registeredMemberData.class || '');
        setSection(registeredMemberData.section || '');
        setRoll(registeredMemberData.roll || '');
        setPhone(registeredMemberData.phone || '');
        setIsGeneralMember(registeredMemberData.verified === 'yes');
      } else {
        setFullName('');
        setClassName('');
        setSection('');
        setRoll('');
        setPhone('');
        setIsGeneralMember(false);
      }
    } else {
      setFullName('');
      setClassName('');
      setSection('');
      setRoll('');
      setPhone('');
      setIsGeneralMember(false);
    }
  };

  const handleVerifyProxyEmail = async () => {
    let trimmedInput = '';
    if (proxyMethod === 'phone') {
      trimmedInput = (proxyPhoneNumber || '').trim();
      if (!trimmedInput || trimmedInput.length < 11) {
        showToast("Please enter a valid student phone number (at least 11 digits).", "error");
        return;
      }
    } else {
      trimmedInput = (proxyEmail || '').trim();
      if (!trimmedInput) {
        showToast("Please enter a valid email address.", "error");
        return;
      }
      const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);
      if (!isPhoneInput && !trimmedInput.includes('@')) {
        showToast("Please enter a valid email address or phone number.", "error");
        return;
      }
    }

    setCheckingProxyEmail(true);
    try {
      let profileCheck = null;
      let memberCheck = null;
      let ecCheck = null;
      const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);

      if (proxyMethod === 'phone') {
        // Search by phone
        const { data: mCheck } = await supabase
          .from('member')
          .select('*')
          .eq('phone', trimmedInput)
          .maybeSingle();
        memberCheck = mCheck;

        const { data: eCheck } = await supabase
          .from('ec_member')
          .select('*')
          .eq('phone', trimmedInput)
          .maybeSingle();
        ecCheck = eCheck;

        const resolvedId = ecCheck?.id || memberCheck?.id;
        if (resolvedId) {
          const { data: pCheck } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', resolvedId)
            .maybeSingle();
          profileCheck = pCheck;
        } else {
          // Check profiles if there's an account with email: phone@josephitre.club
          const { data: pCheck } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', `${trimmedInput}@josephitre.club`)
            .maybeSingle();
          profileCheck = pCheck;
          if (profileCheck) {
            const { data: mCheck } = await supabase
              .from('member')
              .select('*')
              .eq('id', profileCheck.id)
              .maybeSingle();
            memberCheck = mCheck;
          }
        }
      } else {
        // Search by email
        let emailToCheck = trimmedInput.toLowerCase();
        const originalPhone = trimmedInput;

        if (isPhoneInput) {
          emailToCheck = `${trimmedInput.toLowerCase()}@josephitre.club`;
        }
        
        const { data: pCheck, error: pError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', emailToCheck)
          .maybeSingle();

        if (pError) throw pError;
        profileCheck = pCheck;

        const { data: mCheck } = await supabase
          .from('member')
          .select('*')
          .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}${isPhoneInput ? `,phone.eq.${originalPhone}` : ''}`)
          .maybeSingle();
        memberCheck = mCheck;

        const { data: eCheck } = await supabase
          .from('ec_member')
          .select('*')
          .or(`email.eq.${emailToCheck},email_address.eq.${emailToCheck}${isPhoneInput ? `,phone.eq.${originalPhone}` : ''}`)
          .maybeSingle();
        ecCheck = eCheck;
      }

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
        setProxyPhoneNumber(matchedPhone || (proxyMethod === 'phone' ? trimmedInput : (isPhoneInput ? trimmedInput : '')));
        setProxyResolvedUserId(profileCheck?.id || activeMember?.id || null);
        setProxyUserExists(true);
        setProxyVerified(true);
        setIsGeneralMember(matchedMemberVerified);

        // Editability is determined by whether the pulled values are blank/falsy
        setProxyNameEditable(!matchedName);
        setProxyClassEditable(!matchedClass);
        setProxySectionEditable(!matchedSection);
        setProxyRollEditable(!matchedRoll);

        showToast("Registered student found! General information auto-populated.", "success");
      } else {
        setProxyUserExists(false);
        setProxyVerified(true);
        setProxyResolvedUserId(null);
        setFullName('');
        setClassName('');
        setSection('');
        setRoll('');
        setProxyPhoneNumber(proxyMethod === 'phone' ? trimmedInput : (isPhoneInput ? trimmedInput : ''));
        setIsGeneralMember(false);
        setIsProxyUserEc(false);
        setProxyUserEcId(null);
        
        // In spot mode, everything is editable
        setProxyNameEditable(true);
        setProxyClassEditable(true);
        setProxySectionEditable(true);
        setProxyRollEditable(true);

        showToast("Student not registered. Manual spot registration mode activated.", "info");
      }
    } catch (err: any) {
      console.error("Error verifying proxy email:", err);
      showToast("Proxy verification failed: " + err.message, "error");
    } finally {
      setCheckingProxyEmail(false);
    }
  };

  const handleNextStep1 = () => {
    if (isInterMode) {
      if (interIsGeneralMemberQuestion === null) {
        showToast("Please select whether you are a JMC General Member.", "error");
        return;
      }
      if (interIsGeneralMemberQuestion === true && !interEmailVerified) {
        showToast("Please enter and verify your General Member email address to proceed.", "error");
        return;
      }
    }

    if (isProxyRegistration) {
      if (proxyMethod === 'phone') {
        if (!proxyPhoneNumber.trim() || proxyPhoneNumber.trim().length < 11) {
          showToast("Please enter a valid student phone number (at least 11 digits).", "error");
          return;
        }
      } else {
        const trimmedInput = proxyEmail.trim();
        const isPhoneInput = !trimmedInput.includes('@') && /^[0-9+\s\-()]+$/.test(trimmedInput);
        if (!trimmedInput || (!trimmedInput.includes('@') && !isPhoneInput)) {
          showToast("Please enter a valid student email address.", "error");
          return;
        }
      }
      if (!proxyVerified) {
        showToast("Please search and verify the student's credentials first.", "error");
        return;
      }
      if (!proxyPhoneNumber.trim() || proxyPhoneNumber.trim().length < 11) {
        showToast("Please enter a valid student contact phone number (at least 11 digits).", "error");
        return;
      }
    }

    if (!user) {
      if (!guestEmail.trim() || !guestEmail.includes('@')) {
        showToast("Please enter a valid email address to auto-generate your account.", "error");
        return;
      }
    }

    if (!fullName.trim() || !className.trim() || !section.trim() || !roll.trim() || (!isProxyRegistration && !phone.trim())) {
      showToast("Please fill all general information fields (including phone number) to proceed.", "error");
      return;
    }

    if (!isProxyRegistration && phone.trim().length < 11) {
      showToast("Please enter a valid student contact phone number (at least 11 digits).", "error");
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

    if (!selectedEvents || selectedEvents.length === 0) {
      showToast("Please select at least one segment/event to register.", "error");
      return;
    }

    if (!fullName || !fullName.trim()) {
      showToast("Please enter your full name.", "error");
      return;
    }
    if (/\s/.test(fullName)) {
      showToast("Please type in your name without spaces or just type in your surname", "error");
      return;
    }
    if (!className || !className.trim()) {
      showToast("Please select your class.", "error");
      return;
    }
    if (!section || !section.trim()) {
      showToast("Please enter your section.", "error");
      return;
    }
    if (!roll || !roll.trim()) {
      showToast("Please enter your roll number.", "error");
      return;
    }

    // Check if we need to confirm solo segments before submitting
    if (eventTab === 'solo' && !hasConfirmedSegments && !bypassConfirm) {
      setShowConfirmSegmentModal(true);
      return;
    }

    const finalPrice = calculateAmount();
    const isOnlyFreeMathOlympiad = selectedEvents.length === 1 && selectedEvents[0]?.trim().toLowerCase() === "math olympiad" && finalPrice === 0;

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
        showToast("Please enter a valid bKash Sender Phone Number (at least 11 digits).", "error");
        return;
      }
      if (!finalTrxnid || finalTrxnid.length < 8) {
        showToast("Please enter a valid Transaction ID (at least 8 characters).", "error");
        return;
      }
    }

    setSubmitting(true);
    try {
      const targetTable = getTargetTable(className);
      if (!user) {
        // Guest user flow: Register via our custom guest registration API
        const response = await fetch('/api/events/register-guest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: guestEmail.trim(),
            phone: phone.trim(),
            className,
            section,
            roll,
            bkashNumber: finalBkashNumber,
            trxnid: finalTrxnid,
            amount: finalPrice,
            selectedEvents,
            eventTab
          })
        });

        const resData = await response.json();
        if (!response.ok) {
          throw new Error(resData.error || "Failed to submit registration.");
        }

        // If team events, save teammate records using the existing teammate endpoint
        if (eventTab === 'team') {
          const teammatesList = [];
          if (member2Profile) {
            teammatesList.push({
              id: member2Profile.id,
              email: member2Profile.email,
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
              email: member3Profile.email,
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

        // Auto login the newly created guest user!
        showToast("Account automatically generated. Logging in...", "success");
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: resData.virtualEmail,
            password: phone.trim()
          });

          if (signInError) {
            console.error("Auto login failed:", signInError);
            showToast("Account created! Please sign in using your phone number as password.", "info");
          } else {
            showToast("Welcome! You are now logged in.", "success");
          }
        } catch (loginErr) {
          console.error("Auto login error caught:", loginErr);
        }

        if (resData.memberId) setInterUniqueId(resData.memberId);
        setInterAccountEmail(guestEmail.trim());
        setInterAccountPassword(phone.trim());
        setWasGuestRegistered(true);
        setIsSuccess(true);
        setSubmitting(false);
        return;
      }

      let finalUserId = user?.id;

      const getVirtualEmail = (val: string) => {
        const trimmed = val.trim().toLowerCase();
        const isPhoneInput = !trimmed.includes('@') && /^[0-9+\s\-()]+$/.test(trimmed);
        return isPhoneInput ? `${trimmed}@josephitre.club` : trimmed;
      };

      if (isProxyRegistration) {
        if (!proxyUserExists || !proxyResolvedUserId) {
          // Trigger spot registration: Call admin create-user route!
          const createRes = await fetch('/api/admin/create-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : getVirtualEmail(proxyEmail),
              password: proxyPhoneNumber.trim(),
              fullName: fullName.trim(),
              usePhoneAsLogin: proxyMethod === 'phone'
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

      // Use targetTable declared at the top of the try block
      
      const payload: any = {
        user_id: finalUserId,
        full_name: fullName,
        class: className,
        section: section,
        roll: roll,
        phone: isProxyRegistration ? proxyPhoneNumber : phone.trim(),
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
            email: member2Profile.email,
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
            email: member3Profile.email,
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
      const realUserEmail = registeredMemberData?.email || user?.email || '';
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

            // If they selected the free Math Olympiad or was registered via proxy, update details and auto-verify membership!
            const updateFields: any = {};
            if (fullName) updateFields.full_name = fullName;
            if (className) updateFields.class = className;
            if (section) updateFields.section = section;
            if (roll) updateFields.roll = roll;
            if (isOnlyFreeMathOlympiad || isProxyRegistration) {
              updateFields.verified = 'yes';
            }

            if (Object.keys(updateFields).length > 0) {
              const { error: updateVerError } = await supabase
                .from('member')
                .update(updateFields)
                .eq('id', finalUserId);
              if (updateVerError) {
                console.error("Failed to update existing member details:", updateVerError);
              } else {
                console.log("Successfully updated existing member details in database:", updateFields);
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

        const resolvedProxyEmail = isProxyRegistration 
          ? (proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : getVirtualEmail(proxyEmail)) 
          : '';

        const { error: autoGenError } = await supabase
          .from('member')
          .upsert({
            id: finalUserId,
            full_name: fullName,
            email: isProxyRegistration ? resolvedProxyEmail : realUserEmail,
            email_address: isProxyRegistration ? (proxyMethod === 'phone' ? null : getVirtualEmail(proxyEmail)) : realUserEmail,
            phone: isProxyRegistration ? proxyPhoneNumber : phone.trim(),
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
          const resolvedProxyEmail = proxyMethod === 'phone' ? `${proxyPhoneNumber.trim()}@josephitre.club` : getVirtualEmail(proxyEmail);
          // Trigger instant admin-level verification to auto-create participation rows, verify, and email their UNIQUE 5-digit ID!
          const verifyRes = await fetch('/api/admin/verify-event-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId: insertedRow.id,
              tableName: targetTable,
              action: 'approve',
              emailAddress: resolvedProxyEmail,
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
                email: realUserEmail,
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

  if (isInterMode || isInterParam) {
    return <InterEventRegister />;
  }

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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <button 
              onClick={() => router.push('/events')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 hover:text-white transition-all self-start"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Event Listing
            </button>

            <button
              id="btn-manual-refresh-db"
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-black text-xs font-bold text-amber-500 transition-all cursor-pointer self-center md:self-auto shadow-md shadow-amber-500/5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Syncing...' : 'Sync Registration State'}
            </button>
          </div>
          
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
            <div className="flex items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-3.5">
                <Calendar className="w-5 h-5 text-amber-500 animate-pulse" />
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider text-white">Your Registered Events</h3>
                  <p className="text-[9px] text-[var(--c-6-start)] font-black uppercase tracking-widest mt-0.5">As a general registrant, your active transactions are displayed here</p>
                </div>
              </div>
              <button
                id="btn-registrations-refresh"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center disabled:opacity-50"
                title="Refresh registrations"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {userRegisteredEvents.map((reg: any) => {
                const events = (reg.selected_events || '').split(',').map((s: string) => s.trim()).filter(Boolean);
                return events.map((evt: string, idx: number) => (
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
              {isProxyRegistration ? "Proxy Registration Complete!" : finalAmount === 0 ? "Entry Approved!" : "Successfully Submitted!"}
            </h2>
            <p className="text-zinc-400 mb-8 text-sm leading-relaxed">
              {wasGuestRegistered ? (
                <span>
                  Hey <strong>{fullName}</strong>, an account has been automatically generated using your email and phone number. Your login password is your <strong>contact phone number ({phone})</strong>. We have <strong>automatically signed you in</strong> so you can access your profile and track registrations right away!
                </span>
              ) : isProxyRegistration ? (
                <span>
                  Student <strong>{fullName}</strong> has been successfully registered and automatically verified. Their unique Ticket ID / member ID has been generated, and email notifications have been dispatched.
                </span>
              ) : finalAmount === 0 ? (
                <span>
                  Hey <strong>{fullName}</strong>, your free entry for <strong className="text-amber-500">Math Olympiad</strong> is approved! We have <strong>automatically verified</strong> your spot and generated your digital ticket instantly.
                </span>
              ) : (
                <span>
                  Hey <strong>{fullName}</strong>, your transaction verification details (bKash number and transaction ID: <code>{trxnid}</code>) are saved successfully. Please allow up to a few hours for club administrators to verify and confirm your records in the <strong>{getTargetTable(className).split('_').join(' ').toUpperCase()}</strong>.
                </span>
              )}
            </p>

            {isProxyRegistration ? (
              <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl w-full mb-8">
                <p className="text-amber-400 text-xs font-bold mb-3 uppercase tracking-wider">
                  ⚡ Proxy Actions
                </p>
                <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                  Would you like to register another student using the Proxy Registration Mode? This will reset the form while keeping proxy mode active.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
                  <button
                    onClick={() => {
                      // RESET ALL STATES FOR NEXT PROXY REGISTER
                      handleToggleProxy(true);
                      setStep(1);
                      setSelectedEvents([]);
                      setBkashNumber('');
                      setTrxnid('');
                      
                      // Also reset teammate states just in case
                      setTeamMember2Name('');
                      setTeamMember2Class('');
                      setTeamMember2Section('');
                      setTeamMember2Roll('');
                      setTeamMember2Email('');
                      setMember2Profile(null);

                      setTeamMember3Name('');
                      setTeamMember3Class('');
                      setTeamMember3Section('');
                      setTeamMember3Roll('');
                      setTeamMember3Email('');
                      setMember3Profile(null);

                      setAlreadyRegisteredTeam(false);
                      setUserRegisteredTeamEventName(null);
                      setHasConfirmedSegments(false);

                      setIsSuccess(false);
                      showToast("Proxy form reset. Ready for the next registration!", "success");
                    }}
                    className="py-4 px-8 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register Another User
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = '/profile';
                    }}
                    className="py-4 px-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-black text-xs uppercase tracking-wider transition-all border border-white/10 cursor-pointer"
                  >
                    Go to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <>
                {isInterMode && (
                  <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 w-full mb-8 text-left space-y-4">
                    <h4 className="text-sm font-black uppercase tracking-wider text-white border-b border-white/10 pb-2">
                      Registration & Account Details
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[10px]">Unique Ticket ID</span>
                        <strong className="text-lg text-amber-400 font-mono tracking-widest">{interUniqueId || 'PENDING'}</strong>
                      </div>
                      <div>
                        <span className="text-zinc-500 block uppercase font-bold text-[10px]">Membership Type</span>
                        <strong className="text-white uppercase">{isGeneralMember ? 'General Member (50% Discount Applied)' : 'Regular Participant'}</strong>
                      </div>
                      <div className="sm:col-span-2 pt-2 border-t border-white/5">
                        <span className="text-zinc-400 block font-bold mb-1 uppercase text-[10px]">Auto-Generated Account Credentials:</span>
                        <p className="text-zinc-300 font-medium leading-relaxed">
                          We've automatically registered your account and signed you in. You can log in using either your email address or phone number as username:
                        </p>
                        <div className="mt-2 p-3 bg-black/40 rounded-xl space-y-1.5 font-mono text-[11px] border border-white/5">
                          <p><span className="text-zinc-500">EMAIL / USERNAME:</span> <strong className="text-white">{interAccountEmail}</strong></p>
                          <p><span className="text-zinc-500">PASSWORD:</span> <strong className="text-amber-400">{interAccountPassword}</strong></p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

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
              </>
            )}
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
                          <div className="pt-4 border-t border-white/5 space-y-4">
                            {/* Choice selector to register using Email or Phone */}
                            <div className="space-y-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Search & Register Student using:</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProxyMethod('email');
                                    setProxyEmail('');
                                    setProxyVerified(false);
                                    setProxyUserExists(false);
                                    setProxyResolvedUserId(null);
                                  }}
                                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    proxyMethod === 'email'
                                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5'
                                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                  }`}
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  Email Address
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setProxyMethod('phone');
                                    setProxyEmail('');
                                    setProxyVerified(false);
                                    setProxyUserExists(false);
                                    setProxyResolvedUserId(null);
                                  }}
                                  className={`flex-1 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                                    proxyMethod === 'phone'
                                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400 shadow-md shadow-indigo-500/5'
                                      : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                                  }`}
                                >
                                  <Phone className="w-3.5 h-3.5" />
                                  Phone Number
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Student Input based on method */}
                              {proxyMethod === 'email' ? (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Email Address (User ID)</label>
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
                              ) : (
                                <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Student's Phone Number (User ID & Password)</label>
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                      <input
                                        type="text"
                                        placeholder="017XXXXXXXX"
                                        value={proxyPhoneNumber}
                                        onChange={(e) => {
                                          setProxyPhoneNumber(e.target.value);
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
                              )}

                              {/* Student Phone Number Field (Only required/shown for email proxy mode) */}
                              {proxyMethod === 'email' && (
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
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {isGeneralMember && (
                      <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-start gap-4">
                        <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-black uppercase tracking-wider">JMC General Member Detected</p>
                          <p className="text-xs text-zinc-400 mt-1">
                            {isProxyRegistration 
                              ? "This student is verified as a General Member. Selecting ALL events will qualify them for the exclusive 50 BDT member bundle discount."
                              : "Your Profile credentials are pre-populated. Selecting ALL events will qualify you for the exclusive 50 BDT member bundle discount."
                            }
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
                              ? 'Credentials pulled automatically from database archives. Form inputs are pre-populated & locked (any missing details can be filled manually).' 
                              : 'This email is not registered in our database. Since a pre-registered account is not mandatory, manual credentials input is enabled. A new account will be auto-generated upon registration.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {isInterMode && !isGeneralMember && (
                      <div className="p-8 rounded-[2rem] bg-gradient-to-r from-indigo-950/40 via-purple-900/10 to-black/90 border border-indigo-500/20 space-y-6">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-wider text-white">General Membership Status</h3>
                          <p className="text-[10px] text-zinc-400 mt-1">Are you a registered General Member of Josephite Math Club? Verified members qualify for an exclusive 50% discount on all registrations.</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button
                            type="button"
                            onClick={() => {
                              setInterIsGeneralMemberQuestion(true);
                              // Reset states if they toggle
                              if (!interEmailVerified) {
                                setIsGeneralMember(false);
                              }
                            }}
                            className={`flex-1 py-4.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 border cursor-pointer ${
                              interIsGeneralMemberQuestion === true
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            Yes, I am a General Member
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setInterIsGeneralMemberQuestion(false);
                              setIsGeneralMember(false);
                              setInterEmailVerified(false);
                            }}
                            className={`flex-1 py-4.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all duration-150 border cursor-pointer ${
                              interIsGeneralMemberQuestion === false
                                ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                                : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10'
                            }`}
                          >
                            No, I am not
                          </button>
                        </div>

                        {interIsGeneralMemberQuestion === true && (
                          <div className="space-y-3 pt-4 border-t border-white/5">
                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-400">
                              Please enter the email address you used for General Membership registration:
                            </label>
                            <div className="flex gap-2">
                              <div className="relative flex-1">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                                <input
                                  type="email"
                                  placeholder="membership_email@example.com"
                                  value={interGeneralMemberEmail}
                                  onChange={(e) => {
                                    setInterGeneralMemberEmail(e.target.value);
                                    setInterEmailVerified(false);
                                    setIsGeneralMember(false);
                                  }}
                                  disabled={interEmailVerified}
                                  className="w-full pl-11 pr-4 py-3 bg-black/40 border border-white/10 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={handleVerifyInterGeneralMemberEmail}
                                disabled={interVerifyingEmail || interEmailVerified}
                                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 shrink-0 disabled:opacity-50 cursor-pointer text-center justify-center"
                              >
                                {interVerifyingEmail ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Verifying...
                                  </>
                                ) : interEmailVerified ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-400" />
                                    Verified
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Verify Email
                                  </>
                                )}
                              </button>
                            </div>
                            {interEmailVerified && (
                              <p className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1 mt-1">
                                <Check className="w-3.5 h-3.5" /> JMC General Member Account Found & Details Pre-populated! 50% discount will be applied during event selection.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {(!isInterMode || interIsGeneralMemberQuestion !== null || isGeneralMember) && (
                      <>
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
                            disabled={(!isProxyRegistration && isGeneralMember && !!fullName) || (isProxyRegistration && (!proxyVerified || !proxyNameEditable))}
                            className={`w-full pl-14 pr-6 py-4.5 bg-white/5 border ${/\s/.test(fullName) ? 'border-red-500/50 focus:border-red-500/50 focus:ring-red-500/10' : 'border-white/10 focus:border-amber-500/50 focus:ring-amber-500/10'} rounded-2xl focus:outline-none focus:ring-4 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60`}
                          />
                        </div>
                        {/\s/.test(fullName) && (
                          <p className="text-[10px] text-red-400 font-bold uppercase tracking-wider mt-1">
                            Please type in your name without spaces or just type in your surname
                          </p>
                        )}
                      </div>

                      {/* Class */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Class (Numeric: 3 - 12)</label>
                        <div className="relative group">
                          <BookOpen className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                          <select 
                            value={className}
                            onChange={(e) => {
                              setClassName(e.target.value);
                              setSection('');
                            }}
                            disabled={(!isProxyRegistration && isGeneralMember && !!className) || (isProxyRegistration && (!proxyVerified || !proxyClassEditable))}
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
                          <Layers className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                          <select 
                            value={section}
                            onChange={(e) => setSection(e.target.value)}
                            disabled={(!isProxyRegistration && isGeneralMember && !!section) || (isProxyRegistration && (!proxyVerified || !proxySectionEditable))}
                            className="w-full pl-14 pr-12 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60 appearance-none cursor-pointer"
                          >
                            {!className ? (
                              <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase tracking-wider">SELECT CLASS FIRST</option>
                            ) : (
                              <>
                                <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase tracking-wider">SELECT SECTION</option>
                                {(section && !(classSectionsMap[className] || []).includes(section)
                                  ? [...(classSectionsMap[className] || []), section]
                                  : (classSectionsMap[className] || [])
                                ).map((sec: string) => (
                                  <option key={sec} value={sec} className="bg-zinc-950 text-white font-extrabold uppercase">{sec}</option>
                                ))}
                              </>
                            )}
                          </select>
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
                            disabled={(!isProxyRegistration && isGeneralMember && !!roll) || (isProxyRegistration && (!proxyVerified || !proxyRollEditable))}
                            className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60"
                          />
                        </div>
                      </div>

                      {/* Contact Phone Number */}
                      {!isProxyRegistration && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Contact Phone Number</label>
                          <div className="relative group">
                            <Phone className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                            <input 
                              type="tel"
                              placeholder="CONTACT PHONE NUMBER (E.G. 017XXXXXXXX)"
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              disabled={isGeneralMember && !!phone}
                              className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600 disabled:opacity-60"
                            />
                          </div>
                        </div>
                      )}

                      {/* Guest Email Address */}
                      {!user && (
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Email Address (for auto account generation)</label>
                          <div className="relative group">
                            <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-amber-500 transition-colors pointer-events-none" />
                            <input 
                              type="email"
                              placeholder="YOUR EMAIL ADDRESS (E.G. STUDENT@EXAMPLE.COM)"
                              value={guestEmail}
                              onChange={(e) => setGuestEmail(e.target.value)}
                              className="w-full pl-14 pr-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm font-bold text-white placeholder:text-zinc-600"
                            />
                          </div>
                        </div>
                      )}

                    </div>

                    <div className="flex justify-end pt-4">
                      <button
                        onClick={handleNextStep1}
                        className="py-5 px-10 rounded-2xl bg-amber-500 text-black font-black text-xs uppercase tracking-[0.2em] hover:bg-amber-400 transition-all shadow-[0_0_30px_rgba(245,158,11,0.2)] flex items-center gap-2 group"
                      >
                        Proceed to Events <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </>
                )}
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
                              {soloEventsList.map((eventTitle) => {
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
                                ) : isGeneralMember && selectedEvents.length === soloEventsList.length ? (
                                  <span className="text-emerald-400 font-black uppercase">🎉 Member Bundle Discount Applied! Total: {formConfig.allEventsSoloPriceMember || 50} BDT for selecting all solo events!</span>
                                ) : isGeneralMember ? (
                                  <span className="text-emerald-400 font-black uppercase">⚡ JMC General Member: Select ALL {soloEventsList.length} events to activate the {formConfig.allEventsSoloPriceMember || 50} BDT Bundle Discount! (Currently selected: {selectedEvents.length})</span>
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
                                      Member 1 (Leader): {fullName} ({cleanDisplayEmail(user?.email)}) - Filled automatically
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
                                        <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Email, Phone, or Full Name</label>
                                        <div className="flex gap-2">
                                          <div className="relative flex-1">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                            <input
                                              type="text"
                                              placeholder="teammate's email, phone, or Full Name"
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
                                            disabled={!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Name)}
                                            value={teamMember2Name}
                                            onChange={(e) => setTeamMember2Name(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                              (!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Name))
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
                                            disabled={!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Class)}
                                            value={teamMember2Class}
                                            onChange={(e) => {
                                              setTeamMember2Class(e.target.value);
                                              setTeamMember2Section('');
                                            }}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                                              (!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Class))
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
                                          <select
                                            disabled={!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Section)}
                                            value={teamMember2Section}
                                            onChange={(e) => setTeamMember2Section(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                                              (!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Section))
                                                ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                : 'text-white border-white/15'
                                            }`}
                                          >
                                            {!teamMember2Class ? (
                                              <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">SELECT CLASS FIRST</option>
                                            ) : (
                                              <>
                                                <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">SELECT SECTION</option>
                                                {(teamMember2Section && !(classSectionsMap[teamMember2Class] || []).includes(teamMember2Section)
                                                  ? [...(classSectionsMap[teamMember2Class] || []), teamMember2Section]
                                                  : (classSectionsMap[teamMember2Class] || [])
                                                ).map((sec: string) => (
                                                  <option key={sec} value={sec} className="bg-zinc-950 text-white font-extrabold uppercase">{sec}</option>
                                                ))}
                                                <option value="Other" className="bg-zinc-950 text-zinc-400 font-extrabold uppercase">Other</option>
                                              </>
                                            )}
                                          </select>
                                        </div>
                                        <div className="space-y-1">
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Roll Number</label>
                                          <input
                                            type="text"
                                            placeholder="Roll"
                                            disabled={!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Roll)}
                                            value={teamMember2Roll}
                                            onChange={(e) => setTeamMember2Roll(e.target.value)}
                                            className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                              (!member2Profile || (member2Profile.isGeneralMember && !!teamMember2Roll))
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
                                          <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Teammate Email, Phone, or Full Name</label>
                                          <div className="flex gap-2">
                                            <div className="relative flex-1">
                                              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                                              <input
                                                type="text"
                                                placeholder="teammate's email, phone, or Full Name"
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
                                              disabled={!member3Profile || (member3Profile.isGeneralMember && !!teamMember3Name)}
                                              value={teamMember3Name}
                                              onChange={(e) => setTeamMember3Name(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 pl-11 pr-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 ${
                                                (!member3Profile || (member3Profile.isGeneralMember && !!teamMember3Name))
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
                                              disabled={!member3Profile || (member3Profile.isGeneralMember && !!teamMember3Class)}
                                              value={teamMember3Class}
                                              onChange={(e) => {
                                                setTeamMember3Class(e.target.value);
                                                setTeamMember3Section('');
                                              }}
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
                                            <select
                                              disabled={!member3Profile || (member3Profile.isGeneralMember && !!teamMember3Section)}
                                              value={teamMember3Section}
                                              onChange={(e) => setTeamMember3Section(e.target.value)}
                                              className={`w-full bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-xs font-bold transition-all focus:outline-none focus:border-indigo-500 appearance-none cursor-pointer ${
                                                (!member3Profile || member3Profile.isGeneralMember)
                                                  ? 'text-zinc-500 cursor-not-allowed opacity-60' 
                                                  : 'text-white border-white/15'
                                              }`}
                                            >
                                              {!teamMember3Class ? (
                                                <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">SELECT CLASS FIRST</option>
                                              ) : (
                                                <>
                                                  <option value="" className="bg-zinc-950 text-zinc-500 font-extrabold uppercase">SELECT SECTION</option>
                                                  {(teamMember3Section && !(classSectionsMap[teamMember3Class] || []).includes(teamMember3Section)
                                                    ? [...(classSectionsMap[teamMember3Class] || []), teamMember3Section]
                                                    : (classSectionsMap[teamMember3Class] || [])
                                                  ).map((sec: string) => (
                                                    <option key={sec} value={sec} className="bg-zinc-950 text-white font-extrabold uppercase">{sec}</option>
                                                  ))}
                                                  <option value="Other" className="bg-zinc-950 text-zinc-400 font-extrabold uppercase">Other</option>
                                                </>
                                              )}
                                            </select>
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Roll Number</label>
                                            <input
                                              type="text"
                                              placeholder="Roll"
                                              disabled={!member3Profile || (member3Profile.isGeneralMember && !!teamMember3Roll)}
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
