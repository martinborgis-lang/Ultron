// Security Middleware centralisé pour la protection contre les attaques
// Rate limiting, CSRF, validation headers, logging des attaques

import { NextRequest, NextResponse } from 'next/server';
import { validatePromptInput } from '@/lib/validation/prompt-injection-protection';

export interface SecurityConfig {
  rateLimiting: {
    enabled: boolean;      // Active/désactive le rate limiting
    windowMs: number;      // Fenêtre de temps en ms
    maxRequests: number;   // Max requêtes par fenêtre
    blockDurationMs: number; // Durée de blocage en ms
  };
  csrf: {
    enabled: boolean;
    trustedOrigins: string[];
    exemptPaths: string[];
  };
  headers: {
    enforceSecureHeaders: boolean;
    allowedContentTypes: string[];
    maxBodySize: number; // en bytes
  };
  logging: {
    enabled: boolean;
    logSuspiciousActivity: boolean;
    logFailedAttempts: boolean;
  };
  ipBlocking: {
    enabled: boolean;
    maxFailedAttempts: number;
    blockDurationMs: number;
  };
}

export const DEFAULT_SECURITY_CONFIG: SecurityConfig = {
  rateLimiting: {
    enabled: true,
    windowMs: 15 * 60 * 1000,  // 15 minutes
    maxRequests: 100,          // 100 requests per 15min
    blockDurationMs: 60 * 1000 // 1 minute de blocage
  },
  csrf: {
    enabled: true,
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'https://ultron-murex.vercel.app'
    ],
    exemptPaths: ['/api/webhooks', '/api/auth', '/api/extension', '/api/gmail', '/api/team', '/api/user/me', '/api/organization', '/api/google', '/api/debug', '/api/security', '/api/settings', '/api/crm', '/api/leads']
  },
  headers: {
    enforceSecureHeaders: true,
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
      'text/plain'
    ],
    maxBodySize: 10 * 1024 * 1024 // 10MB
  },
  logging: {
    enabled: true,
    logSuspiciousActivity: true,
    logFailedAttempts: true
  },
  ipBlocking: {
    enabled: true,
    maxFailedAttempts: 5,
    blockDurationMs: 30 * 60 * 1000 // 30 minutes
  }
};

// Store en mémoire pour le rate limiting (en production, utiliser Redis)
interface RateLimitEntry {
  requests: number;
  firstRequest: number;
  blocked?: number; // timestamp du blocage
}

interface IPBlockEntry {
  failedAttempts: number;
  firstFailure: number;
  blocked?: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();
const ipBlockStore = new Map<string, IPBlockEntry>();
const suspiciousActivityLog: Array<{
  timestamp: number;
  ip: string;
  path: string;
  reason: string;
  userAgent?: string;
}> = [];

export class SecurityMiddleware {
  private config: SecurityConfig;

