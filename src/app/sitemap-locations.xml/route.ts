import { NextResponse } from 'next/server';

// Principales villes françaises pour CGP (optimisation géo-SEO)
const cgpLocations = [
  // Grandes métropoles
  { city: 'paris', name: 'Paris', priority: 0.9 },
  { city: 'marseille', name: 'Marseille', priority: 0.8 },
  { city: 'lyon', name: 'Lyon', priority: 0.8 },
  { city: 'toulouse', name: 'Toulouse', priority: 0.8 },
  { city: 'nice', name: 'Nice', priority: 0.7 },
  { city: 'nantes', name: 'Nantes', priority: 0.7 },
  { city: 'montpellier', name: 'Montpellier', priority: 0.7 },
  { city: 'strasbourg', name: 'Strasbourg', priority: 0.7 },
  { city: 'bordeaux', name: 'Bordeaux', priority: 0.8 },
  { city: 'lille', name: 'Lille', priority: 0.7 },

  // Centres économiques importants
  { city: 'rennes', name: 'Rennes', priority: 0.6 },
  { city: 'reims', name: 'Reims', priority: 0.6 },
  { city: 'saint-etienne', name: 'Saint-Étienne', priority: 0.6 },
  { city: 'toulon', name: 'Toulon', priority: 0.6 },
  { city: 'grenoble', name: 'Grenoble', priority: 0.6 },
  { city: 'dijon', name: 'Dijon', priority: 0.6 },
  { city: 'angers', name: 'Angers', priority: 0.6 },
  { city: 'villeurbanne', name: 'Villeurbanne', priority: 0.6 },
  { city: 'le-mans', name: 'Le Mans', priority: 0.5 },
  { city: 'aix-en-provence', name: 'Aix-en-Provence', priority: 0.6 },

  // Villes avec fort potentiel patrimoine
  { city: 'cannes', name: 'Cannes', priority: 0.7 },
  { city: 'versailles', name: 'Versailles', priority: 0.7 },
  { city: 'neuilly-sur-seine', name: 'Neuilly-sur-Seine', priority: 0.8 },
  { city: 'boulogne-billancourt', name: 'Boulogne-Billancourt', priority: 0.7 },
  { city: 'courbevoie', name: 'Courbevoie', priority: 0.7 },
  { city: 'levallois-perret', name: 'Levallois-Perret', priority: 0.7 }
];

// Services CGP principaux
const cgpServices = [
  'crm-cgp',
  'gestion-patrimoine',
  'conseil-financier',
  'placement-financier',
  'assurance-vie',
  'defiscalisation',
  'investissement-immobilier'
];

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
  const now = new Date().toISOString();

  // Génération URLs pour chaque ville
  let locationUrls = '';

  cgpLocations.forEach(location => {
    // Page principale ville
    locationUrls += `    <url>
      <loc>${baseUrl}/cgp/${location.city}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>${location.priority}</priority>
    </url>
`;

    // Pages services par ville (pour les principales métropoles)
    if (location.priority >= 0.7) {
      cgpServices.forEach(service => {
        locationUrls += `    <url>
      <loc>${baseUrl}/cgp/${location.city}/${service}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>${(location.priority - 0.1).toFixed(1)}</priority>
    </url>
`;
      });
    }
  });

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Page principale localisation CGP -->
  <url>
    <loc>${baseUrl}/cgp</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
${locationUrls}</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    }
  });
}