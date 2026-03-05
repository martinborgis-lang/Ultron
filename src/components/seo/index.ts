/**
 * SEO Monitoring Components - Agent 8
 *
 * Système complet de monitoring SEO pour Ultron CRM
 * - SeoMonitor: Audit automatique en développement
 * - SchemaValidator: Validation JSON-LD avancée
 *
 * Usage:
 * import { SeoMonitor, SchemaValidator, useSeoMonitoring } from '@/components/seo'
 */

export { SeoMonitor, useSeoMonitoring } from './SeoMonitor'
export { SchemaValidator, useSchemaValidation } from './SchemaValidator'

// Types pour TypeScript
export interface SeoIssue {
  type: 'error' | 'warning' | 'info'
  message: string
  element?: Element
  recommendation?: string
}

export interface SeoMetrics {
  titleLength: number
  descriptionLength: number
  h1Count: number
  imagesWithoutAlt: number
  linksWithoutTitle: number
  loadTime: number
  hasCanonical: boolean
  hasOpenGraph: boolean
}

/**
 * Configuration par défaut du monitoring SEO
 */
export const SEO_CONFIG = {
  title: {
    minLength: 30,
    maxLength: 60,
  },
  description: {
    minLength: 120,
    maxLength: 160,
  },
  performance: {
    maxLoadTime: 3000, // 3 secondes
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'development',
    delay: 1000, // Délai avant audit
  },
} as const