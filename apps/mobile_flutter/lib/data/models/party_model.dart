class PartyModel {
  final String id;
  final String tenantId;
  final String type; // 'customer' or 'vendor'
  final String name;
  final String? email;
  final String? phone;
  final String? address;
  final String? taxId; // GSTIN or Tax ID

  const PartyModel({
    required this.id,
    required this.tenantId,
    this.type = 'customer',
    required this.name,
    this.email,
    this.phone,
    this.address,
    this.taxId,
  });

  Map<String, dynamic> toJson() {
    return {
      'partyId': id,
      'tenantId': tenantId,
      'type': type,
      'name': name,
      'email': email,
      'phone': phone,
      'address': address,
      'taxId': taxId,
      'isArchived': false,
      'data': '{}',
    };
  }

  factory PartyModel.fromJson(Map<String, dynamic> json) {
    return PartyModel(
      id: json['partyId'] as String? ?? json['\$id'] as String? ?? '',
      tenantId: json['tenantId'] as String? ?? '',
      type: json['type'] as String? ?? 'customer',
      name: json['name'] as String? ?? '',
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      address: json['address'] as String?,
      taxId: json['taxId'] as String?,
    );
  }
}
