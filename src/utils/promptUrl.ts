export interface PostLikeItem {
  id: string;
  title?: string;
  slug?: string;
}

/**
 * Generate clean SEO friendly slug matching promptplum.com style
 * Example: "15-august-independence-day-india-prompt-1786738947556-vugo"
 */
export function getPromptSlug(post: PostLikeItem): string {
  if (!post || !post.id) return '';
  if (post.slug && post.slug.trim()) {
    return post.slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  }

  const rawTitle = (post.title || '').trim();
  // Strip emojis, symbols, keeping alphanumeric characters
  const cleanTitle = rawTitle
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 60);

  if (cleanTitle && cleanTitle.length > 2) {
    // If cleanTitle doesn't already contain the id
    if (!cleanTitle.includes(post.id.toLowerCase())) {
      return `${cleanTitle}-${post.id}`;
    }
    return cleanTitle;
  }

  return post.id;
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
 * Extract clean post ID from any URL path or query parameter
 * Handles:
 * - "/prompt/the-modern-executive-prompt-1786738947556-vugo" -> "prompt-1786738947556-vugo"
 * - "/prompt/prompt-1786738947556-vugo" -> "prompt-1786738947556-vugo"
 * - "/post/prompt-1786738947556-vugo" -> "prompt-1786738947556-vugo"
 * - "prompt-1786738947556-vugo" -> "prompt-1786738947556-vugo"
 */
export function extractPromptIdFromParam(param: string): string {
  if (!param) return '';
  const decoded = decodeURIComponent(param).trim().replace(/\/+$/, '');

  // 1. Look for prompt-timestamp-hash pattern
  const promptMatch = decoded.match(/(prompt-[\w-]+)/i);
  if (promptMatch && promptMatch[1]) {
    return promptMatch[1];
  }

  // 2. Check if string ends with an ID after the last hyphen
  const lastHyphen = decoded.lastIndexOf('-');
  if (lastHyphen !== -1 && lastHyphen < decoded.length - 2) {
    const candidateId = decoded.substring(lastHyphen + 1);
    if (candidateId.length >= 4) {
      // might be an ID
    }
  }

  return decoded;
}
