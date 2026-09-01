'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '@/lib/types';
import StockStatsCards from '@/components/inventory/StockStatsCards';
import InventoryTable from '@/components/inventory/InventoryTable';
import ProductFormModal from '@/components/inventory/ProductFormModal';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';
import { Plus, RefreshCw, Lock } from 'lucide-react';

export default function InventoryPage() {
  const { toast } = useToast();
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products
  const fetchProducts = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
      } else {
        toast(data.error || 'Failed to fetch inventory', 'error');
      }
    } catch (err) {
      toast('Network error loading inventory', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Extract categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return cats.sort();
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        filterCategory === 'All' || p.category === filterCategory;

      let matchesStock = true;
      if (stockFilter === 'low') {
        matchesStock = p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert;
      } else if (stockFilter === 'out') {
        matchesStock = p.stockQuantity === 0;
      }

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [products, searchQuery, filterCategory, stockFilter]);

  // KPI Metrics
  const totalProducts = products.length;
  const totalInventoryValue = products.reduce(
    (sum, p) => sum + p.costPrice * p.stockQuantity,
    0
  );
  const lowStockCount = products.filter(
    (p) => p.stockQuantity > 0 && p.stockQuantity <= p.minStockAlert
  ).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  // Handle Save (Create or Update)
  const handleSaveProduct = async (productData: Partial<Product>): Promise<boolean> => {
    try {
      const isEdit = !!editingProduct;
      const url = isEdit ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      const data = await res.json();
      if (data.success) {
        toast(
          isEdit
            ? `Updated "${productData.name}" successfully!`
            : `Added "${productData.name}" to catalog!`,
          'success'
        );
        fetchProducts();
        return true;
      } else {
        toast(data.error || 'Failed to save product', 'error');
        return false;
      }
    } catch (err: any) {
      toast('Network error saving product', 'error');
      return false;
    }
  };

  // Handle direct stock update
  const handleUpdateStock = async (productId: string, newStock: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, stockQuantity: newStock } : p))
        );
        toast('Stock level updated', 'success');
      } else {
        toast(data.error || 'Failed to update stock', 'error');
      }
    } catch (err) {
      toast('Error updating stock', 'error');
    }
  };

  // Handle stock delta (+1, -1, +5)
  const handleAdjustStockDelta = async (productId: string, delta: number) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDelta: delta }),
      });
      const data = await res.json();
      if (data.success && data.product) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? data.product : p))
        );
        toast(`Adjusted stock by ${delta > 0 ? `+${delta}` : delta}`, 'success');
      } else {
        toast(data.error || 'Failed to adjust stock', 'error');
      }
    } catch (err) {
      toast('Error adjusting stock', 'error');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (productId: string) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
        toast('Product deleted from inventory', 'success');
      } else {
        toast(data.error || 'Failed to delete product', 'error');
      }
    } catch (err) {
      toast('Error deleting product', 'error');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-stone-900 font-display tracking-tight flex items-center gap-2">
            <span>Gift Stock & Inventory</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 font-bold">
              {totalProducts} SKUs
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage boutique items, track low-stock warnings, and update inventory counts.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 transition-colors shadow-2xs"
            title="Refresh Inventory"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-600' : ''}`} />
          </button>

          {isAdmin ? (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsFormOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/25 transition-all font-display"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Gift Item</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-stone-100 border border-stone-200 text-xs text-stone-600 font-medium">
              <Lock className="w-3.5 h-3.5 text-stone-400" />
              <span>Cashier Mode (View Only)</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <StockStatsCards
        totalProducts={totalProducts}
        totalInventoryValue={totalInventoryValue}
        lowStockCount={lowStockCount}
        outOfStockCount={outOfStockCount}
        onFilterAll={() => setStockFilter('all')}
        onFilterLowStock={() => setStockFilter('low')}
        onFilterOutOfStock={() => setStockFilter('out')}
      />

      {/* Inventory Table */}
      <InventoryTable
        products={filteredProducts}
        categories={categories}
        searchQuery={searchQuery}
        onChangeSearchQuery={setSearchQuery}
        filterCategory={filterCategory}
        onChangeFilterCategory={setFilterCategory}
        stockFilter={stockFilter}
        onChangeStockFilter={setStockFilter}
        onEditProduct={(p) => {
          setEditingProduct(p);
          setIsFormOpen(true);
        }}
        onDeleteProduct={handleDeleteProduct}
        onUpdateStock={handleUpdateStock}
        onAdjustStockDelta={handleAdjustStockDelta}
      />

      {/* Product Add / Edit Modal */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
        initialProduct={editingProduct}
      />
    </div>
  );
}
