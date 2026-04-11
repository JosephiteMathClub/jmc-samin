import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { rateLimit } from '@/lib/rate-limit';
import { requireAdmin } from '@/lib/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting
    const ip = (await headers()).get('x-forwarded-for') || 'unknown';
    const { success, remaining, reset } = rateLimit(ip, 10, 60000);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '10',
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

    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // 3. Validate file size (e.g., 2MB limit)
    const MAX_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'File size exceeds 2MB limit' }, { status: 400 });
    }

    // 4. Validate file type
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    const fileExtension = path.extname(file.name).toLowerCase();

    if (!allowedExtensions.includes(fileExtension) || !allowedMimeTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only .jpg, .jpeg, .png, and .webp files are allowed' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize filename to prevent directory traversal
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-');
    const filename = `${Date.now()}-${sanitizedName}`;
    let fileUrl = '';

    // 1. Try Supabase Storage first (Persistent)
    if (supabase) {
      try {
        const { data, error } = await supabase.storage
          .from('images')
          .upload(filename, buffer, {
            contentType: file.type,
            upsert: true
          });

        if (error) {
          console.error('Supabase upload error:', error);
          return NextResponse.json({ error: `Supabase upload failed: ${error.message}` }, { status: 500 });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('images')
            .getPublicUrl(filename);
          fileUrl = publicUrl;
        }
      } catch (err: any) {
        console.error('Supabase storage error:', err);
        return NextResponse.json({ error: `Supabase storage error: ${err.message}` }, { status: 500 });
      }
    } else {
      // Fallback to local storage ONLY if not in production/serverless
      const isServerless = process.env.NETLIFY || process.env.VERCEL || process.env.NODE_ENV === 'production';
      
      if (isServerless) {
        return NextResponse.json({ error: 'Supabase is not configured. Uploads are disabled in production.' }, { status: 500 });
      }

      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      try {
        await fs.access(uploadDir);
      } catch {
        await fs.mkdir(uploadDir, { recursive: true });
      }
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);
      fileUrl = `/uploads/${filename}`;
    }

    return NextResponse.json({ url: fileUrl });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
