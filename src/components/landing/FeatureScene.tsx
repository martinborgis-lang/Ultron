'use client';

import { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/animations/scroll-triggers';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface FeatureSceneProps {
  title: string;
  subtitle: string;
  description: string;
  features: string[];
  mockup: ReactNode;
  reversed?: boolean; // Alternate layout direction
  accentColor?: string; // Accent color for the badge
  badge?: string; // Small badge above title
  index?: number; // For stagger delay
}

export default function FeatureScene({
  title,
  subtitle,
  description,
  features,
  mockup,
  reversed = false,
  accentColor = '#6366f1',
  badge,
  index = 0,
}: FeatureSceneProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (!sectionRef.current || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      // Text content fade in
      if (textRef.current) {
        const textElements = textRef.current.children;
        gsap.fromTo(
          textElements,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 75%',
              once: true,
            },
          }
        );
      }

      // Mockup scale reveal with blur
      if (mockupRef.current) {
        gsap.fromTo(
          mockupRef.current,
          {
            opacity: 0,
            scale: 0.88,
            filter: 'blur(10px)',
            y: 40,
          },
          {
            opacity: 1,
            scale: 1,
            filter: 'blur(0px)',
            y: 0,
            duration: 1,
            delay: 0.15,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: sectionRef.current,
              start: 'top 70%',
              once: true,
            },
          }
        );
      }

      // Feature list items stagger
      if (featuresRef.current) {
        const items = featuresRef.current.children;
        gsap.fromTo(
          items,
          { opacity: 0, x: reversed ? 20 : -20 },
          {
            opacity: 1,
            x: 0,
            duration: 0.5,
            stagger: 0.08,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: featuresRef.current,
              start: 'top 80%',
              once: true,
            },
          }
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [reversed]);

  return (
    <section
      ref={sectionRef}
      className="relative py-20 md:py-32 px-4 sm:px-6 overflow-hidden"
    >
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at ${reversed ? '80%' : '20%'} 50%, ${accentColor}, transparent 70%)`,
        }}
      />

      <div
        className={`max-w-7xl mx-auto flex flex-col ${
          reversed ? 'lg:flex-row-reverse' : 'lg:flex-row'
        } items-center gap-12 lg:gap-20`}
      >
        {/* Text Content */}
        <div ref={textRef} className="flex-1 max-w-xl">
          {badge && (
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-4"
              style={{
                backgroundColor: `${accentColor}15`,
                color: accentColor,
                border: `1px solid ${accentColor}30`,
              }}
            >
              {badge}
            </span>
          )}

          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 leading-tight">
            {title}
          </h2>

          <p
            className="text-lg md:text-xl font-medium mb-4"
            style={{ color: accentColor }}
          >
            {subtitle}
          </p>

          <p className="text-white/50 text-base md:text-lg leading-relaxed mb-8">
            {description}
          </p>

          <ul ref={featuresRef} className="space-y-3">
            {features.map((feature, i) => (
              <li key={i} className="flex items-start gap-3">
                <span
                  className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: accentColor }}
                />
                <span className="text-white/70 text-sm md:text-base">
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Mockup */}
        <div ref={mockupRef} className="flex-1 w-full max-w-2xl">
          <div className="relative">
            {/* Glow effect behind mockup */}
            <div
              className="absolute -inset-4 rounded-2xl opacity-20 blur-3xl pointer-events-none"
              style={{ backgroundColor: accentColor }}
            />
            <div className="relative">{mockup}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
