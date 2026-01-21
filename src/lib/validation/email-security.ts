/**
 * CORRECTION 6: SÉCURITÉ EMAIL (CRITIQUE)
 * Protection contre les attaques email incluant injection d'headers SMTP,
 * XSS dans les templates, phishing/spoofing, injection de contenu malveillant
 */

// Patterns dangereux pour headers SMTP
const SMTP_HEADER_INJECTION_PATTERNS = [
  /\r\n/gi,           // CRLF injection
  /\n/gi,             // LF injection
  /\r/gi,             // CR injection
  /%0[aA]/gi,         // URL encoded LF
  /%0[dD]/gi,         // URL encoded CR
  /%0[aAdD]%0[aA]/gi, // URL encoded CRLF
  /\x0a/gi,           // Hex LF
  /\x0d/gi,           // Hex CR
  /\\n/gi,            // Escaped newline
  /\\r/gi,            // Escaped carriage return
  /bcc:/gi,           // Injection BCC
  /cc:/gi,            // Injection CC (moins critique mais surveillé)
  /content-type:/gi,  // Injection content-type
  /mime-version:/gi,  // Injection mime-version
  /subject:/gi,       // Double subject
  /from:/gi,          // Double from
  /to:/gi,            // Double to
  /reply-to:/gi,      // Injection reply-to
  /x-/gi,             // Headers personnalisés
  /message-id:/gi,    // Injection message-id
  /received:/gi,      // Injection received
  /return-path:/gi,   // Injection return-path
];

// Patterns de phishing/spoofing
const PHISHING_PATTERNS = [
  // Homoglyphs et caractères Unicode trompeurs
  /[а-я]/gi,          // Cyrillique (ressemble au latin)
  /[αβγδε]/gi,        // Grec
  /\u200B/g,          // Zero-width space
  /\u200C/g,          // Zero-width non-joiner
  /\u200D/g,          // Zero-width joiner
  /\u2060/g,          // Word joiner
  /\uFEFF/g,          // Zero-width no-break space

  // Domaines suspects
  /[a-z0-9]+-?(gmail|outlook|yahoo|hotmail|microsoft|google|apple|amazon|paypal|bank)/gi,
  /\.(tk|ml|ga|cf|gq)$/gi,  // TLD gratuits souvent utilisés pour phishing

  // Mots-clés de phishing
  /urgent.{0,10}action.{0,10}required/gi,
  /verify.{0,10}account/gi,
  /suspended.{0,10}account/gi,
  /click.{0,10}here.{0,10}immediately/gi,
  /limited.{0,10}time.{0,10}offer/gi,
  /congratulations.{0,10}you.{0,10}have.{0,10}won/gi,
  /prince.{0,20}nigeria/gi,
  /inheritance.{0,20}million/gi,
];

