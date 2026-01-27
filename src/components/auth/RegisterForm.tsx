'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Mail } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const generateSlug = (name: string) => {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    return `${baseSlug}-${uniqueSuffix}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();

    // 1. Create auth user with email confirmation
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/api/auth/callback?type=signup`
      }
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Erreur lors de la creation du compte');
      setLoading(false);
      return;
    }

    // Vérifier si l'email doit être confirmé
    if (authData.user && !authData.session) {
      // Email confirmation requise - on s'arrête ici
      // L'organisation et l'utilisateur seront créés après confirmation de l'email
      setEmailSent(true);
      setLoading(false);
      return;
    }

    // 2. Create organization with default scoring config (seulement si email confirmé)
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .insert({
        name: companyName,
        slug: generateSlug(companyName),
        data_mode: 'crm',
        scoring_config: {
          seuil_chaud: 70,
          seuil_tiede: 40,
          poids_revenus: 25,
          poids_analyse_ia: 50,
          poids_patrimoine: 25,
          seuil_revenus_max: 10000,
          seuil_revenus_min: 2500,
          seuil_patrimoine_max: 300000,
          seuil_patrimoine_min: 30000
        }
      })
      .select()
      .single();

    if (orgError || !orgData) {
      setError('Erreur lors de la creation de l\'organisation');
      setLoading(false);
      return;
    }

    // 3. Create user profile
    const { error: userError } = await supabase
      .from('users')
      .insert({
        auth_id: authData.user.id,
        organization_id: orgData.id,
        email,
        full_name: fullName,
        role: 'admin',
      });

    if (userError) {
      setError('Erreur lors de la creation du profil');
      setLoading(false);
      return;
    }

    // 4. Add default prompts to organization
    const defaultPromptConfigs = {
      prompt_qualification: {
        useAI: true,
        systemPrompt: `Tu es un expert en qualification de prospects pour conseillers en gestion de patrimoine.
Analyse le profil du prospect et détermine sa qualification.

Critères de qualification:
- CHAUD: Patrimoine > 100k€, revenus stables, besoin identifié, disponible rapidement
- TIEDE: Potentiel intéressant mais hésitant ou timing pas optimal
- FROID: Faible potentiel, peu de moyens, ou pas de besoin identifié

Score: 0-100 basé sur le potentiel commercial
Priorité: HAUTE (à contacter en priorité), MOYENNE, BASSE

Retourne UNIQUEMENT un JSON avec le format:
{"qualification": "CHAUD|TIEDE|FROID", "score": 75, "priorite": "HAUTE|MOYENNE|BASSE", "justification": "Explication courte"}`,
        userPromptTemplate: `Informations du prospect à qualifier:

