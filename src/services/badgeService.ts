import { PromptPost, PostCardConfig } from '../types';
import { getPostCreatedAtMillis } from './promptStore';

export type BadgeMode = 'automatic' | 'none' | 'manual';
export type BadgeType = 'NEW' | 'AI PROMPT' | 'PHOTO PROMPT' | 'CREATIVE' | 'TRENDING' | 'HOT' | 'PREMIUM';

export const ALL_BADGE_TYPES: BadgeType[] = [
  'NEW',
  'AI PROMPT',
  'PHOTO PROMPT',
  'CREATIVE',
  'TRENDING',
  'HOT',
  'PREMIUM',
];

/**
 * Identify the top 3 newest published posts that have badgeMode === 'automatic' (or unset).
 */
export function getLatest3NewPostIds(allPosts: PromptPost[]): Set<string> {
  if (!allPosts || allPosts.length === 0) return new Set();

  // Filter published posts that are eligible for automatic badges
  const eligiblePosts = allPosts.filter((p) => {
    const isPublished = !p.status || p.status === 'published';
    const isAutomatic = !p.badgeMode || p.badgeMode === 'automatic';
    return isPublished && isAutomatic;
  });

  // Sort strictly by createdAt / publishedAt timestamp descending
  const sorted = [...eligiblePosts].sort((a, b) => {
    const timeB = getPostCreatedAtMillis(b);
    const timeA = getPostCreatedAtMillis(a);
    return timeB - timeA;
  });

  // Top 3 IDs
  const top3 = sorted.slice(0, 3).map((p) => p.id);
  return new Set(top3);
}

/**
 * Smart automatic badge detection based on title, description, category, tags, and prompt content.
 */
export function calculateSmartContentBadge(post: Partial<PromptPost>): BadgeType | null {
  if (!post) return null;

  // 1. Explicit admin flags on the post document
  if (post.trending) {
    return 'TRENDING';
  }
  if ((post as any).hot === true) {
    return 'HOT';
  }
  if ((post as any).premium === true || (post as any).isPremium === true) {
    return 'PREMIUM';
  }

  // Combine text fields for content analysis
  const title = (post.title || '').toLowerCase();
  const desc = (post.shortDescription || '').toLowerCase();
  const prompt = (post.fullPrompt || '').toLowerCase();
  const category = (post.categoryName || post.categoryId || '').toLowerCase();
  const tags = Array.isArray(post.tags) ? post.tags.map((t) => String(t).toLowerCase()).join(' ') : '';

  const combinedContent = `${title} ${desc} ${prompt} ${category} ${tags}`;

  // 2. Photo / Photography focus terms
  const photoPatterns = [
    'photo prompt',
    'photo editing',
    'portrait',
    'cinematic portrait',
    'dslr',
    'photography',
    'studio portrait',
    'fashion photography',
    'realistic photo',
    'image prompt',
    'photo realistic',
    'photorealistic',
    '8k photo',
    'hyper-realistic photo',
    'candid photo',
    'close-up portrait',
    'men ai photo',
    'women ai photo',
    'couple photo',
  ];
  if (photoPatterns.some((pattern) => combinedContent.includes(pattern))) {
    return 'PHOTO PROMPT';
  }

  // 3. Creative / Concept / Art focus terms
  const creativePatterns = [
    'creative',
    'creative idea',
    'creative concept',
    'concept art',
    'poster',
    'fantasy',
    'surreal',
    'illustration',
    'graphic design',
    'anime style',
    'vector art',
    'digital art',
    'cyberpunk art',
    'logo design',
    'abstract art',
  ];
  if (creativePatterns.some((pattern) => combinedContent.includes(pattern))) {
    return 'CREATIVE';
  }

  // 4. AI Generation / AI Prompt terms
  const aiPatterns = [
    'ai prompt',
    'chatgpt',
    'gemini',
    'claude',
    'midjourney',
    'flux',
    'ai image',
    'ai photo',
    'ai art',
    'ai generation',
    'prompt',
    'dall-e',
    'stable diffusion',
    'bing image creator',
    'gpt-4',
    'deepseek',
  ];
  if (aiPatterns.some((pattern) => combinedContent.includes(pattern))) {
    return 'AI PROMPT';
  }

  return null;
}

export interface PostBadgeResult {
  badgeType: BadgeType | string | null;
  label: string;
  mode: BadgeMode;
  isLatestNew?: boolean;
}

/**
 * Main resolution function for post badge.
 * Priority:
 * 1. MANUAL (always wins)
 * 2. NONE (completely disables badge)
 * 3. AUTOMATIC NEW (latest 3 eligible posts)
 * 4. AUTOMATIC SMART CATEGORY
 * 5. NO BADGE
 */
export function getPostDisplayBadge(
  post: Partial<PromptPost> | null | undefined,
  allPosts: PromptPost[] = [],
  _cardConfig?: Partial<PostCardConfig>
): PostBadgeResult | null {
  if (!post) return null;

  const mode: BadgeMode = post.badgeMode || 'automatic';

  // 1. NONE mode
  if (mode === 'none') {
    return null;
  }

  // 2. MANUAL mode (Admin choice strictly honored)
  if (mode === 'manual') {
    const manualType = (post.badgeType || 'AI PROMPT').trim();
    if (!manualType) return null;
    return {
      badgeType: manualType,
      label: manualType,
      mode: 'manual',
      isLatestNew: manualType === 'NEW',
    };
  }

  // 3. AUTOMATIC / SMART mode
  // A. Check if eligible for top 3 NEW
  if (allPosts && allPosts.length > 0 && post.id) {
    const latest3Ids = getLatest3NewPostIds(allPosts);
    if (latest3Ids.has(post.id)) {
      return {
        badgeType: 'NEW',
        label: 'NEW',
        mode: 'automatic',
        isLatestNew: true,
      };
    }
  }

  // B. Not in top 3: calculate smart badge from content
  const smartBadge = calculateSmartContentBadge(post);
  if (smartBadge) {
    return {
      badgeType: smartBadge,
      label: smartBadge,
      mode: 'automatic',
      isLatestNew: false,
    };
  }

  // C. Fallback: No badge
  return null;
}
