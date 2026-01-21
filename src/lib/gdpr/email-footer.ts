import { generateUnsubscribeUrl } from './unsubscribe-token';

interface FooterParams {
  prospectId: string;
  email: string;
  organizationId: string;
}

/**
 * Génère le footer RGPD obligatoire pour les emails
 */
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

/**
 * Version texte pour emails plain text
 */
export function generateEmailFooterText(params: FooterParams): string {
  const unsubscribeUrl = generateUnsubscribeUrl(params);

  return `
---
Vous recevez cet email suite à votre demande d'information.
Se désinscrire : ${unsubscribeUrl}
Politique de confidentialité : https://ultron-murex.vercel.app/privacy
Martin Borgis – 42 rue Gilbert Cesbron, 75017 Paris`;
}