/**
 * Helpers pour sécurité SEO et headers techniques
 * Optimisé pour protection contre attaques et SEO négatif
 */

import { headers } from 'next/headers';

// Configuration sécurité SEO
export const SEO_SECURITY_CONFIG = {
  // Rate limiting par path
  rateLimits: {
    '/api/': 100, // 100 requêtes/heure pour APIs
    '/sitemap': 50,
    '/robots.txt': 20,
    '/': 1000 // Page d'accueil plus permissive
  },

  // IPs à bloquer (bots malveillants)
  blockedIPs: [
    // Exemples de bots malveillants
    '185.220.', // Tor exit nodes (partiel)
    '167.71.',  // VPN connus pour scraping agressif
  ],

  // User agents suspects
  suspiciousUserAgents: [
    'python-requests',
    'curl',
    'wget',
    'scrapy',
    'bot.*bot', // Double bot pattern
    'hack',
    'scan'
  ],

  // Paramètres dangereux à filtrer
  dangerousParams: [
    'admin',
    'login',
    'password',
    'token',
    'auth',
    'sql',
    'script',
    'eval',
    'exec'
  ]
} as const;

/**
 * Valide une requête entrante pour sécurité
 * @param request - Objet Request Next.js
 * @returns Objet validation avec détails
 */
export async function validateIncomingRequest() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const xForwardedFor = headersList.get('x-forwarded-for') || '';
  const referer = headersList.get('referer') || '';

  return {
    isBot: detectBot(userAgent),
    isSuspicious: detectSuspiciousUA(userAgent),
    ipInfo: analyzeIP(xForwardedFor),
    refererInfo: analyzeReferer(referer),
    riskScore: calculateRiskScore(userAgent, xForwardedFor, referer)
  };
}

/**
 * Détecte si le user-agent est un bot légitime
 */
function detectBot(userAgent: string): { isBot: boolean; botType: string | null } {
  const legitimateBots = [
    { pattern: /Googlebot/i, type: 'google' },
    { pattern: /bingbot/i, type: 'bing' },
    { pattern: /facebookexternalhit/i, type: 'facebook' },
    { pattern: /twitterbot/i, type: 'twitter' },
    { pattern: /linkedinbot/i, type: 'linkedin' },
    { pattern: /gptbot/i, type: 'openai' },
    { pattern: /anthropic-ai/i, type: 'anthropic' },
    { pattern: /perplexitybot/i, type: 'perplexity' }
  ];

  for (const bot of legitimateBots) {
    if (bot.pattern.test(userAgent)) {
      return { isBot: true, botType: bot.type };
    }
  }

  return { isBot: false, botType: null };
}

/**
 * Détecte un user-agent suspect
 */
function detectSuspiciousUA(userAgent: string): boolean {
  return SEO_SECURITY_CONFIG.suspiciousUserAgents.some(pattern => {
    const regex = new RegExp(pattern, 'i');
    return regex.test(userAgent);
  });
}

/**
 * Analyse l'IP pour détection risques
 */
function analyzeIP(xForwardedFor: string): { isBlocked: boolean; riskLevel: 'low' | 'medium' | 'high' } {
  if (!xForwardedFor) return { isBlocked: false, riskLevel: 'low' };

  const ip = xForwardedFor.split(',')[0].trim();

  // Vérifier IPs bloquées
  const isBlocked = SEO_SECURITY_CONFIG.blockedIPs.some(blockedPattern =>
    ip.startsWith(blockedPattern)
  );

  // Détection patterns risqués
  let riskLevel: 'low' | 'medium' | 'high' = 'low';

  if (ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.')) {
    riskLevel = 'medium'; // IPs privées (proxy/VPN potentiel)
  }

  if (isBlocked) {
    riskLevel = 'high';
  }

  return { isBlocked, riskLevel };
}

/**
 * Analyse le referer pour détection spam
 */
