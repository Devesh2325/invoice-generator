'use client';

import React, { useEffect, useState } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import { TenantApi, ProductCatalogItem } from '@invoice/api';
import { formatCurrency } from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Package, Plus, Search, Tag, DollarSign, Percent } from 'lucide-react';

export default function TenantProductsPage() {
  const { activeTenant } = useTenant();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(100);
  const [unit, setUnit] = useState('hour');
  const [taxRate, setTaxRate] = useState<number>(10);

  const loadProducts = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const items = await TenantApi.getProducts(activeTenant.id);
      setProducts(items);
    } catch (err) {
      console.error('Failed to load products:', err);
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
      p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !name) return;

    const newProd: ProductCatalogItem = {
      id: `prod_${Date.now()}`,
      tenantId: activeTenant.id,
      name,
      sku: sku || `SKU-${Date.now().toString().slice(-4)}`,
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
    setUnitPrice(100);
    await loadProducts();
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Products & Services Catalog
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Configure standardized pricing, tax rates, and SKUs for fast document generation.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Add Item / Service
          </Button>
        </div>

        {/* Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex justify-between items-center">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name, SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>
        </div>

        {/* Products Table */}
        <Card className="border-slate-200 bg-white overflow-hidden shadow-xs">
          <CardContent className="p-0">
            {loading ? (
              <div className="p-12 text-center text-xs text-slate-400">Loading catalog items...</div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Package className="h-10 w-10 text-slate-300 mx-auto" />
                <h3 className="text-sm font-bold text-slate-800">No products or services yet</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Add items to your catalog to auto-populate invoices with descriptions and rates.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/75 text-slate-500 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">Name</th>
                      <th className="py-3 px-4">SKU</th>
                      <th className="py-3 px-4">Unit</th>
                      <th className="py-3 px-4">Unit Price</th>
                      <th className="py-3 px-4">Tax Rate</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{p.name}</div>
                          {p.description && (
                            <div className="text-[11px] text-slate-400 line-clamp-1">{p.description}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">{p.sku}</td>
                        <td className="py-3 px-4 capitalize text-slate-600">{p.unit}</td>
                        <td className="py-3 px-4 font-bold text-slate-900 tabular-nums">
                          {formatCurrency(p.unitPrice, 'USD')}
                        </td>
                        <td className="py-3 px-4 text-slate-600 tabular-nums">{p.taxRate}%</td>
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

        {/* Modal: Add Product */}
        {modalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md bg-white border-slate-200 shadow-2xl">
              <form onSubmit={handleCreateProduct}>
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h3 className="font-bold text-base text-slate-900">Add Item to Catalog</h3>
                    <button
                      type="button"
                      onClick={() => setModalOpen(false)}
                      className="text-slate-400 hover:text-slate-600 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Item / Service Name *
                      </label>
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Design Consulting"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          SKU Code
                        </label>
                        <Input
                          value={sku}
                          onChange={(e) => setSku(e.target.value)}
                          placeholder="SRV-01"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Billing Unit
                        </label>
                        <Input
                          value={unit}
                          onChange={(e) => setUnit(e.target.value)}
                          placeholder="hour, day, item"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
                          Unit Price ($) *
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
                        <label className="text-xs font-semibold text-slate-700 block mb-1">
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
                      <label className="text-xs font-semibold text-slate-700 block mb-1">
                        Description
                      </label>
                      <Input
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Short item overview..."
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t">
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
                      Save to Catalog
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
