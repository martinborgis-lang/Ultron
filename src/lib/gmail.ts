import { google } from 'googleapis';
import { GoogleCredentials, getValidCredentials } from './google';
import { createAdminClient } from './supabase/admin';

export interface EmailCredentialsResult {
  credentials: GoogleCredentials;
  source: 'user' | 'organization';
  userId?: string;
}

/**
 * Get the appropriate Gmail credentials for sending emails.
 * Priority: 1. User's gmail_credentials 2. Organization's google_credentials
 */
export async function getEmailCredentials(
  organizationId: string,
  userId?: string
): Promise<EmailCredentialsResult | null> {
  const supabase = createAdminClient();

  // If userId is provided, try to get user's Gmail credentials first
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('id, gmail_credentials')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (user?.gmail_credentials) {
      const validCredentials = await getValidCredentials(user.gmail_credentials as GoogleCredentials);

      // Update credentials if refreshed
      if (validCredentials !== user.gmail_credentials) {
        await supabase
          .from('users')
          .update({ gmail_credentials: validCredentials })
          .eq('id', userId);
      }

      return {
        credentials: validCredentials,
        source: 'user',
        userId: user.id,
      };
    }
  }

  // Fallback to organization credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('id, google_credentials')
    .eq('id', organizationId)
    .single();

  if (org?.google_credentials) {
    const validCredentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

    // Update credentials if refreshed
    if (validCredentials !== org.google_credentials) {
      await supabase
        .from('organizations')
        .update({ google_credentials: validCredentials })
        .eq('id', organizationId);
    }

    return {
      credentials: validCredentials,
      source: 'organization',
    };
  }

  return null;
}

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

export interface EmailWithBufferAttachmentOptions extends EmailOptions {
  attachmentBuffer: Buffer;
  attachmentName: string;
  attachmentMimeType: string;
}

function createEmailMessage(options: EmailOptions): string {
  const { to, subject, body, from } = options;

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${to}`,
    from ? `From: ${from}` : null,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
  ].filter(Boolean);

  // MIME format requires blank line between headers and body
  const email = headers.join('\r\n') + '\r\n\r\n' + body.replace(/\n/g, '<br>');
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

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${to}`,
    from ? `From: ${from}` : null,
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  // Build multipart body with proper MIME structure
  const bodyContent = body.replace(/\n/g, '<br>');
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyContent,
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    '',
    attachmentBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  // MIME format requires blank line between headers and body
  const email = headers.join('\r\n') + '\r\n\r\n' + multipartBody;
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

function createEmailWithBufferAttachment(
  options: EmailWithBufferAttachmentOptions
): string {
  const { to, subject, body, from, attachmentBuffer, attachmentName, attachmentMimeType } = options;

  const attachmentBase64 = attachmentBuffer.toString('base64');
  const boundary = `boundary_${Date.now()}`;

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${to}`,
    from ? `From: ${from}` : null,
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  // Build multipart body with proper MIME structure
  const bodyContent = body.replace(/\n/g, '<br>');
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyContent,
    '',
    `--${boundary}`,
    `Content-Type: ${attachmentMimeType}; name="${attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${attachmentName}"`,
    '',
    attachmentBase64,
    '',
    `--${boundary}--`,
  ].join('\r\n');

  // MIME format requires blank line between headers and body
  const email = headers.join('\r\n') + '\r\n\r\n' + multipartBody;
  return Buffer.from(email).toString('base64url');
}

export async function sendEmailWithBufferAttachment(
  credentials: GoogleCredentials,
  options: EmailWithBufferAttachmentOptions
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

  const raw = createEmailWithBufferAttachment(options);

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
