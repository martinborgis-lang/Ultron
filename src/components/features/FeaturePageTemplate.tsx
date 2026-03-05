'use client';

import Link from 'next/link';
import { ReactNode } from 'react';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

interface FeatureSection {
  title: string;
  description: string;
  points: string[];
  icon?: ReactNode;
}

interface FeaturePageTemplateProps {
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  mockup: ReactNode;
  sections: FeatureSection[];
  ctaText?: string;
}

export default function FeaturePageTemplate({
  badge,
  title,
  subtitle,
  description,
  accentColor,
  mockup,
  sections,
  ctaText = 'Essayer gratuitement',
}: FeaturePageTemplateProps) {
  return (
    <div className="landingPage">
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* Nav */}
      <header className="header">
        <div className="`${container} ${navInner}`">
          <Link href="/" className="logo">
            <div className="logoIcon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
              </svg>
            </div>
            ULTRON
          </Link>
          <nav className="navMenu">
            <Link href="/#features" className="navLink">Fonctionnalités</Link>
            <Link href="/features/crm" className="navLink">CRM</Link>
            <Link href="/features/ai-assistant" className="navLink">IA</Link>
            <Link href="/blog" className="navLink">Blog</Link>
          </nav>
          <div className="navCta">
            <Link href="/login" className="btnGlass">Connexion</Link>
            <Link href="/register" className="btnPrimary">Essai Gratuit</Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section style={{ paddingTop: 140, paddingBottom: 80, position: 'relative', overflow: 'hidden' }">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 30%, ${accentColor}, transparent 70%)`,
            }}
          />
          <div className="container} style={{ position: 'relative', zIndex: 1 }">
            <AnimatedSection>
              <div style={{ textAlign: 'center', maxWidth: 700, margin: '0 auto 48px' }">
                <span
                  style={{
                    display: 'inline-block',
                    padding: '6px 16px',
                    borderRadius: 20,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    backgroundColor: `${accentColor}15`,
                    color: accentColor,
                    border: `1px solid ${accentColor}30`,
                    marginBottom: 20,
                  }}
                >
                  {badge}
                </span>
                <h1 style={{ fontSize: '2.75rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }">
                  {title}
                </h1>
                <p style={{ fontSize: '1.15rem', color: accentColor, fontWeight: 500, marginBottom: 12 }">
                  {subtitle}
                </p>
                <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 560, margin: '0 auto' }">
                  {description}
                </p>
              </div>
            </AnimatedSection>

            <AnimatedSection animation="scaleIn" delay={0.2">
              <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }">
                <div
                  className="absolute -inset-6 rounded-2xl opacity-15 blur-3xl pointer-events-none"
                  style={{ backgroundColor: accentColor }}
                />
                <div style={{ position: 'relative' }">
                  {mockup}
                </div>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* Feature Sections */}
        {sections.map((section, i) => (
          <section key={i} style={{ padding: '60px 0' }">
            <div className="container">
              <AnimatedSection animation={i % 2 === 0 ? 'slideLeft' : 'slideRight'">
                <div style={{ maxWidth: 700, margin: i % 2 === 0 ? '0' : '0 0 0 auto', textAlign: i % 2 === 0 ? 'left' : 'right' }">
                  <h3 style={{ fontSize: '1.75rem', fontWeight: 600, marginBottom: 12 }">
                    {section.title}
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 20, lineHeight: 1.7 }">
                    {section.description}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0 }">
                    {section.points.map((point, j) => (
                      <li
                        key={j}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          marginBottom: 10,
                          color: 'var(--text-gray)',
                          fontSize: '0.95rem',
                          justifyContent: i % 2 === 0 ? 'flex-start' : 'flex-end',
                        }}
                      >
                        {i % 2 === 0 && (
                          <span style={{ color: accentColor, flexShrink: 0, marginTop: 4 }">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </span>
                        )}
                        <span>{point}</span>
                        {i % 2 !== 0 && (
                          <span style={{ color: accentColor, flexShrink: 0, marginTop: 4 }">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                            </svg>
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </AnimatedSection>
            </div>
          </section>
        ))}

        {/* CTA */}
        <section className="cta">
          <AnimatedSection className="container">
            <div className="ctaBox">
              <h2>Prêt à essayer {badge} ?</h2>
              <p>Démarrez votre essai gratuit de 14 jours. Aucune carte bancaire requise.</p>
              <Link href="/register" className="btnPrimary">
                {ctaText}
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footerBottom">
            <p>&copy; 2026 Ultron CRM. Tous droits réservés.</p>
            <div style={{ display: 'flex', gap: 16 }">
              <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }">Confidentialité</Link>
              <Link href="/legal" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }">Mentions légales</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
