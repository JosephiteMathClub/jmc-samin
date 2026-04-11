"use client";
import React, { useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
    logoUrl: ""
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
    testimonials: []
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
      "Promote mathematical thinking and problem-solving skills.",
      "Organize competitions and workshops at various levels.",
      "Create a collaborative environment for math enthusiasts.",
      "Bridge the gap between academic math and real-world applications."
    ],
    visionSteps: [
      { title: "Foundation", description: "Building a strong community of math enthusiasts." },
      { title: "Innovation", description: "Exploring new ways to teach and learn mathematics." },
      { title: "Excellence", description: "Achieving top results in national and international competitions." }
    ]
  },
  panel: {
    title: "OUR PANEL",
    subtitle: "LEADERSHIP",
    description: "Meet the dedicated individuals who lead the Josephite Math Club towards its goals of excellence and innovation.",
    committees: {
      current: {
        president: [],
        vicePresidents: [],
        generalSecretary: [],
        secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] },
        departments: []
      },
      recent: {
        president: [],
        generalSecretary: [],
        vicePresidents: [],
        departments: [],
        secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] }
      },
      former: {
        president: [],
        generalSecretary: [],
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
    }
  };

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

    // Helper to set nested property
    const setNestedProperty = (obj: any, path: string, value: any) => {
      const newObj = JSON.parse(JSON.stringify(obj));
      const parts = path.split('.');
      let current = newObj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) current[part] = {};
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
      
      // Update lastUpdated timestamp
      newObj.lastUpdated = new Date().toISOString();
      
      return newObj;
    };

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      let localContent = { ...DEFAULT_CONTENT };
      let localUpdatedAt = "1970-01-01T00:00:00Z";
      let remoteContent = {};
      let remoteUpdatedAt = "1970-01-01T00:00:00Z";

      // 1. Try to fetch file-based content (local source)
      try {
        const response = await fetch('/api/content');
        if (response.ok) {
          const result = await response.json();
          if (result && !result.error) {
            localContent = result.data;
            localUpdatedAt = result.updatedAt;
          }
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

    const updateContent = async (section: string, data: any) => {
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
  };

  const updateNestedField = async (jsonPath: string, value: any) => {
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
  };

    const saveAllContent = async (newContent: any) => {
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
    };

  const seedDatabase = async () => {
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
  };

  return (
    <ContentContext.Provider value={{ content, updateContent, updateNestedField, saveAllContent, seedDatabase, loading }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useContent = () => React.useContext(ContentContext);
