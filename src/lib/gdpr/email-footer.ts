/**
 * Footer simplifié pour les emails Ultron
 * Les emails Ultron sont des échanges relationnels conseiller-prospect
 * et non du mass mailing marketing. Le lien de désinscription n'est donc pas obligatoire.
 */

/**
 * Footer simple et professionnel (optionnel)
 * Le conseiller peut ajouter sa propre signature professionnelle
 */
export function getSimpleEmailFooter(): string {
  return `
<div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; text-align: center;">
  <a href="https://ultron-murex.vercel.app/privacy" style="color: #9ca3af; text-decoration: none;">Politique de confidentialité</a>
</div>`;
}

/**
 * Footer texte simple (pour emails plain text)
 */
export function getSimpleEmailFooterText(): string {
  return `
---
Politique de confidentialité : https://ultron-murex.vercel.app/privacy`;
}

// ============================================================================
// ANCIENNES FONCTIONS CONSERVÉES POUR RÉFÉRENCE (DÉSACTIVÉES)
// Ces fonctions ne sont plus utilisées car les emails Ultron sont des
// échanges relationnels et non du mass mailing
// ============================================================================

/*
import { generateUnsubscribeUrl } from './unsubscribe-token';

interface FooterParams {
  prospectId: string;
  email: string;
  organizationId: string;
}

// Fonction désactivée - Plus utilisée
export function generateEmailFooter(params: FooterParams): string {
  const unsubscribeUrl = generateUnsubscribeUrl(params);

  return `
<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 12px; color: #666; text-align: center;">
  <p style="margin-bottom: 10px;">
    Vous recevez cet email suite à votre demande d'information.
  </p>
  <p style="margin-bottom: 15px;">
    <a href="${unsubscribeUrl}" style="color: #666; text-decoration: underline;">Se désinscrire</a>
    &nbsp;•&nbsp;
    <a href="https://ultron-murex.vercel.app/privacy" style="color: #666; text-decoration: underline;">Politique de confidentialité</a>
  </p>
  <p style="margin-bottom: 0; color: #999;">
    Martin Borgis – 42 rue Gilbert Cesbron, 75017 Paris
  </p>
</div>`;
}

// Fonction désactivée - Plus utilisée
export function generateEmailFooterText(params: FooterParams): string {
  const unsubscribeUrl = generateUnsubscribeUrl(params);

  return `
---
Vous recevez cet email suite à votre demande d'information.
Se désinscrire : ${unsubscribeUrl}
Politique de confidentialité : https://ultron-murex.vercel.app/privacy
Martin Borgis – 42 rue Gilbert Cesbron, 75017 Paris`;
}
*/