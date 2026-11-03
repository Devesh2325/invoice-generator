import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/** Renders the finished invoice to a canvas, after its template's font has loaded. */
export async function captureInvoice(elementId: string): Promise<HTMLCanvasElement> {
  const element =
    document.getElementById(elementId) ||
    document.getElementById('invoice-pdf-export-sheet') ||
    document.getElementById('invoice-document-capture');

  if (!element) {
    throw new Error(`Element for PDF export not found.`);
  }

  // Without this, a download can use a fallback font and stop matching the preview.
  await document.fonts.ready;

  // Render high-resolution 3x DPI canvas
  return html2canvas(element, {
    scale: 2.5,
    useCORS: true,
    // A tainted canvas can't be exported, so an image without CORS is left out instead.
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 920,
  });
}

export async function exportDocumentToPdf(elementId: string, filename: string): Promise<void> {
  const canvas = await captureInvoice(elementId);

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
