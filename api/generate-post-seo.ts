import { handleGeneratePostSeo } from "../server/aiPostCreator";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "20mb",
    },
  },
};

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Expected POST.",
    });
  }

  try {
    const authHeader = req.headers?.authorization || req.headers?.Authorization;
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = await handleGeneratePostSeo(body, authHeader);
    return res.status(result.statusCode).json(result.data);
  } catch (err: any) {
    console.error("[Vercel API generate-post-seo error]:", err);
    return res.status(500).json({
      success: false,
      error: err.message || "Internal server error generating post SEO.",
    });
  }
}
