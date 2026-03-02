import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/debug/add-demo-data - Ajouter des données de démo à une organisation
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // 1. Récupérer l'utilisateur et son organisation
    const { data: user } = await adminClient
      .from('users')
      .select(`
        id,
        organization_id,
        email,
        full_name,
        organization:organizations(
          id,
          name
        )
      `)
      .eq('email', email)
      .single();

    if (!user || !user.organization_id) {
      return NextResponse.json({
        error: 'Utilisateur ou organisation non trouvé'
      }, { status: 404 });
    }

    // 2. Vérifier s'il y a déjà des prospects
    const { data: existingProspects } = await adminClient
      .from('crm_prospects')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', user.organization_id);

    if (existingProspects && existingProspects > 0) {
      return NextResponse.json({
        message: 'L\'organisation a déjà des prospects',
        count: existingProspects
      });
    }

    // 3. Récupérer les stages de l'organisation
    const { data: stages } = await adminClient
      .from('pipeline_stages')
      .select('id, slug')
      .eq('organization_id', user.organization_id)
      .order('position');

    if (!stages || stages.length === 0) {
      return NextResponse.json({
        error: 'Aucun stage pipeline trouvé pour cette organisation'
      }, { status: 400 });
    }

    // 4. Prospects de démo variés pour démonstration Google OAuth
    const demoProspects = [
      {
        first_name: 'Jean',
        last_name: 'Dupont',
        email: 'jean.dupont@demo.fr',
        phone: '+33 6 12 34 56 78',
        company: 'Tech Solutions SAS',
        job_title: 'Directeur Général',
        age: 45,
        profession: 'Chef d\'entreprise',
        revenus_annuels: 85000,
        patrimoine_estime: 250000,
        situation_familiale: 'Marié',
        nb_enfants: 2,
        city: 'Paris',
        postal_code: '75001',
        source: 'Site web',
        stage_slug: 'nouveau',
        qualification: 'CHAUD',
        score_ia: 78,
        analyse_ia: 'Profil intéressant: dirigeant avec bons revenus et patrimoine, recherche optimisation fiscale',
        notes: 'Intéressé par PER et défiscalisation immobilière. Disponible pour RDV semaine prochaine.'
      },
      {
        first_name: 'Marie',
        last_name: 'Martin',
        email: 'marie.martin@demo.fr',
        phone: '+33 6 23 45 67 89',
        company: 'Cabinet Médical',
        job_title: 'Médecin',
        age: 38,
        profession: 'Profession libérale',
        revenus_annuels: 120000,
        patrimoine_estime: 180000,
        situation_familiale: 'Mariée',
        nb_enfants: 1,
        city: 'Lyon',
        postal_code: '69002',
        source: 'Recommandation',
        stage_slug: 'rdv_pris',
        qualification: 'CHAUD',
        score_ia: 85,
        analyse_ia: 'Excellent profil: médecin libéral, revenus élevés, souhaite optimiser sa fiscalité',
        notes: 'RDV prévu jeudi 14h. Intérêt pour PERP et investissements immobiliers.'
      },
      {
        first_name: 'Pierre',
        last_name: 'Rousseau',
        email: 'pierre.rousseau@demo.fr',
        phone: '+33 6 34 56 78 90',
        company: 'Freelance',
        job_title: 'Consultant IT',
        age: 35,
        profession: 'Consultant',
        revenus_annuels: 65000,
        patrimoine_estime: 95000,
        situation_familiale: 'Célibataire',
        nb_enfants: 0,
        city: 'Marseille',
        postal_code: '13001',
        source: 'LinkedIn',
        stage_slug: 'en_attente',
        qualification: 'TIEDE',
        score_ia: 58,
        analyse_ia: 'Profil correct mais patrimoine limité. Potentiel à moyen terme.',
        notes: 'Souhaite d\'abord se renseigner. Rappel prévu dans 2 semaines.'
      },
      {
        first_name: 'Sophie',
        last_name: 'Bernard',
        email: 'sophie.bernard@demo.fr',
        phone: '+33 6 45 67 89 01',
        company: 'Bernard SARL',
        job_title: 'Gérante',
        age: 52,
        profession: 'Dirigeante',
        revenus_annuels: 95000,
        patrimoine_estime: 320000,
        situation_familiale: 'Mariée',
        nb_enfants: 3,
        city: 'Toulouse',
        postal_code: '31000',
        source: 'Salon professionnel',
        stage_slug: 'negociation',
        qualification: 'CHAUD',
        score_ia: 82,
        analyse_ia: 'Très bon profil: dirigeante expérimentée, patrimoine important, famille nombreuse',
        notes: 'En discussion pour gestion globale du patrimoine. Décision fin de mois.'
      },
      {
        first_name: 'Thomas',
        last_name: 'Leroy',
        email: 'thomas.leroy@demo.fr',
        phone: '+33 6 56 78 90 12',
        company: 'Artisan Plombier',
        job_title: 'Artisan',
        age: 28,
        profession: 'Artisan',
        revenus_annuels: 42000,
        patrimoine_estime: 35000,
        situation_familiale: 'Marié',
        nb_enfants: 0,
        city: 'Nantes',
        postal_code: '44000',
        source: 'Recommandation client',
        stage_slug: 'perdu',
        qualification: 'FROID',
        score_ia: 32,
        analyse_ia: 'Patrimoine et revenus trop faibles pour nos services actuels',
        notes: 'Trop tôt pour nos services. Recontact dans 5 ans.',
        lost_reason: 'Budget insuffisant',
        lost_date: new Date().toISOString()
      }
    ];

    // 5. Insérer les prospects de démo
    const prospectsToInsert = demoProspects.map(prospect => {
      const stage = stages.find(s => s.slug === prospect.stage_slug);
      return {
        ...prospect,
        organization_id: user.organization_id,
        assigned_to: user.id,
        stage_id: stage?.id || stages[0].id,
        derniere_qualification: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    });

    const { data: insertedProspects, error: insertError } = await adminClient
      .from('crm_prospects')
      .insert(prospectsToInsert)
      .select('id, first_name, last_name, qualification, stage_slug');

    if (insertError) {
      throw new Error(`Erreur insertion prospects: ${insertError.message}`);
    }

    // 6. Ajouter quelques événements de démo
    const demoEvents = [
      {
        title: 'RDV Marie Martin - Analyse patrimoniale',
        description: 'Rendez-vous pour analyse complète du patrimoine et recommandations',
        type: 'meeting',
        start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Demain
        end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(), // Demain + 1h
        prospect_name: 'Marie Martin',
        assigned_to: user.id,
        created_by: user.id,
        status: 'pending'
      },
      {
        title: 'Rappel Pierre Rousseau',
        description: 'Rappel programmé pour relance prospect tiède',
        type: 'call',
        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // Dans 2 semaines
        prospect_name: 'Pierre Rousseau',
        assigned_to: user.id,
        created_by: user.id,
        status: 'pending'
      }
    ];

    const eventsToInsert = demoEvents.map(event => ({
      ...event,
      organization_id: user.organization_id
    }));

    const { data: insertedEvents } = await adminClient
      .from('crm_events')
      .insert(eventsToInsert)
      .select('id, title, type, start_date');

    return NextResponse.json({
      success: true,
      message: `Données de démo ajoutées pour ${email}`,
      organization: user.organization?.name,
      data: {
        prospects_created: insertedProspects?.length || 0,
        prospects: insertedProspects,
        events_created: insertedEvents?.length || 0,
        events: insertedEvents
      }
    });

  } catch (error: any) {
    console.error('Erreur ajout données démo:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'ajout des données de démo' },
      { status: 500 }
    );
  }
}