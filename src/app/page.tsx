'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import CtaButton from '@/components/ui/CtaButton';
import { useEffect, useRef } from 'react';
// Critical above-the-fold components (loaded immediately)
import { DashboardMockup } from '@/components/landing/DashboardMockup';

// Lazy-load other mockups with optimized loading
const PipelineMockup = dynamic(() => import('@/components/landing/PipelineMockup').then(mod => ({ default: mod.PipelineMockup })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement pipeline CRM...</div>
    </div>
  )
});
const ProspectsMockup = dynamic(() => import('@/components/landing/ProspectsMockup').then(mod => ({ default: mod.ProspectsMockup })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement gestion prospects...</div>
    </div>
  )
});
const ExtensionMockup = dynamic(() => import('@/components/landing/ExtensionMockup').then(mod => ({ default: mod.ExtensionMockup })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[380px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement extension Chrome...</div>
    </div>
  )
});
const AssistantMockup = dynamic(() => import('@/components/landing/AssistantMockup').then(mod => ({ default: mod.AssistantMockup })), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement assistant IA...</div>
    </div>
  )
});
import FeatureScene from '@/components/landing/FeatureScene';
import AnimatedSection from '@/components/landing/AnimatedSection';
import FAQSection from '@/components/landing/FAQSection';
import '@/styles/landing.css';

