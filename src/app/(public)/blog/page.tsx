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
        background: '#050505',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      {/* Header / Nav */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          backdropFilter: 'blur(20px)',
          background: 'rgba(5,5,5,0.8)',
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
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textDecoration: 'none',
            }}
          >
            ULTRON
          </Link>
          <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <Link
              href="/features/crm"
              style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
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
                padding: '8px 20px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff',
                fontWeight: 600,
                textDecoration: 'none',
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
        }}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: '12px',
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: '8px',
            background: 'rgba(99,102,241,0.12)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.2)',
            marginBottom: '20px',
          }}
        >
          Blog & Ressources
        </span>
        <h1
          style={{
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 800,
            lineHeight: 1.2,
            marginBottom: '16px',
          }}
        >
          Conseils et stratégies pour{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
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
            color: 'rgba(255,255,255,0.5)',
            maxWidth: '600px',
            margin: '0 auto 40px',
            lineHeight: 1.6,
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
                padding: '6px 14px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.05)',
                color: 'rgba(255,255,255,0.6)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </section>

      {/* Articles Grid */}
      <section style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px 80px' }}>
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
        }}
      >
        <div
          style={{
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '20px',
            padding: '48px 32px',
          }}
        >
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            Prêt à transformer votre cabinet ?
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '24px',
            }}
          >
            Découvrez comment Ultron peut automatiser votre prospection et booster vos résultats.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-block',
              fontSize: '14px',
              padding: '12px 32px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Démarrer l&apos;essai gratuit
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '32px 24px',
          textAlign: 'center',
        }}
      >
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.25)' }}>
          © 2026 Ultron. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
