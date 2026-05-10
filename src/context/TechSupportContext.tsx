'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface TechSupportContextType {
  lastError: any | null;
  resetLastError: () => void;
  sendSupportTicket: (message: string, subject?: string) => Promise<boolean>;
  isSending: boolean;
}

const TechSupportContext = createContext<TechSupportContextType | undefined>(undefined);

export const TechSupportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lastError, setLastError] = useState<any | null>(null);
  const [isSending, setIsSending] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  // Listen for global technical errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setLastError({
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error?.stack || event.error?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
        url: window.location.href
      });
    };

    const handlePromiseError = (event: PromiseRejectionEvent) => {
      setLastError({
        message: event.reason?.message || 'Unhandled Promise Rejection',
        error: event.reason?.stack || event.reason || 'Unknown reason',
        timestamp: new Date().toISOString(),
        url: window.location.href,
        type: 'promise_rejection'
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handlePromiseError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handlePromiseError);
    };
  }, []);

  const resetLastError = useCallback(() => setLastError(null), []);

  const sendSupportTicket = async (message: string, subject: string = 'Technical Problem') => {
    if (!user) {
      showToast('You must be logged in to report a problem', 'error');
      return false;
    }

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('support_tickets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          user_name: user.user_metadata?.full_name || user.email,
          subject,
          message,
          error_context: lastError,
          status: 'open'
        });

      if (error) throw error;

      showToast('Support ticket sent successfully', 'success');
      return true;
    } catch (err: any) {
      console.error('Error sending support ticket:', err);
      showToast(err.message || 'Failed to send support ticket', 'error');
      return false;
    } finally {
      setIsSending(false);
    }
  };

  return (
    <TechSupportContext.Provider value={{ lastError, resetLastError, sendSupportTicket, isSending }}>
      {children}
    </TechSupportContext.Provider>
  );
};

export const useTechSupport = () => {
  const context = useContext(TechSupportContext);
  if (!context) {
    throw new Error('useTechSupport must be used within a TechSupportProvider');
  }
  return context;
};
