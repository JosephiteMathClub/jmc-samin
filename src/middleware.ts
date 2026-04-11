import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { DEFAULT_ADMINS } from './lib/constants';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://gqcwzxnuawpfqvrukcmn.supabase.co";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdxY3d6eG51YXdwZnF2cnVrY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NTYxNzIsImV4cCI6MjA4NzQzMjE3Mn0.ScX8MryJZvfRpa6H0RCeylRVhzlf7hdHnGE5YrbgIwQ";

  // If Supabase is not configured, we skip auth checks but keep security headers
  if (!supabaseUrl || !supabaseAnonKey) {
    // We still need to apply headers later, so we just skip the auth part
  } else {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return req.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value))
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            )
          },
        },
      }
    );

    let user = null;
    try {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    } catch (e) {
      console.error("Middleware: getUser error:", e);
    }

    // 2. Route Protection
    const isAdminPath = req.nextUrl.pathname.startsWith('/admin');
    const isApiPath = req.nextUrl.pathname.startsWith('/api');

    if (isAdminPath || (isApiPath && req.method === 'POST')) {
      // If we have a user, check admin status
      if (user) {
        if (isAdminPath) {
          const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS;
          const ADMIN_EMAILS = Array.from(new Set([
            ...(adminEmailsEnv ? adminEmailsEnv.split(',') : []),
            ...DEFAULT_ADMINS
          ])).map(e => e.trim().toLowerCase()).filter(Boolean);
          
          const userEmail = (user.email || "").toLowerCase();
          if (!ADMIN_EMAILS.includes(userEmail)) {
            return NextResponse.redirect(new URL('/', req.url));
          }
        }
      } 
    }
  }

  // 3. Apply Security Headers at the end to ensure they are present on the final response
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://picsum.photos https://images.unsplash.com;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.googleapis.com https://*.google-analytics.com https://*.googletagmanager.com localhost:* 127.0.0.1:*;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s{2,}/g, ' ').trim();

  res.headers.set('Content-Security-Policy', cspHeader);
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|images|favicon.ico).*)',
  ],
};
