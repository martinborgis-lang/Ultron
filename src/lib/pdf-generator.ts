import type { TranscriptSegment, ObjectionDetected } from '@/types/meeting';

/**
 * Generate HTML content for a meeting transcript PDF
 */
export function generateTranscriptHtml(data: {
  prospectName: string;
  meetingDate: Date;
  duration: number;
  segments: TranscriptSegment[];
  summary?: string;
  keyPoints?: string[];
  objections?: ObjectionDetected[];
  nextActions?: string[];
}): string {
  const { prospectName, meetingDate, duration, segments, summary, keyPoints, objections, nextActions } = data;

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const speakerLabel = (speaker: string): string => {
    switch (speaker) {
      case 'advisor': return 'Conseiller';
      case 'prospect': return 'Prospect';
      default: return 'Inconnu';
    }
  };

  const speakerColor = (speaker: string): string => {
    switch (speaker) {
      case 'advisor': return '#6366f1';
      case 'prospect': return '#10b981';
      default: return '#6b7280';
    }
  };

  const objectionCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      price: 'Prix',
      trust: 'Confiance',
      timing: 'Timing',
      competition: 'Concurrence',
      need: 'Besoin',
      other: 'Autre',
    };
    return labels[category] || category;
  };

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Transcript - ${prospectName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }

    .header {
      border-bottom: 2px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }

    .header h1 {
      font-size: 24px;
      color: #6366f1;
      margin-bottom: 10px;
    }

    .header .meta {
      display: flex;
      gap: 30px;
      color: #6b7280;
      font-size: 14px;
    }

    .section {
      margin-bottom: 30px;
    }

    .section h2 {
      font-size: 18px;
      color: #374151;
      margin-bottom: 15px;
      padding-bottom: 5px;
      border-bottom: 1px solid #e5e7eb;
    }

    .summary {
      background: #f9fafb;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #6366f1;
    }

    .key-points ul, .next-actions ul {
      list-style: none;
      padding-left: 0;
    }

    .key-points li, .next-actions li {
      padding: 8px 0;
      padding-left: 25px;
      position: relative;
    }

    .key-points li::before {
      content: "✓";
      position: absolute;
      left: 0;
      color: #10b981;
      font-weight: bold;
    }

    .next-actions li::before {
      content: "→";
      position: absolute;
      left: 0;
      color: #6366f1;
      font-weight: bold;
    }

    .objections {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .objection {
      background: #fef3c7;
      padding: 15px;
      border-radius: 8px;
      border-left: 4px solid #f59e0b;
    }

    .objection .category {
      display: inline-block;
      background: #f59e0b;
      color: white;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .objection .text {
      font-weight: 500;
      margin-bottom: 8px;
    }

    .objection .response {
      color: #6b7280;
      font-size: 14px;
    }

    .transcript {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .segment {
      display: flex;
      gap: 15px;
    }

    .segment .timestamp {
      flex-shrink: 0;
      width: 50px;
      color: #9ca3af;
      font-size: 12px;
      font-family: monospace;
    }

    .segment .content {
      flex: 1;
    }

    .segment .speaker {
      font-weight: 600;
      font-size: 12px;
      margin-bottom: 4px;
    }

    .segment .text {
      color: #374151;
    }

    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
    }

    @media print {
      body {
        padding: 20px;
      }

      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Transcript de réunion</h1>
    <div class="meta">
      <span><strong>Prospect:</strong> ${prospectName}</span>
      <span><strong>Date:</strong> ${meetingDate.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })}</span>
      <span><strong>Durée:</strong> ${formatDuration(duration)}</span>
    </div>
  </div>

  ${summary ? `
  <div class="section">
    <h2>Résumé</h2>
    <div class="summary">
      ${summary}
    </div>
  </div>
  ` : ''}

  ${keyPoints && keyPoints.length > 0 ? `
  <div class="section key-points">
    <h2>Points clés</h2>
    <ul>
      ${keyPoints.map(point => `<li>${point}</li>`).join('\n      ')}
    </ul>
  </div>
  ` : ''}

  ${objections && objections.length > 0 ? `
  <div class="section">
    <h2>Objections détectées</h2>
    <div class="objections">
      ${objections.map(obj => `
      <div class="objection">
        <span class="category">${objectionCategoryLabel(obj.category)}</span>
        <div class="text">${obj.objection}</div>
        <div class="response"><strong>Réponse suggérée:</strong> ${obj.suggested_response}</div>
      </div>
      `).join('\n      ')}
    </div>
  </div>
  ` : ''}

  ${nextActions && nextActions.length > 0 ? `
  <div class="section next-actions">
    <h2>Prochaines actions</h2>
    <ul>
      ${nextActions.map(action => `<li>${action}</li>`).join('\n      ')}
    </ul>
  </div>
  ` : ''}

  <div class="section">
    <h2>Transcription complète</h2>
    <div class="transcript">
      ${segments.map(seg => `
      <div class="segment">
        <div class="timestamp">${formatTimestamp(seg.timestamp)}</div>
        <div class="content">
          <div class="speaker" style="color: ${speakerColor(seg.speaker)}">${speakerLabel(seg.speaker)}</div>
          <div class="text">${seg.text}</div>
        </div>
      </div>
      `).join('\n      ')}
    </div>
  </div>

  <div class="footer">
    Généré automatiquement par Ultron CRM • ${new Date().toLocaleDateString('fr-FR')}
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate a simple text version of the transcript
 */
export function generateTranscriptText(segments: TranscriptSegment[]): string {
  const speakerLabel = (speaker: string): string => {
    switch (speaker) {
      case 'advisor': return 'Conseiller';
      case 'prospect': return 'Prospect';
      default: return 'Inconnu';
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `[${mins}:${secs.toString().padStart(2, '0')}]`;
  };

  return segments
    .map(seg => `${formatTimestamp(seg.timestamp)} ${speakerLabel(seg.speaker)}: ${seg.text}`)
    .join('\n');
}
