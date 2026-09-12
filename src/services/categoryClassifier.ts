import { PromptPost } from '../types';
import { normalizeCategoryKey } from '../utils/categoryUtils';

export interface CategoryClassificationResult {
  categoryId: string;
  categoryName: string;
  confidence: 'high' | 'medium' | 'low';
  reason: string;
}

export interface PostInputSignals {
  title?: string;
  shortDescription?: string;
  metaDescription?: string;
  tags?: string[] | string;
  photoPrompt?: string;
  videoPrompt?: string;
  fullPrompt?: string;
  existingCategoryId?: string;
  existingCategoryName?: string;
  postType?: 'photo_prompt' | 'video_prompt';
}

/**
 * Intelligent category classifier that understands what a post is about
 * based on title, tags, descriptions, prompts, and metadata.
 * Prioritizes strong semantic intent over incidental keywords.
 */
export function classifyPostContent(input: PostInputSignals): CategoryClassificationResult {
  const title = (input.title || '').trim();
  const titleLower = title.toLowerCase();

  const tagsList: string[] = Array.isArray(input.tags)
    ? input.tags.map((t) => String(t).trim())
    : typeof input.tags === 'string'
    ? input.tags.split(',').map((t) => t.trim())
    : [];
  const tagsLower = tagsList.map((t) => t.toLowerCase());
  const tagsCombined = tagsLower.join(' ');

  const desc = ((input.shortDescription || '') + ' ' + (input.metaDescription || '')).toLowerCase();
  const photoPrompt = (input.photoPrompt || input.fullPrompt || '').toLowerCase();
  const videoPrompt = (input.videoPrompt || '').toLowerCase();
  const combinedPrompts = `${photoPrompt} ${videoPrompt}`;

  // Helper for whole-word or boundary matching
  const hasWord = (text: string, words: string[]): boolean => {
    return words.some((word) => {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      return regex.test(text);
    });
  };

  // -------------------------------------------------------------
  // 1. BIRTHDAY SIGNALS (Highest specificity: Birthday themes)
  // -------------------------------------------------------------
  const birthdayCoreWords = ['birthday', 'bday', 'happy birthday', 'janamdin'];
  const birthdayTitleHit = hasWord(titleLower, birthdayCoreWords);
  const birthdayTagsHit = hasWord(tagsCombined, birthdayCoreWords);
  const birthdayDescHit = hasWord(desc, ['birthday poster', 'birthday edit', 'happy birthday', 'birthday celebration', 'birthday wishes', 'birthday story']);

  if (birthdayTitleHit || birthdayTagsHit || (birthdayDescHit && hasWord(desc, birthdayCoreWords))) {
    return {
      categoryId: 'birthday',
      categoryName: 'Birthday',
      confidence: birthdayTitleHit || birthdayTagsHit ? 'high' : 'medium',
      reason: 'Post explicitly celebrates a birthday theme, birthday poster, or birthday wishes.',
    };
  }

  // -------------------------------------------------------------
  // 2. FAMILY SIGNALS (Multi-generational, parents, siblings)
  // -------------------------------------------------------------
  const familyCoreWords = ['family', 'parivar', 'families', 'parents', 'mom and dad', 'father and son', 'father and daughter', 'mother and son', 'mother and daughter', 'family portrait', 'family photo'];
  const familyTitleHit = hasWord(titleLower, familyCoreWords);
  const familyTagsHit = hasWord(tagsCombined, familyCoreWords);
  const familyPromptHit = hasWord(combinedPrompts, ['family portrait', 'family members', 'with his family', 'with her family', 'entire family', 'parents and children']);

  if (familyTitleHit || familyTagsHit || familyPromptHit) {
    return {
      categoryId: 'family',
      categoryName: 'Family',
      confidence: familyTitleHit || familyTagsHit ? 'high' : 'medium',
      reason: 'Post content and composition explicitly represent a family or multi-generational group.',
    };
  }

  // -------------------------------------------------------------
  // 3. COUPLE SIGNALS (Two people in a romantic/partnered pairing)
  // -------------------------------------------------------------
  const coupleCoreWords = [
    'couple',
    'couples',
    'romantic couple',
    'husband and wife',
    'boyfriend and girlfriend',
    'two lovers',
    'bride and groom',
    'wedding couple',
    'holding hands together',
    'couple portrait',
    'pre-wedding shoot',
    'couple aesthetic',
    'love birds',
  ];
  const coupleTitleHit = hasWord(titleLower, coupleCoreWords);
  const coupleTagsHit = hasWord(tagsCombined, coupleCoreWords);
  // To avoid classifying a single person standing near the beach who merely has "romantic mood",
  // couple requires two subjects explicitly or clear couple tags/title
  const coupleExplicitPrompt = hasWord(combinedPrompts, [
    'two people standing together',
    'a young man and a young woman together',
    'romantic couple pose',
    'holding each other',
    'couple embracing',
    'husband and wife',
    'boyfriend and girlfriend',
    'bride and groom together',
  ]);

  if (coupleTitleHit || coupleTagsHit || coupleExplicitPrompt) {
    return {
      categoryId: 'couple',
      categoryName: 'Couple',
      confidence: coupleTitleHit || coupleTagsHit ? 'high' : 'medium',
      reason: 'Post represents a couple, romantic pair, or two people together.',
    };
  }

  // -------------------------------------------------------------
  // 4. WOMAN / FEMALE SIGNALS (Single female subject)
  // -------------------------------------------------------------
  const womanCoreWords = [
    'woman',
    'women',
    'female',
    'girl',
    'girls',
    'lady',
    'ladies',
    'queen',
    'she',
    'her',
    'actress',
    'female model',
    'saree portrait',
    'lehenga',
    'feminine aesthetic',
    'female portrait',
  ];
  let womanScore = 0;
  if (hasWord(titleLower, ['woman', 'women', 'female', 'girl', 'lady', 'queen'])) womanScore += 5;
  if (hasWord(tagsCombined, ['woman', 'women', 'female', 'girl', 'lady', 'female portrait', 'girl portrait', 'female model'])) womanScore += 4;
  if (hasWord(photoPrompt, ['female subject', 'young woman', 'beautiful girl', 'her face', 'her hair', 'female portrait', 'she is wearing'])) womanScore += 3;

  // -------------------------------------------------------------
  // 5. MAN / MALE SIGNALS (Single male subject)
  // -------------------------------------------------------------
  const manCoreWords = [
    'man',
    'men',
    'male',
    'boy',
    'boys',
    'guy',
    'gentleman',
    'handsome boy',
    'schoolboy',
    'brother',
    'son',
    'king',
    'mens fashion',
    'menswear',
    'beard',
    'mustache',
    'male portrait',
    'sharp jawline',
  ];
  let manScore = 0;
  if (hasWord(titleLower, ['man', 'men', 'male', 'boy', 'guy', 'schoolboy', 'king', 'gangster', 'hero'])) manScore += 5;
  if (hasWord(tagsCombined, ['man', 'men', 'male', 'boy', 'mens fashion', 'male portrait', 'handsome boy', 'stylish boy'])) manScore += 4;
  if (hasWord(photoPrompt, ['young man', 'male subject', 'his face', 'his beard', 'his hair', 'handsome guy', 'he is wearing', 'athletic man'])) manScore += 3;

  // Independence Day / National / Action portraits with male subjects
  if (hasWord(titleLower, ['independence day', '15 august', 'tiranga', 'army', 'sonam wangchuk', 'motu patlu']) && manScore >= womanScore) {
    manScore += 3;
  }

  if (womanScore > manScore && womanScore >= 3) {
    return {
      categoryId: 'woman',
      categoryName: 'Woman',
      confidence: womanScore >= 5 ? 'high' : 'medium',
      reason: 'Post content indicates a single female subject or women photo editing theme.',
    };
  }

  if (manScore > womanScore && manScore >= 3) {
    return {
      categoryId: 'man',
      categoryName: 'Man',
      confidence: manScore >= 5 ? 'high' : 'medium',
      reason: 'Post content indicates a single male subject, portrait, or men styling theme.',
    };
  }

  // -------------------------------------------------------------
  // 6. VIDEO PROMPT check
  // -------------------------------------------------------------
  if (input.postType === 'video_prompt' || videoPrompt.length > 50) {
    return {
      categoryId: 'video',
      categoryName: 'Video',
      confidence: 'medium',
      reason: 'Post contains dedicated video camera generation directions.',
    };
  }

  // -------------------------------------------------------------
  // 7. PRESERVE ADMIN / EXISTING CATEGORY IF RECOGNIZED
  // -------------------------------------------------------------
  if (input.existingCategoryId) {
    const existingNorm = normalizeCategoryKey(input.existingCategoryId);
    if (['man', 'woman', 'couple', 'family', 'birthday', 'video', 'chatgpt', 'gemini', 'image-prompt'].includes(existingNorm)) {
      return {
        categoryId: existingNorm,
        categoryName: existingNorm.charAt(0).toUpperCase() + existingNorm.slice(1),
        confidence: 'high',
        reason: 'Preserved explicitly configured category assignment.',
      };
    }
  }

  // Default fallback to 'man' for the predominant male editorial catalog
  return {
    categoryId: 'man',
    categoryName: 'Man',
    confidence: 'low',
    reason: 'Defaulted to Man category based on catalog defaults.',
  };
}

/**
 * Suggest category id for a post input.
 */
export function suggestCategoryForPost(input: PostInputSignals): string {
  const result = classifyPostContent(input);
  return result.categoryId;
}
