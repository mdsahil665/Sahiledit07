import { handleTestConnection } from "../../server/paymentServer";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method Not Allowed. Expected POST.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = await handleTestConnection(body);
    return res.status(result.statusCode).json(result.data);
  } catch (err: any) {
    console.error("[Vercel API test-connection error]:", err);
    return res.status(500).json({
      success: false,
      message: `✕ Razorpay connection failed: ${err.message || "Internal server error."}`,
    });
  }
}
