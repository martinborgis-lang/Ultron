/**
 * Helpers pour génération canonical URLs et gestion domaines
 * Optimisé pour SEO technique Ultron CRM
 */

// Configuration domaines canoniques
export const CANONICAL_CONFIG = {
  // Domaine principal canonical
  primaryDomain: 'https://ultron-ai.pro',

  // Domaines alternatifs (redirections)
  alternativeDomains: [
    'https://ultron-murex.vercel.app',
    'https://ultron-ai.com', // Future
    'https://ultron-crm.fr'  // Future
  ],

  // Paths avec canonical spéciaux
  specialCanonicals: {
    '/home': '/',
    '/dashboard/prospects': '/prospects',
    '/login/': '/login',
    '/register/': '/register'
  }
} as const;

/**
 * Génère l'URL canonique pour une page
 * @param path - Chemin de la page (ex: '/blog/article-slug')
 * @param baseUrl - URL de base actuelle (optionnel)
 * @returns URL canonique complète
 */
export function generateCanonicalUrl(path: string, baseUrl?: string): string {
  // Nettoyer le path
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  // Vérifier si canonical spécial existe
  const specialCanonical = CANONICAL_CONFIG.specialCanonicals[cleanPath as keyof typeof CANONICAL_CONFIG.specialCanonicals];
  const finalPath = specialCanonical || cleanPath;

  // Toujours utiliser le domaine principal pour canonical
  return `${CANONICAL_CONFIG.primaryDomain}${finalPath}`;
}

/**
 * Vérifie si l'URL actuelle nécessite une redirection canonique
 * @param currentUrl - URL actuelle complète
 * @param path - Chemin de la page
 * @returns Objet avec infos redirection
 */
export function checkCanonicalRedirect(currentUrl: string, path: string) {
  const canonicalUrl = generateCanonicalUrl(path);
  const needsRedirect = currentUrl !== canonicalUrl;

  return {
    needsRedirect,
    canonicalUrl,
    currentUrl,
    redirectType: needsRedirect ? 'permanent' : null
  };
}

/**
 * Génère les métadonnées canonical pour Next.js
 * @param path - Chemin de la page
 * @returns Objet métadonnées Next.js
 */
export function generateCanonicalMetadata(path: string) {
  const canonicalUrl = generateCanonicalUrl(path);

  return {
    alternates: {
      canonical: canonicalUrl
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      }
    }
  };
}

/**
 * Headers pour forcer HTTPS et domaine canonical
 * @param path - Chemin de la page
 * @returns Headers de redirection si nécessaire
 */
export function getCanonicalHeaders(path: string) {
  const canonicalUrl = generateCanonicalUrl(path);

  return {
    'Link': `<${canonicalUrl}>; rel="canonical"`,
    'Vary': 'Accept-Encoding',
    'X-Canonical-URL': canonicalUrl
  };
}

/**
 * Valide qu'une URL est dans la liste des domaines autorisés
 * @param url - URL à valider
 * @returns true si domaine autorisé
 */
export function isAuthorizedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const origin = `${urlObj.protocol}//${urlObj.host}`;

    return origin === CANONICAL_CONFIG.primaryDomain ||
           CANONICAL_CONFIG.alternativeDomains.includes(origin as any);
  } catch {
    return false;
  }
}

/**
 * Génère une liste de domaines pour CSP
 * @returns String CSP domains
 */
export function getCSPDomains(): string {
  return [
    CANONICAL_CONFIG.primaryDomain,
    ...CANONICAL_CONFIG.alternativeDomains
  ].map(domain => {
    const url = new URL(domain);
    return url.host;
  }).join(' ');
}