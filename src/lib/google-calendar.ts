import { google } from 'googleapis';

function getCalendarClient(credentials: any) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials(credentials);
  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export async function getCalendarEvents(
  credentials: any,
  timeMin: Date,
  timeMax: Date
) {
  const calendar = getCalendarClient(credentials);

  const response = await calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults: 100,
  });

  return response.data.items || [];
}

export async function createCalendarEvent(
  credentials: any,
  event: {
    summary: string;
    description?: string;
    startDateTime: string;
    endDateTime: string;
    attendees?: string[];
    location?: string;
    addGoogleMeet?: boolean;
  }
) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    token_type: credentials.token_type || 'Bearer',
    expiry_date: credentials.expiry_date,
  });

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

  const requestBody: any = {
    summary: event.summary,
    description: event.description,
    location: event.location,
    start: {
      dateTime: event.startDateTime,
      timeZone: 'Europe/Paris',
    },
    end: {
      dateTime: event.endDateTime,
      timeZone: 'Europe/Paris',
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'email', minutes: 60 },
      ],
    },
  };

  // Ajouter les participants
  if (event.attendees && event.attendees.length > 0) {
    requestBody.attendees = event.attendees.map(email => ({
      email,
      responseStatus: 'needsAction',
    }));
    requestBody.guestsCanModify = false;
    requestBody.guestsCanInviteOthers = false;
    requestBody.guestsCanSeeOtherGuests = true;
  }

  // Ajouter Google Meet
  if (event.addGoogleMeet) {
    requestBody.conferenceData = {
      createRequest: {
        requestId: `ultron-meet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        conferenceSolutionKey: {
          type: 'hangoutsMeet',
        },
      },
    };
  }

  console.log('Creating event with requestBody:', JSON.stringify(requestBody, null, 2));

  const response = await calendar.events.insert({
    calendarId: 'primary',
    requestBody,
    conferenceDataVersion: event.addGoogleMeet ? 1 : 0,
    sendUpdates: event.attendees && event.attendees.length > 0 ? 'all' : 'none',
  });

  console.log('Event created:', response.data.id);
  console.log('Hangout link:', response.data.hangoutLink);

  return response.data;
}

export async function getCalendarEvent(credentials: any, eventId: string) {
  const calendar = getCalendarClient(credentials);

  const response = await calendar.events.get({
    calendarId: 'primary',
    eventId: eventId,
  });

  return response.data;
}

export async function updateCalendarEvent(
  credentials: any,
  eventId: string,
  event: {
    summary?: string;
    description?: string;
    startDateTime?: string;
    endDateTime?: string;
    location?: string;
  }
) {
  const calendar = getCalendarClient(credentials);

  const updateData: any = {};
  if (event.summary) updateData.summary = event.summary;
  if (event.description) updateData.description = event.description;
  if (event.location) updateData.location = event.location;
  if (event.startDateTime) {
    updateData.start = { dateTime: event.startDateTime, timeZone: 'Europe/Paris' };
  }
  if (event.endDateTime) {
    updateData.end = { dateTime: event.endDateTime, timeZone: 'Europe/Paris' };
  }

  const response = await calendar.events.patch({
    calendarId: 'primary',
    eventId: eventId,
    requestBody: updateData,
  });

  return response.data;
}

export async function deleteCalendarEvent(credentials: any, eventId: string) {
  const calendar = getCalendarClient(credentials);

  await calendar.events.delete({
    calendarId: 'primary',
    eventId: eventId,
  });

  return { success: true };
}
