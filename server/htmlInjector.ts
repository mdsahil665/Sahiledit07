import { DecodedPost, extractMainCoverImage } from './postService';

export function escapeHtml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function cleanDescription(str: string, maxLength = 240): string {
  if (!str) return '';
  // Remove markdown code blocks, multiple newlines, quotes
  const cleaned = str
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + '...';
}

export function getBaseUrl(req: any): string {
  const forwardedProto = req?.headers?.['x-forwarded-proto'] || 'https';
  const host = req?.headers?.['x-forwarded-host'] || req?.headers?.host;
  if (host && !host.includes('localhost') && !host.includes('127.0.0.1')) {
    return `${forwardedProto}://${host}`.replace(/\/$/, '');
  }
  if (process.env.PUBLIC_SITE_URL) {
    return process.env.PUBLIC_SITE_URL.replace(/\/$/, '');
  }
  return 'https://sahiledit.vercel.app';
}

export function injectPostMetadataIntoHtml(
  rawHtml: string,
  post: DecodedPost | null,
  req: any,
  requestedPostId?: string
): string {
  if (!post) {
    // If a specific post ID was requested but not found, still provide a clean canonical URL
    if (requestedPostId) {
      const baseUrl = getBaseUrl(req);
      const canonicalUrl = `${baseUrl}/post/${encodeURIComponent(requestedPostId)}`;
      return rawHtml.replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${canonicalUrl}"`);
    }
    return rawHtml;
  }

  const baseUrl = getBaseUrl(req);
  const canonicalUrl = `${baseUrl}/post/${encodeURIComponent(post.id)}`;

  const postTitle = post.seoTitle || post.title || 'AI Prompt';
  const pageTitle = postTitle.toLowerCase().includes('sahil edits') ? postTitle : `${postTitle} – Sahil Edits`;
  const postDescription = cleanDescription(
    post.metaDescription || post.shortDescription || post.fullPrompt || 'Copy this high-precision AI prompt with 1-click on Sahil Edits.'
  );

  const mainCoverImage = extractMainCoverImage(post);

  // 1. Replace Title
  let html = rawHtml.replace(
    /<title>.*?<\/title>/is,
    `<title>${escapeHtml(pageTitle)}</title>`
  );

  // 2. Replace Description
  html = html.replace(
    /<meta name="description" content=".*?"\s*\/?>/is,
    `<meta name="description" content="${escapeHtml(postDescription)}" />`
  );

  // 3. Replace Canonical Link
  html = html.replace(
    /<link rel="canonical" href=".*?"[^>]*>/is,
    `<link rel="canonical" href="${canonicalUrl}" id="seo-canonical-link" />`
  );

  // 4. Replace Open Graph Tags
  html = html.replace(
    /<meta property="og:type" content=".*?"[^>]*>/is,
    `<meta property="og:type" content="article" id="seo-og-type" />`
  );

  html = html.replace(
    /<meta property="og:url" content=".*?"[^>]*>/is,
    `<meta property="og:url" content="${canonicalUrl}" id="seo-og-url" />`
  );

  html = html.replace(
    /<meta property="og:title" content=".*?"[^>]*>/is,
    `<meta property="og:title" content="${escapeHtml(postTitle)}" id="seo-og-title" />`
  );

  html = html.replace(
    /<meta property="og:description" content=".*?"[^>]*>/is,
    `<meta property="og:description" content="${escapeHtml(postDescription)}" id="seo-og-description" />`
  );

  html = html.replace(
    /<meta property="og:image" content=".*?"[^>]*>/is,
    `<meta property="og:image" content="${mainCoverImage}" id="seo-og-image" />\n    <meta property="og:image:secure_url" content="${mainCoverImage}" />\n    <meta property="og:image:alt" content="${escapeHtml(postTitle)}" />\n    <meta property="og:image:type" content="image/jpeg" />`
  );

  // 5. Replace Twitter Card Tags
  html = html.replace(
    /<meta name="twitter:url" content=".*?"[^>]*>/is,
    `<meta name="twitter:url" content="${canonicalUrl}" id="seo-twitter-url" />`
  );

  html = html.replace(
    /<meta name="twitter:title" content=".*?"[^>]*>/is,
    `<meta name="twitter:title" content="${escapeHtml(postTitle)}" id="seo-twitter-title" />`
  );

  html = html.replace(
    /<meta name="twitter:description" content=".*?"[^>]*>/is,
    `<meta name="twitter:description" content="${escapeHtml(postDescription)}" id="seo-twitter-description" />`
  );

  html = html.replace(
    /<meta name="twitter:image" content=".*?"[^>]*>/is,
    `<meta name="twitter:image" content="${mainCoverImage}" id="seo-twitter-image" />`
  );

  // 6. Inject Article JSON-LD Structured Data
  const jsonLdPost = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: post.title,
    headline: post.title,
    description: postDescription,
    image: [mainCoverImage],
    datePublished: post.createdAt || new Date().toISOString(),
    dateModified: post.updatedAt || post.createdAt || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: post.author || 'Sahil',
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sahil Edits',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
      },
    },
    keywords: post.tags ? post.tags.join(', ') : 'AI prompts, ChatGPT, Midjourney, Flux',
    articleSection: post.categoryName || 'AI Prompts',
  };

  const jsonLdScript = `\n    <script type="application/ld+json" id="seo-jsonld-article">\n    ${JSON.stringify(jsonLdPost, null, 2)}\n    </script>`;

  // Inject before </head>
  html = html.replace('</head>', `${jsonLdScript}\n  </head>`);

  return html;
}
