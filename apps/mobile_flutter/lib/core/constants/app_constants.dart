/// Core application constants, Appwrite endpoints, and document types.
class AppConstants {
  // Appwrite Cloud Backend (Frankfurt Region)
  static const String appwriteEndpoint = 'https://fra.cloud.appwrite.io/v1';
  static const String appwriteProjectId = '6ad50773002db278519e';
  static const String appwriteDatabaseId = 'invoxa_main';
  static const String appwriteBucketId = 'invoxa_assets';

  // Collection IDs
  static const String collectionTenants = 'tenants';
  static const String collectionParties = 'parties';
  static const String collectionProducts = 'products';
  static const String collectionDocuments = 'documents';
  static const String collectionPayments = 'payments';
  static const String collectionBrandSettings = 'brand_settings';

  // Business Defaults
  static const String defaultTenantId = 'tenant_main';
  static const String defaultCurrency = 'INR';
  static const String defaultCurrencySymbol = '₹';
  static const int freeTrialInvoiceLimit = 7;

  // Supported Document Types
  static const List<String> documentTypes = [
    'Invoice',
    'Tax Invoice',
    'Proforma Invoice',
    'Estimate / Quote',
    'Receipt',
    'Credit Note',
    'Delivery Challan',
  ];

  // Currencies
  static const List<Map<String, String>> currencies = [
    {'code': 'INR', 'symbol': '₹', 'name': 'Indian Rupee (INR)'},
    {'code': 'USD', 'symbol': '$', 'name': 'US Dollar (USD)'},
    {'code': 'EUR', 'symbol': '€', 'name': 'Euro (EUR)'},
    {'code': 'GBP', 'symbol': '£', 'name': 'British Pound (GBP)'},
    {'code': 'AED', 'symbol': 'د.إ', 'name': 'UAE Dirham (AED)'},
    {'code': 'AUD', 'symbol': 'A$', 'name': 'Australian Dollar (AUD)'},
    {'code': 'CAD', 'symbol': 'C$', 'name': 'Canadian Dollar (CAD)'},
  ];
}
