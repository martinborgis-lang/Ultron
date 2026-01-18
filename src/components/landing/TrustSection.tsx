'use client';

import { useEffect, useRef } from 'react';
import { Shield, Lock, Zap } from 'lucide-react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const trustPoints = [
  {
    icon: Shield,
    title: 'Donnees securisees',
    description: 'Vos donnees sont chiffrees et stockees en France',
  },
  {
    icon: Lock,
    title: 'RGPD compliant',
    description: 'Conformite totale avec la reglementation europeenne',
  },
  {
    icon: Zap,
    title: 'Disponibilite 99.9%',
    description: 'Infrastructure robuste et haute disponibilite',
  },
];

export function TrustSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !sectionRef.current) return;

    const ctx = gsap.context(() => {
      const items = itemsRef.current?.children;
      if (!items) return;

      gsap.set(items, { opacity: 0, y: 30 });

      gsap.to(items, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          toggleActions: 'play none none reverse',
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative py-24 px-6 lg:px-12">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-950/30 to-transparent pointer-events-none" />

      <div className="relative max-w-5xl mx-auto">
        {/* Trust points */}
        <div ref={itemsRef} className="grid md:grid-cols-3 gap-8 text-center">
          {trustPoints.map((point) => (
            <div key={point.title} className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center mb-4">
                <point.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{point.title}</h3>
              <p className="text-sm text-white/50">{point.description}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 text-center">
          <p className="text-white/40 text-sm">
            Plus de 500 conseillers en gestion de patrimoine nous font confiance
          </p>
        </div>
      </div>
    </section>
  );
}
