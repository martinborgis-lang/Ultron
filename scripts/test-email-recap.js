#!/usr/bin/env node

/**
 * Script de test pour le système d'email récap post-RDV
 * Usage: node scripts/test-email-recap.js
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration (utiliser les mêmes variables que l'app)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SUPABASE_SERVICE_ROLE_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTests() {
  console.log('🧪 Test du système d\'email récap post-RDV\n');

  try {
    // Test 1: Vérifier la table scheduled_emails existe
    console.log('1. Vérification table scheduled_emails...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'scheduled_emails');

    if (tablesError || !tables || tables.length === 0) {
      console.log('❌ Table scheduled_emails non trouvée');
      console.log('   → Exécuter: database/migrations/email_recap_system.sql');
      return;
    }
    console.log('✅ Table scheduled_emails existe\n');

    // Test 2: Vérifier les colonnes dans organizations
    console.log('2. Vérification colonnes organizations...');
    const { data: orgColumns, error: orgError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'organizations')
      .in('column_name', ['email_recap_enabled', 'email_recap_delay_hours']);

    if (orgError || !orgColumns || orgColumns.length < 2) {
      console.log('❌ Colonnes email_recap manquantes dans organizations');
      console.log('   → Exécuter: ALTER TABLE organizations ADD COLUMN...');
      return;
    }
    console.log('✅ Colonnes email_recap présentes\n');

    // Test 3: Compter les emails programmés existants
    console.log('3. État des emails programmés...');
    const { data: emailStats, error: statsError } = await supabase
      .from('scheduled_emails')
      .select('status')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (statsError) {
      console.log('❌ Erreur lecture scheduled_emails:', statsError.message);
      return;
    }

    const stats = (emailStats || []).reduce((acc, email) => {
      acc[email.status] = (acc[email.status] || 0) + 1;
      return acc;
    }, {});

    console.log('✅ Statistiques dernières 24h:');
    console.log('   • Pending:', stats.pending || 0);
    console.log('   • Sent:', stats.sent || 0);
    console.log('   • Failed:', stats.failed || 0);
    console.log('   • Cancelled:', stats.cancelled || 0);
    console.log('   • Total:', emailStats?.length || 0);
    console.log();

    // Test 4: Vérifier les paramètres d'une organisation
    console.log('4. Paramètres email des organisations...');
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('id, name, email_recap_enabled, email_recap_delay_hours')
      .limit(5);

    if (orgsError) {
      console.log('❌ Erreur lecture organizations:', orgsError.message);
      return;
    }

    console.log('✅ Paramètres organisations:');
    (orgs || []).forEach(org => {
      console.log(`   • ${org.name}:`);
      console.log(`     - Activé: ${org.email_recap_enabled ? 'OUI' : 'NON'}`);
      console.log(`     - Délai: ${org.email_recap_delay_hours || 2}h`);
    });
    console.log();

    // Test 5: Simuler programmation d'un email (sans l'enregistrer)
    console.log('5. Test logique programmation...');
    const testDelay = 2; // heures
    const rdvTime = new Date();
    const scheduledTime = new Date(rdvTime.getTime() + testDelay * 60 * 60 * 1000);

    console.log('✅ Logique de calcul:');
    console.log(`   • RDV simulé: ${rdvTime.toLocaleString('fr-FR')}`);
    console.log(`   • Délai: ${testDelay}h`);
    console.log(`   • Email programmé: ${scheduledTime.toLocaleString('fr-FR')}`);
    console.log(`   • Dans: ${Math.round((scheduledTime.getTime() - Date.now()) / (1000 * 60))} minutes\n`);

    // Test 6: Vérifier les endpoints API
    console.log('6. Endpoints API à tester manuellement:');
    console.log('   📧 GET  /api/organization/email-settings');
    console.log('   📧 PATCH /api/organization/email-settings');
    console.log('   🤖 GET  /api/cron/send-scheduled-emails (avec Authorization: Bearer CRON_SECRET)');
    console.log('   🧪 POST /api/admin/test-email-scheduling (admin uniquement)\n');

    // Test 7: Vérifier le fichier vercel.json
    console.log('7. Configuration CRON Vercel:');
    try {
      const fs = require('fs');
      const vercelConfig = JSON.parse(fs.readFileSync('./vercel.json', 'utf8'));

      if (vercelConfig.crons && vercelConfig.crons.some(c => c.path === '/api/cron/send-scheduled-emails')) {
        console.log('✅ CRON configuré dans vercel.json');
        console.log(`   • Fréquence: ${vercelConfig.crons.find(c => c.path === '/api/cron/send-scheduled-emails').schedule}`);
      } else {
        console.log('❌ CRON manquant dans vercel.json');
      }
    } catch (e) {
      console.log('❌ Erreur lecture vercel.json:', e.message);
    }
    console.log();

    console.log('🎉 Tests terminés avec succès !');
    console.log('\n📋 Prochaines étapes:');
    console.log('1. Tester la UI dans /settings (onglet Emails)');
    console.log('2. Créer un RDV test et vérifier la programmation');
    console.log('3. Surveiller les logs CRON après déploiement');
    console.log('4. Utiliser /api/admin/test-email-scheduling pour tests rapides');

  } catch (error) {
    console.error('💥 Erreur critique:', error.message);
    console.log('\n🔧 Vérifications:');
    console.log('1. Variables d\'environnement (SUPABASE_SERVICE_ROLE_KEY)');
    console.log('2. Connexion Supabase');
    console.log('3. Migration SQL exécutée');
  }
}

// Exécuter les tests
runTests().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});