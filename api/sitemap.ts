import { fetchAllPostsServer, extractMainCoverImage } from '../server/postService';
import { getPromptSlug } from '../src/utils/promptUrl';

function escapeXml(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '2026-09-10';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '2026-09-10';
    return d.toISOString().split('T')[0];
  } catch {
    return '2026-09-10';
  }
}

export default async function handler(req: any, res: any) {
  try {
    const baseUrl = 'https://sahiledit.vercel.app';
    const posts = await fetchAllPostsServer();

    const staticCategories = [
      { slug: 'chatgpt', priority: '0.8', changefreq: 'daily' },
      { slug: 'gemini', priority: '0.8', changefreq: 'daily' },
      { slug: 'image-prompt', priority: '0.9', changefreq: 'daily' },
      { slug: 'video-prompt', priority: '0.9', changefreq: 'daily' },
    ];

    const staticPages = [
      'privacy-policy',
      'terms-and-conditions',
      'about-us',
      'contact-us',
      'disclaimer',
      'dmca',
      'refund-policy',
      'cookie-policy',
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${formatDate(posts[0]?.updatedAt || posts[0]?.createdAt)}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>

  <!-- Categories -->`;

    for (const cat of staticCategories) {
      xml += `
  <url>
    <loc>${baseUrl}/?category=${encodeURIComponent(cat.slug)}</loc>
    <lastmod>2026-09-10</lastmod>
    <changefreq>${cat.changefreq}</changefreq>
    <priority>${cat.priority}</priority>
  </url>`;
    }

    xml += `\n\n  <!-- Live Public Posts -->`;

    for (const post of posts) {
      const slug = getPromptSlug(post as any) || post.slug || post.id;
      const canonicalUrl = `${baseUrl}/prompt/${encodeURIComponent(slug)}`;
      const lastMod = formatDate(post.updatedAt || post.createdAt);
      const coverImage = extractMainCoverImage(post);

      xml += `
  <url>
    <loc>${canonicalUrl}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>`;

      if (coverImage) {
        xml += `
    <image:image>
      <image:loc>${escapeXml(coverImage)}</image:loc>
      <image:title>${escapeXml(post.title || '')}</image:title>
    </image:image>`;
      }

      xml += `
  </url>`;
    }

    xml += `\n\n  <!-- Policy & Legal Pages -->`;

    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${baseUrl}/?page=${encodeURIComponent(page)}</loc>
    <lastmod>2026-09-10</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }

    xml += `\n</urlset>\n`;

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=14400, stale-while-revalidate=86400');
    return res.send(xml);
  } catch (err: any) {
    console.error('[Sitemap Generation Error]', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain');
    return res.send('Error generating sitemap');
  }
}
