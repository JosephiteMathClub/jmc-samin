const rateLimitMap = new Map<string, { count: number, lastReset: number }>();

export function rateLimit(ip: string, limit: number = 10, windowMs: number = 60000) {
  const now = Date.now();
  const userData = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userData.lastReset > windowMs) {
    userData.count = 1;
    userData.lastReset = now;
  } else {
    userData.count++;
  }

  rateLimitMap.set(ip, userData);

  return {
    success: userData.count <= limit,
    remaining: Math.max(0, limit - userData.count),
    reset: userData.lastReset + windowMs
  };
}
