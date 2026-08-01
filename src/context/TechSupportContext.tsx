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
      let errMsg = 'Unknown error';
      if (typeof event.message === 'string' && event.message) {
        errMsg = event.message;
      } else if (event.error?.message) {
        errMsg = String(event.error.message);
      }

      let errDetail = 'Unknown error';
      if (event.error?.stack) {
        errDetail = String(event.error.stack);
      } else if (event.error?.message) {
        errDetail = String(event.error.message);
      } else if (typeof event.error === 'string') {
        errDetail = event.error;
      } else if (event.message) {
        errDetail = String(event.message);
      }

      setLastError({
        message: errMsg,
        filename: String(event.filename || ''),
        lineno: Number(event.lineno || 0),
        colno: Number(event.colno || 0),
        error: errDetail,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : ''
      });
    };

    const handlePromiseError = (event: PromiseRejectionEvent) => {
      let msg = 'Unhandled Promise Rejection';
      let errDetail = 'Unknown reason';

      const reason = event.reason;
      if (reason instanceof Error) {
        msg = reason.message || msg;
        errDetail = reason.stack || reason.message || errDetail;
      } else if (typeof reason === 'string') {
        errDetail = reason;
        msg = reason;
      } else if (reason && typeof reason === 'object') {
        if (reason instanceof HTMLElement) {
          errDetail = `<${reason.tagName.toLowerCase()}> element rejection`;
        } else if (reason.message) {
          msg = String(reason.message);
          errDetail = reason.stack ? String(reason.stack) : String(reason.message);
        } else {
          try {
            errDetail = String(reason);
          } catch {
            errDetail = 'Object rejection';
          }
        }
      }

      setLastError({
        message: msg,
        error: errDetail,
        timestamp: new Date().toISOString(),
        url: typeof window !== 'undefined' ? window.location.href : '',
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
      const ticketPayload = {
        user_id: user.id,
        user_email: user.email,
        user_name: user.user_metadata?.full_name || user.email,
        subject,
        message,
        error_context: lastError,
        status: 'open'
      };

      const { error } = await supabase
        .from('support_tickets')
        .insert(ticketPayload);

      if (error) throw error;

      // Trigger server-side mail notification to super admins in the background
      try {
        fetch('/api/support/report', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ticketPayload),
        }).then(res => {
          if (!res.ok) {
            console.warn('Super admin email notification returned non-ok status');
          }
        }).catch(err => {
          console.error('Failed to dispatch super admin email notification:', err);
        });
      } catch (emailErr) {
        console.error('Failed to trigger super admin email notification:', emailErr);
      }

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
