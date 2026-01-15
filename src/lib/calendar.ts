import { google } from 'googleapis';
import { GoogleCredentials, getValidCredentials } from './google';
import { createAdminClient } from '@/lib/supabase-admin';

export interface CalendarEventInput {
  summary: string;
  description?: string;
  startDateTime: string;
  endDateTime: string;
  allDay?: boolean;
  attendees?: string[];
  location?: string;
  addGoogleMeet?: boolean;
}

export interface CalendarEventResult {
  id: string;
  htmlLink: string;
  hangoutLink?: string;
}

/**
 * Create an event in Google Calendar
 */
export async function createCalendarEvent(
  credentials: GoogleCredentials,
  event: CalendarEventInput
): Promise<CalendarEventResult> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const eventData: Record<string, unknown> = {
    summary: event.summary,
    description: event.description,
    location: event.location,
  };

  if (event.allDay) {
    const startDate = new Date(event.startDateTime).toISOString().split('T')[0];
    const endDate = new Date(event.endDateTime).toISOString().split('T')[0];
    eventData.start = { date: startDate };
    eventData.end = { date: endDate };
  } else {
    eventData.start = { dateTime: event.startDateTime, timeZone: 'Europe/Paris' };
    eventData.end = { dateTime: event.endDateTime, timeZone: 'Europe/Paris' };
  }

  if (event.attendees && event.attendees.length > 0) {
    eventData.attendees = event.attendees.map((email) => ({ email }));
  }

  if (event.addGoogleMeet) {
    eventData.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    };
  }

  const result = await calendar.events.insert({
    calendarId: 'primary',
    requestBody: eventData,
    conferenceDataVersion: event.addGoogleMeet ? 1 : 0,
    sendUpdates: event.attendees?.length ? 'all' : 'none',
  });

  return {
    id: result.data.id!,
    htmlLink: result.data.htmlLink!,
    hangoutLink: result.data.hangoutLink || undefined,
  };
}

/**
 * Update an event in Google Calendar
 */
export async function updateCalendarEvent(
  credentials: GoogleCredentials,
  eventId: string,
  event: Partial<CalendarEventInput>
): Promise<CalendarEventResult> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const updateData: Record<string, unknown> = {};

  if (event.summary) updateData.summary = event.summary;
  if (event.description !== undefined) updateData.description = event.description;
  if (event.location !== undefined) updateData.location = event.location;

  if (event.startDateTime && event.endDateTime) {
    if (event.allDay) {
      updateData.start = { date: event.startDateTime.split('T')[0] };
      updateData.end = { date: event.endDateTime.split('T')[0] };
    } else {
      updateData.start = { dateTime: event.startDateTime, timeZone: 'Europe/Paris' };
      updateData.end = { dateTime: event.endDateTime, timeZone: 'Europe/Paris' };
    }
  }

  const result = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updateData,
  });

  return {
    id: result.data.id!,
    htmlLink: result.data.htmlLink!,
    hangoutLink: result.data.hangoutLink || undefined,
  };
}

/**
 * Delete an event from Google Calendar
 */
export async function deleteCalendarEvent(
  credentials: GoogleCredentials,
  eventId: string
): Promise<void> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });
}

/**
 * Get Calendar credentials for a user
 * Priority: gmail_credentials (user) > google_credentials (org)
 */
export async function getCalendarCredentials(
  userId: string,
  organizationId: string
): Promise<GoogleCredentials | null> {
  const supabase = createAdminClient();

  // Try user's gmail_credentials first (includes calendar scope)
  const { data: user } = await supabase
    .from('users')
    .select('gmail_credentials')
    .eq('id', userId)
    .single();

  if (user?.gmail_credentials) {
    return user.gmail_credentials as GoogleCredentials;
  }

  // Fallback to organization credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('google_credentials')
    .eq('id', organizationId)
    .single();

  return (org?.google_credentials as GoogleCredentials) || null;
}
