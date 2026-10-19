import 'package:flutter/foundation.dart';
import '../../core/constants/app_constants.dart';
import '../../data/models/invoice_model.dart';
import '../../data/repositories/invoice_repository.dart';

enum InvoiceFilter { all, paid, sent, draft }

class InvoiceViewModel extends ChangeNotifier {
  final InvoiceRepository _repository;

  List<InvoiceModel> _invoices = [];
  bool _isLoading = false;
  String? _errorMessage;
  String _tenantId = AppConstants.defaultTenantId;
  InvoiceFilter _selectedFilter = InvoiceFilter.all;
  String _searchQuery = '';

  InvoiceViewModel({InvoiceRepository? repository})
      : _repository = repository ?? InvoiceRepository();

  List<InvoiceModel> get invoices {
    return _invoices.where((inv) {
      // Filter by status
      if (_selectedFilter == InvoiceFilter.paid && inv.status != 'paid') {
        return false;
      }
      if (_selectedFilter == InvoiceFilter.sent && inv.status != 'sent') {
        return false;
      }
      if (_selectedFilter == InvoiceFilter.draft && inv.status != 'draft') {
        return false;
      }

      // Filter by search query
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final matchNumber = inv.documentNumber.toLowerCase().contains(query);
        final matchClient = inv.clientName.toLowerCase().contains(query);
        return matchNumber || matchClient;
      }

      return true;
    }).toList();
  }

  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  InvoiceFilter get selectedFilter => _selectedFilter;
  String get searchQuery => _searchQuery;

  // KPI Calculations
  double get totalBilled =>
      _invoices.fold(0.0, (sum, inv) => sum + inv.grandTotal);

  double get totalPaid => _invoices
      .where((inv) => inv.status == 'paid')
      .fold(0.0, (sum, inv) => sum + inv.grandTotal);

  double get totalPending => _invoices
      .where((inv) => inv.status == 'sent' || inv.status == 'draft')
      .fold(0.0, (sum, inv) => sum + inv.grandTotal);

  int get invoiceCount => _invoices.length;

  Future<void> loadInvoices([String? tenantId]) async {
    if (tenantId != null) _tenantId = tenantId;
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _invoices = await _repository.getInvoices(_tenantId);
    } catch (e) {
      _errorMessage = 'Could not load invoices: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void setFilter(InvoiceFilter filter) {
    _selectedFilter = filter;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  Future<void> saveInvoice(InvoiceModel invoice) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _repository.saveInvoice(invoice);
      await loadInvoices(_tenantId);
    } catch (e) {
      _errorMessage = 'Failed to save invoice: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> markAsPaid(String invoiceId) async {
    final index = _invoices.indexWhere((inv) => inv.id == invoiceId);
    if (index >= 0) {
      final updated = _invoices[index].copyWith(status: 'paid');
      await saveInvoice(updated);
    }
  }

  Future<void> deleteInvoice(String invoiceId) async {
    _isLoading = true;
    notifyListeners();

    try {
      await _repository.deleteInvoice(invoiceId);
      _invoices.removeWhere((inv) => inv.id == invoiceId);
    } catch (e) {
      _errorMessage = 'Failed to delete invoice: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