Prénom: {{prenom}}
Nom: {{nom}}
Email: {{email}}
Téléphone: {{telephone}}
Âge: {{age}}
Situation professionnelle: {{situation_pro}}
Revenus: {{revenus}}
Patrimoine: {{patrimoine}}
Besoins exprimés: {{besoins}}
Notes de l'appel: {{notes_appel}}`,
        fixedEmailSubject: '',
        fixedEmailBody: ''
      },
      prompt_synthese: {
        useAI: true,
        systemPrompt: `Tu es l'assistant d'un cabinet de gestion de patrimoine.

Ta mission : rédiger un email de RÉCAPITULATIF suite à un APPEL DE PROSPECTION téléphonique.

CONTEXTE IMPORTANT :
- Un conseiller vient de faire un APPEL TÉLÉPHONIQUE avec un prospect (c'est l'appel de prospection)
- Pendant cet appel, ils ont convenu d'un RENDEZ-VOUS à une date future
- Cet email récapitule l'appel ET confirme le RDV à venir

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "À très bientôt," - RIEN D'AUTRE APRÈS

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,
        userPromptTemplate: `Rédige un email de synthèse pour :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Qualification : {{qualification}}
- Besoins : {{besoins}}
- Notes de l'appel : {{notes_appel}}
- Date du RDV : {{date_rdv}}

L'appel de prospection vient d'avoir lieu. Le RDV est à la date mentionnée (futur).`,
        fixedEmailSubject: '',
        fixedEmailBody: ''
      },
      prompt_rappel: {
        useAI: true,
        systemPrompt: `Tu es un assistant pour conseillers en gestion de patrimoine.

Ta mission : rédiger un email de RAPPEL pour un rendez-vous prévu demain (24h avant).

L'email doit :
- Rappeler la date et l'heure exactes du rendez-vous
- Être bref et professionnel (max 5-6 lignes)
- Mentionner brièvement l'objet du RDV (analyse patrimoniale)
- Exprimer l'enthousiasme de rencontrer le prospect

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "À demain," - RIEN D'AUTRE APRÈS

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,
        userPromptTemplate: `Rédige un email de rappel pour le RDV demain :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Date du RDV : {{date_rdv}}
- Besoins : {{besoins}}`,
        fixedEmailSubject: '',
        fixedEmailBody: ''
      },
      prompt_plaquette: {
        useAI: true,
        systemPrompt: `Tu es un assistant pour conseillers en gestion de patrimoine.

Ta mission : rédiger un email sobre pour accompagner l'envoi d'une plaquette commerciale en pièce jointe.

CONTEXTE :
- Le prospect a demandé à recevoir la plaquette (statut "À rappeler - Plaquette")
- L'email doit être court et sobre, car la plaquette parle d'elle-même
- Ne pas surcharger d'informations, juste présenter la PJ

L'email doit :
- Être court (4-5 lignes max)
- Mentionner la plaquette en pièce jointe
- Inviter à la consulter et à revenir vers nous pour toute question
- Rester sobre et professionnel

⚠️ RÈGLE ABSOLUE - SIGNATURE :
- JAMAIS de signature à la fin (pas de nom, prénom, fonction, téléphone, etc.)
- JAMAIS de placeholder comme [Nom], [Prénom], [Signature], [Conseiller]
- Terminer UNIQUEMENT par "Cordialement," ou "Belle lecture," - RIEN D'AUTRE APRÈS

FORMAT DE SORTIE : {"objet": "...", "corps": "HTML avec <br>"}`,
        userPromptTemplate: `Rédige un email sobre pour accompagner la plaquette :
- Prénom : {{prenom}}
- Nom : {{nom}}
- Besoins : {{besoins}}

Email court et professionnel pour présenter la plaquette en pièce jointe.`,
        fixedEmailSubject: '',
        fixedEmailBody: ''
      }
    };

    // Update organization with default prompts
    await supabase
      .from('organizations')
      .update(defaultPromptConfigs)
      .eq('id', orgData.id);

    // 5. Create default pipeline stages
    const defaultStages = [
      { name: 'Nouveau', slug: 'nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false },
      { name: 'En attente', slug: 'en_attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false },
      { name: 'RDV Pris', slug: 'rdv_pris', color: '#10b981', position: 2, is_won: false, is_lost: false },
      { name: 'Négociation', slug: 'negociation', color: '#8b5cf6', position: 3, is_won: false, is_lost: false },
      { name: 'Gagné', slug: 'gagne', color: '#22c55e', position: 4, is_won: true, is_lost: false },
      { name: 'Perdu', slug: 'perdu', color: '#ef4444', position: 5, is_won: false, is_lost: true },
    ];

    await supabase.from('pipeline_stages').insert(
      defaultStages.map((stage) => ({
        ...stage,
        organization_id: orgData.id,
      }))
    );

    router.push('/dashboard');
    router.refresh();
  };

  if (emailSent) {
    return (
      <div className="relative">
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6), var(--glow)',
            paddingTop: '70px',
            paddingBottom: '70px'
          }}
        >
          <div className="text-center pt-12 pb-8 px-10 sm:px-8">
            <div className="flex justify-center mb-6">
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  background: 'var(--primary)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Mail style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 700,
              marginBottom: '8px',
              color: 'var(--text-white)',
              letterSpacing: '-0.03em'
            }}>
              Vérifiez votre email
            </h1>
            <p style={{
              color: 'var(--text-gray)',
              fontSize: '0.9rem',
              marginBottom: '24px',
              lineHeight: '1.5'
            }}>
              Nous avons envoyé un lien de vérification à <strong style={{ color: 'var(--text-white)' }}>{email}</strong>.
              Cliquez sur le lien dans l'email pour activer votre compte.
            </p>
            <p style={{
              color: 'var(--text-muted)',
              fontSize: '0.8rem',
              marginBottom: '32px'
            }}>
              Vérifiez également votre dossier de courriers indésirables.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={async () => {
                  const supabase = createClient();
                  const { error } = await supabase.auth.resend({
                    type: 'signup',
                    email,
                    options: {
                      emailRedirectTo: `${window.location.origin}/api/auth/callback?type=signup`
                    }
                  });
                  if (error) {
                    setError(error.message);
                  } else {
                    // Afficher un message de succès temporaire
                    const originalButton = document.activeElement as HTMLButtonElement;
                    if (originalButton) {
                      const originalText = originalButton.textContent;
                      originalButton.textContent = 'Email envoyé !';
                      originalButton.style.background = 'rgba(34, 197, 94, 0.1)';
                      originalButton.style.borderColor = '#22c55e';
                      originalButton.style.color = '#22c55e';
                      setTimeout(() => {
                        originalButton.textContent = originalText;
                        originalButton.style.background = 'transparent';
                        originalButton.style.borderColor = 'var(--border)';
                        originalButton.style.color = 'var(--text-white)';
                      }, 3000);
                    }
                  }
                }}
                style={{
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-white)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                Renvoyer l'email
              </button>

              <Link
                href="/login"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  fontSize: '0.9rem',
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--text-white)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)';
                  e.currentTarget.style.color = 'var(--text-muted)';
                }}
              >
                Retour à la connexion
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Card avec le même style que la landing page */}
      <div
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 40px 80px -20px rgba(0, 0, 0, 0.6), var(--glow)',
          paddingTop: '70px',
          paddingBottom: '70px'
        }}
      >
        {/* Header */}
        <div className="text-center pt-12 pb-8 px-10 sm:px-8">
          <div className="flex justify-center mb-6">
            <Link href="/" className="flex items-center gap-2 text-decoration-none">
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'white' }}>
                  <path d="M21 16.5c0 .38-.21.71-.53.88l-7.9 4.44c-.16.12-.36.18-.57.18-.21 0-.41-.06-.57-.18l-7.9-4.44A.991.991 0 013 16.5v-9c0-.38.21-.71.53-.88l7.9-4.44c.16-.12.36-.18.57-.18.21 0 .41.06.57.18l7.9 4.44c.32.17.53.5.53.88v9z"/>
                </svg>
              </div>
              <span
                style={{
                  fontWeight: 700,
                  fontSize: '1.25rem',
                  color: 'var(--text-white)',
                  textDecoration: 'none'
                }}
              >
                ULTRON
              </span>
            </Link>
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: 700,
            marginBottom: '8px',
            color: 'var(--text-white)',
            letterSpacing: '-0.03em',
            padding: '0 20px'
          }}>
            Créer un compte
          </h1>
          <p style={{ color: 'var(--text-gray)', fontSize: '0.9rem', padding: '0 24px' }}>
            Inscrivez-vous pour commencer votre prospection automatisée
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-10 pb-10 sm:px-8 sm:pb-8">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            {error && (
              <div
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  color: '#fca5a5',
                  fontSize: '0.875rem',
                  padding: '12px 16px',
                  borderRadius: '8px'
                }}
              >
                {error}
              </div>
            )}

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="fullName"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Nom complet
              </label>
              <input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="companyName"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Nom de l&apos;entreprise
              </label>
              <input
                id="companyName"
                type="text"
                placeholder="Cabinet Patrimoine"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="email"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <div style={{ width: '100%', maxWidth: '300px' }}>
              <label
                htmlFor="password"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  color: 'var(--text-gray)'
                }}
              >
                Mot de passe
              </label>
              <input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                style={{
                  width: '100%',
                  boxSizing: 'border-box' as const,
                  padding: '10px 14px',
                  fontSize: '0.9rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  color: 'var(--text-white)',
                  transition: 'var(--transition)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary)';
                  e.target.style.outline = 'none';
                  e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'var(--border)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                maxWidth: '300px',
                padding: '10px 20px',
                fontSize: '0.9rem',
                fontWeight: 500,
                marginTop: '8px'
              }}
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin"
                    style={{ width: '16px', height: '16px', marginRight: '8px' }}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 2v4m6 6h4m-6 6v4m-6-6H2" />
                  </svg>
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </button>

            <p style={{
              textAlign: 'center',
              fontSize: '0.875rem',
              color: 'var(--text-muted)',
              marginTop: '12px'
            }}>
              Déjà un compte ?{' '}
              <Link
                href="/login"
                style={{
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                  transition: 'var(--transition)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.color = 'var(--primary-dark)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.color = 'var(--primary)';
                }}
              >
                Se connecter
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Back to home link */}
      <div className="text-center mt-8">
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
            textDecoration: 'none',
            transition: 'var(--transition)'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = 'var(--text-white)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = 'var(--text-muted)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg
            style={{ width: '16px', height: '16px', transition: 'var(--transition)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span style={{ fontWeight: 500 }}>Retour à l&apos;accueil</span>
        </Link>
      </div>
    </div>
  );
}
