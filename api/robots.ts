export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.send(`User-agent: Googlebot
Allow: /

User-agent: Googlebot-Image
Allow: /

User-agent: Mediapartners-Google
Allow: /

User-agent: Google-Display-Ads-Bot
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/admin
Disallow: /reset-password

Sitemap: https://sahiledit.vercel.app/sitemap.xml
`);
}
