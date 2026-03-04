import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
  const now = new Date();

  // Pages principales
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

  // Articles blog
  const blogSlugs = [
    'automatiser-prospection-cgp',
    'qualification-prospects-ia',
    'augmenter-conversion-cgp',
    'transcription-rdv-ia',
    'linkedin-strategie-cgp',
    'crm-vs-google-sheets',
  ];

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Blog index
  const blogIndex: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
  ];

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

  return [...mainPages, ...featurePages, ...blogIndex, ...blogPages, ...legalPages];
}
