import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/debug/fix-user - Corriger un utilisateur avec profil incomplet
export async function POST(request: NextRequest) {
  try {
    const { email, full_name, company_name } = await request.json();

    if (!email || !full_name || !company_name) {
      return NextResponse.json({
        error: 'Email, nom complet et nom entreprise requis'
      }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Vérifier que l'utilisateur auth existe
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const authUser = authUsers.users.find(u => u.email === email);

    if (!authUser) {
      return NextResponse.json({
        error: 'Utilisateur auth non trouvé'
      }, { status: 404 });
    }

    // 2. Vérifier s'il a déjà un profil
    const { data: existingUser } = await adminClient
      .from('users')
      .select('*')
      .eq('auth_id', authUser.id)
      .single();

    if (existingUser && existingUser.organization_id) {
      return NextResponse.json({
        error: 'L\'utilisateur a déjà un profil complet',
        user: existingUser
      }, { status: 400 });
    }

    const generateSlug = (name: string) => {
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const uniqueSuffix = Math.random().toString(36).substring(2, 8);
      return `${baseSlug}-${uniqueSuffix}`;
    };

    // 3. Créer l'organisation
    const { data: orgData, error: orgError } = await adminClient
      .from('organizations')
      .insert({
        name: company_name,
        slug: generateSlug(company_name),
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

    if (orgError) {
      throw new Error(`Erreur création organisation: ${orgError.message}`);
    }

    // 4. Créer ou mettre à jour le profil utilisateur
    let userResult;
    if (existingUser) {
      // Mettre à jour l'utilisateur existant
      const { data: updatedUser, error: updateError } = await adminClient
        .from('users')
        .update({
          organization_id: orgData.id,
          full_name: full_name,
          role: 'admin'
        })
        .eq('auth_id', authUser.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Erreur mise à jour utilisateur: ${updateError.message}`);
      }
      userResult = updatedUser;
    } else {
      // Créer le profil utilisateur
      const { data: newUser, error: userError } = await adminClient
        .from('users')
        .insert({
          auth_id: authUser.id,
          organization_id: orgData.id,
          email: email,
          full_name: full_name,
          role: 'admin',
          is_active: true
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`Erreur création utilisateur: ${userError.message}`);
      }
      userResult = newUser;
    }

    // 5. Ajouter les prompts par défaut
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

    await adminClient
      .from('organizations')
      .update(defaultPromptConfigs)
      .eq('id', orgData.id);

    // 6. Créer les stages par défaut
    const defaultStages = [
      { name: 'Nouveau', slug: 'nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false },
      { name: 'En attente', slug: 'en_attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false },
      { name: 'RDV Pris', slug: 'rdv_pris', color: '#10b981', position: 2, is_won: false, is_lost: false },
      { name: 'Négociation', slug: 'negociation', color: '#8b5cf6', position: 3, is_won: false, is_lost: false },
      { name: 'Gagné', slug: 'gagne', color: '#22c55e', position: 4, is_won: true, is_lost: false },
      { name: 'Perdu', slug: 'perdu', color: '#ef4444', position: 5, is_won: false, is_lost: true },
    ];

    await adminClient.from('pipeline_stages').insert(
      defaultStages.map((stage) => ({
        ...stage,
        organization_id: orgData.id,
      }))
    );

    return NextResponse.json({
      success: true,
      message: `Utilisateur ${email} corrigé avec succès`,
      user: userResult,
      organization: orgData
    });

  } catch (error: any) {
    console.error('Erreur correction utilisateur:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de la correction' },
      { status: 500 }
    );
  }
}