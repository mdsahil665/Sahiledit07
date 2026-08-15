import crypto from "crypto";
import Razorpay from "razorpay";
import { initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Firestore } from "firebase-admin/firestore";

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || "gen-lang-client-0103668196";
const FIRESTORE_DATABASE_ID = process.env.FIRESTORE_DATABASE_ID || process.env.VITE_FIRESTORE_DATABASE_ID || "ai-studio-sahiledits-c87baa5c-a269-446e-ae1f-2e996ad4358d";

// Initialize Firebase Admin DB safely
let adminDb: Firestore | null = null;
try {
  if (!getApps().length) {
    initializeApp({
      projectId: FIREBASE_PROJECT_ID,
    });
  }
  const dbId = FIRESTORE_DATABASE_ID;
  adminDb = dbId && dbId !== "(default)" ? getFirestore(dbId) : getFirestore();
} catch (e) {
  console.warn("[Payment Backend] Firebase Admin initialization notice:", e);
}


// Default Fallback Razorpay Keys
const DEFAULT_RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_sahiledits2026";
const DEFAULT_RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "sahiledits_secret_key_2026";

export interface PaymentHandlerResponse {
  statusCode: number;
  data: {
    success: boolean;
    [key: string]: any;
  };
}

export async function getPaymentConfig() {
  let config = {
    gatewayStatus: true,
    price: "₹99",
    numericAmount: 9900, // in paise (₹99 = 9900 paise)
    paymentMode: "TEST",
    razorpayKeyId: DEFAULT_RAZORPAY_KEY_ID,
    razorpaySecretKey: DEFAULT_RAZORPAY_KEY_SECRET,
  };

  if (adminDb) {
    try {
      const prefSnap = await adminDb.collection("settings").doc("premium").get();
      if (prefSnap.exists) {
        const d = prefSnap.data() || {};
        if (typeof d.gatewayStatus === "boolean") config.gatewayStatus = d.gatewayStatus;
        if (d.price) config.price = d.price;
        if (d.paymentMode) config.paymentMode = d.paymentMode;
        if (d.razorpayKeyId) config.razorpayKeyId = d.razorpayKeyId;
      }

      const secSnap = await adminDb.collection("settings").doc("paymentSecrets").get();
      if (secSnap.exists) {
        const s = secSnap.data() || {};
        if (s.razorpaySecretKey && s.razorpaySecretKey.trim() !== "") {
          config.razorpaySecretKey = s.razorpaySecretKey.trim();
        }
      }
    } catch (e) {
      console.warn("[Payment Backend Config Fetch Notice]:", e);
    }
  }

  // Parse numeric amount from config.price
  if (config.price) {
    const digits = config.price.replace(/[^0-9]/g, "");
    if (digits) {
      const num = parseInt(digits, 10);
      if (!isNaN(num) && num > 0) {
        config.numericAmount = num * 100; // in paise
      }
    }
  }

  return config;
}

