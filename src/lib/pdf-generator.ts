import { jsPDF } from 'jspdf';
import type { TranscriptSegment, ObjectionDetected } from '@/types/meeting';

interface ConsolidatedSegment {
  speaker: string;
  text: string;
  startTimestamp: number;
  endTimestamp: number;
}

/**
 * Consolidate consecutive segments from the same speaker
 * Replaces short pauses with periods
 */
export function consolidateSegments(segments: TranscriptSegment[]): ConsolidatedSegment[] {
  if (!segments || segments.length === 0) return [];

  const consolidated: ConsolidatedSegment[] = [];
  let current: ConsolidatedSegment | null = null;

  for (const segment of segments) {
    if (!current) {
      current = {
        speaker: segment.speaker,
        text: segment.text,
        startTimestamp: segment.timestamp,
        endTimestamp: segment.timestamp,
      };
    } else if (current.speaker === segment.speaker) {
      // Same speaker - append text with a period or space
      const timeDiff = segment.timestamp - current.endTimestamp;
      // If pause is more than 3 seconds, add a period
      if (timeDiff > 3) {
        current.text = current.text.trim();
        if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
          current.text += '.';
        }
        current.text += ' ' + segment.text;
      } else {
        // Short pause - just add space
        current.text += ' ' + segment.text;
      }
      current.endTimestamp = segment.timestamp;
    } else {
      // Different speaker - save current and start new
      current.text = current.text.trim();
      if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
        current.text += '.';
      }
      consolidated.push(current);
      current = {
        speaker: segment.speaker,
        text: segment.text,
        startTimestamp: segment.timestamp,
        endTimestamp: segment.timestamp,
      };
    }
  }

  // Don't forget the last segment
  if (current) {
    current.text = current.text.trim();
    if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
      current.text += '.';
    }
    consolidated.push(current);
  }

  return consolidated;
}

/**
 * Generate a PDF document for meeting transcript
 */
