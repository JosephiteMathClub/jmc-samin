import { createBrowserClient } from '@supabase/ssr';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  if (typeof window !== 'undefined') {
    console.warn("⚠️ Supabase URL is missing or using placeholder. Local development requires a valid .env.local file.");
  }
}

if (supabaseUrl && !supabaseUrl.startsWith('http')) {
  supabaseUrl = `https://${supabaseUrl}`;
}
supabaseUrl = supabaseUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const supabase = createBrowserClient(
  supabaseUrl || "https://placeholder-project.supabase.co",
  supabaseAnonKey || "placeholder-key",
  {
    global: {
      fetch: (url, options) => {
        return fetch(url, {
          ...options,
          cache: 'no-store'
        });
      }
    },
    cookieOptions: {
      sameSite: 'none',
      secure: true,
    }
  }
);
