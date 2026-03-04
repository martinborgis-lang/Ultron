/**
 * Service MCP Supabase local pour l'assistant IA d'Ultron
 * Restreint automatiquement à l'organization_id de l'utilisateur
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export interface MCPQuery {
  sql: string;
  organizationId: string;
  params?: Record<string, any>;
}

export interface MCPResult {
  data: Record<string, any>[];
  error?: string;
  rowCount: number;
  executionTime: number;
}

export interface TableSchema {
  tableName: string;
  columns: {
    name: string;
    type: string;
    nullable: boolean;
    description?: string;
  }[];
  relationships?: {
    table: string;
    column: string;
    foreignColumn: string;
  }[];
}

/**
 * Service MCP Supabase local avec restriction organization_id
 */
export class MCPSupabaseService {
  private supabase = createAdminClient();

  /**
   * Tables autorisées pour l'assistant avec description métier CGP
   */
  private readonly ALLOWED_TABLES = {
    // Tables principales CRM
    'crm_prospects': {
      description: 'Prospects et clients du cabinet de gestion de patrimoine',
      columns: {
        'first_name': 'Prénom du prospect',
        'last_name': 'Nom de famille',
        'email': 'Adresse email',
        'phone': 'Numéro de téléphone',
        'qualification': 'Qualification IA (CHAUD, TIEDE, FROID, non_qualifie)',
        'score_ia': 'Score de qualification IA (0-100)',
        'stage_slug': 'Étape du pipeline (nouveau, rdv_pris, etc.)',
        'patrimoine_estime': 'Patrimoine estimé en euros',
        'revenus_annuels': 'Revenus annuels en euros',
        'situation_familiale': 'Situation familiale (célibataire, marié, etc.)',
        'nb_enfants': 'Nombre d\'enfants',
        'age': 'Âge du prospect',
        'profession': 'Profession du prospect',
        'deal_value': 'Valeur estimée du deal en euros',
        'assigned_to': 'Conseiller assigné (ID)',
        'source': 'Source du prospect',
        'notes': 'Notes libres',
        'created_at': 'Date de création',
        'last_activity_at': 'Dernière activité'
      }
    },
    'crm_activities': {
      description: 'Historique des interactions avec les prospects',
      columns: {
        'type': 'Type d\'activité (call, email, meeting, note)',
        'subject': 'Sujet de l\'activité',
        'content': 'Contenu/description',
        'prospect_id': 'ID du prospect concerné',
        'user_id': 'ID du conseiller',
        'duration_minutes': 'Durée en minutes (pour calls/meetings)',
        'outcome': 'Résultat de l\'activité',
        'created_at': 'Date de création'
      }
    },
    'crm_events': {
      description: 'Événements et tâches du planning',
      columns: {
        'title': 'Titre de l\'événement',
        'type': 'Type (task, call, meeting, reminder)',
        'status': 'Statut (pending, completed, cancelled)',
        'prospect_id': 'ID du prospect concerné',
        'start_date': 'Date/heure de début',
        'due_date': 'Date d\'échéance',
        'assigned_to': 'Conseiller assigné',
        'priority': 'Priorité (low, medium, high, urgent)',
        'completed_at': 'Date de complétion'
      }
    },
    'users': {
      description: 'Conseillers de l\'organisation',
      columns: {
        'full_name': 'Nom complet du conseiller',
        'email': 'Email du conseiller',
        'role': 'Rôle (admin, conseiller)',
        'is_active': 'Conseiller actif',
        'created_at': 'Date d\'inscription'
      }
    },
    'deal_products': {
      description: 'Produits vendus par prospect',
      columns: {
        'prospect_id': 'ID du prospect',
        'product_id': 'ID du produit vendu',
        'advisor_id': 'ID du conseiller vendeur',
        'client_amount': 'Montant investi par le client',
        'company_revenue': 'Chiffre d\'affaires généré pour l\'entreprise',
        'advisor_commission': 'Commission du conseiller',
        'closed_at': 'Date de clôture',
        'notes': 'Notes sur la vente'
      }
    },
    'products': {
      description: 'Catalogue des produits du cabinet',
      columns: {
        'name': 'Nom du produit',
        'description': 'Description du produit',
        'type': 'Type (fixed ou commission)',
        'category': 'Catégorie métier',
        'fixed_value': 'Valeur fixe (pour type fixed)',
        'commission_rate': 'Taux de commission (pour type commission)',
        'is_active': 'Produit actif'
      }
    },
    'meeting_transcripts': {
      description: 'Transcriptions et analyses IA des meetings',
      columns: {
        'prospect_id': 'ID du prospect concerné',
        'meeting_date': 'Date du meeting',
        'duration_seconds': 'Durée en secondes',
        'transcript_text': 'Transcription complète',
        'ai_summary': 'Résumé IA du meeting',
        'key_points': 'Points clés (JSON)',
        'objections_detected': 'Objections détectées (JSON)',
        'next_actions': 'Prochaines actions suggérées (JSON)'
      }
    },
    'voice_calls': {
      description: 'Appels téléphoniques WebRTC',
      columns: {
        'prospect_id': 'ID du prospect appelé',
        'phone_number': 'Numéro appelé',
        'status': 'Statut de l\'appel',
        'outcome': 'Résultat de l\'appel',
        'duration_seconds': 'Durée en secondes',
        'notes': 'Notes de l\'appel',
        'next_action': 'Prochaine action suggérée',
        'started_at': 'Heure de début',
        'ended_at': 'Heure de fin'
      }
    },
    'phone_calls': {
      description: 'Appels automatiques agent IA vocal',
      columns: {
        'prospect_id': 'ID du prospect appelé',
        'to_number': 'Numéro appelé',
        'status': 'Statut (completed, failed, etc.)',
        'outcome': 'Résultat (appointment_booked, not_interested, etc.)',
        'transcript': 'Transcription de l\'appel',
        'qualification_result': 'Résultat qualification IA',
        'appointment_date': 'Date RDV pris',
        'duration_seconds': 'Durée en secondes',
        'answered': 'Appel décroché'
      }
    }
  };

