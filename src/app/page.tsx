'use client';

import dynamic from 'next/dynamic';
import { SmoothScroll, HeroSection, FeaturesSection, TrustSection, FooterSection } from '@/components/landing';

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

export default function HomePage() {
  return (
    <SmoothScroll>
      {/* Three.js Particle Background */}
      <ParticleBackground />

      {/* Main Content */}
      <main className="relative z-10">
        <HeroSection />
        <FeaturesSection />
        <TrustSection />
        <FooterSection />
      </main>
    </SmoothScroll>
  );
}
