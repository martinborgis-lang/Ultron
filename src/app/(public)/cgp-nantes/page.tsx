import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: "CRM CGP Nantes — Ultron, le CRM IA des Conseillers en Patrimoine",
  description: "Ultron, le CRM spécialisé pour les CGP de Nantes. Qualification IA, agent vocal, pipeline intelligent. Essai gratuit 14 jours.",
  keywords: [
    "CRM CGP Nantes",
    "logiciel CGP Nantes",
    "conseiller patrimoine Nantes",
    "gestion patrimoine Nantes",
    "CRM IA Nantes",
    "logiciel gestion patrimoine Pays de la Loire",
    "CRM conseillers financiers Loire-Atlantique",
    "automation CGP Nantes"
  ],
  openGraph: {
    title: "CRM CGP Nantes — Ultron CRM IA",
    description: "Le CRM spécialisé pour les Conseillers en Gestion de Patrimoine de Nantes et Pays de la Loire",
    url: "https://ultron-ai.pro/cgp-nantes",
    type: "website",
    locale: "fr_FR"
  },
  alternates: {
    canonical: "https://ultron-ai.pro/cgp-nantes"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "LocalBusiness"],
  "name": "Ultron CRM Nantes",
  "description": "CRM IA spécialisé pour CGP à Nantes",
  "url": "https://ultron-ai.pro/cgp-nantes",
  "areaServed": {
    "@type": "City",
    "name": "Nantes",
    "addressRegion": "Pays de la Loire",
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

export default function CGPNantesPage() {
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
                background: 'radial-gradient(ellipse at 50% 30%, #059669, transparent 70%)',
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
                      backgroundColor: '#05966915',
                      color: '#059669',
                      border: '1px solid #05966930',
                      marginBottom: 20,
                    }}
                  >
                    CRM CGP Nantes
                  </span>
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                    Ultron CRM — CRM IA pour CGP à Nantes
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#059669', fontWeight: 500, marginBottom: 12 }}>
                    Le CRM qui navigue avec les entrepreneurs de l'Ouest
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                    À Nantes, métropole dynamique de l'Ouest français et porte d'entrée vers l'Atlantique, les CGP accompagnent
                    dirigeants du secteur naval, entrepreneurs créatifs et cadres de l'agroalimentaire. Ultron s'adapte à cette diversité maritime et industrielle.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scaleIn" delay={0.2}>
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                  <div
                    className="absolute -inset-6 rounded-2xl opacity-15 blur-3xl pointer-events-none"
                    style={{ backgroundColor: '#059669' }}
                  />
                  <div style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
                    <img
                      src="/images/mockup-nantes-cgp.jpg"
                      alt="Interface Ultron CRM pour CGP nantais"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Nantes Context Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 24 }}>
                    Nantes : entrepreneuriat et tradition maritime
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 40 }}>
                    Nantes conjugue héritage maritime et innovation moderne. Avec ses leaders de l'industrie navale (STX, Naval Group),
                    son écosystème startup dynamique et ses entreprises agroalimentaires d'envergure, la métropole nantaise offre
                    aux CGP une clientèle diversifiée aux besoins patrimoniaux variés et en forte croissance.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>950k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Habitants métropole</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>18k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Entreprises créées/an</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>25%</div>
                      <div style={{ color: 'var(--text-gray)' }}>Croissance digital</div>
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
                    Les atouts des CGP nantais
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Dans l'écosystème nantais, les CGP profitent d'un tissu économique riche et varié,
                    alliant tradition industrielle et innovation technologique, offrant des opportunités uniques d'accompagnement patrimonial.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#1e40af15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1e40af">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Industrie navale</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Dirigeants et cadres supérieurs des Chantiers de l'Atlantique, Naval Group et de l'écosystème
                          naval avec des rémunérations attractives et des besoins en optimisation patrimoniale.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#16a34a15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#16a34a">
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Créativité et innovation</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Entrepreneurs du numérique, créateurs des industries créatives et dirigeants
                          de startups avec des profils patrimoniaux dynamiques et évolutifs.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#dc262615', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#dc2626">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Agroalimentaire</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Dirigeants d'entreprises agroalimentaires de l'Ouest, exploitants agricoles prospères
                          et acteurs de la transformation alimentaire avec des patrimoines familiaux importants.
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
                    Ultron : cap vers le succès nantais
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Des quais de Loire aux zones d'activité de Carquefou, Ultron vous accompagne dans la navigation
                    complexe du marché patrimonial nantais et ligérien.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Qualification IA secteurs naval et agroalimentaire</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Templates transmission entreprises familiales</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Lead Finder entrepreneurs créatifs et innovants</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Calculateurs défiscalisation agricole et forestière</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Veille réglementaire maritime et agro</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
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
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="#059669" opacity="0.3">
                        <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
                      </svg>
                    </div>
                    <blockquote style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6 }}>
                      "Entre nos clients dirigeants des Chantiers de l'Atlantique et les entrepreneurs de la French Tech Nantes,
                      Ultron nous aide à naviguer efficacement dans cette diversité avec des outils adaptés à chaque profil."
                    </blockquote>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Catherine Moreau</div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Directrice Patrimoine, Cabinet Loire Conseil - Nantes Centre</div>
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
                    Robustesse et innovation
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    À l'image de la solidité maritime nantaise, Ultron garantit la sécurité de vos données
                    tout en vous apportant les innovations les plus récentes pour optimiser vos performances.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Hébergement sécurisé France</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Conformité RGPD totale</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Updates automatiques</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Support régional Ouest</span>
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
                <h2>Rejoignez les cabinets CGP de Nantes sur Ultron</h2>
                <p>Naviguez vers le succès avec Ultron. Testez gratuitement pendant 14 jours notre CRM adapté aux spécificités de l'Ouest.</p>
                <Link href="/register" className="btnPrimary">
                  Essai Gratuit 14 jours
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ✓ Configuration secteurs Ouest • ✓ Formation métier • ✓ Success Manager dédié
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