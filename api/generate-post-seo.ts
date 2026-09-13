import { handleGeneratePostSeo } from "../server/aiPostCreator";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "10mb",
    },
  },
};

export default async function handler(req: any, res: any) {
  // Always guarantee Content-Type is application/json
  try {
    res.setHeader("Content-Type", "application/json");
  } catch {
    // ignore if headers already locked
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Expected POST.",
    });
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    let body = req.body;
    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch {
        return res.status(400).json({
          success: false,
          error: "Invalid JSON in request payload.",
        });
      }
    }
    body = body || {};

    const result = await handleGeneratePostSeo(body, authHeader);
    return res.status(result.statusCode || 200).json(result.data);
  } catch (err: any) {
    console.error("[API generate-post-seo error]:", err);
    return res.status(500).json({
      success: false,
      error: err?.message || "Internal server error generating post SEO.",
    });
  }
}

