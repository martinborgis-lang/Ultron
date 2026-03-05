import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: "CRM CGP Bordeaux — Ultron, le CRM IA des Conseillers en Patrimoine",
  description: "Ultron, le CRM spécialisé pour les CGP de Bordeaux. Qualification IA, agent vocal, pipeline intelligent. Essai gratuit 14 jours.",
  keywords: [
    "CRM CGP Bordeaux",
    "logiciel CGP Bordeaux",
    "conseiller patrimoine Bordeaux",
    "gestion patrimoine Bordeaux",
    "CRM IA Bordeaux",
    "logiciel gestion patrimoine Nouvelle-Aquitaine",
    "CRM conseillers financiers Gironde",
    "automation CGP Bordeaux"
  ],
  openGraph: {
    title: "CRM CGP Bordeaux — Ultron CRM IA",
    description: "Le CRM spécialisé pour les Conseillers en Gestion de Patrimoine de Bordeaux et Nouvelle-Aquitaine",
    url: "https://ultron-ai.pro/cgp-bordeaux",
    type: "website",
    locale: "fr_FR"
  },
  alternates: {
    canonical: "https://ultron-ai.pro/cgp-bordeaux"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "LocalBusiness"],
  "name": "Ultron CRM Bordeaux",
  "description": "CRM IA spécialisé pour CGP à Bordeaux",
  "url": "https://ultron-ai.pro/cgp-bordeaux",
  "areaServed": {
    "@type": "City",
    "name": "Bordeaux",
    "addressRegion": "Nouvelle-Aquitaine",
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

export default function CGPBordeauxPage() {
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
                background: 'radial-gradient(ellipse at 50% 30%, #7c2d12, transparent 70%)',
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
                      backgroundColor: '#7c2d1215',
                      color: '#7c2d12',
                      border: '1px solid #7c2d1230',
                      marginBottom: 20,
                    }}
                  >
                    CRM CGP Bordeaux
                  </span>
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                    Ultron CRM — CRM IA pour CGP à Bordeaux
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#7c2d12', fontWeight: 500, marginBottom: 12 }}>
                    Le CRM qui révèle le potentiel patrimonial bordelais
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                    À Bordeaux, capitale viticole mondiale et métropole en pleine expansion, les CGP accompagnent une clientèle
                    sophistiquée : propriétaires de vignobles, négociants en vin, cadres supérieurs et entrepreneurs. Ultron s'adapte à cette richesse patrimoniale unique.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scaleIn" delay={0.2}>
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                  <div
                    className="absolute -inset-6 rounded-2xl opacity-15 blur-3xl pointer-events-none"
                    style={{ backgroundColor: '#7c2d12' }}
                  />
                  <div style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
                    <img
                      src="/images/mockup-bordeaux-cgp.jpg"
                      alt="Interface Ultron CRM pour CGP bordelais"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Bordeaux Context Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 24 }}>
                    Bordeaux : excellence patrimoniale et innovation
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 40 }}>
                    Bordeaux concentre tradition viticole et modernité économique. Avec ses grands crus, ses quartiers d'affaires
                    en expansion (Euratlantique, Bacalan) et son écosystème startup dynamique, la métropole bordelaise attire
                    une clientèle fortunée aux besoins patrimoniaux complexes et sophistiqués.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#7c2d12', marginBottom: 8 }}>1.2M</div>
                      <div style={{ color: 'var(--text-gray)' }}>Habitants métropole</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#7c2d12', marginBottom: 8 }}>9000</div>
                      <div style={{ color: 'var(--text-gray)' }}>Domaines viticoles</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#7c2d12', marginBottom: 8 }}>65k€</div>
                      <div style={{ color: 'var(--text-gray)' }}>Revenu médian/habitant</div>
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
                    Les atouts des CGP bordelais
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Entre patrimoine viticole traditionnel et nouvelle économie numérique, Bordeaux offre aux CGP
                    un terrain de prospection exceptionnel avec des opportunités d'accompagnement patrimonial uniques en France.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#92400e15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#92400e">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Patrimoine viticole</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Propriétaires de vignobles, châteaux et maisons de négoce constituent une clientèle premium
                          avec des besoins complexes en transmission et optimisation fiscale.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#059669615', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#059669">
                          <path d="M11.83 4l2.58 2.58L12.5 8.5l-1.5-1.5-1.67 1.67 3.67 3.67 3-3 .67.67 1.08-1.08L21 5.17 19.83 4 18 5.83 16.17 4 15 5.17l1.83 1.83L15 8.83l-2.17-2.17L11.83 4zm-1.66 8.66L8.5 11 7 12.5l2.67 2.67 5.66-5.66L14.5 8.67 10.17 12.66z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Ecosystem innovation</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Startups de la French Tech Bordeaux, scale-ups du numérique et dirigeants d'entreprises
                          technologiques avec des profils patrimoniaux en forte évolution.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#7c2d1215', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#7c2d12">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Cadres supérieurs</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Managers de multinationales, cadres dirigeants et professions libérales bénéficiant
                          du dynamisme économique bordelais et de la qualité de vie régionale.
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
                    Ultron : sophistication bordelaise
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Des châteaux de Saint-Émilion aux bureaux d'Euratlantique, Ultron s'adapte à la diversité
                    et à la sophistication de votre clientèle bordelaise et néo-aquitaine.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Qualification IA spécialisée secteur viticole</span>
                      <span style={{ color: '#7c2d12', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Templates transmission familiale et succession</span>
                      <span style={{ color: '#7c2d12', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Lead Finder propriétaires fonciers et vignobles</span>
                      <span style={{ color: '#7c2d12', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Calculateur défiscalisation monuments historiques</span>
                      <span style={{ color: '#7c2d12', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Veille réglementaire viticole et agricole</span>
                      <span style={{ color: '#7c2d12', flexShrink: 0 }}>
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
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="#7c2d12" opacity="0.3">
                        <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
                      </svg>
                    </div>
                    <blockquote style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6 }}>
                      "Nos clients viticoles ont des besoins patrimoniaux très spécifiques. Avec Ultron, nous gérons efficacement
                      la complexité de leurs dossiers tout en prospectant les nouveaux entrepreneurs de la métropole bordelaise."
                    </blockquote>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Antoine Dufour</div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Partner, Cabinet Aquitaine Patrimoine - Bordeaux Centre</div>
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
                    Excellence et confidentialité
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    À l'image de l'excellence bordelaise, Ultron garantit le plus haut niveau de sécurité et de confidentialité
                    pour la gestion de patrimoines prestigieux et sensibles.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Confidentialité bancaire</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Chiffrement premium</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Backup multi-sites</span>
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
                <h2>Rejoignez les cabinets CGP de Bordeaux sur Ultron</h2>
                <p>Découvrez comment Ultron peut révéler le potentiel de vos prospects bordelais. Essai gratuit 14 jours sans engagement.</p>
                <Link href="/register" className="btnPrimary">
                  Essai Gratuit 14 jours
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ✓ Expertise viticole • ✓ Accompagnement premium • ✓ Formation spécialisée
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