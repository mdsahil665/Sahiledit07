import fs from 'fs';
import path from 'path';
import { fetchPostByIdServer, extractMainCoverImage } from '../server/postService';
import { injectPostMetadataIntoHtml, escapeHtml, cleanDescription } from '../server/htmlInjector';
import { extractPromptIdFromParam, getPromptSlug } from '../src/utils/promptUrl';

function getFallbackHtml(post: any, rawSlugOrId: string) {
  const postTitle = (post?.seoTitle || post?.title || 'AI Prompt').trim();
  const safeTitle = postTitle ? `${escapeHtml(postTitle)} - Sahil Edits` : 'Sahil Edits – Premium AI Prompt Library';
  const postDesc = post?.shortDescription || post?.metaDescription || post?.fullPrompt || 'Discover and copy trending AI prompts with 1-click on Sahil Edits.';
  const safeDesc = escapeHtml(cleanDescription(postDesc, 200));
  const safeImg = post ? extractMainCoverImage(post) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  const slug = post ? getPromptSlug(post) : rawSlugOrId;
  const canonical = `https://sahiledit.vercel.app/prompt/${encodeURIComponent(slug)}`;

  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#09090b" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${canonical}" id="seo-canonical-link" />
  
  <!-- Open Graph / WhatsApp / Facebook -->
  <meta property="og:type" content="article" id="seo-og-type" />
  <meta property="og:url" content="${canonical}" id="seo-og-url" />
  <meta property="og:title" content="${safeTitle}" id="seo-og-title" />
  <meta property="og:description" content="${safeDesc}" id="seo-og-description" />
  <meta property="og:image" content="${safeImg}" id="seo-og-image" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:alt" content="${safeTitle}" />
  <meta property="og:image:type" content="image/png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Sahil Edits" />
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" id="seo-twitter-card" />
  <meta name="twitter:url" content="${canonical}" id="seo-twitter-url" />
  <meta name="twitter:title" content="${safeTitle}" id="seo-twitter-title" />
  <meta name="twitter:description" content="${safeDesc}" id="seo-twitter-description" />
  <meta name="twitter:image" content="${safeImg}" id="seo-twitter-image" />

  <style>
    html, body, #root {
      width: 100%;
      min-height: 100%;
      margin: 0;
      padding: 0;
      background-color: #0F172A;
      color: #f4f4f5;
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
  </style>
</head>
<body class="bg-[#0F172A] text-zinc-100">
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
}

export default async function handler(req: any, res: any) {
  let rawId =
    (req.query?.id as string) ||
    (req.query?.postId as string) ||
    (req.query?.prompt as string) ||
    (req.query?.post as string) ||
    (req.query?.p as string) ||
    '';

  if (!rawId && req.url) {
    const match = req.url.match(/\/(?:post|prompt)\/([^?#/]+)/i);
    if (match && match[1]) {
      rawId = decodeURIComponent(match[1]);
    }
  }

  const postIdOrSlug = extractPromptIdFromParam(rawId) || rawId;
  let finalHtml = '';

  try {
    // 1. Fetch post data directly from Firestore (supports ID and title slug)
    let post = null;
    if (postIdOrSlug) {
      try {
        post = await fetchPostByIdServer(postIdOrSlug);
      } catch (postErr) {
        console.error('[Post fetch error]', postErr);
      }
    }

    // 2. Candidate paths to read base HTML (Vite build)
    const candidatePaths = [
      path.join(process.cwd(), 'dist', 'index.html'),
      path.resolve(__dirname, '../dist/index.html'),
      path.resolve(__dirname, '../../dist/index.html'),
      path.join(process.cwd(), 'index.html'),
      path.resolve(__dirname, '../index.html'),
      path.resolve(__dirname, '../../index.html'),
    ];

    let rawHtml = '';
    for (const candidate of candidatePaths) {
      try {
        if (fs.existsSync(candidate)) {
          const content = fs.readFileSync(candidate, 'utf-8');
          if (content && content.length > 50) {
            rawHtml = content;
            break;
          }
        }
      } catch (e) {
        // continue checking
      }
    }

    if (rawHtml) {
      try {
        finalHtml = injectPostMetadataIntoHtml(rawHtml, post, req, postIdOrSlug);
      } catch (injectErr) {
        console.error('[Inject error]', injectErr);
        finalHtml = getFallbackHtml(post, postIdOrSlug);
      }
    } else {
      finalHtml = getFallbackHtml(post, postIdOrSlug);
    }
  } catch (error: any) {
    console.error('[Vercel Post OG Handler Catch]', error);
    finalHtml = getFallbackHtml(null, postIdOrSlug);
  }

  // Always return 200 OK with valid HTML
  try {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400');
    if (typeof res.send === 'function') {
      return res.send(finalHtml);
    }
    return res.end(finalHtml);
  } catch (sendErr) {
    console.error('[Final Send Error]', sendErr);
    try {
      res.end(finalHtml);
    } catch (e) {}
  }
}

