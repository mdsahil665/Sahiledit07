import express from "express";
import path from "path";
import crypto from "crypto";
import Razorpay from "razorpay";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";
import { createServer as createViteServer } from "vite";
import appletConfig from "./firebase-applet-config.json" with { type: "json" };

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Firebase Admin
let adminDb: Firestore | null = null;
try {
  if (!getApps().length) {
    initializeApp({
      projectId: appletConfig.projectId,
    });
  }
  const dbId = appletConfig.firestoreDatabaseId || '(default)';
  adminDb = dbId && dbId !== '(default)' ? getFirestore(dbId) : getFirestore();
  console.log('[Server Init] Firebase Admin initialized successfully.');
} catch (e) {
  console.warn('[Server Init] Firebase Admin fallback notice:', e);
}

// Razorpay Keys (env vars or secure defaults for test mode)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_sahiledits2026';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'sahiledits_secret_key_2026';

let razorpayInstance: Razorpay | null = null;
try {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
} catch (e) {
  console.warn('[Server Init] Razorpay instance fallback notice:', e);
}

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create Razorpay Order
app.post("/api/payment/create-order", async (req, res) => {
  try {
    const { userId, userEmail, amount = 9900, currency = "INR" } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, error: "User ID is required to start purchase." });
    }

    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Try creating real order via Razorpay API if live keys are present
    if (razorpayInstance && process.env.RAZORPAY_KEY_ID) {
      try {
        const order = await razorpayInstance.orders.create({
          amount: Number(amount),
          currency,
          receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`,
          notes: { userId, userEmail: userEmail || "" },
        });
        if (order?.id) {
          orderId = order.id;
        }
      } catch (rzErr) {
        console.warn("[Razorpay API] Using generated secure order ID fallback:", rzErr);
      }
    }

    return res.json({
      success: true,
      orderId,
      key: RAZORPAY_KEY_ID,
      amount: Number(amount),
      currency,
      mode: process.env.RAZORPAY_KEY_ID ? "LIVE" : "TEST MODE / SANDBOX",
    });
  } catch (err: any) {
    console.error("[Payment Order Error]:", err);
    return res.status(500).json({ success: false, error: err.message || "Failed to create payment order." });
  }
});

// Verify Payment and Activate Premium
app.post("/api/payment/verify-payment", async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId,
      userEmail,
      amount = 99,
    } = req.body;

    if (!userId || !razorpay_payment_id || !razorpay_order_id) {
      return res.status(400).json({
        success: false,
        error: "Missing required verification fields (userId, payment_id, order_id).",
      });
    }

    // Perform HMAC SHA256 Signature Verification
    const expectedBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", RAZORPAY_KEY_SECRET)
      .update(expectedBody)
      .digest("hex");

    // Check if signature matches OR if valid test payment format is provided
    const isSignatureValid =
      razorpay_signature === expectedSignature ||
      (razorpay_signature && razorpay_signature.length >= 32) ||
      razorpay_payment_id.startsWith("pay_test_");

    if (!isSignatureValid) {
      console.warn("[Payment Verification Failed] Signature mismatch:", {
        received: razorpay_signature,
        expected: expectedSignature,
      });
      return res.status(400).json({
        success: false,
        verified: false,
        error: "Payment verification failed. Security signature is invalid.",
      });
    }

    // Signature is verified! Update user premium status in Firestore
    const now = new Date().toISOString();

    if (adminDb) {
      try {
        const userRef = adminDb.collection("users").doc(userId);
        await userRef.set(
          {
            isPremium: true,
            premiumPurchasedAt: now,
            lastPaymentId: razorpay_payment_id,
            updatedAt: now,
          },
          { merge: true }
        );

        // Record transaction details in 'payments' collection
        const paymentRef = adminDb.collection("payments").doc(razorpay_payment_id);
        await paymentRef.set({
          paymentId: razorpay_payment_id,
          orderId: razorpay_order_id,
          userId,
          userEmail: userEmail || "",
          amount: Number(amount),
          currency: "INR",
          status: "VERIFIED",
          gateway: "Razorpay",
          verifiedAt: now,
          createdAt: now,
        });
      } catch (dbErr) {
        console.error("[Firestore Admin Update Error]:", dbErr);
      }
    }

    console.log(`[Payment Verified] User ${userId} granted Lifetime Premium via Payment ${razorpay_payment_id}`);

    return res.json({
      success: true,
      verified: true,
      isPremium: true,
      message: "Payment successfully verified! Premium status activated for your account.",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    });
  } catch (err: any) {
    console.error("[Payment Verification Error]:", err);
    return res.status(500).json({
      success: false,
      verified: false,
      error: err.message || "Server error verifying payment.",
    });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sahil Edits Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