  /**
   * Obtenir le schéma des tables autorisées
   */
  async getSchema(): Promise<TableSchema[]> {
    return Object.entries(this.ALLOWED_TABLES).map(([tableName, config]) => ({
      tableName,
      columns: Object.entries(config.columns).map(([name, description]) => ({
        name,
        type: 'unknown', // Sera complété par introspection si nécessaire
        nullable: true,
        description
      }))
    }));
  }

  /**
   * Valider qu'une requête SQL est autorisée et sécurisée
   */
  private validateQuery(sql: string, organizationId: string): { valid: boolean; reason?: string } {
    const lowerSQL = sql.toLowerCase().trim();

    // Seulement SELECT autorisé
    if (!lowerSQL.startsWith('select')) {
      return { valid: false, reason: 'Seules les requêtes SELECT sont autorisées' };
    }

    // Vérifier que organization_id est dans la requête
    if (!lowerSQL.includes('organization_id')) {
      return { valid: false, reason: 'La requête doit filtrer par organization_id' };
    }

    // Vérifier les tables autorisées
    const tablePattern = /from\s+([a-z_]+)/g;
    let match;
    while ((match = tablePattern.exec(lowerSQL)) !== null) {
      const tableName = match[1];
      if (!this.ALLOWED_TABLES[tableName as keyof typeof this.ALLOWED_TABLES]) {
        return { valid: false, reason: `Table '${tableName}' non autorisée` };
      }
    }

    // Interdire les sous-requêtes complexes
    if (lowerSQL.includes('(select')) {
      return { valid: false, reason: 'Les sous-requêtes ne sont pas autorisées' };
    }

    // Interdire les fonctions système dangereuses
    const dangerousFunctions = ['pg_', 'information_schema', 'pg_stat_', 'current_user'];
    for (const func of dangerousFunctions) {
      if (lowerSQL.includes(func)) {
        return { valid: false, reason: `Fonction '${func}' non autorisée` };
      }
    }

    return { valid: true };
  }

  /**
   * Exécuter une requête SQL avec restriction organization_id
   */
  async executeQuery(query: MCPQuery): Promise<MCPResult> {
    const startTime = Date.now();

    try {
      // Validation de sécurité
      const validation = this.validateQuery(query.sql, query.organizationId);
      if (!validation.valid) {
        return {
          data: [],
          error: validation.reason,
          rowCount: 0,
          executionTime: Date.now() - startTime
        };
      }

      // S'assurer que l'organization_id est dans la requête
      let sql = query.sql;
      if (!sql.toLowerCase().includes('organization_id =')) {
        // Ajouter le filtre organization_id s'il n'est pas présent
        const whereKeyword = sql.toLowerCase().includes('where') ? 'AND' : 'WHERE';
        sql = sql.replace(/;?\s*$/, ` ${whereKeyword} organization_id = '${query.organizationId}'`);
      }

      // Remplacer les paramètres nommés
      if (query.params) {
        for (const [key, value] of Object.entries(query.params)) {
          const placeholder = new RegExp(`\\$${key}\\b`, 'gi');
          const sqlValue = typeof value === 'string' ? `'${value.replace(/'/g, "''")}'` : String(value);
          sql = sql.replace(placeholder, sqlValue);
        }
      }

      logger.debug('Executing MCP query:', sql);

      // Utiliser rpc pour exécuter la requête SQL brute (si disponible)
      try {
        const { data, error } = await this.supabase.rpc('execute_raw_sql', {
          sql_query: sql
        });

        if (error) {
          throw new Error(error.message || 'Erreur d\'exécution SQL');
        }

        return {
          data: data || [],
          rowCount: data?.length || 0,
          executionTime: Date.now() - startTime
        };
      } catch (rpcError) {
        // Fallback vers l'approche query builder existante
        logger.debug('RPC failed, using query builder fallback');

        const result = await this.executeWithQueryBuilder(sql, query.organizationId);
        return {
          data: result,
          rowCount: result.length,
          executionTime: Date.now() - startTime
        };
      }
    } catch (error) {
      logger.error('MCP query execution error:', error);
      return {
        data: [],
        error: error instanceof Error ? error.message : 'Erreur d\'exécution inconnue',
        rowCount: 0,
        executionTime: Date.now() - startTime
      };
    }
  }

