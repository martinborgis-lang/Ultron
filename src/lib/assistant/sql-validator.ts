import type { SQLValidationResult } from '@/types/assistant';

// Allowed tables whitelist - only these tables can be queried
const ALLOWED_TABLES = [
  'crm_prospects',
  'pipeline_stages',
  'users',
  'crm_events',
  'crm_activities',
];

// Forbidden SQL keywords that could modify data or structure
const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'MERGE',
  'UPSERT',
  'REPLACE',
  'CALL',
  'SET ',
  'COPY',
  'VACUUM',
  'ANALYZE',
  'REINDEX',
  'CLUSTER',
  'COMMENT',
  'LOCK',
  'UNLOCK',
];

// Maximum allowed results
const MAX_LIMIT = 50;

/**
 * Validates a SQL query for security
 * Ensures only SELECT queries on allowed tables with organization filter
 */
export function validateQuery(sql: string): SQLValidationResult {
  const normalizedSQL = sql.trim();
  const upperSQL = normalizedSQL.toUpperCase();

  // 1. Must start with SELECT
  if (!upperSQL.startsWith('SELECT')) {
    return {
      valid: false,
      reason: 'Seules les requetes SELECT sont autorisees',
    };
  }

  // 2. Check for forbidden keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    // Use word boundary check to avoid false positives (e.g., "UPDATED_AT" shouldn't match "UPDATE")
    const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
    if (pattern.test(normalizedSQL)) {
      return {
        valid: false,
        reason: `Operation non autorisee: ${keyword}`,
      };
    }
  }

  // 3. Must contain organization_id filter (either $1 parameter or explicit)
  const hasOrgFilter =
    normalizedSQL.includes('$1') ||
    normalizedSQL.toLowerCase().includes('organization_id');

  if (!hasOrgFilter) {
    return {
      valid: false,
      reason: 'Le filtre organization_id est requis',
    };
  }

  // 4. Extract and validate table names
  const tableValidation = validateTables(normalizedSQL);
  if (!tableValidation.valid) {
    return tableValidation;
  }

  // 5. Ensure LIMIT is present and reasonable
  const limitValidation = validateLimit(normalizedSQL);
  if (!limitValidation.valid) {
    return limitValidation;
  }

  // 6. Check for potential SQL injection patterns
  const injectionCheck = checkForInjection(normalizedSQL);
  if (!injectionCheck.valid) {
    return injectionCheck;
  }

  return { valid: true };
}

/**
 * Extract and validate table names from the query
 */
function validateTables(sql: string): SQLValidationResult {
  const lowerSQL = sql.toLowerCase();

  // Extract tables from FROM clause
  const fromMatches = lowerSQL.match(/from\s+([a-z_][a-z0-9_]*)/gi) || [];

  // Extract tables from JOIN clauses
  const joinMatches = lowerSQL.match(/join\s+([a-z_][a-z0-9_]*)/gi) || [];

  const allMatches = [...fromMatches, ...joinMatches];

  for (const match of allMatches) {
    // Extract just the table name
    const tableName = match.split(/\s+/)[1]?.toLowerCase();

    if (tableName && !ALLOWED_TABLES.includes(tableName)) {
      return {
        valid: false,
        reason: `Table non autorisee: ${tableName}`,
      };
    }
  }

  // Must have at least one table (FROM clause)
  if (fromMatches.length === 0) {
    return {
      valid: false,
      reason: 'La requete doit contenir une clause FROM',
    };
  }

  return { valid: true };
}

/**
 * Validate LIMIT clause
 */
function validateLimit(sql: string): SQLValidationResult {
  const upperSQL = sql.toUpperCase();

  // Check if LIMIT is present
  const limitMatch = upperSQL.match(/LIMIT\s+(\d+)/i);

  if (!limitMatch) {
    return {
      valid: false,
      reason: `Une clause LIMIT est requise (maximum ${MAX_LIMIT})`,
    };
  }

  const limitValue = parseInt(limitMatch[1], 10);

  if (limitValue > MAX_LIMIT) {
    return {
      valid: false,
      reason: `LIMIT trop eleve: ${limitValue} (maximum ${MAX_LIMIT})`,
    };
  }

  return { valid: true };
}

/**
 * Check for common SQL injection patterns
 */
function checkForInjection(sql: string): SQLValidationResult {
  const suspiciousPatterns = [
    /;\s*--/,           // Statement terminator followed by comment
    /'\s*OR\s+'1'\s*=\s*'1/i,  // Classic OR injection
    /UNION\s+SELECT/i,  // UNION injection (already blocked by forbidden keywords but double check)
    /\/\*.*\*\//,       // Block comments that might hide malicious code
    /xp_/i,             // SQL Server extended procedures
    /0x[0-9a-f]+/i,     // Hexadecimal literals (often used in injection)
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sql)) {
      return {
        valid: false,
        reason: 'Pattern SQL suspect detecte',
      };
    }
  }

  return { valid: true };
}

/**
 * Sanitize a query by ensuring organization_id filter is present
 * Returns the sanitized query or null if it can't be safely sanitized
 */
export function ensureOrganizationFilter(sql: string): string {
  // If already has $1, return as-is
  if (sql.includes('$1')) {
    return sql;
  }

  // Check if it has WHERE clause
  const upperSQL = sql.toUpperCase();
  const whereIndex = upperSQL.indexOf('WHERE');

  if (whereIndex === -1) {
    // No WHERE clause, add one
    // Find the position after FROM table_name
    const fromMatch = sql.match(/FROM\s+[a-z_][a-z0-9_]*/i);
    if (fromMatch) {
      const insertPos = (fromMatch.index || 0) + fromMatch[0].length;
      return (
        sql.slice(0, insertPos) +
        ' WHERE organization_id = $1' +
        sql.slice(insertPos)
      );
    }
  } else {
    // Has WHERE clause, add AND condition
    const insertPos = whereIndex + 5; // After "WHERE"
    return (
      sql.slice(0, insertPos) +
      ' organization_id = $1 AND' +
      sql.slice(insertPos)
    );
  }

  return sql;
}

/**
 * Get allowed tables list (for use in prompts)
 */
export function getAllowedTables(): string[] {
  return [...ALLOWED_TABLES];
}
