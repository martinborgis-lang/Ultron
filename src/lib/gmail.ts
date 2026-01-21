import { google } from 'googleapis';
import { GoogleCredentials, getValidCredentials } from './google';
import { createAdminClient } from './supabase/admin';
import EmailSecurityValidator from './validation/email-security';
import EmailRateLimiter from './validation/email-rate-limiting';

export interface EmailCredentialsResult {
  credentials: GoogleCredentials;
  source: 'user' | 'organization';
  userId?: string;
  userEmail?: string;
}

export interface EmailCredentialsError {
  error: 'invalid_grant' | 'no_credentials' | 'unknown';
  userId?: string;
  userEmail?: string;
  message: string;
}

/**
 * Get the appropriate Gmail credentials for sending emails.
 * Priority: 1. User's gmail_credentials 2. Organization's google_credentials
 * Returns error info if user's token is invalid (needs reconnection)
 */
export async function getEmailCredentials(
  organizationId: string,
  userId?: string
): Promise<{ result: EmailCredentialsResult | null; error?: EmailCredentialsError }> {
  const supabase = createAdminClient();

  // If userId is provided, try to get user's Gmail credentials first
  if (userId) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, gmail_credentials')
      .eq('id', userId)
      .eq('organization_id', organizationId)
      .single();

    if (user?.gmail_credentials) {
      try {
        const validCredentials = await getValidCredentials(user.gmail_credentials as GoogleCredentials);

        // Update credentials if refreshed
        if (validCredentials !== user.gmail_credentials) {
          await supabase
            .from('users')
            .update({ gmail_credentials: validCredentials })
            .eq('id', userId);
        }

        return {
          result: {
            credentials: validCredentials,
            source: 'user',
            userId: user.id,
            userEmail: user.email,
          },
        };
      } catch (error: unknown) {
        // Check if it's an invalid_grant error (token expired/revoked)
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('invalid_grant')) {
          console.log(`⚠️ Token invalide pour ${user.email} - le conseiller doit reconnecter son Gmail`);

          // Clear invalid credentials
          await supabase
            .from('users')
            .update({ gmail_credentials: null })
            .eq('id', userId);

          return {
            result: null,
            error: {
              error: 'invalid_grant',
              userId: user.id,
              userEmail: user.email,
              message: `Le conseiller ${user.email} doit reconnecter son compte Gmail dans Paramètres > Équipe`,
            },
          };
        }
        throw error; // Re-throw other errors
      }
    }
  }

  // Fallback to organization credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('id, google_credentials')
    .eq('id', organizationId)
    .single();

  if (org?.google_credentials) {
    try {
      const validCredentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

      // Update credentials if refreshed
      if (validCredentials !== org.google_credentials) {
        await supabase
          .from('organizations')
          .update({ google_credentials: validCredentials })
          .eq('id', organizationId);
      }

      return {
        result: {
          credentials: validCredentials,
          source: 'organization',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('invalid_grant')) {
        return {
          result: null,
          error: {
            error: 'invalid_grant',
            message: `Les credentials de l'organisation sont invalides. Reconnectez Google dans Paramètres.`,
          },
        };
      }
      throw error;
    }
  }

  return { result: null };
}

/**
 * Get Gmail credentials by looking up the user by email address.
 * Priority: 1. User's gmail_credentials (by email) 2. Organization's google_credentials
 * Returns error info if user's token is invalid (needs reconnection)
 */
