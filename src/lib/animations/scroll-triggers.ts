'use client';

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger);
}

// ============================================
// ANIMATION PRESETS
// ============================================

export interface ScrollTriggerConfig {
  trigger?: string | Element;
  start?: string;
  end?: string;
  scrub?: boolean | number;
  markers?: boolean;
  toggleActions?: string;
  once?: boolean;
}

const defaultTrigger: ScrollTriggerConfig = {
  start: 'top 80%',
  end: 'top 50%',
  toggleActions: 'play none none none',
  markers: false,
  once: true,
};

// ============================================
// FADE IN UP — Text, titles, cards
// ============================================
export function createFadeInUp(
  elements: HTMLElement | HTMLElement[] | NodeListOf<Element>,
  config: {
    duration?: number;
    delay?: number;
    stagger?: number;
    yOffset?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const {
    duration = 0.8,
    delay = 0,
    stagger = 0.12,
    yOffset = 40,
    trigger = {},
  } = config;

  const triggerConfig = { ...defaultTrigger, ...trigger };

  return gsap.fromTo(
    elements,
    { opacity: 0, y: yOffset },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      stagger,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: triggerConfig.trigger || elements,
        start: triggerConfig.start,
        end: triggerConfig.end,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    }
  );
}

// ============================================
// SCALE REVEAL — Mockups, images, cards
// ============================================
export function createScaleReveal(
  element: HTMLElement | Element,
  config: {
    duration?: number;
    delay?: number;
    scaleFrom?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const {
    duration = 1,
    delay = 0.2,
    scaleFrom = 0.85,
    trigger = {},
  } = config;

  const triggerConfig = { ...defaultTrigger, ...trigger };

  return gsap.fromTo(
    element,
    {
      opacity: 0,
      scale: scaleFrom,
      filter: 'blur(8px)',
    },
    {
      opacity: 1,
      scale: 1,
      filter: 'blur(0px)',
      duration,
      delay,
      ease: 'back.out(1.2)',
      scrollTrigger: {
        trigger: triggerConfig.trigger || element,
        start: triggerConfig.start || 'top 75%',
        end: triggerConfig.end,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    }
  );
}

// ============================================
// PARALLAX — Background elements, decorations
// ============================================
export function createParallax(
  element: HTMLElement | Element,
  config: {
    yPercent?: number;
    speed?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const { yPercent = -20, speed = 1, trigger = {} } = config;

  const triggerConfig = { ...defaultTrigger, ...trigger };

  return gsap.to(element, {
    yPercent: yPercent * speed,
    ease: 'none',
    scrollTrigger: {
      trigger: triggerConfig.trigger || element,
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
      markers: triggerConfig.markers,
    },
  });
}

// ============================================
// COUNTER ANIMATION — KPI numbers
// ============================================
export function createCounterAnimation(
  element: HTMLElement,
  config: {
    target: number;
    duration?: number;
    prefix?: string;
    suffix?: string;
    decimals?: number;
    trigger?: ScrollTriggerConfig;
  }
) {
  const {
    target,
    duration = 2,
    prefix = '',
    suffix = '',
    decimals = 0,
    trigger = {},
  } = config;

  const triggerConfig = { ...defaultTrigger, ...trigger };
  const counter = { value: 0 };

  return gsap.to(counter, {
    value: target,
    duration,
    ease: 'power2.out',
    scrollTrigger: {
      trigger: triggerConfig.trigger || element,
      start: triggerConfig.start || 'top 85%',
      toggleActions: 'play none none none',
      markers: triggerConfig.markers,
      once: true,
    },
    onUpdate() {
      element.textContent = `${prefix}${counter.value.toFixed(decimals)}${suffix}`;
    },
  });
}

// ============================================
// SLIDE IN — Horizontal entrance (features list)
// ============================================
export function createSlideIn(
  elements: HTMLElement | HTMLElement[] | NodeListOf<Element>,
  config: {
    direction?: 'left' | 'right';
    duration?: number;
    stagger?: number;
    distance?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const {
    direction = 'left',
    duration = 0.8,
    stagger = 0.1,
    distance = 60,
    trigger = {},
  } = config;

  const xFrom = direction === 'left' ? -distance : distance;
  const triggerConfig = { ...defaultTrigger, ...trigger };

  return gsap.fromTo(
    elements,
    { opacity: 0, x: xFrom },
    {
      opacity: 1,
      x: 0,
      duration,
      stagger,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: triggerConfig.trigger || elements,
        start: triggerConfig.start,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    }
  );
}

// ============================================
// TEXT REVEAL — Character-by-character (hero titles)
// ============================================
export function createTextReveal(
  element: HTMLElement,
  config: {
    duration?: number;
    stagger?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const { duration = 0.6, stagger = 0.02, trigger = {} } = config;
  const triggerConfig = { ...defaultTrigger, ...trigger };

  // Split text into spans
  const text = element.textContent || '';
  element.innerHTML = text
    .split('')
    .map((char) => `<span class="char-reveal">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  const chars = element.querySelectorAll('.char-reveal');

  return gsap.fromTo(
    chars,
    { opacity: 0, y: 20, rotateX: -90 },
    {
      opacity: 1,
      y: 0,
      rotateX: 0,
      duration,
      stagger,
      ease: 'back.out(1.5)',
      scrollTrigger: {
        trigger: triggerConfig.trigger || element,
        start: triggerConfig.start,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    }
  );
}

// ============================================
// LINE DRAW — For decorative lines/borders
// ============================================
export function createLineDraw(
  element: SVGPathElement | HTMLElement,
  config: {
    duration?: number;
    delay?: number;
    trigger?: ScrollTriggerConfig;
  } = {}
) {
  const { duration = 1.5, delay = 0, trigger = {} } = config;
  const triggerConfig = { ...defaultTrigger, ...trigger };

  if (element instanceof SVGPathElement) {
    const length = element.getTotalLength();
    gsap.set(element, { strokeDasharray: length, strokeDashoffset: length });

    return gsap.to(element, {
      strokeDashoffset: 0,
      duration,
      delay,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: triggerConfig.trigger || element,
        start: triggerConfig.start,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    });
  }

  // For non-SVG elements (border animation via clip-path)
  return gsap.fromTo(
    element,
    { clipPath: 'inset(0 100% 0 0)' },
    {
      clipPath: 'inset(0 0% 0 0)',
      duration,
      delay,
      ease: 'power2.inOut',
      scrollTrigger: {
        trigger: triggerConfig.trigger || element,
        start: triggerConfig.start,
        toggleActions: triggerConfig.toggleActions,
        markers: triggerConfig.markers,
        once: triggerConfig.once,
      },
    }
  );
}

// ============================================
// UTILITY: Kill all scroll triggers (cleanup)
// ============================================
export function killAllScrollTriggers() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

// ============================================
// UTILITY: Refresh scroll triggers after DOM changes
// ============================================
export function refreshScrollTriggers() {
  ScrollTrigger.refresh();
}

// ============================================
// UTILITY: Check if user prefers reduced motion
// ============================================
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// ============================================
// UTILITY: Check if device is mobile
// ============================================
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}
