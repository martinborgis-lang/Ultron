'use client';

import { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Particle animation - Same as landing page
    const canvas = document.getElementById('auth-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Array<{x: number; y: number; vx: number; vy: number; size: number}> = [];
    let animationId: number;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 80; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Particules avec gradient radial pour plus de visibilité
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        // Centre plus brillant
        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < 150) {
            const opacity = 0.3 * (1 - dist / 150);
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    // Initialize canvas
    window.addEventListener('resize', resize);
    resize();
    initParticles();
    animate();

    // Cleanup function
    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-deep: #0a0f1c;
          --bg-card: rgba(15, 23, 42, 0.8);
          --bg-card-solid: #0f172a;
          --primary: #3b82f6;
          --primary-dark: #2563eb;
          --secondary: #1e40af;
          --accent: #06b6d4;
          --text-white: #f1f5f9;
          --text-gray: #94a3b8;
          --text-muted: #64748b;
          --border: rgba(255, 255, 255, 0.08);
          --border-light: rgba(255, 255, 255, 0.12);
          --glow: 0 0 60px rgba(59, 130, 246, 0.15);
          --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        html { scroll-behavior: smooth; }

        body {
          font-family: 'Manrope', -apple-system, BlinkMacSystemFont, sans-serif;
          background: linear-gradient(135deg, var(--bg-deep) 0%, #0d1421 25%, #111827 50%, #0f172a 75%, var(--bg-deep) 100%);
          color: var(--text-white);
          overflow-x: hidden;
          line-height: 1.6;
        }

        .btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 11px 24px; font-weight: 500; font-size: 0.9rem;
          border-radius: 8px; transition: var(--transition);
          text-decoration: none; border: 1px solid transparent; cursor: pointer;
        }

        .btn-primary {
          background: var(--primary); color: white;
          box-shadow: 0 4px 14px rgba(59, 130, 246, 0.35);
        }

        .btn-primary:hover {
          background: var(--primary-dark); transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
        }
      `}</style>

      <div className="min-h-screen flex items-center justify-center overflow-hidden relative">
        {/* Canvas pour les particules - même que landing page */}
        <canvas
          id="auth-canvas"
          className="absolute top-0 left-0 w-full h-full z-0"
          style={{ opacity: 0.8 }}
        />

        {/* Overlay gradients - même que landing page */}
        <div
          className="absolute top-0 left-0 right-0 bottom-0 pointer-events-none z-1"
          style={{
            background: `
              radial-gradient(circle at 30% 40%, rgba(59, 130, 246, 0.05) 0%, transparent 50%),
              radial-gradient(circle at 70% 80%, rgba(6, 182, 212, 0.03) 0%, transparent 50%)
            `
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full max-w-md px-6">
          {children}
        </div>
      </div>
    </>
  );
}
