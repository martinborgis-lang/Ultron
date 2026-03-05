import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: "CRM CGP Nice — Ultron, le CRM IA des Conseillers en Patrimoine",
  description: "Ultron, le CRM spécialisé pour les CGP de Nice. Qualification IA, agent vocal, pipeline intelligent. Essai gratuit 14 jours.",
  keywords: [
    "CRM CGP Nice",
    "logiciel CGP Nice",
    "conseiller patrimoine Nice",
    "gestion patrimoine Nice",
    "CRM IA Nice",
    "logiciel gestion patrimoine Côte d'Azur",
    "CRM conseillers financiers Alpes-Maritimes",
    "automation CGP Nice"
  ],
  openGraph: {
    title: "CRM CGP Nice — Ultron CRM IA",
    description: "Le CRM spécialisé pour les Conseillers en Gestion de Patrimoine de Nice et Côte d'Azur",
    url: "https://ultron-ai.pro/cgp-nice",
    type: "website",
    locale: "fr_FR"
  },
  alternates: {
    canonical: "https://ultron-ai.pro/cgp-nice"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "LocalBusiness"],
  "name": "Ultron CRM Nice",
  "description": "CRM IA spécialisé pour CGP à Nice",
  "url": "https://ultron-ai.pro/cgp-nice",
  "areaServed": {
    "@type": "City",
    "name": "Nice",
    "addressRegion": "Provence-Alpes-Côte d'Azur",
    "addressCountry": "FR"
  },
  "serviceType": "CRM Software",
  "audience": {
    "@type": "ProfessionalAudience",
    "name": "Conseillers en Gestion de Patrimoine"
  },
  "priceRange": "€€",
  "applicationCategory": "BusinessApplication"
};

