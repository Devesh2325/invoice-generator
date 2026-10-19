class InvoiceItemModel {
  final String id;
  final String description;
  final double quantity;
  final double unitPrice;
  final double taxRate; // e.g. 18.0 for 18%
  final double discountRate; // e.g. 5.0 for 5%

  const InvoiceItemModel({
    required this.id,
    required this.description,
    this.quantity = 1.0,
    this.unitPrice = 0.0,
    this.taxRate = 0.0,
    this.discountRate = 0.0,
  });

  double get subtotal => quantity * unitPrice;

  double get discountAmount => subtotal * (discountRate / 100);

  double get taxableAmount => subtotal - discountAmount;

  double get taxAmount => taxableAmount * (taxRate / 100);

  double get lineTotal => taxableAmount + taxAmount;

  InvoiceItemModel copyWith({
    String? id,
    String? description,
    double? quantity,
    double? unitPrice,
    double? taxRate,
    double? discountRate,
  }) {
    return InvoiceItemModel(
      id: id ?? this.id,
      description: description ?? this.description,
      quantity: quantity ?? this.quantity,
      unitPrice: unitPrice ?? this.unitPrice,
      taxRate: taxRate ?? this.taxRate,
      discountRate: discountRate ?? this.discountRate,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'description': description,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'taxRate': taxRate,
      'discountRate': discountRate,
      'lineTotal': lineTotal,
    };
  }

  factory InvoiceItemModel.fromJson(Map<String, dynamic> json) {
    return InvoiceItemModel(
      id: json['id'] as String? ?? '',
      description: json['description'] as String? ?? '',
      quantity: (json['quantity'] as num?)?.toDouble() ?? 1.0,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      taxRate: (json['taxRate'] as num?)?.toDouble() ?? 0.0,
      discountRate: (json['discountRate'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
