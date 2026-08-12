import { handleVerifyPayment } from "../../server/paymentServer";

export default async function handler(req: any, res: any) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method Not Allowed. Expected POST.",
    });
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const result = await handleVerifyPayment(body);
    return res.status(result.statusCode).json(result.data);
  } catch (err: any) {
    console.error("[Vercel API verify-payment error]:", err);
    return res.status(500).json({
      success: false,
      verified: false,
      error: err.message || "Internal server error verifying payment.",
    });
  }
}
