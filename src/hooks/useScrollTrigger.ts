'use client';

import { useEffect, useRef, useCallback } from 'react';
import {
  createFadeInUp,
  createScaleReveal,
  createSlideIn,
  createCounterAnimation,
  createParallax,
  killAllScrollTriggers,
  prefersReducedMotion,
  type ScrollTriggerConfig,
} from '@/lib/animations/scroll-triggers';

export type AnimationType =
  | 'fadeInUp'
  | 'scaleReveal'
  | 'slideInLeft'
  | 'slideInRight'
  | 'parallax'
  | 'counter';

interface UseScrollTriggerOptions {
  type: AnimationType;
  trigger?: ScrollTriggerConfig;
  // fadeInUp options
  stagger?: number;
  yOffset?: number;
  // scaleReveal options
  scaleFrom?: number;
  // slideIn options
  distance?: number;
  // counter options
  counterTarget?: number;
  counterPrefix?: string;
  counterSuffix?: string;
  counterDecimals?: number;
  // parallax options
  parallaxSpeed?: number;
  // shared
  duration?: number;
  delay?: number;
  disabled?: boolean;
}

export function useScrollTrigger<T extends HTMLElement>(
  options: UseScrollTriggerOptions
) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!ref.current || options.disabled || prefersReducedMotion()) return;

    const element = ref.current;
    let animation: gsap.core.Tween | undefined;

    // Small delay to ensure DOM is ready
    const timeout = setTimeout(() => {
      const triggerConfig = {
        trigger: element,
        ...options.trigger,
      };

      switch (options.type) {
        case 'fadeInUp':
          animation = createFadeInUp(element, {
            duration: options.duration,
            delay: options.delay,
            stagger: options.stagger,
            yOffset: options.yOffset,
            trigger: triggerConfig,
          });
          break;

        case 'scaleReveal':
          animation = createScaleReveal(element, {
            duration: options.duration,
            delay: options.delay,
            scaleFrom: options.scaleFrom,
            trigger: triggerConfig,
          });
          break;

        case 'slideInLeft':
          animation = createSlideIn(element, {
            direction: 'left',
            duration: options.duration,
            distance: options.distance,
            trigger: triggerConfig,
          });
          break;

        case 'slideInRight':
          animation = createSlideIn(element, {
            direction: 'right',
            duration: options.duration,
            distance: options.distance,
            trigger: triggerConfig,
          });
          break;

        case 'parallax':
          animation = createParallax(element, {
            speed: options.parallaxSpeed,
            trigger: triggerConfig,
          });
          break;

        case 'counter':
          if (options.counterTarget !== undefined) {
            animation = createCounterAnimation(element, {
              target: options.counterTarget,
              duration: options.duration,
              prefix: options.counterPrefix,
              suffix: options.counterSuffix,
              decimals: options.counterDecimals,
              trigger: triggerConfig,
            });
          }
          break;
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      animation?.kill();
    };
  }, [options.type, options.disabled]);

  return ref;
}

// Hook for batch animations (multiple children)
export function useScrollTriggerBatch(
  options: Omit<UseScrollTriggerOptions, 'type'> & {
    type: 'fadeInUp' | 'slideInLeft' | 'slideInRight';
    childSelector?: string;
  }
) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current || options.disabled || prefersReducedMotion()) return;

    const parent = ref.current;
    const children = options.childSelector
      ? parent.querySelectorAll(options.childSelector)
      : parent.children;

    if (!children.length) return;

    const triggerConfig = {
      trigger: parent,
      ...options.trigger,
    };

    let animation: gsap.core.Tween | undefined;

    const timeout = setTimeout(() => {
      switch (options.type) {
        case 'fadeInUp':
          animation = createFadeInUp(children as unknown as HTMLElement[], {
            duration: options.duration,
            delay: options.delay,
            stagger: options.stagger || 0.1,
            yOffset: options.yOffset,
            trigger: triggerConfig,
          });
          break;

        case 'slideInLeft':
          animation = createSlideIn(children as unknown as HTMLElement[], {
            direction: 'left',
            duration: options.duration,
            stagger: options.stagger || 0.1,
            distance: options.distance,
            trigger: triggerConfig,
          });
          break;

        case 'slideInRight':
          animation = createSlideIn(children as unknown as HTMLElement[], {
            direction: 'right',
            duration: options.duration,
            stagger: options.stagger || 0.1,
            distance: options.distance,
            trigger: triggerConfig,
          });
          break;
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
      animation?.kill();
    };
  }, [options.type, options.disabled]);

  return ref;
}

// Hook to clean up all scroll triggers on unmount
export function useScrollTriggerCleanup() {
  useEffect(() => {
    return () => {
      killAllScrollTriggers();
    };
  }, []);
}
