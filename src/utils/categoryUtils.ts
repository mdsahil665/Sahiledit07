import { Category, PromptPost } from '../types';

export const CORE_CATEGORIES: Category[] = [
  {
    id: 'man',
    name: 'Man',
    slug: 'man',
    icon: 'User',
    color: 'blue',
    bgLight: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    description: 'Curated AI photo editing prompts for men portraits, stylish looks & masculine aesthetics.',
  },
  {
    id: 'woman',
    name: 'Woman',
    slug: 'woman',
    icon: 'UserCheck',
    color: 'pink',
    bgLight: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20',
    description: 'Curated AI photo editing prompts for women portraits, beauty & elegant feminine aesthetics.',
  },
  {
    id: 'couple',
    name: 'Couple',
    slug: 'couple',
    icon: 'Heart',
    color: 'rose',
    bgLight: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    description: 'Romantic couple AI photo editing prompts, matching aesthetic portraits & love themes.',
  },
  {
    id: 'family',
    name: 'Family',
    slug: 'family',
    icon: 'Users',
    color: 'amber',
    bgLight: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Warm family AI photo editing prompts, group portraits & memorable moments.',
  },
  {
    id: 'birthday',
    name: 'Birthday',
    slug: 'birthday',
    icon: 'Cake',
    color: 'purple',
    bgLight: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description: 'Birthday celebration AI photo editing prompts, royal king birthday posters & festive stories.',
  },
];

/**
 * Normalize any raw category string, ID, or slug to a clean canonical category key.
 */
export function normalizeCategoryKey(rawCategory: string | null | undefined): string {
  if (!rawCategory) return '';
  const trimmed = rawCategory.trim().toLowerCase();

  if (trimmed === 'man' || trimmed === 'men' || trimmed === 'male' || trimmed === 'boy' || trimmed === 'boys') {
    return 'man';
  }
  if (trimmed === 'woman' || trimmed === 'women' || trimmed === 'female' || trimmed === 'girl' || trimmed === 'girls') {
    return 'woman';
  }
  if (trimmed === 'couple' || trimmed === 'couples' || trimmed === 'couple-prompt' || trimmed === 'couples-prompt') {
    return 'couple';
  }
  if (trimmed === 'family' || trimmed === 'families' || trimmed === 'family-prompt') {
    return 'family';
  }
  if (trimmed === 'birthday' || trimmed === 'bday' || trimmed === 'birthday-prompt' || trimmed === 'birthdays') {
    return 'birthday';
  }
  if (trimmed === 'video' || trimmed === 'video-prompt' || trimmed === 'videos') {
    return 'video';
  }
  if (trimmed === 'chatgpt' || trimmed === 'chat-gpt') {
    return 'chatgpt';
  }
  if (trimmed === 'gemini') {
    return 'gemini';
  }
  if (trimmed === 'image-prompt' || trimmed === 'image_prompt' || trimmed === 'image') {
    return 'image-prompt';
  }

  return trimmed;
}

/**
 * Get the user-facing display name for a category key.
 */
export function getCategoryDisplayName(categoryKey: string | null | undefined): string {
  if (!categoryKey) return '';
  const normalized = normalizeCategoryKey(categoryKey);
  const foundCore = CORE_CATEGORIES.find((c) => c.id === normalized);
  if (foundCore) return foundCore.name;

  if (normalized === 'video') return 'Video';
  if (normalized === 'chatgpt') return 'ChatGPT';
  if (normalized === 'gemini') return 'Gemini';
  if (normalized === 'image-prompt') return 'Image Prompt';

  // Capitalize first letter
  return categoryKey.charAt(0).toUpperCase() + categoryKey.slice(1);
}

/**
 * Check if text contains whole words or strong indicators of a birthday theme.
 */
function hasBirthdayIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    lower.includes('birthday') ||
    lower.includes('bday') ||
    lower.includes('happy birthday') ||
    lower.includes('birthday poster') ||
    lower.includes('birthday edit') ||
    lower.includes('birthday story') ||
    lower.includes('birthday wishes')
  );
}

