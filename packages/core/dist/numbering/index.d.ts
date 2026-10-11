import { DocumentType } from '../types/document';
export interface NumberingRule {
    prefix: string;
    suffix?: string;
    includeYear?: boolean;
    padLength: number;
    nextNumber: number;
}
export declare const DEFAULT_NUMBERING_RULES: Record<DocumentType, NumberingRule>;
/**
 * Formats a document number according to rule, sequence number, and optional date.
 * E.g., rule prefix "INV", includeYear true, padLength 5, sequence 42 -> "INV-2026-00042"
 */
export declare function formatDocumentNumber(rule: NumberingRule, sequence: number, date?: Date): string;
/**
 * Resolves next sequence number, guaranteeing monotonic increment and collision avoidance
 */
export declare function getNextSequenceNumber(existingNumbers: string[], rule: NumberingRule, date?: Date): {
    number: string;
    sequence: number;
};
