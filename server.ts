import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { handleCreateOrder, handleVerifyPayment, handleTestConnection } from "./server/paymentServer";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Create Razorpay Order
app.post("/api/payment/create-order", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const result = await handleCreateOrder(req.body);
  return res.status(result.statusCode).json(result.data);
});

// Verify Payment and Activate Premium
app.post("/api/payment/verify-payment", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const result = await handleVerifyPayment(req.body);
  return res.status(result.statusCode).json(result.data);
});

// Test Razorpay Connection
app.post("/api/payment/test-connection", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const result = await handleTestConnection(req.body);
  return res.status(result.statusCode).json(result.data);
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
