'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';

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
  'Intelligence Artificielle': '#06b6d4',
  Conversion: '#f59e0b',
  Meetings: '#3b82f6',
  'Marketing Digital': '#0ea5e9',
  Productivité: '#ef4444',
};

export default function ArticleCard({ slug, title, description, date, readTime, category, author }: ArticleCardProps) {
  const accentColor = categoryColors[category] || '#3b82f6';
  const cardRef = useRef<HTMLElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
    setMousePos({ x, y });
  };

  return (
    <Link href={`/blog/${slug}`} style={{ textDecoration: 'none', display: 'block' }}>
      <article
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setMousePos({ x: 0, y: 0 });
        }}
        style={{
          background: isHovered
            ? 'rgba(255,255,255,0.05)'
            : 'rgba(255,255,255,0.025)',
          border: `1px solid ${isHovered ? `${accentColor}30` : 'rgba(255,255,255,0.06)'}`,
          borderRadius: '16px',
          padding: '28px',
          transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transform: isHovered
            ? `perspective(800px) rotateX(${mousePos.y}deg) rotateY(${mousePos.x}deg) translateY(-6px) scale(1.01)`
            : 'perspective(800px) rotateX(0) rotateY(0) translateY(0) scale(1)',
          boxShadow: isHovered
            ? `0 20px 40px rgba(0,0,0,0.3), 0 0 30px ${accentColor}10, inset 0 1px 0 rgba(255,255,255,0.05)`
            : '0 2px 8px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Spotlight gradient that follows cursor */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0, right: 0, bottom: 0,
          background: isHovered
            ? `radial-gradient(400px circle at ${(mousePos.x / 8 + 0.5) * 100}% ${(-mousePos.y / 8 + 0.5) * 100}%, ${accentColor}08, transparent 60%)`
            : 'none',
          pointerEvents: 'none',
          transition: 'background 0.15s ease',
          borderRadius: 'inherit',
        }} />

        {/* Top decorative line */}
        <div style={{
          position: 'absolute',
          top: 0, left: '10%', right: '10%',
          height: '1px',
          background: isHovered
            ? `linear-gradient(90deg, transparent, ${accentColor}50, transparent)`
            : 'transparent',
          transition: 'background 0.4s ease',
        }} />

        {/* Category badge */}
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontWeight: 600,
            padding: '5px 12px',
            borderRadius: '20px',
            background: `${accentColor}12`,
            color: accentColor,
            border: `1px solid ${accentColor}25`,
            marginBottom: '16px',
            alignSelf: 'flex-start',
            position: 'relative',
            transition: 'all 0.3s ease',
            boxShadow: isHovered ? `0 0 12px ${accentColor}15` : 'none',
          }}
        >
          <div style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: accentColor,
            boxShadow: isHovered ? `0 0 6px ${accentColor}` : 'none',
            transition: 'box-shadow 0.3s ease',
          }} />
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
            position: 'relative',
            transition: 'color 0.3s ease',
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
            position: 'relative',
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
            position: 'relative',
          }}
        >
          <span style={{ fontWeight: 500 }}>{author}</span>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span>{formattedDate}</span>
            <span style={{ opacity: 0.5 }}>·</span>
            <span>{readTime} de lecture</span>
          </div>
        </div>

        {/* Read more indicator on hover */}
        <div style={{
          position: 'absolute',
          bottom: '28px', right: '28px',
          opacity: isHovered ? 1 : 0,
          transform: isHovered ? 'translateX(0)' : 'translateX(-8px)',
          transition: 'all 0.3s ease',
          color: accentColor,
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}>
          Lire
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </article>
    </Link>
  );
}
