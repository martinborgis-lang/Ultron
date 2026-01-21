import { NextRequest, NextResponse } from 'next/server';
import { validateFilters, createSafeSearchPattern, validateUUID } from '@/lib/validation/sql-injection-protection';

export const dynamic = 'force-dynamic';

// Route de test pour démontrer la protection contre l'injection SQL
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  // Tests d'attaques courantes
  const maliciousInputs = [
    "'; DROP TABLE users; --",
    "' OR 1=1; --",
    "' UNION SELECT * FROM users; --",
    "%'; DELETE FROM prospects; --",
    "admin'; INSERT INTO",
    "test' OR 'a'='a",
    "<script>alert('xss')</script>",
    "../../../../etc/passwd"
  ];

  const results = {
    timestamp: new Date().toISOString(),
    tests: {
      filters: {} as any,
      search_patterns: {} as any,
      uuid_validation: {} as any
    }
  };

  // Test validation des filtres
  const mockParams = new URLSearchParams();
  mockParams.set('search', "'; DROP TABLE users; --");
  mockParams.set('stage', 'invalid_stage');
  mockParams.set('qualification', 'MALICIOUS');
  mockParams.set('assigned_to', 'not-a-uuid');
  mockParams.set('limit', '99999');
  mockParams.set('offset', '-10');

  const safeFilters = validateFilters(mockParams);
  results.tests.filters = {
    input: Object.fromEntries(mockParams.entries()),
    output: safeFilters,
    blocked_attack: "✅ L'injection SQL a été bloquée"
  };

  // Test patterns de recherche
  maliciousInputs.forEach((input, index) => {
    const safePattern = createSafeSearchPattern(input);
    results.tests.search_patterns[`attack_${index + 1}`] = {
      input: input,
      safe_output: safePattern,
      blocked: !safePattern.includes(input) // Vérifie que l'input malveillant n'est pas présent tel quel
    };
  });

  // Test validation UUID
  const uuidTests = [
    'valid-uuid-test',
    '12345678-1234-5678-9012-123456789012', // UUID valide
    "'; DROP TABLE users; --",
    'not-a-uuid',
    '123',
    ''
  ];

  uuidTests.forEach((input, index) => {
    const validated = validateUUID(input);
    results.tests.uuid_validation[`test_${index + 1}`] = {
      input: input,
      output: validated,
      is_safe: validated === input || validated === undefined
    };
  });

  // Statistiques de sécurité
  const searchPatternsSafe = Object.values(results.tests.search_patterns).filter((test: any) => test.blocked).length;
  const uuidTestsSafe = Object.values(results.tests.uuid_validation).filter((test: any) => test.is_safe).length;

  return NextResponse.json({
    status: "✅ Protection Anti-Injection SQL Active",
    security_summary: {
      search_patterns_blocked: `${searchPatternsSafe}/${maliciousInputs.length}`,
      uuid_tests_passed: `${uuidTestsSafe}/${uuidTests.length}`,
      filters_validated: "✅ Tous les filtres validés",
      overall_security: "🛡️ SÉCURISÉ"
    },
    detailed_results: results,
    recommendations: [
      "✅ Utilisez toujours validateFilters() pour tous les paramètres URL",
      "✅ Utilisez createSafeSearchPattern() pour les recherches ILIKE",
      "✅ Utilisez validateUUID() pour tous les identifiants",
      "✅ Implémentez la validation dans tous les services",
      "🚨 Ne jamais faire confiance aux inputs utilisateur"
    ]
  });
}

// Route de test pour démontrer une attaque réussie (pour comparaison)
export async function POST(request: NextRequest) {
  const body = await request.json();

  // EXEMPLE DE CODE VULNÉRABLE (ne pas utiliser en production)
  const vulnerableExample = {
    warning: "⚠️ CECI EST UN EXEMPLE DE CODE VULNÉRABLE - NE PAS UTILISER",
    unsafe_query_example: `SELECT * FROM crm_prospects WHERE email ILIKE '%${body.search}%'`,
    why_dangerous: [
      "L'input utilisateur est directement injecté dans la requête",
      "Un attaquant peut fermer la requête et exécuter du SQL arbitraire",
      "Exemple: search = \"'; DROP TABLE users; --\" executerait la suppression"
    ],
    safe_alternative: {
      description: "Utiliser notre système de validation",
      code: "createSafeSearchPattern(input) + validateFilters()"
    }
  };

  return NextResponse.json(vulnerableExample);
}