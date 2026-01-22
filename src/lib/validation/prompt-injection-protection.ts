// Protection contre les attaques de Prompt Injection
// Validation et sanitization des inputs utilisateur pour l'IA

export interface PromptValidationResult {
  isValid: boolean;
  sanitizedInput: string;
  threats: string[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

// Patterns d'attaque de Prompt Injection connus
const PROMPT_INJECTION_PATTERNS = [
  // Instructions de contournement
  /ignore\s+(?:all|the|previous|above|prior)\s+(?:instructions?|prompts?|rules?|commands?)/gi,
  /forget\s+(?:everything|all|the|previous|above|prior)\s+(?:instructions?|prompts?|rules?)/gi,
  /disregard\s+(?:all|the|previous|above|prior)\s+(?:instructions?|prompts?|rules?)/gi,

  // Instructions de rôle/personnalité
  /(?:you\s+are\s+now|act\s+as|pretend\s+to\s+be|roleplay\s+as)\s+(?:a\s+)?([^.!?\n]+)/gi,
  /from\s+now\s+on[,.]?\s*(?:you\s+)?(?:are|will\s+be|must\s+be|should\s+be)/gi,
  /new\s+(?:role|character|persona|identity)[:\s]/gi,

  // Commandes système
  /system[:.]?\s*(?:prompt|message|instruction|command)/gi,
  /\\n\\n(?:system|user|assistant|human)[:]/gi,
  /(?:^|\n)\s*(?:system|user|assistant|human)\s*[:]/gm,

  // Injections de code
  /```(?:python|javascript|js|bash|sh|sql|json)/gi,
  /eval\s*\(/gi,
  /exec\s*\(/gi,
  /subprocess\./gi,
  /os\.system/gi,
  /shell_exec/gi,

  // Tentatives d'extraction d'informations
  /(?:show|display|print|output|reveal|tell\s+me)\s+(?:your|the)\s+(?:prompt|instructions?|system\s+message|training\s+data)/gi,
  /what\s+(?:are|were)\s+your\s+(?:original\s+)?instructions?/gi,
  /(?:repeat|echo|output)\s+(?:your|the)\s+(?:system\s+)?(?:prompt|message|instructions?)/gi,

  // Manipulation contextuelle
  /(?:however|but|although|despite|nevertheless)[,.]?\s*(?:ignore|disregard|forget)/gi,
  /just\s+kidding[,.]?\s*(?:ignore|disregard|forget)/gi,
  /actually[,.]?\s*(?:ignore|disregard|forget)/gi,

  // Injection de templates
  /\{\{.*\}\}/g,
  /\$\{.*\}/g,
  /%\{.*\}/g,

  // Caractères de contrôle dangereux
  /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g,

  // Séquences d'échappement
  /\\x[0-9a-fA-F]{2}/g,
  /\\u[0-9a-fA-F]{4}/g,
  /\\[rntbfav]/g,
];

// Mots-clés sensibles à surveiller
const SENSITIVE_KEYWORDS = [
  'system', 'prompt', 'instruction', 'ignore', 'forget', 'disregard',
  'override', 'bypass', 'jailbreak', 'hack', 'exploit', 'vulnerability',
  'admin', 'administrator', 'root', 'sudo', 'password', 'token', 'secret',
  'api_key', 'anthropic', 'claude', 'openai', 'chatgpt', 'llm', 'ai',
  'model', 'training', 'dataset', 'eval', 'exec', 'shell', 'command'
];

export class PromptInjectionProtection {

  /**
   * Valide et sanitise un input utilisateur avant injection dans un prompt IA
   */
  static validateAndSanitize(input: string, context?: string): PromptValidationResult {
    if (!input || typeof input !== 'string') {
      return {
        isValid: true,
        sanitizedInput: '',
        threats: [],
        riskLevel: 'LOW'
      };
    }

    const threats: string[] = [];
    let riskLevel: PromptValidationResult['riskLevel'] = 'LOW';

    // 1. Détecter les patterns d'injection
    for (const pattern of PROMPT_INJECTION_PATTERNS) {
      const matches = input.match(pattern);
      if (matches) {
        matches.forEach(match => {
          threats.push(`Prompt injection pattern détecté: "${match}"`);
        });
        riskLevel = this.escalateRiskLevel(riskLevel, 'HIGH');
      }
    }

    // 2. Détecter les mots-clés sensibles
    const lowerInput = input.toLowerCase();
    for (const keyword of SENSITIVE_KEYWORDS) {
      if (lowerInput.includes(keyword.toLowerCase())) {
        threats.push(`Mot-clé sensible détecté: "${keyword}"`);
        riskLevel = this.escalateRiskLevel(riskLevel, 'MEDIUM');
      }
    }

    // 3. Vérifier la longueur excessive (possible bourrage)
    if (input.length > 5000) {
      threats.push('Input excessivement long (possible bourrage de prompt)');
      riskLevel = this.escalateRiskLevel(riskLevel, 'MEDIUM');
    }

    // 4. Détecter les répétitions suspectes
    if (this.hasExcessiveRepetition(input)) {
      threats.push('Répétitions excessives détectées (possible attaque de répétition)');
      riskLevel = this.escalateRiskLevel(riskLevel, 'MEDIUM');
    }

    // 5. Sanitisation de l'input
    const sanitizedInput = this.sanitizeInput(input);

    // 6. Validation finale
    const isValid = riskLevel !== 'CRITICAL' && threats.length < 3;

    return {
      isValid,
      sanitizedInput,
      threats,
      riskLevel
    };
  }

  /**
   * Sanitise un input en supprimant/échappant les éléments dangereux
   */
  private static sanitizeInput(input: string): string {
    let sanitized = input;

    // Supprimer les caractères de contrôle
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    // Échapper les séquences de template
    sanitized = sanitized.replace(/\{\{/g, '\\{\\{');
    sanitized = sanitized.replace(/\}\}/g, '\\}\\}');
    sanitized = sanitized.replace(/\$\{/g, '\\$\\{');
    sanitized = sanitized.replace(/%\{/g, '\\%\\{');

    // Limiter les répétitions excessives
    sanitized = this.limitRepetitions(sanitized);

    // Normaliser les espaces
    sanitized = sanitized.replace(/\s+/g, ' ').trim();

    // Limiter la longueur
    if (sanitized.length > 2000) {
      sanitized = sanitized.substring(0, 2000) + '...';
    }

    return sanitized;
  }

  /**
   * Détecte les répétitions excessives dans le texte
   */
  private static hasExcessiveRepetition(input: string): boolean {
    const words = input.toLowerCase().split(/\s+/);
    const wordCount = new Map<string, number>();

    for (const word of words) {
      if (word.length > 3) { // Ignorer les mots très courts
        wordCount.set(word, (wordCount.get(word) || 0) + 1);

        // Si un mot apparaît plus de 10 fois, c'est suspect
        if (wordCount.get(word)! > 10) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Limite les répétitions de caractères ou mots
   */
  private static limitRepetitions(input: string): string {
    // Limiter les répétitions de caractères (ex: aaaaa -> aaa)
    let result = input.replace(/(.)\1{4,}/g, '$1$1$1');

    // Limiter les répétitions de mots
    result = result.replace(/(\b\w+\b)(\s+\1){3,}/gi, '$1 $1 $1');

    return result;
  }

  /**
   * Augmente le niveau de risque si nécessaire
   */
  private static escalateRiskLevel(
    current: PromptValidationResult['riskLevel'],
    newLevel: PromptValidationResult['riskLevel']
  ): PromptValidationResult['riskLevel'] {
    const levels = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2, 'CRITICAL': 3 };
    return levels[newLevel] > levels[current] ? newLevel : current;
  }

  /**
   * Crée un wrapper sécurisé autour des données utilisateur dans les prompts
   */
  static wrapUserData(data: string, label?: string): string {
    const validation = this.validateAndSanitize(data, label);

    if (!validation.isValid) {
      throw new Error(`Prompt injection détectée${label ? ` dans ${label}` : ''}: ${validation.threats.join(', ')}`);
    }

    // Wrapper avec délimiteurs clairs pour isoler les données utilisateur
    return `<user_data${label ? ` label="${label}"` : ''}>\n${validation.sanitizedInput}\n</user_data>`;
  }

  /**
   * Valide et sécurise un objet entier de données prospect
   */
  static validateProspectData(prospect: Record<string, unknown>): {
    isValid: boolean;
    sanitizedData: Record<string, string>;
    threats: string[];
    riskLevel: PromptValidationResult['riskLevel'];
  } {
    const allThreats: string[] = [];
    let overallRiskLevel: PromptValidationResult['riskLevel'] = 'LOW';
    const sanitizedData: Record<string, string> = {};

    for (const [key, value] of Object.entries(prospect)) {
      if (typeof value === 'string' && value.trim()) {
        const validation = this.validateAndSanitize(value, key);

        sanitizedData[key] = validation.sanitizedInput;
        allThreats.push(...validation.threats);
        overallRiskLevel = this.escalateRiskLevel(overallRiskLevel, validation.riskLevel);
      } else {
        sanitizedData[key] = String(value || '');
      }
    }

    return {
      isValid: overallRiskLevel !== 'CRITICAL' && allThreats.length < 5,
      sanitizedData,
      threats: allThreats,
      riskLevel: overallRiskLevel
    };
  }
}

// Helpers pour une utilisation facile
export function validatePromptInput(input: string, context?: string): PromptValidationResult {
  return PromptInjectionProtection.validateAndSanitize(input, context);
}

export function sanitizePromptInput(input: string): string {
  const result = PromptInjectionProtection.validateAndSanitize(input);
  if (!result.isValid) {
    throw new Error(`Prompt injection détectée: ${result.threats.join(', ')}`);
  }
  return result.sanitizedInput;
}

export function wrapUserDataForPrompt(data: string, label?: string): string {
  return PromptInjectionProtection.wrapUserData(data, label);
}

export function validateProspectForPrompt(prospect: Record<string, unknown>): Record<string, string> {
  const result = PromptInjectionProtection.validateProspectData(prospect);
  if (!result.isValid) {
    throw new Error(`Données prospect non sécurisées: ${result.threats.join(', ')}`);
  }
  return result.sanitizedData;
}