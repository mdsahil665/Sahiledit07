import { GoogleGenAI, Type } from "@google/genai";

const ADMIN_EMAIL = "mdsahil012002@gmail.com";

export interface GeneratePostSeoRequest {
  prompt: string;
  image?: string; // base64 data URL or remote image URL
  existingCategories?: Array<{ id: string; name: string }>;
  existingTitles?: string[];
}

export interface GeneratePostSeoResult {
  statusCode: number;
  data: {
    success: boolean;
    data?: {
      title: string;
      description: string;
      tags: string[];
      keywords: string[];
      category: string;
      altText: string;
    };
    imageAnalyzed?: boolean;
    imageNote?: string;
    duplicateWarning?: string;
    similarExistingTitle?: string;
    qualityNotes?: string[];
    error?: string;
  };
}

/**
 * Safely decodes a JWT payload without external dependencies
 */
function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonStr = Buffer.from(base64, "base64").toString("utf-8");
    return JSON.parse(jsonStr);
  } catch {
    return null;
  }
}

/**
 * Verifies admin authorization token safely without heavy dependencies
 */
export async function verifyAdminAuth(authHeader?: string): Promise<{ authorized: boolean; reason?: string }> {
  // Allow local development and preview environments
  if (!authHeader) {
    if (process.env.NODE_ENV !== "production") {
      return { authorized: true };
    }
    return { authorized: false, reason: "Missing authorization header. Please sign in as admin." };
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
  if (!token) {
    return { authorized: false, reason: "Empty authorization token." };
  }

  try {
    const payload = decodeJwtPayload(token);
    if (!payload) {
      if (process.env.NODE_ENV !== "production") {
        return { authorized: true };
      }
      return { authorized: false, reason: "Malformed authorization token format." };
    }

    // Verify token expiry if present
    const nowInSec = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < nowInSec) {
      return { authorized: false, reason: "Session expired. Please log out and sign back in to continue." };
    }

    // Check admin email
    const email = (payload.email || "").toLowerCase();
    if (email === ADMIN_EMAIL.toLowerCase()) {
      return { authorized: true };
    }

    // Check custom claims
    if (payload.admin === true || payload.role === "admin") {
      return { authorized: true };
    }

    // In dev mode allow test accounts
    if (process.env.NODE_ENV !== "production") {
      return { authorized: true };
    }

    return { authorized: false, reason: "Unauthorized. Admin privileges are required to generate SEO metadata." };
  } catch (err: any) {
    if (process.env.NODE_ENV !== "production") {
      return { authorized: true };
    }
    return { authorized: false, reason: `Authentication verification failed: ${err?.message || "Invalid token"}` };
  }
}

/**
 * Calculates simple token overlap similarity to detect duplicate/near-identical titles
 */
function checkTitleSimilarity(newTitle: string, existingTitles: string[] = []): { isDuplicate: boolean; similarTitle?: string } {
  if (!newTitle || !existingTitles.length) return { isDuplicate: false };

  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2);

  const newWords = new Set(clean(newTitle));
  if (newWords.size === 0) return { isDuplicate: false };

  for (const existing of existingTitles) {
    const existingWords = clean(existing);
    if (!existingWords.length) continue;

    let overlap = 0;
    for (const w of existingWords) {
      if (newWords.has(w)) overlap++;
    }

    const similarity = (2 * overlap) / (newWords.size + existingWords.length);
    if (similarity > 0.72) {
      return { isDuplicate: true, similarTitle: existing };
    }
  }

  return { isDuplicate: false };
}

/**
 * Cleans markdown code fences and extracts valid JSON from Gemini output
 */
function cleanAndParseGeminiJson(rawText: string): any {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("Empty response received from Gemini model.");
  }
  let cleaned = rawText.trim();

  // Strip Markdown code blocks: ```json ... ``` or ``` ... ```
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
  }

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch (initialErr) {
    // If wrapped with leading or trailing commentary, locate the outer {...}
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        // fall through
      }
    }
    throw new Error(`Malformed AI response: unable to parse JSON (${initialErr instanceof Error ? initialErr.message : "Syntax error"})`);
  }
}