function analyzeReferer(referer: string): { isSpam: boolean; domain: string | null } {
  if (!referer) return { isSpam: false, domain: null };

  try {
    const url = new URL(referer);
    const domain = url.hostname;

    // Domaines spam connus
    const spamDomains = [
      'semalt.com',
      'darodar.com',
      'buttons-for-website.com',
      'social-buttons.com'
    ];

    const isSpam = spamDomains.includes(domain);

    return { isSpam, domain };
  } catch {
    return { isSpam: true, domain: null }; // Referer invalide = spam
  }
}

/**
 * Calcule un score de risque global
 */
function calculateRiskScore(userAgent: string, xForwardedFor: string, referer: string): number {
  let score = 0;

  // User-agent suspect +30
  if (detectSuspiciousUA(userAgent)) score += 30;

  // User-agent vide ou très court +20
  if (!userAgent || userAgent.length < 10) score += 20;

  // IP à risque
  const ipInfo = analyzeIP(xForwardedFor);
  if (ipInfo.riskLevel === 'medium') score += 15;
  if (ipInfo.riskLevel === 'high') score += 40;

  // Referer spam +25
  const refererInfo = analyzeReferer(referer);
  if (refererInfo.isSpam) score += 25;

  // Pattern bot malveillant (double bot) +35
  if (/bot.*bot/i.test(userAgent)) score += 35;

  return Math.min(score, 100); // Max 100
}

/**
 * Génère headers de sécurité pour SEO
 */
export function generateSecurityHeaders(path: string) {
  const baseHeaders = {
    // Protection contre hotlinking
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',

    // SEO security
    'X-Robots-Tag': 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',

    // Performance et cache
    'Vary': 'Accept-Encoding, User-Agent',

    // HSTS pour HTTPS forcé
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };

  // Headers spéciaux pour certains paths
  if (path.startsWith('/api/')) {
    return {
      ...baseHeaders,
      'X-Robots-Tag': 'noindex, nofollow', // Pas d'indexation APIs
      'Cache-Control': 'private, no-cache, no-store, must-revalidate'
    };
  }

  if (path === '/robots.txt' || path === '/sitemap.xml' || path.includes('sitemap')) {
    return {
      ...baseHeaders,
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'X-Robots-Tag': 'noindex' // Les sitemaps ne doivent pas être indexés
    };
  }

  return baseHeaders;
}

/**
 * Nettoie les paramètres d'URL dangereux
 */
export function sanitizeUrlParams(searchParams: URLSearchParams): URLSearchParams {
  const cleanParams = new URLSearchParams();

  for (const [key, value] of searchParams) {
    // Filtrer paramètres dangereux
    const isDangerous = SEO_SECURITY_CONFIG.dangerousParams.some(dangerous =>
      key.toLowerCase().includes(dangerous.toLowerCase())
    );

    if (!isDangerous) {
      // Nettoyer la valeur
      const cleanValue = value
        .replace(/<script[^>]*>.*?<\/script>/gi, '') // Enlever scripts
        .replace(/javascript:/gi, '') // Enlever javascript:
        .replace(/data:/gi, '') // Enlever data:
        .trim();

      if (cleanValue && cleanValue.length < 100) { // Limite longueur
        cleanParams.append(key, cleanValue);
      }
    }
  }

  return cleanParams;
}

/**
 * Génère un rapport de sécurité pour monitoring
 */
export async function generateSecurityReport() {
  const validation = await validateIncomingRequest();

  return {
    timestamp: new Date().toISOString(),
    riskScore: validation.riskScore,
    riskLevel: validation.riskScore < 25 ? 'low' : validation.riskScore < 50 ? 'medium' : 'high',
    botInfo: validation.isBot,
    suspicious: validation.isSuspicious,
    ipRisk: validation.ipInfo.riskLevel,
    recommendation: validation.riskScore > 75 ? 'block' : validation.riskScore > 50 ? 'monitor' : 'allow'
  };
}