import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/features/', '/blog/', '/legal', '/privacy'],
        disallow: [
          '/dashboard',
          '/admin',
          '/api/',
          '/auth/',
          '/settings',
          '/prospects',
          '/pipeline',
          '/planning',
          '/meetings',
          '/assistant',
          '/voice/',
          '/leads-finder',
          '/linkedin-agent',
          '/tasks',
          '/import',
          '/agenda',
          '/complete-registration',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
