import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export async function exportDocumentToPdf(elementId: string, filename: string): Promise<void> {
  const element =
    document.getElementById(elementId) ||
    document.getElementById('invoice-pdf-export-sheet') ||
    document.getElementById('invoice-document-capture');

  if (!element) {
    throw new Error(`Element for PDF export not found.`);
  }

  // Render high-resolution 3x DPI canvas
  const canvas = await html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 920,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
    compress: true,
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 18;
  const contentWidth = pageWidth - margin * 2;
  const contentHeight = pageHeight - margin * 2;

  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = imgWidth / contentWidth;
  const renderedHeight = imgHeight / ratio;

  if (renderedHeight <= contentHeight) {
    pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, renderedHeight, undefined, 'FAST');
  } else {
    let heightLeft = renderedHeight;
    let position = margin;

    pdf.addImage(imgData, 'PNG', margin, position, contentWidth, renderedHeight, undefined, 'FAST');
    heightLeft -= contentHeight;

    while (heightLeft > 0) {
      position = position - contentHeight;
      pdf.addPage();
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        position,
        contentWidth,
        renderedHeight,
        undefined,
        'FAST'
      );
      heightLeft -= contentHeight;
    }
  }

  const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_');
  pdf.save(safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`);
}

export function triggerPrint(): void {
  window.print();
}
