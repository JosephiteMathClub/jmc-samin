import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { success, remaining, reset } = rateLimit(ip, 50, 60000);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '50',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString()
        }
      });
    }

    // 2. Auth & Admin Check
    try {
      await requireAdmin();
    } catch (authError) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { jsonPath, value } = body;

    if (!jsonPath) {
      return NextResponse.json({ error: 'Missing jsonPath' }, { status: 400 });
    }

    const contentPath = path.join(process.cwd(), 'src', 'data', 'site-content.json');
    const contentData = await fs.readFile(contentPath, 'utf8');
    const content = JSON.parse(contentData);

    // Helper to set nested property
    const setNestedProperty = (obj: any, path: string, value: any) => {
      const parts = path.split('.');
      let current = obj;
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current)) current[part] = {};
        current = current[part];
      }
      current[parts[parts.length - 1]] = value;
    };

    setNestedProperty(content, jsonPath, value);
    
    // Update lastUpdated timestamp
    content.lastUpdated = new Date().toISOString();

    // Write back to file
    await fs.writeFile(contentPath, JSON.stringify(content, null, 2), 'utf8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
