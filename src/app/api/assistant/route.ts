import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSQL, isGreetingOrNonQuery, getGreetingResponse } from '@/lib/assistant/sql-generator';
import { validateQuery, ensureOrganizationFilter } from '@/lib/assistant/sql-validator';
import { formatResponse, determineDataType } from '@/lib/assistant/result-formatter';
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

    console.log('Generated SQL:', sql);

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

    // 7. Execute query with parameterized organization_id
    const supabase = createAdminClient();
    let data: Record<string, unknown>[] = [];

    try {
      // Replace $1 with actual organization ID for execution
      // We use a raw query approach here
      const { data: queryResult, error: queryError } = await supabase.rpc(
        'execute_assistant_query',
        {
          query_text: sql,
          org_id: organization.id,
        }
      );

      if (queryError) {
        // If RPC doesn't exist, fall back to direct query approach
        console.log('RPC not available, using direct query approach');

        // Parse the SQL and manually replace $1 with the organization ID
        // This is safe because we've already validated the query
        const executableSQL = sql.replace(/\$1/g, `'${organization.id}'`);

        // Use raw SQL through a different approach
        // Since Supabase doesn't have a direct raw query method for arbitrary SQL,
        // we'll need to use a different approach based on the query structure

        // For now, let's try to execute common patterns directly
        const result = await executeQueryDirectly(supabase, sql, organization.id);
        data = result;
      } else {
        data = queryResult || [];
      }
    } catch (error) {
      console.error('Query execution error:', error);

      // Try the direct query approach as fallback
      try {
        const result = await executeQueryDirectly(supabase, sql, organization.id);
        data = result;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return NextResponse.json<AssistantResponse>({
          response:
            "Une erreur s'est produite lors de la recherche. Veuillez reessayer avec une question plus simple.",
          query: sql,
          error: 'EXECUTION_ERROR',
        });
      }
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

/**
 * Execute query directly using Supabase query builder
 * This is a fallback when RPC is not available
 */
async function executeQueryDirectly(
  supabase: ReturnType<typeof createAdminClient>,
  sql: string,
  organizationId: string
): Promise<Record<string, unknown>[]> {
  // Parse the SQL to determine which table and what filters to apply
  const lowerSQL = sql.toLowerCase();

  // Detect the main table
  const fromMatch = sql.match(/from\s+([a-z_]+)/i);
  const tableName = fromMatch ? fromMatch[1] : null;

  if (!tableName) {
    throw new Error('Could not determine table from query');
  }

  // Build a basic query
  let query = supabase.from(tableName).select('*').eq('organization_id', organizationId);

  // Try to extract LIMIT
  const limitMatch = sql.match(/limit\s+(\d+)/i);
  const limit = limitMatch ? parseInt(limitMatch[1], 10) : 50;
  query = query.limit(limit);

  // Try to extract ORDER BY
  const orderMatch = sql.match(/order\s+by\s+([a-z_]+)(?:\s+(asc|desc))?/i);
  if (orderMatch) {
    const orderColumn = orderMatch[1];
    const orderDir = orderMatch[2]?.toLowerCase() === 'asc';
    query = query.order(orderColumn, { ascending: orderDir });
  }

  // Try to extract simple WHERE conditions for qualification
  if (lowerSQL.includes("qualification") && lowerSQL.includes("'chaud'")) {
    query = query.eq('qualification', 'chaud');
  } else if (lowerSQL.includes("qualification") && lowerSQL.includes("'tiede'")) {
    query = query.eq('qualification', 'tiede');
  } else if (lowerSQL.includes("qualification") && lowerSQL.includes("'froid'")) {
    query = query.eq('qualification', 'froid');
  }

  // Check for assigned_to IS NULL
  if (lowerSQL.includes('assigned_to is null')) {
    query = query.is('assigned_to', null);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data || [];
}
