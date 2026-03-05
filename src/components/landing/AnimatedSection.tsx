'use client';

import { useRef, useEffect, ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { prefersReducedMotion } from '@/lib/animations/scroll-triggers';

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: 'fadeInUp' | 'scaleIn' | 'slideLeft' | 'slideRight';
  delay?: number;
  duration?: number;
  staggerChildren?: boolean;
  staggerDelay?: number;
}

export default function AnimatedSection({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 0.8,
  staggerChildren = false,
  staggerDelay = 0.1,
}: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || prefersReducedMotion()) return;

    const el = ref.current;
    const targets = staggerChildren ? el.children : el;

    const animationMap = {
      fadeInUp: { from: { opacity: 0, y: 30 }, to: { opacity: 1, y: 0 } },
      scaleIn: { from: { opacity: 0, scale: 0.9 }, to: { opacity: 1, scale: 1 } },
      slideLeft: { from: { opacity: 0, x: -40 }, to: { opacity: 1, x: 0 } },
      slideRight: { from: { opacity: 0, x: 40 }, to: { opacity: 1, x: 0 } },
    };

    const { from, to } = animationMap[animation];

    const ctx = gsap.context(() => {
      // 🚀 OPTIMIZATION: Pas de delay sur mobile pour Speed Index
      const isMobile = window.innerWidth < 768;
      const effectiveDelay = isMobile ? 0 : delay;
      const effectiveStagger = isMobile ? 0 : (staggerChildren ? staggerDelay : 0);

      gsap.fromTo(targets, from, {
        ...to,
        duration: isMobile ? 0.4 : duration, // Plus rapide sur mobile
        delay: effectiveDelay,
        stagger: effectiveStagger,
        ease: 'power2.out', // Easing plus léger
        scrollTrigger: {
          trigger: el,
          start: 'top 82%',
          once: true,
        },
      });
    }, el);

    return () => ctx.revert();
  }, [animation, delay, duration, staggerChildren, staggerDelay]);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform, opacity' }}>
      {children}
    </div>
  );
}
