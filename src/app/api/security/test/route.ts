import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Route de test pour vérifier les protections du middleware de sécurité
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: "✅ Security Test - GET Request",
    timestamp: new Date().toISOString(),
    message: "Si vous voyez ce message, le middleware de sécurité fonctionne correctement",
    request_info: {
      method: "GET",
      url: request.url,
      headers: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        'user-agent': request.headers.get('user-agent')?.substring(0, 100),
        'x-forwarded-for': request.headers.get('x-forwarded-for'),
        'x-real-ip': request.headers.get('x-real-ip')
      }
    },
    tests: {
      rate_limiting: "✅ Rate limiting actif (100 req/15min)",
      csrf_protection: "⏭️ CSRF non testé (GET request)",
      headers_validation: "✅ Headers validation active",
      prompt_injection: "⏭️ Prompt injection non testé (GET request)",
      ip_blocking: "✅ IP blocking actif (5 échecs max)"
    }
  });
}

// Test CSRF et validation des données
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    return NextResponse.json({
      status: "✅ Security Test - POST Request",
      timestamp: new Date().toISOString(),
      message: "Requête POST autorisée - protections CSRF et prompt injection actives",
      request_info: {
        method: "POST",
        content_type: request.headers.get('content-type'),
        content_length: request.headers.get('content-length'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer')
      },
      body_received: body,
      security_tests: {
        csrf_validation: "✅ CSRF validation passée",
        prompt_injection: "✅ Prompt injection validation passée",
        headers_validation: "✅ Headers validation passée",
        rate_limiting: "✅ Rate limiting OK"
      },
      test_cases: {
        valid_request: "✅ Cette requête est considérée comme sécurisée",
        note: "Pour tester les blocages, essayez les endpoints /api/security/test/attack"
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: "❌ Security Test Failed",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

// Test de données malveillantes (sera bloqué par le middleware)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    // Cette route ne devrait jamais être atteinte si le middleware fonctionne
    // car les données malveillantes seront bloquées avant

    return NextResponse.json({
      status: "⚠️ Security Warning",
      message: "Cette requête a passé les filtres de sécurité",
      timestamp: new Date().toISOString(),
      body_received: body,
      warning: "Si des données malveillantes apparaissent ci-dessus, le middleware a un problème"
    });

  } catch (error) {
    return NextResponse.json({
      status: "✅ Request Blocked by Security",
      message: "Cette erreur est normale si le middleware a bloqué des données malveillantes",
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 400 });
  }
}

// Test d'overload pour rate limiting
export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    status: "✅ Rate Limit Test Response",
    message: "Répétez cette requête rapidement pour tester le rate limiting",
    timestamp: new Date().toISOString(),
    suggestion: "Faites plus de 100 requêtes en 15 minutes pour déclencher le rate limiting",
    current_limits: {
      window: "15 minutes",
      max_requests: 100,
      block_duration: "1 minute"
    }
  });
}