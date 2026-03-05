import { NextResponse } from 'next/server';

// Articles de blog statiques (à terme remplacer par base de données)
const blogArticles = [
  {
    slug: 'automatiser-prospection-cgp',
    title: 'Automatiser la prospection CGP avec l\'IA',
    lastModified: '2024-03-01T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'qualification-prospects-ia',
    title: 'Qualification prospects avec IA avancée',
    lastModified: '2024-03-02T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'augmenter-conversion-cgp',
    title: 'Augmenter les conversions CGP',
    lastModified: '2024-03-03T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'transcription-rdv-ia',
    title: 'Transcription automatique RDV avec IA',
    lastModified: '2024-03-04T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'linkedin-strategie-cgp',
    title: 'Stratégie LinkedIn pour CGP',
    lastModified: '2024-03-05T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'crm-vs-google-sheets',
    title: 'CRM vs Google Sheets : Le guide complet',
    lastModified: '2024-03-06T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.8
  },
  {
    slug: 'extension-chrome-cgp',
    title: 'Extension Chrome pour CGP',
    lastModified: '2024-03-07T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.7
  },
  {
    slug: 'agent-vocal-ia-cgp',
    title: 'Agent vocal IA pour qualification',
    lastModified: '2024-03-08T10:00:00Z',
    changeFrequency: 'monthly',
    priority: 0.7
  }
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';

  // Page principale du blog
  const blogIndexUrl = `${baseUrl}/blog`;

  // URLs des articles
  const articleUrls = blogArticles.map(article =>
    `    <url>
      <loc>${baseUrl}/blog/${article.slug}</loc>
      <lastmod>${article.lastModified}</lastmod>
      <changefreq>${article.changeFrequency}</changefreq>
      <priority>${article.priority}</priority>
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