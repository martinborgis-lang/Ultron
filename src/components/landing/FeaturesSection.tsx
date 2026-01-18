'use client';

import { useEffect, useRef } from 'react';
import { Brain, Mail, BarChart3 } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const features = [
  {
    icon: Brain,
    title: 'Qualification intelligente',
    description:
      "Notre IA analyse chaque prospect et attribue un score de 0 a 100 base sur leur potentiel de conversion. Fini le temps perdu sur des leads froids.",
    color: 'indigo',
    delay: 0,
  },
  {
    icon: Mail,
    title: 'Emails personnalises',
    description:
      'Generez des emails sur mesure pour chaque prospect. Plaquettes, relances, syntheses de RDV... tout est automatise et personnalise.',
    color: 'green',
    delay: 0.1,
  },
  {
    icon: BarChart3,
    title: 'Dashboard en temps reel',
    description:
      'Suivez vos KPIs, vos taux de conversion et la performance de votre equipe dans un tableau de bord clair et actionnable.',
    color: 'amber',
    delay: 0.2,
  },
];

const colorClasses: Record<string, { bg: string; text: string; glow: string }> = {
  indigo: {
    bg: 'bg-indigo-500/20',
    text: 'text-indigo-400',
    glow: 'shadow-indigo-500/20',
  },
  green: {
    bg: 'bg-green-500/20',
    text: 'text-green-400',
    glow: 'shadow-green-500/20',
  },
  amber: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/20',
  },
};

function FeatureCard({
  icon: Icon,
  title,
  description,
  color,
  index,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = colorClasses[color];

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !cardRef.current) return;

    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(cardRef.current, {
        opacity: 0,
        y: 60,
        scale: 0.95,
      });

      // Scroll-triggered animation
      gsap.to(cardRef.current, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });

      // Parallax effect on scroll
      gsap.to(cardRef.current, {
        y: -20 - index * 10,
        scrollTrigger: {
          trigger: cardRef.current,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1,
        },
      });
    }, cardRef);

    return () => ctx.revert();
  }, [index]);

  return (
    <div
      ref={cardRef}
      className={`group relative p-8 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 hover:border-white/20 transition-all duration-500 hover:shadow-2xl ${colors.glow}`}
    >
      {/* Glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      {/* Icon */}
      <div
        className={`relative w-14 h-14 rounded-xl ${colors.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
      >
        <Icon className={`w-7 h-7 ${colors.text}`} />
      </div>

      {/* Content */}
      <h3 className="relative text-xl font-semibold text-white mb-3">{title}</h3>
      <p className="relative text-white/60 leading-relaxed">{description}</p>

      {/* Animated border gradient */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-${color}-500/20 via-transparent to-${color}-500/20`}
          style={{
            maskImage: 'linear-gradient(black, black) content-box, linear-gradient(black, black)',
            maskComposite: 'exclude',
            WebkitMaskImage:
              'linear-gradient(black, black) content-box, linear-gradient(black, black)',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      </div>
    </div>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !titleRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(titleRef.current, { opacity: 0, y: 40 });

      gsap.to(titleRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top 85%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-32 px-6 lg:px-12">
      {/* Section title */}
      <div ref={titleRef} className="text-center mb-16">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
          Tout ce dont vous avez besoin
        </h2>
        <p className="text-lg text-white/50 max-w-2xl mx-auto">
          Une suite complete d'outils pour transformer votre prospection
        </p>
      </div>

      {/* Features grid */}
      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
        {features.map((feature, index) => (
          <FeatureCard key={feature.title} {...feature} index={index} />
        ))}
      </div>
    </section>
  );
}
