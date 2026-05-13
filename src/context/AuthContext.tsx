"use client";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { DEFAULT_ADMINS, SUPER_ADMIN_EMAILS } from '../lib/constants';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  profile: any | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  isAdmin: false,
  isSuperAdmin: false,
  profile: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const lastUserId = React.useRef<string | null>(null);
  const hasProfile = React.useRef<boolean>(false);

  const SUPER_ADMIN_EMAILS_LIST = React.useMemo(() => {
    const superAdminEmailsEnv = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAILS;
    return Array.from(new Set([
      ...(superAdminEmailsEnv ? superAdminEmailsEnv.split(',') : []),
      ...SUPER_ADMIN_EMAILS
    ])).map(e => e.trim().toLowerCase()).filter(Boolean);
  }, []);

  const ADMIN_EMAILS = React.useMemo(() => {
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
    return Array.from(new Set([
      ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
      ...DEFAULT_ADMINS,
      ...SUPER_ADMIN_EMAILS
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
        setIsAdmin(data.role === 'admin' || data.role === 'super_admin' || ADMIN_EMAILS.includes(userEmail));
        setIsSuperAdmin(data.role === 'super_admin' || SUPER_ADMIN_EMAILS_LIST.includes(userEmail));
      } else {
        const isSuper = SUPER_ADMIN_EMAILS_LIST.includes(userEmail);
        setProfile({ 
          email: currentUser.email, 
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || "",
          role: isSuper ? 'super_admin' : (ADMIN_EMAILS.includes(userEmail) ? 'admin' : 'member') 
        });
        setIsAdmin(ADMIN_EMAILS.includes(userEmail) || isSuper);
        setIsSuperAdmin(isSuper);
      }
    } catch (err) {
      console.error("AuthContext: Profile fetch exception:", err);
      const isSuper = SUPER_ADMIN_EMAILS_LIST.includes(userEmail);
      if (ADMIN_EMAILS.includes(userEmail) || isSuper) {
        setIsAdmin(true);
        setIsSuperAdmin(isSuper);
        setProfile({ 
          role: isSuper ? 'super_admin' : 'admin', 
          email: currentUser.email,
          full_name: currentUser.user_metadata?.full_name || currentUser.user_metadata?.name || ""
        });
      } else {
        setProfile(null);
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    }
  }, [ADMIN_EMAILS, SUPER_ADMIN_EMAILS_LIST]);

  const handleAuthChange = React.useCallback(async (user: User | null) => {
    // Only proceed if there's a genuine change in user state or first load
    if (user?.id === lastUserId.current && hasProfile.current) {
      setLoading(false);
      return;
    }
    
    lastUserId.current = user?.id || null;
    setUser(user);
    
    if (user) {
      const userEmail = (user.email || "").toLowerCase();
      const isSuper = SUPER_ADMIN_EMAILS_LIST.includes(userEmail);
      setIsAdmin(ADMIN_EMAILS.includes(userEmail) || isSuper);
      setIsSuperAdmin(isSuper);
      
      // Ensure we fetch profile but don't hold up loading if we already have a partial state
      await fetchProfile(user);
      hasProfile.current = true;
    } else {
      setProfile(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      hasProfile.current = false;
    }
    setLoading(false);
  }, [fetchProfile, ADMIN_EMAILS, SUPER_ADMIN_EMAILS_LIST]);

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

    let isMounted = true;

    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!isMounted) return;
      if (error) {
        const benignErrors = ['Refresh Token Not Found', 'invalid_grant', 'session_not_found'];
        const isBenign = benignErrors.some(msg => error.message.includes(msg));
        if (!isBenign) console.error("AuthContext: getSession error:", error);
        handleAuthChange(null);
      } else {
        handleAuthChange(session?.user ?? null);
      }
    }).catch(err => {
      if (isMounted) handleAuthChange(null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      
      const sessionUser = session?.user ?? null;
      console.log(`[AuthContext] Event: ${event}, User: ${sessionUser?.email || 'none'}`);
      
      if (event === 'PASSWORD_RECOVERY') {
        // If the user lands here via a recovery link but on the wrong path, redirect them
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/reset-password')) {
          window.location.href = '/reset-password';
          return;
        }
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED' || event === 'INITIAL_SESSION') {
        if (sessionUser) {
          handleAuthChange(sessionUser);
        } else if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION') {
          handleAuthChange(null);
        }
      } else if (event === 'SIGNED_OUT') {
        handleAuthChange(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setIsAdmin(false);
    setIsSuperAdmin(false);
  };

  const value = React.useMemo(() => ({ 
    user, 
    loading, 
    isAdmin,
    isSuperAdmin,
    profile, 
    signOut, 
    refreshProfile 
  }), [user, loading, isAdmin, isSuperAdmin, profile, refreshProfile]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
