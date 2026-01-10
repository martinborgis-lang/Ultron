import { google } from 'googleapis';
import { GoogleCredentials, getValidCredentials } from './google';

export interface EmailOptions {
  to: string;
  subject: string;
  body: string;
  from?: string;
}

export interface EmailWithAttachmentOptions extends EmailOptions {
  attachmentUrl: string;
  attachmentName: string;
}

function createEmailMessage(options: EmailOptions): string {
  const { to, subject, body, from } = options;

  const emailLines = [
    `To: ${to}`,
    from ? `From: ${from}` : '',
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    '',
    body.replace(/\n/g, '<br>'),
  ].filter(Boolean);

  const email = emailLines.join('\r\n');
  return Buffer.from(email).toString('base64url');
}

async function createEmailWithAttachment(
  options: EmailWithAttachmentOptions
): Promise<string> {
  const { to, subject, body, from, attachmentUrl, attachmentName } = options;

  // Fetch the attachment
  const response = await fetch(attachmentUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: ${response.statusText}`);
  }

  const attachmentBuffer = await response.arrayBuffer();
  const attachmentBase64 = Buffer.from(attachmentBuffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'application/pdf';

  const boundary = `boundary_${Date.now()}`;

  const emailParts = [
    `To: ${to}`,
    from ? `From: ${from}` : '',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    body.replace(/\n/g, '<br>'),
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    '',
    attachmentBase64,
    '',
    `--${boundary}--`,
  ].filter(Boolean);

  const email = emailParts.join('\r\n');
  return Buffer.from(email).toString('base64url');
}

export async function sendEmail(
  credentials: GoogleCredentials,
  options: EmailOptions
): Promise<{ messageId: string }> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const raw = createEmailMessage(options);

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return { messageId: result.data.id || '' };
}

export async function sendEmailWithAttachment(
  credentials: GoogleCredentials,
  options: EmailWithAttachmentOptions
): Promise<{ messageId: string }> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const raw = await createEmailWithAttachment(options);

  const result = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw },
  });

  return { messageId: result.data.id || '' };
}

export async function getGmailUserEmail(
  credentials: GoogleCredentials
): Promise<string> {
  const validCredentials = await getValidCredentials(credentials);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: validCredentials.access_token,
    refresh_token: validCredentials.refresh_token,
  });

  const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

  const profile = await gmail.users.getProfile({ userId: 'me' });

  return profile.data.emailAddress || '';
}
