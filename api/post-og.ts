import fs from 'fs';
import path from 'path';
import { fetchPostByIdServer } from '../server/postService';
import { injectPostMetadataIntoHtml } from '../server/htmlInjector';

export default async function handler(req: any, res: any) {
  const postId = (req.query?.id as string) || (req.query?.prompt as string) || (req.query?.post as string) || '';

  try {
    // Try to find index.html
    let htmlPath = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(htmlPath)) {
      htmlPath = path.join(process.cwd(), 'index.html');
    }

    let rawHtml = '';
    if (fs.existsSync(htmlPath)) {
      rawHtml = fs.readFileSync(htmlPath, 'utf-8');
    } else {
      rawHtml = `<!doctype html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sahil Edits – Premium AI Prompt Library</title>
  <meta name="description" content="Premium AI Prompt Library" />
  <link rel="canonical" href="https://sahiledit.vercel.app/" id="seo-canonical-link" />
  <meta property="og:type" content="article" id="seo-og-type" />
  <meta property="og:url" content="https://sahiledit.vercel.app/" id="seo-og-url" />
  <meta property="og:title" content="Sahil Edits – Premium AI Prompt Library" id="seo-og-title" />
  <meta property="og:description" content="Premium AI Prompt Library" id="seo-og-description" />
  <meta property="og:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" id="seo-og-image" />
  <meta property="og:site_name" content="Sahil Edits" />
  <meta name="twitter:card" content="summary_large_image" id="seo-twitter-card" />
  <meta name="twitter:url" content="https://sahiledit.vercel.app/" id="seo-twitter-url" />
  <meta name="twitter:title" content="Sahil Edits" id="seo-twitter-title" />
  <meta name="twitter:description" content="Premium AI Prompt Library" id="seo-twitter-description" />
  <meta name="twitter:image" content="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80" id="seo-twitter-image" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;
    }

    const post = postId ? await fetchPostByIdServer(postId) : null;
    const finalHtml = injectPostMetadataIntoHtml(rawHtml, post, req, postId);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).send(finalHtml);
  } catch (error: any) {
    console.error('[Vercel Post OG Error]', error);
    return res.status(500).send('Internal Server Error');
  }
}
