import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/theme/app_theme.dart';
import 'data/repositories/invoice_repository.dart';
import 'data/services/appwrite_service.dart';
import 'ui/view_models/invoice_view_model.dart';
import 'ui/views/dashboard_view.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const InvoxaMobileApp());
}

class InvoxaMobileApp extends StatelessWidget {
  const InvoxaMobileApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<AppwriteService>(
          create: (_) => AppwriteService(),
        ),
        ProxyProvider<AppwriteService, InvoiceRepository>(
          update: (_, service, __) => InvoiceRepository(service: service),
        ),
        ChangeNotifierProxyProvider<InvoiceRepository, InvoiceViewModel>(
          create: (ctx) => InvoiceViewModel(
            repository: ctx.read<InvoiceRepository>(),
          ),
          update: (_, repo, vm) => vm ?? InvoiceViewModel(repository: repo),
        ),
      ],
      child: MaterialApp(
        title: 'Invoxa Mobile — Invoice Generator',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        darkTheme: AppTheme.darkTheme,
        themeMode: ThemeMode.system,
        home: const DashboardView(),
      ),
    );
  }
}
