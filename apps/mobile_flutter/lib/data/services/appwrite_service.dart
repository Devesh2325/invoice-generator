import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../core/constants/app_constants.dart';
import '../models/invoice_model.dart';
import '../models/party_model.dart';

class AppwriteService {
  final http.Client _client;

  AppwriteService({http.Client? client}) : _client = client ?? http.Client();

  Map<String, String> get _headers => {
        'X-Appwrite-Project': AppConstants.appwriteProjectId,
        'Content-Type': 'application/json',
      };

  String get _baseDbUrl =>
      '${AppConstants.appwriteEndpoint}/databases/${AppConstants.appwriteDatabaseId}';

  /// Fetch all invoices for a tenant
  Future<List<InvoiceModel>> fetchInvoices(String tenantId) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionDocuments}/documents'
      '?queries[]=equal("tenantId",["$tenantId"])'
      '&queries[]=orderDesc("\$createdAt")',
    );

    try {
      final response = await _client.get(uri, headers: _headers);

      if (response.statusCode == 200) {
        final Map<String, dynamic> body = jsonDecode(response.body);
        final List<dynamic> docs = body['documents'] as List<dynamic>? ?? [];
        return docs
            .map((doc) => InvoiceModel.fromAppwrite(doc as Map<String, dynamic>))
            .toList();
      } else {
        throw Exception('Failed to fetch invoices: HTTP ${response.statusCode}');
      }
    } catch (e) {
      // Return empty list on network failure or propagate error
      rethrow;
    }
  }

  /// Create a new invoice document
  Future<InvoiceModel> createInvoice(InvoiceModel invoice) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionDocuments}/documents',
    );

    final payload = {
      'documentId': invoice.id,
      'data': invoice.toAppwriteJson(),
    };

    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode(payload),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return InvoiceModel.fromAppwrite(body);
    } else {
      throw Exception('Failed to create invoice: ${response.body}');
    }
  }

  /// Update an existing invoice document
  Future<InvoiceModel> updateInvoice(InvoiceModel invoice) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionDocuments}/documents/${invoice.id}',
    );

    final response = await _client.patch(
      uri,
      headers: _headers,
      body: jsonEncode({'data': invoice.toAppwriteJson()}),
    );

    if (response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return InvoiceModel.fromAppwrite(body);
    } else {
      throw Exception('Failed to update invoice: ${response.body}');
    }
  }

  /// Delete an invoice document
  Future<bool> deleteInvoice(String documentId) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionDocuments}/documents/$documentId',
    );

    final response = await _client.delete(uri, headers: _headers);
    return response.statusCode == 204 || response.statusCode == 200;
  }

  /// Fetch parties (Customers / Clients)
  Future<List<PartyModel>> fetchParties(String tenantId) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionParties}/documents'
      '?queries[]=equal("tenantId",["$tenantId"])',
    );

    final response = await _client.get(uri, headers: _headers);

    if (response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      final List<dynamic> docs = body['documents'] as List<dynamic>? ?? [];
      return docs
          .map((doc) => PartyModel.fromJson(doc as Map<String, dynamic>))
          .toList();
    } else {
      return [];
    }
  }

  /// Create a party
  Future<PartyModel> createParty(PartyModel party) async {
    final uri = Uri.parse(
      '$_baseDbUrl/collections/${AppConstants.collectionParties}/documents',
    );

    final payload = {
      'documentId': party.id,
      'data': party.toJson(),
    };

    final response = await _client.post(
      uri,
      headers: _headers,
      body: jsonEncode(payload),
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      return PartyModel.fromJson(body);
    } else {
      throw Exception('Failed to create party: ${response.body}');
    }
  }
}
