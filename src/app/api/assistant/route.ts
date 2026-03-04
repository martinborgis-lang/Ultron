import { logger } from '@/lib/logger';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { generateSQL, isGreetingOrNonQuery, getGreetingResponse } from '@/lib/assistant/sql-generator';
import { validateQuery, ensureOrganizationFilter } from '@/lib/assistant/sql-validator';
import { formatResponse, determineDataType } from '@/lib/assistant/result-formatter';
import { mcpSupabaseService } from '@/lib/services/mcp-supabase-service';
import type { AssistantRequest, AssistantResponse, ASSISTANT_ERROR_MESSAGES } from '@/types/assistant';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const context = await getCurrentUserAndOrganization();
    if (!context) {
      return NextResponse.json<AssistantResponse>(
        {
          response: "Veuillez vous reconnecter pour utiliser l'assistant.",
          error: 'AUTH_ERROR',
        },
        { status: 401 }
      );
    }

    const { organization } = context;

    // 2. Parse request
    const body: AssistantRequest = await request.json();
    const { message, conversationHistory } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json<AssistantResponse>(
        {
          response: 'Veuillez poser une question.',
          error: 'INVALID_REQUEST',
        },
        { status: 400 }
      );
    }

    const trimmedMessage = message.trim();

    // 3. Check if it's a greeting or non-query message
    if (isGreetingOrNonQuery(trimmedMessage)) {
      return NextResponse.json<AssistantResponse>({
        response: getGreetingResponse(trimmedMessage),
      });
    }

    // 4. Generate SQL with Claude
    let sql: string;
    try {
      const result = await generateSQL(trimmedMessage, conversationHistory);
      sql = result.sql;
    } catch (error) {
      console.error('SQL generation error:', error);
      return NextResponse.json<AssistantResponse>({
        response:
          "Je n'ai pas compris votre question. Pouvez-vous la reformuler?\n\nExemples de questions:\n- \"Montre moi les prospects chauds\"\n- \"Combien de RDV cette semaine?\"\n- \"Prospects sans conseiller assigne\"",
        error: 'SQL_GENERATION_ERROR',
      });
    }

    logger.debug('Generated SQL:', sql);

    // 5. Ensure organization filter is present
    sql = ensureOrganizationFilter(sql);

    // 6. Validate SQL for security
    const validation = validateQuery(sql);
    if (!validation.valid) {
      console.error('SQL validation failed:', validation.reason);
      return NextResponse.json<AssistantResponse>({
        response: `Je ne peux pas executer cette requete: ${validation.reason}`,
        error: 'VALIDATION_ERROR',
      });
    }

    // 7. Execute query with MCP Supabase Service (restricted by organization_id)
    let data: Record<string, unknown>[] = [];

    try {
      const result = await mcpSupabaseService.executeQuery({
        sql: sql,
        organizationId: organization.id
      });

      if (result.error) {
        logger.error('MCP query execution error:', result.error);
        return NextResponse.json<AssistantResponse>({
          response: `Erreur d'exécution: ${result.error}`,
          query: sql,
          error: 'EXECUTION_ERROR',
        });
      }

      data = result.data;
      logger.debug(`MCP query executed successfully: ${result.rowCount} rows in ${result.executionTime}ms`);
    } catch (error) {
      console.error('MCP service error:', error);
      return NextResponse.json<AssistantResponse>({
        response:
          "Une erreur s'est produite lors de la recherche. Veuillez reessayer avec une question plus simple.",
        query: sql,
        error: 'EXECUTION_ERROR',
      });
    }

    // 8. Format response
    const formattedResponse = await formatResponse(trimmedMessage, data, sql);
    const dataType = determineDataType(data);

    return NextResponse.json<AssistantResponse>({
      response: formattedResponse,
      query: sql,
      data: data,
      dataType: dataType,
    });
  } catch (error) {
    console.error('Assistant API error:', error);

    return NextResponse.json<AssistantResponse>(
      {
        response: "Une erreur inattendue s'est produite. Veuillez reessayer.",
        error: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

// Note: La fonction executeQueryDirectly a été remplacée par MCPSupabaseService
// qui offre une sécurité et des fonctionnalités améliorées avec restriction automatique par organization_id
