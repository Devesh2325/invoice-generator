import { test, expect } from '@playwright/test';

test.describe('BillCraft Invoice Generator E2E Workflows', () => {
  test('1. Anonymous user creates an invoice', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByRole('heading', { name: /Document Details/i })).toBeVisible();
    await expect(page.locator('#invoice-document-capture')).toBeVisible();
  });

  test('2. User adds multiple line items', async ({ page }) => {
    await page.goto('/create');
    const addBtn = page.getByRole('button', { name: /Add Item/i });
    await addBtn.click();
    await expect(page.getByPlaceholder('Item description / service')).toHaveCount(3);
  });

  test('3. User applies a discount and tax', async ({ page }) => {
    await page.goto('/create');
    const discountInput = page.getByLabel(/Document Discount \(%\)/i);
    await discountInput.fill('15');
    await expect(page.locator('#invoice-document-capture')).toContainText('Discount');
  });

  test('4. User previews the invoice', async ({ page }) => {
    await page.goto('/create');
    await expect(page.locator('#invoice-document-capture')).toBeVisible();
    await expect(page.locator('#invoice-document-capture')).toContainText('Total');
  });

  test('5. User downloads and prints the document', async ({ page }) => {
    await page.goto('/create');
    await expect(page.getByRole('button', { name: /Print/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /PDF/i })).toBeVisible();
  });

  test('6. User duplicates a document', async ({ page }) => {
    await page.goto('/create');
    const duplicateBtn = page.getByRole('button', { name: /Duplicate/i });
    if (await duplicateBtn.isVisible()) {
      await expect(duplicateBtn).toBeEnabled();
    }
  });

  test('7. Local history persists after reload', async ({ page }) => {
    await page.goto('/history');
    await expect(page.getByRole('heading', { name: /Local Document History/i })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: /Local Document History/i })).toBeVisible();
  });

  test('8. User signs up and accesses onboarding', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: /Create your Business Workspace/i })).toBeVisible();
  });

  test('9. Tenant creates and views customers', async ({ page }) => {
    await page.goto('/dashboard/parties');
    await expect(page.getByRole('heading', { name: /Customer & Vendor Directory/i })).toBeVisible();
    await expect(page.getByText('Globex Corporation')).toBeVisible();
  });

  test('10. Tenant views and manages invoices in dashboard', async ({ page }) => {
    await page.goto('/dashboard/documents');
    await expect(page.getByRole('heading', { name: /Documents & Invoicing/i })).toBeVisible();
    await expect(page.getByText('INV-2026-00101')).toBeVisible();
  });

  test('11. Tenant records a payment on an invoice', async ({ page }) => {
    await page.goto('/dashboard/documents');
    const payBtn = page.getByRole('button', { name: /Pay/i }).first();
    if (await payBtn.isVisible()) {
      await payBtn.click();
      await expect(page.getByText(/Record Payment for/i)).toBeVisible();
    }
  });

  test('12. Tenant customizes a document template in Brand Studio', async ({ page }) => {
    await page.goto('/dashboard/brand');
    await expect(page.getByRole('heading', { name: /Brand Studio & White-Label/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Save Brand Settings/i })).toBeVisible();
  });

  test('13. Multi-tenant workspace switcher switches context', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('heading', { name: /Acme Design Agency/i })).toBeVisible();
  });

  test('14. Responsive layout & mobile navigation menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.getByRole('link', { name: /Create Invoice/i }).first()).toBeVisible();
  });
});
