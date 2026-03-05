import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: "CRM CGP Rennes — Ultron, le CRM IA des Conseillers en Patrimoine",
  description: "Ultron, le CRM spécialisé pour les CGP de Rennes. Qualification IA, agent vocal, pipeline intelligent. Essai gratuit 14 jours.",
  keywords: [
    "CRM CGP Rennes",
    "logiciel CGP Rennes",
    "conseiller patrimoine Rennes",
    "gestion patrimoine Rennes",
    "CRM IA Rennes",
    "logiciel gestion patrimoine Bretagne",
    "CRM conseillers financiers Ille-et-Vilaine",
    "automation CGP Rennes"
  ],
  openGraph: {
    title: "CRM CGP Rennes — Ultron CRM IA",
    description: "Le CRM spécialisé pour les Conseillers en Gestion de Patrimoine de Rennes et Bretagne",
    url: "https://ultron-ai.pro/cgp-rennes",
    type: "website",
    locale: "fr_FR"
  },
  alternates: {
    canonical: "https://ultron-ai.pro/cgp-rennes"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "LocalBusiness"],
  "name": "Ultron CRM Rennes",
  "description": "CRM IA spécialisé pour CGP à Rennes",
  "url": "https://ultron-ai.pro/cgp-rennes",
  "areaServed": {
    "@type": "City",
    "name": "Rennes",
    "addressRegion": "Bretagne",
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

export default function CGPRennesPage() {
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
                    CRM CGP Rennes
                  </span>
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                    Ultron CRM — CRM IA pour CGP à Rennes
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#059669', fontWeight: 500, marginBottom: 12 }}>
                    Le CRM qui cultive l'innovation bretonne
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                    À Rennes, capitale bretonne et métropole technologique en pleine expansion, les CGP accompagnent
                    jeunes cadres de la tech, dirigeants d'entreprises innovantes et universitaires prospères.
                    Ultron s'adapte à ce dynamisme jeune et entrepreneurial.
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
                      src="/images/mockup-rennes-cgp.jpg"
                      alt="Interface Ultron CRM pour CGP rennais"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Rennes Context Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 24 }}>
                    Rennes : jeunesse et innovation bretonne
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 40 }}>
                    Rennes cultive un écosystème unique alliant tradition universitaire et innovation technologique.
                    Avec plus de 65 000 étudiants, un tissu startup dynamique et des entreprises tech en croissance,
                    la métropole rennaise attire une nouvelle génération de professionnels aux besoins patrimoniaux émergents.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>750k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Habitants métropole</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>65k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Étudiants</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#059669', marginBottom: 8 }}>35%</div>
                      <div style={{ color: 'var(--text-gray)' }}>Population &lt;35 ans</div>
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
                    Les atouts des CGP rennais
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Dans l'écosystème rennais, les CGP accompagnent une clientèle jeune et dynamique en construction patrimoniale,
                    offrant des opportunités d'accompagnement sur le long terme et de fidélisation précoce.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#1e40af15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#1e40af">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Jeunes cadres tech</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Ingénieurs, développeurs et managers de startups et scale-ups rennaises
                          avec des revenus en progression et des besoins de structuration patrimoniale précoce.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#16a34a15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#16a34a">
                          <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Entrepreneurs innovants</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Fondateurs de startups, dirigeants de PME innovantes et créateurs d'entreprises
                          avec des besoins d'optimisation fiscale et de protection patrimoniale.
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
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Universitaires et chercheurs</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Professeurs, chercheurs et cadres de l'enseignement supérieur
                          avec des revenus stables et des besoins spécifiques en préparation retraite.
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
                    Ultron : innovation rennaise
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Du quartier de la Gare aux zones d'activité de Cesson-Sévigné, Ultron s'adapte
                    à la culture d'innovation rennaise et accompagne cette génération connectée.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>UX design moderne et intuitive</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Qualification IA adaptée profils jeunes cadres</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Templates PEA et épargne jeunes actifs</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Simulateurs retraite fonction publique</span>
                      <span style={{ color: '#059669', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>API intégration fintechs bretonnes</span>
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
                      "Notre clientèle rennaise, jeune et connectée, apprécie l'innovation d'Ultron. L'outil nous aide
                      à accompagner cette génération dans sa structuration patrimoniale avec un langage qu'elle comprend."
                    </blockquote>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Thomas Le Gall</div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Conseiller Patrimonial, Cabinet Bretagne Avenir - Rennes Centre</div>
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
                    Innovation et conformité
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Ultron allie l'agilité technologique bretonne aux exigences réglementaires les plus strictes,
                    garantissant innovation et conformité pour accompagner vos clients en toute sécurité.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>DevOps sécurisé</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Agilité continue</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>API modernes</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Support agile 24/7</span>
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
                <h2>Rejoignez les cabinets CGP de Rennes sur Ultron</h2>
                <p>Innovez avec votre portefeuille client rennais. Essai gratuit 14 jours avec onboarding tech personnalisé.</p>
                <Link href="/register" className="btnPrimary">
                  Essai Gratuit 14 jours
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ✓ Setup technique agile • ✓ Formation innovation • ✓ Support startup-friendly
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