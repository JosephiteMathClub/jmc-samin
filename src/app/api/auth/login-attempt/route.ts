import { NextResponse } from 'next/server';

// Simple in-memory storage for storing login attempts: IP -> array of timestamps
const loginAttempts = new Map<string, number[]>();

export async function POST(req: Request) {
  try {
    // Get the client's IP from standard proxy headers or fallback
    const forwardedFor = req.headers.get('x-forwarded-for');
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

    // Bypass rate limiting for local environments or development mode
    if (process.env.NODE_ENV === 'development' || ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      return NextResponse.json({
        allowed: true,
        attemptsRemaining: 999
      });
    }

    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minutes

    // Get previous attempts for this IP address
    let attempts = loginAttempts.get(ip) || [];

    // Filter out attempts that are older than 5 minutes
    attempts = attempts.filter(timestamp => now - timestamp < windowMs);

    if (attempts.length >= 5) {
      // Find the first/oldest attempt inside this 5-minute window
      const oldestAttempt = attempts[0];
      const timeRemainingMs = windowMs - (now - oldestAttempt);
      const remainingSeconds = Math.ceil(timeRemainingMs / 1000);
      const remainingMinutes = Math.ceil(remainingSeconds / 60);

      let message = '';
      if (remainingSeconds >= 60) {
        message = `Too many login attempts. Please wait ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''} to try again.`;
      } else {
        message = `Too many login attempts. Please wait ${remainingSeconds} second${remainingSeconds !== 1 ? 's' : ''} to try again.`;
      }

      return NextResponse.json({
        allowed: false,
        error: message,
        remainingSeconds
      }, { status: 429 });
    }

    // Add current attempt timestamp
    attempts.push(now);
    loginAttempts.set(ip, attempts);

    return NextResponse.json({
      allowed: true,
      attemptsRemaining: 5 - attempts.length
    });
  } catch (error: any) {
    console.error('Rate limit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
