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
}

export const DocumentTypeSelector: React.FC<DocumentTypeSelectorProps> = ({
  value,
  onChange,
  isBannerHeader = false,
  primaryColor = '#1D4ED8',
  compact = false,
  className = '',
  align = 'right',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentOption =
    DOCUMENT_TYPE_OPTIONS.find((opt) => opt.value === value) || DOCUMENT_TYPE_OPTIONS[0];
  const CurrentIcon = currentOption.icon;

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

  return (
    <div ref={containerRef} className={`relative inline-block text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className={`group relative flex items-center justify-between gap-2.5 transition-all select-none ${
          compact
            ? 'h-8 px-2.5 rounded-lg border text-xs font-bold'
            : isBannerHeader
            ? 'px-3.5 py-1.5 md:px-4 md:py-2 rounded-xl border text-xs md:text-sm font-black shadow-md'
            : 'px-3.5 py-2 rounded-xl border text-xs md:text-sm font-bold shadow-xs'
        } ${
          isBannerHeader
            ? 'bg-white text-slate-900 border-white/80 hover:bg-slate-50 hover:shadow-lg ring-1 ring-black/5'
            : 'bg-white hover:bg-slate-50/90 text-slate-800 border-slate-300'
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
          <span className="uppercase tracking-wider font-extrabold truncate text-slate-900">
            {currentOption.label}
          </span>
          <span
            className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md border"
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
            isOpen ? 'rotate-180 text-slate-900' : 'group-hover:text-slate-800'
          }`}
        />
      </button>

      {/* Dropdown Menu / Two-Section Popover */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Select Document Type"
          className={`absolute mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-200 ring-1 ring-black/10 overflow-hidden z-50 animate-in fade-in-0 zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {/* Header banner */}
          <div className="bg-slate-50/90 border-b border-slate-200 px-4 py-2.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Document Type & Terminology
              </span>
              <p className="text-[10px] text-slate-500">
                Organized into Sales & Payment Adjustments
              </p>
            </div>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
              7 Formats
            </span>
          </div>

          <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
            {DOCUMENT_TYPE_SECTIONS.map((sec) => {
              const options = DOCUMENT_TYPE_OPTIONS.filter((opt) => opt.section === sec.id);

              return (
                <div key={sec.id} className="pt-1.5 first:pt-0">
                  {/* Section Label Header */}
                  <div className="px-2.5 py-1.5 mb-1 rounded-lg bg-slate-50/70 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-extrabold uppercase tracking-wide text-slate-800">
                        {sec.title}
                      </div>
                      <div className="text-[10px] text-slate-500 leading-tight">
                        {sec.subtitle}
                      </div>
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-200/80 text-slate-600">
                      {sec.badge}
                    </span>
                  </div>

                  {/* Options List */}
                  <div className="space-y-1">
                    {options.map((opt) => {
                      const isSelected = opt.value === value;
                      const IconComponent = opt.icon;

                      return (
                        <button
                          key={opt.value}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() => handleSelect(opt.value)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start justify-between gap-3 group ${
                            isSelected
                              ? 'bg-slate-50 ring-1 font-semibold'
                              : 'hover:bg-slate-50/90'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: `${primaryColor}0d`,
                                  borderColor: `${primaryColor}35`,
                                  boxShadow: `inset 0 0 0 1px ${primaryColor}40`,
                                }
                              : undefined
                          }
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                                isSelected ? '' : 'group-hover:bg-slate-200/70'
                              }`}
                              style={{
                                backgroundColor: isSelected
                                  ? `${primaryColor}20`
                                  : '#F1F5F9',
                                color: isSelected ? primaryColor : '#475569',
                              }}
                            >
                              <IconComponent className="w-4 h-4" />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs uppercase font-extrabold tracking-wide truncate ${
                                    isSelected ? 'text-slate-900' : 'text-slate-800'
                                  }`}
                                  style={isSelected ? { color: primaryColor } : undefined}
                                >
                                  {opt.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 leading-snug line-clamp-2 mt-0.5">
                                {opt.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span
                              className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border"
                              style={{
                                backgroundColor: isSelected ? `${primaryColor}15` : '#F8FAFC',
                                borderColor: isSelected ? `${primaryColor}30` : '#E2E8F0',
                                color: isSelected ? primaryColor : '#64748B',
                              }}
                            >
                              {opt.prefix}
                            </span>
                            {isSelected && (
                              <Check
                                className="w-4 h-4"
                                style={{ color: primaryColor }}
                              />
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

          {/* Footer note */}
          <div className="bg-slate-50 px-3.5 py-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
            <span>Updating document type auto-adapts labels & prefixes</span>
            <span className="font-mono text-[9px] text-slate-400">ESC to close</span>
          </div>
        </div>
      )}
    </div>
  );
};
