import { NextRequest, NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';

export async function POST(request: NextRequest) {
  try {
    const { letterContent, fileName } = await request.json();

    if (!letterContent) {
      return NextResponse.json({ error: 'Contenu de lettre requis' }, { status: 400 });
    }

    // Créer le PDF
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Configuration de la police
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);

    // Marges et dimensions
    const marginLeft = 20;
    const marginTop = 25;
    const marginRight = 20;
    const pageWidth = 210;
    const pageHeight = 297;
    const maxWidth = pageWidth - marginLeft - marginRight;
    const maxHeight = pageHeight - marginTop - 25; // Marge en bas

    // Diviser le contenu en lignes et gérer les sauts de page
    const lines = letterContent.split('\n');
    let y = marginTop;
    const lineHeight = 6;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Vérifier si on doit ajouter une page
      if (y > maxHeight) {
        doc.addPage();
        y = marginTop;
      }

      // Gérer les lignes vides (espacement)
      if (line.trim() === '') {
        y += lineHeight * 0.5; // Espacement réduit pour les lignes vides
        continue;
      }

      // Diviser les lignes trop longues
      const wrappedLines = doc.splitTextToSize(line, maxWidth);

      for (const wrappedLine of wrappedLines) {
        if (y > maxHeight) {
          doc.addPage();
          y = marginTop;
        }

        doc.text(wrappedLine, marginLeft, y);
        y += lineHeight;
      }
    }

    // Générer le PDF en tant qu'ArrayBuffer
    const pdfBuffer = doc.output('arraybuffer');

    // Retourner le PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName || 'lettre.pdf'}"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Erreur génération PDF:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la génération du PDF' },
      { status: 500 }
    );
  }
}