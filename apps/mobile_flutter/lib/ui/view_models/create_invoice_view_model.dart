import 'package:flutter/foundation.dart';
import 'package:uuid/uuid.dart';
import '../../data/models/invoice_item_model.dart';
import '../../data/models/invoice_model.dart';
import '../../data/models/party_model.dart';

class CreateInvoiceViewModel extends ChangeNotifier {
  final _uuid = const Uuid();

  String documentNumber = '';
  String documentType = 'Tax Invoice';
  String currency = 'INR';
  DateTime issueDate = DateTime.now();
  DateTime dueDate = DateTime.now().add(const Duration(days: 14));

  // Client Details
  String clientName = '';
  String clientEmail = '';
  String clientPhone = '';
  String clientAddress = '';
  String clientGstin = '';

  // Items
  List<InvoiceItemModel> items = [];

  // Extra Details
  String notes = 'Thank you for your business!';
  String terms = 'Payment is due within 14 days of issue.';
  String upiId = 'merchant@okaxis';

  CreateInvoiceViewModel() {
    initNewInvoice();
  }

  void initNewInvoice() {
    final randNum = 100 + (DateTime.now().millisecond % 900);
    documentNumber = 'INV-${DateTime.now().year}-$randNum';
    documentType = 'Tax Invoice';
    currency = 'INR';
    issueDate = DateTime.now();
    dueDate = DateTime.now().add(const Duration(days: 14));
    clientName = '';
    clientEmail = '';
    clientPhone = '';
    clientAddress = '';
    clientGstin = '';
    notes = 'Thank you for your business!';
    terms = 'Payment is due within 14 days of issue.';
    upiId = 'merchant@okaxis';

    // Default first line item
    items = [
      InvoiceItemModel(
        id: _uuid.v4(),
        description: 'Professional Consulting Services',
        quantity: 1,
        unitPrice: 15000,
        taxRate: 18,
      ),
    ];
    notifyListeners();
  }

  void selectCustomer(PartyModel party) {
    clientName = party.name;
    clientEmail = party.email ?? '';
    clientPhone = party.phone ?? '';
    clientAddress = party.address ?? '';
    clientGstin = party.taxId ?? '';
    notifyListeners();
  }

  void addItem() {
    items.add(
      InvoiceItemModel(
        id: _uuid.v4(),
        description: '',
        quantity: 1,
        unitPrice: 0,
        taxRate: 18,
      ),
    );
    notifyListeners();
  }

  void removeItem(int index) {
    if (items.length > 1) {
      items.removeAt(index);
      notifyListeners();
    }
  }

  void updateItem(int index, InvoiceItemModel item) {
    if (index >= 0 && index < items.length) {
      items[index] = item;
      notifyListeners();
    }
  }

  // Totals
  double get subtotal => items.fold(0.0, (sum, item) => sum + item.subtotal);

  double get discountTotal =>
      items.fold(0.0, (sum, item) => sum + item.discountAmount);

  double get taxTotal => items.fold(0.0, (sum, item) => sum + item.taxAmount);

  double get grandTotal => items.fold(0.0, (sum, item) => sum + item.lineTotal);

  String? validate() {
    if (clientName.trim().isEmpty) {
      return 'Please enter a customer or company name.';
    }
    if (items.isEmpty || items.every((i) => i.description.trim().isEmpty)) {
      return 'Please add at least one line item with a description.';
    }
    if (grandTotal <= 0) {
      return 'Invoice total must be greater than zero.';
    }
    return null;
  }

  InvoiceModel buildInvoice({required String tenantId, String status = 'draft'}) {
    return InvoiceModel(
      id: _uuid.v4(),
      tenantId: tenantId,
      documentNumber: documentNumber,
      type: documentType,
      status: status,
      issueDate: issueDate,
      dueDate: dueDate,
      clientName: clientName.trim(),
      clientEmail: clientEmail.trim().isNotEmpty ? clientEmail.trim() : null,
      clientPhone: clientPhone.trim().isNotEmpty ? clientPhone.trim() : null,
      clientAddress:
          clientAddress.trim().isNotEmpty ? clientAddress.trim() : null,
      clientGstin: clientGstin.trim().isNotEmpty ? clientGstin.trim() : null,
      items: items.where((i) => i.description.trim().isNotEmpty).toList(),
      currency: currency,
      notes: notes.trim().isNotEmpty ? notes.trim() : null,
      terms: terms.trim().isNotEmpty ? terms.trim() : null,
      upiId: upiId.trim().isNotEmpty ? upiId.trim() : null,
    );
  }
}
