import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { handleCreateOrder, handleVerifyPayment, handleTestConnection } from "./server/paymentServer";
import { fetchPostByIdServer, extractMainCoverImage } from "./server/postService";
import { injectPostMetadataIntoHtml, getBaseUrl } from "./server/htmlInjector";

const app = express();
const PORT = 3000;

app.use(express.json());

// --- API ROUTES ---

app.get("/api/health", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// JSON Post Metadata Inspector API
app.get("/api/post-metadata/:id", async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  const postId = req.params.id;
  const post = await fetchPostByIdServer(postId);
  if (!post) {
    return res.status(404).json({ error: "Post not found", id: postId });
  }
  const mainCover = extractMainCoverImage(post);
  const baseUrl = getBaseUrl(req);
  return res.json({
    id: post.id,
    title: post.title,
    description: post.shortDescription || post.metaDescription,
    mainCoverImage: mainCover,
    canonicalUrl: `${baseUrl}/post/${encodeURIComponent(post.id)}`,
    ogTags: {
      "og:type": "article",
      "og:title": post.seoTitle || post.title,
      "og:description": post.metaDescription || post.shortDescription,
      "og:image": mainCover,
      "og:url": `${baseUrl}/post/${encodeURIComponent(post.id)}`,
      "og:site_name": "Sahil Edits",
      "twitter:card": "summary_large_image",
      "twitter:title": post.seoTitle || post.title,
      "twitter:description": post.metaDescription || post.shortDescription,
      "twitter:image": mainCover,
    },
    rawPost: post,
  });
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
  const isProd = process.env.NODE_ENV === "production";
  let vite: any = null;

  if (!isProd) {
    vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
  }

  // Handler for rendering Post HTML with Dynamic Social Meta Tags
  const handlePostRequest = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      let postId = req.params?.id || "";
      if (!postId && req.path.startsWith("/post/")) {
        const parts = req.path.split("/post/")[1]?.split("/");
        if (parts && parts[0]) {
          postId = decodeURIComponent(parts[0]);
        }
      }
      if (!postId && (req.query.prompt || req.query.post || req.query.p)) {
        postId = (req.query.prompt || req.query.post || req.query.p) as string;
      }

      const post = postId ? await fetchPostByIdServer(postId) : null;

      let template = "";
      if (isProd) {
        const distIndexPath = path.join(process.cwd(), "dist", "index.html");
        template = fs.readFileSync(distIndexPath, "utf-8");
      } else {
        const devIndexPath = path.join(process.cwd(), "index.html");
        template = fs.readFileSync(devIndexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
      }

      const finalHtml = injectPostMetadataIntoHtml(template, post, req, postId);
      res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(finalHtml);
    } catch (err) {
      console.error("[Post Route Render Error]", err);
      next(err);
    }
  };

  // Explicit Post Deep-Link Routes (handles crawlers and direct visits)
  app.get("/post/:id", handlePostRequest);
  app.get("/post/:id/*", handlePostRequest);

  // Vite or Static Assets middleware
  if (!isProd) {
    app.use(vite.middlewares);

    // Development Catch-All Route
    app.use("*", async (req, res, next) => {
      // Check if deep query param is passed on home route
      if (req.query.prompt || req.query.post || req.query.p) {
        return handlePostRequest(req, res, next);
      }

      try {
        const devIndexPath = path.join(process.cwd(), "index.html");
        let template = fs.readFileSync(devIndexPath, "utf-8");
        template = await vite.transformIndexHtml(req.originalUrl, template);
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(template);
      } catch (e) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath, { index: false }));

    // Production Catch-All Route
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/post/") || req.query.prompt || req.query.post || req.query.p) {
        return handlePostRequest(req, res, next);
      }
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Sahil Edits Server] Running on http://0.0.0.0:${PORT} (Mode: ${process.env.NODE_ENV || 'development'})`);
  });
}

startServer();

