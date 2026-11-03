import { APP_CONFIG, DocumentModel, getCurrencyConfig, getCurrencyTaxProfile } from '@invoice/core';
import { getInvoiceTemplate } from '@invoice/theme';
import { captureInvoice } from '@/lib/pdf/export-pdf';

const safeFileName = (doc: DocumentModel) => (doc.documentNumber || 'invoice').replace(/[^a-zA-Z0-9_-]/g, '_');

function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

const documentTitle = (doc: DocumentModel) =>
  doc.customTerminology?.[doc.type] || APP_CONFIG.defaultTerminology[doc.type] || 'Invoice';

const lines = (values: (string | undefined)[]) => values.filter(Boolean) as string[];

const partyLines = (party: { email?: string; phone?: string; taxId?: string }, address: DocumentModel['client']['billingAddress'], taxIdLabel: string) =>
  lines([
    address?.street1,
    [address?.city, address?.postalCode].filter(Boolean).join(' '),
    [address?.state, address?.country].filter(Boolean).join(', '),
    party.taxId ? `${taxIdLabel}: ${party.taxId}` : undefined,
    party.email,
    party.phone,
  ]);

/** Totals in print order. All of these come from the calculation engine. */
function summaryRows(doc: DocumentModel): [string, number][] {
  const s = doc.summary;
  const taxLabel = getCurrencyTaxProfile(doc.currency).taxLabel;
  const rows: [string, number][] = [['Subtotal', s.subtotal]];
  if (s.discountTotal > 0) rows.push(['Discount', -s.discountTotal]);
  rows.push(['Taxable amount', s.taxableSubtotal]);
  if (s.gstSupplyType === 'inter') rows.push(['IGST', s.igstTotal || 0]);
  else if (s.gstSupplyType === 'intra') rows.push(['CGST', s.cgstTotal || 0], ['SGST', s.sgstTotal || 0]);
  else rows.push([taxLabel, s.totalTax]);
  if (s.shippingFee > 0) rows.push(['Shipping', s.shippingFee]);
  if (s.extraCharges > 0) rows.push(['Extra charges', s.extraCharges]);
  if (s.roundOffAmount) rows.push(['Round-off', s.roundOffAmount]);
  return rows;
}

const taxColumnLabel = (doc: DocumentModel) =>
  doc.summary.gstSupplyType === 'inter' || doc.summary.gstSupplyType === 'intra' ? 'GST' : getCurrencyTaxProfile(doc.currency).taxLabel;

export async function exportDocumentToPng(doc: DocumentModel): Promise<void> {
  const canvas = await captureInvoice('invoice-pdf-export-sheet');
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Could not create the image.');
  saveBlob(blob, `${safeFileName(doc)}.png`);
}