export async function getEmailCredentialsByEmail(
  organizationId: string,
  userEmail?: string
): Promise<{ result: EmailCredentialsResult | null; error?: EmailCredentialsError }> {
  const supabase = createAdminClient();

  console.log('=== RECHERCHE CONSEILLER PAR EMAIL ===');
  console.log('Email recherche:', userEmail);
  console.log('Organization ID:', organizationId);

  // If userEmail is provided, try to get user's Gmail credentials first
  if (userEmail && userEmail.trim() !== '') {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, gmail_credentials')
      .eq('email', userEmail.trim().toLowerCase())
      .eq('organization_id', organizationId)
      .single();

    console.log('Resultat recherche:', user ? `Trouve: ${user.email}` : 'Non trouve');
    if (userError) console.log('Erreur recherche:', userError.message);
    console.log('Gmail credentials presents:', !!user?.gmail_credentials);

    if (user?.gmail_credentials) {
      try {
        const validCredentials = await getValidCredentials(user.gmail_credentials as GoogleCredentials);

        // Update credentials if refreshed
        if (validCredentials !== user.gmail_credentials) {
          await supabase
            .from('users')
            .update({ gmail_credentials: validCredentials })
            .eq('id', user.id);
        }

        console.log('✅ Utilisation Gmail conseiller:', user.email);
        return {
          result: {
            credentials: validCredentials,
            source: 'user',
            userId: user.id,
            userEmail: user.email,
          },
        };
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('invalid_grant')) {
          console.log(`⚠️ Token invalide pour ${user.email} - le conseiller doit reconnecter son Gmail`);

          // Clear invalid credentials
          await supabase
            .from('users')
            .update({ gmail_credentials: null })
            .eq('id', user.id);

          return {
            result: null,
            error: {
              error: 'invalid_grant',
              userId: user.id,
              userEmail: user.email,
              message: `Le conseiller ${user.email} doit reconnecter son compte Gmail dans Paramètres > Équipe`,
            },
          };
        }
        throw error;
      }
    } else if (user) {
      console.log('⚠️ Conseiller trouve mais sans Gmail connecte, fallback sur organisation');
    } else {
      console.log('⚠️ Conseiller non trouve dans la base, fallback sur organisation');
    }
  } else {
    console.log('⚠️ Pas d\'email conseiller fourni, fallback sur organisation');
  }

  // Fallback to organization credentials
  const { data: org } = await supabase
    .from('organizations')
    .select('id, google_credentials')
    .eq('id', organizationId)
    .single();

  if (org?.google_credentials) {
    try {
      const validCredentials = await getValidCredentials(org.google_credentials as GoogleCredentials);

      // Update credentials if refreshed
      if (validCredentials !== org.google_credentials) {
        await supabase
          .from('organizations')
          .update({ google_credentials: validCredentials })
          .eq('id', organizationId);
      }

      console.log('📧 Utilisation Gmail organisation');
      return {
        result: {
          credentials: validCredentials,
          source: 'organization',
        },
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('invalid_grant')) {
        return {
          result: null,
          error: {
            error: 'invalid_grant',
            message: `Les credentials de l'organisation sont invalides. Reconnectez Google dans Paramètres.`,
          },
        };
      }
      throw error;
    }
  }

  return { result: null };
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

  // ✅ SÉCURITÉ EMAIL: Validation complète avant création du message
  const emailValidation = EmailSecurityValidator.validateFullEmail({
    to,
    from,
    subject,
    body,
  }, {
    allowHtml: true,
    maxLength: 50000,
    strictMode: false,
    checkPhishing: true,
  });

  if (!emailValidation.isValid) {
    const report = EmailSecurityValidator.generateSecurityReport(emailValidation);
    throw new Error(`Email security validation failed:\n${report}`);
  }

  // Utiliser les valeurs sécurisées
  const sanitizedEmail = JSON.parse(emailValidation.sanitizedValue);

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${sanitizedEmail.to}`,
    sanitizedEmail.from ? `From: ${sanitizedEmail.from}` : null,
    'Content-Type: text/html; charset=utf-8',
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(sanitizedEmail.subject).toString('base64')}?=`,
  ].filter(Boolean);

  // MIME format requires blank line between headers and body
  const email = headers.join('\r\n') + '\r\n\r\n' + sanitizedEmail.body.replace(/\n/g, '<br>');
  return Buffer.from(email).toString('base64url');
}

