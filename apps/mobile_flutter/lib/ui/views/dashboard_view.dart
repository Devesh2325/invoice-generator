import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/invoice_model.dart';
import '../view_models/invoice_view_model.dart';
import 'create_invoice_view.dart';
import 'invoice_detail_view.dart';

class DashboardView extends StatefulWidget {
  const DashboardView({super.key});

  @override
  State<DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<DashboardView> {
  final TextEditingController _searchCtrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<InvoiceViewModel>().loadInvoices();
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<InvoiceViewModel>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencyFormatter = NumberFormat.currency(symbol: '₹', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppTheme.primaryBlue,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.receipt_long, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Invoxa Billing',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                Text(
                  'Cloud Invoice Generator',
                  style: TextStyle(fontSize: 11, color: AppTheme.slate500),
                ),
              ],
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => vm.loadInvoices(),
            tooltip: 'Sync Appwrite Cloud',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => vm.loadInvoices(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Search Input
              TextField(
                controller: _searchCtrl,
                onChanged: (val) => vm.setSearchQuery(val),
                decoration: InputDecoration(
                  hintText: 'Search by invoice # or client name...',
                  prefixIcon: const Icon(Icons.search, color: AppTheme.slate400),
                  suffixIcon: _searchCtrl.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear, size: 18),
                          onPressed: () {
                            _searchCtrl.clear();
                            vm.setSearchQuery('');
                          },
                        )
                      : null,
                ),
              ),
              const SizedBox(height: 16),

              // KPI Summary Cards
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildKpiCard(
                      title: 'Total Billed',
                      amount: currencyFormatter.format(vm.totalBilled),
                      subtitle: '${vm.invoiceCount} invoices',
                      color: AppTheme.primaryBlue,
                      icon: Icons.account_balance_wallet,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildKpiCard(
                      title: 'Paid Revenue',
                      amount: currencyFormatter.format(vm.totalPaid),
                      subtitle: 'Settled payments',
                      color: AppTheme.emeraldGreen,
                      icon: Icons.check_circle_outline,
                      isDark: isDark,
                    ),
                    const SizedBox(width: 12),
                    _buildKpiCard(
                      title: 'Pending Due',
                      amount: currencyFormatter.format(vm.totalPending),
                      subtitle: 'Awaiting clearance',
                      color: AppTheme.amberWarning,
                      icon: Icons.hourglass_top,
                      isDark: isDark,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Filter Chips
              Row(
                children: [
                  _buildFilterChip('All', InvoiceFilter.all, vm),
                  const SizedBox(width: 8),
                  _buildFilterChip('Paid', InvoiceFilter.paid, vm),
                  const SizedBox(width: 8),
                  _buildFilterChip('Sent', InvoiceFilter.sent, vm),
                  const SizedBox(width: 8),
                  _buildFilterChip('Draft', InvoiceFilter.draft, vm),
                ],
              ),
              const SizedBox(height: 16),

              // Invoices List Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Recent Invoices (${vm.invoices.length})',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (vm.isLoading)
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                ],
              ),
              const SizedBox(height: 12),

              if (vm.invoices.isEmpty && !vm.isLoading)
                _buildEmptyState(context)
              else
                ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: vm.invoices.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 10),
                  itemBuilder: (context, index) {
                    final invoice = vm.invoices[index];
                    return _buildInvoiceCard(context, invoice, vm, isDark);
                  },
                ),
              const SizedBox(height: 80), // Padding for FAB
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primaryBlue,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(
          'New Invoice',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => const CreateInvoiceView(),
            ),
          );
        },
      ),
    );
  }

  Widget _buildKpiCard({
    required String title,
    required String amount,
    required String subtitle,
    required Color color,
    required IconData icon,
    required bool isDark,
  }) {
    return Container(
      width: 170,
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppTheme.slate500,
                  fontWeight: FontWeight.w600,
                ),
              ),
              Icon(icon, color: color, size: 20),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            amount,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(
    String label,
    InvoiceFilter filter,
    InvoiceViewModel vm,
  ) {
    final isSelected = vm.selectedFilter == filter;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => vm.setFilter(filter),
      selectedColor: AppTheme.primaryBlue,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.slate500,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        fontSize: 13,
      ),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),
    );
  }

  Widget _buildInvoiceCard(
    BuildContext context,
    InvoiceModel invoice,
    InvoiceViewModel vm,
    bool isDark,
  ) {
    final currencySymbol = invoice.currency == 'USD' ? '\$' : '₹';
    final formattedTotal = NumberFormat.currency(
      symbol: currencySymbol,
      decimalDigits: 2,
    ).format(invoice.grandTotal);

    final statusColor = invoice.status == 'paid'
        ? AppTheme.emeraldGreen
        : invoice.status == 'sent'
            ? AppTheme.primaryBlue
            : AppTheme.amberWarning;

    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => InvoiceDetailView(invoice: invoice),
            ),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    invoice.documentNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      invoice.status.toUpperCase(),
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                invoice.clientName,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: AppTheme.slate600,
                ),
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Due ${DateFormat('dd MMM yyyy').format(invoice.dueDate)}',
                    style: const TextStyle(
                      fontSize: 12,
                      color: AppTheme.slate400,
                    ),
                  ),
                  Text(
                    formattedTotal,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryBlue,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        children: [
          const Icon(Icons.receipt_outlined, size: 48, color: AppTheme.slate400),
          const SizedBox(height: 12),
          const Text(
            'No invoices found',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 6),
          const Text(
            'Create your first invoice to get paid faster!',
            style: TextStyle(color: AppTheme.slate500, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          ElevatedButton.icon(
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Create Invoice'),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const CreateInvoiceView(),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}
