import { DocumentType } from '../types/document';

export interface NumberingRule {
  prefix: string;
  suffix?: string;
  includeYear?: boolean;
  padLength: number;
  nextNumber: number;
}

export const DEFAULT_NUMBERING_RULES: Record<DocumentType, NumberingRule> = {
  invoice: { prefix: 'INV', includeYear: true, padLength: 5, nextNumber: 1 },
  estimate: { prefix: 'EST', includeYear: true, padLength: 5, nextNumber: 1 },
  purchase_order: { prefix: 'PO', includeYear: true, padLength: 5, nextNumber: 1 },
  receipt: { prefix: 'REC', includeYear: true, padLength: 5, nextNumber: 1 },
  credit_note: { prefix: 'CN', includeYear: true, padLength: 5, nextNumber: 1 },
  debit_note: { prefix: 'DN', includeYear: true, padLength: 5, nextNumber: 1 },
  pro_forma: { prefix: 'PRO', includeYear: true, padLength: 5, nextNumber: 1 },
};

/**
 * Formats a document number according to rule, sequence number, and optional date.
 * E.g., rule prefix "INV", includeYear true, padLength 5, sequence 42 -> "INV-2026-00042"
 */
export function formatDocumentNumber(
  rule: NumberingRule,
  sequence: number,
  date: Date = new Date()
): string {
  const parts: string[] = [rule.prefix];

  if (rule.includeYear) {
    parts.push(date.getFullYear().toString());
  }

  const paddedSeq = sequence.toString().padStart(rule.padLength, '0');
  parts.push(paddedSeq);

  let formatted = parts.join('-');
  if (rule.suffix) {
    formatted += `-${rule.suffix}`;
  }

  return formatted;
}

/**
 * Resolves next sequence number, guaranteeing monotonic increment and collision avoidance
 */
export function getNextSequenceNumber(
  existingNumbers: string[],
  rule: NumberingRule,
  date: Date = new Date()
): { number: string; sequence: number } {
  let seq = Math.max(1, rule.nextNumber);
  let candidate = formatDocumentNumber(rule, seq, date);

  while (existingNumbers.includes(candidate)) {
    seq++;
    candidate = formatDocumentNumber(rule, seq, date);
  }

  return { number: candidate, sequence: seq };
}
