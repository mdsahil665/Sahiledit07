import fs from 'fs';
import path from 'path';
import { fetchPostByIdServer, extractMainCoverImage } from '../server/postService';
import { injectPostMetadataIntoHtml } from '../server/htmlInjector';
import { extractPromptIdFromParam } from '../src/utils/promptUrl';

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
</head>
<body class="bg-[#0F172A] text-zinc-100">
  <div id="root"></div>
  <script>
    // If opened directly by user, ensure route opens prompt
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/prompt/') && !window.location.pathname.startsWith('/post/')) {
      window.location.replace('/prompt/${encodeURIComponent(postId)}');
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
  let finalHtml = '';

  try {
    // 1. Candidate paths to read base HTML
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

    // 2. Fetch post data safely (using clean postId or rawId)
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