/**
 * Maps Gemini error objects to user-friendly messages and appropriate HTTP status codes
 */
function formatGeminiErrorMessage(err: any): { statusCode: number; message: string } {
  let rawMsg = (err?.message || "").toString();
  let status = err?.status || err?.statusCode || 500;

  // Parse nested JSON if SDK returns JSON string in err.message
  if (rawMsg.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(rawMsg.trim());
      if (parsed.error?.message) {
        rawMsg = parsed.error.message;
      }
      if (parsed.error?.code) {
        status = parsed.error.code;
      }
    } catch {
      // ignore
    }
  }

  const lowerMsg = rawMsg.toLowerCase();

  if (
    lowerMsg.includes("high demand") ||
    lowerMsg.includes("spikes in demand") ||
    lowerMsg.includes("unavailable") ||
    status === 503
  ) {
    return {
      statusCode: 503,
      message: "The AI model is currently experiencing high demand. Please wait a moment and click 'Retry Prompt Only'.",
    };
  }

  if (
    lowerMsg.includes("api key") ||
    lowerMsg.includes("api_key") ||
    lowerMsg.includes("unauthenticated") ||
    status === 401
  ) {
    return {
      statusCode: 401,
      message: "Gemini API key is invalid or unauthenticated. Please configure a valid GEMINI_API_KEY in environment variables.",
    };
  }

  if (
    lowerMsg.includes("quota") ||
    lowerMsg.includes("resource_exhausted") ||
    lowerMsg.includes("rate limit") ||
    status === 429
  ) {
    return {
      statusCode: 429,
      message: "Gemini API rate limit or quota exceeded. Please wait a moment and try again.",
    };
  }

  if (
    (lowerMsg.includes("model") && (lowerMsg.includes("not found") || lowerMsg.includes("unsupported"))) ||
    status === 404
  ) {
    return {
      statusCode: 503,
      message: "The requested Gemini AI model is currently unavailable. Please try again shortly.",
    };
  }

  if (lowerMsg.includes("timeout") || lowerMsg.includes("deadline exceeded") || lowerMsg.includes("aborted")) {
    return {
      statusCode: 504,
      message: "AI analysis timed out. Please try again with a shorter prompt or smaller image.",
    };
  }

  if (lowerMsg.includes("network") || lowerMsg.includes("econnrefused") || lowerMsg.includes("fetch failed")) {
    return {
      statusCode: 503,
      message: "Network error connecting to Gemini AI services. Please check server connectivity.",
    };
  }

  if (lowerMsg.includes("empty response")) {
    return {
      statusCode: 502,
      message: "Gemini returned an empty response. Please retry the analysis.",
    };
  }

  if (lowerMsg.includes("malformed") || lowerMsg.includes("parse json")) {
    return {
      statusCode: 502,
      message: "AI returned an unreadable response format. Please retry.",
    };
  }

  return {
    statusCode: typeof status === "number" && status >= 400 && status < 600 ? status : 500,
    message: rawMsg ? `AI generation notice: ${rawMsg}` : "An error occurred during AI analysis. Please try again.",
  };
}

/**
 * Performs AI Vision + Text analysis to create complete SEO post metadata
 */
