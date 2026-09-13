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
 * Optimizes an image File to a lightweight compressed Data URL specifically for fast AI Vision analysis (max 900px, 80% JPEG).
 * Produces tiny payloads (~70-130 KB) that upload instantly and avoid serverless body size limits.
 */
export async function prepareImageForAiAnalysis(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_DIM = 900;
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
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
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
 * Calls server-side AI Vision + Text endpoint to analyze prompt + image and generate complete SEO metadata.
 * Safely inspects HTTP status, headers, and text body before parsing to prevent unexpected token crashes.
 */
export async function requestAiPostSeo(options: GeneratePostSeoOptions): Promise<GeneratePostSeoResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 50000); // 50s timeout

  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (options.idToken) {
      headers['Authorization'] = `Bearer ${options.idToken}`;
    }

    const payload = {
      prompt: (options.prompt || '').trim(),
      image: options.image || undefined,
      existingCategories: options.categories?.map((c) => ({ id: c.id, name: c.name })) || [],
      existingTitles: options.existingTitles || [],
    };

    let res: Response;
    try {
      res = await fetch('/api/generate-post-seo', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr: any) {
      if (fetchErr?.name === 'AbortError') {
        return {
          success: false,
          error: 'AI analysis timed out. Please try again or retry with prompt only.',
        };
      }
      return {
        success: false,
        error: 'Network connection error: Unable to reach the AI server. Please check your internet connection and try again.',
      };
    } finally {
      clearTimeout(timeoutId);
    }

    // Step 1: Safely read the raw response text first (never call res.json() directly)
    let rawText = '';
    try {
      rawText = await res.text();
    } catch (readErr: any) {
      return {
        success: false,
        error: `Failed to read server response (HTTP ${res.status}). Please try again.`,
      };
    }

    // Step 2: Check Content-Type header
    const contentType = res.headers.get('content-type') || '';
    const isJsonContentType = contentType.toLowerCase().includes('application/json');

    // Step 3: Safely test if response is valid JSON
    let result: any = null;
    let isJsonValid = false;

    if (rawText && rawText.trim()) {
      try {
        result = JSON.parse(rawText.trim());
        if (result && typeof result === 'object') {
          isJsonValid = true;
        }
      } catch (parseErr) {
        isJsonValid = false;
      }
    }

    // Step 4: If not valid JSON, provide friendly error message based on status and response text
    if (!isJsonValid) {
      console.warn('[AI Post Service] Non-JSON server response received:', {
        status: res.status,
        contentType,
        preview: rawText.slice(0, 160),
      });

      if (res.status === 413 || rawText.includes('Payload Too Large')) {
        return {
          success: false,
          error: 'Image is too large for the AI analysis server. Please select a smaller photo or click "Retry Prompt Only".',
        };
      }

      if (res.status === 504 || rawText.includes('Gateway Timeout') || rawText.includes('FUNCTION_INVOCATION_TIMEOUT')) {
        return {
          success: false,
          error: 'AI analysis timed out on the server. Please try again in a few moments.',
        };
      }

      if (rawText.includes('A server error has occurred') || rawText.includes('FUNCTION_INVOCATION_FAILED') || res.status === 500) {
        return {
          success: false,
          error: 'The AI server encountered a temporary processing error. Please try again or use "Retry Prompt Only".',
        };
      }

      if (res.status === 404) {
        return {
          success: false,
          error: 'AI analysis service endpoint was not found (404). Please verify your deployment.',
        };
      }

      return {
        success: false,
        error: `Server returned an unexpected response (Status ${res.status}). Please try again.`,
      };
    }

    // Step 5: Check logical success flag in the JSON response
    if (!res.ok || !result.success) {
      return {
        success: false,
        error: result.error || `AI generation failed (Status ${res.status}). Please try again.`,
      };
    }

    // Step 6: Validate and sanitize the success payload
    const data = result.data;
    if (!data || typeof data !== 'object') {
      return {
        success: false,
        error: 'AI returned an empty metadata object. Please retry.',
      };
    }

    return {
      success: true,
      data: {
        title: typeof data.title === 'string' ? data.title.trim() : '',
        description: typeof data.description === 'string' ? data.description.trim() : '',
        tags: Array.isArray(data.tags)
          ? data.tags.filter((t: any) => typeof t === 'string' && t.trim()).map((t: string) => t.trim())
          : [],
        keywords: Array.isArray(data.keywords)
          ? data.keywords.filter((k: any) => typeof k === 'string' && k.trim()).map((k: string) => k.trim())
          : [],
        category: typeof data.category === 'string' ? data.category.trim() : '',
        altText: typeof data.altText === 'string' ? data.altText.trim() : '',
      },
      imageAnalyzed: Boolean(result.imageAnalyzed),
      imageNote: result.imageNote,
      duplicateWarning: result.duplicateWarning,
      similarExistingTitle: result.similarExistingTitle,
      qualityNotes: Array.isArray(result.qualityNotes) ? result.qualityNotes : [],
    };
  } catch (err: any) {
    console.error('[AI Post Service Unexpected Error]:', err);
    return {
      success: false,
      error: err?.message || 'An unexpected error occurred during AI analysis. Please try again.',
    };
  }
}

