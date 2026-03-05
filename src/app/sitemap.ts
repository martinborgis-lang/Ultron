import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
  const now = new Date();

  // Pages principales uniquement dans sitemap.xml
  const mainPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  // Pages features
  const featureSlugs = [
    'crm',
    'ai-assistant',
    'voice',
    'lead-finder',
    'linkedin-agent',
    'meetings',
    'extension',
  ];

  const featurePages: MetadataRoute.Sitemap = featureSlugs.map((slug) => ({
    url: `${baseUrl}/features/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.9,
  }));

  // Pages légales
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/legal`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  return [...mainPages, ...featurePages, ...legalPages];
}