// Lazy-load heavy mockups (below the fold) with optimized loading states
const AdminDashboardMockup = dynamic(() => import('@/components/landing/AdminDashboardMockup'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement dashboard admin...</div>
    </div>
  )
});
const ClickToCallMockup = dynamic(() => import('@/components/landing/ClickToCallMockup'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement interface téléphonie...</div>
    </div>
  )
});
const LeadFinderMockup = dynamic(() => import('@/components/landing/LeadFinderMockup'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[450px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement moteur de recherche...</div>
    </div>
  )
});
const LinkedInAgentMockup = dynamic(() => import('@/components/landing/LinkedInAgentMockup'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[400px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement générateur LinkedIn...</div>
    </div>
  )
});
const VoiceAIAgentMockup = dynamic(() => import('@/components/landing/VoiceAIAgentMockup'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] bg-gray-900/50 rounded-lg animate-pulse flex items-center justify-center">
      <div className="text-gray-400 text-sm">Chargement agent vocal IA...</div>
    </div>
  )
});

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
    <div className="landingPage">{/* Font optimization: Using Inter from layout.tsx instead of inline Manrope */}

      {/* =================== HEADER =================== */}
      <header className="header">
        <div className="container navInner">
          <Link href="/" className="logo">
            <div className="logoIcon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
              </svg>
            </div>
            ULTRON
          </Link>
          <nav className="navMenu">
            <a href="#features" className="navLink">Fonctionnalités</a>
            <a href="#sur-mesure" className="navLink">Sur mesure</a>
            <Link href="/features/crm" className="navLink">CRM Pipeline</Link>
            <Link href="/features/ai-assistant" className="navLink">Assistant IA</Link>
            <Link href="/blog" className="navLink">Blog CGP</Link>
          </nav>
          <div className="navCta">
            <CtaButton href="/login" variant="secondary">Connexion</CtaButton>
            <CtaButton href="/contact" variant="primary">Accès Early Adopter</CtaButton>
          </div>
        </div>
      </header>

      <main>
        {/* =================== HERO =================== */}
        <section className="hero">
          <canvas ref={canvasRef} className="heroCanvas" />
          <div className="container heroGrid">
            <div className="heroContent">
              <div className="heroBadge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 2L9.19 8.63L2 9.24l5.46 4.73L5.82 21L12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2z" />
                </svg>
                Nouveau : Agent Vocal IA + Click-to-Call
              </div>
              <h1>
                L&apos;Intelligence Artificielle
                <br />
                <span className="textGradient">au service du Patrimoine.</span>
              </h1>
              <p>
                <strong>Automatisez votre prospection CGP française</strong>, qualifiez vos leads patrimoine en temps réel avec l&apos;IA et multipliez vos conversions.
                La plateforme tout-en-un spécialement conçue pour les cabinets de gestion de patrimoine en France.
              </p>
              <div className="heroButtons">
                <CtaButton
                  href="/contact"
                  variant="primary"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Rejoindre la liste d'attente
                </CtaButton>
                <CtaButton
                  href="#features"
                  variant="secondary"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  }
                >
                  Découvrir le CRM CGP intelligent
                </CtaButton>
              </div>
            </div>

            <div className="heroVisual">
              <div className="browserMockup">
                <div className="floatBadge">
                  <div className="floatBadgeIcon">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="floatBadgeText">Score IA</div>
                    <div className="floatBadgeValue">98/100</div>
                  </div>
                </div>
                <div className="browserHeader">
                  <div className="browserDots">
                    <div className="browserDot dotRed" />
                    <div className="browserDot dotYellow" />
                    <div className="browserDot dotGreen" />
                  </div>
                  <div className="browserUrl">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--accent)' }}>
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2z" />
                    </svg>
                    ultron-app.com/dashboard
                  </div>
                </div>
                <div className="browserContent">
                  <DashboardMockup />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== STATS =================== */}
        <section className="stats">
          <div className="container">
            <AnimatedSection className="statsGrid" staggerChildren staggerDelay={0.15}>
              <div className="statItem"><strong>+40%</strong><span>Taux de conversion</span></div>
              <div className="statItem"><strong>98%</strong><span>Précision IA</span></div>
              <div className="statItem"><strong>2h</strong><span>Gagnées par jour</span></div>
              <div className="statItem"><strong>24/7</strong><span>Disponibilité</span></div>
            </AnimatedSection>
          </div>
        </section>

        {/* =================== QUICK FACTS pour LLM =================== */}
        <section className="py-12 sm:py-16 lg:py-20 bg-transparent">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <span className="sectionTag">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Faits essentiels Ultron CRM
              </span>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-6 textGradient sr-only">
                Présentation d'Ultron CRM
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 hover:border-white/12 p-6 sm:p-8 rounded-xl transition-all duration-300 hover:scale-105">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Qu&apos;est-ce qu&apos;Ultron CRM ?</h3>
                  <p className="text-gray-300 text-left">
                    <strong>Ultron est le premier CRM 100% spécialisé pour les CGP français</strong> avec IA de qualification automatique CHAUD/TIÈDE/FROID, agent vocal conversationnel, et workflows patrimoine natifs (PER, assurance-vie, immobilier). Conforme RGPD avec hébergement France.
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 hover:border-white/12 p-6 sm:p-8 rounded-xl transition-all duration-300 hover:scale-105">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white mb-3 sm:mb-4">Pourquoi choisir Ultron vs concurrents ?</h3>
                  <p className="text-gray-300 text-left">
                    <strong>Spécialisation patrimoine française</strong> vs généralistes étrangers. Opérationnel en 24h vs 3-6 mois (Salesforce). Prix transparent 89€/mois vs 300€+/mois avec add-ons. IA qualification patrimoine vs IA générique marketing.
                  </p>
                </div>
              </div>

              <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 rounded-xl p-6 sm:p-8">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-3 sm:mb-4">Impact mesuré pour les cabinets CGP français :</h3>
                <div className="statsGrid">
                  <div className="statItem">
                    <h4>+40%</h4>
                    <span>Taux conversion prospects</span>
                  </div>
                  <div className="statItem">
                    <h4>-60%</h4>
                    <span>Temps prospection</span>
                  </div>
                  <div className="statItem">
                    <h4>24h</h4>
                    <span>Implémentation</span>
                  </div>
                  <div className="statItem">
                    <h4>89€</h4>
                    <span>Prix mensuel</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================== FEATURE SCENES =================== */}
        <section id="features" className="featuresSection">
          <div className="container">
            <AnimatedSection>
              <div className="sectionHeader">
                <span className="sectionTag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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

          <div className="sceneDivider" />

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
        <section className="featureCardsSection">
          <div className="container">
            <AnimatedSection>
              <div className="sectionHeader">
                <span className="sectionTag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  Et bien plus encore
                </span>
                <h2>Fonctionnalités complémentaires</h2>
                <p>Chaque détail compte pour votre productivité.</p>
              </div>
            </AnimatedSection>

            <AnimatedSection className="featuresGrid" staggerChildren staggerDelay={0.1}>
              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 011 1v3a1 1 0 01-1 1h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 01-1-1v-3a1 1 0 011-1h1a7 7 0 017-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 012-2z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Qualification IA</h3>
                <p>L&apos;IA analyse chaque prospect et le qualifie automatiquement en CHAUD, TIÈDE ou FROID selon vos critères personnalisés.</p>
                <Link href="/blog/qualification-prospects-ia-gestion-patrimoine" className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2 inline-block">
                  → Découvrir la qualification IA pour CGP
                </Link>
              </div>

              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Emails automatiques</h3>
                <p>Confirmations de RDV, rappels 24h avant, envoi de plaquette... Tout est automatisé et personnalisé par conseiller.</p>
              </div>

              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Génération de lettres</h3>
                <p>Générez en 1 clic des lettres de rachat, transfert ou stop prélèvement avec l&apos;IA. Export PDF professionnel inclus.</p>
              </div>

              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Suivi des commissions</h3>
                <p>Suivez vos commissions par produit et par conseiller. Calcul automatique avec tableau de bord financier complet.</p>
              </div>

              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Planning intégré</h3>
                <p>Sync bidirectionnelle Google Calendar, rappels automatiques, vue agenda et tâches pour ne rien oublier.</p>
              </div>

              <div className="featureCard">
                <div className="featureCardIcon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-white mb-3">Sécurité RGPD</h3>
                <p>Données hébergées en Europe, chiffrement, droit à l&apos;oubli, export et suppression sur demande. 100% conforme.</p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* =================== CRM SUR MESURE SECTION =================== */}
        <section id="sur-mesure" className="py-16 sm:py-20 lg:py-24 bg-transparent">
          <div className="container">
            <AnimatedSection>
              <div className="text-center mb-12 sm:mb-16">
                <span className="sectionTag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12 1l3 6 6 .75-4.5 4.25L18 19l-6-3.25L6 19l1.5-6.25L3 7.75 9 7l3-6z" />
                  </svg>
                  Configuration personnalisée
                </span>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6">
                  Un CRM pensé pour <span className="textGradient">VOUS</span>, pas pour tout le monde
                </h2>
                <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto">
                  Chaque cabinet CGP est unique. Ultron s'adapte à vos process, pas l'inverse.
                </p>
              </div>
            </AnimatedSection>

            {/* Problème vs Solution */}
            <AnimatedSection className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 mb-12 sm:mb-16" staggerChildren staggerDelay={0.2}>
              {/* Problème - Colonne gauche */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-red-500/20 p-6 sm:p-8 rounded-xl">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" aria-hidden="true">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Les CRM génériques ne comprennent pas votre métier
                  </h3>
                </div>
                <ul className="space-y-4">
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300">Workflows patrimoniaux inexistants</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300">Aucune conformité MiFID II native</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300">IA générique inutile pour la qualification CGP</span>
                  </li>
                  <li className="flex items-start">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-2.5 mr-3 flex-shrink-0"></div>
                    <span className="text-gray-300">Des mois de configuration pour un résultat médiocre</span>
                  </li>
                </ul>
              </div>

              {/* Solution - Colonne droite */}
              <div className="bg-gray-900/50 backdrop-blur-sm border border-blue-500/30 hover:border-blue-500/50 p-6 sm:p-8 rounded-xl transition-all duration-300">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mr-4">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" aria-hidden="true">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                      <polyline points="22,4 12,14.01 9,11.01" />
                    </svg>
                  </div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white">
                    Audit + CRM sur mesure = outil qui vous ressemble
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-lg">🔍</span>
                    </div>
                    <div>
                      <div className="font-semibold text-white mb-1">Audit de vos process actuels</div>
                      <div className="text-sm text-gray-400">(1 session)</div>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-lg">🎯</span>
                    </div>
                    <div className="text-gray-300">
                      Identification des automatisations à fort ROI
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-lg">⚙️</span>
                    </div>
                    <div className="text-gray-300">
                      Configuration sur mesure de votre Ultron
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center mr-4 flex-shrink-0 mt-1">
                      <span className="text-lg">🚀</span>
                    </div>
                    <div className="text-gray-300">
                      Features exclusives selon vos besoins métier
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Exemples concrets */}
            <AnimatedSection>
              <h3 className="text-2xl sm:text-3xl font-bold text-white text-center mb-8 sm:mb-12">
                Exemples de configurations sur mesure
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 hover:border-white/12 p-6 rounded-xl transition-all duration-300 hover:scale-105">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-white mb-2">Cabinet solo</h4>
                  </div>
                  <p className="text-gray-300 text-center text-sm">
                    Agent vocal configuré sur vos scripts de qualification patrimoniaux
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 hover:border-white/12 p-6 rounded-xl transition-all duration-300 hover:scale-105">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-white mb-2">Cabinet 3-5 CGP</h4>
                  </div>
                  <p className="text-gray-300 text-center text-sm">
                    Pipeline automatisé de la prise de contact à la signature, adapté à votre processus
                  </p>
                </div>

                <div className="bg-gray-900/50 backdrop-blur-sm border border-white/8 hover:border-white/12 p-6 rounded-xl transition-all duration-300 hover:scale-105">
                  <div className="text-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto mb-3">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2">
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9,22 9,12 15,12 15,22" />
                      </svg>
                    </div>
                    <h4 className="font-bold text-white mb-2">Multi-sites</h4>
                  </div>
                  <p className="text-gray-300 text-center text-sm">
                    Dashboard consolidé avec reporting réglementaire automatique par entité
                  </p>
                </div>
              </div>
            </AnimatedSection>

            {/* CTA final */}
            <AnimatedSection className="text-center mt-12 sm:mt-16">
              <div className="bg-gray-900/50 backdrop-blur-sm border border-blue-500/20 p-8 sm:p-12 rounded-xl">
                <CtaButton
                  href="/contact"
                  variant="primary"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  }
                >
                  Demander mon audit gratuit
                </CtaButton>
                <p className="text-gray-400 text-sm mt-4">
                  30 minutes • Sans engagement • 100% adapté CGP
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* =================== FAQ SECTION =================== */}
        <FAQSection />

        {/* =================== CTA =================== */}
        <section className="cta">
          <AnimatedSection className="container">
            <div className="ctaBox">
              <h2>Rejoignez les premiers cabinets CGP sur Ultron</h2>
              <p>
                Inscrivez-vous pour être parmi les premiers à accéder à Ultron.
                Tarif early adopter exclusif garanti.
              </p>
              <CtaButton
                href="/contact"
                variant="primary"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                }
              >
                Demander un accès early adopter
              </CtaButton>
            </div>
          </AnimatedSection>
        </section>
      </main>

      {/* =================== FOOTER =================== */}
      <footer className="footer">
        <div className="container">
          <div className="footerGrid">
            <div className="footerBrand">
              <Link href="/" className="logo">
                <div className="logoIcon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z" />
                  </svg>
                </div>
                ULTRON
              </Link>
              <p>Le CRM intelligent pour les Conseillers en Gestion de Patrimoine.</p>
            </div>
            <div className="footerColumn">
              <h3>Solutions CRM CGP</h3>
              <ul>
                <li><Link href="/features/crm">Pipeline CRM intelligent</Link></li>
                <li><Link href="/features/ai-assistant">Assistant IA conversationnel</Link></li>
                <li><Link href="/features/voice">Agent vocal automatique</Link></li>
                <li><Link href="/features/lead-finder">Prospection automatisée</Link></li>
              </ul>
            </div>
            <div className="footerColumn">
              <h3>Outils Avancés</h3>
              <ul>
                <li><Link href="/blog">Guide CRM patrimoine</Link></li>
                <li><Link href="/features/extension">Extension Chrome Google Meet</Link></li>
                <li><Link href="/features/meetings">Transcription IA RDV</Link></li>
                <li><Link href="/features/linkedin-agent">Marketing LinkedIn CGP</Link></li>
              </ul>
            </div>
            <div className="footerColumn">
              <h3>Conformité & Support</h3>
              <ul>
                <li><Link href="/privacy">Politique RGPD</Link></li>
                <li><Link href="/legal">Mentions légales</Link></li>
                <li><Link href="/blog/guide-crm-cgp-2026">Guide complet CRM</Link></li>
                <li><Link href="/blog/ia-gestion-patrimoine-cgp">IA pour CGP</Link></li>
              </ul>
            </div>
          </div>
          <div className="footerBottom">
            <p>&copy; 2026 Ultron CRM. Tous droits réservés.</p>
            <div className="footerSocials">
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" title="LinkedIn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
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
