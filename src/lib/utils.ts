import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves an image URL. 
 * If the URL is a relative path starting with /images/members/ or /images/member/,
 * and Supabase is configured, it attempts to resolve it to a Supabase Storage URL
 * as a fallback if the local file is missing (handled by the browser/server).
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  // If it's already a full URL, return it
  if (url.startsWith('http')) return url;
  
  // Only resolve to Supabase for /uploads/ or if explicitly requested
  // Static assets in /images/ should generally be served locally from the public folder
  if (url.startsWith('/uploads/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const path = url.startsWith('/') ? url.substring(1) : url;
      return `${supabaseUrl}/storage/v1/object/public/images/${path}`;
    }
  }
  
  // For local images, we return the path as is. 
  // Next.js will serve these from the public folder.
  return url;
}
