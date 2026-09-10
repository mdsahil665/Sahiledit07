import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { handleCreateOrder, handleVerifyPayment, handleTestConnection } from "./server/paymentServer";
import { fetchPostByIdServer, extractMainCoverImage, fetchAllPostsServer } from "./server/postService";
import { injectPostMetadataIntoHtml, getBaseUrl } from "./server/htmlInjector";
import { getPromptSlug } from "./src/utils/promptUrl";

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
      if (!postId) {
        if (req.path.startsWith("/prompt/")) {
          const parts = req.path.split("/prompt/")[1]?.split("/");
          if (parts && parts[0]) {
            postId = decodeURIComponent(parts[0]);
          }
        } else if (req.path.startsWith("/post/")) {
          const parts = req.path.split("/post/")[1]?.split("/");
          if (parts && parts[0]) {
            postId = decodeURIComponent(parts[0]);
          }
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

  // Google AdSense ads.txt Endpoint
  app.get("/ads.txt", (_req, res) => {
    res.status(200).set({
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
    }).send("google.com, pub-6065974907777223, DIRECT, f08c47fec0942fa0\n");
  });

  // Dynamic XML Sitemap Endpoint
  app.get("/sitemap.xml", async (_req, res) => {
    try {
      const posts = await fetchAllPostsServer();
      const baseUrl = "https://sahiledit.vercel.app";

      const staticCategories = [
        { slug: "chatgpt", priority: "0.8", changefreq: "daily" },
        { slug: "gemini", priority: "0.8", changefreq: "daily" },
        { slug: "image-prompt", priority: "0.9", changefreq: "daily" },
        { slug: "video-prompt", priority: "0.9", changefreq: "daily" },
      ];

      const staticPages = [
        "privacy-policy",
        "terms-and-conditions",
        "about-us",
        "contact-us",
        "disclaimer",
        "dmca",
        "refund-policy",
        "cookie-policy",
      ];

      const escapeXml = (str: string) =>
        str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

      const formatDate = (dateStr?: string) => {
        if (!dateStr) return "2026-09-10";
        try {
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? "2026-09-10" : d.toISOString().split("T")[0];
        } catch {
          return "2026-09-10";
        }
      };

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n  <!-- Homepage -->\n  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${formatDate(posts[0]?.updatedAt || posts[0]?.createdAt)}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n\n  <!-- Categories -->\n`;

      for (const cat of staticCategories) {
        xml += `  <url>\n    <loc>${baseUrl}/?category=${encodeURIComponent(cat.slug)}</loc>\n    <lastmod>2026-09-10</lastmod>\n    <changefreq>${cat.changefreq}</changefreq>\n    <priority>${cat.priority}</priority>\n  </url>\n`;
      }

      xml += `\n  <!-- Live Public Posts -->\n`;

      for (const post of posts) {
        const slug = getPromptSlug(post as any) || post.slug || post.id;
        const canonicalUrl = `${baseUrl}/prompt/${encodeURIComponent(slug)}`;
        const lastMod = formatDate(post.updatedAt || post.createdAt);
        const coverImage = extractMainCoverImage(post);

        xml += `  <url>\n    <loc>${canonicalUrl}</loc>\n    <lastmod>${lastMod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n`;
        if (coverImage) {
          xml += `    <image:image>\n      <image:loc>${escapeXml(coverImage)}</image:loc>\n      <image:title>${escapeXml(post.title || "")}</image:title>\n    </image:image>\n`;
        }
        xml += `  </url>\n`;
      }

      xml += `\n  <!-- Policy & Legal Pages -->\n`;

      for (const page of staticPages) {
        xml += `  <url>\n    <loc>${baseUrl}/?page=${encodeURIComponent(page)}</loc>\n    <lastmod>2026-09-10</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.5</priority>\n  </url>\n`;
      }

      xml += `</urlset>\n`;

      res.status(200).set({
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400",
      }).send(xml);
    } catch (err) {
      console.error("[Sitemap Generation Error]", err);
      res.status(500).send("Error generating sitemap");
    }
  });

  // Explicit Prompt and Post Deep-Link Routes (handles crawlers and direct visits)
  app.get("/prompt/:id", handlePostRequest);
  app.get("/prompt/:id/*", handlePostRequest);
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
      if (req.path.startsWith("/post/") || req.path.startsWith("/prompt/") || req.query.prompt || req.query.post || req.query.p) {
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

