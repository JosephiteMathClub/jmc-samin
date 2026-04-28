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

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder-project.supabase.co";
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // If Supabase is not configured, we skip auth checks but keep security headers
  if (supabaseUrl && supabaseAnonKey) {
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
            response = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    );

    let user = null;
    try {
      const { data: { user: foundUser }, error } = await supabase.auth.getUser();
      user = foundUser;
      
      if (error && !['Refresh Token Not Found', 'invalid_grant', 'session_not_found', 'Auth session missing!'].some(msg => error.message.includes(msg))) {
        console.error("Middleware: getUser error:", error.message);
      }
    } catch (e) {
      // Ignore exceptions from session resolution in middleware as they are often just expired sessions
    }

    // Protection logic
    const isAdminPath = req.nextUrl.pathname.startsWith('/admin');
    const isApiPath = req.nextUrl.pathname.startsWith('/api');

    // CORS for mobile app
    const origin_header = req.headers.get('origin');
    const allowedOrigins = [
      'capacitor://localhost',
      'http://localhost',
      'https://jmc-sjs.org' // Your production domain
    ];
    
    if (origin_header && (allowedOrigins.includes(origin_header) || origin_header.includes('localhost'))) {
      response.headers.set('Access-Control-Allow-Origin', origin_header);
      response.headers.set('Access-Control-Allow-Credentials', 'true');
      response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    }

    if (req.method === 'OPTIONS' && isApiPath) {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }

    if (isAdminPath || (isApiPath && req.method === 'POST')) {
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

  // Apply Security Headers (Simplified for troubleshooting)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(self), microphone=(self), geolocation=(self)');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  return response;
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

export default middleware;
