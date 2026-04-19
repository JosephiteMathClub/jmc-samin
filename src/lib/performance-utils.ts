/**
 * Performance-focused utilities for asset management and decompression.
 */

/**
 * Decompresses a stream using the native DecompressionStream API (modern browsers).
 * Supported formats: 'gzip', 'deflate', 'deflate-raw' (depending on browser).
 */
export async function decompressStream(stream: ReadableStream, format: 'gzip' | 'deflate' | 'deflate-raw' = 'gzip'): Promise<ReadableStream> {
  const ds = new DecompressionStream(format);
  return stream.pipeThrough(ds);
}

/**
 * Fetches an asset and automatically decompresses it if it has a .gz or .br (simulated) suffix,
 * or if the server provides the content-encoding header properly.
 */
export async function fetchOptimized(url: string, options: RequestInit = {}): Promise<any> {
  const response = await fetch(url, options);
  
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);

  const isGzipped = url.endsWith('.gz') || response.headers.get('Content-Encoding') === 'gzip';
  
  if (isGzipped && typeof DecompressionStream !== 'undefined') {
    const ds = new DecompressionStream('gzip');
    const decompressedStream = response.body?.pipeThrough(ds);
    if (decompressedStream) {
      const result = await new Response(decompressedStream).text();
      try {
        return JSON.parse(result);
      } catch {
        return result;
      }
    }
  }

  // Fallback to regular json/text
  const contentType = response.headers.get('Content-Type');
  if (contentType?.includes('application/json')) {
    return response.json();
  }
  return response.text();
}

/**
 * Utility to optimize expensive computations by deferring them to an idle period.
 */
export function runOnIdle(task: () => void) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(task);
  } else {
    setTimeout(task, 1);
  }
}

/**
 * Checks if the device is likely high-end or low-end based on hardware traits.
 */
export function detectDeviceTier(): 'low' | 'mid' | 'high' {
  if (typeof navigator === 'undefined') return 'mid';
  
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as any).deviceMemory || 4;
  
  if (cores <= 4 || memory <= 4) return 'low';
  if (cores >= 8 && memory >= 8) return 'high';
  return 'mid';
}
