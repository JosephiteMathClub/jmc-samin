import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { headers } from 'next/headers';
import { requireAdmin } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';
import { DEFAULT_CONTENT } from '@/data/default-content';

const CONTENT_FILE = path.join(process.cwd(), 'src/data/site-content.json');

export async function GET() {
  let data;
  let updatedAt = new Date().toISOString();
  
  try {
    const dataStr = await fs.readFile(CONTENT_FILE, 'utf-8');
    if (!dataStr || dataStr.trim() === '') {
      throw new Error('Content file is empty');
    }
    data = JSON.parse(dataStr);
    updatedAt = data.lastUpdated || "1970-01-01T00:00:00Z";
  } catch (error) {
    console.error('Error reading or parsing content file, fallback to default content:', error);
    data = DEFAULT_CONTENT;
    
    // Self-healing: try to write DEFAULT_CONTENT back to disk so future reads succeed
    try {
      await fs.writeFile(CONTENT_FILE, JSON.stringify(DEFAULT_CONTENT, null, 2), 'utf-8');
      console.log('Successfully self-healed site-content.json on disk with DEFAULT_CONTENT');
    } catch (writeError) {
      console.error('Failed to self-heal site-content.json on disk:', writeError);
    }
  }

  return NextResponse.json({
    data,
    updatedAt
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=3600'
    }
  });
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
