import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUserAndOrganization } from '@/lib/services/get-organization';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { user, organization } = await getCurrentUserAndOrganization();

    if (!user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { callSid, notes, outcome, nextAction, prospectUpdate } = body;

    if (!callSid) {
      return NextResponse.json({ error: 'Call SID requis' }, { status: 400 });
    }

    const supabase = await createClient();

    // Mise à jour des notes de l'appel
    const { data: callData, error: updateError } = await supabase
      .from('voice_calls')
      .update({
        notes: notes || '',
        outcome: outcome || null,
        updated_at: new Date().toISOString()
      })
      .eq('twilio_call_sid', callSid)
      .eq('organization_id', organization.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour notes:', updateError);
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
    }

    // Si l'appel est lié à un prospect, mettre à jour les informations
    if (callData?.prospect_id) {
      const prospectUpdates: any = {
        last_activity_at: new Date().toISOString()
      };

      // Mise à jour des informations prospect si fournies
      if (prospectUpdate) {
        if (prospectUpdate.stage) {
          prospectUpdates.stage_slug = prospectUpdate.stage;
        }
        if (prospectUpdate.notes) {
          prospectUpdates.notes = prospectUpdate.notes;
        }
        if (prospectUpdate.qualification) {
          prospectUpdates.qualification = prospectUpdate.qualification;
        }
      }

      await supabase
        .from('crm_prospects')
        .update(prospectUpdates)
        .eq('id', callData.prospect_id)
        .eq('organization_id', organization.id);

      // Création d'une activité CRM détaillée
      const activityContent = [
        notes && `Notes: ${notes}`,
        outcome && `Résultat: ${outcome}`,
        nextAction && `Prochaine action: ${nextAction}`
      ].filter(Boolean).join('\n\n');

      await supabase
        .from('crm_activities')
        .insert({
          organization_id: organization.id,
          prospect_id: callData.prospect_id,
          user_id: user.id,
          type: 'call',
          direction: 'outbound',
          subject: `Appel terminé - ${outcome || 'Notes ajoutées'}`,
          content: activityContent,
          outcome: outcome,
          duration_minutes: callData.duration_seconds ? Math.round(callData.duration_seconds / 60) : null,
          metadata: {
            call_sid: callSid,
            manual_notes: true,
            next_action: nextAction
          }
        });

      // Création d'une tâche de suivi si une prochaine action est spécifiée
      if (nextAction && nextAction !== 'aucune') {
        const taskTitle = getTaskTitle(nextAction);
        const dueDate = getTaskDueDate(nextAction);

        await supabase
          .from('crm_events')
          .insert({
            organization_id: organization.id,
            prospect_id: callData.prospect_id,
            assigned_to: user.id,
            created_by: user.id,
            type: 'task',
            title: taskTitle,
            description: `Suite à l'appel du ${new Date().toLocaleDateString('fr-FR')}: ${notes || ''}`,
            due_date: dueDate.toISOString(),
            priority: getPriority(nextAction),
            status: 'pending',
            metadata: {
              generated_from_call: true,
              call_sid: callSid,
              call_outcome: outcome
            }
          });
      }
    }

    // Log de l'activité
    await supabase
      .from('activity_logs')
      .insert({
        organization_id: organization.id,
        user_id: user.id,
        action: 'call_notes_saved',
        entity_type: 'call',
        entity_id: callData?.id,
        details: {
          call_sid: callSid,
          notes_added: !!notes,
          outcome: outcome,
          next_action: nextAction,
          prospect_updated: !!prospectUpdate
        }
      });

    return NextResponse.json({
      success: true,
      callSid,
      notesUpdated: true,
      prospectUpdated: !!callData?.prospect_id,
      taskCreated: !!nextAction && nextAction !== 'aucune'
    });

  } catch (error) {
    console.error('Erreur sauvegarde notes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur lors de la sauvegarde' },
      { status: 500 }
    );
  }
}

function getTaskTitle(nextAction: string): string {
  const actionTitles: { [key: string]: string } = {
    'rappel_1_semaine': 'Rappel programmé dans 1 semaine',
    'rappel_1_mois': 'Rappel programmé dans 1 mois',
    'envoyer_documentation': 'Envoyer la documentation',
    'programmer_rdv': 'Programmer un rendez-vous',
    'relance_email': 'Relance par email',
    'qualification_approfondie': 'Qualification approfondie nécessaire',
    'suivi_commercial': 'Suivi commercial'
  };

  return actionTitles[nextAction] || `Suivi: ${nextAction}`;
}

function getTaskDueDate(nextAction: string): Date {
  const now = new Date();

  switch (nextAction) {
    case 'rappel_1_semaine':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'rappel_1_mois':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'envoyer_documentation':
    case 'relance_email':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Demain
    case 'programmer_rdv':
    case 'qualification_approfondie':
      return new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000); // Après-demain
    default:
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // Dans 3 jours
  }
}

function getPriority(nextAction: string): 'low' | 'medium' | 'high' | 'urgent' {
  const highPriorityActions = ['programmer_rdv', 'suivi_commercial'];
  const mediumPriorityActions = ['envoyer_documentation', 'relance_email', 'qualification_approfondie'];

  if (highPriorityActions.includes(nextAction)) {
    return 'high';
  } else if (mediumPriorityActions.includes(nextAction)) {
    return 'medium';
  }

  return 'low';
}