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
      const timeDiff = segment.timestamp - current.endTimestamp;
      if (timeDiff > 3) {
        current.text = current.text.trim();
        if (!current.text.endsWith('.') && !current.text.endsWith('?') && !current.text.endsWith('!')) {
          current.text += '.';
        }
        current.text += ' ' + segment.text;
      } else {
        current.text += ' ' + segment.text;
      }
      current.endTimestamp = segment.timestamp;
    } else {
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
 * Generate a professional PDF document for meeting transcript
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
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - 2 * margin;
  let y = margin;

  // Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo-600
  const textDark: [number, number, number] = [31, 41, 55]; // Gray-800
  const textMuted: [number, number, number] = [107, 114, 128]; // Gray-500
  const greenColor: [number, number, number] = [16, 185, 129]; // Green-500
  const redColor: [number, number, number] = [239, 68, 68]; // Red-500

  // Helper functions
  const checkPageBreak = (neededHeight: number = 25) => {
    if (y + neededHeight > pageHeight - 25) {
      doc.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} secondes`;
    if (secs === 0) return `${mins} minutes`;
    return `${mins} min ${secs} sec`;
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
      default: return 'Intervenant';
    }
  };

  const drawSectionTitle = (title: string, color: [number, number, number] = primaryColor) => {
    checkPageBreak(20);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...color);
    doc.text(title, margin, y);
    y += 2;
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + doc.getTextWidth(title), y);
    y += 8;
  };

  // ============ HEADER ============
  // Organization name (top left, subtle)
  doc.setFontSize(9);
  doc.setTextColor(...textMuted);
  doc.setFont('helvetica', 'normal');
  doc.text(organizationName.toUpperCase(), margin, y);

  // ULTRON branding (top right, subtle text only)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryColor);
  doc.text('ULTRON', pageWidth - margin - doc.getTextWidth('ULTRON'), y);

  y += 15;

  // Main title
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text('Compte-rendu de reunion', margin, y);
  y += 4;

  // Accent line under title
  doc.setDrawColor(...primaryColor);
  doc.setLineWidth(1);
  doc.line(margin, y, margin + 50, y);
  y += 12;

  // Meeting info in a clean layout
  const formattedDate = meetingDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = meetingDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Info grid
  doc.setFontSize(10);
  const labelX = margin;
  const valueX = margin + 25;
  const col2LabelX = margin + 90;
  const col2ValueX = margin + 115;

  // Row 1: Prospect & Conseiller
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Prospect', labelX, y);
  doc.text('Conseiller', col2LabelX, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(prospectName, valueX, y);
  doc.text(advisorName, col2ValueX, y);
  y += 7;

  // Row 2: Date & Duree
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...textMuted);
  doc.text('Date', labelX, y);
  doc.text('Duree', col2LabelX, y);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textDark);
  doc.text(`${formattedDate} a ${formattedTime}`, valueX, y);
  doc.text(formatDuration(duration), col2ValueX, y);
  y += 15;

  // Separator
  doc.setDrawColor(229, 231, 235); // Gray-200
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageWidth - margin, y);
  y += 12;

  // ============ SUMMARY ============
  if (summary) {
    drawSectionTitle('Resume');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...textDark);
    const summaryLines = doc.splitTextToSize(summary, contentWidth);

    for (const line of summaryLines) {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5;
    }
    y += 8;
  }

  // ============ KEY POINTS ============
  if (keyPoints && keyPoints.length > 0) {
    drawSectionTitle('Points cles', greenColor);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const point of keyPoints) {
      checkPageBreak(12);
      doc.setTextColor(...greenColor);
      doc.text('•', margin + 2, y);
      doc.setTextColor(...textDark);
      const pointLines = doc.splitTextToSize(point, contentWidth - 10);
      doc.text(pointLines, margin + 8, y);
      y += pointLines.length * 5 + 3;
    }
    y += 5;
  }

  // ============ OBJECTIONS ============
  if (objections && objections.length > 0) {
    drawSectionTitle('Objections detectees', redColor);

    for (const obj of objections) {
      checkPageBreak(20);

      // Objection text
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...redColor);
      doc.text('!', margin + 2, y);
      doc.setTextColor(...textDark);
      const objLines = doc.splitTextToSize(obj.objection, contentWidth - 10);
      doc.text(objLines, margin + 8, y);
      y += objLines.length * 5 + 2;

      // Suggested response
      if (obj.suggested_response) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(...textMuted);
        const respLines = doc.splitTextToSize(`Reponse: ${obj.suggested_response}`, contentWidth - 15);
        for (const line of respLines) {
          checkPageBreak(6);
          doc.text(line, margin + 10, y);
          y += 5;
        }
      }
      y += 5;
    }
    y += 3;
  }

  // ============ NEXT ACTIONS ============
  if (nextActions && nextActions.length > 0) {
    drawSectionTitle('Prochaines actions');

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    for (const action of nextActions) {
      checkPageBreak(12);
      doc.setTextColor(...primaryColor);
      doc.text('->', margin + 2, y);
      doc.setTextColor(...textDark);
      const actionLines = doc.splitTextToSize(action, contentWidth - 12);
      doc.text(actionLines, margin + 10, y);
      y += actionLines.length * 5 + 3;
    }
    y += 5;
  }

  // ============ TRANSCRIPT ============
  if (segments && segments.length > 0) {
    // Only add page break if we're past 60% of the page
    if (y > pageHeight * 0.6) {
      doc.addPage();
      y = margin;
    } else {
      y += 5;
    }

    drawSectionTitle('Transcription');

    const consolidatedSegments = consolidateSegments(segments);

    doc.setFontSize(9);

    for (const seg of consolidatedSegments) {
      const textLines = doc.splitTextToSize(seg.text, contentWidth - 35);
      const segmentHeight = textLines.length * 4.5 + 8;
      checkPageBreak(segmentHeight);

      // Speaker and timestamp
      doc.setFont('helvetica', 'bold');
      if (seg.speaker === 'advisor') {
        doc.setTextColor(...primaryColor);
      } else if (seg.speaker === 'prospect') {
        doc.setTextColor(...greenColor);
      } else {
        doc.setTextColor(...textMuted);
      }
      doc.text(speakerLabel(seg.speaker), margin, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...textMuted);
      doc.text(`[${formatTimestamp(seg.startTimestamp)}]`, margin + 28, y);
      y += 5;

      // Text content
      doc.setTextColor(...textDark);
      for (const line of textLines) {
        doc.text(line, margin + 5, y);
        y += 4.5;
      }
      y += 4;
    }
  }

  // ============ FOOTER on all pages ============
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...textMuted);
    doc.setFont('helvetica', 'normal');

    // Left: generation date
    doc.text(
      `Genere le ${new Date().toLocaleDateString('fr-FR')}`,
      margin,
      pageHeight - 10
    );

    // Center: page number
    doc.text(
      `${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );

    // Right: Ultron
    doc.text(
      'ultron-crm.com',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generate a simple text version of the transcript
 */
export function generateTranscriptText(segments: TranscriptSegment[]): string {
  const speakerLabel = (speaker: string): string => {
    switch (speaker) {
      case 'advisor': return 'Conseiller';
      case 'prospect': return 'Prospect';
      default: return 'Intervenant';
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `[${mins}:${secs.toString().padStart(2, '0')}]`;
  };

  const consolidated = consolidateSegments(segments);

  return consolidated
    .map(seg => `${formatTimestamp(seg.startTimestamp)} ${speakerLabel(seg.speaker)}: ${seg.text}`)
    .join('\n');
}
