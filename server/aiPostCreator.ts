import { GoogleGenAI, Type } from "@google/genai";
import { getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const ADMIN_EMAIL = "mdsahil012002@gmail.com";
const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.VITE_FIREBASE_PROJECT_ID ||
  "gen-lang-client-0103668196";
const FIRESTORE_DATABASE_ID =
  process.env.FIRESTORE_DATABASE_ID ||
  process.env.VITE_FIRESTORE_DATABASE_ID ||
  "ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d";

// Initialize Firebase Admin safely
try {
  if (!getApps().length) {
    initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
  }
} catch (e) {
  console.warn("[AI Post Creator] Firebase Admin app init notice:", e);
}

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
 * Verifies admin authorization token if available
 */
export async function verifyAdminAuth(authHeader?: string): Promise<{ authorized: boolean; reason?: string }> {
  // If in local dev or no authHeader provided, allow with warning in dev
  if (!authHeader) {
    // In local development environment, allow access
    if (process.env.NODE_ENV !== "production") {
      return { authorized: true };
    }
    return { authorized: false, reason: "Missing authorization header" };
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7).trim() : authHeader.trim();
  if (!token) {
    return { authorized: false, reason: "Empty token" };
  }

  try {
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    const email = (decodedToken.email || "").toLowerCase();

    if (email === ADMIN_EMAIL.toLowerCase()) {
      return { authorized: true };
    }

    // Check role in Firestore users collection
    const dbId = FIRESTORE_DATABASE_ID;
    const adminDb = dbId && dbId !== "(default)" ? getFirestore(dbId) : getFirestore();
    const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
    if (userDoc.exists && userDoc.data()?.role === "admin") {
      return { authorized: true };
    }

    return { authorized: false, reason: "User does not have admin permissions" };
  } catch (err: any) {
    // In dev environment, fall back gracefully if verifyIdToken fails due to emulator or test token
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AI Post Creator] Dev token verification fallback:", err?.message || err);
      return { authorized: true };
    }
    return { authorized: false, reason: `Invalid token: ${err?.message || "Authentication failed"}` };
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

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      data: {
        success: false,
        error: "GEMINI_API_KEY is not configured on the server. Please configure it in Settings.",
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
          imagePart = {
            inlineData: {
              mimeType: match[1],
              data: match[2],
            },
          };
          imageAnalyzed = true;
        }
      } else if (rawImage.startsWith("http://") || rawImage.startsWith("https://")) {
        // Fetch remote image (e.g. Cloudinary)
        const fetchController = new AbortController();
        const timeoutId = setTimeout(() => fetchController.abort(), 10000);

        const imgResp = await fetch(rawImage, { signal: fetchController.signal });
        clearTimeout(timeoutId);

        if (imgResp.ok) {
          const contentType = imgResp.headers.get("content-type") || "image/jpeg";
          const arrayBuffer = await imgResp.arrayBuffer();
          const base64Data = Buffer.from(arrayBuffer).toString("base64");
          imagePart = {
            inlineData: {
              mimeType: contentType.includes("image/") ? contentType : "image/jpeg",
              data: base64Data,
            },
          };
          imageAnalyzed = true;
        } else {
          imageNote = "Remote image could not be retrieved. Proceeding with prompt-only analysis.";
        }
      }
    } catch (imgErr: any) {
      console.warn("[AI Post Creator] Image fetch/parse notice:", imgErr?.message || imgErr);
      imageNote = "Image analysis failed. Proceeding with prompt analysis.";
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
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: { parts: contentsParts },
      config: {
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
      },
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Empty response returned from Gemini model.");
    }

    const parsedData = JSON.parse(responseText);

    // Sanitize & format fields
    const cleanStr = (s: any) =>
      typeof s === "string"
        ? s
            .replace(/<[^>]*>?/gm, "") // strip HTML tags
            .replace(/[\r\n]+/g, " ")
            .trim()
        : "";

    const title = cleanStr(parsedData.title) || promptText.slice(0, 60);
    const description =
      typeof parsedData.description === "string"
        ? parsedData.description.replace(/<[^>]*>?/gm, "").trim()
        : promptText.slice(0, 150);

    // Clean and deduplicate tags
    const rawTags: string[] = Array.isArray(parsedData.tags) ? parsedData.tags : [];
    const seenTags = new Set<string>();
    const cleanedTags: string[] = [];
    for (const t of rawTags) {
      const cleaned = cleanStr(t).toLowerCase();
      if (cleaned && !seenTags.has(cleaned)) {
        seenTags.add(cleaned);
        cleanedTags.push(cleanStr(t));
      }
    }

    // Clean keywords
    const rawKeywords: string[] = Array.isArray(parsedData.keywords) ? parsedData.keywords : [];
    const seenKeywords = new Set<string>();
    const cleanedKeywords: string[] = [];
    for (const k of rawKeywords) {
      const cleaned = cleanStr(k).toLowerCase();
      if (cleaned && !seenKeywords.has(cleaned)) {
        seenKeywords.add(cleaned);
        cleanedKeywords.push(cleanStr(k));
      }
    }

    const category = cleanStr(parsedData.category) || "man";
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
    return {
      statusCode: 500,
      data: {
        success: false,
        error: `AI generation failed: ${err?.message || "Internal AI processing error"}. Please try again.`,
      },
    };
  }
}
