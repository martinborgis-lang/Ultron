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

async function checkStagesOrder() {
  console.log('🔍 Vérification de l\'ordre actuel des stages...\n');

  try {
    // Récupérer les stages d'une organisation pour exemple
    const { data: organizations, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) throw orgError;

    const org = organizations[0];
    console.log(`📋 Vérification pour: ${org.name} (${org.id})\n`);

    // Récupérer tous les stages de cette org, ordonnés par position
    const { data: stages, error: stagesError } = await supabase
      .from('pipeline_stages')
      .select('name, slug, position')
      .eq('organization_id', org.id)
      .order('position', { ascending: true });

    if (stagesError) throw stagesError;

    console.log('🏷️  ORDRE ACTUEL DES STAGES:');
    console.log('===============================');
    stages.forEach((stage, index) => {
      console.log(`${index + 1}. ${stage.name} (${stage.slug}) - Position: ${stage.position}`);
    });

    console.log('\n📝 ORDRE ATTENDU:');
    console.log('==================');
    const expectedOrder = [
      { name: 'Nouveau', slug: 'nouveau', position: 0 },
      { name: 'En attente', slug: 'en_attente', position: 1 },
      { name: 'RDV Pris', slug: 'rdv_pris', position: 2 },
      { name: 'RDV 2 Programmé', slug: 'rdv_2_programme', position: 3 },
      { name: 'RDV 2 Effectué', slug: 'rdv_2_effectue', position: 4 },
      { name: 'RDV 3 Programmé', slug: 'rdv_3_programme', position: 5 },
      { name: 'RDV 3 Effectué', slug: 'rdv_3_effectue', position: 6 },
      { name: 'Proposition Envoyée', slug: 'proposition_envoyee', position: 7 },
      { name: 'Négociation', slug: 'negociation', position: 8 },
      { name: 'Gagné', slug: 'gagne', position: 9 },
      { name: 'Perdu', slug: 'perdu', position: 10 },
    ];

    expectedOrder.forEach((stage, index) => {
      console.log(`${index + 1}. ${stage.name} (${stage.slug}) - Position: ${stage.position}`);
    });

    console.log('\n🔄 DIFFÉRENCES DÉTECTÉES:');
    console.log('==========================');

    const stageMap = new Map(stages.map(s => [s.slug, s]));
    let hasErrors = false;

    expectedOrder.forEach(expected => {
      const current = stageMap.get(expected.slug);
      if (current) {
        if (current.position !== expected.position) {
          console.log(`❌ ${expected.name}: Position actuelle ${current.position} ≠ Position attendue ${expected.position}`);
          hasErrors = true;
        } else {
          console.log(`✅ ${expected.name}: Position correcte (${expected.position})`);
        }
      } else {
        console.log(`❌ ${expected.name}: STAGE MANQUANT !`);
        hasErrors = true;
      }
    });

    if (hasErrors) {
      console.log('\n⚠️  CORRECTION NÉCESSAIRE');
    } else {
      console.log('\n✅ Ordre des stages correct !');
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

checkStagesOrder();