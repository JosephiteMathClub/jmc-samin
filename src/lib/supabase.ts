import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gqcwzxnuawpfqvrukcmn.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3d6eG51YXdwZnF2cnVrY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYxNzIsImV4cCI6MjA4NzQzMjE3Mn0.ScX8MryJZvfRpa6H0RCeylRVhzlf7hdHnGE5YrbgIwQ";

// Simple check for service role key if it starts with 'service_role' or similar
// (Most Supabase keys are JWTs, so we can't easily check without atob, but we'll skip it for now to avoid SyntaxErrors)

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Use placeholders only if not configured to prevent crash, but we'll check isSupabaseConfigured before use
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      // Custom lock to avoid Navigator LockManager timeout in iframes/restricted environments
      lock: async (_name: string, optionsOrCallback: any, callback?: any) => {
        const cb = typeof optionsOrCallback === 'function' ? optionsOrCallback : callback;
        if (typeof cb === 'function') {
          return await cb();
        }
      }
    }
  }
);