// Patterns XSS et injection HTML/JavaScript
const XSS_PATTERNS = [
  /<script[^>]*>.*?<\/script>/gis,
  /<iframe[^>]*>.*?<\/iframe>/gis,
  /<object[^>]*>.*?<\/object>/gis,
  /<embed[^>]*>/gi,
  /<form[^>]*>.*?<\/form>/gis,
  /<input[^>]*>/gi,
  /<textarea[^>]*>.*?<\/textarea>/gis,
  /<select[^>]*>.*?<\/select>/gis,
  /<button[^>]*>.*?<\/button>/gis,
  /on\w+\s*=/gi,              // Event handlers (onclick, onload, etc.)
  /javascript:/gi,
  /vbscript:/gi,
  /data:/gi,
  /blob:/gi,
  /<meta[^>]*http-equiv/gi,   // Meta refresh
  /<link[^>]*>/gi,            // External stylesheets
  /@import/gi,                // CSS imports
  /expression\s*\(/gi,        // CSS expressions (IE)
  /url\s*\(/gi,               // CSS url() - peut être malveillant
  /&#x/gi,                    // Hex entities
  /&#\d/gi,                   // Decimal entities
  /%[0-9a-fA-F]{2}/g,         // URL encoding
];

// Patterns de malware et liens suspects
const MALWARE_PATTERNS = [
  // Extensions dangereuses
  /\.(exe|scr|bat|cmd|com|pif|vbs|js|jar|zip|rar|7z|tar|gz)$/gi,

  // URLs raccourcies (peuvent masquer destination)
  /bit\.ly|tinyurl|t\.co|goo\.gl|ow\.ly|short\.link/gi,

  // Protocoles dangereux
  /ftp:|file:|smb:|ldap:/gi,

  // Patterns d'URL suspects
  /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/g,  // Adresses IP
  /\w+\.(tk|ml|ga|cf|gq|bit|ly)/gi,  // Domaines suspects

  // Patterns de redirection
  /redirect|redir|goto|url=/gi,
];

export interface EmailSecurityResult {
  isValid: boolean;
  sanitizedValue: string;
  threats: EmailThreat[];
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface EmailThreat {
  type: 'SMTP_INJECTION' | 'XSS' | 'PHISHING' | 'MALWARE' | 'ENCODING' | 'SIZE_LIMIT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  pattern?: string;
  location?: string;
}

export interface EmailValidationOptions {
  allowHtml?: boolean;
  maxLength?: number;
  strictMode?: boolean;
  checkPhishing?: boolean;
  allowAttachments?: boolean;
}

export class EmailSecurityValidator {

  /**
   * Valide et sécurise une adresse email
   */
  static validateEmailAddress(email: string): EmailSecurityResult {
    const threats: EmailThreat[] = [];
    let sanitizedEmail = email.trim().toLowerCase();

    // Vérification format email basique
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(sanitizedEmail)) {
      threats.push({
        type: 'ENCODING',
        severity: 'HIGH',
        description: 'Format email invalide',
      });
      return {
        isValid: false,
        sanitizedValue: sanitizedEmail,
        threats,
        riskLevel: 'HIGH',
      };
    }

    // Vérification injection SMTP dans email
    for (const pattern of SMTP_HEADER_INJECTION_PATTERNS) {
      if (pattern.test(sanitizedEmail)) {
        threats.push({
          type: 'SMTP_INJECTION',
          severity: 'CRITICAL',
          description: 'Tentative injection SMTP détectée dans l\'adresse email',
          pattern: pattern.source,
        });
      }
    }

    // Vérification phishing dans domaine
    for (const pattern of PHISHING_PATTERNS) {
      if (pattern.test(sanitizedEmail)) {
        threats.push({
          type: 'PHISHING',
          severity: 'HIGH',
          description: 'Domaine ou email suspect détecté',
          pattern: pattern.source,
        });
      }
    }

    // Sanitisation finale
    sanitizedEmail = sanitizedEmail.replace(/[^\w@.-]/g, '');

    const riskLevel = this.calculateRiskLevel(threats);

    return {
      isValid: riskLevel !== 'CRITICAL',
      sanitizedValue: sanitizedEmail,
      threats,
      riskLevel,
    };
  }

  /**
   * Valide et sécurise un subject d'email
   */
  static validateEmailSubject(subject: string, options: EmailValidationOptions = {}): EmailSecurityResult {
    const { maxLength = 200, strictMode = true } = options;
    const threats: EmailThreat[] = [];
    let sanitizedSubject = subject;

    // Vérification longueur
    if (sanitizedSubject.length > maxLength) {
      threats.push({
        type: 'SIZE_LIMIT',
        severity: 'MEDIUM',
        description: `Subject trop long (${sanitizedSubject.length} > ${maxLength})`,
      });
      sanitizedSubject = sanitizedSubject.substring(0, maxLength);
    }

    // Vérification injection SMTP
    for (const pattern of SMTP_HEADER_INJECTION_PATTERNS) {
      if (pattern.test(sanitizedSubject)) {
        threats.push({
          type: 'SMTP_INJECTION',
          severity: 'CRITICAL',
          description: 'Tentative injection SMTP dans le subject',
          pattern: pattern.source,
        });
      }
    }

    // Vérification XSS
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(sanitizedSubject)) {
        threats.push({
          type: 'XSS',
          severity: 'HIGH',
          description: 'Tentative XSS détectée dans le subject',
          pattern: pattern.source,
        });
      }
    }

    // Vérification phishing
    if (options.checkPhishing !== false) {
      for (const pattern of PHISHING_PATTERNS) {
        if (pattern.test(sanitizedSubject)) {
          threats.push({
            type: 'PHISHING',
            severity: 'HIGH',
            description: 'Contenu suspect de phishing dans le subject',
            pattern: pattern.source,
          });
        }
      }
    }

    // Sanitisation
    if (strictMode) {
      // Suppression complète des caractères dangereux
      sanitizedSubject = sanitizedSubject
        .replace(/[\r\n]/g, ' ')
        .replace(/[<>]/g, '')
        .trim();
    } else {
      // Échappement des caractères dangereux
      sanitizedSubject = sanitizedSubject
        .replace(/[\r\n]/g, ' ')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .trim();
    }

    const riskLevel = this.calculateRiskLevel(threats);

    return {
      isValid: riskLevel !== 'CRITICAL',
      sanitizedValue: sanitizedSubject,
      threats,
      riskLevel,
    };
  }

  /**
   * Valide et sécurise le corps d'un email (HTML ou texte)
   */
  static validateEmailBody(body: string, options: EmailValidationOptions = {}): EmailSecurityResult {
    const { allowHtml = true, maxLength = 50000, strictMode = false, checkPhishing = true } = options;
    const threats: EmailThreat[] = [];
    let sanitizedBody = body;

    // Vérification longueur
    if (sanitizedBody.length > maxLength) {
      threats.push({
        type: 'SIZE_LIMIT',
        severity: 'MEDIUM',
        description: `Corps d'email trop long (${sanitizedBody.length} > ${maxLength})`,
      });
      sanitizedBody = sanitizedBody.substring(0, maxLength);
    }

    // Vérification injection SMTP
    for (const pattern of SMTP_HEADER_INJECTION_PATTERNS) {
      if (pattern.test(sanitizedBody)) {
        threats.push({
          type: 'SMTP_INJECTION',
          severity: 'CRITICAL',
          description: 'Tentative injection SMTP dans le corps de l\'email',
          pattern: pattern.source,
        });
      }
    }

    // Vérification XSS (toujours, même si HTML autorisé)
    for (const pattern of XSS_PATTERNS) {
      if (pattern.test(sanitizedBody)) {
        threats.push({
          type: 'XSS',
          severity: allowHtml ? 'HIGH' : 'CRITICAL',
          description: 'Tentative XSS détectée dans le corps de l\'email',
          pattern: pattern.source,
        });
      }
    }

    // Vérification malware/liens suspects
    for (const pattern of MALWARE_PATTERNS) {
      if (pattern.test(sanitizedBody)) {
        threats.push({
          type: 'MALWARE',
          severity: 'HIGH',
          description: 'Contenu potentiellement malveillant détecté',
          pattern: pattern.source,
        });
      }
    }

    // Vérification phishing
    if (checkPhishing) {
      for (const pattern of PHISHING_PATTERNS) {
        if (pattern.test(sanitizedBody)) {
          threats.push({
            type: 'PHISHING',
            severity: 'HIGH',
            description: 'Contenu suspect de phishing détecté',
            pattern: pattern.source,
          });
        }
      }
    }

    // Sanitisation
    if (!allowHtml || strictMode) {
      // Suppression/échappement de tout HTML
      sanitizedBody = sanitizedBody
        .replace(/<[^>]*>/g, '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
    } else {
      // Sanitisation HTML sélective (garde HTML de base)
      sanitizedBody = this.sanitizeHtmlContent(sanitizedBody);
    }

    // Suppression CRLF injection
    sanitizedBody = sanitizedBody
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');

    const riskLevel = this.calculateRiskLevel(threats);

    return {
      isValid: riskLevel !== 'CRITICAL',
      sanitizedValue: sanitizedBody,
      threats,
      riskLevel,
    };
  }

  /**
   * Valide un nom de fichier d'attachement
   */
  static validateAttachmentName(filename: string): EmailSecurityResult {
    const threats: EmailThreat[] = [];
    let sanitizedFilename = filename.trim();

    // Vérification extensions dangereuses
    for (const pattern of MALWARE_PATTERNS) {
      if (pattern.test(sanitizedFilename)) {
        threats.push({
          type: 'MALWARE',
          severity: 'CRITICAL',
          description: 'Extension de fichier potentiellement dangereuse',
          pattern: pattern.source,
        });
      }
    }

    // Sanitisation nom de fichier
    sanitizedFilename = sanitizedFilename
      .replace(/[<>:"/\\|?*]/g, '_')  // Caractères invalides pour fichiers
      .replace(/[\x00-\x1f]/g, '')   // Caractères de contrôle
      .replace(/^\.+/, '')           // Points en début
      .replace(/\.+$/, '');          // Points en fin

    // Limitation longueur
    if (sanitizedFilename.length > 255) {
      sanitizedFilename = sanitizedFilename.substring(0, 255);
      threats.push({
        type: 'SIZE_LIMIT',
        severity: 'MEDIUM',
        description: 'Nom de fichier trop long',
      });
    }

    const riskLevel = this.calculateRiskLevel(threats);

    return {
      isValid: riskLevel !== 'CRITICAL',
      sanitizedValue: sanitizedFilename,
      threats,
      riskLevel,
    };
  }

  /**
   * Validation complète d'un email avant envoi
   */
  static validateFullEmail(email: {
    to: string;
    from?: string;
    subject: string;
    body: string;
    attachmentName?: string;
  }, options: EmailValidationOptions = {}): EmailSecurityResult {
    const threats: EmailThreat[] = [];

    // Validation destinataire
    const toValidation = this.validateEmailAddress(email.to);
    threats.push(...toValidation.threats);

    // Validation expéditeur (si fourni)
    if (email.from) {
      const fromValidation = this.validateEmailAddress(email.from);
      threats.push(...fromValidation.threats);
    }

    // Validation subject
    const subjectValidation = this.validateEmailSubject(email.subject, options);
    threats.push(...subjectValidation.threats);

    // Validation body
    const bodyValidation = this.validateEmailBody(email.body, options);
    threats.push(...bodyValidation.threats);

    // Validation attachment (si présent)
    if (email.attachmentName) {
      const attachmentValidation = this.validateAttachmentName(email.attachmentName);
      threats.push(...attachmentValidation.threats);
    }

    const riskLevel = this.calculateRiskLevel(threats);

    return {
      isValid: riskLevel !== 'CRITICAL',
      sanitizedValue: JSON.stringify({
        to: toValidation.sanitizedValue,
        from: email.from,
        subject: subjectValidation.sanitizedValue,
        body: bodyValidation.sanitizedValue,
        attachmentName: email.attachmentName,
      }),
      threats,
      riskLevel,
    };
  }

  /**
   * Sanitisation HTML pour corps d'email (garde les balises de base)
   */
  private static sanitizeHtmlContent(html: string): string {
    // Liste blanche des balises autorisées pour emails
    const allowedTags = ['p', 'br', 'strong', 'b', 'em', 'i', 'u', 'a', 'ul', 'ol', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'div', 'span'];
    const allowedAttributes = ['href', 'style'];  // Très limité

    // Suppression des balises non autorisées
    const tagRegex = /<(\/?)([\w-]+)[^>]*>/gi;
    return html.replace(tagRegex, (match, closing, tagName) => {
      if (allowedTags.includes(tagName.toLowerCase())) {
        // Garde la balise mais nettoie les attributs
        if (closing) {
          return `</${tagName}>`;
        } else {
          // Pour les balises ouvrantes, on pourrait ajouter une validation d'attributs ici
          return `<${tagName}>`;
        }
      }
      return ''; // Supprime les balises non autorisées
    });
  }

  /**
   * Calcul du niveau de risque global
   */
  private static calculateRiskLevel(threats: EmailThreat[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (threats.some(t => t.severity === 'CRITICAL')) {
      return 'CRITICAL';
    }
    if (threats.some(t => t.severity === 'HIGH')) {
      return 'HIGH';
    }
    if (threats.some(t => t.severity === 'MEDIUM')) {
      return 'MEDIUM';
    }
    return 'LOW';
  }

  /**
   * Génère un rapport de sécurité lisible
   */
  static generateSecurityReport(result: EmailSecurityResult): string {
    if (result.threats.length === 0) {
      return '✅ Aucune menace détectée';
    }

    const report = [`⚠️ ${result.threats.length} menace(s) détectée(s) - Niveau: ${result.riskLevel}`];

    for (const threat of result.threats) {
      report.push(`  - ${threat.type} (${threat.severity}): ${threat.description}`);
    }

    return report.join('\n');
  }
}

export default EmailSecurityValidator;