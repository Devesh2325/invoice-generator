import 'dart:convert';
import 'invoice_item_model.dart';

class InvoiceModel {
  final String id;
  final String tenantId;
  final String documentNumber;
  final String type; // 'Invoice', 'Tax Invoice', 'Estimate', etc.
  final String status; // 'draft', 'sent', 'paid', 'overdue'
  final DateTime issueDate;
  final DateTime dueDate;
  final String clientName;
  final String? clientEmail;
  final String? clientPhone;
  final String? clientAddress;
  final String? clientGstin;
  final List<InvoiceItemModel> items;
  final String currency;
  final String? notes;
  final String? terms;
  final String? upiId; // For UPI payment QR code

  const InvoiceModel({
    required this.id,
    required this.tenantId,
    required this.documentNumber,
    this.type = 'Tax Invoice',
    this.status = 'draft',
    required this.issueDate,
    required this.dueDate,
    required this.clientName,
    this.clientEmail,
    this.clientPhone,
    this.clientAddress,
    this.clientGstin,
    this.items = const [],
    this.currency = 'INR',
    this.notes,
    this.terms,
    this.upiId,
  });

  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);

  double get discountTotal => items.fold(0.0, (sum, item) => sum + item.discountAmount);

  double get taxTotal => items.fold(0.0, (sum, item) => sum + item.taxAmount);

  double get grandTotal => items.fold(0.0, (sum, item) => sum + item.lineTotal);

  InvoiceModel copyWith({
    String? id,
    String? tenantId,
    String? documentNumber,
    String? type,
    String? status,
    DateTime? issueDate,
    DateTime? dueDate,
    String? clientName,
    String? clientEmail,
    String? clientPhone,
    String? clientAddress,
    String? clientGstin,
    List<InvoiceItemModel>? items,
    String? currency,
    String? notes,
    String? terms,
    String? upiId,
  }) {
    return InvoiceModel(
      id: id ?? this.id,
      tenantId: tenantId ?? this.tenantId,
      documentNumber: documentNumber ?? this.documentNumber,
      type: type ?? this.type,
      status: status ?? this.status,
      issueDate: issueDate ?? this.issueDate,
      dueDate: dueDate ?? this.dueDate,
      clientName: clientName ?? this.clientName,
      clientEmail: clientEmail ?? this.clientEmail,
      clientPhone: clientPhone ?? this.clientPhone,
      clientAddress: clientAddress ?? this.clientAddress,
      clientGstin: clientGstin ?? this.clientGstin,
      items: items ?? this.items,
      currency: currency ?? this.currency,
      notes: notes ?? this.notes,
      terms: terms ?? this.terms,
      upiId: upiId ?? this.upiId,
    );
  }

  /// Appwrite documents collection payload
  Map<String, dynamic> toAppwriteJson() {
    final payloadData = {
      'clientName': clientName,
      'clientEmail': clientEmail,
      'clientPhone': clientPhone,
      'clientAddress': clientAddress,
      'clientGstin': clientGstin,
      'items': items.map((e) => e.toJson()).toList(),
      'notes': notes,
      'terms': terms,
      'upiId': upiId,
    };

    return {
      'tenantId': tenantId,
      'docId': id,
      'documentNumber': documentNumber,
      'type': type,
      'status': status,
      'issueDate': issueDate.toIso8601String(),
      'dueDate': dueDate.toIso8601String(),
      'subtotal': subtotal,
      'taxTotal': taxTotal,
      'grandTotal': grandTotal,
      'currency': currency,
      'isArchived': false,
      'data': jsonEncode(payloadData),
    };
  }

  factory InvoiceModel.fromAppwrite(Map<String, dynamic> json) {
    List<InvoiceItemModel> parsedItems = [];
    String? cEmail;
    String? cPhone;
    String? cAddress;
    String? cGstin;
    String? cNotes;
    String? cTerms;
    String? cUpi;

    if (json['data'] != null && json['data'] is String) {
      try {
        final decoded = jsonDecode(json['data'] as String);
        if (decoded is Map<String, dynamic>) {
          cEmail = decoded['clientEmail'] as String?;
          cPhone = decoded['clientPhone'] as String?;
          cAddress = decoded['clientAddress'] as String?;
          cGstin = decoded['clientGstin'] as String?;
          cNotes = decoded['notes'] as String?;
          cTerms = decoded['terms'] as String?;
          cUpi = decoded['upiId'] as String?;

          if (decoded['items'] is List) {
            parsedItems = (decoded['items'] as List)
                .map((item) => InvoiceItemModel.fromJson(item as Map<String, dynamic>))
                .toList();
          }
        }
      } catch (_) {}
    }

    return InvoiceModel(
      id: json['docId'] as String? ?? json['\$id'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      documentNumber: json['documentNumber'] as String? ?? 'INV-001',
      type: json['type'] as String? ?? 'Tax Invoice',
      status: json['status'] as String? ?? 'draft',
      issueDate: json['issueDate'] != null
          ? DateTime.tryParse(json['issueDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      dueDate: json['dueDate'] != null
          ? DateTime.tryParse(json['dueDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      clientName: json['clientName'] as String? ?? 'Customer',
      clientEmail: cEmail,
      clientPhone: cPhone,
      clientAddress: cAddress,
      clientGstin: cGstin,
      items: parsedItems,
      currency: json['currency'] as String? ?? 'INR',
      notes: cNotes,
      terms: cTerms,
      upiId: cUpi,
    );
  }
}