/**
 * Resolve the true canonical category key for a post document.
 * Follows strict priority:
 * 1. Normalized post.categoryId (if valid core/standard category)
 * 2. Normalized post.categoryName (if provided)
 * 3. Legacy category ID fallback or intelligent content understanding if legacy/empty
 */
export function getPostCategoryKey(post: Partial<PromptPost>): string {
  if (!post) return 'man';

  // 1. If post already has a recognized normalized categoryId (like 'man', 'woman', 'birthday', etc.)
  if (post.categoryId) {
    const norm = normalizeCategoryKey(post.categoryId);
    // If it maps to one of our standard keys (and not an unmapped legacy id like 'cat-1786...')
    if (['man', 'woman', 'couple', 'family', 'birthday', 'video', 'chatgpt', 'gemini', 'image-prompt'].includes(norm)) {
      return norm;
    }
  }

  // 2. If post has categoryName set
  if (post.categoryName) {
    const normName = normalizeCategoryKey(post.categoryName);
    if (['man', 'woman', 'couple', 'family', 'birthday', 'video', 'chatgpt', 'gemini', 'image-prompt'].includes(normName)) {
      return normName;
    }
  }

  // 3. Fallback for legacy posts or unclassified posts:
  // Inspect title, tags, description and prompts to resolve legacy assignments without guessing
  const title = post.title || '';
  const tagsStr = Array.isArray(post.tags) ? post.tags.join(' ') : '';
  const desc = post.shortDescription || post.metaDescription || '';

  // Birthday check: title or tags explicitly mention birthday
  if (hasBirthdayIntent(title) || hasBirthdayIntent(tagsStr)) {
    return 'birthday';
  }

  // Family check
  const familyTerms = ['family', 'parents', 'mom and dad', 'father and son', 'mother and daughter', 'family portrait'];
  const combinedMeta = `${title} ${tagsStr}`.toLowerCase();
  if (familyTerms.some((t) => combinedMeta.includes(t))) {
    return 'family';
  }

  // Couple check
  const coupleTerms = ['couple', 'couples', 'husband and wife', 'romantic couple', 'boyfriend and girlfriend', 'bride and groom'];
  if (coupleTerms.some((t) => combinedMeta.includes(t))) {
    return 'couple';
  }

  // Woman check
  const womanTerms = ['woman', 'women', 'female model', 'girl portrait', 'beautiful woman', 'female beauty', 'lady'];
  if (womanTerms.some((t) => combinedMeta.includes(t))) {
    return 'woman';
  }

  // Video prompt check
  if (post.postType === 'video_prompt' || post.videoPrompt || post.categoryId === 'cat-1788542702173') {
    return 'video';
  }

  // Default to Man for the existing male portrait/lifestyle editorial collection
  return 'man';
}

/**
 * Strict category filter: returns true if and only if the post's actual category matches
 * the selected category.
 * NO broad keyword searching across unrelated fields.
 * NO cross-category leakage.
 */
export function isPostStrictlyInCategory(post: PromptPost, selectedCategory: string | null): boolean {
  if (!selectedCategory) return true;

  const targetCategoryKey = normalizeCategoryKey(selectedCategory);
  if (!targetCategoryKey) return true;

  const postCategoryKey = getPostCategoryKey(post);

  // Exact match between the post's canonical category key and target category key
  if (postCategoryKey === targetCategoryKey) {
    return true;
  }

  // Also check direct match on raw categoryId or categoryName for custom admin categories
  const rawIdLower = (post.categoryId || '').trim().toLowerCase();
  const rawNameLower = (post.categoryName || '').trim().toLowerCase();
  const selLower = selectedCategory.trim().toLowerCase();

  if (rawIdLower === selLower || rawNameLower === selLower) {
    return true;
  }

  return false;
}
