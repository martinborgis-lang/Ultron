import * as jwt from 'jsonwebtoken';

const UNSUBSCRIBE_SECRET = process.env.UNSUBSCRIBE_SECRET || 'ultron-unsubscribe-change-me-in-prod';

export interface UnsubscribePayload {
  prospectId: string;
  email: string;
  organizationId: string;
}

/**
 * Génère un token de désinscription (valide 90 jours)
 */
export function generateUnsubscribeToken(payload: UnsubscribePayload): string {
  return jwt.sign(
    { ...payload, action: 'unsubscribe' },
    UNSUBSCRIBE_SECRET,
    { expiresIn: '90d' }
  );
}

/**
 * Vérifie et décode un token
 */
export function verifyUnsubscribeToken(token: string): UnsubscribePayload | null {
  try {
    const decoded = jwt.verify(token, UNSUBSCRIBE_SECRET) as UnsubscribePayload & { action: string };
    if (decoded.action !== 'unsubscribe') return null;
    return {
      prospectId: decoded.prospectId,
      email: decoded.email,
      organizationId: decoded.organizationId,
    };
  } catch {
    return null;
  }
}

/**
 * Génère l'URL complète de désinscription
 */
export function generateUnsubscribeUrl(payload: UnsubscribePayload): string {
  const token = generateUnsubscribeToken(payload);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ultron-murex.vercel.app';
  return `${baseUrl}/unsubscribe?token=${token}`;
}