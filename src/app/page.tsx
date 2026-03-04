'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { DashboardMockup } from '@/components/landing/DashboardMockup';
import { PipelineMockup } from '@/components/landing/PipelineMockup';
import { ProspectsMockup } from '@/components/landing/ProspectsMockup';
import { ExtensionMockup } from '@/components/landing/ExtensionMockup';
import { AssistantMockup } from '@/components/landing/AssistantMockup';
import FeatureScene from '@/components/landing/FeatureScene';
import AnimatedSection from '@/components/landing/AnimatedSection';
import styles from '@/styles/landing.module.css';

// Lazy-load heavy mockups (below the fold)
const AdminDashboardMockup = dynamic(() => import('@/components/landing/AdminDashboardMockup'), { ssr: false });
const ClickToCallMockup = dynamic(() => import('@/components/landing/ClickToCallMockup'), { ssr: false });
const LeadFinderMockup = dynamic(() => import('@/components/landing/LeadFinderMockup'), { ssr: false });
const LinkedInAgentMockup = dynamic(() => import('@/components/landing/LinkedInAgentMockup'), { ssr: false });
const VoiceAIAgentMockup = dynamic(() => import('@/components/landing/VoiceAIAgentMockup'), { ssr: false });

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let particles: Array<{ x: number; y: number; vx: number; vy: number; size: number }> = [];
    let animationId: number;

    const isMobile = window.innerWidth < 768;
    const particleCount = isMobile ? 35 : 80;

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const initParticles = () => {
      particles = [];
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.4,
          vy: (Math.random() - 0.5) * 0.4,
          size: Math.random() * 2 + 1,
        });
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.8)');
        gradient.addColorStop(0.5, 'rgba(6, 182, 212, 0.4)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(59, 130, 246, 0.9)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p.x - p2.x, p.y - p2.y);
          if (dist < 150) {
            const opacity = 0.3 * (1 - dist / 150);
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        }
      });

      animationId = requestAnimationFrame(animate);
    };

    window.addEventListener('resize', resize);
    resize();
    initParticles();
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className={styles.landingPage}>
      <link
        href="https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />

      {/* =================== HEADER =================== */}
      <header className={styles.header}>
        <div className={`${styles.container} ${styles.navInner}`}>
          <Link href="/" className={styles.logo}>
            <div className={styles.logoIcon}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
              </svg>
            </div>
            ULTRON
          </Link>
          <nav className={styles.navMenu}>
            <a href="#features" className={styles.navLink}>Fonctionnalités</a>
            <Link href="/features/crm" className={styles.navLink}>CRM</Link>
            <Link href="/features/ai-assistant" className={styles.navLink}>IA</Link>
            <Link href="/blog" className={styles.navLink}>Blog</Link>
          </nav>
          <div className={styles.navCta}>
            <Link href="/login" className={styles.btnGlass}>Connexion</Link>
            <Link href="/register" className={styles.btnPrimary}>Essai Gratuit</Link>
          </div>
        </div>
      </header>

      <main>
        {/* =================== HERO =================== */}
        <section className={styles.hero}>
          <canvas ref={canvasRef} className={styles.heroCanvas} />
          <div className={`${styles.container} ${styles.heroGrid}`}>
            <div className={styles.heroContent}>
              <div className={styles.heroBadge}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                </svg>
                Nouveau : Agent Vocal IA + Click-to-Call
              </div>
              <h1>
                L&apos;Intelligence Artificielle
                <br />
                <span className={styles.textGradient}>au service du Patrimoine.</span>
              </h1>
              <p>
                Automatisez votre prospection, qualifiez vos leads en temps réel et multipliez vos conversions.
                La plateforme tout-en-un conçue pour les CGP.
              </p>
              <div className={styles.heroButtons}>
                <Link href="/register" className={styles.btnPrimary}>
                  Commencer maintenant
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </Link>
                <a href="#features" className={styles.btnGlass}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  Découvrir les fonctionnalités
                </a>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <div className={styles.browserMockup}>
                <div className={styles.floatBadge}>
                  <div className={styles.floatBadgeIcon}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className={styles.floatBadgeText}>Score IA</div>
                    <div className={styles.floatBadgeValue}>98/100</div>
                  </div>
                </div>
                <div className={styles.browserHeader}>
                  <div className={styles.browserDots}>
                    <div className={`${styles.browserDot} ${styles.dotRed}`} />
                    <div className={`${styles.browserDot} ${styles.dotYellow}`} />
                    <div className={`${styles.browserDot} ${styles.dotGreen}`} />
                  </div>
                  <div className={styles.browserUrl}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}>
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                    </svg>
                    ultron-app.com/dashboard
                  </div>
                </div>
                <div className={styles.browserContent}>
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== STATS =================== */}
        <section className={styles.stats}>
          <div className={styles.container}>
            <AnimatedSection className={styles.statsGrid} staggerChildren staggerDelay={0.15}>
              <div className={styles.statItem}><h4>+40%</h4><span>Taux de conversion</span></div>
              <div className={styles.statItem}><h4>98%</h4><span>Précision IA</span></div>
              <div className={styles.statItem}><h4>2h</h4><span>Gagnées par jour</span></div>
              <div className={styles.statItem}><h4>24/7</h4><span>Disponibilité</span></div>
            </AnimatedSection>
          </div>
        </section>

        {/* =================== FEATURE SCENES =================== */}
        <section id="features" className={styles.featuresSection}>
          <div className={styles.container}>
            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zm-9 9h7v7H4v-7zm9 0h7v7h-7v-7z" />
                  </svg>
                  10 modules intégrés
                </span>
                <h2>Tout ce dont votre cabinet a besoin</h2>
                <p>Des outils puissants pour gérer vos prospects de A à Z, propulsés par l&apos;intelligence artificielle.</p>
              </div>
            </AnimatedSection>
          </div>

          {/* Scene 1: Dashboard CRM */}
          <FeatureScene
            title="Dashboard temps réel"
            subtitle="Vue d'ensemble instantanée"
            description="Visualisez vos KPIs en un coup d'œil : prospects chauds, tièdes, froids, emails envoyés et évolution sur 30 jours. Tout est mis à jour en temps réel."
            features={[
              'Statistiques et graphiques d\'évolution',
              'Activité récente par conseiller',
              'Alertes intelligentes sur seuils critiques',
              'Export automatique des rapports',
            ]}
            mockup={<DashboardMockup />}
            badge="CRM"
            accentColor="#3b82f6"
            index={0}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 2: Pipeline Kanban */}
          <FeatureScene
            title="Pipeline CRM visuel"
            subtitle="Kanban intelligent avec drag & drop"
            description="Gérez vos prospects dans un pipeline intuitif. Changez de stage en un glisser-déposer, avec actions automatiques déclenchées à chaque transition."
            features={[
              'Vue Kanban drag & drop fluide',
              'Badges de qualification IA (CHAUD/TIÈDE/FROID)',
              'Actions automatiques par stage (emails, rappels)',
              'Gestion de produits et commissions intégrée',
            ]}
            mockup={<PipelineMockup />}
            reversed
            badge="Pipeline"
            accentColor="#22c55e"
            index={1}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 3: Admin Dashboard */}
          <FeatureScene
            title="Dashboard Admin"
            subtitle="Pilotez la performance de votre équipe"
            description="Tableau de bord complet pour les dirigeants de cabinet. Suivez le CA, les conversions, la performance par conseiller et identifiez les axes d'amélioration."
            features={[
              '4 KPIs clés avec tendances en temps réel',
              'Classement performance des conseillers',
              'Funnel de conversion par étape du pipeline',
              'Alertes proactives sur seuils configurables',
            ]}
            mockup={<AdminDashboardMockup />}
            badge="Admin"
            accentColor="#f59e0b"
            index={2}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 4: Assistant IA */}
          <FeatureScene
            title="Assistant IA conversationnel"
            subtitle="Interrogez vos données en langage naturel"
            description="Posez vos questions en français : 'Combien de prospects chauds ce mois-ci ?' L'IA traduit, interroge votre base et vous répond avec des tableaux et graphiques."
            features={[
              'Requêtes en français naturel → SQL sécurisé',
              'Tableaux de résultats interactifs',
              'Analyses prédictives et insights métier',
              'Historique des conversations sauvegardé',
            ]}
            mockup={<AssistantMockup />}
            reversed
            badge="Intelligence Artificielle"
            accentColor="#8b5cf6"
            index={3}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 5: Click-to-Call */}
          <FeatureScene
            title="Click-to-Call WebRTC"
            subtitle="Appelez vos prospects directement depuis le CRM"
            description="Widget d'appel intégré alimenté par Twilio. Lancez un appel en un clic, prenez des notes en temps réel et classifiez le résultat — tout sans quitter Ultron."
            features={[
              'Appels WebRTC natifs dans le navigateur',
              'Timer en direct, mute et contrôles intégrés',
              'Notes d\'appel et classification automatique',
              'Historique complet avec durées et résultats',
            ]}
            mockup={<ClickToCallMockup />}
            badge="Téléphonie"
            accentColor="#06b6d4"
            index={4}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 6: Lead Finder */}
          <FeatureScene
            title="Moteur de recherche prospects"
            subtitle="Trouvez vos futurs clients en quelques clics"
            description="Recherchez des commerçants, professions libérales ou dirigeants d'entreprises. Données enrichies depuis Google Maps et Pappers, import direct vers votre CRM."
            features={[
              '3 catégories : commerçants, professions libérales, dirigeants',
              'Données enrichies : téléphone, email, adresse, SIREN',
              'Score de qualité et validation automatique',
              'Import en un clic vers votre pipeline CRM',
            ]}
            mockup={<LeadFinderMockup />}
            reversed
            badge="Prospection"
            accentColor="#10b981"
            index={5}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 7: LinkedIn Agent */}
          <FeatureScene
            title="Générateur de posts LinkedIn"
            subtitle="Créez du contenu expert en 30 secondes"
            description="L'IA génère des posts LinkedIn professionnels basés sur l'actualité financière et le profil de votre cabinet. 8 thèmes au choix, ton personnalisable."
            features={[
              '8 thèmes spécialisés CGP (marchés, fiscalité, retraite...)',
              'Configuration complète de l\'identité cabinet',
              'Preview style LinkedIn avant publication',
              'Historique et réutilisation des posts générés',
            ]}
            mockup={<LinkedInAgentMockup />}
            badge="Marketing"
            accentColor="#0077b5"
            index={6}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 8: Agent Vocal IA */}
          <FeatureScene
            title="Agent Vocal IA"
            subtitle="Qualification automatique par téléphone"
            description="L'IA appelle vos prospects automatiquement, les qualifie en conversation naturelle et programme des RDV dans votre agenda. Alimenté par Vapi.ai."
            features={[
              'Appels automatiques sur formulaires web entrants',
              'Qualification CHAUD/TIÈDE/FROID en temps réel',
              'Transcription complète et analyse IA',
              'Prise de RDV automatique avec confirmation',
            ]}
            mockup={<VoiceAIAgentMockup />}
            reversed
            badge="Agent IA"
            accentColor="#ef4444"
            index={7}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 9: Extension Chrome */}
          <FeatureScene
            title="Extension Chrome intelligente"
            subtitle="Votre copilote pendant les appels Google Meet"
            description="Enregistrez vos RDV Google Meet et obtenez une transcription PDF complète avec analyse IA en temps réel. Questions suggérées et réponses aux objections incluses."
            features={[
              'Transcription automatique Google Meet',
              'Questions suggérées en temps réel pendant l\'appel',
              'Réponses aux objections détectées par l\'IA',
              'Export PDF complet du compte-rendu',
            ]}
            mockup={<ExtensionMockup />}
            badge="Extension"
            accentColor="#f97316"
            index={8}
          />

          <div className={styles.sceneDivider} />

          {/* Scene 10: Prospects / CRM complet */}
          <FeatureScene
            title="Gestion 360° des prospects"
            subtitle="Base de données centralisée et enrichie"
            description="Recherche avancée, filtres intelligents, scoring IA automatique. Chaque fiche prospect regroupe toutes les interactions, appels, emails et documents."
            features={[
              'Filtres avancés multi-critères avec sauvegarde',
              'Scoring IA en temps réel avec justification',
              'Vue chronologique de toutes les interactions',
              'Import CSV et enrichissement automatique',
            ]}
            mockup={<ProspectsMockup />}
            reversed
            badge="CRM"
            accentColor="#6366f1"
            index={9}
          />
        </section>

        {/* =================== ADDITIONAL FEATURES CARDS =================== */}
        <section className={styles.featureCardsSection}>
          <div className={styles.container}>
            <AnimatedSection>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionTag}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Et bien plus encore
                </span>
                <h2>Fonctionnalités complémentaires</h2>
                <p>Chaque détail compte pour votre productivité.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection className={styles.featuresGrid} staggerChildren staggerDelay={0.1}>
              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                  </svg>
                </div>
                <h4>Qualification IA</h4>
                <p>L&apos;IA analyse chaque prospect et le qualifie automatiquement en CHAUD, TIÈDE ou FROID selon vos critères personnalisés.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h4>Emails automatiques</h4>
                <p>Confirmations de RDV, rappels 24h avant, envoi de plaquette... Tout est automatisé et personnalisé par conseiller.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h4>Génération de lettres</h4>
                <p>Générez en 1 clic des lettres de rachat, transfert ou stop prélèvement avec l&apos;IA. Export PDF professionnel inclus.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h4>Suivi des commissions</h4>
                <p>Suivez vos commissions par produit et par conseiller. Calcul automatique avec tableau de bord financier complet.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h4>Planning intégré</h4>
                <p>Sync bidirectionnelle Google Calendar, rappels automatiques, vue agenda et tâches pour ne rien oublier.</p>
              </div>

              <div className={styles.featureCard}>
                <div className={styles.featureCardIcon}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h4>Sécurité RGPD</h4>
                <p>Données hébergées en Europe, chiffrement, droit à l&apos;oubli, export et suppression sur demande. 100% conforme.</p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* =================== CTA =================== */}
        <section className={styles.cta}>
          <AnimatedSection className={styles.container}>
            <div className={styles.ctaBox}>
              <h2>Prêt à transformer votre cabinet ?</h2>
              <p>
                Rejoignez les CGP qui gagnent du temps chaque jour avec Ultron.
                Essai gratuit de 14 jours, sans engagement.
              </p>
              <Link href="/register" className={styles.btnPrimary}>
                Accéder à la plateforme
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* =================== FOOTER =================== */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerGrid}>
            <div className={styles.footerBrand}>
              <Link href="/" className={styles.logo}>
                <div className={styles.logoIcon}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
                  </svg>
                </div>
                ULTRON
              </Link>
              <p>Le CRM intelligent pour les Conseillers en Gestion de Patrimoine.</p>
            </div>
            <div className={styles.footerColumn}>
              <h4>Produit</h4>
              <ul>
                <li><Link href="/features/crm">CRM Pipeline</Link></li>
                <li><Link href="/features/ai-assistant">Assistant IA</Link></li>
                <li><Link href="/features/voice">Agent Vocal</Link></li>
                <li><Link href="/features/lead-finder">Lead Finder</Link></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Ressources</h4>
              <ul>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/features/extension">Extension Chrome</Link></li>
                <li><Link href="/features/meetings">Transcription IA</Link></li>
                <li><Link href="/features/linkedin-agent">LinkedIn Agent</Link></li>
              </ul>
            </div>
            <div className={styles.footerColumn}>
              <h4>Légal</h4>
              <ul>
                <li><Link href="/privacy">Confidentialité</Link></li>
                <li><Link href="/legal">Mentions légales</Link></li>
              </ul>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; 2026 Ultron CRM. Tous droits réservés.</p>
            <div className={styles.footerSocials}>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
