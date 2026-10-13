/**
 * invoice-templates.ts — 18 config-driven, print-ready (A4) invoice templates.
 * Zero external dependencies. Works in Node, browsers, React / Next.
 */
import { CanonicalDocument } from '@invoice/core';
export interface TemplatePreset {
    id: string;
    name: string;
    region: string;
    font: string;
    googleFont: string;
    accent: string;
    ink: string;
    paper: string;
    line: string;
    tint: string;
    header: 'left' | 'center' | 'band' | 'big' | 'side';
    card: 'round' | 'box' | 'plain' | 'fill';
    tableHead: 'rule' | 'fill' | 'tint' | 'box';
    totals: 'bar' | 'out' | 'txt';
    zebra: boolean;
    strip: boolean;
    locale: string;
    currency: string;
    decimals: number;
    roundOff: boolean;
    sign: number;
    taxLabel: string;
    taxRate: number;
    taxIdLabel: string;
    title: string;
    subtitle: string;
    badge: string;
    dueLabel: string;
    balanceLabel: string;
    finalLabel: string;
    routingLabel: string;
    vpaLabel: string;
    qrLabel: string;
    terms: string;
    note: string;
    supplyTitle: string;
    supplyFields: string[];
    supplyLines: string[];
    defaultNotes: string[];
}
export declare const INVOICE_TEMPLATES: TemplatePreset[];
export declare const getInvoiceTemplate: (id?: string) => TemplatePreset;
export declare const listTemplates: () => {
    id: string;
    name: string;
    region: string;
}[];
export declare function computeTotals(inv: any, tpl: string | TemplatePreset): {
    lines: any;
    gross: number;
    discount: number;
    taxable: number;
    tax: number;
    total: number;
    roundOff: number;
    final: number;
    paid: number;
    balance: number;
    groups: {
        rate: number;
        taxable: number;
        tax: number;
    }[];
};
export declare function renderInvoice(inv: any, templateId?: string, opts?: {
    preview?: boolean;
    override?: any;
}): string;
/** Complete, print-ready HTML document (A4, fonts, colour-exact printing). */
export declare function renderInvoiceDocument(inv: any, templateId?: string, opts?: {
    preview?: boolean;
    override?: any;
}): string;
export declare function mapCanonicalDocumentToTemplateInv(doc: CanonicalDocument): any;