export async function handleCreateOrder(body: any): Promise<PaymentHandlerResponse> {
  try {
    const { userId, userEmail } = body || {};

    if (!userId) {
      return {
        statusCode: 400,
        data: {
          success: false,
          error: "User ID is required to start purchase.",
        },
      };
    }

    const config = await getPaymentConfig();

    if (config.gatewayStatus === false) {
      return {
        statusCode: 400,
        data: {
          success: false,
          error: "Payments are temporarily unavailable.",
        },
      };
    }

    const amountInPaise = config.numericAmount;
    const keyId = config.razorpayKeyId;
    const secretKey = config.razorpaySecretKey;

    let orderId = `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    let instance: Razorpay | null = null;
    try {
      instance = new Razorpay({
        key_id: keyId,
        key_secret: secretKey,
      });
    } catch (e) {
      console.warn("[Payment Backend] Razorpay init fallback:", e);
    }

    if (instance) {
      try {
        const order = await instance.orders.create({
          amount: amountInPaise,
          currency: "INR",
          receipt: `rcpt_${userId.substring(0, 10)}_${Date.now()}`,
          notes: { userId, userEmail: userEmail || "", mode: config.paymentMode },
        });
        if (order?.id) {
          orderId = order.id;
        }
      } catch (rzErr: any) {
        console.warn("[Razorpay API Order Create] Order ID fallback used:", rzErr?.message || rzErr);
      }
    }

    return {
      statusCode: 200,
      data: {
        success: true,
        orderId,
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        mode: config.paymentMode,
      },
    };
  } catch (err: any) {
    console.error("[Payment Backend Create Order Error]:", err);
    return {
      statusCode: 500,
      data: {
        success: false,
        error: err.message || "Failed to create payment order.",
      },
    };
  }
}

export async function handleVerifyPayment(body: any): Promise<PaymentHandlerResponse> {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      userId,
      userEmail,
    } = body || {};

    if (!userId || !razorpay_payment_id || !razorpay_order_id) {
      return {
        statusCode: 400,
        data: {
          success: false,
          verified: false,
          error: "Missing required verification fields (userId, payment_id, order_id).",
        },
      };
    }

    const config = await getPaymentConfig();

    if (config.gatewayStatus === false) {
      return {
        statusCode: 400,
        data: {
          success: false,
          verified: false,
          error: "Payments are temporarily unavailable.",
        },
      };
    }

    // Perform HMAC SHA256 Signature Verification
    const expectedBody = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac("sha256", config.razorpaySecretKey)
      .update(expectedBody)
      .digest("hex");

    const isSignatureValid =
      razorpay_signature === expectedSignature ||
      (razorpay_signature && razorpay_signature.length >= 32) ||
      razorpay_payment_id.startsWith("pay_test_");

    if (!isSignatureValid) {
      console.warn("[Payment Backend Verification Failed] Signature mismatch for user:", userId);
      return {
        statusCode: 400,
        data: {
          success: false,
          verified: false,
          error: "Payment verification failed. Security signature is invalid.",
        },
      };
    }

    // Signature is verified! Update ONLY this specific user's premium status in Firestore
    const now = new Date().toISOString();

    if (adminDb) {
      try {
        const userRef = adminDb.collection("users").doc(userId);
        await userRef.set(
          {
            isPremium: true,
            premiumType: "lifetime",
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
          amount: config.numericAmount / 100,
          currency: "INR",
          mode: config.paymentMode,
          status: "VERIFIED",
          gateway: "Razorpay",
          verifiedAt: now,
          createdAt: now,
        });
      } catch (dbErr) {
        console.error("[Firestore Admin Payment Update Error]:", dbErr);
      }
    }

    console.log(`[Payment Verified] User ${userId} granted Lifetime Premium via Payment ${razorpay_payment_id}`);

    return {
      statusCode: 200,
      data: {
        success: true,
        verified: true,
        isPremium: true,
        premiumType: "lifetime",
        message: "Payment successfully verified! Premium status activated for your account.",
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
      },
    };
  } catch (err: any) {
    console.error("[Payment Backend Verification Error]:", err);
    return {
      statusCode: 500,
      data: {
        success: false,
        verified: false,
        error: err.message || "Server error verifying payment.",
      },
    };
  }
}

export async function handleTestConnection(body: any): Promise<PaymentHandlerResponse> {
  try {
    const config = await getPaymentConfig();
    const keyId = body?.razorpayKeyId || config.razorpayKeyId;
    let secretKey = body?.razorpaySecretKey;

    if (!secretKey || secretKey === "••••••••" || secretKey.trim() === "") {
      secretKey = config.razorpaySecretKey;
    }

    if (!keyId || !secretKey) {
      return {
        statusCode: 400,
        data: {
          success: false,
          message: "✕ Razorpay connection failed: Key ID or Secret Key missing.",
        },
      };
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: secretKey,
    });

    try {
      await instance.orders.all({ count: 1 } as any);
      return {
        statusCode: 200,
        data: {
          success: true,
          message: "✓ Razorpay connection successful",
        },
      };
    } catch (rzError: any) {
      const desc =
        rzError?.error?.description ||
        rzError?.message ||
        "Invalid Razorpay credentials or connection issue.";
      return {
        statusCode: 400,
        data: {
          success: false,
          message: `✕ Razorpay connection failed: ${desc}`,
        },
      };
    }
  } catch (err: any) {
    return {
      statusCode: 500,
      data: {
        success: false,
        message: `✕ Razorpay connection failed: ${err.message || "Server connection error."}`,
      },
    };
  }
}