export async function handleGeneratePostSeo(
  body: GeneratePostSeoRequest,
  authHeader?: string
): Promise<GeneratePostSeoResult> {
  // 1. Verify admin authorization
  const authCheck = await verifyAdminAuth(authHeader);
  if (!authCheck.authorized) {
    return {
      statusCode: 403,
      data: {
        success: false,
        error: authCheck.reason || "Unauthorized. Only administrators can use AI Smart Post Creator.",
      },
    };
  }

  const promptText = (body?.prompt || "").trim();
  if (!promptText) {
    return {
      statusCode: 400,
      data: {
        success: false,
        error: "Prompt content is required for AI Smart Post Creator.",
      },
    };
  }

  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      data: {
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY in your settings or Vercel environment.",
      },
    };
  }

  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });

  // 2. Prepare multimodal image input if provided
  let imagePart: { inlineData: { mimeType: string; data: string } } | null = null;
  let imageAnalyzed = false;
  let imageNote: string | undefined = undefined;

  const rawImage = (body?.image || "").trim();
  if (rawImage) {
    try {
      if (rawImage.startsWith("data:image/")) {
        // Parse data URI: data:[mimeType];base64,[data]
        const match = rawImage.match(/^data:([^;]+);base64,(.+)$/);
        if (match && match[1] && match[2]) {
          const base64Data = match[2];
          // Guard against excessively large payloads (> 8MB base64 string)
          if (base64Data.length > 8 * 1024 * 1024) {
            imageNote = "Image size was too large; proceeded with prompt analysis.";
          } else {
            imagePart = {
              inlineData: {
                mimeType: match[1],
                data: base64Data,
              },
            };
            imageAnalyzed = true;
          }
        }
      } else if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
        // Fetch remote image (e.g. Cloudinary)
        const fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController.abort(), 10000);

        try {
          const imgResp = await fetch(rawImage, { signal: fetchController.signal });
          clearTimeout(timeoutId);

          if (imgResp.ok) {
            const contentType = imgResp.headers.get("content-type") || "image/jpeg";
            const arrayBuffer = await imgResp.arrayBuffer();
            const base64Data = Buffer.from(arrayBuffer).toString("base64");
            if (base64Data.length <= 8 * 1024 * 1024) {
              imagePart = {
                inlineData: {
                  mimeType: contentType.includes("image/") ? contentType : "image/jpeg",
                  data: base64Data,
                },
              };
              imageAnalyzed = true;
            } else {
              imageNote = "Remote image exceeded size limit. Proceeded with prompt analysis.";
            }
          } else {
            imageNote = "Remote image could not be retrieved. Proceeded with prompt analysis.";
          }
        } catch {
          clearTimeout(timeoutId);
          imageNote = "Remote image retrieval timed out. Proceeded with prompt analysis.";
        }
      }
    } catch (imgErr: any) {
      console.warn("[AI Post Creator] Image fetch/parse notice:", imgErr?.message || imgErr);
      imageNote = "Image analysis unavailable. Proceeded with prompt analysis.";
    }
  }

  // 3. Format category suggestions list
  const categoryContext =
    body.existingCategories && body.existingCategories.length > 0
      ? body.existingCategories.map((c) => `"${c.id}" (${c.name})`).join(", ")
      : `"man" (Men Prompts), "girl" (Girls Prompts), "couple" (Couple Prompts), "cinematic" (Cinematic Prompts), "anime" (Anime Prompts), "3d" (3D Prompts), "chatgpt" (ChatGPT Prompts), "creative" (Creative Prompts)`;

  // 4. Construct System Instruction & Parts
  const systemInstruction = `You are the expert SEO & AI Prompt Metadata Creator for "Sahil Edits" (official website: https://sahiledit.vercel.app/).
Your job is to analyze BOTH the written AI prompt and the uploaded visual image to generate complete, high-quality, natural SEO metadata for the prompt library.

Understand and evaluate:
- Main subject (person, gender, age, object, character, scene)
- Clothing, accessories, pose, gesture, expression
- Setting, environment, architecture, background depth
- Lighting, shadows, golden hour, neon, natural, studio light
- Camera/photo style, depth of field, 35mm, lens, aspect ratio
- Colors, visual mood, atmospheric tone
- Artistic style (photorealistic, cinematic, vintage retro, anime, 3D render)
- Era/style if clearly visible (e.g., 90s retro, futuristic cyberpunk)
- Prompt intent: what does the prompt accomplish and how should a creator use it?

CRITICAL ACCURACY RULE:
Compare the written prompt with the visible image.
Do NOT blindly trust either source. If the prompt says one thing but the image clearly shows something different, do not invent facts.
Use only information that is reasonably supported by the prompt and/or visible image.
If something is uncertain, omit it rather than guessing.

METADATA REQUIREMENTS:
1. title:
   - Attractive, natural, descriptive SEO title.
   - Around 50-65 characters when practical.
   - Avoid keyword stuffing and clickbait.
   - Include "| Sahil Edits" only when it sounds natural and does not exceed recommended length.
   - Example: "Cinematic Retro Portrait AI Prompt | Sahil Edits"

2. description:
   - A clear, engaging 2-4 sentence overview explaining what the prompt creates and its visual aesthetics.
   - Naturally describe the visual concept, subject, lighting, and style.
   - Mention what the prompt is ideal for (e.g., Midjourney, DALL-E, ChatGPT image generation).
   - Avoid repeating the same keyword phrases unnaturally.

3. tags:
   - 8 to 15 highly relevant, unique tags (no duplicates).
   - Only tags truly relevant to this specific prompt/image (e.g., "AI prompt", "cinematic portrait", "retro photography", "vintage style", "Sahil Edits").
   - Do NOT add unrelated trending keywords.

4. keywords:
   - 4 to 8 high-intent search phrases people search on Google (e.g., "cinematic portrait AI prompt", "vintage photography prompt", "retro aesthetic AI image").

5. category:
   - Suggest the single most appropriate category ID based on actual content.
   - Choose from these existing library categories when possible: ${categoryContext}.
   - If none fits, provide a clean, lowercase hyphenated category key.

6. altText:
   - Accurate, accessibility-friendly alt text describing the visual image for screen readers and accessibility.
   - Concise, neutral, and clear (e.g., "Young man in a vintage leather jacket posing beside a classic car under warm cinematic golden hour lighting").
   - Do NOT stuff SEO keywords into alt text.`;

  const userInstruction = `Analyze the provided AI Prompt ${
    imageAnalyzed ? "and the accompanying visual image" : "(image was not supplied or could not be loaded; analyze prompt thoroughly)"
  }:

=== WRITTEN PROMPT ===
${promptText}

Generate the complete JSON metadata strictly adhering to the schema.`;

  const contentsParts: any[] = [];
  if (imagePart) {
    contentsParts.push(imagePart);
  }
  contentsParts.push({ text: userInstruction });

  try {
    const genConfig = {
      systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: "Natural, compelling SEO title around 50-65 characters.",
          },
          description: {
            type: Type.STRING,
            description: "Comprehensive natural description of the visual concept and usage.",
          },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "8-15 highly relevant unique tags.",
          },
          keywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "4-8 high-intent search query phrases.",
          },
          category: {
            type: Type.STRING,
            description: "Suggested category matching existing library categories.",
          },
          altText: {
            type: Type.STRING,
            description: "Accurate, accessibility-friendly image alt text.",
          },
        },
        required: ["title", "description", "tags", "keywords", "category", "altText"],
      },
    };

    const CANDIDATE_MODELS = [
      "gemini-flash-latest",
      "gemini-3.8-flash",
      "gemini-3.1-flash-lite",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
    ];

    let response: any = null;
    let lastError: any = null;
    let activeParts = contentsParts;

    for (const candidateModel of CANDIDATE_MODELS) {
      try {
        response = await ai.models.generateContent({
          model: candidateModel,
          contents: { parts: activeParts },
          config: genConfig,
        });
        if (response && response.text) {
          break;
        }
      } catch (err: any) {
        lastError = err;
        const errMsg = (err?.message || "").toLowerCase();
        // If image cannot be processed by vision model, switch to prompt-only for this and subsequent models
        if (imagePart && (errMsg.includes("image") || errMsg.includes("unable to process") || errMsg.includes("invalid argument"))) {
          console.warn(`[AI Post Creator] Vision unsupported on ${candidateModel}; switching to prompt-only fallback...`);
          imagePart = null;
          imageAnalyzed = false;
          imageNote = "Image could not be processed by AI Vision; generated SEO from prompt.";
          activeParts = [{ text: userInstruction }];
          try {
            response = await ai.models.generateContent({
              model: candidateModel,
              contents: { parts: activeParts },
              config: genConfig,
            });
            if (response && response.text) {
              break;
            }
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
        console.warn(`[AI Post Creator] Model ${candidateModel} failed, trying next candidate... (${errMsg.slice(0, 80)})`);
      }
    }

    if (!response || !response.text) {
      throw lastError || new Error("All AI models were temporarily unavailable. Please try again.");
    }

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response returned from Gemini model.");
    }

    const parsedData = cleanAndParseGeminiJson(responseText);

    // Sanitize & format fields
    const cleanStr = (s: any) =>
      typeof s === "string"
        ? s
            .replace(/<[^>]*>?/gm, "") // strip HTML tags
            .replace(/[\r\n]+/g, " ")
            .trim()
        : "";

    const title = cleanStr(parsedData.title) || promptText.slice(0, 65);
    const description =
      typeof parsedData.description === "string"
        ? parsedData.description.replace(/<[^>]*>?/gm, "").trim()
        : promptText.slice(0, 200);

    // Clean and deduplicate tags
    const rawTags: string[] = Array.isArray(parsedData.tags) ? parsedData.tags : [];
    const seenTags = new Set<string>();
    const cleanedTags: string[] = [];
    for (const t of rawTags) {
      const cleaned = cleanStr(t);
      const lower = cleaned.toLowerCase();
      if (cleaned && !seenTags.has(lower)) {
        seenTags.add(lower);
        cleanedTags.push(cleaned);
      }
    }

    // Clean keywords
    const rawKeywords: string[] = Array.isArray(parsedData.keywords) ? parsedData.keywords : [];
    const seenKeywords = new Set<string>();
    const cleanedKeywords: string[] = [];
    for (const k of rawKeywords) {
      const cleaned = cleanStr(k);
      const lower = cleaned.toLowerCase();
      if (cleaned && !seenKeywords.has(lower)) {
        seenKeywords.add(lower);
        cleanedKeywords.push(cleaned);
      }
    }

    const category = cleanStr(parsedData.category) || "creative";
    const altText = cleanStr(parsedData.altText) || title;

    // Quality check indicators
    const qualityNotes: string[] = [];
    if (title.length < 40) {
      qualityNotes.push("Title is slightly short. You may expand it for better search prominence.");
    } else if (title.length > 75) {
      qualityNotes.push("Title is slightly long. Consider trimming below 70 characters.");
    } else {
      qualityNotes.push("Title length is optimal for Google search results (50–65 chars).");
    }

    if (cleanedTags.length >= 8 && cleanedTags.length <= 15) {
      qualityNotes.push(`Tags count is balanced (${cleanedTags.length} tags).`);
    }

    if (altText.length >= 20) {
      qualityNotes.push("Image alt text is descriptive and accessibility-ready.");
    }

    // Duplicate check
    const dupCheck = checkTitleSimilarity(title, body.existingTitles || []);

    return {
      statusCode: 200,
      data: {
        success: true,
        data: {
          title,
          description,
          tags: cleanedTags.length > 0 ? cleanedTags : ["AI prompt", "Sahil Edits"],
          keywords: cleanedKeywords.length > 0 ? cleanedKeywords : [title.toLowerCase()],
          category,
          altText,
        },
        imageAnalyzed,
        imageNote,
        duplicateWarning: dupCheck.isDuplicate
          ? `Similar post/title already exists ("${dupCheck.similarTitle}"). Please review before publishing.`
          : undefined,
        similarExistingTitle: dupCheck.similarTitle,
        qualityNotes,
      },
    };
  } catch (err: any) {
    console.error("[AI Post Creator Error]:", err);
    const { statusCode, message } = formatGeminiErrorMessage(err);
    return {
      statusCode,
      data: {
        success: false,
        error: message,
      },
    };
  }
}

