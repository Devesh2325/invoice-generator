'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { TenantLayout } from '@/components/layout/tenant-layout';
import { useTenant } from '@/lib/auth/tenant-context';
import {
  TenantApi,
  ProductCatalogItem,
  StockMovement,
  StockMovementType,
} from '@invoice/api';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@invoice/core';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Package,
  Plus,
  Search,
  Barcode,
  AlertTriangle,
  History,
  TrendingDown,
  TrendingUp,
  Tag,
  Boxes,
  CheckCircle2,
  SlidersHorizontal,
  X,
  ArrowUpDown,
  FileText,
} from 'lucide-react';

export default function ProductsAndInventoryPage() {
  const { activeTenant, tenantCurrency } = useTenant();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);

  // Form state for New/Edit Product
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('General');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [hsnCode, setHsnCode] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(1000);
  const [unit, setUnit] = useState('item');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [taxInclusive, setTaxInclusive] = useState<boolean>(false);
  const [stockQuantity, setStockQuantity] = useState<number>(50);
  const [minStockThreshold, setMinStockThreshold] = useState<number>(10);

  // Stock Adjustment Form
  const [movementType, setMovementType] = useState<StockMovementType>('in');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentRef, setAdjustmentRef] = useState('Purchase Order #PO-01');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock from distributor');

  const currencySymbol =
    SUPPORTED_CURRENCIES[tenantCurrency]?.symbol || tenantCurrency;

  const loadProducts = async () => {
    if (!activeTenant) return;
    setLoading(true);
    try {
      const items = await TenantApi.getProducts(activeTenant.id);
      setProducts(items);
    } catch (err) {
      console.error('Failed to load products & inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTenant]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.sku.toLowerCase().includes(search.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(search.toLowerCase())) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(search.toLowerCase())) ||
        (p.description && p.description.toLowerCase().includes(search.toLowerCase()));

      const matchesCat =
        selectedCategory === 'all' || p.category === selectedCategory;

      const isLowStock =
        (Number(p.stockQuantity) || 0) <= (Number(p.minStockThreshold) || 10);
      const matchesLowStock = !showLowStockOnly || isLowStock;

      return matchesSearch && matchesCat && matchesLowStock && !p.isArchived;
    });
  }, [products, search, selectedCategory, showLowStockOnly]);

  const lowStockCount = useMemo(() => {
    return products.filter(
      (p) =>
        !p.isArchived &&
        (Number(p.stockQuantity) || 0) <= (Number(p.minStockThreshold) || 10)
    ).length;
  }, [products]);

  const totalInventoryValue = useMemo(() => {
    return products.reduce((acc, p) => {
      if (p.isArchived) return acc;
      return acc + (Number(p.stockQuantity) || 0) * (Number(p.unitPrice) || 0);
    }, 0);
  }, [products]);

  const generateBarcodeValue = () => {
    const random12 = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcode(random12);
  };

  const openCreateModal = (productToEdit?: ProductCatalogItem) => {
    if (productToEdit) {
      setEditingId(productToEdit.id);
      setName(productToEdit.name);
      setCategory(productToEdit.category || 'General');
      setSku(productToEdit.sku);
      setBarcode(productToEdit.barcode || '');
      setHsnCode(productToEdit.hsnCode || '');
      setDescription(productToEdit.description || '');
      setUnitPrice(productToEdit.unitPrice);
      setUnit(productToEdit.unit || 'item');
      setTaxRate(productToEdit.taxRate);
      setTaxInclusive(Boolean(productToEdit.taxInclusive));
      setStockQuantity(productToEdit.stockQuantity ?? 0);
      setMinStockThreshold(productToEdit.minStockThreshold ?? 10);
    } else {
      setEditingId(null);
      setName('');
      setCategory('General');
      const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
      setSku(randomSku);
      setBarcode(`890${Date.now().toString().slice(-9)}`);
      setHsnCode('998314');
      setDescription('');
      setUnitPrice(1000);
      setUnit('item');
      setTaxRate(18);
      setTaxInclusive(false);
      setStockQuantity(50);
      setMinStockThreshold(10);
    }
    setCreateModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !name) return;

    const prodId = editingId || `prod_${Date.now()}`;
    const existing = products.find((p) => p.id === prodId);

    const saved: ProductCatalogItem = {
      id: prodId,
      tenantId: activeTenant.id,
      name,
      category: category || 'General',
      sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: barcode || undefined,
      hsnCode: hsnCode || undefined,
      description,
      unitPrice: Number(unitPrice),
      unit: unit || 'item',
      taxRate: Number(taxRate),
      taxInclusive,
      stockQuantity: Number(stockQuantity),
      minStockThreshold: Number(minStockThreshold),
      isArchived: false,
      stockMovements: existing?.stockMovements || [],
    };

    await TenantApi.saveProduct(activeTenant.id, saved);
    setCreateModalOpen(false);
    await loadProducts();
  };

  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTenant || !selectedProduct) return;

    await TenantApi.recordStockMovement(activeTenant.id, selectedProduct.id, {
      type: movementType,
      quantity: Number(adjustmentQty),
      reference: adjustmentRef,
      reason: adjustmentReason,
    });

    setStockModalOpen(false);
    await loadProducts();
  };

  return (
    <TenantLayout>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Products & Inventory
              </h1>
              <Badge variant="outline" className="text-xs font-mono font-bold border-primary text-primary">
                {products.length} Items
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Manage catalogs, barcode/SKUs, tax configurations and monitor stock thresholds ({tenantCurrency}).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => openCreateModal()}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Add Product
            </Button>
          </div>
        </div>

        {/* Inventory KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Catalog Items
                </span>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                  {products.length}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Boxes className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Total Inventory Valuation
                </span>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
                  {formatCurrency(totalInventoryValue, tenantCurrency)}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </Card>

          <Card
            onClick={() => setShowLowStockOnly((prev) => !prev)}
            className={`p-4 border shadow-xs cursor-pointer transition-all ${
              showLowStockOnly
                ? 'bg-amber-100/60 border-amber-400 dark:bg-amber-950/50 dark:border-amber-700'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Low Stock Threshold Alerts
                </span>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
                  {lowStockCount} {lowStockCount === 1 ? 'Item' : 'Items'}
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product name, SKU, barcode, HSN..."
              className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category Filter */}
            <select
              aria-label="Filter by Category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
            >
              <option value="all">All Categories ({products.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Low stock toggle */}
            <Button
              variant={showLowStockOnly ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowLowStockOnly((prev) => !prev)}
              className={`text-xs font-semibold h-9 ${
                showLowStockOnly ? 'bg-amber-600 hover:bg-amber-700 text-white' : ''
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              {showLowStockOnly ? 'Showing Low Stock' : 'Low Stock Filter'}
            </Button>
          </div>
        </div>

        {/* Product Catalog & Inventory Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full min-w-[950px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 uppercase tracking-wider text-[10px] font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 min-w-[220px]">Product / Service</th>
                <th className="py-3 px-3 w-32">SKU & Barcode</th>
                <th className="py-3 px-3 w-24">HSN / SAC</th>
                <th className="py-3 px-3 w-28 text-right">Unit Price</th>
                <th className="py-3 px-3 w-24 text-right">Tax Rate</th>
                <th className="py-3 px-4 w-36 text-center">Stock Level</th>
                <th className="py-3 px-4 w-44 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Loading products and inventory records...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No products or inventory match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stock = Number(prod.stockQuantity) || 0;
                  const threshold = Number(prod.minStockThreshold) || 10;
                  const isLow = stock <= threshold;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {prod.category && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              <Tag className="w-2.5 h-2.5" /> {prod.category}
                            </span>
                          )}
                          {prod.description && (
                            <span className="text-[11px] text-slate-400 truncate max-w-xs">
                              {prod.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {prod.sku}
                        </div>
                        {prod.barcode ? (
                          <div className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Barcode className="w-3 h-3" />
                            <span>{prod.barcode}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No barcode</span>
                        )}
                      </td>

                      {/* HSN/SAC */}
                      <td className="py-3 px-3 font-mono text-slate-700 dark:text-slate-300">
                        {prod.hsnCode || '—'}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(prod.unitPrice, tenantCurrency)}
                        <span className="text-[10px] text-slate-400 font-normal ml-0.5">
                          / {prod.unit}
                        </span>
                      </td>

                      {/* Tax Rate */}
                      <td className="py-3 px-3 text-right font-mono text-slate-700 dark:text-slate-300">
                        {prod.taxRate}%
                        {prod.taxInclusive && (
                          <span className="text-[9px] block text-slate-400">Incl.</span>
                        )}
                      </td>

                      {/* Stock Level with Alert Badge */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs font-mono">
                          {isLow ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          )}
                          <span
                            className={
                              isLow
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-emerald-700 dark:text-emerald-300'
                            }
                          >
                            {stock} {prod.unit}s
                          </span>
                        </div>
                        {isLow && (
                          <span className="text-[10px] text-amber-600 dark:text-amber-400 block mt-0.5 font-semibold">
                            Below min ({threshold})
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setStockModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="Adjust Stock (Restock / Deduct)"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setSelectedProduct(prod);
                              setHistoryModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            title="View Stock Movement History"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openCreateModal(prod)}
                            className="h-7 text-xs px-2 cursor-pointer"
                          >
                            Edit
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL 1: ADD OR EDIT PRODUCT */}
        {createModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  {editingId ? 'Edit Product / Service' : 'Add New Product or Inventory'}
                </h3>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Product Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Ergonomic Office Chair"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Category
                    </label>
                    <Input
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Furniture, Software, Consulting"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      SKU (Stock Keeping Unit)
                    </label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. CHAIR-BLK-01"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1 flex items-center justify-between">
                      <span>Barcode (EAN-13 / UPC)</span>
                      <button
                        type="button"
                        onClick={generateBarcodeValue}
                        className="text-primary hover:underline text-[10px] font-bold cursor-pointer"
                      >
                        Generate Barcode
                      </button>
                    </label>
                    <div className="relative">
                      <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="890123456789"
                        className="pl-8 font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      HSN / SAC Code
                    </label>
                    <Input
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      placeholder="e.g. 940310"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Unit Price ({currencySymbol}) *
                    </label>
                    <Input
                      type="number"
                      step="any"
                      min="0"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Measuring Unit
                    </label>
                    <select
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                    >
                      <option value="item">item (pcs)</option>
                      <option value="hr">hr (hours)</option>
                      <option value="box">box</option>
                      <option value="kg">kg (kilograms)</option>
                      <option value="mtr">mtr (meters)</option>
                      <option value="sqft">sqft (square feet)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      GST / Tax Rate (%)
                    </label>
                    <select
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full h-9 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-xs"
                    >
                      <option value={0}>0% (Exempt)</option>
                      <option value={5}>5%</option>
                      <option value={12}>12%</option>
                      <option value={18}>18% (Standard)</option>
                      <option value={28}>28%</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Current Stock Quantity
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Low Stock Threshold Alert
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={minStockThreshold}
                      onChange={(e) => setMinStockThreshold(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white font-bold">
                    {editingId ? 'Update Product' : 'Save to Catalog'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ADJUST STOCK */}
        {stockModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100">
                    Adjust Stock: {selectedProduct.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Current Stock: {selectedProduct.stockQuantity} {selectedProduct.unit}s
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStockModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleApplyStockAdjustment} className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Movement Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('in')}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        movementType === 'in'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      Restock (In)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('out')}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        movementType === 'out'
                          ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <TrendingDown className="h-4 w-4 mx-auto mb-1 text-rose-600" />
                      Damage/Loss
                    </button>
                    <button
                      type="button"
                      onClick={() => setMovementType('adjustment')}
                      className={`p-2 rounded-lg border text-center font-bold cursor-pointer transition-all ${
                        movementType === 'adjustment'
                          ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <SlidersHorizontal className="h-4 w-4 mx-auto mb-1 text-blue-600" />
                      Set Exact
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    {movementType === 'adjustment' ? 'New Exact Quantity' : 'Quantity to Add / Remove'}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(Number(e.target.value))}
                    required
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Reference Document / Note
                  </label>
                  <Input
                    value={adjustmentRef}
                    onChange={(e) => setAdjustmentRef(e.target.value)}
                    placeholder="e.g. PO-8890 or Supplier Batch #12"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Reason
                  </label>
                  <Input
                    value={adjustmentReason}
                    onChange={(e) => setAdjustmentReason(e.target.value)}
                    placeholder="e.g. Received shipment from vendor"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStockModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-primary text-white font-bold">
                    Apply Adjustment
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: STOCK MOVEMENT HISTORY */}
        {historyModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-primary" />
                    Stock Movement History
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {selectedProduct.name} (SKU: {selectedProduct.sku})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2">
                {!selectedProduct.stockMovements || selectedProduct.stockMovements.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No stock movements recorded for this product yet.
                  </div>
                ) : (
                  selectedProduct.stockMovements.map((move) => (
                    <div
                      key={move.id}
                      className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-xs flex items-center justify-between gap-3"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold">
                          {move.type === 'in' ? (
                            <span className="text-emerald-600 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" /> +{move.quantity} Received
                            </span>
                          ) : move.type === 'invoice_deduction' ? (
                            <span className="text-indigo-600 flex items-center gap-1">
                              <FileText className="w-3.5 h-3.5" /> -{move.quantity} Invoiced
                            </span>
                          ) : move.type === 'out' ? (
                            <span className="text-rose-600 flex items-center gap-1">
                              <TrendingDown className="w-3.5 h-3.5" /> -{move.quantity} Deducted
                            </span>
                          ) : (
                            <span className="text-blue-600">
                              Adjusted to {move.newStock}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {move.reference || 'Manual adjustment'} • {move.reason || 'Inventory update'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(move.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right font-mono shrink-0">
                        <span className="text-slate-400 text-[10px]">Stock:</span>{' '}
                        <span className="text-slate-500">{move.previousStock}</span> →{' '}
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {move.newStock}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryModalOpen(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TenantLayout>
  );
}