/** Stops spreadsheet apps from running a cell as a formula when a CSV is opened. */
function csvCell(value: string | number) {
  if (typeof value === 'number') return String(value);
  const guarded = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function buildCsv(doc: DocumentModel): string {
  const rows: (string | number)[][] = [
    [documentTitle(doc), doc.documentNumber],
    ['Issue date', doc.issueDate],
    ['Due date', doc.dueDate || ''],
    ['From', doc.sender.name],
    ['Bill to', doc.client.name],
    ['Currency', doc.currency],
    [],
    ['#', 'Item', 'Code', 'Qty', 'Unit', 'Rate', 'Discount', 'Taxable', `${taxColumnLabel(doc)} %`, taxColumnLabel(doc), 'Total'],
    ...doc.items.map((item, index) => [
      index + 1,
      item.description,
      item.hsnCode || '',
      item.quantity,
      (item as { unit?: string }).unit || '',
      item.unitPrice,
      item.lineDiscount,
      item.lineNet,
      item.taxRate || 0,
      item.taxAmount,
      item.lineTotal,
    ]),
    [],
    ...summaryRows(doc),
    ['Grand total', doc.summary.grandTotal],
    ['Amount paid', doc.summary.amountPaid],
    ['Balance due', doc.summary.balanceDue],
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
}

export function exportDocumentToCsv(doc: DocumentModel): void {
  // The byte order mark makes Excel read currency symbols and non-English text correctly.
  saveBlob(new Blob(['﻿', buildCsv(doc)], { type: 'text/csv;charset=utf-8' }), `${safeFileName(doc)}.csv`);
}

const toArgb = (hex: string) => `FF${hex.replace('#', '').toUpperCase()}`;

/** Dark text on bright accents such as lime, white on everything else. */
function onColor(hex: string) {
  const value = parseInt(hex.replace('#', ''), 16);
  const luminance = (0.299 * ((value >> 16) & 255) + 0.587 * ((value >> 8) & 255) + 0.114 * (value & 255)) / 255;
  return luminance > 0.6 ? 'FF0F172A' : 'FFFFFFFF';
}

/** A styled .xlsx laid out like the invoice, in the template's colours. */
export async function exportDocumentToExcel(doc: DocumentModel): Promise<void> {
  const ExcelJS = (await import('exceljs')).default;
  const preset = getInvoiceTemplate(doc.templateId);
  const accent = /^#[0-9a-fA-F]{6}$/.test(doc.customTheme?.primaryColor || '') ? doc.customTheme!.primaryColor! : preset.accent.length === 7 ? preset.accent : '#3157D5';
  const profile = getCurrencyTaxProfile(doc.currency);
  const currency = getCurrencyConfig(doc.currency);
  const dp = doc.decimalPrecision ?? currency.decimalPlaces;
  const quotedSymbol = `"${currency.symbol.replace(/"/g, '')}"`;
  const numberPart = `#,##0${dp > 0 ? `.${'0'.repeat(dp)}` : ''}`;
  const moneyFormat = `${quotedSymbol}${numberPart};-${quotedSymbol}${numberPart}`;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = APP_CONFIG.brandName;
  const sheet = workbook.addWorksheet(documentTitle(doc).slice(0, 31), {
    views: [{ showGridLines: false }],
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
  });
  sheet.columns = [5, 34, 11, 7, 7, 13, 11, 14, 8, 13, 15].map((width) => ({ width }));
  const lastColumn = 11;
  const paint = (cell: { fill: unknown }, hex: string) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: toArgb(hex) } };
  };
  const hairline = { style: 'thin' as const, color: { argb: 'FFE2E8F0' } };

  // Coloured band: document title on the left, number and dates on the right.
  const band = (row: number, left: string, right: string, size: number, bold: boolean, height: number) => {
    sheet.mergeCells(row, 1, row, 7);
    sheet.mergeCells(row, 8, row, lastColumn);
    sheet.getRow(row).height = height;
    for (let col = 1; col <= lastColumn; col++) paint(sheet.getCell(row, col), accent);
    const leftCell = sheet.getCell(row, 1);
    leftCell.value = left;
    leftCell.font = { size, bold, color: { argb: onColor(accent) } };
    leftCell.alignment = { vertical: 'middle', indent: 1 };
    const rightCell = sheet.getCell(row, 8);
    rightCell.value = right;
    rightCell.font = { size: 10, bold: row === 1, color: { argb: onColor(accent) } };
    rightCell.alignment = { vertical: 'middle', horizontal: 'right', indent: 1 };
  };
  band(1, documentTitle(doc).toUpperCase(), `# ${doc.documentNumber}`, 22, true, 40);
  band(2, doc.sender.name, `Issue date: ${doc.issueDate}`, 11, true, 20);
  band(3, '', doc.dueDate ? `Due date: ${doc.dueDate}` : '', 10, false, 20);

  // From and bill to.
  let row = 5;
  const block = (startColumn: number, endColumn: number, label: string, name: string, details: string[]) => {
    const write = (offset: number, value: string, font: object) => {
      sheet.mergeCells(row + offset, startColumn, row + offset, endColumn);
      const cell = sheet.getCell(row + offset, startColumn);
      cell.value = value;
      cell.font = font;
    };
    write(0, label, { size: 9, bold: true, color: { argb: toArgb(accent) } });
    write(1, name, { size: 12, bold: true });
    details.forEach((detail, index) => write(2 + index, detail, { size: 10, color: { argb: 'FF475569' } }));
    return details.length + 2;
  };
  const used = Math.max(
    block(1, 3, 'FROM', doc.sender.name, partyLines(doc.sender, doc.sender.address, profile.taxIdLabel)),
    block(6, lastColumn, 'BILL TO', doc.client.name, partyLines(doc.client, doc.client.billingAddress, profile.taxIdLabel))
  );
  row += used + 1;

  // Items.
  const taxLabel = taxColumnLabel(doc);
  const headers = ['#', 'Item', 'Code', 'Qty', 'Unit', 'Rate', 'Discount', 'Taxable', `${taxLabel} %`, taxLabel, 'Total'];
  const numeric = new Set([4, 6, 7, 8, 9, 10, 11]);
  headers.forEach((header, index) => {
    const cell = sheet.getCell(row, index + 1);
    cell.value = header;
    paint(cell, accent);
    cell.font = { size: 10, bold: true, color: { argb: onColor(accent) } };
    cell.alignment = { vertical: 'middle', horizontal: numeric.has(index + 1) ? 'right' : 'left', wrapText: true };
  });
  sheet.getRow(row).height = 24;
  row += 1;
  doc.items.forEach((item, index) => {
    const values: (string | number)[] = [
      index + 1,
      item.description,
      item.hsnCode || '',
      item.quantity,
      (item as { unit?: string }).unit || '',
      item.unitPrice,
      item.lineDiscount,
      item.lineNet,
      (item.taxRate || 0) / 100,
      item.taxAmount,
      item.lineTotal,
    ];
    values.forEach((value, columnIndex) => {
      const column = columnIndex + 1;
      const cell = sheet.getCell(row, column);
      cell.value = value;
      cell.border = { bottom: hairline };
      cell.alignment = { vertical: 'top', wrapText: column === 2, horizontal: numeric.has(column) ? 'right' : 'left' };
      if (column === 9) cell.numFmt = '0.##%';
      else if (numeric.has(column) && column !== 4) cell.numFmt = moneyFormat;
      if (index % 2 === 1 && preset.zebra) paint(cell, preset.tint);
    });
    row += 1;
  });
  row += 1;

  // Totals, right-aligned under the table.
  const totalRow = (label: string, value: number, strong = false) => {
    sheet.mergeCells(row, 8, row, 10);
    const labelCell = sheet.getCell(row, 8);
    const valueCell = sheet.getCell(row, lastColumn);
    labelCell.value = label;
    valueCell.value = value;
    valueCell.numFmt = moneyFormat;
    const font = strong ? { size: 12, bold: true, color: { argb: onColor(accent) } } : { size: 10 };
    labelCell.font = font;
    valueCell.font = font;
    valueCell.alignment = { horizontal: 'right' };
    if (strong) {
      for (let col = 8; col <= lastColumn; col++) paint(sheet.getCell(row, col), accent);
      sheet.getRow(row).height = 24;
      labelCell.alignment = { vertical: 'middle', indent: 1 };
      valueCell.alignment = { vertical: 'middle', horizontal: 'right' };
    }
    row += 1;
  };
  const totalsStart = row;
  summaryRows(doc).forEach(([label, value]) => totalRow(label, value));
  totalRow('Grand total', doc.summary.grandTotal, true);
  if (doc.summary.amountPaid > 0) {
    totalRow('Amount paid', doc.summary.amountPaid);
    totalRow('Balance due', doc.summary.balanceDue, true);
  }

  // Payment details and notes, beside the totals.
  const payment = doc.paymentConfig;
  const bank = payment?.display.showBankDetails ? payment.bankAccounts : [];
  const footer = lines([
    ...bank.flatMap((account) => [
      account.bankName,
      `A/C: ${account.accountNumber}`,
      `${profile.routingLabel}: ${account.ifscOrRoutingCode}`,
    ]),
    payment?.display.showUpiId && payment.upiId ? `UPI: ${payment.upiId}` : undefined,
    doc.paymentTerms && payment?.display.showPaymentTerms !== false ? `Terms: ${doc.paymentTerms}` : undefined,
    payment?.display.showPaymentInstructions !== false ? doc.paymentInstructions : undefined,
    doc.notes,
  ]);
  footer.forEach((value, index) => {
    const target = totalsStart + index;
    sheet.mergeCells(target, 1, target, 6);
    const cell = sheet.getCell(target, 1);
    cell.value = value;
    cell.font = { size: 10, color: { argb: 'FF475569' } };
    cell.alignment = { wrapText: true, vertical: 'top' };
  });

  row = Math.max(row, totalsStart + footer.length) + 2;
  sheet.mergeCells(row, 8, row, lastColumn);
  const signatory = sheet.getCell(row, 8);
  signatory.value = doc.signatoryName || 'Authorized Signatory';
  signatory.font = { size: 10, bold: true };
  signatory.alignment = { horizontal: 'right' };
  signatory.border = { top: hairline };

  const logo = doc.sender.logoUrl?.match(/^data:image\/(png|jpeg);base64,(.+)$/);
  if (logo) {
    const imageId = workbook.addImage({ base64: logo[2], extension: logo[1] as 'png' | 'jpeg' });
    sheet.addImage(imageId, { tl: { col: 6.2, row: 0.15 }, ext: { width: 54, height: 44 } });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  saveBlob(
    new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
    `${safeFileName(doc)}.xlsx`
  );
}
