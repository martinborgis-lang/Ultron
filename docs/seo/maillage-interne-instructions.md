# Instructions de Maillage Interne Intelligent
## Agent 7 - Intégration Continue

*Guide pour maintenir et étendre le système de maillage optimisé*

---

## 🎯 Système Implémenté

### ✅ Composants Créés

1. **RelatedContent.tsx** (`/src/components/seo/RelatedContent.tsx`)
   - Composant intelligent de recommandations contextuelles
   - Base de données interne de 15+ contenus
   - Logique de priorité : Features → Blog → Comparatifs → Local
   - Ancres riches avec keywords métier

2. **Script de Validation** (`/src/scripts/validate-links.js`)
   - Analyse automatique de 178 fichiers .tsx
   - Détection de 219 liens internes
   - Scoring de qualité des ancres
   - Rapport détaillé en Markdown

### ✅ Optimisations Appliquées

1. **Homepage** (`/src/app/page.tsx`)
   - Navigation : "CRM Pipeline", "Assistant IA", "Blog CGP"
   - CTAs : "Essayez Ultron CRM gratuit", "Découvrir le CRM CGP intelligent"
   - Footer enrichi avec 3 colonnes structurées

2. **FeaturePageTemplate** (`/src/components/features/FeaturePageTemplate.tsx`)
   - Intégration RelatedContent automatique
   - Support currentPath pour maillage contextuel
   - CTAs personnalisés par feature

3. **Pages Features Mises à Jour**
   - `/features/crm` : currentPath + CTA "Essayer le CRM Pipeline"
   - `/features/ai-assistant` : currentPath + CTA "Essayer l'Assistant IA"

---

## 🔧 Instructions pour Nouvelles Pages

### 1. Nouvelles Pages Features

Quand vous créez une nouvelle page feature, suivez ce template :

```tsx
// /src/app/(public)/features/[feature-name]/page.tsx
import FeaturePageTemplate from '@/components/features/FeaturePageTemplate';

export default function FeaturePage() {
  return (
    <FeaturePageTemplate
      badge="Badge Métier"
      title="Titre avec Keywords"
      subtitle="Subtitle SEO optimisé"
      description="Description avec mots-clés pertinents"
      accentColor="#couleur"
      mockup={<MonMockup />}
      currentPath="/features/[feature-name]"      // ← OBLIGATOIRE pour maillage
      ctaText="Essayer [Feature] pour CGP"       // ← Ancre riche
      sections={[...]}
    />
  );
}
```

### 2. Articles Blog

Pour intégrer les articles blog dans le maillage :

```tsx
// Ajout dans RelatedContent.tsx - CONTENT_DATABASE
{
  title: 'Titre Article avec Keywords CGP',
  href: '/blog/slug-article',
  description: 'Description avec mots-clés et bénéfices métier pour CGP.',
  badge: 'Guide CGP',
  category: 'blog'
},
```

### 3. Pages CGP Locales

Structure recommandée pour pages villes :

```tsx
// /src/app/(public)/cgp-[ville]/page.tsx
import RelatedContent from '@/components/seo/RelatedContent';

export default function CGPVillePage() {
  return (
    <div>
      {/* Contenu principal */}

      {/* Maillage local intelligent */}
      <RelatedContent
        currentPage="/cgp-[ville]"
        category="local"
        maxItems={3}
        customItems={[
          {
            title: 'CRM pour CGP à [Ville]',
            href: '/features/crm',
            description: 'Optimisez votre prospection locale avec le CRM Ultron.',
            badge: 'CRM Local',
            category: 'feature'
          }
        ]}
      />
    </div>
  );
}
```

### 4. Pages Comparatives

Template pour pages vs concurrents :

