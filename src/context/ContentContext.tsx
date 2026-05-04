"use client";
import React, { useEffect, useState } from 'react';
import { produce } from 'immer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { runOnIdle, fetchOptimized } from '../lib/performance-utils';

interface ContentContextType {
  content: any;
  updateContent: (section: string, data: any) => Promise<void>;
  updateNestedField: (jsonPath: string, value: any) => Promise<void>;
  saveAllContent: (data: any) => Promise<void>;
  seedDatabase: () => Promise<void>;
  loading: boolean;
}

const ContentContext = React.createContext<ContentContextType>({
  content: {},
  updateContent: async () => {},
  updateNestedField: async () => {},
  saveAllContent: async () => {},
  seedDatabase: async () => {},
  loading: true,
});

const DEFAULT_CONTENT = {
  site: {
    clubName: "Josephite Math Club",
    logoUrl: "",
    eventMode: false,
    maintenanceMode: false,
    maintenanceMessage: "The site is currently under maintenance",
    announcements: [
      "Welcome to Josephite Math Club!",
      "New event starting soon - Register now!",
      "Check out our latest articles in the library."
    ],
    showAnnouncements: true
  },
  home: {
    heroTagline: "Est. 2015 * Excellence in Mathematics",
    heroTitle: "Josephite Math Club",
    heroSubtitle: "Where logic meets creativity to solve the world's most beautiful problems.",
    heroSubtitles: [
      "Where logic meets creativity to solve the world's most beautiful problems.",
      "Exploring the infinite boundaries of mathematical thought.",
      "Building a sanctuary for Josephite mathematicians.",
      "Innovating through the language of the universe."
    ],
    joinButtonText: "Join the Club",
    storyButtonText: "Our Story",
    memoriesTagline: "Visual Journey",
    memoriesTitle: "Our Memories",
    testimonialsTagline: "Voices of JMC",
    testimonialsTitle: "People About JMC",
    agendaTagline: "Our Mission",
    agendaTitle: "The Club Agenda",
    agendaDescription: "We aim to bridge the gap between theoretical mathematics and practical innovation through a series of structured programs.",
    agendaItems: [
      { title: "Weekly Workshops", icon: "Zap" },
      { title: "Monthly Competitions", icon: "Trophy" },
      { title: "Annual Math Festival", icon: "Star" },
      { title: "Research Projects", icon: "Lightbulb" }
    ],
    gallery: [],
    testimonials: [
      {
        id: "root-home-testimonials-0-j5tehjir4",
        name: "Anthony Prince Costa",
        role: "Chief Moderator",
        message: "As Chief Moderator, I take pride in guiding the Math Club, which reflects the spirit of our department. Our mission is to create a community where mathematics is not just about formulas but about critical thinking, curiosity, and teamwork. This club allows students to go beyond textbooks and experience the true beauty of numbers and logic.",
        imageUrl: "/images/members/anthony.png"
      },
      {
        id: "root-home-testimonials-1-er0ttx1ep",
        name: "Intesher Alam Manam",
        role: "Club President",
        message: "As the President of the Math Club, I feel honored to lead such a vibrant community. My vision is to make this club a hub for discovery, learning, and collaboration. Whether it's competitions, workshops, or friendly discussions, we want every member to feel inspired and motivated to see math not as pressure, but as passion.",
        imageUrl: "/images/members/panel_26/intesher_alam_manam.png"
      },
      {
        id: "root-home-testimonials-2-j621yhizn",
        name: "Shoumik Saha Raj",
        role: "General Secretary",
        message: "As General Secretary, my role is to keep our Math Club organized, active, and welcoming for everyone. I work to ensure smooth coordination of events, competitions, and activities so that each member has the chance to participate and grow. Together, we are creating a community where learning mathematics is not only meaningful but also enjoyable.",
        imageUrl: "/images/members/panel_26/shoumik_saha-raj.png"
      },
      {
        id: "root-home-testimonials-3-gd5aotk2o",
        name: "Monwar Rafat",
        role: "Deputy President",
        message: "Serving as Deputy President, I work alongside our president and members to ensure that the Math Club continues to grow with new initiatives. We aim to make mathematics a source of joy, exploration, and innovation for every student, giving them opportunities to learn and lead with confidence.",
        imageUrl: "/images/members/panel_26/monwar_rafat.png"
      },
      {
        id: "root-home-testimonials-4-2xng7rc2p",
        name: "Arefin Anwar",
        role: "Vice President",
        message: "As Vice President, I believe the true strength of our Math Club lies in teamwork and inclusiveness. We are building a community where students not only sharpen their problem-solving skills but also learn to innovate, collaborate, and enjoy mathematics as a lifelong journey of discovery.",
        imageUrl: "/images/members/panel_26/arefin_anwar.png"
      }
    ]
  },
  about: {
    title: "ABOUT US",
    subtitle: "THE JMC STORY",
    description: "The Josephite Math Club is a premier student organization dedicated to fostering mathematical excellence and innovation. Founded with a vision to make mathematics accessible and exciting, we provide a platform for students to explore the beauty of numbers and their applications in the real world.",
    stats: [
      { label: "Active Members", value: "500+" },
      { label: "Annual Events", value: "12+" },
      { label: "Years of Legacy", value: "9" },
      { label: "Awards Won", value: "50+" }
    ],
    objectives: [
      { title: "Mathematical Thinking", description: "Promote deep mathematical thinking and intuitive problem-solving skills.", icon: "Calculator", color: "text-purple-400" },
      { title: "Olympiad Spirit", description: "Organize competitions and workshops to prepare students for national and international stages.", icon: "Trophy", color: "text-amber-400" },
      { title: "Collaborative Growth", description: "Create a supportive and collaborative environment for math enthusiasts to thrive.", icon: "Heart", color: "text-rose-400" },
      { title: "Practical Math", description: "Bridge the gap between academic mathematics and its impactful real-world applications.", icon: "Lightbulb", color: "text-emerald-400" }
    ],
    visionSteps: [
      { title: "Discovery", desc: "Identifying mathematical potential in every student.", icon: "Target", color: "bg-gradient-to-br from-[var(--c-4-start)] to-[var(--c-4-end)]" },
      { title: "Nurturing", desc: "Providing the resources and mentorship to grow.", icon: "Zap", color: "bg-gradient-to-br from-[var(--c-5-start)] to-[var(--c-5-end)]" },
      { title: "Excellence", desc: "Achieving mastery through practice and competition.", icon: "Rocket", color: "bg-gradient-to-br from-[var(--c-2-start)] to-[var(--c-2-end)]" },
      { title: "Impact", desc: "Applying math to solve real-world global problems.", icon: "Globe", color: "bg-gradient-to-br from-[var(--c-3-start)] to-[var(--c-3-end)]" }
    ]
  },
  panel: {
    title: "OUR PANEL",
    subtitle: "LEADERSHIP",
    description: "Meet the dedicated individuals who lead the Josephite Math Club towards its goals of excellence and innovation.",
    moderatorsTitle: "Moderators",
    moderators: [
      { name: "Anthony Prince Costa", role: "Chief Moderator", imageUrl: "/images/members/anthony.png" }
    ],
    executiveTitle: "Executive Committee",
    executiveSubtitle: "The Core Leadership Team",
    executive: {
      current: {
        president: [{ name: "Intesher Alam Manam", role: "President", imageUrl: "/images/members/panel_26/intesher_alam_manam.png" }],
        deputyPresidents: [{ name: "Monwar Rafat", role: "Deputy President", imageUrl: "/images/members/panel_26/monwar_rafat.png" }],
        generalSecretary: [{ name: "Shoumik Saha Raj", role: "General Secretary", imageUrl: "/images/members/panel_26/shoumik_saha-raj.png" }],
        vicePresidents: [{ name: "Arefin Anwar", role: "Vice President", imageUrl: "/images/members/panel_26/arefin_anwar.png" }],
        departments: [
          { dept: "Internal Affairs", name: "Utkorsho Mistry Shouvik", imageUrl: "/images/members/panel_26/utkorsho_mistry_shouvik.png" },
          { dept: "External Affairs", name: "Mahatab Hossain Zihan", imageUrl: "/images/members/panel_26/mahatab_hossain_zihan.png" },
          { dept: "Photography", name: "Shirsha Roy", imageUrl: "/images/members/panel_26/shirsha_roy.png" },
          { dept: "Events", name: "Ahnaf Abeed", imageUrl: "/images/members/panel_26/ahnaf_abeed.png" },
          { dept: "Writings", name: "Shafayet Azmayeen", imageUrl: "/images/members/panel_26/shafayet_azmayeen.png" },
          { dept: "Equity", name: "Hosain Istiyake Antor", imageUrl: "/images/members/panel_26/hosain_istiyake_antor.png" },
          { dept: "Decoration", name: "Mahi Bareed Noor", imageUrl: "/images/members/panel_26/mahi_bareed_noor.png" }
        ],
        secretaries: { 
          asstGeneralSecretary: [], 
          jointSecretary: [], 
          organizingSecretary: [], 
          correspondingSecretary: [] 
        }
      },
      recent: {
        president: [],
        generalSecretary: [],
        deputyPresidents: [],
        vicePresidents: [],
        departments: [],
        secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] }
      },
      former: {
        president: [],
        generalSecretary: [],
        deputyPresidents: [],
        vicePresidents: [],
        departments: [],
        secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] }
      }
    }
  },
  gallery_page: {
    images: []
  },
  notices: {
    title: "NOTICE BOARD",
    subtitle: "ANNOUNCEMENTS",
    description: "Stay updated with the latest announcements, results, and important information from the Josephite Math Club.",
    notices: []
  },
  events: {
    title: "BEYOND NUMBERS",
    subtitle: "UPCOMING EVENTS",
    description: "Join us for a series of challenging competitions, insightful workshops, and engaging seminars designed to push your mathematical boundaries.",
    events: []
    },
    members_list: {
      title: "OUR MEMBERS",
      subtitle: "COMMUNITY",
      description: "The heartbeat of Josephite Math Club - our diverse and passionate community of mathematicians.",
      members: []
    },
    registration: {
      fee: "200 BDT",
      bkashNumber: "01712345678",
      declaration: "I am willing to join the Josephite Math Club, I promise to perform my duties with honesty, respect the club values, and work for its development",
      registrationOpen: true,
      registrationClosedMessage: "Registration for the current intra-events is currently closed. Please stay tuned for future updates.",
      instructions: [
        "Go to your bKash app or dial *247#",
        "Select \"Send Money\" and enter the number above",
        "Enter the registration fee amount",
        "Copy the Transaction ID (TrxID) and enter it below"
      ],
      cashInstructions: "Please pay your registration fee to the club treasurer."
    }
  };

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

    // Helper to set nested property using immer
    const setNestedProperty = (obj: any, path: string, value: any) => {
      return produce(obj, (draft: any) => {
        const parts = path.split('.');
        let current = draft;
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!(part in current)) current[part] = {};
          current = current[part];
        }
        current[parts[parts.length - 1]] = value;
        draft.lastUpdated = new Date().toISOString();
      });
    };

  useEffect(() => {
    const fetchContent = async () => {
      // Safety timeout for content loading
      const timeoutId = setTimeout(() => {
        setLoading(false);
      }, 5000);

      setLoading(true);
      let localContent = { ...DEFAULT_CONTENT };
      let localUpdatedAt = "1970-01-01T00:00:00Z";
      let remoteContent = {};
      let remoteUpdatedAt = "1970-01-01T00:00:00Z";

      // 1. Try to fetch file-based content (using optimized decompressor)
      try {
        const result = await fetchOptimized('/api/content');
        if (result && !result.error) {
          localContent = result.data;
          localUpdatedAt = result.updatedAt;
        }
      } catch (err) {
        // Silent fail for regular users
      }

      // 2. Try to fetch Supabase content (remote source)
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('site_content')
            .select('data, updated_at')
            .eq('id', 'main')
            .single();
          
          if (data && !error) {
            remoteContent = data.data;
            // Use the internal lastUpdated if available, fallback to DB updated_at
            remoteUpdatedAt = (data.data as any)?.lastUpdated || data.updated_at || "1970-01-01T00:00:00Z";
          }
        } catch (err) {
          // Silent fail
        }
      }

      // 3. Compare and Merge: The newer one wins
      const localTime = new Date(localUpdatedAt).getTime();
      const remoteTime = new Date(remoteUpdatedAt).getTime();
      
      // Merge content: newer source takes priority
      const mergedContent = localTime > remoteTime 
        ? { ...remoteContent, ...localContent } 
        : { ...localContent, ...remoteContent };

      setContent(mergedContent);
      setLoading(false);
      clearTimeout(timeoutId);

      // 4. Auto-sync if they are out of sync (only if admin)
      if (isSupabaseConfigured && isAdmin && Math.abs(localTime - remoteTime) > 5000) {
        if (localTime > remoteTime) {
          await supabase.from('site_content').upsert({ id: 'main', data: localContent });
        } else {
          try {
            await fetch('/api/content', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(remoteContent),
            });
          } catch (err) {
            // Silent fail
          }
        }
      }
    };

    fetchContent();
  }, [isAdmin]);

  // Real-time subscription for Supabase changes (only for admins to save quota)
  useEffect(() => {
    if (!isSupabaseConfigured || !isAdmin) return;

    const channel = supabase
      .channel('site_content_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'site_content',
          filter: 'id=eq.main',
        },
        (payload) => {
          if (payload.new && (payload.new as any).data) {
            setContent((prev: any) => ({
              ...prev,
              ...(payload.new as any).data
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

    const updateContent = React.useCallback(async (section: string, data: any) => {
      if (!isAdmin) return;
      const newContent = { 
        ...content, 
        [section]: data,
        lastUpdated: new Date().toISOString()
      };
      
      setContent(newContent);
    
    // Update file-based content
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newContent),
      });
    } catch (err) {
      console.error("Error updating file-based content (updateContent):", err);
    }

    // Update Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('site_content')
          .upsert({ id: 'main', data: newContent });
        
        if (error) {
          console.error("Supabase Upsert Error (updateContent):", error);
          throw error;
        }
      } catch (err: any) {
        console.error("Error updating Supabase content (updateContent):", err);
        const errorMessage = err.message || "Unknown error";
        throw new Error(`Failed to save changes to the database: ${errorMessage}. Please ensure the 'site_content' table exists and RLS policies are configured.`);
      }
    }
  }, [isAdmin, content]);

  const updateNestedField = React.useCallback(async (jsonPath: string, value: any) => {
    if (!isAdmin) return;
    
    const newContent = setNestedProperty(content, jsonPath, value);
    setContent(newContent);

    // Update file-based content
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch('/api/content', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(newContent),
      });
    } catch (err) {
      console.error("Error updating file-based content (updateNestedField):", err);
    }

    // Update Supabase
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('site_content')
          .upsert({ id: 'main', data: newContent });
        
        if (error) throw error;
      } catch (err) {
        console.error("Error updating Supabase content:", err);
      }
    }
  }, [isAdmin, content]);

    const saveAllContent = React.useCallback(async (newContent: any) => {
      if (!isAdmin) return;
      
      const contentWithTimestamp = {
        ...newContent,
        lastUpdated: new Date().toISOString()
      };
      
      setContent(contentWithTimestamp);
      
      // Update file-based content
      try {
        const { data: { session } } = await supabase.auth.getSession();
        await fetch('/api/content', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify(contentWithTimestamp),
        });
      } catch (err) {
        console.error("Error updating file-based content (saveAllContent):", err);
      }
  
      // Update Supabase
      if (isSupabaseConfigured) {
        try {
          const { error } = await supabase
            .from('site_content')
            .upsert({ id: 'main', data: contentWithTimestamp });
          
          if (error) {
            console.error("Supabase Upsert Error (saveAllContent):", error);
            throw error;
          }
        } catch (err: any) {
          console.error("Error updating Supabase content (saveAllContent):", err);
          const errorMessage = err.message || "Unknown error";
          throw new Error(`Failed to save changes to the database: ${errorMessage}. Please ensure the 'site_content' table exists and RLS policies are configured.`);
        }
      }
    }, [isAdmin]);

  const seedDatabase = React.useCallback(async () => {
    if (!isAdmin || !isSupabaseConfigured) return;
    
    try {
      const { error } = await supabase
        .from('site_content')
        .upsert({ 
          id: 'main', 
          data: content,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
    } catch (err) {
      throw err;
    }
  }, [isAdmin, content]);

  const value = React.useMemo(() => ({ 
    content, 
    updateContent, 
    updateNestedField, 
    saveAllContent, 
    seedDatabase, 
    loading 
  }), [content, loading, updateContent, updateNestedField, saveAllContent, seedDatabase]);

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => React.useContext(ContentContext);
