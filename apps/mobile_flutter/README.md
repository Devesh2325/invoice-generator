# Invoxa Mobile — Flutter Invoice Generator & Billing App

A modern, cross-platform mobile application built with **Flutter 3.x** and **Material 3**, connected directly to the **Appwrite Cloud** multi-tenant backend (`https://fra.cloud.appwrite.io/v1`).

---

## 📱 Features

1. **Dashboard & KPIs**:
   - Total Billed, Total Paid, and Pending Due metric cards.
   - Live status filter pills (`All`, `Paid`, `Sent`, `Draft`).
   - Instant search across invoice numbers and client names.
   - Pull-to-refresh connected to Appwrite Cloud.

2. **Complete Mobile Invoice Flow**:
   - Touch-optimized invoice creator with automatic number sequencing (`INV-2026-xxx`).
   - Document Type switcher (`Tax Invoice`, `Proforma`, `Estimate`, `Receipt`, `Credit Note`).
   - Customer autofill & billing address / GSTIN / Tax ID inputs.
   - Dynamic line items with real-time tax (%) and discount (%) calculation.
   - Live totals breakdown (Subtotal, Tax, Discount, Grand Total).

3. **Instant UPI QR Payments**:
   - Real-time ISO/IEC 18004 dynamic UPI payment QR code generated with `qr_flutter`.
   - Compatible with Google Pay, PhonePe, Paytm, and BHIM UPI apps.

4. **PDF Generation & Native Sharing**:
   - Vector A4 invoice PDF generation using `pdf` & `printing`.
   - One-tap WhatsApp & Email invoice dispatch using `share_plus`.

5. **Multi-Tenant Appwrite Cloud Backend**:
   - Direct REST integration with `invoxa_main` database in Frankfurt.
   - Automated offline caching and graceful local fallback.

---

## 🏗️ Architecture (MVVM + Repository)

```text
apps/mobile_flutter/lib/
├── core/
│   ├── constants/app_constants.dart    # Appwrite endpoints, currencies, document types
│   └── theme/app_theme.dart            # Material 3 Light & Dark mode themes
├── data/
│   ├── models/
│   │   ├── invoice_item_model.dart     # Line items, tax & discount logic
│   │   ├── invoice_model.dart          # Domain invoice model & Appwrite JSON mapping
│   │   └── party_model.dart            # Customer & vendor records
│   ├── services/appwrite_service.dart  # Appwrite REST client (documents, parties)
│   └── repositories/invoice_repository.dart # Single source of truth & offline fallback
└── ui/
    ├── view_models/
    │   ├── invoice_view_model.dart     # Dashboard state, KPI counters & filters
    │   └── create_invoice_view_model.dart # Live calculation & validation engine
    └── views/
        ├── dashboard_view.dart         # Main mobile dashboard
        ├── create_invoice_view.dart    # Touch-friendly invoice creator flow
        └── invoice_detail_view.dart    # UPI QR, PDF generator & sharing
```

---

## 🚀 How to Run

### 1. Install Dependencies
```bash
cd apps/mobile_flutter
flutter pub get
```

### 2. Run on Device / Simulator
```bash
# Run on connected Android / iOS device or Chrome
flutter run
```

### 3. Build Production APK
```bash
flutter build apk --release
```
The APK will be available at: `build/app/outputs/flutter-apk/app-release.apk`.
