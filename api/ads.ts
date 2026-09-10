export default function handler(_req: any, res: any) {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
  return res.send('google.com, pub-6065974907777223, DIRECT, f08c47fec0942fa0\n');
}
