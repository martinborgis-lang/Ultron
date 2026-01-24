'use client';

import Link from 'next/link';
import { useEffect } from 'react';

export default function LandingPage() {
  useEffect(() => {
    // Particle animation
    const canvas = document.getElementById('hero-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Array<{x: number; y: number; vx: number; vy: number; size: number}> = [];

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < 50; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          size: Math.random() * 1.5 + 0.5
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

        ctx.fillStyle = 'rgba(59, 130, 246, 0.6)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);

          if (dist < 120) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.15 * (1 - dist / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      requestAnimationFrame(animate);
    };

    // 3D Tilt effect
    const card = document.getElementById('tilt-card');
    const heroSection = document.getElementById('hero');

    if (window.innerWidth > 1024 && card && heroSection) {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = heroSection.getBoundingClientRect();
        const xAxis = (rect.width / 2 - (e.clientX - rect.left)) / 40;
        const yAxis = (rect.height / 2 - (e.clientY - rect.top)) / 40;
        card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
      };

      const handleMouseLeave = () => {
        card.style.transition = 'transform 0.5s ease';
        card.style.transform = 'rotateY(0deg) rotateX(0deg)';
      };

      const handleMouseEnter = () => {
        card.style.transition = 'none';
      };

      heroSection.addEventListener('mousemove', handleMouseMove);
      heroSection.addEventListener('mouseleave', handleMouseLeave);
      heroSection.addEventListener('mouseenter', handleMouseEnter);

      const cleanup = () => {
        heroSection.removeEventListener('mousemove', handleMouseMove);
        heroSection.removeEventListener('mouseleave', handleMouseLeave);
        heroSection.removeEventListener('mouseenter', handleMouseEnter);
        window.removeEventListener('resize', resize);
      };

      window.addEventListener('resize', resize);
      resize();
      initParticles();
      animate();

      return cleanup;
    }

    // Scroll reveal
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    window.addEventListener('resize', resize);
    resize();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <style jsx global>{`
        :root {
          --bg-deep: #050a14;
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
          background-color: var(--bg-deep);
          color: var(--text-white);
          overflow-x: hidden;
          line-height: 1.6;
        }
        .landing-container { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
        .text-gradient {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
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
        .btn-glass {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--border); color: var(--text-gray);
        }
        .btn-glass:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--border-light); color: var(--text-white);
        }
        .landing-header {
          position: fixed; top: 0; width: 100%; z-index: 1000;
          padding: 16px 0; background: rgba(5, 10, 20, 0.85);
          backdrop-filter: blur(20px); border-bottom: 1px solid var(--border);
        }
        .nav-inner { display: flex; justify-content: space-between; align-items: center; }
        .logo {
          font-weight: 700; font-size: 1.25rem; display: flex;
          align-items: center; gap: 10px; color: var(--text-white); text-decoration: none;
        }
        .logo-icon {
          width: 32px; height: 32px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
        }
        .nav-menu { display: flex; gap: 32px; }
        .nav-link {
          color: var(--text-muted); font-size: 0.875rem;
          text-decoration: none; transition: var(--transition); font-weight: 500;
        }
        .nav-link:hover { color: var(--text-white); }
        .nav-cta { display: flex; align-items: center; gap: 12px; }
        #hero {
          position: relative; min-height: 100vh; display: flex;
          align-items: center; padding: 120px 0 80px; overflow: hidden;
        }
        #hero-canvas {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; opacity: 0.5;
        }
        .hero-grid {
          display: grid; grid-template-columns: 1fr 1.3fr; gap: 50px;
          align-items: center; position: relative; z-index: 2;
        }
        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.2);
          padding: 6px 14px; border-radius: 20px; font-size: 0.8rem;
          color: var(--primary); font-weight: 500; margin-bottom: 24px;
        }
        .hero-content h1 {
          font-size: 2.75rem; line-height: 1.15; margin-bottom: 20px;
          font-weight: 700; letter-spacing: -0.03em;
        }
        .hero-content p {
          font-size: 1rem; color: var(--text-gray); margin-bottom: 32px;
          max-width: 460px; line-height: 1.7;
        }
        .hero-buttons { display: flex; gap: 12px; }
        .hero-visual { position: relative; perspective: 1500px; }
        .browser-mockup {
          background: var(--bg-card-solid); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          box-shadow: 0 40px 80px -20px rgba(0, 0, 0, 0.6), var(--glow);
          transform-style: preserve-3d; transition: transform 0.1s ease-out;
        }
        .browser-header {
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          padding: 12px 16px; display: flex; align-items: center; gap: 8px;
          border-bottom: 1px solid var(--border);
        }
        .browser-dots { display: flex; gap: 6px; }
        .browser-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot-red { background: #ef4444; }
        .dot-yellow { background: #f59e0b; }
        .dot-green { background: #22c55e; }
        .browser-url {
          flex: 1; margin-left: 12px; background: rgba(0, 0, 0, 0.3);
          border-radius: 6px; padding: 6px 12px; font-size: 0.75rem;
          color: var(--text-muted); display: flex; align-items: center; gap: 6px;
        }
        .browser-content { overflow: hidden; }
        .browser-content img {
          width: 100%; height: auto; display: block; transition: transform 8s ease-in-out;
        }
        .browser-mockup:hover .browser-content img { transform: translateY(-15%); }
        .float-badge {
          position: absolute; top: -15px; right: -15px;
          background: rgba(5, 10, 20, 0.95); border: 1px solid var(--border);
          padding: 10px 16px; border-radius: 10px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
          display: flex; align-items: center; gap: 10px;
          animation: float 5s ease-in-out infinite; z-index: 10;
        }
        @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        .float-badge-icon {
          width: 36px; height: 36px; background: rgba(59, 130, 246, 0.15);
          border-radius: 8px; display: flex; align-items: center; justify-content: center;
          color: var(--primary);
        }
        .float-badge-text { font-size: 0.7rem; color: var(--text-muted); }
        .float-badge-value { font-size: 1rem; font-weight: 600; color: var(--text-white); }
        #stats {
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
          padding: 50px 0; background: rgba(255, 255, 255, 0.01);
        }
        .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 40px; text-align: center; }
        .stat-item h4 {
          font-size: 2.25rem; font-weight: 700; margin-bottom: 6px;
          background: linear-gradient(135deg, var(--text-white) 0%, var(--primary) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
        }
        .stat-item span {
          color: var(--text-muted); font-size: 0.8rem;
          text-transform: uppercase; letter-spacing: 0.5px; font-weight: 500;
        }
        #features { padding: 100px 0; }
        .section-header { text-align: center; max-width: 600px; margin: 0 auto 80px; }
        .section-tag {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 12px; background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.15); border-radius: 20px;
          font-size: 0.75rem; color: var(--primary); font-weight: 500; margin-bottom: 16px;
        }
        .section-header h2 { font-size: 2.25rem; font-weight: 700; margin-bottom: 12px; }
        .section-header p { color: var(--text-gray); font-size: 1rem; }
        .feature-block {
          display: grid; grid-template-columns: 1fr 1.2fr; gap: 60px;
          align-items: center; margin-bottom: 100px;
        }
        .feature-block:last-child { margin-bottom: 0; }
        .feature-block.reverse { grid-template-columns: 1.2fr 1fr; }
        .feature-block.reverse .feature-text { order: 2; }
        .feature-block.reverse .feature-visual { order: 1; }
        .feature-icon {
          width: 50px; height: 50px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); font-size: 1.25rem; margin-bottom: 20px;
        }
        .feature-text h3 { font-size: 1.5rem; font-weight: 600; margin-bottom: 12px; }
        .feature-text p { color: var(--text-gray); font-size: 0.95rem; margin-bottom: 20px; line-height: 1.7; }
        .feature-list { list-style: none; }
        .feature-list li {
          display: flex; align-items: center; gap: 10px;
          color: var(--text-gray); font-size: 0.9rem; margin-bottom: 10px;
        }
        .check-icon { color: var(--accent); width: 14px; height: 14px; }
        .feature-browser {
          background: var(--bg-card-solid); border: 1px solid var(--border);
          border-radius: 12px; overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); transition: var(--transition);
        }
        .feature-browser:hover {
          transform: translateY(-5px);
          box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6), var(--glow);
        }
        .feature-browser .browser-content img { transition: transform 6s ease-in-out; }
        .feature-browser:hover .browser-content img { transform: translateY(-10%); }
        #features-cards { padding: 0 0 100px; }
        .features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
        .feature-card {
          background: var(--bg-card); border: 1px solid var(--border);
          border-radius: 16px; padding: 32px 28px; transition: var(--transition);
        }
        .feature-card:hover {
          transform: translateY(-5px); border-color: rgba(59, 130, 246, 0.3);
          box-shadow: var(--glow);
        }
        .feature-card-icon {
          width: 48px; height: 48px;
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(6, 182, 212, 0.15));
          border: 1px solid rgba(59, 130, 246, 0.2); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          color: var(--primary); margin-bottom: 20px;
        }
        .feature-card h4 { font-size: 1.1rem; font-weight: 600; margin-bottom: 10px; }
        .feature-card p { color: var(--text-gray); font-size: 0.875rem; line-height: 1.6; }
        #cta { padding: 100px 0; }
        .cta-box {
          background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
          border: 1px solid var(--border); border-radius: 20px;
          padding: 70px 40px; text-align: center; position: relative; overflow: hidden;
        }
        .cta-box::before {
          content: ''; position: absolute; top: 0; left: 50%;
          transform: translateX(-50%); width: 60%; height: 1px;
          background: linear-gradient(90deg, transparent, var(--primary), transparent);
        }
        .cta-box h2 { font-size: 2rem; font-weight: 700; margin-bottom: 12px; }
        .cta-box p { color: var(--text-gray); font-size: 1rem; max-width: 500px; margin: 0 auto 28px; }
        .landing-footer { padding: 50px 0 30px; border-top: 1px solid var(--border); }
        .footer-grid {
          display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 60px; margin-bottom: 40px;
        }
        .footer-brand .logo { margin-bottom: 12px; }
        .footer-brand p { color: var(--text-muted); font-size: 0.85rem; max-width: 280px; }
        .footer-column h4 { font-size: 0.85rem; font-weight: 600; margin-bottom: 16px; }
        .footer-column ul { list-style: none; }
        .footer-column li { margin-bottom: 10px; }
        .footer-column a {
          color: var(--text-muted); text-decoration: none; font-size: 0.85rem;
          transition: var(--transition);
        }
        .footer-column a:hover { color: var(--primary); }
        .footer-bottom {
          padding-top: 24px; border-top: 1px solid var(--border);
          display: flex; justify-content: space-between; align-items: center;
        }
        .footer-bottom p { color: var(--text-muted); font-size: 0.8rem; }
        .footer-socials { display: flex; gap: 12px; }
        .footer-socials a {
          width: 36px; height: 36px; background: var(--bg-card-solid);
          border: 1px solid var(--border); border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          color: var(--text-muted); text-decoration: none; transition: var(--transition);
        }
        .footer-socials a:hover { background: var(--primary); color: white; border-color: var(--primary); }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1); }
        .reveal.active { opacity: 1; transform: translateY(0); }
        @media (max-width: 1024px) {
          .hero-grid { grid-template-columns: 1fr; gap: 50px; }
          .hero-content { text-align: center; }
          .hero-content p { margin: 0 auto 32px; }
          .hero-buttons { justify-content: center; }
          .feature-block, .feature-block.reverse { grid-template-columns: 1fr; gap: 40px; }
          .feature-block.reverse .feature-text, .feature-block.reverse .feature-visual { order: unset; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-grid { grid-template-columns: repeat(2, 1fr); gap: 30px; }
          .footer-grid { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .nav-menu { display: none; }
          .hero-content h1 { font-size: 2rem; }
          .section-header h2 { font-size: 1.75rem; }
          .stat-item h4 { font-size: 1.75rem; }
          .footer-bottom { flex-direction: column; gap: 16px; text-align: center; }
        }
      `}</style>

      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap" rel="stylesheet" />

      <header className="landing-header">
        <div className="landing-container nav-inner">
          <Link href="/" className="logo">
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/>
              </svg>
            </div>
            ULTRON
          </Link>
          <nav className="nav-menu">
            <a href="#features" className="nav-link">Fonctionnalités</a>
            <a href="#stats" className="nav-link">Résultats</a>
            <a href="#cta" className="nav-link">Contact</a>
          </nav>
          <div className="nav-cta">
            <Link href="/login" className="btn btn-glass">Connexion</Link>
            <Link href="/register" className="btn btn-primary">Essai Gratuit</Link>
          </div>
        </div>
      </header>

      <main>
        <section id="hero">
          <canvas id="hero-canvas"></canvas>
          <div className="landing-container hero-grid">
            <div className="hero-content reveal">
              <div className="hero-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z"/>
                </svg>
                Nouveau : Génération de lettres avec IA
              </div>
              <h1>L&apos;Intelligence Artificielle<br/><span className="text-gradient">au service du Patrimoine.</span></h1>
              <p>Automatisez votre prospection, qualifiez vos leads en temps réel et multipliez vos conversions. Conçu pour les CGP.</p>
              <div className="hero-buttons">
                <Link href="/register" className="btn btn-primary">
                  Commencer maintenant
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <a href="#features" className="btn btn-glass">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Voir la démo
                </a>
              </div>
            </div>

            <div className="hero-visual reveal">
              <div className="browser-mockup" id="tilt-card">
                <div className="float-badge">
                  <div className="float-badge-icon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="float-badge-text">Score IA</div>
                    <div className="float-badge-value">98/100</div>
                  </div>
                </div>
                <div className="browser-header">
                  <div className="browser-dots">
                    <div className="browser-dot dot-red"></div>
                    <div className="browser-dot dot-yellow"></div>
                    <div className="browser-dot dot-green"></div>
                  </div>
                  <div className="browser-url">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{color: 'var(--accent)'}}>
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                    </svg>
                    ultron-ai.pro/dashboard
                  </div>
                </div>
                <div className="browser-content">
                  <img src="/images/dashboard-placeholder.svg" alt="Dashboard Ultron" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="stats">
          <div className="landing-container">
            <div className="stats-grid reveal">
              <div className="stat-item"><h4>+40%</h4><span>Taux de conversion</span></div>
              <div className="stat-item"><h4>98%</h4><span>Précision IA</span></div>
              <div className="stat-item"><h4>2h</h4><span>Gagnées par jour</span></div>
              <div className="stat-item"><h4>24/7</h4><span>Disponibilité</span></div>
            </div>
          </div>
        </section>

        <section id="features">
          <div className="landing-container">
            <div className="section-header reveal">
              <span className="section-tag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z"/>
                </svg>
                Fonctionnalités
              </span>
              <h2>Tout ce dont vous avez besoin</h2>
              <p>Des outils puissants pour gérer vos prospects de A à Z, propulsés par l&apos;intelligence artificielle.</p>
            </div>

            <div className="feature-block reveal">
              <div className="feature-text">
                <div className="feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
                  </svg>
                </div>
                <h3>Dashboard en temps réel</h3>
                <p>Visualisez instantanément vos KPIs : prospects chauds, tièdes, froids, emails envoyés et évolution sur 30 jours.</p>
                <ul className="feature-list">
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Statistiques en temps réel</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Graphiques d&apos;évolution</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Activité récente</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Alertes intelligentes</li>
                </ul>
              </div>
              <div className="feature-visual">
                <div className="feature-browser">
                  <div className="browser-header">
                    <div className="browser-dots">
                      <div className="browser-dot dot-red"></div>
                      <div className="browser-dot dot-yellow"></div>
                      <div className="browser-dot dot-green"></div>
                    </div>
                    <div className="browser-url">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{color: 'var(--accent)'}}>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                      </svg>
                      ultron-ai.pro/dashboard
                    </div>
                  </div>
                  <div className="browser-content">
                    <img src="/images/dashboard-placeholder.svg" alt="Dashboard" />
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-block reverse reveal">
              <div className="feature-text">
                <div className="feature-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="18" rx="1"/><rect x="14" y="3" width="7" height="18" rx="1"/>
                  </svg>
                </div>
                <h3>Pipeline CRM visuel</h3>
                <p>Gérez vos prospects dans un Kanban intuitif. Drag & drop pour changer de stage, actions automatiques incluses.</p>
                <ul className="feature-list">
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Vue Kanban drag & drop</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Badges de qualification IA</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Actions automatiques</li>
                  <li><svg className="check-icon" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>Filtres et recherche</li>
                </ul>
              </div>
              <div className="feature-visual">
                <div className="feature-browser">
                  <div className="browser-header">
                    <div className="browser-dots">
                      <div className="browser-dot dot-red"></div>
                      <div className="browser-dot dot-yellow"></div>
                      <div className="browser-dot dot-green"></div>
                    </div>
                    <div className="browser-url">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{color: 'var(--accent)'}}>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z"/>
                      </svg>
                      ultron-ai.pro/pipeline
                    </div>
                  </div>
                  <div className="browser-content">
                    <img src="/images/pipeline-placeholder.svg" alt="Pipeline" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features-cards">
          <div className="landing-container">
            <div className="features-grid reveal">
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z"/>
                  </svg>
                </div>
                <h4>Qualification IA</h4>
                <p>L&apos;IA analyse chaque prospect et le qualifie automatiquement en CHAUD, TIÈDE ou FROID selon vos critères.</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </div>
                <h4>Emails automatiques</h4>
                <p>Confirmations de RDV, rappels 24h avant, envoi de plaquette... Tout est automatisé et personnalisé.</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <h4>Génération de lettres</h4>
                <p>Générez en 1 clic des lettres de rachat, transfert ou stop prélèvement avec l&apos;IA. Export PDF inclus.</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <h4>Suivi des commissions</h4>
                <p>Suivez vos commissions par produit et conseiller. Tableau de bord financier complet.</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </div>
                <h4>Planning intégré</h4>
                <p>Sync Google Calendar, rappels automatiques, vue agenda et tâches pour ne rien oublier.</p>
              </div>
              <div className="feature-card">
                <div className="feature-card-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  </svg>
                </div>
                <h4>Sécurité RGPD</h4>
                <p>Données hébergées en Europe, chiffrement, export et suppression sur demande. 100% conforme.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="cta">
          <div className="landing-container reveal">
            <div className="cta-box">
              <h2>Prêt à transformer votre cabinet ?</h2>
              <p>Rejoignez les CGP qui gagnent du temps chaque jour avec Ultron. Essai gratuit de 14 jours, sans engagement.</p>
              <Link href="/register" className="btn btn-primary">
                Accéder à la plateforme
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-grid">
            <div className="footer-brand">
              <Link href="/" className="logo">
                <div className="logo-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/>
                  </svg>
                </div>
                ULTRON
              </Link>
              <p>Le CRM intelligent pour les Conseillers en Gestion de Patrimoine.</p>
            </div>
            <div className="footer-column">
              <h4>Produit</h4>
              <ul>
                <li><a href="#features">Fonctionnalités</a></li>
                <li><a href="#stats">Résultats</a></li>
                <li><a href="#cta">Démo</a></li>
              </ul>
            </div>
            <div className="footer-column">
              <h4>Légal</h4>
              <ul>
                <li><Link href="/privacy">Politique de confidentialité</Link></li>
                <li><Link href="/legal">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2026 Ultron CRM. Tous droits réservés.</p>
            <div className="footer-socials">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}