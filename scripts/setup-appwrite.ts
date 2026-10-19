import * as nodeAppwrite from 'node-appwrite';
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(filePath: string) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    content.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
}

loadEnvFile(path.resolve(process.cwd(), '.env.local'));
loadEnvFile(path.resolve(process.cwd(), '.env'));

const ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1';
const PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || process.env.APPWRITE_PROJECT_ID || '';
const API_KEY = process.env.APPWRITE_API_KEY || '';
const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || process.env.APPWRITE_DATABASE_ID || 'invoxa_main';
const BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_BUCKET_ID || process.env.APPWRITE_BUCKET_ID || 'invoxa_assets';

async function main() {
  console.log('='.repeat(70));
  console.log('INVOXA APPWRITE DATABASE & STORAGE PROVISIONING SCRIPT');
  console.log('='.repeat(70));

  if (!PROJECT_ID || !API_KEY) {
    console.error('❌ Error: APPWRITE_PROJECT_ID or APPWRITE_API_KEY is not set.');
    console.error('Please configure your credentials in .env.local or environment:');
    console.error('  NEXT_PUBLIC_APPWRITE_PROJECT_ID=your-project-id');
    console.error('  APPWRITE_API_KEY=your-api-secret-key');
    process.exit(1);
  }

  console.log(`Endpoint:    ${ENDPOINT}`);
  console.log(`Project ID:  ${PROJECT_ID}`);
  console.log(`Database ID: ${DATABASE_ID}`);
  console.log(`Bucket ID:   ${BUCKET_ID}\n`);

  const client = new nodeAppwrite.Client()
    .setEndpoint(ENDPOINT)
    .setProject(PROJECT_ID)
    .setKey(API_KEY);

  const databases = new nodeAppwrite.Databases(client);
  const storage = new nodeAppwrite.Storage(client);

  // 1. Ensure Database exists
  try {
    await databases.get(DATABASE_ID);
    console.log(`✓ Database "${DATABASE_ID}" already exists.`);
  } catch (err: any) {
    if (err?.code === 404) {
      console.log(`Creating database "${DATABASE_ID}"...`);
      await databases.create(DATABASE_ID, 'Invoxa Main Database');
      console.log(`✓ Database "${DATABASE_ID}" created successfully.`);
    } else {
      throw err;
    }
  }

  // 2. Define collection specifications
  const collections = [
    {
      id: 'tenants',
      name: 'Tenants & Workspaces',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'slug', type: 'string', size: 128, required: true },
        { key: 'ownerUserId', type: 'string', size: 128, required: false },
        { key: 'plan', type: 'string', size: 64, required: true },
        { key: 'isWhiteLabel', type: 'boolean', required: true },
        { key: 'data', type: 'string', size: 65535, required: true },
      ],
      indexes: [
        { key: 'idx_tenant_id', type: 'key', attributes: ['tenantId'] },
        { key: 'idx_slug', type: 'unique', attributes: ['slug'] },
      ],
    },
    {
      id: 'parties',
      name: 'Customers & Vendors',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'partyId', type: 'string', size: 64, required: true },
        { key: 'type', type: 'string', size: 32, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'email', type: 'string', size: 255, required: false },
        { key: 'phone', type: 'string', size: 64, required: false },
        { key: 'taxId', type: 'string', size: 64, required: false },
        { key: 'isArchived', type: 'boolean', required: true },
        { key: 'data', type: 'string', size: 65535, required: true },
      ],
      indexes: [
        { key: 'idx_party_tenant', type: 'key', attributes: ['tenantId'] },
        { key: 'idx_party_id', type: 'key', attributes: ['partyId'] },
        { key: 'idx_party_type', type: 'key', attributes: ['type'] },
      ],
    },
    {
      id: 'products',
      name: 'Products & Inventory Catalog',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'productId', type: 'string', size: 64, required: true },
        { key: 'name', type: 'string', size: 255, required: true },
        { key: 'sku', type: 'string', size: 128, required: true },
        { key: 'barcode', type: 'string', size: 128, required: false },
        { key: 'category', type: 'string', size: 128, required: false },
        { key: 'unitPrice', type: 'float', required: true },
        { key: 'taxRate', type: 'float', required: true },
        { key: 'stockQuantity', type: 'float', required: true },
        { key: 'minStockThreshold', type: 'float', required: true },
        { key: 'isArchived', type: 'boolean', required: true },
        { key: 'data', type: 'string', size: 65535, required: true },
      ],
      indexes: [
        { key: 'idx_prod_tenant', type: 'key', attributes: ['tenantId'] },
        { key: 'idx_prod_sku', type: 'key', attributes: ['sku'] },
      ],
    },
    {
      id: 'documents',
      name: 'Invoices & Financial Documents',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'docId', type: 'string', size: 64, required: true },
        { key: 'documentNumber', type: 'string', size: 128, required: true },
        { key: 'type', type: 'string', size: 64, required: true },
        { key: 'status', type: 'string', size: 64, required: true },
        { key: 'issueDate', type: 'string', size: 64, required: true },
        { key: 'dueDate', type: 'string', size: 64, required: false },
        { key: 'currency', type: 'string', size: 16, required: true },
        { key: 'grandTotal', type: 'float', required: true },
        { key: 'amountPaid', type: 'float', required: true },
        { key: 'balanceDue', type: 'float', required: true },
        { key: 'clientName', type: 'string', size: 255, required: false },
        { key: 'data', type: 'string', size: 65535, required: true },
      ],
      indexes: [
        { key: 'idx_doc_tenant', type: 'key', attributes: ['tenantId'] },
        { key: 'idx_doc_number', type: 'key', attributes: ['documentNumber'] },
        { key: 'idx_doc_type', type: 'key', attributes: ['type'] },
        { key: 'idx_doc_status', type: 'key', attributes: ['status'] },
      ],
    },
    {
      id: 'payments',
      name: 'Payments & Receipts',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'paymentId', type: 'string', size: 64, required: true },
        { key: 'documentId', type: 'string', size: 64, required: true },
        { key: 'amount', type: 'float', required: true },
        { key: 'method', type: 'string', size: 64, required: true },
        { key: 'reference', type: 'string', size: 128, required: false },
        { key: 'timestamp', type: 'string', size: 64, required: true },
        { key: 'status', type: 'string', size: 32, required: true },
      ],
      indexes: [
        { key: 'idx_pay_tenant', type: 'key', attributes: ['tenantId'] },
        { key: 'idx_pay_doc', type: 'key', attributes: ['documentId'] },
      ],
    },
    {
      id: 'brand_settings',
      name: 'Tenant Brand Settings',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'primaryColor', type: 'string', size: 32, required: false },
        { key: 'data', type: 'string', size: 65535, required: true },
      ],
      indexes: [
        { key: 'idx_brand_tenant', type: 'unique', attributes: ['tenantId'] },
      ],
    },
    {
      id: 'audit_logs',
      name: 'Immutable Audit Trail',
      attributes: [
        { key: 'tenantId', type: 'string', size: 64, required: true },
        { key: 'actor', type: 'string', size: 128, required: true },
        { key: 'action', type: 'string', size: 128, required: true },
        { key: 'details', type: 'string', size: 65535, required: true },
        { key: 'timestamp', type: 'string', size: 64, required: true },
      ],
      indexes: [
        { key: 'idx_audit_tenant', type: 'key', attributes: ['tenantId'] },
      ],
    },
  ];

  // 3. Create collections and attributes
  for (const col of collections) {
    try {
      await databases.getCollection(DATABASE_ID, col.id);
      console.log(`✓ Collection "${col.id}" exists.`);
    } catch (err: any) {
      if (err?.code === 404) {
        console.log(`Creating collection "${col.id}" (${col.name})...`);
        await databases.createCollection(DATABASE_ID, col.id, col.name, [
          nodeAppwrite.Permission.read(nodeAppwrite.Role.any()),
          nodeAppwrite.Permission.write(nodeAppwrite.Role.any()),
        ]);
        console.log(`✓ Collection "${col.id}" created.`);

        // Create attributes
        for (const attr of col.attributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                DATABASE_ID,
                col.id,
                attr.key,
                attr.size,
                attr.required
              );
            } else if (attr.type === 'float') {
              await databases.createFloatAttribute(
                DATABASE_ID,
                col.id,
                attr.key,
                attr.required
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                DATABASE_ID,
                col.id,
                attr.key,
                attr.required
              );
            }
          } catch (e: any) {
            console.warn(`  - Warning creating attribute "${attr.key}" on "${col.id}":`, e?.message || e);
          }
        }

        // Wait a moment for attributes to be ready before creating indexes
        await new Promise((r) => setTimeout(r, 1000));

        // Create indexes
        for (const idx of col.indexes) {
          try {
            await databases.createIndex(
              DATABASE_ID,
              col.id,
              idx.key,
              idx.type as any,
              idx.attributes
            );
          } catch (e: any) {
            console.warn(`  - Warning creating index "${idx.key}" on "${col.id}":`, e?.message || e);
          }
        }
      } else {
        throw err;
      }
    }
  }

  // 4. Ensure Storage Bucket exists for Logos and Assets
  try {
    await storage.getBucket(BUCKET_ID);
    console.log(`✓ Storage bucket "${BUCKET_ID}" exists.`);
  } catch (err: any) {
    if (err?.code === 404) {
      console.log(`Creating storage bucket "${BUCKET_ID}"...`);
      await storage.createBucket(
        BUCKET_ID,
        'Invoxa Assets & Documents',
        [
          nodeAppwrite.Permission.read(nodeAppwrite.Role.any()),
          nodeAppwrite.Permission.write(nodeAppwrite.Role.any()),
        ],
        false, // fileSecurity
        true,  // enabled
        10485760, // max 10MB
        ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'application/pdf']
      );
      console.log(`✓ Storage bucket "${BUCKET_ID}" created successfully.`);
    } else {
      throw err;
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('✓ APPWRITE PROVISIONING COMPLETE!');
  console.log('Your Appwrite project is fully configured for Invoxa multi-tenant operations.');
  console.log('='.repeat(70));
}

main().catch((err) => {
  console.error('\n❌ Appwrite provisioning failed:', err);
  process.exit(1);
});
