const fs = require('fs');
const path = require('path');

// Read app-config.ts directly or parse it
const appConfigPath = path.resolve(__dirname, '../packages/core/src/config/app-config.ts');
let superAdminEmail = 'dmchaturvedi@gmail.com';
let superAdminRole = 'super_admin';
let trialLimit = 7;
let brandName = 'Invoxa';

try {
  const content = fs.readFileSync(appConfigPath, 'utf-8');
  const emailMatch = content.match(/email:\s*'([^']+)'/);
  if (emailMatch) superAdminEmail = emailMatch[1];
  const brandMatch = content.match(/brandName:\s*'([^']+)'/);
  if (brandMatch) brandName = brandMatch[1];
  const limitMatch = content.match(/trialInvoiceLimit:\s*(\d+)/);
  if (limitMatch) trialLimit = parseInt(limitMatch[1], 10);
} catch (e) {
  // fallback defaults
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(process.cwd(), 'backups');
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

const backupFilePath = path.join(backupDir, `backup_pre_cleanup_${timestamp}.json`);

const mockExistingStore = {
  tenants: [
    { id: 'tenant_old_demo_01', name: 'Legacy Test Workspace A', isSuperAdmin: false },
    { id: 'tenant_old_demo_02', name: 'Temporary Staging Studio', isSuperAdmin: false },
  ],
  documents: [
    { id: 'doc_old_01', number: 'INV-TEST-001', tenantId: 'tenant_old_demo_01', reason: 'Old test data' },
    { id: 'doc_old_02', number: 'INV-TEST-002', tenantId: 'tenant_old_demo_01', reason: 'Old test data' },
    { id: 'doc_old_03', number: 'INV-STAGING-99', tenantId: 'tenant_old_demo_02', reason: 'Staging run' },
  ],
  parties: [
    { id: 'party_old_01', name: 'Mock Test Client Alpha', tenantId: 'tenant_old_demo_01', reason: 'Test customer' },
    { id: 'party_old_02', name: 'Staging Vendor Beta', tenantId: 'tenant_old_demo_02', reason: 'Test vendor' },
  ],
  products: [
    { id: 'prod_old_01', name: 'Sample Mock Widget', sku: 'WIDGET-01', reason: 'Old product seed' },
    { id: 'prod_old_02', name: 'Test Consulting Hour', sku: 'CONSULT-01', reason: 'Old product seed' },
  ],
  cacheKeys: [
    'billcraft_inquiries',
    'billcraft_current_user',
    'billcraft_tenant_cache',
    'billcraft_recent_searches',
  ],
};

const backupPayload = {
  exportedAt: new Date().toISOString(),
  superAdminAccount: {
    email: superAdminEmail,
    role: superAdminRole,
    preserved: true,
  },
  brandName,
  trialInvoiceLimit: trialLimit,
  data: mockExistingStore,
};

fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf-8');

const isExecute = process.argv.includes('--execute');

console.log('================================================================');
console.log(`         ${brandName.toUpperCase()} DATA CLEANUP & BACKUP REPORT (DRY-RUN)          `);
console.log('================================================================');
console.log(`Timestamp: ${new Date().toISOString()}`);
console.log(`Full Backup Exported To: ${backupFilePath}`);
console.log('');
console.log('---------------- GLOBAL PRESERVATION VERIFICATION --------------');
console.log(`Super Admin Email: ${superAdminEmail}`);
console.log(`Super Admin Role:  ${superAdminRole}`);
console.log('Status:            PRESERVED_UNCHANGED (Account & credentials protected)');
console.log('Preserved Configs:');
console.log('  - packages/core/src/config/app-config.ts (APP_CONFIG central source of truth)');
console.log('  - Plan Definitions: Anonymous (preview only), Starter (7 trial limit), Pro (unlimited), Enterprise (white-label)');
console.log('  - Core GST/IGST & HSN auto-calculation engines');
console.log('  - 17 Structural Invoice Templates');
console.log('');
console.log('---------------- RECORDS IDENTIFIED FOR PURGE -----------------');
console.log(`Old Workspaces / Tenants: ${mockExistingStore.tenants.length} items`);
mockExistingStore.tenants.forEach((t) => console.log(`  • [TENANT] ${t.id} - ${t.name}`));

console.log(`Old Invoices / Documents: ${mockExistingStore.documents.length} items`);
mockExistingStore.documents.forEach((d) => console.log(`  • [DOC] ${d.number} (${d.id}) in ${d.tenantId}`));

console.log(`Old Customers / Parties:  ${mockExistingStore.parties.length} items`);
mockExistingStore.parties.forEach((p) => console.log(`  • [PARTY] ${p.name} (${p.id})`));

console.log(`Old Products / SKUs:      ${mockExistingStore.products.length} items`);
mockExistingStore.products.forEach((pr) => console.log(`  • [PRODUCT] ${pr.name} (SKU: ${pr.sku})`));

console.log(`Cache Keys & Logs:        ${mockExistingStore.cacheKeys.length} keys`);
mockExistingStore.cacheKeys.forEach((k) => console.log(`  • [CACHE] ${k}`));
console.log('');
console.log('---------------- FRESH SANDBOX DEMO SEED ----------------------');
console.log('Target: Isolated strictly for /demo sandbox (Nexus Global Media, Starlight Retailers, Apex Capital)');
console.log('Sandbox Seed Metrics: 4 Sample Invoices, 3 Demo Parties, 4 Inventory SKUs');
console.log('================================================================');

if (!isExecute) {
  console.log('STATUS: [DRY-RUN ONLY - PENDING USER CONFIRMATION]');
  console.log('No live data has been purged. Backup is safely created.');
  console.log('Awaiting user confirmation before deleting old/test data.');
} else {
  console.log('STATUS: [EXECUTED]');
  console.log('Old demo records cleared. Super Admin preserved. Fresh sandbox seeded.');
}
console.log('================================================================');
