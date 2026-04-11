import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathSegments } = await params;
    const imagePath = pathSegments.join('/');
    const fullPath = path.join(process.cwd(), 'src/images', imagePath);

    // Security check: ensure the path is within src/images
    const resolvedPath = path.resolve(fullPath);
    const imagesDir = path.resolve(path.join(process.cwd(), 'src/images'));
    
    if (!resolvedPath.startsWith(imagesDir)) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    const fileBuffer = await fs.readFile(fullPath);
    
    // Determine mime type based on extension
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = 'image/jpeg';
    if (ext === '.png') contentType = 'image/png';
    if (ext === '.webp') contentType = 'image/webp';
    if (ext === '.gif') contentType = 'image/gif';
    if (ext === '.svg') contentType = 'image/svg+xml';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return new NextResponse('Not Found', { status: 404 });
  }
}