  constructor(config: Partial<SecurityConfig> = {}) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...config };
  }

  /**
   * Middleware principal de sécurité
   */
  async process(request: NextRequest): Promise<NextResponse | null> {
    const ip = this.getClientIP(request);
    const path = request.nextUrl.pathname;
    const method = request.method;

    try {
      // 1. Vérification IP bloquée
      if (this.config.ipBlocking.enabled && this.isIPBlocked(ip)) {
        this.logSecurity(ip, path, 'IP_BLOCKED', request.headers.get('user-agent'));
        return new NextResponse('Too many failed attempts. IP blocked temporarily.', {
          status: 429,
          headers: {
            'Retry-After': '1800', // 30 minutes
            'X-Security-Block': 'IP_BLOCKED'
          }
        });
      }

      // 2. Rate Limiting
      if (this.config.rateLimiting.enabled && !this.checkRateLimit(ip)) {
        this.recordFailedAttempt(ip, 'RATE_LIMIT_EXCEEDED');
        this.logSecurity(ip, path, 'RATE_LIMIT_EXCEEDED', request.headers.get('user-agent'));
        return new NextResponse('Rate limit exceeded. Please try again later.', {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(this.config.rateLimiting.windowMs / 1000).toString(),
            'X-RateLimit-Limit': this.config.rateLimiting.maxRequests.toString(),
            'X-RateLimit-Remaining': '0'
          }
        });
      }

      // 3. Validation CSRF pour les requêtes modifiantes
      if (this.config.csrf.enabled && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const csrfError = this.validateCSRF(request);
        if (csrfError) {
          this.recordFailedAttempt(ip, 'CSRF_VIOLATION');
          this.logSecurity(ip, path, `CSRF_VIOLATION: ${csrfError}`, request.headers.get('user-agent'));
          return new NextResponse('CSRF validation failed', {
            status: 403,
            headers: { 'X-Security-Block': 'CSRF_VIOLATION' }
          });
        }
      }

      // 4. Validation des headers de sécurité
      if (this.config.headers.enforceSecureHeaders) {
        const headerError = this.validateSecureHeaders(request);
        if (headerError) {
          this.recordFailedAttempt(ip, 'INVALID_HEADERS');
          this.logSecurity(ip, path, `INVALID_HEADERS: ${headerError}`, request.headers.get('user-agent'));
          return new NextResponse('Invalid security headers', {
            status: 400,
            headers: { 'X-Security-Block': 'INVALID_HEADERS' }
          });
        }
      }

      // 5. Validation Prompt Injection pour les endpoints IA
      if (this.isAIEndpoint(path) && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const promptError = await this.validatePromptInjection(request);
        if (promptError) {
          this.recordFailedAttempt(ip, 'PROMPT_INJECTION');
          this.logSecurity(ip, path, `PROMPT_INJECTION: ${promptError}`, request.headers.get('user-agent'));
          return new NextResponse('Malicious input detected', {
            status: 400,
            headers: { 'X-Security-Block': 'PROMPT_INJECTION' }
          });
        }
      }

      // 6. Enregistrer requête réussie
      this.recordSuccessfulRequest(ip);

      return null; // Continuer le traitement

    } catch (error) {
      this.logSecurity(ip, path, `MIDDLEWARE_ERROR: ${error}`, request.headers.get('user-agent'));
      return new NextResponse('Internal security error', { status: 500 });
    }
  }

  /**
   * Obtient l'IP réelle du client
   */
  private getClientIP(request: NextRequest): string {
    // Essayer les headers de proxy en premier
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
      // Prendre la première IP (client original)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      if (ips[0]) return ips[0];
    }

    // Header Cloudflare
    const cfIP = request.headers.get('cf-connecting-ip');
    if (cfIP) return cfIP;

    // Header réel IP (certains proxies)
    const realIP = request.headers.get('x-real-ip');
    if (realIP) return realIP;

    // Vercel spécifique
    const vercelIP = request.headers.get('x-vercel-forwarded-for');
    if (vercelIP) {
      const ips = vercelIP.split(',').map(ip => ip.trim());
      if (ips[0]) return ips[0];
    }

    // Fallback - utiliser un hash du user-agent comme identifiant de secours
    const userAgent = request.headers.get('user-agent') || '';
    if (userAgent) {
      // Créer un identifiant basé sur le user-agent (pas parfait mais mieux que 'unknown')
      return 'ua-' + Buffer.from(userAgent).toString('base64').substring(0, 16);
    }

    return 'unknown';
  }

  /**
   * Vérifie le rate limiting
   */
  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitStore.get(ip);

    // Si bloqué, vérifier si le blocage a expiré
    if (entry?.blocked && now - entry.blocked < this.config.rateLimiting.blockDurationMs) {
      return false;
    }

    // Reset si la fenêtre a expiré ou première requête
    if (!entry || now - entry.firstRequest > this.config.rateLimiting.windowMs) {
      rateLimitStore.set(ip, {
        requests: 1,
        firstRequest: now
      });
      return true;
    }

    // Vérifier limite
    if (entry.requests >= this.config.rateLimiting.maxRequests) {
      entry.blocked = now;
      return false;
    }

    entry.requests++;
    return true;
  }

  /**
   * Validation CSRF
   */
  private validateCSRF(request: NextRequest): string | null {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');
    const path = request.nextUrl.pathname;

    // Skip pour les chemins exemptés
    if (this.config.csrf.exemptPaths.some(exempt => path.startsWith(exempt))) {
      return null;
    }

    // Allow Chrome extension origins for extension APIs
    const isExtensionOrigin = origin?.startsWith('chrome-extension://');
    const isExtensionAPI = path.startsWith('/api/meeting/') || path.startsWith('/api/extension/');
    if (isExtensionOrigin && isExtensionAPI) {
      return null;
    }

    // Vérifier Origin/Referer
    if (!origin && !referer) {
      return 'Missing Origin and Referer headers';
    }

    const requestOrigin = origin || new URL(referer!).origin;

    if (!this.config.csrf.trustedOrigins.includes(requestOrigin)) {
      return `Untrusted origin: ${requestOrigin}`;
    }

    return null;
  }

  /**
   * Validation des headers de sécurité
   */
  private validateSecureHeaders(request: NextRequest): string | null {
    const contentType = request.headers.get('content-type');
    const contentLength = request.headers.get('content-length');

    // Validation Content-Type pour les requêtes avec body
    if (['POST', 'PUT', 'PATCH'].includes(request.method) && contentType) {
      const baseContentType = contentType.split(';')[0];
      if (!this.config.headers.allowedContentTypes.includes(baseContentType)) {
        return `Invalid Content-Type: ${baseContentType}`;
      }
    }

    // Validation taille du body
    if (contentLength) {
      const size = parseInt(contentLength);
      if (size > this.config.headers.maxBodySize) {
        return `Request body too large: ${size} bytes`;
      }
    }

    return null;
  }

  /**
   * Validation Prompt Injection pour les endpoints IA
   */
  private async validatePromptInjection(request: NextRequest): Promise<string | null> {
    try {
      const contentType = request.headers.get('content-type');

      if (!contentType?.includes('application/json')) {
        return null; // Ne valider que JSON
      }

      // Clone pour pouvoir lire le body
      const body = await request.clone().json().catch(() => null);
      if (!body) return null;

      // Champs suspects à valider
      const suspectFields = ['message', 'prompt', 'question', 'besoins', 'notes', 'description'];

      for (const [key, value] of Object.entries(body)) {
        if (suspectFields.includes(key.toLowerCase()) && typeof value === 'string') {
          const validation = validatePromptInput(value, key);
          if (!validation.isValid) {
            return `Prompt injection in field ${key}: ${validation.threats.join(', ')}`;
          }
        }
      }

      return null;
    } catch (error) {
      return `Failed to validate prompt injection: ${error}`;
    }
  }

  /**
   * Vérifie si c'est un endpoint IA
   */
  private isAIEndpoint(path: string): boolean {
    const aiPaths = [
      '/api/assistant',
      '/api/webhooks/qualification',
      '/api/webhooks/rdv-valide',
      '/api/webhooks/plaquette',
      '/api/webhooks/send-rappel',
      '/api/meeting/analyze',
      '/api/extension/analyze'
    ];

    return aiPaths.some(aiPath => path.startsWith(aiPath));
  }

  /**
   * Vérifie si une IP est bloquée
   */
  private isIPBlocked(ip: string): boolean {
    const entry = ipBlockStore.get(ip);
    if (!entry || !entry.blocked) return false;

    const now = Date.now();
    if (now - entry.blocked > this.config.ipBlocking.blockDurationMs) {
      // Débloquer l'IP
      ipBlockStore.delete(ip);
      return false;
    }

    return true;
  }

  /**
   * Enregistre une tentative échouée
   */
  private recordFailedAttempt(ip: string, reason: string): void {
    if (!this.config.ipBlocking.enabled) return;

    const now = Date.now();
    const entry = ipBlockStore.get(ip) || { failedAttempts: 0, firstFailure: now };

    // Reset si la fenêtre a expiré
    if (now - entry.firstFailure > this.config.ipBlocking.blockDurationMs) {
      entry.failedAttempts = 1;
      entry.firstFailure = now;
      delete entry.blocked;
    } else {
      entry.failedAttempts++;
    }

    // Bloquer si trop d'échecs
    if (entry.failedAttempts >= this.config.ipBlocking.maxFailedAttempts) {
      entry.blocked = now;
    }

    ipBlockStore.set(ip, entry);
  }

  /**
   * Enregistre une requête réussie
   */
  private recordSuccessfulRequest(ip: string): void {
    // Reset les échecs pour cette IP lors d'une requête réussie
    const entry = ipBlockStore.get(ip);
    if (entry && !entry.blocked) {
      entry.failedAttempts = Math.max(0, entry.failedAttempts - 1);
      if (entry.failedAttempts === 0) {
        ipBlockStore.delete(ip);
      }
    }
  }

  /**
   * Logging de sécurité
   */
  private logSecurity(ip: string, path: string, reason: string, userAgent?: string | null): void {
    if (!this.config.logging.enabled) return;

    const logEntry = {
      timestamp: Date.now(),
      ip,
      path,
      reason,
      userAgent: userAgent || undefined
    };

    suspiciousActivityLog.push(logEntry);

    // Garder seulement les 1000 dernières entrées
    if (suspiciousActivityLog.length > 1000) {
      suspiciousActivityLog.splice(0, 100);
    }

    // Console log pour debug
    console.warn(`🚨 SECURITY: ${reason} - IP: ${ip} - Path: ${path}`);
  }

  /**
   * Obtient les statistiques de sécurité
   */
  getSecurityStats(): {
    rateLimitEntries: number;
    blockedIPs: number;
    suspiciousActivity: number;
    recentAttacks: typeof suspiciousActivityLog;
  } {
    const now = Date.now();
    const blockedIPs = Array.from(ipBlockStore.values()).filter(
      entry => entry.blocked && (now - entry.blocked) < this.config.ipBlocking.blockDurationMs
    ).length;

    return {
      rateLimitEntries: rateLimitStore.size,
      blockedIPs,
      suspiciousActivity: suspiciousActivityLog.length,
      recentAttacks: suspiciousActivityLog.slice(-10) // 10 dernières attaques
    };
  }

  /**
   * Ajoute des headers de sécurité à la réponse
   */
  addSecurityHeaders(response: NextResponse): void {
    // ⚠️ SKIP CSP en développement pour éviter les conflits avec Supabase
    const isDevelopment = process.env.NODE_ENV === 'development';

    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('X-XSS-Protection', '1; mode=block');

    if (!isDevelopment) {
      response.headers.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; connect-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; font-src 'self' data: https://fonts.gstatic.com; frame-src 'self' https://*.supabase.co;"
      );
    }
  }
}

// Instance globale
const securityMiddleware = new SecurityMiddleware();

export { securityMiddleware };
export default SecurityMiddleware;