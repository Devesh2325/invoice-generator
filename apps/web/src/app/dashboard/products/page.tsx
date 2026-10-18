'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi, ProductCatalogItem } from '@invoice/api';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search } from 'lucide-react';

export default function TenantProductsPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(1000);
  const [unit, setUnit] = useState('item');
  const [taxRate, setTaxRate] = useState<number>(18);

  const currencySymbol =
    SUPPORTED_CURRENCIES[tenantCurrency]?.symbol || tenantCurrency;

  const loadProducts = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const items = await TenantApi.getProducts(activeTenant.id);
      setProducts(items);
    } catch (err) {
      console.error('Failed to load items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTenant]);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !name) return;

    const newProd: ProductCatalogItem = {
      id: `prod_${Date.now()}`,
      tenantId: activeTenant.id,
      name,
      sku: sku || `ITEM-${Date.now().toString().slice(-4)}`,
      description,
      unitPrice: Number(unitPrice),
      unit: unit || 'item',
      taxRate: Number(taxRate),
      isArchived: false,
    };

    await TenantApi.saveProduct(activeTenant.id, newProd);
    setModalOpen(false);
    setName('');
    setSku('');
    setDescription('');
    setUnitPrice(1000);
    await loadProducts();
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Items
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Manage reusable items, services, HSN/SKU codes, default tax rates, and unit prices ({tenantCurrency}).
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Item
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
            <Input
              placeholder="Search items by name, SKU, or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
            Prices displayed in <strong className="text-slate-800 dark:text-slate-200">{tenantCurrency} ({currencySymbol})</strong>
          </div>
        </div>

        {/* Items Table */}
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400 dark:text-slate-500">Loading items...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="h-10 w-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No items added yet</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 max-w-sm mx-auto">
                  Add items and services to quickly populate line items when creating invoices.
                </p>
                <Button
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  className="bg-primary hover:bg-primary-hover text-white text-xs mt-2"
                >
                  Add First Item
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-950/75 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Item Name</th>
                      <th className="py-3 px-4">SKU / HSN</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Unit Price ({tenantCurrency})</th>
                      <th className="py-3 px-4">Tax Rate</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1">{p.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-300">{p.sku}</td>
                        <td className="py-3 px-4 capitalize text-slate-600 dark:text-slate-300">{p.unit}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                          {formatCurrency(p.unitPrice, tenantCurrency)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 tabular-nums">{p.taxRate}%</td>
                        <td className="py-3 px-4">
                          <Badge variant="success" className="text-[10px]">Active</Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal: Add Item */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xl">
              <form onSubmit={handleCreateProduct}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                    <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Add New Item</h3>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Item / Service Name *
                      </label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Cloud Architecture Consulting"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          SKU / HSN Code
                        </label>
                        <Input
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="998314"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Billing Unit
                        </label>
                        <Input
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          placeholder="item, hour, day, month"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Unit Price ({currencySymbol}) *
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          required
                          value={unitPrice}
                          onChange={(e) => setUnitPrice(Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                          Default Tax Rate (%)
                        </label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          max="100"
                          value={taxRate}
                          onChange={(e) => setTaxRate(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Description
                      </label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Detailed scope or specification..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setModalOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      className="bg-primary hover:bg-primary-hover text-white font-semibold"
                    >
                      Save Item
                    </Button>
                  </div>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
