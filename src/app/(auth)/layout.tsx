'use client';

import dynamic from 'next/dynamic';

// Dynamic import for Three.js component to avoid SSR issues
const ParticleBackground = dynamic(
  () => import('@/components/landing/ParticleBackground').then((mod) => mod.ParticleBackground),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-violet-950" />
    ),
  }
);

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Background */}
      <ParticleBackground />

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