async function createEmailWithAttachment(
  options: EmailWithAttachmentOptions
): Promise<string> {
  const { to, subject, body, from, attachmentUrl, attachmentName } = options;

  // ✅ SÉCURITÉ EMAIL: Validation complète avec attachement
  const emailValidation = EmailSecurityValidator.validateFullEmail({
    to,
    from,
    subject,
    body,
    attachmentName,
  }, {
    allowHtml: true,
    maxLength: 50000,
    strictMode: false,
    checkPhishing: true,
    allowAttachments: true,
  });

  if (!emailValidation.isValid) {
    const report = EmailSecurityValidator.generateSecurityReport(emailValidation);
    throw new Error(`Email security validation failed:\n${report}`);
  }

  // Utiliser les valeurs sécurisées
  const sanitizedEmail = JSON.parse(emailValidation.sanitizedValue);

  // ✅ VALIDATION URL ATTACHMENT: Vérifier que l'URL n'est pas malveillante
  try {
    const urlValidation = new URL(attachmentUrl);
    if (!['https:', 'http:'].includes(urlValidation.protocol)) {
      throw new Error('Invalid attachment URL protocol');
    }
  } catch {
    throw new Error('Invalid attachment URL format');
  }

  // Fetch the attachment
  const response = await fetch(attachmentUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch attachment: ${response.statusText}`);
  }

  const attachmentBuffer = await response.arrayBuffer();

  // ✅ VALIDATION TAILLE ATTACHMENT
  if (attachmentBuffer.byteLength > 25 * 1024 * 1024) { // 25MB limite Gmail
    throw new Error('Attachment too large (max 25MB)');
  }

  const attachmentBase64 = Buffer.from(attachmentBuffer).toString('base64');
  const mimeType = response.headers.get('content-type') || 'application/pdf';

  const boundary = `boundary_${Date.now()}`;

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${sanitizedEmail.to}`,
    sanitizedEmail.from ? `From: ${sanitizedEmail.from}` : null,
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(sanitizedEmail.subject).toString('base64')}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  // Build multipart body with proper MIME structure
  const bodyContent = sanitizedEmail.body.replace(/\n/g, '<br>');
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyContent,
    '',
    `--${boundary}`,
    `Content-Type: ${mimeType}; name="${sanitizedEmail.attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${sanitizedEmail.attachmentName}"`,
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
  options: EmailOptions,
  organizationId?: string,
  userId?: string
): Promise<{ messageId: string }> {
  // ✅ RATE LIMITING: Vérifier les limites avant envoi
  if (organizationId && options.from) {
    const rateLimitResult = EmailRateLimiter.checkRateLimit(
      organizationId,
      options.from,
      options.to
    );

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit dépassé: ${rateLimitResult.reason}. Réessayez dans ${
        rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
      } secondes.`);
    }
  }

  // ✅ PROTECTION SPAM: Détecter contenu spam
  const spamDetection = EmailRateLimiter.detectSpamContent(options.subject, options.body);
  if (spamDetection.isSpam) {
    throw new Error(`Contenu détecté comme spam (score: ${spamDetection.score}): ${spamDetection.reasons.join(', ')}`);
  }

  // ✅ BLACKLIST: Vérifier si destinataire est blacklisté
  if (EmailRateLimiter.isEmailBlacklisted(options.to)) {
    throw new Error(`Adresse email blacklistée: ${options.to}`);
  }

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

  // ✅ ENREGISTREMENT: Enregistrer l'email envoyé pour rate limiting
  if (organizationId && options.from) {
    EmailRateLimiter.recordEmailSent(organizationId, options.from, options.to, userId);
  }

  return { messageId: result.data.id || '' };
}

export async function sendEmailWithAttachment(
  credentials: GoogleCredentials,
  options: EmailWithAttachmentOptions,
  organizationId?: string,
  userId?: string
): Promise<{ messageId: string }> {
  // ✅ RATE LIMITING: Vérifier les limites avant envoi
  if (organizationId && options.from) {
    const rateLimitResult = EmailRateLimiter.checkRateLimit(
      organizationId,
      options.from,
      options.to
    );

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit dépassé: ${rateLimitResult.reason}. Réessayez dans ${
        rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
      } secondes.`);
    }
  }

  // ✅ PROTECTION SPAM: Détecter contenu spam
  const spamDetection = EmailRateLimiter.detectSpamContent(options.subject, options.body);
  if (spamDetection.isSpam) {
    throw new Error(`Contenu détecté comme spam (score: ${spamDetection.score}): ${spamDetection.reasons.join(', ')}`);
  }

  // ✅ BLACKLIST: Vérifier si destinataire est blacklisté
  if (EmailRateLimiter.isEmailBlacklisted(options.to)) {
    throw new Error(`Adresse email blacklistée: ${options.to}`);
  }

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

  // ✅ ENREGISTREMENT: Enregistrer l'email envoyé pour rate limiting
  if (organizationId && options.from) {
    EmailRateLimiter.recordEmailSent(organizationId, options.from, options.to, userId);
  }

  return { messageId: result.data.id || '' };
}

