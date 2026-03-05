'use client';

import { useEffect, useState } from 'react';

interface AnimationConfig {
  duration?: number;
  delay?: number;
  enabled?: boolean;
}

/**
 * Hook pour animations optimisées avec support reduce-motion
 * Désactive automatiquement les animations si l'utilisateur préfère un mouvement réduit
 */
export function useOptimizedAnimation(config: AnimationConfig = {}) {
  const { duration = 300, delay = 0, enabled = true } = config;
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Détection de la préférence reduce-motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);

    // Déclenchement de l'animation après le délai
    if (enabled && !mediaQuery.matches) {
      const timer = setTimeout(() => {
        setShouldAnimate(true);
      }, delay);

      return () => {
        clearTimeout(timer);
        mediaQuery.removeEventListener('change', handleChange);
      };
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [delay, enabled]);

  return {
    shouldAnimate: shouldAnimate && !prefersReducedMotion,
    prefersReducedMotion,
    duration: prefersReducedMotion ? 0 : duration,
  };
}

/**
 * Hook pour intersection observer optimisé (lazy animations)
 */
export function useIntersectionAnimation(
  config: AnimationConfig & { threshold?: number; rootMargin?: string } = {}
) {
  const { threshold = 0.1, rootMargin = '50px', ...animationConfig } = config;
  const [elementRef, setElementRef] = useState<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { shouldAnimate, prefersReducedMotion, duration } = useOptimizedAnimation(animationConfig);

  useEffect(() => {
    if (!elementRef) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(elementRef); // Unobserve après la première apparition
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(elementRef);

    return () => observer.disconnect();
  }, [elementRef, threshold, rootMargin]);

  return {
    ref: setElementRef,
    shouldAnimate: shouldAnimate && isVisible,
    prefersReducedMotion,
    duration,
    isVisible,
  };
}

/**
 * Configuration d'animations CSS optimisées
 */
export const optimizedAnimations = {
  // Animations utilisant transform et opacity pour GPU acceleration
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  fadeInUp: {
    initial: { opacity: 0, transform: 'translateY(20px)' },
    animate: { opacity: 1, transform: 'translateY(0px)' },
    transition: { duration: 0.4, ease: 'easeOut' },
  },

  fadeInScale: {
    initial: { opacity: 0, transform: 'scale(0.95)' },
    animate: { opacity: 1, transform: 'scale(1)' },
    transition: { duration: 0.3, ease: 'easeOut' },
  },

  // Stagger animation pour listes
  staggerContainer: {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  },

  staggerItem: {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
  },
} as const;

/**
 * Classes CSS optimisées pour animations sans JavaScript
 * Utilise GPU acceleration et respecte prefers-reduced-motion
 */
export const animationClasses = {
  // Classes de base
  fadeIn: 'animate-fade-in',
  fadeInUp: 'animate-fade-in-up',
  fadeInScale: 'animate-fade-in-scale',

  // Délais
  delay100: 'animation-delay-100',
  delay200: 'animation-delay-200',
  delay300: 'animation-delay-300',
  delay400: 'animation-delay-400',
  delay500: 'animation-delay-500',
} as const;