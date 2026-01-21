/**
 * CORRECTION 6: PROTECTION RATE LIMITING EMAIL
 * Protection contre les abus d'envoi d'emails et respect des limites Gmail
 */

interface EmailRateLimit {
  maxEmailsPerHour: number;
  maxEmailsPerDay: number;
  maxEmailsPerMinute: number;
  cooldownPeriodMs: number;
}

interface EmailRecord {
  timestamp: number;
  to: string;
  from: string;
  organizationId: string;
  userId?: string;
}

interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  resetTime?: number;
  currentUsage: {
    perMinute: number;
    perHour: number;
    perDay: number;
  };
  limits: EmailRateLimit;
}

const DEFAULT_RATE_LIMITS: EmailRateLimit = {
  maxEmailsPerMinute: 10,     // Gmail limite: ~250/min pour G Suite
  maxEmailsPerHour: 500,      // Gmail limite: ~1000/hour
  maxEmailsPerDay: 2000,      // Gmail limite: ~2000/day
  cooldownPeriodMs: 60000,    // 1 minute cooldown si dépassement
};

// Cache en mémoire pour le rate limiting (en production: Redis)
const emailRecords: Map<string, EmailRecord[]> = new Map();
const cooldownUsers: Map<string, number> = new Map();

export class EmailRateLimiter {

  /**
   * Vérifie si l'envoi d'email est autorisé pour cet utilisateur/organisation
   */
  static checkRateLimit(
    organizationId: string,
    userEmail: string,
    targetEmail: string,
    customLimits?: Partial<EmailRateLimit>
  ): RateLimitResult {
    const limits: EmailRateLimit = { ...DEFAULT_RATE_LIMITS, ...customLimits };
    const now = Date.now();
    const userKey = `${organizationId}:${userEmail}`;

    // Vérification cooldown
    const cooldownUntil = cooldownUsers.get(userKey);
    if (cooldownUntil && now < cooldownUntil) {
      return {
        allowed: false,
        reason: `Cooldown actif suite à dépassement de limite`,
        resetTime: cooldownUntil,
        currentUsage: this.getCurrentUsage(userKey, limits),
        limits,
      };
    }

    // Nettoyage des enregistrements expirés
    this.cleanupOldRecords(userKey, now);

    const userRecords = emailRecords.get(userKey) || [];
    const usage = this.calculateUsage(userRecords, now);

    // Vérification limites par minute
    if (usage.perMinute >= limits.maxEmailsPerMinute) {
      this.setCooldown(userKey, now + limits.cooldownPeriodMs);
      return {
        allowed: false,
        reason: `Limite par minute dépassée (${usage.perMinute}/${limits.maxEmailsPerMinute})`,
        resetTime: now + (60 * 1000), // Reset dans 1 minute
        currentUsage: usage,
        limits,
      };
    }

    // Vérification limites par heure
    if (usage.perHour >= limits.maxEmailsPerHour) {
      this.setCooldown(userKey, now + limits.cooldownPeriodMs);
      return {
        allowed: false,
        reason: `Limite par heure dépassée (${usage.perHour}/${limits.maxEmailsPerHour})`,
        resetTime: now + (60 * 60 * 1000), // Reset dans 1 heure
        currentUsage: usage,
        limits,
      };
    }

    // Vérification limites par jour
    if (usage.perDay >= limits.maxEmailsPerDay) {
      this.setCooldown(userKey, now + limits.cooldownPeriodMs);
      return {
        allowed: false,
        reason: `Limite par jour dépassée (${usage.perDay}/${limits.maxEmailsPerDay})`,
        resetTime: now + (24 * 60 * 60 * 1000), // Reset dans 24h
        currentUsage: usage,
        limits,
      };
    }

    // Vérification destinataire unique (anti-spam)
    const recentEmailsToSameRecipient = userRecords.filter(
      record => record.to === targetEmail &&
                (now - record.timestamp) < (5 * 60 * 1000) // 5 minutes
    );

    if (recentEmailsToSameRecipient.length >= 3) {
      return {
        allowed: false,
        reason: `Trop d'emails envoyés au même destinataire (${targetEmail}) dans les 5 dernières minutes`,
        resetTime: now + (5 * 60 * 1000),
        currentUsage: usage,
        limits,
      };
    }

    return {
      allowed: true,
      currentUsage: usage,
      limits,
    };
  }

  /**
   * Enregistre un email envoyé pour le rate limiting
   */
  static recordEmailSent(
    organizationId: string,
    userEmail: string,
    targetEmail: string,
    userId?: string
  ): void {
    const userKey = `${organizationId}:${userEmail}`;
    const now = Date.now();

    const record: EmailRecord = {
      timestamp: now,
      to: targetEmail,
      from: userEmail,
      organizationId,
      userId,
    };

    if (!emailRecords.has(userKey)) {
      emailRecords.set(userKey, []);
    }

    emailRecords.get(userKey)!.push(record);

    // Nettoyage automatique des anciens enregistrements
    this.cleanupOldRecords(userKey, now);
  }

  /**
   * Obtient les statistiques d'usage actuelles
   */
  static getCurrentUsage(userKey: string, limits: EmailRateLimit) {
    const now = Date.now();
    const userRecords = emailRecords.get(userKey) || [];
    return this.calculateUsage(userRecords, now);
  }

