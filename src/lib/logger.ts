/**
 * Logger conditionnel - N'affiche les logs qu'en développement
 * Remplace tous les console.log du projet
 */

const isDev = process.env.NODE_ENV === 'development';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private prefix: string;

  constructor(prefix: string = '') {
    this.prefix = prefix ? `[${prefix}]` : '';
  }

  private formatMessage(level: LogLevel, message: string, ...args: unknown[]): string {
    const timestamp = new Date().toISOString();
    return `${timestamp} ${this.prefix} [${level.toUpperCase()}] ${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    // Warnings visibles en dev, optionnellement en prod
    if (isDev) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // En production, on évite les console.error pour Lighthouse
    // Seules les erreurs critiques sont loggées
    if (isDev || message.includes('CRITICAL')) {
      console.error(this.formatMessage('error', message), ...args);
    }
  }

  // Erreur silencieuse en production (pour Lighthouse)
  silent(message: string, ...args: unknown[]): void {
    if (isDev) {
      console.error(this.formatMessage('error', message), ...args);
    }
    // En production, on peut envoyer vers un service de monitoring
    // sans polluer la console
  }

  // Pour les cas où on veut vraiment logger en prod (événements importants)
  prod(message: string, ...args: unknown[]): void {
    console.log(this.formatMessage('info', message), ...args);
  }
}

// Logger par défaut
export const logger = new Logger();

// Factory pour créer des loggers avec préfixe
export function createLogger(prefix: string): Logger {
  return new Logger(prefix);
}

// Loggers pré-configurés pour les différents modules
export const loggers = {
  api: createLogger('API'),
  auth: createLogger('Auth'),
  crm: createLogger('CRM'),
  email: createLogger('Email'),
  calendar: createLogger('Calendar'),
  security: createLogger('Security'),
  gdpr: createLogger('GDPR'),
  webhook: createLogger('Webhook'),
};

export default logger;