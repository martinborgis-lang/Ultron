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
    <>
      {/* Same CSS variables and styles as landing page */}
      <style jsx global>{`
        :root {
          --bg-primary: #0A0A0B;
          --bg-secondary: #111112;
          --bg-card: rgba(17, 17, 18, 0.7);
          --border: rgba(255, 255, 255, 0.08);
          --text: #ffffff;
          --text-muted: rgba(255, 255, 255, 0.6);
          --accent: #6366f1;
          --accent-hover: #5855eb;
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          --glow: 0 0 60px -15px rgba(99, 102, 241, 0.4);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6; color: var(--text);
          background: var(--bg-primary); overflow-x: hidden;
        }

        .auth-container {
          min-height: 100vh;
          background: radial-gradient(ellipse at top, rgba(99, 102, 241, 0.15) 0%, transparent 70%),
                      linear-gradient(135deg, #0A0A0B 0%, #1a1a2e 50%, #16213e 100%);
          position: relative;
          overflow: hidden;
        }

        .auth-container::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background:
            radial-gradient(circle at 20% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(59, 130, 246, 0.05) 0%, transparent 50%);
          pointer-events: none;
        }

        .auth-content {
          position: relative;
          z-index: 10;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 1rem;
        }

        @media (max-width: 768px) {
          .auth-content {
            padding: 1rem;
          }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <div className="auth-container">
        {/* Particle Background */}
        <ParticleBackground />

        {/* Content */}
        <div className="auth-content">
          <div className="w-full max-w-md">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
