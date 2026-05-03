import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { DEFAULT_ADMINS } from './lib/constants';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
  }
  // Sanitize URL: remove trailing slash and rest/v1 suffix if present
  supabaseUrl = supabaseUrl.replace(/\/$/, '').replace(/\/rest\/v1$/, '');
  
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  // Skip auth flow if not configured or using placeholder
  const isConfigured = supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder');

  if (isConfigured) {
  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) => {
            // Force SameSite=None for AI Studio iframes
            const overridenOptions = {
              ...options,
              sameSite: 'none' as const,
              secure: true,
            };
            supabaseResponse.cookies.set(name, value, overridenOptions);
          });
        },
      },
      cookieOptions: {
        sameSite: 'none',
        secure: true,
      }
    }
  );

    // IMPORTANT: DO NOT remove this getUser() call. It refreshes the session if needed.
    const { data: { user } } = await supabase.auth.getUser();

    if (request.nextUrl.pathname.startsWith('/admin')) {
      if (!user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        url.searchParams.set('redirect', request.nextUrl.pathname);
        
        // Return a response that includes the refreshed cookies
        const redirectResponse = NextResponse.redirect(url);
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value, {
            path: cookie.path,
            domain: cookie.domain,
            secure: true,
            sameSite: 'none',
            maxAge: cookie.maxAge,
          });
        });
        return redirectResponse;
      }
      
      const adminEmailsEnv = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "").toLowerCase();
      const envAdmins = adminEmailsEnv.split(',').map(e => e.trim()).filter(Boolean);
      const allAdmins = [...envAdmins, ...DEFAULT_ADMINS.map(e => e.toLowerCase()), 'l47idkpro@gmail.com'];
      
      if (!allAdmins.includes(user.email?.toLowerCase() || "")) {
        const homeResponse = NextResponse.redirect(new URL('/', request.url));
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          homeResponse.cookies.set(cookie.name, cookie.value, {
            path: cookie.path,
            domain: cookie.domain,
            secure: true,
            sameSite: 'none',
            maxAge: cookie.maxAge,
          });
        });
        return homeResponse;
      }
    }
  }

  // Security Headers
  supabaseResponse.headers.set('X-Content-Type-Options', 'nosniff');
  supabaseResponse.headers.set('X-XSS-Protection', '1; mode=block');
  supabaseResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS handles mobile app requests
  const origin = request.headers.get('origin');
  if (origin && (origin.includes('localhost') || origin.includes('capacitor://') || origin.includes('jmc-sjs.org'))) {
    supabaseResponse.headers.set('Access-Control-Allow-Origin', origin);
    supabaseResponse.headers.set('Access-Control-Allow-Credentials', 'true');
    supabaseResponse.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    supabaseResponse.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images|api).*)',
  ],
};

export default middleware;
