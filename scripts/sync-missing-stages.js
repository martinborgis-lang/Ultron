const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variables Supabase manquantes dans .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Stages par défaut étendus avec workflow RDV multiples
const DEFAULT_STAGES = [
  { name: 'Nouveau', slug: 'nouveau', color: '#6366f1', position: 0, is_won: false, is_lost: false },
  { name: 'En attente', slug: 'en_attente', color: '#f59e0b', position: 1, is_won: false, is_lost: false },
  { name: 'RDV Pris', slug: 'rdv_pris', color: '#10b981', position: 2, is_won: false, is_lost: false },

  // NOUVEAUX STAGES RDV MULTIPLES - positions entières
  { name: 'RDV 2 Programmé', slug: 'rdv_2_programme', color: '#8B5CF6', position: 3, is_won: false, is_lost: false },
  { name: 'RDV 2 Effectué', slug: 'rdv_2_effectue', color: '#7C3AED', position: 4, is_won: false, is_lost: false },
  { name: 'RDV 3 Programmé', slug: 'rdv_3_programme', color: '#6D28D9', position: 5, is_won: false, is_lost: false },
  { name: 'RDV 3 Effectué', slug: 'rdv_3_effectue', color: '#5B21B6', position: 6, is_won: false, is_lost: false },
  { name: 'Proposition Envoyée', slug: 'proposition_envoyee', color: '#F59E0B', position: 7, is_won: false, is_lost: false },

  // Stages existants réorganisés
  { name: 'Négociation', slug: 'negociation', color: '#8b5cf6', position: 8, is_won: false, is_lost: false },
  { name: 'Gagné', slug: 'gagne', color: '#22c55e', position: 9, is_won: true, is_lost: false },
  { name: 'Perdu', slug: 'perdu', color: '#ef4444', position: 10, is_won: false, is_lost: false },
];

async function syncStages() {
  console.log('🔄 Synchronisation des stages manquants...');

  try {
    // Récupérer toutes les organisations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) throw orgError;

    console.log(`📋 ${organizations.length} organisation(s) trouvée(s)`);

    for (const org of organizations) {
      console.log(`\n🏢 Organisation: ${org.name} (${org.id})`);

      // Vérifier les stages existants pour cette org
      const { data: existingStages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('slug, name')
        .eq('organization_id', org.id);

      if (stagesError) throw stagesError;

      console.log(`   Stages existants: ${existingStages.length}`);
      existingStages.forEach(s => console.log(`   - ${s.slug}: ${s.name}`));

      const existingSlugs = new Set(existingStages.map(s => s.slug));
      const stagesToCreate = DEFAULT_STAGES.filter(stage => !existingSlugs.has(stage.slug));

      console.log(`   Stages à créer: ${stagesToCreate.length}`);

      if (stagesToCreate.length > 0) {
        stagesToCreate.forEach(s => console.log(`   + ${s.slug}: ${s.name}`));

        // Insérer les nouveaux stages
        const { data: newStages, error: insertError } = await supabase
          .from('pipeline_stages')
          .insert(
            stagesToCreate.map(stage => ({
              organization_id: org.id,
              name: stage.name,
              slug: stage.slug,
              color: stage.color,
              position: stage.position,
              is_won: stage.is_won,
              is_lost: stage.is_lost,
            }))
          )
          .select();

        if (insertError) throw insertError;

        console.log(`   ✅ ${newStages.length} stage(s) créé(s) avec succès`);
      } else {
        console.log(`   ✅ Tous les stages sont déjà présents`);
      }
    }

    console.log('\n🎉 Synchronisation terminée avec succès !');

  } catch (error) {
    console.error('❌ Erreur lors de la synchronisation:', error);
    process.exit(1);
  }
}

syncStages();