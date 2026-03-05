import { NextResponse } from 'next/server';
import { articles } from '@/lib/blog/articles';

// Utilisation des articles réels définis dans articles.ts

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';

  // Page principale du blog
  const blogIndexUrl = `${baseUrl}/blog`;

  // URLs des articles réels
  const articleUrls = articles.map(article =>
    `    <url>
      <loc>${baseUrl}/blog/${article.slug}</loc>
      <lastmod>${article.date}T10:00:00Z</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`
  ).join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${blogIndexUrl}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.85</priority>
  </url>
${articleUrls}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}