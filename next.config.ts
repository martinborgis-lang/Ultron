import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://sdk.twilio.com;
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: https://*.supabase.co;
              connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.twilio.com https://*.twilio.com wss://*.twilio.com;
              font-src 'self' data:;
              object-src 'none';
              base-uri 'self';
              form-action 'self';
              frame-ancestors 'none';
              upgrade-insecure-requests;
            `.replace(/\s{2,}/g, ' ').trim()
          }
        ]
      }
    ];
  }
};

export default nextConfig;
