import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { DEFAULT_ADMINS } from './constants';

export async function getAdminEmails() {
  const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
  return Array.from(new Set([
    ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
    ...DEFAULT_ADMINS
  ])).map(e => e.trim().toLowerCase()).filter(Boolean);
}

export async function isAdmin(user: any) {
  if (!user || !user.email) return false;
  const ADMIN_EMAILS = await getAdminEmails();
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

export async function getAuthenticatedUser() {
  const cookieStore = await cookies();
  const authHeaders = await headers();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gqcwzxnuawpfqvrukcmn.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3d6eG51YXdwZnF2cnVrY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYxNzIsImV4cCI6MjA4NzQzMjE3Mn0.ScX8MryJZvfRpa6H0RCeylRVhzlf7hdHnGE5YrbgIwQ";

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        },
      },
    }
  );
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session) return session.user;
  
  // Fallback to Authorization header for iframe environments
  const authHeader = authHeaders.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const { data: { user } } = await supabase.auth.getUser(token);
    return user;
  }
  
  return null;
}

export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user || !(await isAdmin(user))) {
    throw new Error('Unauthorized');
  }
  return user;
}
