// ========================================
// API MIGRATION SCHEDULED - TEMPORAIRE
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Début migration pour statut scheduled');

    // 1. Ajouter la colonne scheduled_at si elle n'existe pas
    const addColumnQuery = `
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'phone_calls' AND column_name = 'scheduled_at') THEN
              ALTER TABLE phone_calls ADD COLUMN scheduled_at TIMESTAMPTZ;
          END IF;
      END $$;
    `;

    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: addColumnQuery
    });

    if (addColumnError) {
      console.error('❌ Erreur ajout colonne:', addColumnError);
      return NextResponse.json({
        error: 'Erreur ajout colonne scheduled_at',
        details: addColumnError.message
      }, { status: 500 });
    }

    console.log('✅ Colonne scheduled_at ajoutée');

    // 2. Supprimer l'ancienne contrainte
    const dropConstraintQuery = `
      ALTER TABLE phone_calls DROP CONSTRAINT IF EXISTS phone_calls_status_check;
    `;

    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: dropConstraintQuery
    });

    if (dropError) {
      console.error('❌ Erreur suppression contrainte:', dropError);
      return NextResponse.json({
        error: 'Erreur suppression contrainte',
        details: dropError.message
      }, { status: 500 });
    }

    console.log('✅ Ancienne contrainte supprimée');

    // 3. Ajouter la nouvelle contrainte avec 'scheduled'
    const addConstraintQuery = `
      ALTER TABLE phone_calls ADD CONSTRAINT phone_calls_status_check CHECK (status IN (
          'queued',
          'scheduled',
          'ringing',
          'in_progress',
          'completed',
          'failed',
          'no_answer',
          'busy',
          'cancelled'
      ));
    `;

    const { error: addConstraintError } = await supabase.rpc('exec_sql', {
      sql: addConstraintQuery
    });

    if (addConstraintError) {
      console.error('❌ Erreur ajout nouvelle contrainte:', addConstraintError);
      return NextResponse.json({
        error: 'Erreur ajout nouvelle contrainte',
        details: addConstraintError.message
      }, { status: 500 });
    }

    console.log('✅ Nouvelle contrainte avec scheduled ajoutée');

    // 4. Mettre à jour les appels existants
    const updateQuery = `
      UPDATE phone_calls
      SET status = 'scheduled'
      WHERE status = 'queued'
        AND created_at >= NOW() - INTERVAL '24 hours';
    `;

    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', {
      sql: updateQuery
    });

    if (updateError) {
      console.error('❌ Erreur mise à jour appels existants:', updateError);
      return NextResponse.json({
        error: 'Erreur mise à jour appels existants',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Appels existants mis à jour');

    return NextResponse.json({
      success: true,
      message: 'Migration scheduled réussie',
      steps: [
        'Colonne scheduled_at ajoutée',
        'Ancienne contrainte supprimée',
        'Nouvelle contrainte avec scheduled ajoutée',
        'Appels existants mis à jour'
      ]
    });

  } catch (error) {
    console.error('❌ Erreur migration:', error);
    return NextResponse.json({
      error: 'Erreur migration',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}