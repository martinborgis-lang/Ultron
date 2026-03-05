import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  // Optimisations images WebP/AVIF
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31536000, // Cache 1 an
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Optimisation compilation Next.js 16
  poweredByHeader: false,
  compress: true,

  // Turbopack configuration pour Next.js 16
  turbopack: {},

  // Optimisation imports
  experimental: {
    optimizePackageImports: [
      '@lucide-react',
      'recharts',
      'framer-motion',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu'
    ],
    webpackBuildWorker: true,
  },

  async headers() {
    return [
      {
        // Headers sécurité globaux
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://sdk.twilio.com https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com;
              style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
              img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://maps.gstatic.com *.googleusercontent.com;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.twilio.com https://*.twilio.com wss://*.twilio.com https://api.stripe.com https://www.google-analytics.com https://maps.googleapis.com;
              font-src 'self' data: https://fonts.gstatic.com;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              frame-src 'self' https://js.stripe.com https://hooks.stripe.com;
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      },
      {
        // Cache statique assets
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Cache SVG icons
        source: '/(.*)\\.svg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      },
      {
        // Préchargement ressources critiques
        source: '/',
        headers: [
          {
            key: 'Link',
            value: '</images/nexus-logo.svg>; rel=preload; as=image, <https://fonts.gstatic.com>; rel=preconnect; crossorigin'
          }
        ]
      }
    ];
  },

  // Redirections canoniques
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/dashboard/prospects',
        destination: '/prospects',
        permanent: false,
      }
    ];
  },

  // Note: webpack config removed for Next.js 16 Turbopack compatibility
  // Bundle optimization is now handled automatically by Turbopack
};

export default nextConfig;
