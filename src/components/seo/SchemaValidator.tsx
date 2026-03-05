'use client'

import { useEffect } from 'react'

/**
 * SchemaValidator - Validateur de données structurées JSON-LD
 *
 * Valide automatiquement les schemas JSON-LD présents sur la page
 * et affiche des warnings en cas de problèmes de structure ou de contenu.
 *
 * Validations incluses :
 * - Présence @context et @type
 * - URLs absolues pour les propriétés requises
 * - Structure JSON valide
 * - Types de schemas recommandés pour le SEO
 * - Propriétés requises par type de schema
 */
export function SchemaValidator() {
  useEffect(() => {
    // N'exécute que en mode développement
    if (process.env.NODE_ENV !== 'development') return

    const timer = setTimeout(() => {
      console.log('🔍 Schema Validator: Début de la validation...')

      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]')

      if (jsonLdScripts.length === 0) {
        console.warn('🟡 Schema: Aucun script JSON-LD trouvé - Recommandé pour le SEO')
        return
      }

      console.log(`📄 Schema: ${jsonLdScripts.length} script(s) JSON-LD trouvé(s)`)

      jsonLdScripts.forEach((script, index) => {
        try {
          const data = JSON.parse(script.innerHTML)
          console.log(`\n🔍 Validation Schema ${index + 1}:`)

          // ===============================
          // 1. VALIDATIONS BASIQUES
          // ===============================
          const warnings = []
          const errors = []

          if (!data['@context']) {
            errors.push('@context manquant')
          } else if (!data['@context'].includes('schema.org')) {
            warnings.push('@context ne contient pas schema.org')
          }

          if (!data['@type']) {
            errors.push('@type manquant')
          }

          // ===============================
          // 2. VALIDATION DES URLS
          // ===============================
          const urlFields = ['url', 'logo', 'image', 'sameAs', 'mainEntityOfPage']
          urlFields.forEach(field => {
            const value = data[field]
            if (value) {
              // Vérification URL absolue
              if (typeof value === 'string' && !value.startsWith('http')) {
                warnings.push(`${field} doit être une URL absolue (reçu: ${value})`)
              }
              // Vérification array d'URLs
              if (Array.isArray(value)) {
                value.forEach((item, i) => {
                  if (typeof item === 'string' && !item.startsWith('http')) {
                    warnings.push(`${field}[${i}] doit être une URL absolue (reçu: ${item})`)
                  }
                })
              }
            }
          })

          // ===============================
          // 3. VALIDATIONS PAR TYPE
          // ===============================
          const schemaType = data['@type']
          console.log(`📋 Type: ${schemaType}`)

          switch (schemaType) {
            case 'SoftwareApplication':
              validateSoftwareApplication(data, warnings, errors)
              break
            case 'Organization':
              validateOrganization(data, warnings, errors)
              break
            case 'WebSite':
              validateWebSite(data, warnings, errors)
              break
            case 'WebPage':
              validateWebPage(data, warnings, errors)
              break
            case 'Article':
            case 'BlogPosting':
              validateArticle(data, warnings, errors)
              break
            case 'FAQPage':
              validateFAQPage(data, warnings, errors)
              break
            case 'BreadcrumbList':
              validateBreadcrumbList(data, warnings, errors)
              break
            default:
              warnings.push(`Type de schema ${schemaType} non reconnu pour validation spécifique`)
          }

          // ===============================
          // 4. AFFICHAGE RÉSULTATS
          // ===============================
          if (errors.length > 0) {
            console.error(`🔴 Schema ${index + 1}: ${errors.length} erreur(s) critique(s)`)
            errors.forEach(error => console.error(`  ❌ ${error}`))
          }

          if (warnings.length > 0) {
            console.warn(`🟡 Schema ${index + 1}: ${warnings.length} avertissement(s)`)
            warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`))
          }

          if (errors.length === 0 && warnings.length === 0) {
            console.log(`✅ Schema ${index + 1} (${schemaType}): Validation réussie`)
          }

          // Affichage des propriétés principales
          console.log(`📊 Propriétés trouvées:`, Object.keys(data).filter(key => !key.startsWith('@')))

        } catch (e) {
          console.error(`🔴 Schema ${index + 1}: JSON invalide`, e)
          console.log('Contenu du script:', script.innerHTML.substring(0, 200) + '...')
        }
      })

      console.log('🏁 Schema Validator: Validation terminée\n')
    }, 1500) // Délai après SeoMonitor

    return () => clearTimeout(timer)
  }, [])

  return null
}

// ===============================
// FONCTIONS DE VALIDATION PAR TYPE
// ===============================

function validateSoftwareApplication(data: any, warnings: string[], errors: string[]) {
  // Propriétés requises
  const required = ['name', 'description', 'applicationCategory']
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`SoftwareApplication: ${field} requis`)
    }
  })

  // Propriétés recommandées
  const recommended = ['operatingSystem', 'offers', 'aggregateRating']
  recommended.forEach(field => {
    if (!data[field]) {
      warnings.push(`SoftwareApplication: ${field} recommandé pour meilleur SEO`)
    }
  })

  // Validation de l'offre
  if (data.offers && !data.offers.price) {
    warnings.push('SoftwareApplication: offers.price recommandé')
  }

  // Validation du rating
  if (data.aggregateRating) {
    if (!data.aggregateRating.ratingValue || !data.aggregateRating.ratingCount) {
      warnings.push('SoftwareApplication: aggregateRating incomplet (ratingValue et ratingCount requis)')
    }
  }
}

function validateOrganization(data: any, warnings: string[], errors: string[]) {
  const required = ['name', 'url']
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`Organization: ${field} requis`)
    }
  })

  const recommended = ['logo', 'description', 'address', 'telephone', 'email']
  recommended.forEach(field => {
    if (!data[field]) {
      warnings.push(`Organization: ${field} recommandé`)
    }
  })
}

function validateWebSite(data: any, warnings: string[], errors: string[]) {
  const required = ['name', 'url']
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`WebSite: ${field} requis`)
    }
  })

  if (data.potentialAction && data.potentialAction['@type'] === 'SearchAction') {
    if (!data.potentialAction.target) {
      warnings.push('WebSite: SearchAction.target manquant pour la recherche site')
    }
  }
}

function validateWebPage(data: any, warnings: string[], errors: string[]) {
  const required = ['name', 'url']
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`WebPage: ${field} requis`)
    }
  })

  const recommended = ['description', 'breadcrumb']
  recommended.forEach(field => {
    if (!data[field]) {
      warnings.push(`WebPage: ${field} recommandé`)
    }
  })
}

function validateArticle(data: any, warnings: string[], errors: string[]) {
  const required = ['headline', 'author', 'datePublished']
  required.forEach(field => {
    if (!data[field]) {
      errors.push(`Article: ${field} requis`)
    }
  })

  const recommended = ['image', 'dateModified', 'publisher', 'mainEntityOfPage']
  recommended.forEach(field => {
    if (!data[field]) {
      warnings.push(`Article: ${field} recommandé`)
    }
  })

  // Validation des dates
  if (data.datePublished && data.dateModified) {
    const published = new Date(data.datePublished)
    const modified = new Date(data.dateModified)
    if (modified < published) {
      warnings.push('Article: dateModified ne peut pas être antérieure à datePublished')
    }
  }
}

function validateFAQPage(data: any, warnings: string[], errors: string[]) {
  if (!data.mainEntity || !Array.isArray(data.mainEntity)) {
    errors.push('FAQPage: mainEntity array requis')
    return
  }

  data.mainEntity.forEach((faq: any, index: number) => {
    if (faq['@type'] !== 'Question') {
      errors.push(`FAQPage: mainEntity[${index}] doit être de type Question`)
    }
    if (!faq.name) {
      errors.push(`FAQPage: mainEntity[${index}].name (question) requis`)
    }
    if (!faq.acceptedAnswer || faq.acceptedAnswer['@type'] !== 'Answer') {
      errors.push(`FAQPage: mainEntity[${index}].acceptedAnswer de type Answer requis`)
    }
    if (faq.acceptedAnswer && !faq.acceptedAnswer.text) {
      errors.push(`FAQPage: mainEntity[${index}].acceptedAnswer.text requis`)
    }
  })
}

function validateBreadcrumbList(data: any, warnings: string[], errors: string[]) {
  if (!data.itemListElement || !Array.isArray(data.itemListElement)) {
    errors.push('BreadcrumbList: itemListElement array requis')
    return
  }

  data.itemListElement.forEach((item: any, index: number) => {
    if (item['@type'] !== 'ListItem') {
      errors.push(`BreadcrumbList: itemListElement[${index}] doit être de type ListItem`)
    }
    if (!item.position) {
      errors.push(`BreadcrumbList: itemListElement[${index}].position requis`)
    }
    if (!item.name && !item.item) {
      errors.push(`BreadcrumbList: itemListElement[${index}] doit avoir name ou item`)
    }
  })
}

/**
 * Hook pour validation de schemas spécifiques
 */
export function useSchemaValidation(schemaData: any, schemaType: string) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return

    const warnings: string[] = []
    const errors: string[] = []

    switch (schemaType) {
      case 'SoftwareApplication':
        validateSoftwareApplication(schemaData, warnings, errors)
        break
      case 'Organization':
        validateOrganization(schemaData, warnings, errors)
        break
      // Ajouter d'autres types selon besoin
    }

    if (errors.length > 0 || warnings.length > 0) {
      console.group(`🔍 Validation Schema ${schemaType}`)
      errors.forEach(error => console.error(`❌ ${error}`))
      warnings.forEach(warning => console.warn(`⚠️ ${warning}`))
      console.groupEnd()
    }
  }, [schemaData, schemaType])
}