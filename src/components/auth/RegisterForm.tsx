'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    // 1. Create auth user
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError || !authData.user) {
      setError(signUpError?.message || 'Erreur lors de la creation du compte');
      setLoading(false);
      return;
    }

    // 2. Create organization with default scoring config
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

  return (
    <div className="relative">
      {/* Glassmorphism card */}
      <div className="bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl shadow-black/20 overflow-hidden">
        {/* Header */}
        <div className="text-center pt-8 pb-6 px-8">
          <div className="flex justify-center mb-6">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center">
                <span className="text-white font-bold text-lg">U</span>
              </div>
              <span className="text-2xl font-bold text-white">ULTRON</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Créer un compte</h1>
          <p className="text-white/60">Inscrivez-vous pour commencer</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 pb-8">
          <div className="space-y-5">
            {error && (
              <div className="bg-red-500/20 border border-red-500/30 text-red-200 text-sm p-3 rounded-lg backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName" className="text-white/80">
                Nom complet
              </Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Jean Dupont"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName" className="text-white/80">
                Nom de l&apos;entreprise
              </Label>
              <Input
                id="companyName"
                type="text"
                placeholder="Cabinet Patrimoine"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Adresse email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">
                Mot de passe
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimum 6 caractères"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-indigo-400 focus:ring-indigo-400/20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white py-6 rounded-xl shadow-lg shadow-indigo-500/25 transition-all hover:shadow-xl hover:shadow-indigo-500/40"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Création en cours...
                </>
              ) : (
                'Créer mon compte'
              )}
            </Button>

            <p className="text-sm text-white/50 text-center pt-2">
              Déjà un compte ?{' '}
              <Link
                href="/login"
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
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
          className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white/90 transition-all duration-200 hover:scale-105 group"
        >
          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Retour à l'accueil</span>
        </Link>
      </div>
    </div>
  );
}
