// ========================================
// API FIX STATUS APPEL - POUR TEST
// ========================================

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase-admin';

const supabase = createAdminClient();

export async function POST(request: NextRequest) {
  try {
    const { call_id } = await request.json();

    if (!call_id) {
      return NextResponse.json({ error: 'call_id requis' }, { status: 400 });
    }

    console.log('🔧 Correction du statut de l\'appel:', call_id);

    // Mettre à jour le statut de queued vers scheduled
    const { data: call, error: updateError } = await supabase
      .from('phone_calls')
      .update({
        status: 'scheduled'
      })
      .eq('id', call_id)
      .select('*')
      .single();

    if (updateError) {
      console.error('❌ Erreur mise à jour:', updateError);
      return NextResponse.json({
        error: 'Erreur mise à jour',
        details: updateError.message
      }, { status: 500 });
    }

    console.log('✅ Statut mis à jour:', {
      id: call.id,
      old_status: 'queued',
      new_status: call.status,
      scheduled_at: call.scheduled_at
    });

    return NextResponse.json({
      success: true,
      message: 'Statut mis à jour avec succès',
      call: {
        id: call.id,
        status: call.status,
        scheduled_at: call.scheduled_at,
        to_number: call.to_number
      }
    });

  } catch (error) {
    console.error('❌ Erreur fix status:', error);
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    }, { status: 500 });
  }
}