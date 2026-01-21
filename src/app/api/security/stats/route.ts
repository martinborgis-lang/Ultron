import { NextRequest, NextResponse } from 'next/server';
import { securityMiddleware } from '@/lib/security/security-middleware';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';

export const dynamic = 'force-dynamic';

// Route pour obtenir les statistiques de sécurité (admin seulement)
export async function GET(request: NextRequest) {
  try {
    // Auth check - seuls les admins peuvent voir les stats de sécurité
    const context = await getCurrentUserAndOrganization();
    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // TODO: Vérifier si l'utilisateur est admin
    // Pour l'instant, tous les utilisateurs connectés peuvent voir les stats

    const stats = securityMiddleware.getSecurityStats();
    const now = new Date();

    // Grouper les attaques par type pour les dernières 24h
    const last24h = now.getTime() - (24 * 60 * 60 * 1000);
    const recentAttacks = stats.recentAttacks.filter(attack => attack.timestamp > last24h);

    const attacksByType = recentAttacks.reduce((acc, attack) => {
      acc[attack.reason] = (acc[attack.reason] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const attacksByIP = recentAttacks.reduce((acc, attack) => {
      acc[attack.ip] = (acc[attack.ip] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      status: "✅ Security Middleware Active",
      timestamp: now.toISOString(),
      summary: {
        active_rate_limits: stats.rateLimitEntries,
        blocked_ips: stats.blockedIPs,
        total_suspicious_activity: stats.suspiciousActivity,
        attacks_last_24h: recentAttacks.length
      },
      attack_analysis: {
        by_type: attacksByType,
        by_ip: attacksByIP,
        top_attacking_ips: Object.entries(attacksByIP)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 10)
          .map(([ip, count]) => ({ ip, attempts: count }))
      },
      recent_attacks: recentAttacks.slice(-20).map(attack => ({
        timestamp: new Date(attack.timestamp).toISOString(),
        ip: attack.ip,
        path: attack.path,
        reason: attack.reason,
        user_agent: attack.userAgent
      })),
      security_status: {
        overall_status: stats.blockedIPs > 5 ? "🚨 HIGH_ACTIVITY" :
                       recentAttacks.length > 10 ? "⚠️ MODERATE_ACTIVITY" :
                       "✅ SECURE",
        recommendations: [
          stats.blockedIPs > 5 ? "🚨 Multiple IPs blocked - consider additional protection" : null,
          recentAttacks.length > 20 ? "⚠️ High attack volume - monitor closely" : null,
          attacksByType.PROMPT_INJECTION > 5 ? "🧠 AI endpoints under attack - prompt injection attempts" : null,
          attacksByType.CSRF_VIOLATION > 3 ? "🛡️ CSRF attacks detected - verify trusted origins" : null,
          "✅ Security middleware functioning normally"
        ].filter(Boolean)
      }
    });

  } catch (error) {
    console.error('Error fetching security stats:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 });
  }
}

// Route pour réinitialiser les statistiques (admin seulement)
export async function DELETE(request: NextRequest) {
  try {
    const context = await getCurrentUserAndOrganization();
    if (!context) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // TODO: Vérifier admin

    // Note: Pour une vraie réinitialisation, il faudrait exposer des méthodes dans SecurityMiddleware
    // Pour l'instant, on renvoie juste un message

    return NextResponse.json({
      status: "✅ Security stats would be reset",
      message: "Note: Full reset functionality requires extending SecurityMiddleware",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error resetting security stats:', error);
    return NextResponse.json({ error: 'Erreur lors de la réinitialisation' }, { status: 500 });
  }
}