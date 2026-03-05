import type { Metadata } from 'next';
import Link from 'next/link';
import AnimatedSection from '@/components/landing/AnimatedSection';
import '@/styles/landing.css';

export const metadata: Metadata = {
  title: "CRM CGP Paris — Ultron, le CRM IA des Conseillers en Patrimoine",
  description: "Ultron, le CRM spécialisé pour les CGP de Paris. Qualification IA, agent vocal, pipeline intelligent. Essai gratuit 14 jours.",
  keywords: [
    "CRM CGP Paris",
    "logiciel CGP Paris",
    "conseiller patrimoine Paris",
    "gestion patrimoine Paris",
    "CRM IA Paris",
    "logiciel gestion patrimoine Paris",
    "CRM conseillers financiers Paris",
    "automation CGP Paris"
  ],
  openGraph: {
    title: "CRM CGP Paris — Ultron CRM IA",
    description: "Le CRM spécialisé pour les Conseillers en Gestion de Patrimoine de Paris et Île-de-France",
    url: "https://ultron-ai.pro/cgp-paris",
    type: "website",
    locale: "fr_FR"
  },
  alternates: {
    canonical: "https://ultron-ai.pro/cgp-paris"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": ["SoftwareApplication", "LocalBusiness"],
  "name": "Ultron CRM Paris",
  "description": "CRM IA spécialisé pour CGP à Paris",
  "url": "https://ultron-ai.pro/cgp-paris",
  "areaServed": {
    "@type": "City",
    "name": "Paris",
    "addressRegion": "Île-de-France",
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

export default function CGPParisPage() {
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
                background: 'radial-gradient(ellipse at 50% 30%, #3b82f6, transparent 70%)',
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
                      backgroundColor: '#3b82f615',
                      color: '#3b82f6',
                      border: '1px solid #3b82f630',
                      marginBottom: 20,
                    }}
                  >
                    CRM CGP Paris
                  </span>
                  <h1 style={{ fontSize: '3rem', fontWeight: 700, lineHeight: 1.15, marginBottom: 16, letterSpacing: '-0.03em' }}>
                    Ultron CRM — CRM IA pour CGP à Paris
                  </h1>
                  <p style={{ fontSize: '1.25rem', color: '#3b82f6', fontWeight: 500, marginBottom: 12 }}>
                    Le CRM intelligent qui accompagne les conseillers en patrimoine parisiens
                  </p>
                  <p style={{ fontSize: '1rem', color: 'var(--text-gray)', lineHeight: 1.7, maxWidth: 600, margin: '0 auto' }}>
                    À Paris, où la concurrence entre CGP est intense et la clientèle exigeante, Ultron vous donne l'avantage technologique pour prospérer dans la capitale française.
                  </p>
                </div>
              </AnimatedSection>

              <AnimatedSection animation="scaleIn" delay={0.2}>
                <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
                  <div
                    className="absolute -inset-6 rounded-2xl opacity-15 blur-3xl pointer-events-none"
                    style={{ backgroundColor: '#3b82f6' }}
                  />
                  <div style={{ position: 'relative', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 16, padding: 40 }}>
                    <img
                      src="/images/mockup-paris-cgp.jpg"
                      alt="Interface Ultron CRM pour CGP parisiens"
                      style={{ width: '100%', borderRadius: 8 }}
                    />
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </section>

          {/* Paris Context Section */}
          <section style={{ padding: '80px 0', backgroundColor: 'var(--bg-secondary)' }}>
            <div className="container">
              <AnimatedSection>
                <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: 600, marginBottom: 24 }}>
                    Paris : capitale du patrimoine français
                  </h2>
                  <p style={{ fontSize: '1.1rem', color: 'var(--text-gray)', lineHeight: 1.8, marginBottom: 40 }}>
                    Paris concentre 40% des sièges sociaux français et abrite plus de 2 millions d'actifs aux revenus supérieurs à la moyenne nationale.
                    Avec La Défense comme quartier d'affaires européen de premier plan et des arrondissements comme le 7ème, 8ème et 16ème
                    regroupant une clientèle fortunée, la capitale offre un terrain de prospection exceptionnel pour les CGP.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 24 }}>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>2M+</div>
                      <div style={{ color: 'var(--text-gray)' }}>Cadres et dirigeants</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>40%</div>
                      <div style={{ color: 'var(--text-gray)' }}>Sièges sociaux français</div>
                    </div>
                    <div style={{ textAlign: 'center', padding: 20 }}>
                      <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#3b82f6', marginBottom: 8 }}>180k</div>
                      <div style={{ color: 'var(--text-gray)' }}>Entreprises du 92</div>
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
                    Les défis des CGP à Paris
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Dans un marché parisien saturé où chaque prospect reçoit plusieurs sollicitations par semaine,
                    les CGP font face à des défis spécifiques qui nécessitent des outils technologiques avancés.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#ef444415', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#ef4444">
                          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Concurrence intense</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Plus de 3000 CGP exercent en Île-de-France. Se démarquer nécessite une approche commerciale
                          ultra-professionnelle et une réactivité exemplaire.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#f59e0b15', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#f59e0b">
                          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Clientèle exigeante</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Les cadres parisiens attendent un service premium, une disponibilité optimale et une expertise
                          pointue sur les dernières opportunités fiscales.
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                      <div style={{ backgroundColor: '#8b5cf615', padding: 12, borderRadius: 8, flexShrink: 0 }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="#8b5cf6">
                          <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z"/>
                        </svg>
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-primary)' }}>Rythme effréné</h4>
                        <p style={{ color: 'var(--text-gray)', lineHeight: 1.6 }}>
                          Entre La Défense, les 8ème et 16ème arrondissements, gérer un portefeuille client parisien
                          demande une organisation millimétrée et des outils performants.
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
                    Ultron : votre avantage technologique à Paris
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Conçu spécifiquement pour les contraintes du marché parisien, Ultron vous permet de traiter plus de prospects,
                    avec plus de précision, et de convertir mieux que vos concurrents.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Qualification IA instantanée des prospects La Défense</span>
                      <span style={{ color: '#3b82f6', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Agent vocal IA pour appels à haut volume</span>
                      <span style={{ color: '#3b82f6', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Pipeline intelligent adapté aux cycles Paris/Banlieue</span>
                      <span style={{ color: '#3b82f6', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Intégration Google Calendar pour RDV express</span>
                      <span style={{ color: '#3b82f6', flexShrink: 0 }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                        </svg>
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end' }}>
                      <span style={{ color: 'var(--text-gray)' }}>Analytics de performance en temps réel</span>
                      <span style={{ color: '#3b82f6', flexShrink: 0 }}>
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
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="#3b82f6" opacity="0.3">
                        <path d="M14,17H17L19,13V7H13V13H16M6,17H9L11,13V7H5V13H8L6,17Z" />
                      </svg>
                    </div>
                    <blockquote style={{ fontSize: '1.25rem', fontStyle: 'italic', marginBottom: 24, lineHeight: 1.6 }}>
                      "Depuis que nous utilisons Ultron dans notre cabinet du 8ème, nous traitons 40% de prospects en plus
                      avec la même équipe. L'IA qualifie parfaitement nos leads de La Défense et nous fait gagner 3h par jour."
                    </blockquote>
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Marie Dubois</div>
                      <div style={{ color: 'var(--text-gray)', fontSize: '0.9rem' }}>Directrice Associée, Cabinet Patrimoine & Stratégies Paris 8ème</div>
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
                    Conformité réglementaire française
                  </h3>
                  <p style={{ color: 'var(--text-gray)', marginBottom: 32, lineHeight: 1.7, fontSize: '1.1rem' }}>
                    Ultron respecte scrupuleusement les exigences RGPD et les réglementations françaises applicables
                    aux conseillers en gestion de patrimoine. Vos données clients sont hébergées en France et sécurisées.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Hébergement France</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Conformité RGPD</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Chiffrement AES-256</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: 'var(--bg-primary)', padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: '#22c55e' }}>✓</span>
                      <span style={{ fontSize: '0.9rem' }}>Audit de sécurité</span>
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
                <h2>Rejoignez les cabinets CGP de Paris sur Ultron</h2>
                <p>Démarrez votre essai gratuit de 14 jours et découvrez pourquoi les CGP parisiens choisissent Ultron pour booster leurs performances commerciales.</p>
                <Link href="/register" className="btnPrimary">
                  Essai Gratuit 14 jours
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <div style={{ marginTop: 16, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ✓ Sans engagement • ✓ Support français • ✓ Formation incluse
                </div>
                <div style={{ marginTop: 20, padding: 16, backgroundColor: '#f8fafc', borderRadius: 8, textAlign: 'left' }}>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-gray)', marginBottom: 12 }}>Comparez Ultron avec d'autres solutions :</p>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <Link href="/ultron-vs-salesforce" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
                      Ultron vs Salesforce Financial Services
                    </Link>
                    <Link href="/ultron-vs-hubspot" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
                      Ultron vs HubSpot CRM
                    </Link>
                    <Link href="/alternatives-crm-cgp" style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
                      Toutes les alternatives CRM CGP
                    </Link>
                  </div>
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