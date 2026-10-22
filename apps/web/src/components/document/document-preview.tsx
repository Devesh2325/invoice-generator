'use client';

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { DocumentModel, getCurrencyTaxProfile } from '@invoice/core';
import {
  renderInvoiceDocument,
  renderInvoice,
  mapCanonicalDocumentToTemplateInv,
  getInvoiceTemplate,
} from '@invoice/theme';
import {
  Upload,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  FileText,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DocumentPreviewProps {
  document: DocumentModel;
  className?: string;
  captureId?: string;
  isPrintOnly?: boolean;
  onLogoUpload?: (dataUrl: string) => void;
  onRemoveLogo?: () => void;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  document,
  className = '',
  captureId = 'invoice-document-capture',
  isPrintOnly = false,
  onLogoUpload,
  onRemoveLogo,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(820);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [fitToWidth, setFitToWidth] = useState<boolean>(true);
  const [iframeHeight, setIframeHeight] = useState<number>(1140);

  // Template ID with currency-aware fallback
  const templateId = useMemo(() => {
    const docCurr = (document.currency || 'INR').toUpperCase();
    const docTpl = document.templateId;
    if (
      docCurr !== 'INR' &&
      (!docTpl ||
        docTpl === 'cleartax_gst' ||
        docTpl === 'in-gst' ||
        docTpl === 'tally_prime' ||
        docTpl === 'vyapar_classic')
    ) {
      return getCurrencyTaxProfile(docCurr).defaultTemplateId;
    }
    return docTpl || 'in-gst';
  }, [document.templateId, document.currency]);
  const templateMeta = useMemo(() => getInvoiceTemplate(templateId), [templateId]);

  // Map the rich DocumentModel into template payload
  const invData = useMemo(() => {
    return mapCanonicalDocumentToTemplateInv(document);
  }, [document]);

  // Determine user overrides (brand primary color / accent)
  const templateOptions = useMemo(() => {
    const customAccent = document.customTheme?.primaryColor;
    return {
      preview: !isPrintOnly,
      override: customAccent ? { accent: customAccent } : undefined,
    };
  }, [document.customTheme?.primaryColor, isPrintOnly]);

  // Full HTML document for iframe rendering (A4 layout, Google font link, zero CSS bleed)
  const fullHtmlDocument = useMemo(() => {
    return renderInvoiceDocument(invData, templateId, templateOptions);
  }, [invData, templateId, templateOptions]);

  // Inner markup for direct capture / html2canvas PDF generation
  const innerMarkup = useMemo(() => {
    return renderInvoice(invData, templateId, templateOptions);
  }, [invData, templateId, templateOptions]);

  // Measure container width for responsive fit in split view & small screens
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Compute effective scale based on fitToWidth and container width
  const effectiveScale = useMemo(() => {
    if (fitToWidth && containerWidth < 820) {
      // 794px width + margins
      const scale = Math.max(0.4, Math.min(1, (containerWidth - 20) / 794));
      return Number(scale.toFixed(2));
    }
    return zoomScale;
  }, [fitToWidth, containerWidth, zoomScale]);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onLogoUpload) return;
    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      onLogoUpload(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const triggerUpload = () => {
    if (onLogoUpload && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // IF PRINT ONLY: Return purely the capture node for html2pdf / print sheets
  if (isPrintOnly) {
    return (
      <div
        id={captureId}
        className="w-[794px] bg-white mx-auto print-container"
        dangerouslySetInnerHTML={{ __html: innerMarkup }}
      />
    );
  }

  return (
    <div ref={containerRef} className={`flex flex-col items-center w-full ${className}`}>
      {/* Hidden file input for logo replacement */}
      {onLogoUpload && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileInput}
          accept="image/*"
          className="hidden"
        />
      )}

      {/* Top Preview Control Bar */}
      <div className="w-full max-w-[820px] bg-white border border-slate-200 rounded-xl p-2.5 mb-3 flex flex-wrap items-center justify-between gap-2 shadow-xs no-print">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
            <FileText className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <span>{templateMeta.name}</span>
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {templateMeta.region}
              </span>
            </div>
            <p className="text-[10px] text-slate-500">
              Print-Ready A4 Preset (794 × 1123 px)
            </p>
          </div>
        </div>

        {/* Action Controls: Logo & Zoom & Fit */}
        <div className="flex items-center gap-1.5">
          {onLogoUpload && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={triggerUpload}
              className="h-7 text-xs px-2.5 font-semibold text-slate-700"
            >
              <Upload className="w-3 h-3 mr-1 text-primary" />
              {document.sender.logoUrl ? 'Change Logo' : 'Upload Logo'}
            </Button>
          )}

          {onRemoveLogo && document.sender.logoUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemoveLogo}
              className="h-7 text-xs px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              title="Remove business logo"
            >
              <X className="w-3 h-3 mr-1" /> Remove
            </Button>
          )}

          {/* Fit-to-Width Toggle (especially useful in Split View) */}
          <Button
            type="button"
            variant={fitToWidth ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setFitToWidth((prev) => !prev)}
            className="h-7 text-xs px-2 text-slate-700"
            title={fitToWidth ? 'Disable auto-fit width' : 'Fit to pane width'}
          >
            {fitToWidth ? (
              <Minimize2 className="w-3 h-3 mr-1 text-primary" />
            ) : (
              <Maximize2 className="w-3 h-3 mr-1 text-slate-500" />
            )}
            Fit
          </Button>

          {/* Zoom scale controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200 ml-1">
            <button
              type="button"
              onClick={() => {
                setFitToWidth(false);
                setZoomScale((prev) => Math.max(0.5, prev - 0.1));
              }}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
              title="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold px-1 text-slate-700 w-9 text-center">
              {Math.round(effectiveScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => {
                setFitToWidth(false);
                setZoomScale((prev) => Math.min(1.4, prev + 0.1));
              }}
              className="p-1 text-slate-600 hover:text-slate-900 rounded hover:bg-white"
              title="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {(effectiveScale !== 1 || !fitToWidth) && (
              <button
                type="button"
                onClick={() => {
                  setFitToWidth(true);
                  setZoomScale(1);
                }}
                className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-white"
                title="Reset to Fit Width"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main A4 Invoice Container (Rendered with iframe for complete CSS isolation and auto-scaled) */}
      <div
        className="relative w-full flex justify-center overflow-x-hidden overflow-y-auto py-1"
        style={{
          minHeight: `${Math.round(iframeHeight * effectiveScale)}px`,
        }}
      >
        <div
          style={{
            width: '794px',
            transform: effectiveScale !== 1 ? `scale(${effectiveScale})` : undefined,
            transformOrigin: 'top center',
            height: `${Math.round(iframeHeight * effectiveScale)}px`,
          }}
        >
          <div className="w-[794px] min-h-[1123px] bg-white rounded-lg shadow-2xl overflow-visible border border-slate-300 ring-1 ring-black/5">
            <iframe
              title="Invoice Document Preview"
              srcDoc={fullHtmlDocument}
              onLoad={(e) => {
                try {
                  const iframe = e.currentTarget;
                  if (iframe.contentWindow?.document?.body) {
                    const scrollH = iframe.contentWindow.document.body.scrollHeight;
                    if (scrollH > 500) {
                      setIframeHeight(Math.max(1140, scrollH + 30));
                    }
                  }
                } catch {}
              }}
              className="w-full border-0 block bg-white"
              style={{
                width: '794px',
                height: `${iframeHeight}px`,
                display: 'block',
                border: 0,
              }}
            />
          </div>
        </div>
      </div>

      {/* Hidden high-fidelity DOM element dedicated for html2canvas PDF export */}
      <div
        id={captureId}
        aria-hidden="true"
        style={{
          position: 'fixed',
          left: '-9999px',
          top: 0,
          width: '794px',
          backgroundColor: '#ffffff',
          zIndex: -50,
          pointerEvents: 'none',
        }}
        dangerouslySetInnerHTML={{ __html: innerMarkup }}
      />
    </div>
  );
};
