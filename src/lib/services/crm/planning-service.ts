import { createAdminClient } from '@/lib/supabase-admin';
import { IPlanningService, PlanningEvent, PlanningFilters } from '../interfaces';
import {
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getCalendarCredentials,
} from '@/lib/calendar';

export class CrmPlanningService implements IPlanningService {
  private supabase = createAdminClient();

  constructor(
    private organizationId: string,
    private userId: string
  ) {}

  private mapDbToEvent(row: any): PlanningEvent {
    return {
      id: row.id,
      type: row.type || 'task',
      title: row.title,
      description: row.description,
      startDate: row.start_date,
      endDate: row.end_date,
      dueDate: row.due_date,
      allDay: row.all_day || false,
      status: row.status || 'pending',
      completedAt: row.completed_at,
      prospectId: row.prospect_id,
      prospectName:
        row.prospect_name ||
        (row.prospect ? `${row.prospect.first_name} ${row.prospect.last_name}` : undefined),
      assignedTo: row.assigned_to,
      priority: row.priority || 'medium',
      externalId: row.external_id,
      meetLink: row.metadata?.meet_link,
      calendarLink: row.metadata?.calendar_html_link,
      createdAt: row.created_at,
    };
  }

  async getAll(filters?: PlanningFilters): Promise<PlanningEvent[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let query = this.supabase
      .from('crm_events')
      .select(
        `
        *,
        prospect:crm_prospects(first_name, last_name)
      `
      )
      .eq('organization_id', this.organizationId)
      .order('due_date', { ascending: true, nullsFirst: false });

    // Appliquer les filtres
    if (filters?.filter) {
      switch (filters.filter) {
        case 'today':
          query = query
            .gte('due_date', today.toISOString())
            .lt('due_date', tomorrow.toISOString());
          break;
        case 'overdue':
          query = query.lt('due_date', today.toISOString()).neq('status', 'completed');
          break;
        case 'upcoming':
          query = query.gte('due_date', tomorrow.toISOString());
          break;
      }
    }

    if (filters?.prospectId) {
      query = query.eq('prospect_id', filters.prospectId);
    }

    if (filters?.type) {
      query = query.eq('type', filters.type);
    }

    const { data, error } = await query;

    if (error) {
      console.error('CrmPlanningService.getAll error:', error);
      throw error;
    }

    return (data || []).map((row) => this.mapDbToEvent(row));
  }

