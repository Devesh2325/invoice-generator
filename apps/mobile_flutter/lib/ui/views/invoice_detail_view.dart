import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:share_plus/share_plus.dart';
import 'package:printing/printing.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import '../../core/theme/app_theme.dart';
import '../../data/models/invoice_model.dart';
import '../view_models/invoice_view_model.dart';

class InvoiceDetailView extends StatelessWidget {
  final InvoiceModel invoice;

  const InvoiceDetailView({super.key, required this.invoice});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencySymbol = invoice.currency == 'USD' ? '\$' : '₹';
    final currencyFormat = NumberFormat.currency(
      symbol: currencySymbol,
      decimalDigits: 2,
    );

    final statusColor = invoice.status == 'paid'
        ? AppTheme.emeraldGreen
        : invoice.status == 'sent'
            ? AppTheme.primaryBlue
            : AppTheme.amberWarning;

    // UPI Payment String
    final upiPayload =
        'upi://pay?pa=${invoice.upiId ?? "merchant@upi"}&pn=${Uri.encodeComponent("Invoxa Merchant")}&am=${invoice.grandTotal.toStringAsFixed(2)}&cu=${invoice.currency}&tn=${Uri.encodeComponent("Invoice ${invoice.documentNumber}")}';

    return Scaffold(
      appBar: AppBar(
        title: Text(invoice.documentNumber),
        actions: [
          IconButton(
            icon: const Icon(Icons.share_outlined),
            tooltip: 'Share Invoice',
            onPressed: () => _shareInvoiceText(invoice),
          ),
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: 'Print / Save PDF',
            onPressed: () => _printPdf(invoice),
          ),
          PopupMenuButton<String>(
            onSelected: (val) {
              if (val == 'paid') {
                context.read<InvoiceViewModel>().markAsPaid(invoice.id);
                Navigator.pop(context);
              } else if (val == 'delete') {
                context.read<InvoiceViewModel>().deleteInvoice(invoice.id);
                Navigator.pop(context);
              }
            },
            itemBuilder: (_) => [
              if (invoice.status != 'paid')
                const PopupMenuItem(
                  value: 'paid',
                  child: Row(
                    children: [
                      Icon(Icons.check_circle, color: AppTheme.emeraldGreen),
                      SizedBox(width: 8),
                      Text('Mark as Paid'),
                    ],
                  ),
                ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete_outline, color: AppTheme.roseDanger),
                    SizedBox(width: 8),
                    Text('Delete Invoice'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        children: [
          // Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slate900 : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? AppTheme.slate800 : AppTheme.slate200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      invoice.type,
                      style: const TextStyle(
                        fontSize: 13,
                        color: AppTheme.slate500,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        invoice.status.toUpperCase(),
                        style: TextStyle(
                          color: statusColor,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  currencyFormat.format(invoice.grandTotal),
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryBlue,
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 14, color: AppTheme.slate400),
                    const SizedBox(width: 6),
                    Text(
                      'Issued ${DateFormat('dd MMM yyyy').format(invoice.issueDate)}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.slate500),
                    ),
                    const Spacer(),
                    Icon(Icons.event_available, size: 14, color: AppTheme.slate400),
                    const SizedBox(width: 6),
                    Text(
                      'Due ${DateFormat('dd MMM yyyy').format(invoice.dueDate)}',
                      style: const TextStyle(fontSize: 12, color: AppTheme.slate500),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Client Details
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slate900 : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? AppTheme.slate800 : AppTheme.slate200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Customer Details',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const Divider(height: 16),
                Text(
                  invoice.clientName,
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                if (invoice.clientEmail != null) ...[
                  const SizedBox(height: 4),
                  Text(invoice.clientEmail!, style: const TextStyle(color: AppTheme.slate500, fontSize: 13)),
                ],
                if (invoice.clientPhone != null) ...[
                  const SizedBox(height: 4),
                  Text(invoice.clientPhone!, style: const TextStyle(color: AppTheme.slate500, fontSize: 13)),
                ],
                if (invoice.clientAddress != null) ...[
                  const SizedBox(height: 4),
                  Text(invoice.clientAddress!, style: const TextStyle(color: AppTheme.slate500, fontSize: 13)),
                ],
                if (invoice.clientGstin != null) ...[
                  const SizedBox(height: 4),
                  Text('GSTIN: ${invoice.clientGstin}', style: const TextStyle(color: AppTheme.slate600, fontSize: 13, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Items Card
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? AppTheme.slate900 : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark ? AppTheme.slate800 : AppTheme.slate200,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Billed Line Items',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                const Divider(height: 16),
                ...invoice.items.map((item) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.description,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 14,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                '${item.quantity} × $currencySymbol${item.unitPrice.toStringAsFixed(2)}  (Tax ${item.taxRate}%)',
                                style: const TextStyle(
                                  color: AppTheme.slate500,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '$currencySymbol${item.lineTotal.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const Divider(height: 20),
                _buildRow('Subtotal', currencyFormat.format(invoice.subtotal)),
                if (invoice.discountTotal > 0) ...[
                  const SizedBox(height: 4),
                  _buildRow('Discount', '-${currencyFormat.format(invoice.discountTotal)}', color: AppTheme.emeraldGreen),
                ],
                const SizedBox(height: 4),
                _buildRow('Tax (GST)', currencyFormat.format(invoice.taxTotal)),
                const Divider(height: 16),
                _buildRow(
                  'Grand Total',
                  currencyFormat.format(invoice.grandTotal),
                  isBold: true,
                  color: AppTheme.primaryBlue,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // UPI QR Code Card
          if (invoice.upiId != null)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slate900 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isDark ? AppTheme.slate800 : AppTheme.slate200,
                ),
              ),
              child: Column(
                children: [
                  const Text(
                    'Scan with Any UPI App to Pay',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'UPI ID: ${invoice.upiId}',
                    style: const TextStyle(color: AppTheme.slate500, fontSize: 12),
                  ),
                  const SizedBox(height: 16),
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.06),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: QrImageView(
                      data: upiPayload,
                      version: QrVersions.auto,
                      size: 160.0,
                    ),
                  ),
                  const SizedBox(height: 12),
                  const Text(
                    'Supports Google Pay • PhonePe • Paytm • BHIM',
                    style: TextStyle(fontSize: 11, color: AppTheme.slate400),
                  ),
                ],
              ),
            ),
          const SizedBox(height: 24),

          // Action Buttons
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
              backgroundColor: AppTheme.primaryBlue,
            ),
            icon: const Icon(Icons.share),
            label: const Text('Share Invoice with Customer'),
            onPressed: () => _shareInvoiceText(invoice),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              minimumSize: const Size.fromHeight(50),
              side: const BorderSide(color: AppTheme.primaryBlue),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            icon: const Icon(Icons.picture_as_pdf, color: AppTheme.primaryBlue),
            label: const Text(
              'Print / Save Official PDF',
              style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
            ),
            onPressed: () => _printPdf(invoice),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildRow(String label, String value, {bool isBold = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? null : AppTheme.slate500,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            fontSize: isBold ? 16 : 13,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: color,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            fontSize: isBold ? 18 : 13,
          ),
        ),
      ],
    );
  }

  void _shareInvoiceText(InvoiceModel invoice) {
    final currencySymbol = invoice.currency == 'USD' ? '\$' : '₹';
    final shareText = '''
📄 *${invoice.type} — ${invoice.documentNumber}*
🏢 From: Invoxa Cloud Billing
👤 Billed To: ${invoice.clientName}
📅 Issue Date: ${DateFormat('dd MMM yyyy').format(invoice.issueDate)}
⏳ Due Date: ${DateFormat('dd MMM yyyy').format(invoice.dueDate)}

💰 *Grand Total: $currencySymbol${invoice.grandTotal.toStringAsFixed(2)}*

UPI Payment VPA: ${invoice.upiId ?? "merchant@okaxis"}

Thank you for your business!
''';
    Share.share(shareText, subject: 'Invoice ${invoice.documentNumber}');
  }

  Future<void> _printPdf(InvoiceModel invoice) async {
    final doc = pw.Document();
    final currencySymbol = invoice.currency == 'USD' ? '\$' : '₹';

    doc.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Container(
            padding: const pw.EdgeInsets.all(32),
            child: pw.Column(
              crossAxisAlignment: pw.CrossAxisAlignment.start,
              children: [
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text(
                      'INVOXA',
                      style: pw.TextStyle(
                        fontSize: 28,
                        fontWeight: pw.FontWeight.bold,
                        color: PdfColors.blue700,
                      ),
                    ),
                    pw.Text(
                      invoice.documentNumber,
                      style: pw.TextStyle(
                        fontSize: 20,
                        fontWeight: pw.FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                pw.SizedBox(height: 24),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.start,
                      children: [
                        pw.Text('BILLED TO:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10, color: PdfColors.grey700)),
                        pw.Text(invoice.clientName, style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                        if (invoice.clientAddress != null) pw.Text(invoice.clientAddress!),
                        if (invoice.clientEmail != null) pw.Text(invoice.clientEmail!),
                        if (invoice.clientGstin != null) pw.Text('GSTIN: ${invoice.clientGstin}'),
                      ],
                    ),
                    pw.Column(
                      crossAxisAlignment: pw.CrossAxisAlignment.end,
                      children: [
                        pw.Text('Issue Date: ${DateFormat('dd/MM/yyyy').format(invoice.issueDate)}'),
                        pw.Text('Due Date: ${DateFormat('dd/MM/yyyy').format(invoice.dueDate)}'),
                        pw.Text('Status: ${invoice.status.toUpperCase()}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      ],
                    ),
                  ],
                ),
                pw.SizedBox(height: 32),
                pw.TableHelper.fromTextArray(
                  headers: ['Description', 'Qty', 'Unit Price', 'Tax %', 'Total'],
                  data: invoice.items.map((item) {
                    return [
                      item.description,
                      item.quantity.toString(),
                      '$currencySymbol${item.unitPrice.toStringAsFixed(2)}',
                      '${item.taxRate}%',
                      '$currencySymbol${item.lineTotal.toStringAsFixed(2)}',
                    ];
                  }).toList(),
                  headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                  headerDecoration: const pw.BoxDecoration(color: PdfColors.blue700),
                  cellHeight: 28,
                  cellAlignments: {
                    0: pw.Alignment.centerLeft,
                    1: pw.Alignment.center,
                    2: pw.Alignment.centerRight,
                    3: pw.Alignment.center,
                    4: pw.Alignment.centerRight,
                  },
                ),
                pw.SizedBox(height: 20),
                pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.end,
                  children: [
                    pw.Container(
                      width: 200,
                      child: pw.Column(
                        children: [
                          pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                            pw.Text('Subtotal:'),
                            pw.Text('$currencySymbol${invoice.subtotal.toStringAsFixed(2)}'),
                          ]),
                          pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                            pw.Text('Tax:'),
                            pw.Text('$currencySymbol${invoice.taxTotal.toStringAsFixed(2)}'),
                          ]),
                          pw.Divider(),
                          pw.Row(mainAxisAlignment: pw.MainAxisAlignment.spaceBetween, children: [
                            pw.Text('Grand Total:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                            pw.Text('$currencySymbol${invoice.grandTotal.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.blue700)),
                          ]),
                        ],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => doc.save(),
      name: 'Invoice_${invoice.documentNumber}.pdf',
    );
  }
}
