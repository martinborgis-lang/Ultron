'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function FooterSection() {
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || !footerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.set(footerRef.current, { opacity: 0, y: 20 });

      gsap.to(footerRef.current, {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: footerRef.current,
          start: 'top 95%',
          toggleActions: 'play none none reverse',
        },
      });
    }, footerRef);

    return () => ctx.revert();
  }, []);

  return (
    <footer ref={footerRef} className="relative py-12 px-6 lg:px-12 border-t border-white/10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">U</span>
            </div>
            <span className="text-lg font-bold text-white">ULTRON</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-8 text-sm text-white/50">
            <Link href="/login" className="hover:text-white transition-colors">
              Connexion
            </Link>
            <Link href="/register" className="hover:text-white transition-colors">
              Inscription
            </Link>
            <Link href="/privacy" className="hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link href="/legal" className="hover:text-white transition-colors">
              Mentions légales
            </Link>
            <a href="mailto:martin.borgis@gmail.com" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>

          {/* Copyright */}
          <p className="text-sm text-white/30">
            &copy; {new Date().getFullYear()} Ultron. Tous droits reserves.
          </p>
        </div>
      </div>
    </footer>
  );
}
