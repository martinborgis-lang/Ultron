import { NextResponse } from 'next/server';

// Villes CGP existantes (URL format /cgp-ville)
const cgpLocations = [
  { city: 'paris', name: 'Paris', priority: 0.9 },
  { city: 'marseille', name: 'Marseille', priority: 0.8 },
  { city: 'lyon', name: 'Lyon', priority: 0.8 },
  { city: 'toulouse', name: 'Toulouse', priority: 0.8 },
  { city: 'nice', name: 'Nice', priority: 0.7 },
  { city: 'nantes', name: 'Nantes', priority: 0.7 },
  { city: 'strasbourg', name: 'Strasbourg', priority: 0.7 },
  { city: 'bordeaux', name: 'Bordeaux', priority: 0.8 },
  { city: 'lille', name: 'Lille', priority: 0.7 },
  { city: 'rennes', name: 'Rennes', priority: 0.6 }
];


export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
  const now = new Date().toISOString();

  // Génération URLs pour chaque ville
  let locationUrls = '';

  cgpLocations.forEach(location => {
    // Page principale ville (format /cgp-ville)
    locationUrls += `    <url>
      <loc>${baseUrl}/cgp-${location.city}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>${location.priority}</priority>
    </url>
`;
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${locationUrls}</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}