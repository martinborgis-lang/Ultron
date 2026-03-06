import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { articles, getArticleBySlug, getAllSlugs } from '@/lib/blog/articles';

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return { title: 'Article non trouvé' };

  return {
    title: `${article.title} | Blog Ultron`,
    description: article.description,
    keywords: article.keywords,
    openGraph: {
      title: article.title,
      description: article.description,
      type: 'article',
      url: `https://ultron-ai.pro/blog/${article.slug}`,
      publishedTime: article.date,
      authors: [article.author],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.description,
    },
  };
}

/* Simple markdown-to-HTML converter for our blog articles */
function renderMarkdown(md: string): string {
  return md
    .replace(/^### (.+)$/gm, '<h3 style="font-size:18px;font-weight:700;color:#fff;margin:32px 0 12px;">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 style="font-size:22px;font-weight:700;color:#fff;margin:40px 0 16px;">$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#e2e8f0">$1</strong>')
    .replace(/\n\n/g, '</p><p style="color:rgba(255,255,255,0.6);line-height:1.8;margin-bottom:16px;">')
    .replace(/^(?!<[hp])/gm, '')
    .replace(/^\s*$\n/gm, '');
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) notFound();

  const contentHtml = renderMarkdown(article.content.trim());

  // Related articles (same category, excluding current)
  const related = articles
    .filter((a) => a.category === article.category && a.slug !== article.slug)
    .slice(0, 2);

  const formattedDate = new Date(article.date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.description,
    datePublished: article.date,
    author: { '@type': 'Organization', name: article.author },
    publisher: {
      '@type': 'Organization',
      name: 'Ultron',
      url: 'https://ultron-ai.pro',
    },
    mainEntityOfPage: `https://ultron-ai.pro/blog/${article.slug}`,
    keywords: article.keywords.join(', '),
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#050505',
        color: '#fff',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
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
              style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', textDecoration: 'none' }}
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

      {/* Breadcrumb */}
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px 24px 0' }}>
        <nav style={{ fontSize: '13px', color: 'rgba(255,255,255,0.3)' }}>
          <Link href="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none' }}>
            Accueil
          </Link>
          {' / '}
          <Link href="/blog" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none' }}>
            Blog
          </Link>
          {' / '}
          <span style={{ color: 'rgba(255,255,255,0.6)' }}>{article.title}</span>
        </nav>
      </div>

      {/* Article */}
      <article style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px 60px' }}>
        {/* Meta header */}
        <div style={{ marginBottom: '32px' }}>
          <span
            style={{
              display: 'inline-block',
              fontSize: '11px',
              fontWeight: 600,
              padding: '4px 10px',
              borderRadius: '6px',
              background: 'rgba(99,102,241,0.12)',
              color: '#818cf8',
              border: '1px solid rgba(99,102,241,0.2)',
              marginBottom: '16px',
            }}
          >
            {article.category}
          </span>
          <h1
            style={{
              fontSize: 'clamp(26px, 4vw, 36px)',
              fontWeight: 800,
              lineHeight: 1.3,
              marginBottom: '16px',
            }}
          >
            {article.title}
          </h1>
          <p
            style={{
              fontSize: '16px',
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.6,
              marginBottom: '20px',
            }}
          >
            {article.description}
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.3)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '20px',
            }}
          >
            <span>{article.author}</span>
            <span>·</span>
            <span>{formattedDate}</span>
            <span>·</span>
            <span>{article.readTime} de lecture</span>
          </div>
        </div>

        {/* Content */}
        <div
          dangerouslySetInnerHTML={{
            __html: `<p style="color:rgba(255,255,255,0.6);line-height:1.8;margin-bottom:16px;">${contentHtml}</p>`,
          }}
        />

        {/* CTA in article */}
        <div
          style={{
            marginTop: '48px',
            background: 'rgba(99,102,241,0.06)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: '16px',
            padding: '32px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
            Envie de passer à l&apos;action ?
          </h3>
          <p
            style={{
              fontSize: '14px',
              color: 'rgba(255,255,255,0.5)',
              marginBottom: '20px',
            }}
          >
            Testez gratuitement Ultron et automatisez votre cabinet dès aujourd&apos;hui.
          </p>
          <Link
            href="/register"
            style={{
              display: 'inline-block',
              fontSize: '14px',
              padding: '10px 28px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: '#fff',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Démarrer gratuitement
          </Link>
        </div>

        {/* Keywords / Tags */}
        <div style={{ marginTop: '32px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {article.keywords.map((kw) => (
            <span
              key={kw}
              style={{
                fontSize: '11px',
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'rgba(255,255,255,0.04)',
                color: 'rgba(255,255,255,0.4)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              {kw}
            </span>
          ))}
        </div>
      </article>

      {/* Related articles */}
      {related.length > 0 && (
        <section
          style={{
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 24px 80px',
          }}
        >
          <h2
            style={{
              fontSize: '20px',
              fontWeight: 700,
              marginBottom: '24px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            Articles similaires
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '12px',
                    padding: '20px',
                    transition: 'border-color 0.3s',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '15px',
                      fontWeight: 600,
                      color: '#fff',
                      marginBottom: '8px',
                      lineHeight: 1.4,
                    }}
                  >
                    {rel.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.4)',
                      lineHeight: 1.5,
                    }}
                  >
                    {rel.description.slice(0, 100)}...
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

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
