export interface PostLikeItem {
  id: string;
  title?: string;
  slug?: string;
}

/**
 * Convert any string or title into a clean SEO-friendly slug
 * Examples:
 * - "The Modern Executive" -> "the-modern-executive"
 * - "🇮🇳 15 August Independence Day 🇮🇳 | Happy Independence Day India | Jai Hind ❤️"
 *   -> "15-august-independence-day-happy-independence-day-india-jai-hind"
 */
export function createSlugFromTitle(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ') // strip emojis and special symbols
    .trim()
    .replace(/\s+/g, '-') // convert spaces to single hyphen
    .replace(/-+/g, '-') // collapse consecutive hyphens
    .replace(/^-+|-+$/g, '') // strip leading and trailing hyphens
    .substring(0, 80) // limit slug length for clean URLs
    .replace(/-+$/g, '');
}

/**
 * Generate clean SEO friendly slug matching promptplum.com style
 * e.g. "https://promptplum.com/prompt/the-modern-executive"
 * -> "/prompt/the-modern-executive"
 */
export function getPromptSlug(post: PostLikeItem): string {
  if (!post) return '';
  if (post.slug && post.slug.trim()) {
    return createSlugFromTitle(post.slug);
  }

  const cleanTitle = createSlugFromTitle(post.title || '');
  if (cleanTitle && cleanTitle.length >= 2) {
    return cleanTitle;
  }

  return post.id || '';
}

/**
 * Get full canonical share URL for a post
 */
export function getPromptShareUrl(post: PostLikeItem, origin?: string): string {
  const base = origin || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'https://sahiledit.vercel.app');
  const slug = getPromptSlug(post);
  return `${base}/prompt/${encodeURIComponent(slug)}`;
}

/**
 * Extract clean post ID or slug from any URL path or query parameter
 */
export function extractPromptIdFromParam(param: string): string {
  if (!param) return '';
  const decoded = decodeURIComponent(param).trim().replace(/\/+$/, '');

  // 1. Look for prompt-timestamp-hash pattern if embedded
  const promptMatch = decoded.match(/(prompt-[\w-]+)/i);
  if (promptMatch && promptMatch[1]) {
    return promptMatch[1];
  }

  return decoded;
}