  async getById(id: string): Promise<PlanningEvent | null> {
    const { data, error } = await this.supabase
      .from('crm_events')
      .select(
        `
        *,
        prospect:crm_prospects(first_name, last_name)
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapDbToEvent(data);
  }

  async create(event: Partial<PlanningEvent> & { addGoogleMeet?: boolean; attendeeEmail?: string }): Promise<PlanningEvent & { meetLink?: string }> {
    // Si prospect_id fourni, recuperer le nom et l'email
    let prospectName = event.prospectName;
    let prospectEmail = event.attendeeEmail;
    if (event.prospectId && (!prospectName || !prospectEmail)) {
      const { data: prospect } = await this.supabase
        .from('crm_prospects')
        .select('first_name, last_name, email')
        .eq('id', event.prospectId)
        .single();
      if (prospect) {
        if (!prospectName) {
          prospectName = `${prospect.first_name} ${prospect.last_name}`;
        }
        if (!prospectEmail) {
          prospectEmail = prospect.email;
        }
      }
    }

    // Générer start_date et end_date si non fournis mais due_date existe
    let startDate = event.startDate;
    let endDate = event.endDate;

    if (!startDate && event.dueDate) {
      startDate = event.dueDate;
    }

    if (!endDate && startDate) {
      // Par défaut, événement d'1 heure
      const endDateTime = new Date(startDate);
      endDateTime.setHours(endDateTime.getHours() + 1);
      endDate = endDateTime.toISOString();
    }

    console.log('📅 Planning create - FULL EVENT DATA:', JSON.stringify({
      startDate,
      endDate,
      dueDate: event.dueDate,
      addGoogleMeet: event.addGoogleMeet,
      type: event.type,
      title: event.title,
      prospectId: event.prospectId,
    }));

    const { data, error } = await this.supabase
      .from('crm_events')
      .insert({
        organization_id: this.organizationId,
        type: event.type || 'task',
        title: event.title,
        description: event.description,
        start_date: startDate,
        end_date: endDate,
        due_date: event.dueDate || startDate,
        all_day: event.allDay || false,
        priority: event.priority || 'medium',
        prospect_id: event.prospectId,
        prospect_name: prospectName,
        assigned_to: this.userId,
        created_by: this.userId,
        status: 'pending',
      })
      .select(
        `
        *,
        prospect:crm_prospects(first_name, last_name)
      `
      )
      .single();

    if (error) {
      console.error('CrmPlanningService.create error:', error);
      throw error;
    }

    // Sync with Google Calendar (best effort - don't block if it fails)
    console.log('📅 Calendar sync check:', {
      startDate: data.start_date,
      endDate: data.end_date,
    });

    let meetLink: string | undefined;

    try {
      const credentials = await getCalendarCredentials(this.userId, this.organizationId);
      console.log('📅 Calendar credentials found:', !!credentials);

      if (credentials && data.start_date && data.end_date) {
        console.log('📅 Creating SINGLE calendar event with Meet:', event.addGoogleMeet, '- NO OTHER EVENTS SHOULD BE CREATED');
        const calendarEvent = await createCalendarEvent(credentials, {
          summary: event.title || 'Événement Ultron',
          description: event.description || (prospectName ? `Prospect: ${prospectName}` : undefined),
          startDateTime: data.start_date,
          endDateTime: data.end_date,
          allDay: event.allDay,
          addGoogleMeet: event.addGoogleMeet,
          attendees: prospectEmail ? [prospectEmail] : undefined,
        });

        meetLink = calendarEvent.hangoutLink;

        // Store the external_id and meet_link for future sync
        const updateFields: Record<string, unknown> = {
          external_id: calendarEvent.id,
          external_source: 'google_calendar',
        };

        // Store meet link in metadata
        if (meetLink) {
          updateFields.metadata = {
            ...(data.metadata || {}),
            meet_link: meetLink,
            calendar_html_link: calendarEvent.htmlLink,
          };
        }

        await this.supabase
          .from('crm_events')
          .update(updateFields)
          .eq('id', data.id);

        console.log('✅ Event synced to Google Calendar:', calendarEvent.id, 'Meet link:', meetLink);
      }
    } catch (calendarError) {
      console.error('⚠️ Failed to sync to Google Calendar (non-blocking):', calendarError);
    }

    const result = this.mapDbToEvent(data);
    return { ...result, meetLink };
  }

  async update(id: string, data: Partial<PlanningEvent>): Promise<PlanningEvent> {
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.startDate !== undefined) updateData.start_date = data.startDate;
    if (data.endDate !== undefined) updateData.end_date = data.endDate;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.allDay !== undefined) updateData.all_day = data.allDay;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.completedAt !== undefined) updateData.completed_at = data.completedAt;

    const { data: result, error } = await this.supabase
      .from('crm_events')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        prospect:crm_prospects(first_name, last_name)
      `
      )
      .single();

    if (error) {
      console.error('CrmPlanningService.update error:', error);
      throw error;
    }

    // Sync update with Google Calendar
    try {
      const { data: eventData } = await this.supabase
        .from('crm_events')
        .select('external_id')
        .eq('id', id)
        .single();

      if (eventData?.external_id) {
        const credentials = await getCalendarCredentials(this.userId, this.organizationId);

        if (credentials) {
          await updateCalendarEvent(credentials, eventData.external_id, {
            summary: data.title,
            description: data.description,
            startDateTime: data.startDate,
            endDateTime: data.endDate,
            allDay: data.allDay,
          });
          console.log('✅ Event updated in Google Calendar:', eventData.external_id);
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Failed to update Google Calendar (non-blocking):', calendarError);
    }

    return this.mapDbToEvent(result);
  }

  async delete(id: string): Promise<void> {
    // Get the external_id before deleting
    const { data: existing } = await this.supabase
      .from('crm_events')
      .select('external_id')
      .eq('id', id)
      .single();

    const { error } = await this.supabase.from('crm_events').delete().eq('id', id);

    if (error) {
      console.error('CrmPlanningService.delete error:', error);
      throw error;
    }

    // Delete from Google Calendar
    try {
      if (existing?.external_id) {
        const credentials = await getCalendarCredentials(this.userId, this.organizationId);

        if (credentials) {
          await deleteCalendarEvent(credentials, existing.external_id);
          console.log('✅ Event deleted from Google Calendar:', existing.external_id);
        }
      }
    } catch (calendarError) {
      console.error('⚠️ Failed to delete from Google Calendar (non-blocking):', calendarError);
    }
  }

  async markComplete(id: string): Promise<PlanningEvent> {
    return this.update(id, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
  }

  async markIncomplete(id: string): Promise<PlanningEvent> {
    return this.update(id, {
      status: 'pending',
      completedAt: undefined,
    });
  }

  async getByProspect(prospectId: string): Promise<PlanningEvent[]> {
    return this.getAll({ prospectId });
  }
}
