import '../models/invoice_item_model.dart';
import '../models/invoice_model.dart';
import '../models/party_model.dart';
import '../services/appwrite_service.dart';

class InvoiceRepository {
  final AppwriteService _service;
  final List<InvoiceModel> _inMemoryCache = [];
  final List<PartyModel> _partyCache = [];
  bool _initialized = false;

  InvoiceRepository({AppwriteService? service})
      : _service = service ?? AppwriteService();

  Future<void> _seedDemoData(String tenantId) async {
    if (_inMemoryCache.isNotEmpty) return;

    final now = DateTime.now();
    _inMemoryCache.addAll([
      InvoiceModel(
        id: 'inv_demo_101',
        tenantId: tenantId,
        documentNumber: 'INV-2026-001',
        type: 'Tax Invoice',
        status: 'paid',
        issueDate: now.subtract(const Duration(days: 12)),
        dueDate: now.subtract(const Duration(days: 2)),
        clientName: 'Acme Technologies Pvt Ltd',
        clientEmail: 'billing@acme.com',
        clientPhone: '+91 98765 43210',
        clientAddress: 'Cyber City, Phase 2, Gurugram, India',
        clientGstin: '06AAAAA0000A1Z5',
        currency: 'INR',
        upiId: 'acme@okaxis',
        items: const [
          InvoiceItemModel(
            id: 'item_1',
            description: 'Cloud Infrastructure Setup & Kubernetes Migration',
            quantity: 1,
            unitPrice: 45000,
            taxRate: 18,
          ),
          InvoiceItemModel(
            id: 'item_2',
            description: 'Technical Architecture & Security Audit',
            quantity: 12,
            unitPrice: 2500,
            taxRate: 18,
            discountRate: 5,
          ),
        ],
        notes: 'Thank you for partnering with us!',
        terms: 'Payment received in full via UPI.',
      ),
      InvoiceModel(
        id: 'inv_demo_102',
        tenantId: tenantId,
        documentNumber: 'INV-2026-002',
        type: 'Tax Invoice',
        status: 'sent',
        issueDate: now.subtract(const Duration(days: 3)),
        dueDate: now.add(const Duration(days: 11)),
        clientName: 'Global Design Studio',
        clientEmail: 'accounts@globalstudio.co',
        clientPhone: '+1 415 555 2671',
        clientAddress: '500 Howard St, San Francisco, CA',
        currency: 'USD',
        items: const [
          InvoiceItemModel(
            id: 'item_3',
            description: 'Mobile App UI/UX Design System (Figma)',
            quantity: 1,
            unitPrice: 3200,
            taxRate: 0,
          ),
        ],
        notes: 'Net 14 payment terms.',
      ),
      InvoiceModel(
        id: 'inv_demo_103',
        tenantId: tenantId,
        documentNumber: 'INV-2026-003',
        type: 'Estimate / Quote',
        status: 'draft',
        issueDate: now,
        dueDate: now.add(const Duration(days: 30)),
        clientName: 'Nexus Retail Stores',
        clientEmail: 'procurement@nexusretail.in',
        currency: 'INR',
        items: const [
          InvoiceItemModel(
            id: 'item_4',
            description: 'Point of Sale (POS) Hardware & Software License',
            quantity: 3,
            unitPrice: 18500,
            taxRate: 18,
          ),
        ],
      ),
    ]);
  }

  /// Get all invoices (loads from Appwrite or fallback cache)
  Future<List<InvoiceModel>> getInvoices(String tenantId) async {
    try {
      final remoteInvoices = await _service.fetchInvoices(tenantId);
      if (remoteInvoices.isNotEmpty) {
        _inMemoryCache.clear();
        _inMemoryCache.addAll(remoteInvoices);
        return List.unmodifiable(_inMemoryCache);
      }
    } catch (_) {
      // Remote unavailable or collection empty; use cached/seeded records
    }

    if (!_initialized) {
      await _seedDemoData(tenantId);
      _initialized = true;
    }

    return List.unmodifiable(_inMemoryCache);
  }

  /// Save or update an invoice
  Future<InvoiceModel> saveInvoice(InvoiceModel invoice) async {
    // Try remote Appwrite first
    try {
      final existingIndex =
          _inMemoryCache.indexWhere((inv) => inv.id == invoice.id);
      if (existingIndex >= 0) {
        await _service.updateInvoice(invoice);
      } else {
        await _service.createInvoice(invoice);
      }
    } catch (_) {
      // Offline fallback: keep in memory
    }

    final index = _inMemoryCache.indexWhere((inv) => inv.id == invoice.id);
    if (index >= 0) {
      _inMemoryCache[index] = invoice;
    } else {
      _inMemoryCache.insert(0, invoice);
    }

    return invoice;
  }

  /// Delete an invoice
  Future<bool> deleteInvoice(String id) async {
    try {
      await _service.deleteInvoice(id);
    } catch (_) {}

    _inMemoryCache.removeWhere((inv) => inv.id == id);
    return true;
  }

  /// Get saved clients
  Future<List<PartyModel>> getParties(String tenantId) async {
    try {
      final remote = await _service.fetchParties(tenantId);
      if (remote.isNotEmpty) {
        _partyCache.clear();
        _partyCache.addAll(remote);
      }
    } catch (_) {}

    if (_partyCache.isEmpty) {
      _partyCache.addAll([
        PartyModel(
          id: 'party_1',
          tenantId: tenantId,
          name: 'Acme Technologies Pvt Ltd',
          email: 'billing@acme.com',
          phone: '+91 98765 43210',
          address: 'Cyber City, Phase 2, Gurugram, India',
          taxId: '06AAAAA0000A1Z5',
        ),
        PartyModel(
          id: 'party_2',
          tenantId: tenantId,
          name: 'Global Design Studio',
          email: 'accounts@globalstudio.co',
          phone: '+1 415 555 2671',
          address: '500 Howard St, San Francisco, CA',
        ),
      ]);
    }

    return List.unmodifiable(_partyCache);
  }
}
