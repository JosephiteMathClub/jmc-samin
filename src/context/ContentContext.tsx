"use client";
import React, { useEffect, useState } from 'react';
import { produce } from 'immer';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { runOnIdle, fetchOptimized } from '../lib/performance-utils';
import { DEFAULT_CONTENT } from '../data/default-content';

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

// Redundant DEFAULT_CONTENT declaration removed as it's imported from default-content.ts at the top level

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