  /**
   * Calcule l'usage dans les différentes fenêtres temporelles
   */
  private static calculateUsage(records: EmailRecord[], now: number) {
    const oneMinuteAgo = now - (60 * 1000);
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    return {
      perMinute: records.filter(r => r.timestamp > oneMinuteAgo).length,
      perHour: records.filter(r => r.timestamp > oneHourAgo).length,
      perDay: records.filter(r => r.timestamp > oneDayAgo).length,
    };
  }

  /**
   * Nettoie les enregistrements expirés (plus de 24h)
   */
  private static cleanupOldRecords(userKey: string, now: number): void {
    const userRecords = emailRecords.get(userKey);
    if (!userRecords) return;

    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    const filteredRecords = userRecords.filter(record => record.timestamp > oneDayAgo);

    if (filteredRecords.length !== userRecords.length) {
      emailRecords.set(userKey, filteredRecords);
    }
  }

  /**
   * Définit un cooldown pour un utilisateur
   */
  private static setCooldown(userKey: string, until: number): void {
    cooldownUsers.set(userKey, until);

    // Auto-nettoyage du cooldown
    setTimeout(() => {
      cooldownUsers.delete(userKey);
    }, until - Date.now());
  }

  /**
   * Remet à zéro les compteurs pour un utilisateur (admin uniquement)
   */
  static resetUserLimits(organizationId: string, userEmail: string): void {
    const userKey = `${organizationId}:${userEmail}`;
    emailRecords.delete(userKey);
    cooldownUsers.delete(userKey);
  }

  /**
   * Obtient les statistiques globales pour une organisation
   */
  static getOrganizationStats(organizationId: string): {
    totalUsers: number;
    totalEmailsLastHour: number;
    totalEmailsLastDay: number;
    usersInCooldown: number;
  } {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    let totalUsers = 0;
    let totalEmailsLastHour = 0;
    let totalEmailsLastDay = 0;
    let usersInCooldown = 0;

    // Parcourir tous les enregistrements
    for (const [userKey, records] of emailRecords.entries()) {
      if (userKey.startsWith(`${organizationId}:`)) {
        totalUsers++;

        const emailsLastHour = records.filter(r => r.timestamp > oneHourAgo).length;
        const emailsLastDay = records.filter(r => r.timestamp > oneDayAgo).length;

        totalEmailsLastHour += emailsLastHour;
        totalEmailsLastDay += emailsLastDay;

        // Vérifier si en cooldown
        const cooldownUntil = cooldownUsers.get(userKey);
        if (cooldownUntil && now < cooldownUntil) {
          usersInCooldown++;
        }
      }
    }

    return {
      totalUsers,
      totalEmailsLastHour,
      totalEmailsLastDay,
      usersInCooldown,
    };
  }

  /**
   * Vérifie si une adresse email est sur liste noire (implémentation basique)
   */
  static isEmailBlacklisted(email: string): boolean {
    const blacklistedDomains = [
      '10minutemail.com',
      'tempmail.org',
      'guerrillamail.com',
      'mailinator.com',
      'throwaway.email',
      'temp-mail.org',
      'sharklasers.com',
      'grr.la',
      'yopmail.com',
      '33mail.com',
    ];

    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return true;

    return blacklistedDomains.includes(domain);
  }

  /**
   * Analyse le contenu pour détecter du spam (implémentation basique)
   */
  static detectSpamContent(subject: string, body: string): {
    isSpam: boolean;
    score: number;
    reasons: string[];
  } {
    let score = 0;
    const reasons: string[] = [];

    const spamIndicators = [
      { pattern: /urgent|emergency|immediate|asap/gi, points: 10, reason: 'Mots urgents' },
      { pattern: /free|gratuit|offre|promotion/gi, points: 5, reason: 'Mots promotionnels' },
      { pattern: /click here|cliquez ici/gi, points: 15, reason: 'Call-to-action suspect' },
      { pattern: /winner|gagnant|félicitations/gi, points: 20, reason: 'Fausses félicitations' },
      { pattern: /money|argent|\$|\€/gi, points: 5, reason: 'Références financières' },
      { pattern: /limited time|temps limité/gi, points: 10, reason: 'Pression temporelle' },
      { pattern: /act now|agissez maintenant/gi, points: 15, reason: 'Pression à l\'action' },
      { pattern: /100%|guarantee|garanti/gi, points: 8, reason: 'Garanties absolues' },
    ];

    const fullText = `${subject} ${body}`;

    for (const indicator of spamIndicators) {
      const matches = fullText.match(indicator.pattern);
      if (matches) {
        score += indicator.points * matches.length;
        reasons.push(`${indicator.reason} (${matches.length}x)`);
      }
    }

    // Score additionnel pour MAJUSCULES excessives
    const uppercaseRatio = (fullText.match(/[A-Z]/g) || []).length / fullText.length;
    if (uppercaseRatio > 0.3) {
      score += 25;
      reasons.push('Trop de majuscules');
    }

    // Score additionnel pour ponctuation excessive
    const exclamationMarks = (fullText.match(/!/g) || []).length;
    if (exclamationMarks > 3) {
      score += exclamationMarks * 5;
      reasons.push('Ponctuation excessive');
    }

    return {
      isSpam: score > 50,
      score,
      reasons,
    };
  }
}

export default EmailRateLimiter;