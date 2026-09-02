import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Resolves an image URL. 
 * If the URL is a relative path starting with /images/members/ or /images/member/,
 * and Supabase is configured, it attempts to resolve it to a Supabase Storage URL
 * as a fallback if the local file is missing (handled by the browser/server).
 */
export function resolveImageUrl(url: string | undefined): string {
  if (!url) return '';
  
  // If it's already a full URL (http/https), return it
  if (url.startsWith('http')) return url;
  
  // Normalize local logo fallback paths to be absolute from root
  if (url === 'images/logo.png' || url === 'logo.png') {
    return '/images/logo.png';
  }
  
  // If it's a Supabase storage path that somehow got saved as a relative path
  if ((url.startsWith('avatars/') || url.startsWith('images/')) && !url.includes('logo.png')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      return encodeURI(`${supabaseUrl}/storage/v1/object/public/${url}`);
    }
  }

  if (url.startsWith('/uploads/')) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (supabaseUrl) {
      const path = url.startsWith('/') ? url.substring(1) : url;
      return encodeURI(`${supabaseUrl}/storage/v1/object/public/images/${path}`);
    }
  }
  
  // For local images, encode the URI to handle spaces in filenames
  return encodeURI(url);
}

/**
 * Normalizes a name to treat "MD", "MD.", "Mohammad", "Mohammed", "Muhammad", "Muhammed" as the same ("md").
 */
export function normalizeName(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/\b(md\b\.?|mhd\b\.?|mohammad\b|mohammed\b|muhammad\b|muhammed\b|mohamed\b|muhamed\b)/g, "md")
    .replace(/[^a-z0-9\s]/g, "") // remove punctuation
    .replace(/\s+/g, " ") // normalize spacing
    .trim();
}

/**
 * Calculates Levenshtein Distance between two strings.
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const tmp: number[][] = [];
  for (let i = 0; i <= a.length; i++) {
    tmp[i] = [i];
  }
  for (let j = 0; j <= b.length; j++) {
    tmp[0][j] = j;
  }
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      tmp[i][j] = Math.min(
        tmp[i - 1][j] + 1, // deletion
        tmp[i][j - 1] + 1, // insertion
        tmp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1) // substitution
      );
    }
  }
  return tmp[a.length][b.length];
}

/**
 * Checks if target name matches a query string using fuzzy logic, handling typos and name abbreviations.
 */
export function isFuzzyMatch(targetName: string, query: string): { matches: boolean; score: number } {
  const normalizedTarget = normalizeName(targetName);
  const normalizedQuery = normalizeName(query);

  if (!normalizedQuery) return { matches: true, score: 0 };
  if (!normalizedTarget) return { matches: false, score: 999 };

  // Substring match gets highest priority
  if (normalizedTarget.includes(normalizedQuery)) {
    return { matches: true, score: normalizedTarget.indexOf(normalizedQuery) };
  }

  const targetWords = normalizedTarget.split(" ").filter(Boolean);
  const queryWords = normalizedQuery.split(" ").filter(Boolean);

  if (queryWords.length === 0) return { matches: true, score: 0 };

  let totalDistance = 0;
  let matchedAllWords = true;

  for (const qWord of queryWords) {
    let minWordDistance = 999;
    for (const tWord of targetWords) {
      if (tWord.startsWith(qWord) || qWord.startsWith(tWord)) {
        const diff = Math.abs(tWord.length - qWord.length);
        minWordDistance = Math.min(minWordDistance, diff);
        continue;
      }
      
      const dist = getLevenshteinDistance(qWord, tWord);
      minWordDistance = Math.min(minWordDistance, dist);
    }

    // Max allowed distance based on word length:
    // 1-3 chars: 0 typos (exact or prefix/starts-with)
    // 4-5 chars: 1 typo
    // 6+ chars: 2 typos
    const maxAllowedDistance = qWord.length <= 3 ? 0 : qWord.length <= 5 ? 1 : 2;

    if (minWordDistance > maxAllowedDistance) {
      matchedAllWords = false;
      break;
    }
    totalDistance += minWordDistance;
  }

  return { matches: matchedAllWords, score: totalDistance + 10 }; // slight penalty compared to substring
}

/**
 * Unified matching logic across name, email, member_id, phone, class, etc.
 * Supports sorting search results by relevance score.
 */
export function matchesSearchWithFuzzy(
  item: any,
  query: string,
  fields: { nameField?: string; secondaryFields?: string[] } = {}
): { matches: boolean; score: number } {
  const q = query.trim().toLowerCase();
  if (!q) return { matches: true, score: 0 };

  const nameField = fields.nameField || 'full_name';
  const secondaryFields = fields.secondaryFields || ['email', 'member_id', 'phone', 'class'];

  // Check secondary fields first (exact or substring match)
  for (const field of secondaryFields) {
    const val = String(item[field] || '').toLowerCase();
    if (val.includes(q)) {
      return { matches: true, score: -10 }; // negative score = higher priority/exact matching
    }
  }

  // Fallback to fuzzy name matching
  const nameValue = String(item[nameField] || '');
  return isFuzzyMatch(nameValue, q);
}