function createEmailWithBufferAttachment(
  options: EmailWithBufferAttachmentOptions
): string {
  const { to, subject, body, from, attachmentBuffer, attachmentName, attachmentMimeType } = options;

  // ✅ SÉCURITÉ EMAIL: Validation complète avec buffer attachment
  const emailValidation = EmailSecurityValidator.validateFullEmail({
    to,
    from,
    subject,
    body,
    attachmentName,
  }, {
    allowHtml: true,
    maxLength: 50000,
    strictMode: false,
    checkPhishing: true,
    allowAttachments: true,
  });

  if (!emailValidation.isValid) {
    const report = EmailSecurityValidator.generateSecurityReport(emailValidation);
    throw new Error(`Email security validation failed:\n${report}`);
  }

  // Utiliser les valeurs sécurisées
  const sanitizedEmail = JSON.parse(emailValidation.sanitizedValue);

  // ✅ VALIDATION TAILLE BUFFER
  if (attachmentBuffer.length > 25 * 1024 * 1024) { // 25MB limite Gmail
    throw new Error('Attachment too large (max 25MB)');
  }

  // ✅ VALIDATION MIME TYPE
  const allowedMimeTypes = [
    'application/pdf',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
  ];

  if (!allowedMimeTypes.includes(attachmentMimeType)) {
    throw new Error(`Unsafe MIME type: ${attachmentMimeType}`);
  }

  const attachmentBase64 = attachmentBuffer.toString('base64');
  const boundary = `boundary_${Date.now()}`;

  // Build headers (filter out empty optional headers like From)
  const headers = [
    `To: ${sanitizedEmail.to}`,
    sanitizedEmail.from ? `From: ${sanitizedEmail.from}` : null,
    'MIME-Version: 1.0',
    `Subject: =?UTF-8?B?${Buffer.from(sanitizedEmail.subject).toString('base64')}?=`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
  ].filter(Boolean);

  // Build multipart body with proper MIME structure
  const bodyContent = sanitizedEmail.body.replace(/\n/g, '<br>');
  const multipartBody = [
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    '',
    bodyContent,
    '',
    `--${boundary}`,
    `Content-Type: ${attachmentMimeType}; name="${sanitizedEmail.attachmentName}"`,
    'Content-Transfer-Encoding: base64',
    `Content-Disposition: attachment; filename="${sanitizedEmail.attachmentName}"`,
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
  options: EmailWithBufferAttachmentOptions,
  organizationId?: string,
  userId?: string
): Promise<{ messageId: string }> {
  // ✅ RATE LIMITING: Vérifier les limites avant envoi
  if (organizationId && options.from) {
    const rateLimitResult = EmailRateLimiter.checkRateLimit(
      organizationId,
      options.from,
      options.to
    );

    if (!rateLimitResult.allowed) {
      throw new Error(`Rate limit dépassé: ${rateLimitResult.reason}. Réessayez dans ${
        rateLimitResult.resetTime ? Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000) : 60
      } secondes.`);
    }
  }

  // ✅ PROTECTION SPAM: Détecter contenu spam
  const spamDetection = EmailRateLimiter.detectSpamContent(options.subject, options.body);
  if (spamDetection.isSpam) {
    throw new Error(`Contenu détecté comme spam (score: ${spamDetection.score}): ${spamDetection.reasons.join(', ')}`);
  }

  // ✅ BLACKLIST: Vérifier si destinataire est blacklisté
  if (EmailRateLimiter.isEmailBlacklisted(options.to)) {
    throw new Error(`Adresse email blacklistée: ${options.to}`);
  }

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

  // ✅ ENREGISTREMENT: Enregistrer l'email envoyé pour rate limiting
  if (organizationId && options.from) {
    EmailRateLimiter.recordEmailSent(organizationId, options.from, options.to, userId);
  }

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
