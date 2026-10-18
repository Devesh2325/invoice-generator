'use client';

import React, { useState, useRef, useEffect } from 'react';
import { DocumentType } from '@invoice/core';
import {
  FileText,
  Calculator,
  FileClock,
  ShoppingBag,
  Receipt,
  FileMinus,
  FilePlus,
  ChevronDown,
  Check,
  Sparkles,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export interface DocumentTypeOption {
  value: DocumentType;
  label: string;
  shortCode: string;
  prefix: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  section: 'sales' | 'adjustments';
}

export const DOCUMENT_TYPE_SECTIONS = [
  {
    id: 'sales' as const,
    title: 'Invoicing & Sales',
    subtitle: 'Sales, quotations & procurement workflows',
    badge: '4 Types',
  },
  {
    id: 'adjustments' as const,
    title: 'Payments & Adjustments',
    subtitle: 'Receipts, credit & debit adjustments',
    badge: '3 Types',
  },
];

export const DOCUMENT_TYPE_OPTIONS: DocumentTypeOption[] = [
  // Section 1: Invoicing & Sales
  {
    value: 'invoice',
    label: 'Tax Invoice',
    shortCode: 'INV',
    prefix: 'INV-',
    description: 'Standard commercial sales invoice with full GST/tax breakdown',
    icon: FileText,
    section: 'sales',
  },
  {
    value: 'estimate',
    label: 'Estimate / Quotation',
    shortCode: 'EST',
    prefix: 'EST-',
    description: 'Formal price quote & proposal with validity terms',
    icon: Calculator,
    section: 'sales',
  },
  {
    value: 'pro_forma',
    label: 'Pro Forma Invoice',
    shortCode: 'PRO',
    prefix: 'PRO-',
    description: 'Preliminary bill of sale issued prior to supply/dispatch',
    icon: FileClock,
    section: 'sales',
  },
  {
    value: 'purchase_order',
    label: 'Purchase Order',
    shortCode: 'PO',
    prefix: 'PO-',
    description: 'Procurement order issued to vendors and suppliers',
    icon: ShoppingBag,
    section: 'sales',
  },

  // Section 2: Payments & Adjustments
  {
    value: 'receipt',
    label: 'Payment Receipt',
    shortCode: 'REC',
    prefix: 'REC-',
    description: 'Official acknowledgment of payment received from client',
    icon: Receipt,
    section: 'adjustments',
  },
  {
    value: 'credit_note',
    label: 'Credit Note',
    shortCode: 'CN',
    prefix: 'CN-',
    description: 'Negative credit adjustment or refund against an issued invoice',
    icon: FileMinus,
    section: 'adjustments',
  },
  {
    value: 'debit_note',
    label: 'Debit Note',
    shortCode: 'DN',
    prefix: 'DN-',
    description: 'Supplemental charge or upward rate adjustment notice',
    icon: FilePlus,
    section: 'adjustments',
  },
];

interface DocumentTypeSelectorProps {
  value: DocumentType;
  onChange: (type: DocumentType) => void;
  isBannerHeader?: boolean;
  primaryColor?: string;
  compact?: boolean;
  className?: string;
  align?: 'left' | 'right';
  customLabels?: Record<string, string>;
  onUpdateTerminology?: (type: string, newLabel: string) => void;
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  value,
  onChange,
  isBannerHeader = false,
  primaryColor = '#1D4ED8',
  compact = false,
  className = '',
  align = 'right',
  customLabels = {},
  onUpdateTerminology,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showTerminologyModal, setShowTerminologyModal] = useState(false);
  const [terminologyState, setTerminologyState] = useState<Record<string, string>>({
    invoice: customLabels.invoice || 'Tax Invoice',
    estimate: customLabels.estimate || 'Estimate / Quotation',
    pro_forma: customLabels.pro_forma || 'Pro Forma Invoice',
    purchase_order: customLabels.purchase_order || 'Purchase Order',
    clientLabel: customLabels.clientLabel || 'Customer / Client',
    vendorLabel: customLabels.vendorLabel || 'Vendor / Supplier',
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    DOCUMENT_TYPE_OPTIONS.find((opt) => opt.value === value) || DOCUMENT_TYPE_OPTIONS[0];
  const CurrentIcon = currentOption.icon;
  const displayLabel = customLabels[value] || terminologyState[value] || currentOption.label;

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setShowTerminologyModal(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (type: DocumentType) => {
    onChange(type);
    setIsOpen(false);
  };

  const handleSaveTerminology = () => {
    if (onUpdateTerminology) {
      Object.entries(terminologyState).forEach(([k, v]) => {
        onUpdateTerminology(k, v);
      });
    }
    setShowTerminologyModal(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button with high-contrast label and visible active state */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group relative flex items-center justify-between gap-2 transition-all select-none cursor-pointer ${
          compact
            ? 'h-8 px-2.5 rounded-lg border text-xs font-bold'
            : isBannerHeader
            ? 'px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl border text-xs md:text-sm font-black shadow-md'
            : 'px-3.5 py-2 rounded-xl border text-xs md:text-sm font-bold shadow-xs'
        } ${
          isBannerHeader
            ? 'bg-white text-slate-900 border-white/80 hover:bg-slate-50 hover:shadow-lg ring-1 ring-black/5'
            : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-700'
        }`}
        style={
          isBannerHeader
            ? undefined
            : {
                borderColor: isOpen ? primaryColor : undefined,
                boxShadow: isOpen ? `0 0 0 2px ${primaryColor}25` : undefined,
              }
        }
      >
        <span className="flex items-center gap-2 truncate">
          <span
            className="w-5 h-5 md:w-6 md:h-6 rounded-md flex items-center justify-center shrink-0"
            style={{
              backgroundColor: `${primaryColor}15`,
              color: primaryColor,
            }}
          >
            <CurrentIcon className="w-3.5 h-3.5 md:w-4 md:h-4" />
          </span>

          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 shrink-0 hidden sm:inline">
            Type:
          </span>

          <span className="uppercase tracking-wider font-extrabold truncate text-slate-900 dark:text-slate-100">
            {displayLabel}
          </span>

          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-md border shrink-0"
            style={{
              backgroundColor: `${primaryColor}10`,
              borderColor: `${primaryColor}30`,
              color: primaryColor,
            }}
          >
            {currentOption.prefix}
          </span>
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 md:w-4 md:h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-slate-900 dark:text-slate-100' : 'group-hover:text-slate-800 dark:group-hover:text-slate-200'
          }`}
        />
      </button>

      {/* Dropdown Menu / Two-Section Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Document Type"
          className={`absolute mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 ring-1 ring-black/10 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header banner */}
          <div className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Document Type & Terminology
              </span>
              <p className="text-[10px] text-slate-500 dark:text-slate-400">
                Organized into Sales & Payment Adjustments
              </p>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              7 Formats
            </span>
          </div>

          <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2 space-y-2">
            {DOCUMENT_TYPE_SECTIONS.map((sec) => {
              const options = DOCUMENT_TYPE_OPTIONS.filter((opt) => opt.section === sec.id);

              return (
                <div key={sec.id} className="pt-1.5 first:pt-0">
                  {/* Section Label Header */}
                  <div className="px-2.5 py-1.5 mb-1 rounded-lg bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800 dark:text-slate-200">
                        {sec.title}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                        {sec.subtitle}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {sec.badge}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1">
                    {options.map((opt) => {
                      const isSelected = opt.value === value;
                      const IconComponent = opt.icon;
                      const itemLabel = customLabels[opt.value] || terminologyState[opt.value] || opt.label;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group cursor-pointer ${
                            isSelected
                              ? 'bg-primary/10 dark:bg-primary/20 ring-1 ring-primary/40 font-semibold'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-800/80'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${primaryColor}12`,
                                  borderColor: `${primaryColor}40`,
                                  boxShadow: `inset 0 0 0 1px ${primaryColor}40`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected ? 'bg-primary text-white shadow-xs' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                              }`}
                              style={
                                isSelected
                                  ? { backgroundColor: primaryColor, color: '#ffffff' }
                                  : undefined
                              }
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs uppercase font-extrabold tracking-wide truncate ${
                                    isSelected
                                      ? 'text-primary'
                                      : 'text-slate-900 dark:text-slate-100'
                                  }`}
                                  style={isSelected ? { color: primaryColor } : undefined}
                                >
                                  {itemLabel}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-2 mt-0.5">
                                {opt.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: isSelected ? `${primaryColor}15` : undefined,
                                borderColor: isSelected ? `${primaryColor}30` : undefined,
                                color: isSelected ? primaryColor : undefined,
                              }}
                            >
                              {opt.prefix}
                            </span>
                            {isSelected && (
                              <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-white"
                                style={{ backgroundColor: primaryColor }}
                              >
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer with Terminology Customization Trigger */}
          <div className="bg-slate-50 dark:bg-slate-950 px-3.5 py-2.5 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setShowTerminologyModal(true);
              }}
              className="font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Customize Terminology
            </button>
            <span className="font-mono text-[9px] text-slate-400">ESC to close</span>
          </div>
        </div>
      )}

      {/* Terminology Customization Modal */}
      {showTerminologyModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <SlidersHorizontal className="w-4 h-4 text-primary" />
                  Custom Document Terminology
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Customize labels applied across your invoices, quotes and PDF exports.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowTerminologyModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Invoice Heading (Default: Tax Invoice)
                </label>
                <input
                  type="text"
                  value={terminologyState.invoice}
                  onChange={(e) =>
                    setTerminologyState((prev) => ({ ...prev, invoice: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="e.g. Tax Invoice, Commercial Invoice, Bill of Supply"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Quotation / Estimate Heading (Default: Estimate / Quotation)
                </label>
                <input
                  type="text"
                  value={terminologyState.estimate}
                  onChange={(e) =>
                    setTerminologyState((prev) => ({ ...prev, estimate: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="e.g. Price Quote, Formal Proposal, Estimate"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Customer / Client Label (Default: Customer / Client)
                </label>
                <input
                  type="text"
                  value={terminologyState.clientLabel}
                  onChange={(e) =>
                    setTerminologyState((prev) => ({ ...prev, clientLabel: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="e.g. Client, Customer, Patient, Guest"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Vendor / Supplier Label (Default: Vendor / Supplier)
                </label>
                <input
                  type="text"
                  value={terminologyState.vendorLabel}
                  onChange={(e) =>
                    setTerminologyState((prev) => ({ ...prev, vendorLabel: e.target.value }))
                  }
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-xs"
                  placeholder="e.g. Supplier, Vendor, Service Provider"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setShowTerminologyModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveTerminology}
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs"
              >
                Apply Terminology
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
