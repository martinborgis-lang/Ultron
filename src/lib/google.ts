import { logger } from '@/lib/logger';

import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

// Default tab name in Google Sheet (can be customized per organization in the future)
export const SHEET_TAB_NAME = 'Prospect';

// Scopes for organization-level OAuth (Sheets + Drive + Gmail + Calendar)
const ORGANIZATION_SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

// Scopes for user-level Gmail OAuth (Gmail + Calendar)
const GMAIL_SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];

export type OAuthType = 'organization' | 'gmail';

export interface GoogleCredentials {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export interface Prospect {
  id: string;
  rowNumber: number; // Numéro de ligne dans la Sheet (2 = première ligne de données)
  dateLead: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  source: string;
  age: string;
  situationPro: string;
  revenus: string;
  patrimoine: string;
  besoins: string;
  notesAppel: string;
  statutAppel: string;
  dateRdv: string;
  rappelSouhaite: string;
  qualificationIA: string;
  scoreIA: string;
  prioriteIA: string;
  justificationIA: string;
  rdvPrevu: string;
  lienRappel: string;
  mailPlaquette: string;
  mailSynthese: string;
  mailRappel: string;
}

function getOAuth2Client(): OAuth2Client {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/google/callback`
  );
}

export function generateAuthUrl(state: string, type: OAuthType = 'organization'): string {
  const oauth2Client = getOAuth2Client();
  const scopes = type === 'gmail' ? GMAIL_SCOPES : ORGANIZATION_SCOPES;

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
    include_granted_scopes: true,
  });
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleCredentials> {
  const oauth2Client = getOAuth2Client();

  const { tokens } = await oauth2Client.getToken(code);

  return {
    access_token: tokens.access_token!,
    refresh_token: tokens.refresh_token!,
    expiry_date: tokens.expiry_date!,
    token_type: tokens.token_type!,
    scope: tokens.scope!,
  };
}

export async function refreshAccessToken(credentials: GoogleCredentials): Promise<GoogleCredentials> {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    refresh_token: credentials.refresh_token,
  });

  const { credentials: newTokens } = await oauth2Client.refreshAccessToken();

  return {
    access_token: newTokens.access_token!,
    refresh_token: credentials.refresh_token,
    expiry_date: newTokens.expiry_date!,
    token_type: newTokens.token_type!,
    scope: newTokens.scope!,
  };
}

export function isTokenExpired(credentials: GoogleCredentials): boolean {
  return Date.now() >= credentials.expiry_date - 60000;
}

export async function getValidCredentials(credentials: GoogleCredentials): Promise<GoogleCredentials> {
  if (isTokenExpired(credentials)) {
    return await refreshAccessToken(credentials);
  }
  return credentials;
}

export function createSheetsClient(credentials: GoogleCredentials) {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  return google.sheets({ version: 'v4', auth: oauth2Client });
}

export async function readGoogleSheet(
  credentials: GoogleCredentials,
  sheetId: string,
  range: string = 'A:Y'
): Promise<string[][]> {
  const sheets = createSheetsClient(credentials);

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range,
  });

  return response.data.values || [];
}

export async function updateGoogleSheetCells(
  credentials: GoogleCredentials,
  sheetId: string,
  updates: { range: string; value: string }[]
): Promise<void> {
  const sheets = createSheetsClient(credentials);

  const data = updates.map((u) => ({
    range: u.range,
    values: [[u.value]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: sheetId,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data,
    },
  });
}

/**
 * Append a row to a Google Sheet
 */
export async function appendGoogleSheetRow(
  credentials: GoogleCredentials,
  sheetId: string,
  values: string[],
  range: string = `${SHEET_TAB_NAME}!A:Z`
): Promise<{ updatedRange: string; rowNumber: number }> {
  const sheets = createSheetsClient(credentials);

  const response = await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [values],
    },
  });

  // Extract the row number from the updated range (e.g., "Prospects!A42:Z42" -> 42)
  const updatedRange = response.data.updates?.updatedRange || '';
  const match = updatedRange.match(/:?[A-Z]+(\d+)/);
  const rowNumber = match ? parseInt(match[1]) : 0;

  logger.debug('✅ Row appended to Sheet:', { updatedRange, rowNumber });

  return { updatedRange, rowNumber };
}

export function parseProspectsFromSheet(rows: string[][]): Prospect[] {
  if (rows.length < 2) return [];

  const dataRows = rows.slice(1);

  return dataRows
    .map((row, index) => ({
      id: row[0] || '',
      rowNumber: index + 2, // Row 1 = headers, Row 2 = first data row
      dateLead: row[1] || '',
      nom: row[2] || '',
      prenom: row[3] || '',
      email: row[4] || '',
      telephone: row[5] || '',
      source: row[6] || '',
      age: row[7] || '',
      situationPro: row[8] || '',
      revenus: row[9] || '',
      patrimoine: row[10] || '',
      besoins: row[11] || '',
      notesAppel: row[12] || '',
      statutAppel: row[13] || '',
      dateRdv: row[14] || '',
      rappelSouhaite: row[15] || '',
      qualificationIA: row[16] || '',
      scoreIA: row[17] || '',
      prioriteIA: row[18] || '',
      justificationIA: row[19] || '',
      rdvPrevu: row[20] || '',
      lienRappel: row[21] || '',
      mailPlaquette: row[22] || '',
      mailSynthese: row[23] || '',
      mailRappel: row[24] || '',
    }))
    .filter((p) => p.nom || p.prenom || p.email);
}

export function calculateStats(prospects: Prospect[]) {
  const chauds = prospects.filter((p) =>
    p.qualificationIA?.toUpperCase() === 'CHAUD'
  ).length;

  const tiedes = prospects.filter((p) =>
    p.qualificationIA?.toUpperCase() === 'TIEDE' ||
    p.qualificationIA?.toUpperCase() === 'TIÈDE'
  ).length;

  const froids = prospects.filter((p) =>
    p.qualificationIA?.toUpperCase() === 'FROID'
  ).length;

  const mailsEnvoyes = prospects.reduce((count, p) => {
    let sent = 0;
    if (p.mailPlaquette?.toLowerCase() === 'oui') sent++;
    if (p.mailSynthese?.toLowerCase() === 'oui') sent++;
    if (p.mailRappel?.toLowerCase() === 'oui') sent++;
    return count + sent;
  }, 0);

  const rdvPris = prospects.filter((p) =>
    p.dateRdv && p.dateRdv.trim() !== ''
  ).length;

  return {
    total: prospects.length,
    chauds,
    tiedes,
    froids,
    mailsEnvoyes,
    rdvPris,
  };
}

export interface DriveFile {
  data: Buffer;
  mimeType: string;
  fileName: string;
}

export async function downloadFileFromDrive(
  credentials: GoogleCredentials,
  fileId: string
): Promise<DriveFile> {
  const oauth2Client = getOAuth2Client();

  oauth2Client.setCredentials({
    access_token: credentials.access_token,
    refresh_token: credentials.refresh_token,
    expiry_date: credentials.expiry_date,
  });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  // Get file metadata
  const fileMetadata = await drive.files.get({
    fileId: fileId,
    fields: 'name, mimeType',
  });

  // Download file content
  const response = await drive.files.get(
    { fileId: fileId, alt: 'media' },
    { responseType: 'arraybuffer' }
  );

  return {
    data: Buffer.from(response.data as ArrayBuffer),
    mimeType: fileMetadata.data.mimeType || 'application/pdf',
    fileName: fileMetadata.data.name || 'plaquette.pdf',
  };
}
