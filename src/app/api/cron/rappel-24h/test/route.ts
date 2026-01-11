import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Test route to check pending reminders without sending them
// Usage: /api/cron/rappel-24h/test?secret=YOUR_CRON_SECRET
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const secret = url.searchParams.get('secret');

    // Verify authorization
    if (process.env.NODE_ENV === 'production' && secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date();

    // Get all scheduled emails with their status
    const { data: allEmails, error: fetchError } = await supabase
      .from('scheduled_emails')
      .select('id, organization_id, email_type, status, scheduled_for, sent_at, error_message, prospect_data')
      .order('scheduled_for', { ascending: true })
      .limit(100);

    if (fetchError) {
      throw new Error(`Failed to fetch scheduled emails: ${fetchError.message}`);
    }

    // Categorize emails
    const pending = allEmails?.filter(e => e.status === 'pending') || [];
    const processing = allEmails?.filter(e => e.status === 'processing') || [];
    const sent = allEmails?.filter(e => e.status === 'sent') || [];
    const errored = allEmails?.filter(e => e.status === 'error') || [];

    // Get pending that are due now
    const duePending = pending.filter(e => new Date(e.scheduled_for) <= now);

    // Format for display
    const formatEmail = (e: typeof allEmails[0]) => ({
      id: e.id,
      email: (e.prospect_data as { email?: string })?.email || 'N/A',
      prenom: (e.prospect_data as { prenom?: string })?.prenom || 'N/A',
      nom: (e.prospect_data as { nom?: string })?.nom || 'N/A',
      dateRdv: (e.prospect_data as { dateRdv?: string })?.dateRdv || 'N/A',
      row_number: (e.prospect_data as { row_number?: number })?.row_number || 'N/A',
      scheduled_for: e.scheduled_for,
      status: e.status,
      sent_at: e.sent_at,
      error_message: e.error_message,
    });

    return NextResponse.json({
      success: true,
      current_time: now.toISOString(),
      summary: {
        total: allEmails?.length || 0,
        pending: pending.length,
        due_now: duePending.length,
        processing: processing.length,
        sent: sent.length,
        errored: errored.length,
      },
      due_now: duePending.map(formatEmail),
      pending_future: pending.filter(e => new Date(e.scheduled_for) > now).map(formatEmail),
      recent_sent: sent.slice(0, 5).map(formatEmail),
      recent_errors: errored.slice(0, 5).map(formatEmail),
    });
  } catch (error) {
    console.error('Test route error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json(
      { error: 'Failed to fetch reminder status', details: errorMessage },
      { status: 500 }
    );
  }
}
