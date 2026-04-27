"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_ADMINS } from '../lib/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  profile: any | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastUserId = React.useRef<string | null>(null);

  const ADMIN_EMAILS = React.useMemo(() => {
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    return Array.from(new Set([
      ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
      ...DEFAULT_ADMINS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);
  }, []);

  const fetchProfile = React.useCallback(async (currentUser: User) => {
    const userEmail = (currentUser.email || "").toLowerCase();
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role, avatar_url')
        .eq('id', currentUser.id)
        .maybeSingle();
      
      if (data && !error) {
        setProfile({
          ...data,
          full_name: data.full_name || currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || ""
        });
        setIsAdmin(data.role === 'admin' || ADMIN_EMAILS.includes(userEmail));
      } else {
        setProfile({ 
          email: currentUser.email, 
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "",
          role: ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'member' 
        });
        setIsAdmin(ADMIN_EMAILS.includes(userEmail));
      }
    } catch (err) {
      console.error("AuthContext: Profile fetch exception:", err);
      if (ADMIN_EMAILS.includes(userEmail)) {
        setIsAdmin(true);
        setProfile({ 
          role: 'admin', 
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || ""
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
    }
  }, [ADMIN_EMAILS]);

  const handleAuthChange = React.useCallback(async (user: User | null) => {
    if (user?.id === lastUserId.current && profile && !loading) {
      return;
    }
    
    lastUserId.current = user?.id || null;
    setUser(user);
    
    if (user) {
      const userEmail = (user.email || "").toLowerCase();
      if (ADMIN_EMAILS.includes(userEmail)) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(true);
      await fetchProfile(user);
    } else {
      setProfile(null);
      setIsAdmin(false);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchProfile, profile, loading]);

  const refreshProfile = React.useCallback(async () => {
    if (user) {
      await fetchProfile(user);
    }
  }, [user, fetchProfile]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // We only log if it's not a standard session expiry error
        const benignErrors = ['Refresh Token Not Found', 'invalid_grant', 'session_not_found'];
        const isBenign = benignErrors.some(msg => error.message.includes(msg));
        
        if (!isBenign) {
          console.error("AuthContext: getSession error:", error);
        }

        if (isBenign) {
          // Clear stale local session immediately if refresh token is known invalid
          supabase.auth.signOut({ scope: 'local' }).catch(e => {});
          handleAuthChange(null);
          return;
        }
      }
      handleAuthChange(session?.user ?? null);
    }).catch(err => {
      // Catch exceptions as well
      handleAuthChange(null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
        handleAuthChange(session?.user ?? null);
      } else if (event === 'TOKEN_REFRESHED') {
        handleAuthChange(session?.user ?? null);
      } else if (event === 'INITIAL_SESSION') {
        // Handled by getSession above, but we'll update if needed
        if (session?.user) handleAuthChange(session.user);
      } else {
        handleAuthChange(session?.user ?? null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
  };

  const value = React.useMemo(() => ({ 
    user, 
    loading, 
    isAdmin, 
    profile, 
    signOut, 
    refreshProfile 
  }), [user, loading, isAdmin, profile, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
