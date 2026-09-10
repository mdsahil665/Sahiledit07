import { INITIAL_PROMPTS } from '../src/data/initialData';
import { createSlugFromTitle, getPromptSlug } from '../src/utils/promptUrl';

const FIREBASE_CONFIG = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'gen-lang-client-0103668196',
  firestoreDatabaseId: process.env.VITE_FIRESTORE_DATABASE_ID || process.env.FIRESTORE_DATABASE_ID || 'ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d',
  apiKey: process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyCCV05qIA8g_NXcxOI8F-71zyWI62UQeDQ',
};



export interface DecodedPost {
  id: string;
  slug?: string;
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
// Returns the valid public HTTP/HTTPS URL, or empty string if no valid public image exists.
// Never invent fake images or return base64 data URIs.
export function extractMainCoverImage(post: Partial<DecodedPost> | null | undefined): string {
  if (!post) return '';

  // 1. Check gallery array
  if (post.gallery && Array.isArray(post.gallery) && post.gallery.length > 0) {
    // Look for explicit cover
    for (const item of post.gallery) {
      if (typeof item === 'object' && item !== null) {
        if (item.isCover && typeof item.url === 'string' && isValidHttpUrl(item.url)) {
          return sanitizeImageUrl(item.url.trim());
        }
      }
    }
    // Otherwise use first valid item in gallery
    for (const item of post.gallery) {
      if (typeof item === 'string' && isValidHttpUrl(item)) {
        return sanitizeImageUrl(item.trim());
      }
      if (typeof item === 'object' && item !== null && typeof (item as any).url === 'string' && isValidHttpUrl((item as any).url)) {
        return sanitizeImageUrl((item as any).url.trim());
      }
    }
  }

  // 2. Check images array (first valid image is Main Cover)
  if (post.images && Array.isArray(post.images) && post.images.length > 0) {
    for (const img of post.images) {
      if (typeof img === 'string' && isValidHttpUrl(img)) {
        return sanitizeImageUrl(img.trim());
      }
      if (typeof img === 'object' && img !== null && typeof (img as any).url === 'string' && isValidHttpUrl((img as any).url)) {
        return sanitizeImageUrl((img as any).url.trim());
      }
    }
  }

  // 3. Check imageUrl or image field
  if (typeof post.imageUrl === 'string' && isValidHttpUrl(post.imageUrl)) {
    return sanitizeImageUrl(post.imageUrl.trim());
  }
  if (typeof (post as any).image === 'string' && isValidHttpUrl((post as any).image)) {
    return sanitizeImageUrl((post as any).image.trim());
  }

  return '';
}

function isValidHttpUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:')) return false; // Do not use data URIs for social meta tags
  return trimmed.startsWith('https://') || trimmed.startsWith('http://') || trimmed.startsWith('//');
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

export async function fetchPostByIdServer(postIdOrSlug: string): Promise<DecodedPost | null> {
  if (!postIdOrSlug || typeof postIdOrSlug !== 'string') return null;
  let rawParam = postIdOrSlug.trim();
  if (!rawParam) return null;

  // Extract ID if param is an embedded id or clean slug
  let cleanId = rawParam;
  const promptMatch = rawParam.match(/(prompt-[\w-]+)/i);
  if (promptMatch && promptMatch[1]) {
    cleanId = promptMatch[1];
  }

  const normalizedLookup = createSlugFromTitle(rawParam);

  // Check cache first
  const cached = postCache.get(cleanId) || postCache.get(rawParam) || (normalizedLookup ? postCache.get(normalizedLookup) : null);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.post;
  }

  let foundPost: DecodedPost | null = null;

  const projectId = FIREBASE_CONFIG.projectId;
  const databaseId = FIREBASE_CONFIG.firestoreDatabaseId;
  const apiKey = FIREBASE_CONFIG.apiKey;


