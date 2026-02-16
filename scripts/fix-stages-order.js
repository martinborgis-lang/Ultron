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

// Ordre correct des positions
const CORRECT_POSITIONS = {
  'nouveau': 0,
  'en_attente': 1,
  'rdv_pris': 2,
  'rdv_2_programme': 3,
  'rdv_2_effectue': 4,
  'rdv_3_programme': 5,
  'rdv_3_effectue': 6,
  'proposition_envoyee': 7,
  'negociation': 8,
  'gagne': 9,
  'perdu': 10,
};

async function fixStagesOrder() {
  console.log('🔧 Correction de l\'ordre des stages...\n');

  try {
    // Récupérer toutes les organisations
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name');

    if (orgError) throw orgError;

    console.log(`📋 ${organizations.length} organisation(s) à corriger\n`);

    for (const org of organizations) {
      console.log(`🏢 ${org.name} (${org.id})`);

      // Récupérer tous les stages de cette organisation
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('id, name, slug, position')
        .eq('organization_id', org.id);

      if (stagesError) throw stagesError;

      console.log(`   Stages trouvés: ${stages.length}`);

      // Identifier les stages à corriger
      const stagesToUpdate = [];

      for (const stage of stages) {
        const correctPosition = CORRECT_POSITIONS[stage.slug];
        if (correctPosition !== undefined && stage.position !== correctPosition) {
          stagesToUpdate.push({
            id: stage.id,
            name: stage.name,
            slug: stage.slug,
            currentPosition: stage.position,
            newPosition: correctPosition
          });
        }
      }

      if (stagesToUpdate.length > 0) {
        console.log(`   Stages à corriger: ${stagesToUpdate.length}`);

        for (const stage of stagesToUpdate) {
          console.log(`   - ${stage.name}: ${stage.currentPosition} → ${stage.newPosition}`);

          // Mettre à jour la position
          const { error: updateError } = await supabase
            .from('pipeline_stages')
            .update({ position: stage.newPosition })
            .eq('id', stage.id);

          if (updateError) {
            console.error(`   ❌ Erreur mise à jour ${stage.name}:`, updateError);
          } else {
            console.log(`   ✅ ${stage.name} mis à jour`);
          }
        }
      } else {
        console.log(`   ✅ Tous les stages sont déjà dans le bon ordre`);
      }

      console.log(''); // Ligne vide pour séparer les organisations
    }

    console.log('🎉 Correction terminée !');
    console.log('\n🔍 Vérification finale...\n');

    // Vérification finale sur une organisation
    const testOrg = organizations[0];
    const { data: finalStages, error: finalError } = await supabase
      .from('pipeline_stages')
      .select('name, slug, position')
      .eq('organization_id', testOrg.id)
      .order('position', { ascending: true });

    if (finalError) throw finalError;

    console.log(`📋 Ordre final pour ${testOrg.name}:`);
    console.log('================================');
    finalStages.forEach((stage, index) => {
      const expectedPosition = CORRECT_POSITIONS[stage.slug];
      const isCorrect = stage.position === expectedPosition;
      const icon = isCorrect ? '✅' : '❌';
      console.log(`${icon} ${index + 1}. ${stage.name} (position ${stage.position})`);
    });

  } catch (error) {
    console.error('❌ Erreur lors de la correction:', error);
    process.exit(1);
  }
}

fixStagesOrder();