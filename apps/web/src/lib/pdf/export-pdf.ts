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

  // Render high-resolution canvas with clean onclone positioning
  return html2canvas(element, {
    scale: 2,
    useCORS: true,
    // A tainted canvas can't be exported, so an image without CORS is left out instead.
    allowTaint: false,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: 850,
    scrollX: 0,
    scrollY: 0,
    onclone: (clonedDoc) => {
      const clonedTarget =
        clonedDoc.getElementById(elementId) ||
        clonedDoc.getElementById('invoice-pdf-export-sheet') ||
        clonedDoc.getElementById('invoice-document-capture');
      if (clonedTarget) {
        clonedTarget.style.position = 'static';
        clonedTarget.style.left = '0';
        clonedTarget.style.top = '0';
        clonedTarget.style.visibility = 'visible';
        clonedTarget.style.display = 'block';
        clonedTarget.style.opacity = '1';
        clonedTarget.style.transform = 'none';
        clonedTarget.style.margin = '0 auto';
      }
    },
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
  const pdfName = safeName.endsWith('.pdf') ? safeName : `${safeName}.pdf`;

  // Mobile-friendly download / sharing via Web Share API
  const isMobile =
    typeof navigator !== 'undefined' &&
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent || ''
    );

  const pdfBlob = pdf.output('blob');

  if (isMobile && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      const pdfFile = new File([pdfBlob], pdfName, { type: 'application/pdf' });
      if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [pdfFile] })) {
        await navigator.share({
          files: [pdfFile],
          title: pdfName,
        });
        return;
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        return; // User cancelled share sheet
      }
      console.warn('Mobile Web Share failed, falling back to direct download:', err);
    }
  }

  try {
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = pdfName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 60000);
  } catch (err) {
    pdf.save(pdfName);
  }
}

export function triggerPrint(): void {
  window.print();
}