export default function CGPNicePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="landingPage">
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />

        {/* Navigation */}
        <header className="header">
          <div className="container navInner">
            <Link href="/" className="logo">
              <div className="logoIcon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
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
          {/* Hero Section */}
          <section style={{ paddingTop: 140, paddingBottom: 80, position: 'relative', overflow: 'hidden' }}>
            <div
              className="absolute inset-0 opacity-[0.04] pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse at 50% 30%, #0891b2, transparent 70%)',
              }}
            />
            <div className="container" style={{ position: 'relative', zIndex: 1 }}>
              <AnimatedSection>
                <div style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto 48px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '6px 16px',
                      borderRadius: 20,
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      backgroundColor: '#0891b215',
                      color: '#0891b2',
                      border: '1px solid #0891b230',
                      marginBottom: 20,
                    }}
                  >
                    CRM CGP Nice
                  </span>
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                    Ultron CRM — CRM IA pour CGP à Nice
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#0891b2', fontWeight: 500, marginBottom: 12 }}>
                    Le CRM qui sublime les patrimoines de la Côte d'Azur
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                    À Nice, perle de la Côte d'Azur et destination privilégiée des patrimoines fortunés, les CGP accompagnent
                    retraités aisés, investisseurs immobiliers et entrepreneurs internationaux. Ultron s'adapte à cette clientèle premium unique.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scaleIn" delay={0.2}>
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                  <div
                    className="absolute -inset-6 rounded-2xl opacity-15 blur-3xl pointer-events-none"
                    style={{ backgroundColor: '#0891b2' }}
                  />
                  <div style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
                    <img
                      src="/images/mockup-nice-cgp.jpg"
                      alt="Interface Ultron CRM pour CGP niçois"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Nice Context Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 24 }}>
                    Nice : destination premium des patrimoines
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 40 }}>
                    Nice concentre une clientèle fortunée unique : retraités aisés installés sur la Côte d'Azur,
                    investisseurs immobiliers dans le luxe méditerranéen, entrepreneurs internationaux et résidents fiscaux.
                    Cette concentration de patrimoines élevés crée des opportunités exceptionnelles pour les CGP spécialisés.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0891b2', marginBottom: 8 }}>545k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Habitants métropole</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0891b2', marginBottom: 8 }}>85%</div>
                      <div style={{ color: 'var(--text-gray)' }}>Résidences secondaires</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0891b2', marginBottom: 8 }}>1.2M€</div>
                      <div style={{ color: 'var(--text-gray)' }}>Prix moyen immobilier</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Challenges Section */}
          <section style={{ padding: '80px 0' }}>
            <div className="container">
              <AnimatedSection animation="slideLeft">
                <div style={{ maxWidth: 700, margin: '0' }}>
                  <h3 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: 24 }}>
                    Les atouts des CGP niçois
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Sur la Côte d'Azur, les CGP bénéficient d'une clientèle aux patrimoines substantiels et diversifiés,
                    avec des besoins sophistiqués en optimisation fiscale, transmission et gestion de résidences multiples.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#0891b215', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#0891b2">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Retraités fortunés</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Anciens dirigeants, cadres supérieurs retraités et professions libérales
                          installés sur la Côte d'Azur avec des patrimoines conséquents à optimiser et transmettre.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#16a34a15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#16a34a">
                          <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Investisseurs immobiliers</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Propriétaires de biens de prestige, investisseurs dans l'immobilier de luxe
                          et gestionnaires de portefeuilles immobiliers diversifiés sur la Riviera.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#dc262615', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#dc2626">
                          <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Résidents internationaux</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Entrepreneurs et executives internationaux, résidents fiscaux privilégiés
                          et investisseurs étrangers avec des problématiques patrimoniales complexes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Features Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection animation="slideRight">
                <div style={{ maxWidth: 700, margin: '0 0 0 auto', textAlign: 'right' }}>
                  <h3 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: 24 }}>
                    Ultron : élégance azuréenne
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    De la Promenade des Anglais aux collines de Cimiez, Ultron vous accompagne
                    dans la gestion raffinée de cette clientèle d'exception aux exigences premium.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Qualification IA patrimoine immobilier de luxe</span>
                      <span style={{ color: '#0891b2', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Templates optimisation résidences multiples</span>
                      <span style={{ color: '#0891b2', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Calculateurs transmission et donation</span>
                      <span style={{ color: '#0891b2', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Gestion fiscalité résidents privilégiés</span>
                      <span style={{ color: '#0891b2', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Interface haut de gamme et intuitive</span>
                      <span style={{ color: '#0891b2', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Testimonial Section */}
          <section style={{ padding: '80px 0' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 800, margin: '0 auto', textAlign: 'center' }}>
                  <div style={{ backgroundColor: 'var(--bg-secondary)', padding: 48, borderRadius: 16, border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: 24 }}>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="#0891b2" opacity="0.3">
                        <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
                      </svg>
                    </div>
                    <blockquote style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6 }}>
                      "Notre clientèle niçoise apprécie la sophistication d'Ultron. L'outil nous aide à gérer des patrimoines complexes
                      avec l'élégance et la précision qu'attendent nos clients de la Côte d'Azur."
                    </blockquote>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Isabella Rossi-Laurent</div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Directrice Patrimoine, Cabinet Riviera Conseil - Nice Carré d'Or</div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Compliance Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection animation="slideLeft">
                <div style={{ maxWidth: 700, margin: '0' }}>
                  <h3 style={{ fontSize: '2.25rem', fontWeight: 600, marginBottom: 24 }}>
                    Discrétion et sécurité premium
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Pour une clientèle exigeant la plus haute discrétion, Ultron garantit un niveau de sécurité
                    et de confidentialité digne des standards du private banking international.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Sécurité bancaire privée</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Confidentialité absolue</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Chiffrement militaire</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Support premium 24/7</span>
                    </div>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Final CTA */}
          <section className="cta">
            <AnimatedSection className="container">
              <div className="ctaBox">
                <h2>Rejoignez les cabinets CGP de Nice sur Ultron</h2>
                <p>Sublimez votre expertise avec l'élégance d'Ultron. Essai gratuit 14 jours avec accompagnement premium inclus.</p>
                <Link href="/register" className="btnPrimary">
                  Essai Gratuit 14 jours
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ✓ Service premium • ✓ Formation patrimoine luxe • ✓ Concierge dédié
                </div>
              </div>
            </AnimatedSection>
          </section>
        </main>

        {/* Footer */}
        <footer className="footer">
          <div className="container">
            <div className="footerBottom">
              <p>&copy; 2026 Ultron CRM. Tous droits réservés.</p>
              <div style={{ display: 'flex', gap: 16 }}>
                <Link href="/privacy" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>Confidentialité</Link>
                <Link href="/legal" style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textDecoration: 'none' }}>Mentions légales</Link>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}