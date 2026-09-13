import { AiGeneratedSeoData, Category } from '../types';
import { compressImageFile } from '../lib/imageUtils';

export interface GeneratePostSeoOptions {
  prompt: string;
  image?: string; // base64 data URL or external URL
  categories?: Category[];
  existingTitles?: string[];
  idToken?: string | null;
}

export interface GeneratePostSeoResponse {
  success: boolean;
  data?: AiGeneratedSeoData;
  imageAnalyzed?: boolean;
  imageNote?: string;
  duplicateWarning?: string;
  similarExistingTitle?: string;
  qualityNotes?: string[];
  error?: string;
}

/**
 * Optimizes an image File to a lightweight compressed Data URL specifically for fast AI Vision analysis (max 1200px, 80% JPEG).
 */
export async function prepareImageForAiAnalysis(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          resolve(compressedDataUrl);
        } else {
          resolve(e.target?.result as string);
        }
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      // Fallback to standard compressor if FileReader fails
      compressImageFile(file).then(resolve).catch(() => resolve(''));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calls server-side AI Vision + Text endpoint to analyze prompt + image and generate complete SEO metadata
 */
export async function requestAiPostSeo(options: GeneratePostSeoOptions): Promise<GeneratePostSeoResponse> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (options.idToken) {
      headers['Authorization'] = `Bearer ${options.idToken}`;
    }

    const payload = {
      prompt: options.prompt.trim(),
      image: options.image || undefined,
      existingCategories: options.categories?.map((c) => ({ id: c.id, name: c.name })) || [],
      existingTitles: options.existingTitles || [],
    };

    const res = await fetch('/api/generate-post-seo', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const result = await res.json();

    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || 'AI generation failed. Please try again.',
      };
    }

    return {
      success: true,
      data: result.data,
      imageAnalyzed: result.imageAnalyzed,
      imageNote: result.imageNote,
      duplicateWarning: result.duplicateWarning,
      similarExistingTitle: result.similarExistingTitle,
      qualityNotes: result.qualityNotes,
    };
  } catch (err: any) {
    console.error('[AI Post Service Request Error]:', err);
    return {
      success: false,
      error: err?.message || 'Network error connecting to AI Post Creator endpoint. Please try again.',
    };
  }
}