  // 1. If cleanId looks like a direct document ID (e.g. prompt-1786...), try direct Firestore GET first
  if (cleanId.startsWith('prompt-')) {
    const directUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/prompts/${encodeURIComponent(cleanId)}${apiKey ? `?key=${apiKey}` : ''}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);
      const res = await fetch(directUrl, {
        signal: controller.signal,
        headers: { Accept: 'application/json' },
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        if (data && data.fields) {
          const parsed: any = { id: cleanId };
          for (const k of Object.keys(data.fields)) {
            parsed[k] = parseFirestoreValue(data.fields[k]);
          }
          foundPost = parsed as DecodedPost;
        }
      }
    } catch (err) {
      // ignore direct fetch error
    }
  }

  // 2. If not found yet (e.g. rawParam is a title slug like "15-august-independence-day..."), query Firestore collection
  if (!foundPost) {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery${apiKey ? `?key=${apiKey}` : ''}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(queryUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          structuredQuery: {
            from: [{ collectionId: 'prompts' }],
            limit: 100,
          },
        }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const listData = await res.json();
        if (Array.isArray(listData)) {
          const allFetched: DecodedPost[] = [];
          for (const item of listData) {
            if (item.document && item.document.fields) {
              const docId = item.document.name.split('/').pop() || '';
              const parsed: any = { id: docId };
              for (const k of Object.keys(item.document.fields)) {
                parsed[k] = parseFirestoreValue(item.document.fields[k]);
              }
              const postObj = parsed as DecodedPost;
              allFetched.push(postObj);

              // Cache individually
              postCache.set(docId, { post: postObj, timestamp: Date.now() });
              const postSlug = getPromptSlug(postObj);
              if (postSlug) {
                postCache.set(postSlug, { post: postObj, timestamp: Date.now() });
              }
            }
          }

          // Match by exact ID, exact slug, or title slug
          const targetSlug = normalizedLookup || createSlugFromTitle(cleanId);
          foundPost =
            allFetched.find((p) => p.id === cleanId || p.id === rawParam) ||
            allFetched.find((p) => p.slug && createSlugFromTitle(p.slug) === targetSlug) ||
            allFetched.find((p) => getPromptSlug(p) === targetSlug) ||
            allFetched.find((p) => createSlugFromTitle(p.title) === targetSlug) ||
            allFetched.find((p) => {
              const tSlug = createSlugFromTitle(p.title);
              return tSlug && (targetSlug.startsWith(tSlug) || tSlug.startsWith(targetSlug));
            }) ||
            null;
        }
      }
    } catch (queryErr) {
      console.error('[Firestore runQuery Error]', queryErr);
    }
  }

  // 3. Fallback to INITIAL_PROMPTS if still not found
  if (!foundPost) {
    const targetSlug = normalizedLookup || createSlugFromTitle(cleanId);
    const local = INITIAL_PROMPTS.find(
      (p) =>
        p.id === cleanId ||
        p.id === rawParam ||
        getPromptSlug(p) === targetSlug ||
        createSlugFromTitle(p.title) === targetSlug
    );
    if (local) {
      foundPost = { ...local };
    }
  }

  // Cache result under all aliases
  if (foundPost) {
    postCache.set(cleanId, { post: foundPost, timestamp: Date.now() });
    postCache.set(rawParam, { post: foundPost, timestamp: Date.now() });
    if (normalizedLookup) {
      postCache.set(normalizedLookup, { post: foundPost, timestamp: Date.now() });
    }
  }

  return foundPost;
}

let allPostsCache: { posts: DecodedPost[]; timestamp: number } | null = null;
const ALL_POSTS_CACHE_TTL_MS = 60 * 1000; // 1 minute

/**
 * Fetches all published posts from Firestore or falls back to INITIAL_PROMPTS.
 * Used for dynamic sitemap generation and crawler indexing.
 */
export async function fetchAllPostsServer(): Promise<DecodedPost[]> {
  const now = Date.now();
  if (allPostsCache && now - allPostsCache.timestamp < ALL_POSTS_CACHE_TTL_MS) {
    return allPostsCache.posts;
  }

  const projectId = FIREBASE_CONFIG.projectId;
  const databaseId = FIREBASE_CONFIG.firestoreDatabaseId;
  const apiKey = FIREBASE_CONFIG.apiKey;

  try {
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery${apiKey ? `?key=${apiKey}` : ''}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'prompts' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 100,
        },
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const listData = await res.json();
      if (Array.isArray(listData)) {
        const posts: DecodedPost[] = [];
        for (const item of listData) {
          if (item.document && item.document.fields) {
            const docId = item.document.name.split('/').pop() || '';
            const parsed: any = { id: docId };
            for (const k of Object.keys(item.document.fields)) {
              parsed[k] = parseFirestoreValue(item.document.fields[k]);
            }
            const postObj = parsed as DecodedPost;
            // Only include published posts
            if (postObj.status !== 'draft') {
              posts.push(postObj);

              // Cache in individual map as well
              postCache.set(docId, { post: postObj, timestamp: now });
              const postSlug = getPromptSlug(postObj);
              if (postSlug) {
                postCache.set(postSlug, { post: postObj, timestamp: now });
              }
            }
          }
        }

        if (posts.length > 0) {
          allPostsCache = { posts, timestamp: now };
          return posts;
        }
      }
    }
  } catch (err) {
    console.error('[fetchAllPostsServer Error]', err);
  }

  // Fallback to INITIAL_PROMPTS
  const localPublished = INITIAL_PROMPTS.filter((p) => p.status !== 'draft') as DecodedPost[];
  allPostsCache = { posts: localPublished, timestamp: now };
  return localPublished;
}

