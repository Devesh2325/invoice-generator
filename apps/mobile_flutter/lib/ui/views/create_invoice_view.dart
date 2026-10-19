import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_constants.dart';
import '../../core/theme/app_theme.dart';
import '../../data/models/invoice_item_model.dart';
import '../view_models/create_invoice_view_model.dart';
import '../view_models/invoice_view_model.dart';
import 'invoice_detail_view.dart';

class CreateInvoiceView extends StatelessWidget {
  const CreateInvoiceView({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => CreateInvoiceViewModel(),
      child: const _CreateInvoiceForm(),
    );
  }
}

class _CreateInvoiceForm extends StatefulWidget {
  const _CreateInvoiceForm();

  @override
  State<_CreateInvoiceForm> createState() => _CreateInvoiceFormState();
}

class _CreateInvoiceFormState extends State<_CreateInvoiceForm> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final vm = context.watch<CreateInvoiceViewModel>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final currencySymbol = vm.currency == 'USD' ? '\$' : '₹';
    final currencyFormat = NumberFormat.currency(symbol: currencySymbol, decimalDigits: 2);

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Invoice', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          TextButton.icon(
            icon: const Icon(Icons.check, color: AppTheme.primaryBlue),
            label: const Text(
              'Finalize',
              style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
            ),
            onPressed: () => _handleSave(context, vm, status: 'sent'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          children: [
            // 1. Document Header Info Card
            _buildSectionCard(
              title: 'Document Details',
              icon: Icons.description_outlined,
              isDark: isDark,
              child: Column(
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          initialValue: vm.documentNumber,
                          decoration: const InputDecoration(labelText: 'Invoice Number'),
                          onChanged: (val) => vm.documentNumber = val,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          initialValue: vm.documentType,
                          decoration: const InputDecoration(labelText: 'Type'),
                          items: AppConstants.documentTypes
                              .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(fontSize: 13))))
                              .toList(),
                          onChanged: (val) {
                            if (val != null) setState(() => vm.documentType = val);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildDatePicker(
                          context,
                          label: 'Issue Date',
                          selectedDate: vm.issueDate,
                          onDateSelected: (d) => setState(() => vm.issueDate = d),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildDatePicker(
                          context,
                          label: 'Due Date',
                          selectedDate: vm.dueDate,
                          onDateSelected: (d) => setState(() => vm.dueDate = d),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 2. Client Details Card
            _buildSectionCard(
              title: 'Billed To (Customer Details)',
              icon: Icons.person_outline,
              isDark: isDark,
              child: Column(
                children: [
                  TextFormField(
                    initialValue: vm.clientName,
                    decoration: const InputDecoration(
                      labelText: 'Customer / Business Name *',
                      hintText: 'e.g. Acme Corp',
                    ),
                    onChanged: (val) => vm.clientName = val,
                    validator: (val) => (val == null || val.trim().isEmpty)
                        ? 'Customer name is required'
                        : null,
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          initialValue: vm.clientEmail,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(labelText: 'Email Address'),
                          onChanged: (val) => vm.clientEmail = val,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: TextFormField(
                          initialValue: vm.clientPhone,
                          keyboardType: TextInputType.phone,
                          decoration: const InputDecoration(labelText: 'Phone Number'),
                          onChanged: (val) => vm.clientPhone = val,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: vm.clientAddress,
                    maxLines: 2,
                    decoration: const InputDecoration(labelText: 'Billing Address'),
                    onChanged: (val) => vm.clientAddress = val,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: vm.clientGstin,
                    decoration: const InputDecoration(labelText: 'GSTIN / Tax ID'),
                    onChanged: (val) => vm.clientGstin = val,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 3. Line Items Section
            _buildSectionCard(
              title: 'Line Items & Services',
              icon: Icons.format_list_bulleted,
              isDark: isDark,
              child: Column(
                children: [
                  ...vm.items.asMap().entries.map((entry) {
                    final index = entry.key;
                    final item = entry.value;
                    return _buildLineItemTile(context, vm, index, item, currencySymbol);
                  }),
                  const SizedBox(height: 10),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size.fromHeight(46),
                      side: const BorderSide(color: AppTheme.primaryBlue),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    icon: const Icon(Icons.add, color: AppTheme.primaryBlue),
                    label: const Text(
                      'Add Another Item',
                      style: TextStyle(color: AppTheme.primaryBlue, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () => vm.addItem(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 4. Payment & UPI QR Setup
            _buildSectionCard(
              title: 'UPI & Payment Options',
              icon: Icons.qr_code_2,
              isDark: isDark,
              child: Column(
                children: [
                  TextFormField(
                    initialValue: vm.upiId,
                    decoration: const InputDecoration(
                      labelText: 'UPI VPA (for Instant QR Payment)',
                      hintText: 'e.g. yourbusiness@okaxis',
                      prefixIcon: Icon(Icons.payment, size: 20),
                    ),
                    onChanged: (val) => vm.upiId = val,
                  ),
                  const SizedBox(height: 10),
                  TextFormField(
                    initialValue: vm.notes,
                    decoration: const InputDecoration(labelText: 'Customer Notes'),
                    onChanged: (val) => vm.notes = val,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // 5. Real-Time Calculation Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: isDark ? AppTheme.slate900 : Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.primaryBlue.withValues(alpha: 0.4), width: 1.5),
              ),
              child: Column(
                children: [
                  _buildSummaryRow('Subtotal', currencyFormat.format(vm.subtotal)),
                  const SizedBox(height: 8),
                  if (vm.discountTotal > 0) ...[
                    _buildSummaryRow(
                      'Discount',
                      '-${currencyFormat.format(vm.discountTotal)}',
                      textColor: AppTheme.emeraldGreen,
                    ),
                    const SizedBox(height: 8),
                  ],
                  _buildSummaryRow('Tax Total (GST)', currencyFormat.format(vm.taxTotal)),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Grand Total',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                      ),
                      Text(
                        currencyFormat.format(vm.grandTotal),
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryBlue,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Bottom Actions
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Save as Draft'),
                    onPressed: () => _handleSave(context, vm, status: 'draft'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Create & Share'),
                    onPressed: () => _handleSave(context, vm, status: 'sent'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionCard({
    required String title,
    required IconData icon,
    required Widget child,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? AppTheme.slate900 : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? AppTheme.slate800 : AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 20, color: AppTheme.primaryBlue),
              const SizedBox(width: 8),
              Text(
                title,
                style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          const Divider(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildLineItemTile(
    BuildContext context,
    CreateInvoiceViewModel vm,
    int index,
    InvoiceItemModel item,
    String currencySymbol,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppTheme.slate50,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppTheme.slate200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: TextFormField(
                  initialValue: item.description,
                  decoration: InputDecoration(
                    labelText: 'Item #${index + 1} Description',
                    hintText: 'e.g. Website Development',
                    isDense: true,
                  ),
                  onChanged: (val) =>
                      vm.updateItem(index, item.copyWith(description: val)),
                ),
              ),
              if (vm.items.length > 1)
                IconButton(
                  icon: const Icon(Icons.delete_outline, color: AppTheme.roseDanger),
                  onPressed: () => vm.removeItem(index),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: TextFormField(
                  initialValue: item.quantity.toString(),
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Qty', isDense: true),
                  onChanged: (val) {
                    final qty = double.tryParse(val) ?? 1.0;
                    vm.updateItem(index, item.copyWith(quantity: qty));
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 3,
                child: TextFormField(
                  initialValue: item.unitPrice.toString(),
                  keyboardType: TextInputType.number,
                  decoration: InputDecoration(
                    labelText: 'Price ($currencySymbol)',
                    isDense: true,
                  ),
                  onChanged: (val) {
                    final price = double.tryParse(val) ?? 0.0;
                    vm.updateItem(index, item.copyWith(unitPrice: price));
                  },
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                flex: 2,
                child: TextFormField(
                  initialValue: item.taxRate.toString(),
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Tax %', isDense: true),
                  onChanged: (val) {
                    final tax = double.tryParse(val) ?? 0.0;
                    vm.updateItem(index, item.copyWith(taxRate: tax));
                  },
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Align(
            alignment: Alignment.centerRight,
            child: Text(
              'Line Total: $currencySymbol${item.lineTotal.toStringAsFixed(2)}',
              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryBlue),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDatePicker(
    BuildContext context, {
    required String label,
    required DateTime selectedDate,
    required Function(DateTime) onDateSelected,
  }) {
    return InkWell(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: selectedDate,
          firstDate: DateTime(2020),
          lastDate: DateTime(2035),
        );
        if (picked != null) onDateSelected(picked);
      },
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          suffixIcon: const Icon(Icons.calendar_today, size: 18),
        ),
        child: Text(
          DateFormat('dd MMM yyyy').format(selectedDate),
          style: const TextStyle(fontSize: 14),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color? textColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: AppTheme.slate500, fontSize: 14)),
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14,
            color: textColor,
          ),
        ),
      ],
    );
  }

  Future<void> _handleSave(
    BuildContext context,
    CreateInvoiceViewModel vm, {
    required String status,
  }) async {
    final error = vm.validate();
    if (error != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(error), backgroundColor: AppTheme.roseDanger),
      );
      return;
    }

    final newInvoice = vm.buildInvoice(
      tenantId: AppConstants.defaultTenantId,
      status: status,
    );

    // Save through ViewModel
    final invoiceVm = context.read<InvoiceViewModel>();
    await invoiceVm.saveInvoice(newInvoice);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('✓ ${newInvoice.documentNumber} created successfully!'),
          backgroundColor: AppTheme.emeraldGreen,
        ),
      );
      // Navigate directly to Detail / Share view
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => InvoiceDetailView(invoice: newInvoice),
        ),
      );
    }
  }
}
