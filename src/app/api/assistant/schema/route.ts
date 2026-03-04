import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { mcpSupabaseService } from '@/lib/services/mcp-supabase-service';
import type { TableSchema } from '@/lib/services/mcp-supabase-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/assistant/schema
 * Retourne le schéma des tables disponibles pour l'assistant IA
 * Restreint à l'organisation de l'utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    // Vérification auth
    const context = await getCurrentUserAndOrganization();
    if (!context) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Obtenir le schéma des tables autorisées
    const schema = await mcpSupabaseService.getSchema();

    return NextResponse.json({
      schema,
      organization: {
        id: context.organization.id,
        name: context.organization.name
      },
      suggestions: mcpSupabaseService.getSuggestions()
    });
  } catch (error) {
    console.error('Schema API error:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération du schéma' },
      { status: 500 }
    );
  }
}