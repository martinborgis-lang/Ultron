import { Metadata } from 'next';
import { articles } from '@/lib/blog/articles';
import ArticleCard from '@/components/blog/ArticleCard';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog Ultron | Conseils CRM et IA pour Cabinets CGP',
  description:
    'Articles, guides et analyses sur l\'automatisation, l\'IA et la gestion de patrimoine. Ressources pour les dirigeants de cabinets CGP.',
  keywords: [
    'blog CGP',
    'CRM gestion patrimoine',
    'IA prospection',
    'automatisation cabinet',
    'conseils CGP',
  ],
  openGraph: {
    title: 'Blog Ultron | Conseils CRM et IA pour Cabinets CGP',
    description:
      'Articles et guides pour les dirigeants de cabinets de gestion de patrimoine.',
    type: 'website',
    url: 'https://ultron-murex.vercel.app/blog',
  },
};

const categories = [...new Set(articles.map((a) => a.category))];

export default function BlogPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050a12',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient background gradients */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: `
          radial-gradient(ellipse 800px 600px at 20% 10%, rgba(59, 130, 246, 0.06) 0%, transparent 60%),
          radial-gradient(ellipse 600px 500px at 80% 60%, rgba(6, 182, 212, 0.04) 0%, transparent 60%),
          radial-gradient(ellipse 500px 400px at 50% 90%, rgba(16, 185, 129, 0.03) 0%, transparent 60%)
        `,
      }} />

      {/* Subtle grid */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, opacity: 0.025,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '60px 60px',
      }} />

      {/* Header / Nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          background: 'rgba(5,10,18,0.85)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            maxWidth: '1200px',
            margin: '0 auto',
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/"
            style={{
              fontSize: '20px',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
              letterSpacing: '-0.02em',
            }}
          >
            ULTRON
          </Link>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link
              href="/features/crm"
              style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.3s' }}
            >
              Fonctionnalités
            </Link>
            <Link
              href="/blog"
              style={{ fontSize: '14px', color: '#fff', fontWeight: 600, textDecoration: 'none' }}
            >
              Blog
            </Link>
            <Link
              href="/register"
              style={{
                fontSize: '13px',
                padding: '9px 22px',
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
                border: '1px solid rgba(96, 165, 250, 0.3)',
                transition: 'all 0.3s ease',
              }}
            >
              Essai gratuit
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '80px 24px 40px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 16px',
            borderRadius: '50px',
            background: 'rgba(59,130,246,0.1)',
            color: '#60a5fa',
            border: '1px solid rgba(59,130,246,0.2)',
            marginBottom: '20px',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
          </svg>
          Blog & Ressources
        </span>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '16px',
            letterSpacing: '-0.03em',
          }}
        >
          Conseils et stratégies pour{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #3b82f6, #06b6d4)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            cabinets CGP
          </span>
        </h1>
        <p
          style={{
            fontSize: '16px',
            color: 'rgba(255,255,255,0.45)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.7,
          }}
        >
          Découvrez nos articles sur l&apos;automatisation, l&apos;IA et les meilleures pratiques
          pour développer votre cabinet de gestion de patrimoine.
        </p>

        {/* Category filters */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '48px',
          }}
        >
          {categories.map((cat) => (
            <span
              key={cat}
              style={{
                fontSize: '12px',
                padding: '6px 16px',
                borderRadius: '50px',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.55)',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                fontWeight: 500,
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '24px',
          }}
        >
          {articles.map((article) => (
            <ArticleCard
              key={article.slug}
              slug={article.slug}
              title={article.title}
              description={article.description}
              date={article.date}
              readTime={article.readTime}
              category={article.category}
              author={article.author}
            />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '60px 24px 80px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.8), rgba(10, 15, 28, 0.9))',
            border: '1px solid rgba(59,130,246,0.12)',
            borderRadius: '20px',
            padding: '48px 32px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Top accent line */}
          <div style={{
            position: 'absolute', top: 0, left: '20%', right: '20%', height: '1px',
            background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.4), transparent)',
          }} />
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '12px',
              letterSpacing: '-0.02em',
            }}
          >
            Prêt à transformer votre cabinet ?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.45)',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}
          >
            Découvrez comment Ultron peut automatiser votre prospection et booster vos résultats.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              padding: '12px 32px',
              borderRadius: '50px',
              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
              boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3), 0 1px 3px rgba(0,0,0,0.2)',
              border: '1px solid rgba(96, 165, 250, 0.3)',
              transition: 'all 0.3s ease',
            }}
          >
            Démarrer l&apos;essai gratuit
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 24px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Ultron. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