```tsx
// /src/app/(public)/vs-[concurrent]/page.tsx
import RelatedContent from '@/components/seo/RelatedContent';

export default function ComparisonPage() {
  return (
    <div>
      {/* Contenu comparatif */}

      {/* Liens vers features différenciantes */}
      <RelatedContent
        currentPage="/vs-[concurrent]"
        category="comparison"
        maxItems={3}
        customItems={[
          {
            title: 'Pourquoi Ultron surpasse [Concurrent] pour CGP',
            href: '/features/crm',
            description: 'Découvrez les avantages spécifiques aux conseillers patrimoine.',
            badge: 'Avantage CGP',
            category: 'feature'
          }
        ]}
      />
    </div>
  );
}
```

---

## 📋 Checklist Maillage

### ✅ À Faire pour Chaque Nouvelle Page

1. **Ancres de liens** : Utiliser keywords métier (CGP, CRM, IA, etc.)
2. **RelatedContent** : Intégrer le composant avec currentPage
3. **CustomItems** : Ajouter contenus spécifiques si pertinent
4. **CTAs** : Ancres riches vers /register
5. **Meta descriptions** : Keywords en cohérence avec maillage

### ✅ Règles de Qualité

1. **Maximum 3-5 liens sortants** par page
2. **Ancres diversifiées** - pas de sur-optimisation
3. **Pertinence contextuelle** obligatoire
4. **Keywords naturels** dans les ancres
5. **Call-to-actions** vers conversion

### ✅ Validation Continue

Exécuter régulièrement le script de validation :
```bash
cd /c/Users/marti/ultron
node src/scripts/validate-links.js
```

**Objectifs de score :**
- Score ≥ 70/100 : Excellent maillage
- Score 50-69 : Bon, améliorations possibles
- Score < 50 : Optimisations nécessaires

---

## 🎯 Stratégie PageRank

### Distribution Intelligente

```
Homepage (PR 100%)
├── /features/* (PR 80%)
│   ├── RelatedContent → autres features (PR 60%)
│   ├── Liens blog contextuels (PR 40%)
│   └── CTAs vers conversion
├── /blog/* (PR 60%)
│   ├── Liens features mentionnées (PR 80%)
│   ├── Cross-articles related (PR 40%)
│   └── CTAs vers /register
├── /cgp-[ville]/* (PR 40%)
│   ├── Features locales (PR 60%)
│   ├── Articles régionaux (PR 40%)
│   └── Homepage (PR 100%)
└── /vs-[concurrent]/* (PR 40%)
    ├── Features différenciantes (PR 60%)
    └── Articles comparatifs (PR 40%)
```

### Flux de Conversion

1. **Homepage** → Features → Essai gratuit
2. **Blog** → Features → CTA conversion
3. **Comparatifs** → Features Ultron → Inscription
4. **Local** → Features + Blog → Contact/Demo

---

## 🚀 Prochaines Optimisations

### 1. Attente Agent 2 (Blog)
- [ ] Intégrer 15+ articles dans RelatedContent.tsx
- [ ] Créer maillage bidirectionnel articles ↔ features
- [ ] Optimiser ancres longue traîne

### 2. Attente Agent 6 (CGP Local)
- [ ] Ajouter liens hometown dans homepage
- [ ] Cross-linking géographique intelligent
- [ ] Mentions régionales dans blog

### 3. Analytics et Monitoring
- [ ] Google Analytics : tracking clics internes
- [ ] Search Console : position keywords maillage
- [ ] Heatmaps : parcours utilisateur optimisé

### 4. A/B Testing
- [ ] Tester différentes ancres CTAs
- [ ] Optimiser placement RelatedContent
- [ ] Mesurer impact conversion

---

## 🔗 Ressources et Liens

- **Script validation** : `/src/scripts/validate-links.js`
- **Composant principal** : `/src/components/seo/RelatedContent.tsx`
- **Template features** : `/src/components/features/FeaturePageTemplate.tsx`
- **Rapport actuel** : `/docs/seo/agent-7-linking-report.md`

---

*Instructions maintenues par l'Agent 7 - Maillage Interne Intelligent*
*Dernière mise à jour : 05/03/2026*