export function generateTranscriptPdf(data: {
  organizationName: string;
  advisorName: string;
  prospectName: string;
  meetingDate: Date;
  duration: number;
  segments: TranscriptSegment[];
  summary?: string;
  keyPoints?: string[];
  objections?: ObjectionDetected[];
  nextActions?: string[];
}): Buffer {
  const {
    organizationName,
    advisorName,
    prospectName,
    meetingDate,
    duration,
    segments,
    summary,
    keyPoints,
    objections,
    nextActions
  } = data;

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Helper to add page break if needed
  const checkPageBreak = (neededHeight: number = 30) => {
    if (y + neededHeight > doc.internal.pageSize.getHeight() - margin) {
      doc.addPage();
      y = margin;
    }
  };

  // Helper to format duration
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} sec`;
  };

  // Helper to format timestamp
  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper for speaker label
  const speakerLabel = (speaker: string): string => {
    switch (speaker) {
      case 'advisor': return 'Conseiller';
      case 'prospect': return 'Prospect';
      default: return 'Inconnu';
    }
  };

  // ============ HEADER ============
  // Organization name
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128); // gray-500
  doc.text(organizationName, margin, y);

  // Logo placeholder - right side
  doc.setFillColor(99, 102, 241); // indigo-500
  doc.rect(pageWidth - margin - 30, y - 5, 30, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('ULTRON', pageWidth - margin - 25, y + 2);

  y += 15;

  // Title
  doc.setTextColor(99, 102, 241); // indigo-500
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Compte-rendu de reunion', margin, y);
  y += 12;

  // Separator line
  doc.setDrawColor(99, 102, 241);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  // Meeting info box
  doc.setFillColor(249, 250, 251); // gray-50
  doc.roundedRect(margin, y, contentWidth, 35, 3, 3, 'F');

  doc.setTextColor(107, 114, 128); // gray-500
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  const col1 = margin + 5;
  const col2 = margin + contentWidth / 2;

  y += 8;
  doc.text('Prospect:', col1, y);
  doc.text('Conseiller:', col2, y);

  doc.setTextColor(31, 41, 55); // gray-800
  doc.setFont('helvetica', 'bold');
  doc.text(prospectName, col1 + 25, y);
  doc.text(advisorName, col2 + 28, y);

  y += 10;
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', col1, y);
  doc.text('Duree:', col2, y);

  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  const formattedDate = meetingDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  doc.text(formattedDate, col1 + 15, y);
  doc.text(formatDuration(duration), col2 + 18, y);

  y += 20;

  // ============ SUMMARY ============
  if (summary) {
    checkPageBreak(40);

    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('Resume de la reunion', margin, y);
    y += 8;

    doc.setFillColor(238, 242, 255); // indigo-50
    doc.setDrawColor(99, 102, 241);
    doc.setLineWidth(0.3);

    // Split summary into lines that fit
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81); // gray-700
    const summaryLines = doc.splitTextToSize(summary, contentWidth - 10);
    const summaryHeight = summaryLines.length * 5 + 10;

    doc.roundedRect(margin, y, contentWidth, summaryHeight, 2, 2, 'FD');
    y += 7;
    doc.text(summaryLines, margin + 5, y);
    y += summaryHeight + 5;
  }

  // ============ KEY POINTS ============
  if (keyPoints && keyPoints.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('Points cles', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    for (const point of keyPoints) {
      checkPageBreak(15);
      doc.setTextColor(16, 185, 129); // green-500
      doc.text('✓', margin + 2, y);
      doc.setTextColor(55, 65, 81);
      const pointLines = doc.splitTextToSize(point, contentWidth - 15);
      doc.text(pointLines, margin + 10, y);
      y += pointLines.length * 5 + 3;
    }
    y += 5;
  }

  // ============ OBJECTIONS ============
  if (objections && objections.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(14);
    doc.setTextColor(239, 68, 68); // red-500
    doc.setFont('helvetica', 'bold');
    doc.text('Objections detectees', margin, y);
    y += 8;

    for (const obj of objections) {
      checkPageBreak(30);

      doc.setFillColor(254, 243, 199); // yellow-100
      doc.setDrawColor(245, 158, 11); // yellow-500
      doc.setLineWidth(0.3);

      const objText = doc.splitTextToSize(obj.objection, contentWidth - 15);
      const respText = obj.suggested_response ? doc.splitTextToSize(`Reponse: ${obj.suggested_response}`, contentWidth - 15) : [];
      const objHeight = (objText.length + respText.length) * 5 + 15;

      doc.roundedRect(margin, y, contentWidth, objHeight, 2, 2, 'FD');
      y += 7;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(180, 83, 9); // yellow-700
      doc.text(objText, margin + 5, y);
      y += objText.length * 5 + 3;

      if (obj.suggested_response) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(107, 114, 128);
        doc.text(respText, margin + 5, y);
        y += respText.length * 5;
      }
      y += 8;
    }
  }

  // ============ NEXT ACTIONS ============
  if (nextActions && nextActions.length > 0) {
    checkPageBreak(30);

    doc.setFontSize(14);
    doc.setTextColor(99, 102, 241);
    doc.setFont('helvetica', 'bold');
    doc.text('Prochaines actions', margin, y);
    y += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);

    for (const action of nextActions) {
      checkPageBreak(15);
      doc.setTextColor(99, 102, 241);
      doc.text('→', margin + 2, y);
      doc.setTextColor(55, 65, 81);
      const actionLines = doc.splitTextToSize(action, contentWidth - 15);
      doc.text(actionLines, margin + 10, y);
      y += actionLines.length * 5 + 3;
    }
    y += 5;
  }

  // ============ TRANSCRIPT ============
  checkPageBreak(30);
  doc.addPage(); // Start transcript on new page
  y = margin;

  doc.setFontSize(14);
  doc.setTextColor(99, 102, 241);
  doc.setFont('helvetica', 'bold');
  doc.text('Transcription complete', margin, y);
  y += 10;

  // Consolidate segments
  const consolidatedSegments = consolidateSegments(segments);

  for (const seg of consolidatedSegments) {
    const textLines = doc.splitTextToSize(seg.text, contentWidth - 50);
    const segmentHeight = textLines.length * 5 + 10;
    checkPageBreak(segmentHeight);

    // Timestamp
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175); // gray-400
    doc.setFont('helvetica', 'normal');
    doc.text(formatTimestamp(seg.startTimestamp), margin, y);

    // Speaker
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    if (seg.speaker === 'advisor') {
      doc.setTextColor(99, 102, 241); // indigo
    } else if (seg.speaker === 'prospect') {
      doc.setTextColor(16, 185, 129); // green
    } else {
      doc.setTextColor(107, 114, 128); // gray
    }
    doc.text(speakerLabel(seg.speaker), margin + 25, y);

    // Text
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(55, 65, 81);
    doc.text(textLines, margin + 25, y);
    y += textLines.length * 5 + 8;
  }

  // ============ FOOTER ============
  const pageCount = doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Genere par Ultron CRM - ${new Date().toLocaleDateString('fr-FR')} - Page ${i}/${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Return as Buffer
  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generate HTML content for a meeting transcript (legacy - for preview)
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

  // Consolidate segments for display
  const consolidatedSegments = consolidateSegments(segments);

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Transcript - ${prospectName}</title>
  <style>
    body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; }
    .header { border-bottom: 2px solid #6366f1; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { color: #6366f1; }
    .segment { margin-bottom: 15px; }
    .speaker { font-weight: bold; font-size: 12px; }
    .text { margin-left: 25px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Transcript de reunion</h1>
    <p><strong>Prospect:</strong> ${prospectName} | <strong>Date:</strong> ${meetingDate.toLocaleDateString('fr-FR')} | <strong>Duree:</strong> ${formatDuration(duration)}</p>
  </div>
  ${summary ? `<div><h2>Resume</h2><p>${summary}</p></div>` : ''}
  <h2>Transcription</h2>
  ${consolidatedSegments.map(seg => `
    <div class="segment">
      <span class="speaker" style="color: ${speakerColor(seg.speaker)}">[${formatTimestamp(seg.startTimestamp)}] ${speakerLabel(seg.speaker)}:</span>
      <div class="text">${seg.text}</div>
    </div>
  `).join('')}
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

  // Consolidate for text output too
  const consolidated = consolidateSegments(segments);

  return consolidated
    .map(seg => `${formatTimestamp(seg.startTimestamp)} ${speakerLabel(seg.speaker)}: ${seg.text}`)
    .join('\n');
}
