'use client'

import { useEffect } from 'react'

/**
 * SeoMonitor - Composant de monitoring SEO en développement uniquement
 *
 * Effectue des vérifications SEO automatiques et affiche des warnings dans la console
 * pour identifier rapidement les problèmes d'optimisation SEO.
 *
 * Vérifications incluses :
 * - Meta description présence/longueur
 * - Images sans alt text
 * - Structure H1 (manquant/multiple)
 * - Longueur du title
 * - Liens sans title/aria-label
 */
export function SeoMonitor() {
  useEffect(() => {
    // N'exécute que en mode développement
    if (process.env.NODE_ENV !== 'development') return

    // Délai pour permettre au DOM d'être complètement rendu
    const timer = setTimeout(() => {
      console.log('🔍 SEO Monitor: Début de l\'audit...')

      // ===============================
      // 1. META DESCRIPTION
      // ===============================
      const metaDesc = document.querySelector('meta[name="description"]')
      const descContent = metaDesc?.getAttribute('content') || ''

      if (!metaDesc || !descContent) {
        console.warn('🔴 SEO: Meta description manquante')
      } else {
        if (descContent.length > 160) {
          console.warn(`🟡 SEO: Meta description trop longue (${descContent.length} chars) - max 160 recommandé`)
        }
        if (descContent.length < 120) {
          console.warn(`🟡 SEO: Meta description trop courte (${descContent.length} chars) - min 120 recommandé`)
        }
        if (descContent.length >= 120 && descContent.length <= 160) {
          console.log(`✅ SEO: Meta description OK (${descContent.length} chars)`)
        }
      }

      // ===============================
      // 2. TITLE TAG
      // ===============================
      const title = document.title
      if (title.length > 60) {
        console.warn(`🟡 SEO: Title trop long (${title.length} chars) - max 60 recommandé`)
      }
      if (title.length < 30) {
        console.warn(`🟡 SEO: Title trop court (${title.length} chars) - min 30 recommandé`)
      }
      if (title.length >= 30 && title.length <= 60) {
        console.log(`✅ SEO: Title OK (${title.length} chars)`)
      }

      // ===============================
      // 3. STRUCTURE H1
      // ===============================
      const h1Elements = document.querySelectorAll('h1')
      if (h1Elements.length === 0) {
        console.warn('🔴 SEO: Aucun H1 trouvé sur la page')
      } else if (h1Elements.length > 1) {
        console.warn(`🟡 SEO: Plusieurs H1 détectés (${h1Elements.length}) - Un seul H1 par page recommandé`)
        h1Elements.forEach((h1, index) => {
          console.log(`H1 ${index + 1}:`, h1.textContent?.substring(0, 50) + '...')
        })
      } else {
        console.log(`✅ SEO: Un seul H1 trouvé: "${h1Elements[0].textContent?.substring(0, 50)}..."`)
      }

      // ===============================
      // 4. IMAGES ALT TEXT
      // ===============================
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]')
      if (imagesWithoutAlt.length > 0) {
        console.warn(`🔴 SEO: ${imagesWithoutAlt.length} images sans alt text`)
        imagesWithoutAlt.forEach((img, index) => {
          const src = (img as HTMLImageElement).src
          console.log(`Image ${index + 1} sans alt:`, src.substring(src.lastIndexOf('/') + 1))
        })
      } else {
        const totalImages = document.querySelectorAll('img').length
        console.log(`✅ SEO: Toutes les images ont un alt text (${totalImages} images)`)
      }

      // ===============================
      // 5. LIENS ACCESSIBILITÉ
      // ===============================
      const linksWithoutTitle = document.querySelectorAll('a:not([title]):not([aria-label]):not([aria-labelledby])')
      if (linksWithoutTitle.length > 5) {
        console.warn(`🟡 SEO: ${linksWithoutTitle.length} liens sans title/aria-label`)
        // Affiche les 3 premiers exemples
        Array.from(linksWithoutTitle).slice(0, 3).forEach((link, index) => {
          console.log(`Lien ${index + 1}:`, (link as HTMLAnchorElement).href, '|', link.textContent?.substring(0, 30) + '...')
        })
      } else {
        console.log(`✅ SEO: Liens avec accessibilité OK (${linksWithoutTitle.length} liens sans attributs)`)
      }

      // ===============================
      // 6. STRUCTURE HEADING
      // ===============================
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
      const headingStructure = Array.from(headings).map(h => ({
        tag: h.tagName,
        text: h.textContent?.substring(0, 40) + '...'
      }))

      if (headings.length < 3) {
        console.warn(`🟡 SEO: Structure de headings pauvre (${headings.length} headings) - Plus de structure recommandée`)
      } else {
        console.log(`✅ SEO: Structure de headings (${headings.length} headings):`)
        headingStructure.slice(0, 5).forEach(h => console.log(`  ${h.tag}: ${h.text}`))
      }

      // ===============================
      // 7. CANONICAL URL
      // ===============================
      const canonical = document.querySelector('link[rel="canonical"]')
      if (!canonical) {
        console.warn('🟡 SEO: Balise canonical manquante')
      } else {
        console.log(`✅ SEO: URL canonique définie: ${canonical.getAttribute('href')}`)
      }

      // ===============================
      // 8. OPEN GRAPH
      // ===============================
      const ogTitle = document.querySelector('meta[property="og:title"]')
      const ogDesc = document.querySelector('meta[property="og:description"]')
      const ogImage = document.querySelector('meta[property="og:image"]')

      if (!ogTitle || !ogDesc || !ogImage) {
        console.warn('🟡 SEO: Métadonnées Open Graph incomplètes')
        if (!ogTitle) console.warn('  - og:title manquant')
        if (!ogDesc) console.warn('  - og:description manquant')
        if (!ogImage) console.warn('  - og:image manquant')
      } else {
        console.log('✅ SEO: Métadonnées Open Graph complètes')
      }

      // ===============================
      // 9. VITESSE DE CHARGEMENT
      // ===============================
      if (window.performance) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
        if (loadTime > 3000) {
          console.warn(`🟡 PERFORMANCE: Temps de chargement élevé (${loadTime}ms) - Optimisation recommandée`)
        } else {
          console.log(`✅ PERFORMANCE: Temps de chargement OK (${loadTime}ms)`)
        }
      }

      console.log('🏁 SEO Monitor: Audit terminé')
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Pas de rendu visuel
  return null
}

/**
 * Hook personnalisé pour le monitoring SEO
 * Peut être utilisé dans d'autres composants si nécessaire
 */
export function useSeoMonitoring(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || process.env.NODE_ENV !== 'development') return

    const checkSeoElements = () => {
      const issues = []

      // Meta description
      const metaDesc = document.querySelector('meta[name="description"]')
      if (!metaDesc || !metaDesc.getAttribute('content')) {
        issues.push('Meta description manquante')
      }

      // H1
      const h1Count = document.querySelectorAll('h1').length
      if (h1Count !== 1) {
        issues.push(`H1 invalide (${h1Count} trouvé(s))`)
      }

      // Images sans alt
      const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]').length
      if (imagesWithoutAlt > 0) {
        issues.push(`${imagesWithoutAlt} images sans alt`)
      }

      // Log les problèmes détectés
      if (issues.length > 0) {
        console.warn('🔴 SEO Issues:', issues)
      } else {
        console.log('✅ SEO: Aucun problème détecté')
      }
    }

    // Exécuter la vérification
    checkSeoElements()
  }, [enabled])
}