/**
 * Strips the auto-generated email domains (like @josephite.club or @josephitemathclub)
 * for users who signed up or registered with a phone number.
 */
export function cleanDisplayEmail(email: string | null | undefined): string {
  if (!email) return '';
  const cleaned = email.trim();
  if (cleaned.endsWith('@josephite.club')) {
    return cleaned.replace('@josephite.club', '');
  }
  if (cleaned.endsWith('@josephitre.club')) {
    return cleaned.replace('@josephitre.club', '');
  }
  if (cleaned.endsWith('@josephitemathclub')) {
    return cleaned.replace('@josephitemathclub', '');
  }
  return cleaned;
}

/**
 * Cycle-safe and DOM/React-node safe JSON stringify
 */
export function safeJsonStringify(obj: any, space?: number): string {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (typeof value === 'object' && value !== null) {
        // Filter DOM Nodes, Elements, or Window objects
        if (
          (typeof window !== 'undefined' && (value instanceof HTMLElement || value instanceof Node || value instanceof Element || value === window)) ||
          typeof value.nodeType === 'number'
        ) {
          return undefined;
        }

        // Filter React Fiber nodes, React Elements, Synthetic Events, or internal Fiber pointers
        if (
          value.$$typeof ||
          value.$typeof ||
          key === 'stateNode' ||
          key === 'return' ||
          key === 'child' ||
          key === 'sibling' ||
          (typeof key === 'string' && (key.startsWith('__react') || key.startsWith('_react'))) ||
          value.constructor?.name === 'FiberNode' ||
          value.constructor?.name === 'HTMLDivElement' ||
          value.constructor?.name === 'SyntheticBaseEvent' ||
          value.constructor?.name === 'Event'
        ) {
          return undefined;
        }

        // Filter circular references
        if (seen.has(value)) {
          return undefined;
        }
        seen.add(value);
      }

      if (typeof value === 'function') {
        return undefined;
      }

      return value;
    },
    space
  );
}

/**
 * Cycle-safe and DOM/React-node safe deep clone
 */
export function safeJsonClone<T>(obj: T): T {
  if (!obj) return obj;
  try {
    return JSON.parse(safeJsonStringify(obj));
  } catch (err) {
    console.warn("safeJsonClone warning:", err);
    return obj;
  }
}

/**
 * Resolves event names, mapping raw segment IDs like "Segment-1786207353546" or "segment-..."
 * to their human-readable title (e.g., "Tic-Tac-Toe").
 */
export function resolveEventNames(eventsStr: string | null | undefined, customSegments?: any[]): string {
  if (!eventsStr) return "N/A";
  
  const rawStr = String(eventsStr).trim();
  if (!rawStr) return "N/A";

  // Map known segment IDs / lowercases to human readable names
  const knownSegMap: Record<string, string> = {
    'tic-tac-toe': 'Tic-Tac-Toe',
    'math olympiad (find-based)': 'Math Olympiad (Find-based)',
    'math olympiad (proof-based)': 'Math Olympiad (Proof-based)',
    'iq test': 'IQ Test',
    'human calculator': 'Human Calculator',
    'genesis': 'Genesis',
    'geometry dash': 'Geometry Dash',
    'probability pressure': 'Probability Pressure',
    'secret event': 'Secret Event',
    'murder mystery': 'Secret Event',
    'crack the code': 'Crack the Code',
    'complex calamity': 'Complex Calamity',
    'sudoku': 'Sudoku',
    'rubik’s cube showdown': 'Rubik’s Cube Showdown',
    '5 min professor': '5 min Professor',
    'calculus bee': 'Calculus Bee',
    'combi verse': 'Combi Verse',
    'singularity': 'Singularity',
    'escape room': 'Escape Room',
    'truss': 'Truss',
    'wall magazine display': 'Wall Magazine Display',
    'math memes': 'Math Memes',
    'math article': 'Math Article',
    'math vision': 'Math Vision',
    'math drawing': 'Math Drawing'
  };

  if (customSegments && Array.isArray(customSegments)) {
    customSegments.forEach((seg: any) => {
      if (seg && seg.name) {
        const cleanName = String(seg.name).trim();
        if (seg.id) {
          knownSegMap[String(seg.id).trim().toLowerCase()] = cleanName;
        }
        knownSegMap[cleanName.toLowerCase()] = cleanName;
      }
    });
  }

  const items = rawStr.split(',').map(item => item.trim()).filter(Boolean);
  const resolved = items.map(item => {
    // If it's a raw timestamp Segment ID like Segment-1786207353546 or segment-123
    if (/^segment-\d+$/i.test(item)) {
      if (customSegments && Array.isArray(customSegments)) {
        const found = customSegments.find((s: any) => s.id === item || s.name === item);
        if (found && found.name && !found.name.startsWith('Segment-')) {
          return found.name;
        }
      }
      return "Tic-Tac-Toe";
    }

    const lower = item.toLowerCase();
    if (knownSegMap[lower]) {
      return knownSegMap[lower];
    }

    // If item itself starts with Segment-
    if (item.toLowerCase().startsWith('segment-')) {
      return "Tic-Tac-Toe";
    }

    return item;
  });

  return resolved.join(', ');
}



