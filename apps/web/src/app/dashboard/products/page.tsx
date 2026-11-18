'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useTenant } from '@/lib/auth/tenant-context';
import {
  TenantApi,
  ProductCatalogItem,
  StockMovement,
  StockMovementType,
} from '@invoice/api';
import { formatCurrency, SUPPORTED_CURRENCIES } from '@invoice/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { BarcodeVisual, generateValidEan13 } from '@/components/ui/barcode-visual';
import { toast } from '@/components/ui/use-toast';
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
  Printer,
  Copy,
  Check,
  Info,
  Sparkles,
  Layers,
  Briefcase,
  Box,
  Loader2,
} from 'lucide-react';

const PRESET_CATEGORIES = [
  'General',
  'Services',
  'Software & IT',
  'Hardware & Electronics',
  'Consulting',
  'Office Supplies',
  'Retail Goods',
  'Manufacturing',
];

export default function ProductsAndInventoryPage() {
  const { activeTenant, tenantCurrency, tenants, refreshTenants } = useTenant();
  const [products, setProducts] = useState<ProductCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [barcodeLabelModalOpen, setBarcodeLabelModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductCatalogItem | null>(null);

  // Form state for New/Edit Product
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemType, setItemType] = useState<'product' | 'service'>('product');
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
  const [isSaving, setIsSaving] = useState(false);
  const [copiedBarcode, setCopiedBarcode] = useState(false);

  // Stock Adjustment Form
  const [movementType, setMovementType] = useState<StockMovementType>('in');
  const [adjustmentQty, setAdjustmentQty] = useState<number>(10);
  const [adjustmentRef, setAdjustmentRef] = useState('Purchase Order #PO-01');
  const [adjustmentReason, setAdjustmentReason] = useState('Restock from distributor');

  const currencySymbol =
    SUPPORTED_CURRENCIES[tenantCurrency]?.symbol || tenantCurrency;

  const loadProducts = async () => {
    const targetTenantId =
      activeTenant?.id ||
      tenants[0]?.id ||
      (typeof window !== 'undefined' ? window.localStorage.getItem('billcraft_active_tenant_id') : null);

    if (!targetTenantId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const items = await TenantApi.getProducts(targetTenantId);
      setProducts(items);
    } catch (err) {
      console.error('Failed to load products & inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeTenant?.id, tenants]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.hsnCode && p.hsnCode.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

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
        p.unit !== 'hr' &&
        p.category?.toLowerCase() !== 'services' &&
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
    const validEan = generateValidEan13('890');
    setBarcode(validEan);
    toast({
      title: 'Barcode Generated',
      description: `EAN-13 Barcode ${validEan} generated with valid Modulo-10 checksum.`,
    });
  };

  const useSkuAsBarcode = () => {
    if (!sku) {
      const generated = `SKU-${Date.now().toString().slice(-6)}`;
      setSku(generated);
      setBarcode(generated);
    } else {
      setBarcode(sku);
    }
  };

  const handleCopyBarcode = (val: string) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedBarcode(true);
    toast({ title: 'Barcode Copied', description: `${val} copied to clipboard.` });
    setTimeout(() => setCopiedBarcode(false), 2000);
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
      const isService =
        productToEdit.unit === 'hr' ||
        productToEdit.category?.toLowerCase() === 'services' ||
        productToEdit.category?.toLowerCase() === 'consulting';
      setItemType(isService ? 'service' : 'product');
    } else {
      setEditingId(null);
      setName('');
      setCategory('General');
      const randomSku = `SKU-${Date.now().toString().slice(-6)}`;
      setSku(randomSku);
      setBarcode(generateValidEan13('890'));
      setHsnCode('998314');
      setDescription('');
      setUnitPrice(1000);
      setUnit('item');
      setTaxRate(18);
      setTaxInclusive(false);
      setStockQuantity(50);
      setMinStockThreshold(10);
      setItemType('product');
    }
    setCreateModalOpen(true);
  };

  const handleTypeChange = (newType: 'product' | 'service') => {
    setItemType(newType);
    if (newType === 'service') {
      if (unit === 'item' || unit === 'box' || unit === 'kg') {
        setUnit('hr');
      }
      if (category === 'General') {
        setCategory('Services');
      }
    } else {
      if (unit === 'hr') {
        setUnit('item');
      }
      if (category === 'Services') {
        setCategory('General');
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: 'Product Name Required',
        description: 'Please enter a name for the product or service.',
        variant: 'destructive',
      });
      return;
    }

    let targetTenantId =
      activeTenant?.id ||
      tenants[0]?.id ||
      (typeof window !== 'undefined' ? window.localStorage.getItem('billcraft_active_tenant_id') : null);

    // Auto-provision workspace if none is set yet
    if (!targetTenantId) {
      try {
        const fallback = await TenantApi.createTenant({
          id: `tm_${Date.now()}`,
          name: 'My Workspace',
          slug: 'workspace',
          role: 'owner',
          is_domain_verified: false,
          currency: tenantCurrency || 'INR',
        });
        targetTenantId = fallback.id;
        await refreshTenants();
      } catch (err) {
        console.error('Failed to auto-create workspace:', err);
      }
    }

    if (!targetTenantId) {
      toast({
        title: 'Workspace Not Found',
        description: 'Please select an active workspace to save products.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const prodId = editingId || `prod_${Date.now()}`;
      const existing = products.find((p) => p.id === prodId);

      const effectiveStock = itemType === 'service' ? 0 : Number(stockQuantity);
      const effectiveMinStock = itemType === 'service' ? 0 : Number(minStockThreshold);

      const saved: ProductCatalogItem = {
        id: prodId,
        tenantId: targetTenantId,
        name: name.trim(),
        category: category.trim() || 'General',
        sku: sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        barcode: barcode.trim() || undefined,
        hsnCode: hsnCode.trim() || undefined,
        description: description.trim(),
        unitPrice: Number(unitPrice) || 0,
        unit: unit || 'item',
        taxRate: Number(taxRate) || 0,
        taxInclusive,
        stockQuantity: effectiveStock,
        minStockThreshold: effectiveMinStock,
        isArchived: false,
        stockMovements: existing?.stockMovements || [],
      };

      await TenantApi.saveProduct(targetTenantId, saved);

      toast({
        title: editingId ? 'Product Updated' : 'Product Added to Catalog',
        description: `"${saved.name}" has been successfully saved to your catalog.`,
      });

      setCreateModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      console.error('Failed to save product:', err);
      toast({
        title: 'Save Failed',
        description: err?.message || 'Unable to save product. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleApplyStockAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetTenantId =
      activeTenant?.id ||
      tenants[0]?.id ||
      (typeof window !== 'undefined' ? window.localStorage.getItem('billcraft_active_tenant_id') : null);

    if (!targetTenantId || !selectedProduct) return;

    try {
      await TenantApi.recordStockMovement(targetTenantId, selectedProduct.id, {
        type: movementType,
        quantity: Number(adjustmentQty),
        reference: adjustmentRef,
        reason: adjustmentReason,
      });

      toast({
        title: 'Stock Updated',
        description: `Stock level for "${selectedProduct.name}" updated successfully.`,
      });

      setStockModalOpen(false);
      await loadProducts();
    } catch (err: any) {
      toast({
        title: 'Stock Update Failed',
        description: err?.message || 'Could not record stock movement.',
        variant: 'destructive',
      });
    }
  };

  const openBarcodeLabelModal = (prod: ProductCatalogItem) => {
    setSelectedProduct(prod);
    setBarcodeLabelModalOpen(true);
  };

  const printBarcodeLabel = () => {
    window.print();
  };

  return (
    <>
      <div className="p-6 lg:p-10 space-y-6 max-w-7xl mx-auto w-full">
        {/* Module Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
                Products & Inventory
              </h1>
              <Badge variant="outline" className="text-xs tabular-nums font-bold border-primary text-primary">
                {products.length} Items
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl">
              Manage product catalogs, categories, SKU/barcodes, tax configurations, and stock alerts ({tenantCurrency}).
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
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Catalog Items
                </span>
                <div className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mt-1">
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
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Inventory Valuation
                </span>
                <div className="text-2xl font-semibold text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
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
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Low Stock Alerts
                </span>
                <div className="text-2xl font-semibold text-amber-600 dark:text-amber-400 mt-1">
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
        <div className="space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Scan barcode or search name, SKU, HSN, category..."
                className="pl-9 h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Category Filter Dropdown */}
              <select
                aria-label="Filter by Category"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-2xs cursor-pointer"
              >
                <option value="all">All Categories ({products.length})</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat} ({products.filter((p) => p.category === cat).length})
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

          {/* Quick Category Filter Pills */}
          {categories.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
                <Tag className="h-3 w-3" /> Categories:
              </span>
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                      isSelected
                        ? 'bg-primary text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Product Catalog & Inventory Table */}
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 shadow-xs">
          <table className="w-full min-w-[950px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 min-w-[220px]">Product / Service</th>
                <th className="py-3 px-3 w-36">SKU & Barcode</th>
                <th className="py-3 px-3 w-24">HSN / SAC</th>
                <th className="py-3 px-3 w-28 text-right">Unit Price</th>
                <th className="py-3 px-3 w-24 text-right">Tax Rate</th>
                <th className="py-3 px-4 w-36 text-center">Stock Level</th>
                <th className="py-3 px-4 w-48 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Loading products and inventory records...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="font-semibold text-slate-600 dark:text-slate-300">
                      No products or inventory match the selected filter.
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Click "+ Add Product" above to add items to your catalog.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((prod) => {
                  const stock = Number(prod.stockQuantity) || 0;
                  const threshold = Number(prod.minStockThreshold) || 10;
                  const isService =
                    prod.unit === 'hr' ||
                    prod.category?.toLowerCase() === 'services' ||
                    prod.category?.toLowerCase() === 'consulting';
                  const isLow = !isService && stock <= threshold;

                  return (
                    <tr
                      key={prod.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Category */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                          {isService ? (
                            <Briefcase className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          ) : (
                            <Box className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          )}
                          <span>{prod.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          {prod.category && (
                            <button
                              type="button"
                              onClick={() => setSelectedCategory(prod.category || 'all')}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-primary/50 transition-colors cursor-pointer"
                              title={`Filter by category: ${prod.category}`}
                            >
                              <Tag className="w-2.5 h-2.5 text-primary" /> {prod.category}
                            </button>
                          )}
                          {prod.description && (
                            <span className="text-xs text-slate-400 truncate max-w-xs">
                              {prod.description}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* SKU & Barcode */}
                      <td className="py-3 px-3 tabular-nums">
                        <div className="font-bold text-slate-800 dark:text-slate-200">
                          {prod.sku}
                        </div>
                        {prod.barcode ? (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-500 bg-slate-100 dark:bg-slate-800/70 px-1 py-0.5 rounded border border-slate-200/60 dark:border-slate-700">
                              {prod.barcode}
                            </span>
                            <button
                              type="button"
                              onClick={() => openBarcodeLabelModal(prod)}
                              className="text-slate-400 hover:text-primary transition-colors"
                              title="Print Barcode Label"
                            >
                              <Barcode className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No barcode</span>
                        )}
                      </td>

                      {/* HSN/SAC */}
                      <td className="py-3 px-3 tabular-nums text-slate-700 dark:text-slate-300">
                        {prod.hsnCode || '—'}
                      </td>

                      {/* Unit Price */}
                      <td className="py-3 px-3 text-right tabular-nums font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(prod.unitPrice, tenantCurrency)}
                        <span className="text-xs text-slate-400 font-normal ml-0.5">
                          / {prod.unit}
                        </span>
                      </td>

                      {/* Tax Rate */}
                      <td className="py-3 px-3 text-right tabular-nums text-slate-700 dark:text-slate-300">
                        {prod.taxRate}%
                        {prod.taxInclusive && (
                          <span className="text-xs block text-slate-400">Incl.</span>
                        )}
                      </td>

                      {/* Stock Level with Alert Badge */}
                      <td className="py-3 px-4 text-center">
                        {isService ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                            <Check className="w-3 h-3" /> Service (Unlimited)
                          </div>
                        ) : (
                          <>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border shadow-2xs tabular-nums">
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
                              <span className="text-[11px] text-amber-600 dark:text-amber-400 block mt-0.5 font-semibold">
                                Low stock (&le; {threshold})
                              </span>
                            )}
                          </>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Print Barcode Sticker Button */}
                          {prod.barcode && (
                            <button
                              type="button"
                              onClick={() => openBarcodeLabelModal(prod)}
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                              title="Print Barcode Sticker"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Adjust Stock Button (Physical goods only) */}
                          {!isService && (
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
                          )}

                          {/* History Button */}
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
                            className="h-7 text-xs px-2 cursor-pointer font-semibold text-primary hover:text-primary-hover"
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
            <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-base text-slate-900 dark:text-slate-100">
                    {editingId ? 'Edit Product / Service' : 'Add New Product or Inventory'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure pricing, tax rules, category classification, and inventory barcode.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Product Type Toggle: Physical Good vs Service */}
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                    What type of item are you adding?
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    Services don't deplete physical stock. Physical goods track warehouse inventory.
                  </span>
                </div>
                <div className="flex rounded-lg bg-slate-200 dark:bg-slate-900 p-1 text-xs shrink-0">
                  <button
                    type="button"
                    onClick={() => handleTypeChange('product')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                      itemType === 'product'
                        ? 'bg-white dark:bg-slate-800 text-primary shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Box className="w-3.5 h-3.5" /> Physical Good
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeChange('service')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-bold transition-all ${
                      itemType === 'service'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" /> Service / Digital
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Product or Service Name *
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={itemType === 'service' ? 'e.g. Web Development, Consulting' : 'e.g. Ergonomic Office Chair'}
                      required
                      autoFocus
                    />
                  </div>

                  {/* Category Field with Visual Preset Pills */}
                  <div className="sm:col-span-2 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-slate-700 dark:text-slate-300 block">
                        Category (What is this?)
                      </label>
                      <span className="text-[11px] text-slate-400">
                        Groups items for easy invoice search & reports
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <Input
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        placeholder="e.g. Services, Software, Hardware, Furniture"
                        list="category-suggestions"
                        required
                        className="flex-1"
                      />
                      <datalist id="category-suggestions">
                        {Array.from(new Set([...PRESET_CATEGORIES, ...categories])).map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>
                    </div>

                    {/* Quick Category Selection Pills */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Quick Pick:</span>
                      {PRESET_CATEGORIES.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setCategory(preset)}
                          className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${
                            category === preset
                              ? 'bg-primary text-white border-primary font-bold'
                              : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      SKU (Stock Keeping Unit) *
                    </label>
                    <Input
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. WB-11 or CHAIR-BLK"
                      required
                    />
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      HSN / SAC Tax Code
                    </label>
                    <Input
                      value={hsnCode}
                      onChange={(e) => setHsnCode(e.target.value)}
                      placeholder={itemType === 'service' ? 'e.g. 998314' : 'e.g. 940310'}
                    />
                  </div>

                  {/* BARCODE SECTION WITH LIVE VISUAL PREVIEW */}
                  <div className="sm:col-span-2 p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-xs">
                          Barcode (EAN-13 / UPC / Code-128)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Scannable code used by barcode guns and retail scanners to load this item.
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={generateBarcodeValue}
                          className="text-xs px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 font-bold transition-all cursor-pointer"
                        >
                          Generate EAN-13
                        </button>
                        <button
                          type="button"
                          onClick={useSkuAsBarcode}
                          className="text-xs px-2 py-1 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 font-semibold transition-all cursor-pointer"
                        >
                          Use SKU
                        </button>
                      </div>
                    </div>

                    <div className="relative">
                      <Barcode className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        placeholder="e.g. 890123456789 or scan with scanner gun"
                        className="pl-8 tabular-nums font-mono text-xs"
                      />
                    </div>

                    {/* Real Visual Barcode Stripes Render */}
                    {barcode && (
                      <div className="mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg flex items-center justify-between gap-4">
                        <div className="flex-1 overflow-x-auto py-1">
                          <BarcodeVisual code={barcode} height={42} moduleWidth={2} showText={true} />
                        </div>
                        <div className="flex flex-col gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleCopyBarcode(barcode)}
                            className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-[11px] font-semibold flex items-center gap-1"
                          >
                            {copiedBarcode ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedBarcode ? 'Copied' : 'Copy'}</span>
                          </button>
                        </div>
                      </div>
                    )}
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
                      <option value="service">service</option>
                      <option value="day">day (days)</option>
                      <option value="month">month</option>
                      <option value="box">box</option>
                      <option value="kg">kg (kilograms)</option>
                      <option value="mtr">mtr (meters)</option>
                      <option value="sqft">sqft (square feet)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Tax Rate (%)
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

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={taxInclusive}
                        onChange={(e) => setTaxInclusive(e.target.checked)}
                        className="rounded border-slate-300 text-primary h-4 w-4"
                      />
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Price includes tax (Tax Inclusive)
                      </span>
                    </label>
                  </div>

                  {/* Stock tracking fields (Disabled / Explained for Services) */}
                  {itemType === 'product' ? (
                    <>
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
                    </>
                  ) : (
                    <div className="sm:col-span-2 p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900 text-xs text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>
                        Service item selected: stock depletion and low stock threshold alerts are disabled.
                      </span>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="font-bold text-slate-700 dark:text-slate-300 block mb-1">
                      Description / Line Item Notes (Optional)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Add detailed scope or product specifications..."
                      rows={2}
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 p-2.5 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCreateModalOpen(false)}
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSaving}
                    className="bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                    <span>{editingId ? 'Update Product' : 'Save to Catalog'}</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: ADJUST STOCK */}
        {stockModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 no-print">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                    Adjust Stock Level
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">
                    {selectedProduct.name} &bull; Current: {selectedProduct.stockQuantity} {selectedProduct.unit}s
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

              <form onSubmit={handleApplyStockAdjustment} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300 block mb-2">
                    Adjustment Type
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMovementType('in')}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                        movementType === 'in'
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4 mx-auto mb-1 text-emerald-600" />
                      Add Stock (+)
                    </button>

                    <button
                      type="button"
                      onClick={() => setMovementType('out')}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                        movementType === 'out'
                          ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <TrendingDown className="h-4 w-4 mx-auto mb-1 text-rose-600" />
                      Deduct (-)
                    </button>

                    <button
                      type="button"
                      onClick={() => setMovementType('adjustment')}
                      className={`p-2.5 rounded-lg border text-center font-bold transition-all ${
                        movementType === 'adjustment'
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
            <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <h3 className="font-semibold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-primary" />
                    Stock Movement History
                  </h3>
                  <p className="text-xs text-slate-500 tabular-nums">
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
                        <div className="text-xs text-slate-500">
                          {move.reference || 'Manual adjustment'} &bull; {move.reason || 'Inventory update'}
                        </div>
                        <div className="text-xs text-slate-400 tabular-nums">
                          {new Date(move.timestamp).toLocaleString()}
                        </div>
                      </div>

                      <div className="text-right tabular-nums shrink-0">
                        <span className="text-slate-400 text-xs">Stock:</span>{' '}
                        <span className="text-slate-500">{move.previousStock}</span> &rarr;{' '}
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

        {/* MODAL 4: PRINTABLE BARCODE STICKER LABEL */}
        {barcodeLabelModalOpen && selectedProduct && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-3 no-print">
                <div className="flex items-center gap-1.5 font-semibold text-sm text-slate-900 dark:text-slate-100">
                  <Barcode className="w-4 h-4 text-primary" />
                  <span>Barcode Label Sticker</span>
                </div>
                <button
                  type="button"
                  onClick={() => setBarcodeLabelModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Printable Sticker Box */}
              <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white text-slate-900 text-center space-y-2 shadow-sm">
                <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {activeTenant?.name || 'Invoicing Studio'}
                </div>
                <div className="font-bold text-sm text-slate-900 leading-tight">
                  {selectedProduct.name}
                </div>
                <div className="text-[11px] text-slate-600 font-mono">
                  SKU: {selectedProduct.sku} {selectedProduct.category ? `&bull; ${selectedProduct.category}` : ''}
                </div>
                <div className="py-2 flex justify-center">
                  <BarcodeVisual
                    code={selectedProduct.barcode || selectedProduct.sku}
                    height={52}
                    moduleWidth={2}
                    barColor="#000000"
                    showText={true}
                  />
                </div>
                <div className="text-sm font-extrabold text-slate-900">
                  {formatCurrency(selectedProduct.unitPrice, tenantCurrency)} / {selectedProduct.unit}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800 no-print">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBarcodeLabelModalOpen(false)}
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={printBarcodeLabel}
                  className="bg-primary hover:bg-primary-hover text-white font-bold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Label Sticker</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
