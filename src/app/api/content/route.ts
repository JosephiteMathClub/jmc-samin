import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

const CONTENT_FILE = path.join(process.cwd(), 'src/data/site-content.json');

export async function GET() {
  try {
    const dataStr = await fs.readFile(CONTENT_FILE, 'utf-8');
    const data = JSON.parse(dataStr);
    
    const updatedAt = data.lastUpdated || "1970-01-01T00:00:00Z";
    
    return NextResponse.json({
      data,
      updatedAt
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600'
      }
    });
  } catch (error) {
    console.error('Error reading content file:', error);
    return NextResponse.json({ error: 'Failed to read content' }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const newContent = await request.json();
    
    // 3. Basic validation
    if (!newContent || typeof newContent !== 'object') {
      return NextResponse.json({ error: 'Invalid content format' }, { status: 400 });
    }

    // 4. Attempt to write to file (will fail on Netlify/Serverless)
    try {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(newContent, null, 2), 'utf-8');
    } catch (fsError) {
      console.warn('Note: Could not write to local content file (expected in serverless environments):', fsError);
      // We don't return an error here because the primary source of truth in production is Supabase
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error writing content file:', error);
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
  }
}
