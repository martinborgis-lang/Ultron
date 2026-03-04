import Link from 'next/link';

interface ArticleCardProps {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  author: string;
}

const categoryColors: Record<string, string> = {
  Prospection: '#22c55e',
  'Intelligence Artificielle': '#8b5cf6',
  Conversion: '#f59e0b',
  Meetings: '#3b82f6',
  'Marketing Digital': '#0077b5',
  Productivité: '#ef4444',
};

export default function ArticleCard({ slug, title, description, date, readTime, category, author }: ArticleCardProps) {
  const accentColor = categoryColors[category] || '#6366f1';

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Link href={`/blog/${slug}`} style={{ textDecoration: 'none' }}>
      <article
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '28px',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${accentColor}40`;
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = `0 8px 30px ${accentColor}15`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Category badge */}
        <span
          style={{
            display: 'inline-block',
            fontSize: '11px',
            fontWeight: 600,
            padding: '4px 10px',
            borderRadius: '6px',
            background: `${accentColor}15`,
            color: accentColor,
            border: `1px solid ${accentColor}30`,
            marginBottom: '16px',
            alignSelf: 'flex-start',
          }}
        >
          {category}
        </span>

        {/* Title */}
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.4,
            marginBottom: '12px',
          }}
        >
          {title}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.6,
            marginBottom: '20px',
            flex: 1,
          }}
        >
          {description}
        </p>

        {/* Meta */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.3)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            paddingTop: '16px',
          }}
        >
          <span>{author}</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>{formattedDate}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{readTime} de lecture</span>
          </div>
        </div>
      </article>
    </Link>
  );
}
