/**
 * Types pour la gestion des emails dans l'application
 */

export interface EmailLog {
  id: string;
  organization_id: string;
  prospect_email: string;
  prospect_name: string;
  email_type: 'qualification' | 'synthese' | 'rappel' | 'plaquette' | 'custom';
  subject: string;
  body: string;
  gmail_message_id?: string;
  has_attachment: boolean;
  sent_at: string;
  opened_at?: string;
  opened_count: number;
  status: 'sent' | 'delivered' | 'opened' | 'failed';
  error_message?: string;
}

export interface EmailTemplate {
  id: string;
  organization_id: string;
  created_by: string;
  name: string;
  subject: string;
  content: string;
  category: 'introduction' | 'follow_up' | 'proposal' | 'closing' | 'other';
  is_shared: boolean;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface EmailAttachment {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  url?: string;
  buffer?: Buffer;
}

export interface EmailDraft {
  to: string;
  from?: string;
  subject: string;
  body: string;
  attachments?: EmailAttachment[];
  template_id?: string;
}

export interface EmailStats {
  total_sent: number;
  total_opened: number;
  open_rate: number;
  emails_today: number;
  emails_this_week: number;
  emails_this_month: number;
  by_type: Record<EmailLog['email_type'], number>;
  recent_emails: EmailLog[];
}