  /**
   * Fallback avec query builder Supabase (code existant amélioré)
   */
  private async executeWithQueryBuilder(sql: string, organizationId: string): Promise<Record<string, any>[]> {
    const lowerSQL = sql.toLowerCase();

    // Détecter la table principale
    const fromMatch = sql.match(/from\s+([a-z_]+)/i);
    const tableName = fromMatch ? fromMatch[1] : null;

    if (!tableName || !this.ALLOWED_TABLES[tableName as keyof typeof this.ALLOWED_TABLES]) {
      throw new Error(`Table '${tableName}' non autorisée ou non trouvée`);
    }

    // Extraire les colonnes SELECT
    const selectMatch = sql.match(/select\s+([\s\S]+?)\s+from/i);
    let selectColumns = '*';

    if (selectMatch) {
      const rawSelect = selectMatch[1].trim();

      // Gérer COUNT(*) et autres agrégats
      if (rawSelect.toLowerCase().includes('count(')) {
        // Pour les COUNT, on fait une requête normale puis on compte
        const { data, error } = await this.supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', organizationId);

        if (error) throw error;

        return [{ count: data?.length || 0 }];
      } else {
        selectColumns = rawSelect === '*' ? '*' : rawSelect;
      }
    }

    // Construire la requête de base
    let query = this.supabase
      .from(tableName)
      .select(selectColumns)
      .eq('organization_id', organizationId);

    // Ajouter les filtres WHERE
    query = this.addWhereConditions(query, lowerSQL);

    // Ajouter ORDER BY
    query = this.addOrderBy(query, sql);

    // Ajouter LIMIT
    const limitMatch = sql.match(/limit\s+(\d+)/i);
    const limit = limitMatch ? parseInt(limitMatch[1], 10) : 100; // Limite par défaut
    query = query.limit(limit);

    const { data, error } = await query;

    if (error) {
      throw new Error(`Erreur requête: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Ajouter les conditions WHERE à la requête
   */
  private addWhereConditions(query: any, lowerSQL: string): any {
    // Qualification
    if (lowerSQL.includes("qualification") && lowerSQL.includes("'chaud'")) {
      query = query.eq('qualification', 'CHAUD');
    } else if (lowerSQL.includes("qualification") && lowerSQL.includes("'tiede'")) {
      query = query.eq('qualification', 'TIEDE');
    } else if (lowerSQL.includes("qualification") && lowerSQL.includes("'froid'")) {
      query = query.eq('qualification', 'FROID');
    }

    // Conditions IS NOT NULL
    const notNullMatches = Array.from(lowerSQL.matchAll(/([a-z_]+)\s+is\s+not\s+null/gi));
    for (const match of notNullMatches) {
      const column = match[1];
      if (column !== 'organization_id') {
        query = query.not(column, 'is', null);
      }
    }

    // Conditions IS NULL
    const nullMatches = Array.from(lowerSQL.matchAll(/([a-z_]+)\s+is\s+null(?!\s*\))/gi));
    for (const match of nullMatches) {
      const column = match[1];
      if (!lowerSQL.includes(`${column} is not null`)) {
        query = query.is(column, null);
      }
    }

    // Conditions numériques >
    const gtMatches = Array.from(lowerSQL.matchAll(/([a-z_]+)\s*>\s*(\d+)/gi));
    for (const match of gtMatches) {
      const column = match[1];
      const value = parseInt(match[2], 10);
      query = query.gt(column, value);
    }

    return query;
  }

  /**
   * Ajouter ORDER BY à la requête
   */
  private addOrderBy(query: any, sql: string): any {
    const orderMatch = sql.match(/order\s+by\s+([a-z_]+)(?:\s+(asc|desc))?/i);
    if (orderMatch) {
      const orderColumn = orderMatch[1];
      const isAscending = !orderMatch[2] || orderMatch[2].toLowerCase() === 'asc';
      query = query.order(orderColumn, { ascending: isAscending });
    }
    return query;
  }

  /**
   * Obtenir les suggestions de requêtes pour l'assistant
   */
  getSuggestions(): string[] {
    return [
      "Montre-moi les prospects chauds de cette semaine",
      "Combien de RDV sont programmés aujourd'hui ?",
      "Quels sont les prospects sans conseiller assigné ?",
      "Affiche le CA généré par conseiller ce mois",
      "Montre les appels effectués hier",
      "Prospects avec patrimoine > 100000 euros",
      "Répartition des prospects par qualification",
      "Dernières activités de l'équipe"
    ];
  }
}

/**
 * Instance singleton du service MCP
 */
export const mcpSupabaseService = new MCPSupabaseService();