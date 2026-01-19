// Types for the Ultron AI Assistant chatbot

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: Record<string, unknown>[];
  dataType?: 'table' | 'count' | 'list';
  query?: string; // Generated SQL query (for transparency)
  error?: boolean;
}

export interface ConversationContext {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantRequest {
  message: string;
  conversationHistory?: ConversationContext[];
}

export interface AssistantResponse {
  response: string;
  query?: string;
  data?: Record<string, unknown>[];
  dataType?: 'table' | 'count' | 'list';
  error?: string;
}

export interface SQLGenerationResult {
  sql: string;
  explanation?: string;
}

export interface SQLValidationResult {
  valid: boolean;
  reason?: string;
}

export interface QueryExecutionResult {
  data: Record<string, unknown>[];
  rowCount: number;
}

export type AssistantErrorType =
  | 'AUTH_ERROR'
  | 'SQL_GENERATION_ERROR'
  | 'VALIDATION_ERROR'
  | 'EXECUTION_ERROR'
  | 'FORMATTING_ERROR';

export const ASSISTANT_ERROR_MESSAGES: Record<AssistantErrorType, string> = {
  AUTH_ERROR: "Veuillez vous reconnecter pour utiliser l'assistant.",
  SQL_GENERATION_ERROR: "Je n'ai pas compris votre question. Pouvez-vous la reformuler?",
  VALIDATION_ERROR: "Je ne peux pas executer cette requete pour des raisons de securite.",
  EXECUTION_ERROR: "Une erreur s'est produite lors de la recherche. Veuillez reessayer.",
  FORMATTING_ERROR: "Les resultats ont ete trouves mais je n'ai pas pu les formater correctement."
};

// Suggestions for the welcome screen
export interface AssistantSuggestion {
  icon: string;
  text: string;
  color: string;
}

export const DEFAULT_SUGGESTIONS: AssistantSuggestion[] = [
  {
    icon: 'Flame',
    text: 'Montre moi les prospects chauds',
    color: 'text-red-500',
  },
  {
    icon: 'Calendar',
    text: 'Combien de RDV cette semaine?',
    color: 'text-blue-500',
  },
  {
    icon: 'Users',
    text: 'Prospects sans conseiller assigne',
    color: 'text-amber-500',
  },
  {
    icon: 'TrendingUp',
    text: 'Top 5 par patrimoine estime',
    color: 'text-green-500',
  },
];
