import fs from 'fs';
import path from 'path';
import { fetchPostByIdServer, extractMainCoverImage } from '../server/postService';
import { injectPostMetadataIntoHtml } from '../server/htmlInjector';
import { extractPromptIdFromParam } from '../src/utils/promptUrl';

function isBotRequest(userAgent: string): boolean {
  if (!userAgent) return true;
  const botPattern =
    /facebookexternalhit|facebookcatalog|Facebot|Twitterbot|WhatsApp|TelegramBot|Slackbot|Discordbot|Pinterest|LinkedInBot|Googlebot|bingbot|Baiduspider|yandex|Applebot|vkShare|redditbot|bot|crawler|spider|curl|wget/i;
  return botPattern.test(userAgent);
}

function getEmergencyHtml(postId: string, title?: string, desc?: string, img?: string) {
  const safeTitle = title ? `${title} - Sahil Edits` : 'Sahil Edits – Premium AI Prompt Library';
  const safeDesc = desc || 'Discover and copy trending AI prompts with 1-click on Sahil Edits.';
  const safeImg = img || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80';
  const canonical = postId ? `https://sahiledit.vercel.app/prompt/${encodeURIComponent(postId)}` : 'https://sahiledit.vercel.app/';

  return `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="theme-color" content="#09090b" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:site_name" content="Sahil Edits" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${canonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />
  <meta http-equiv="refresh" content="0; url=/?prompt=${encodeURIComponent(postId)}" />
</head>
<body class="bg-[#0F172A] text-zinc-100 flex items-center justify-center min-h-screen font-sans">
  <div class="text-center p-8">
    <h1 class="text-xl font-bold text-white mb-2">${safeTitle}</h1>
    <p class="text-zinc-400 mb-4">${safeDesc}</p>
    <a href="/?prompt=${encodeURIComponent(postId)}" class="inline-block px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition">
      Open Prompt on Sahil Edits &rarr;
    </a>
  </div>
  <script>
    if (typeof window !== 'undefined') {
      window.location.replace('/?prompt=${encodeURIComponent(postId)}');
    }
  </script>
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

  const postId = extractPromptIdFromParam(rawId);
  const userAgent = req.headers?.['user-agent'] || '';
  const isBot = isBotRequest(userAgent);

  let finalHtml = '';

  try {
    // 1. Candidate paths to read base HTML (Vite build)
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

    // If a normal human user lands here and no rawHtml exists, redirect directly to SPA
    if (!isBot && !rawHtml) {
      res.writeHead(302, {
        Location: `/?prompt=${encodeURIComponent(postId || rawId)}`,
      });
      return res.end();
    }

    // 2. Fetch post data safely
    let post = null;
    if (postId || rawId) {
      try {
        post = await fetchPostByIdServer(postId || rawId);
      } catch (postErr) {
        console.error('[Post fetch error]', postErr);
      }
    }

    if (rawHtml) {
      try {
        finalHtml = injectPostMetadataIntoHtml(rawHtml, post, req, postId || rawId);
      } catch (injectErr) {
        console.error('[Inject error]', injectErr);
        const coverImg = post ? extractMainCoverImage(post) : '';
        finalHtml = getEmergencyHtml(postId || rawId, post?.title, post?.shortDescription, coverImg);
      }
    } else {
      const coverImg = post ? extractMainCoverImage(post) : '';
      finalHtml = getEmergencyHtml(postId || rawId, post?.title, post?.shortDescription, coverImg);
    }
  } catch (error: any) {
    console.error('[Vercel Post OG Handler Catch]', error);
    finalHtml = getEmergencyHtml(postId || rawId);
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
