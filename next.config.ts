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
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://sdk.twilio.com https://js.stripe.com https://maps.googleapis.com https://www.googletagmanager.com https://www.google-analytics.com https://vercel.live",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https://*.supabase.co https://www.google-analytics.com https://maps.gstatic.com *.googleusercontent.com",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.twilio.com https://*.twilio.com wss://*.twilio.com https://api.stripe.com https://www.google-analytics.com https://maps.googleapis.com https://vitals.vercel-insights.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              "upgrade-insecure-requests",
            ].join('; ')
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'unsafe-none'
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
        // Préchargement ressources critiques above-the-fold
        source: '/',
        headers: [
          {
            key: 'Link',
            value: [
              '</images/nexus-logo.svg>; rel=preload; as=image',
              '<https://fonts.gstatic.com>; rel=preconnect; crossorigin',
              '</fonts/inter-var.woff2>; rel=preload; as=font; type=font/woff2; crossorigin',
              '</styles/landing.css>; rel=preload; as=style'
            ].join(', ')
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

  // Webpack optimizations (fallback for non-Turbopack builds)
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      // Configuration splitChunks pour optimiser le bundle principal
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxSize: 244000, // ~244KB limite recommandée
          cacheGroups: {
            framework: {
              chunks: 'all',
              name: 'framework',
              test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
              priority: 40,
              enforce: true
            },
            lib: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendor',
              priority: 30,
              chunks: 'initial'
            },
            motion: {
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              name: 'motion',
              priority: 35,
              chunks: 'all'
            }
          }
        }
      }
    }
    return config;
  }
};

export default nextConfig;
