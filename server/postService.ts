import { INITIAL_PROMPTS } from '../src/data/initialData';

let appletConfig: any = {};
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  appletConfig = require('../firebase-applet-config.json');
} catch (e) {
  appletConfig = {
    projectId: 'gen-lang-client-0103668196',
    firestoreDatabaseId: 'ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d',
    apiKey: 'AIzaSyCCV05qIA8g_NXcxOI8F-71zyWI62UQeDQ',
  };
}

export interface DecodedPost {
  id: string;
  title: string;
  shortDescription: string;
  fullPrompt?: string;
  categoryId?: string;
  categoryName?: string;
  tags?: string[];
  imageUrl: string;
  images?: string[];
  gallery?: (string | { url: string; isCover?: boolean })[];
  views?: number;
  likes?: number;
  shares?: number;
  copies?: number;
  featured?: boolean;
  trending?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
  seoTitle?: string;
  metaDescription?: string;
  author?: string;
  model?: string;
}

// Convert Firestore REST document value to plain JS value
function parseFirestoreValue(val: any): any {
  if (!val || typeof val !== 'object') return val;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue, 10);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('arrayValue' in val) {
    const values = val.arrayValue?.values || [];
    return values.map(parseFirestoreValue);
  }
  if ('mapValue' in val) {
    const fields = val.mapValue?.fields || {};
    const res: Record<string, any> = {};
    for (const k of Object.keys(fields)) {
      res[k] = parseFirestoreValue(fields[k]);
    }
    return res;
  }
  return val;
}

// Extract Main Cover Image according to strict priority:
// 1. post.gallery[0] / item with isCover === true
// 2. post.images[0]
// 3. post.imageUrl or post.image
// 4. Safe default OG image
export function extractMainCoverImage(post: Partial<DecodedPost> | null | undefined): string {
  const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  if (!post) return DEFAULT_IMAGE;

  // 1. Check gallery array
  if (post.gallery && Array.isArray(post.gallery) && post.gallery.length > 0) {
    // Look for explicit cover
    for (const item of post.gallery) {
      if (typeof item === 'object' && item !== null) {
        if (item.isCover && typeof item.url === 'string' && item.url.trim().length > 0) {
          return sanitizeImageUrl(item.url.trim());
        }
      }
    }
    // Otherwise use first item in gallery
    const first = post.gallery[0];
    if (typeof first === 'string' && first.trim().length > 0) {
      return sanitizeImageUrl(first.trim());
    }
    if (typeof first === 'object' && first !== null && typeof (first as any).url === 'string' && (first as any).url.trim().length > 0) {
      return sanitizeImageUrl((first as any).url.trim());
    }
  }

  // 2. Check images array (first image is Main Cover)
  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
    const firstImg = post.images[0];
    if (typeof firstImg === 'string' && firstImg.trim().length > 0) {
      return sanitizeImageUrl(firstImg.trim());
    }
    if (typeof firstImg === 'object' && firstImg !== null && typeof (firstImg as any).url === 'string' && (firstImg as any).url.trim().length > 0) {
      return sanitizeImageUrl((firstImg as any).url.trim());
    }
  }

  // 3. Check imageUrl or image field
  if (typeof post.imageUrl === 'string' && post.imageUrl.trim().length > 0) {
    return sanitizeImageUrl(post.imageUrl.trim());
  }
  if (typeof (post as any).image === 'string' && (post as any).image.trim().length > 0) {
    return sanitizeImageUrl((post as any).image.trim());
  }

  return DEFAULT_IMAGE;
}

function sanitizeImageUrl(url: string): string {
  if (!url) return '';
  let clean = url.trim();
  // Ensure it's not a relative protocol
  if (clean.startsWith('//')) {
    clean = `https:${clean}`;
  } else if (clean.startsWith('http://')) {
    clean = clean.replace(/^http:\/\//i, 'https://');
  } else if (!clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }
  return clean;
}

// In-memory cache with TTL for ultra fast response
const postCache = new Map<string, { post: DecodedPost | null; timestamp: number }>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute

export async function fetchPostByIdServer(postId: string): Promise<DecodedPost | null> {
  if (!postId || typeof postId !== 'string') return null;
  const cleanId = postId.trim();
  if (!cleanId) return null;

  // Check cache first
  const cached = postCache.get(cleanId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.post;
  }

  let foundPost: DecodedPost | null = null;

  // 1. Try Firestore REST API (check prompts collection first, then posts)
  const projectId = (appletConfig as any)?.projectId || 'gen-lang-client-0103668196';
  const databaseId = (appletConfig as any)?.firestoreDatabaseId || 'ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d';
  const apiKey = (appletConfig as any)?.apiKey || 'AIzaSyCCV05qIA8g_NXcxOI8F-71zyWI62UQeDQ';

  const collections = ['prompts', 'posts'];
  for (const col of collections) {
    if (foundPost) break;
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/${col}/${encodeURIComponent(cleanId)}${apiKey ? `?key=${apiKey}` : ''}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3s timeout

      const res = await fetch(firestoreUrl, {
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
        },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.fields) {
          const fields = data.fields;
          const parsed: any = { id: cleanId };
          for (const k of Object.keys(fields)) {
            parsed[k] = parseFirestoreValue(fields[k]);
          }
          foundPost = parsed as DecodedPost;
          break;
        }
      }
    } catch (err: any) {
      // Firestore network notice (fallback will handle)
    }
  }

  // 2. If not found in custom database, check fallback to (default) database if different
  if (!foundPost && databaseId !== '(default)') {
    for (const col of collections) {
      if (foundPost) break;
      try {
        const defaultUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${col}/${encodeURIComponent(cleanId)}${apiKey ? `?key=${apiKey}` : ''}`;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(defaultUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.fields) {
            const fields = data.fields;
            const parsed: any = { id: cleanId };
            for (const k of Object.keys(fields)) {
              parsed[k] = parseFirestoreValue(fields[k]);
            }
            foundPost = parsed as DecodedPost;
            break;
          }
        }
      } catch (err) {
        // ignore
      }
    }
  }

  // 3. Fallback to INITIAL_PROMPTS
  if (!foundPost) {
    const local = INITIAL_PROMPTS.find(
      (p) => p.id === cleanId || p.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') === cleanId.toLowerCase()
    );
    if (local) {
      foundPost = { ...local };
    }
  }

  // Cache result
  postCache.set(cleanId, { post: foundPost, timestamp: Date.now() });

  return foundPost;
}
