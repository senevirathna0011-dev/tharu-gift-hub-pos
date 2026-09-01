'use client';

import React, { useState } from 'react';
import { Product } from '@/lib/types';
import { useSettings } from '@/context/SettingsContext';
import { useAuth } from '@/context/AuthContext';
import { 
  Search, 
  AlertTriangle, 
  PackageX, 
  Edit, 
  Trash2, 
  Plus, 
  Minus, 
  Check, 
  Gift,
  Lock,
  Globe,
  EyeOff
} from 'lucide-react';

interface InventoryTableProps {
  products: Product[];
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => Promise<void>;
  onAdjustStockDelta: (productId: string, delta: number) => Promise<void>;
  filterCategory: string;
  onChangeFilterCategory: (cat: string) => void;
  stockFilter: 'all' | 'low' | 'out';
  onChangeStockFilter: (filter: 'all' | 'low' | 'out') => void;
  searchQuery: string;
  onChangeSearchQuery: (query: string) => void;
  categories: string[];
}

export default function InventoryTable({
  products,
  onEditProduct,
  onDeleteProduct,
  onUpdateStock,
  onAdjustStockDelta,
  filterCategory,
  onChangeFilterCategory,
  stockFilter,
  onChangeStockFilter,
  searchQuery,
  onChangeSearchQuery,
  categories,
}: InventoryTableProps) {
  const { formatMoney } = useSettings();
  const { isAdmin } = useAuth();

  const [editingStockId, setEditingStockId] = useState<string | null>(null);
  const [stockInputVal, setStockInputVal] = useState<string>('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleStartStockEdit = (product: Product) => {
    if (!isAdmin) return;
    setEditingStockId(product.id);
    setStockInputVal(String(product.stockQuantity));
  };

  const handleSaveStockEdit = async (productId: string) => {
    const val = parseInt(stockInputVal, 10);
    if (!isNaN(val) && val >= 0) {
      await onUpdateStock(productId, val);
    }
    setEditingStockId(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-stone-200 flex flex-col md:flex-row items-center justify-between gap-4 bg-stone-50/50">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="Search by Name, SKU, or Barcode..."
            className="w-full pl-10 pr-4 py-2 bg-white rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-rose-500 shadow-2xs"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Category Dropdown */}
          <div className="relative">
            <select
              value={filterCategory}
              onChange={(e) => onChangeFilterCategory(e.target.value)}
              className="pl-3 pr-8 py-2 bg-white rounded-xl border border-stone-200 text-xs font-medium focus:outline-hidden focus:border-rose-500 shadow-2xs appearance-none"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Filter Pills */}
          <div className="flex items-center p-1 bg-stone-200/60 rounded-xl text-xs font-semibold">
            <button
              onClick={() => onChangeStockFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                stockFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => onChangeStockFilter('low')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                stockFilter === 'low'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Low Stock</span>
            </button>
            <button
              onClick={() => onChangeStockFilter('out')}
              className={`px-3 py-1 rounded-lg transition-all flex items-center gap-1 ${
                stockFilter === 'out'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <PackageX className="w-3 h-3" />
              <span>Out of Stock</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50/70 text-[11px] font-bold text-stone-500 uppercase tracking-wider">
              <th className="py-3.5 px-4 sm:px-6">Product Details</th>
              <th className="py-3.5 px-4">SKU / Barcode</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4 text-right">Cost</th>
              <th className="py-3.5 px-4 text-right">Selling Price</th>
              <th className="py-3.5 px-4 text-center">Stock Level</th>
              <th className="py-3.5 px-4 text-center">Quick Stock Adjust</th>
              <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-xs">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-stone-400">
                  <div className="flex flex-col items-center justify-center">
                    <Gift className="w-8 h-8 text-stone-300 mb-2" />
                    <p className="font-semibold text-stone-700">No products match your filters</p>
                    <p className="text-stone-400 text-xs mt-0.5">Try resetting search keywords or category.</p>
                  </div>
                </td>
              </tr>
            ) : (
              products.map((product) => {
                const isOutOfStock = product.stockQuantity <= 0;
                const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.minStockAlert;
                const margin = product.sellingPrice > 0
                  ? (((product.sellingPrice - product.costPrice) / product.sellingPrice) * 100).toFixed(0)
                  : '0';

                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-pink-50/20 transition-colors ${
                      isOutOfStock
                        ? 'bg-rose-50/30'
                        : isLowStock
                        ? 'bg-amber-50/20'
                        : ''
                    }`}
                  >
                    {/* Product Name & Thumbnail */}
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-stone-100 overflow-hidden shrink-0 flex items-center justify-center border border-stone-200">
                          {(product.image || product.imageUrl) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={(product.image || product.imageUrl)!}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Gift className="w-5 h-5 text-pink-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-stone-900 line-clamp-1">{product.name}</div>
                          {product.description && (
                            <div className="text-[11px] text-stone-400 line-clamp-1">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-4 font-mono text-stone-600 font-medium">
                      {product.sku}
                    </td>

                    {/* Category & Supplier & Public Status */}
                    <td className="py-3 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700">
                            {product.category}
                          </span>
                          {product.isPublic === false ? (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-stone-100 text-stone-500 text-[9px] font-medium" title="Hidden from customer web catalog">
                              <EyeOff className="w-2.5 h-2.5" />
                              <span>Hidden</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-md bg-pink-50 text-pink-700 text-[9px] font-medium" title="Visible on public catalog (/catalog)">
                              <Globe className="w-2.5 h-2.5" />
                              <span>Catalog</span>
                            </span>
                          )}
                        </div>
                        {product.supplier && (
                          <div className="text-[10px] font-medium text-purple-700 truncate max-w-[140px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="truncate">{product.supplier.company}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Cost */}
                    <td className="py-3 px-4 text-right font-mono text-stone-500">
                      {formatMoney(product.costPrice)}
                    </td>

                    {/* Selling Price & Margin */}
                    <td className="py-3 px-4 text-right">
                      <div className="font-bold font-mono text-stone-900">
                        {formatMoney(product.sellingPrice)}
                      </div>
                      <div className="text-[10px] text-emerald-600 font-semibold">
                        {margin}% margin
                      </div>
                    </td>

                    {/* Stock Level Badge */}
                    <td className="py-3 px-4 text-center">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
                          <PackageX className="w-3 h-3" />
                          0 (Out of stock)
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          {product.stockQuantity} (Low Stock ≤ {product.minStockAlert})
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
                          {product.stockQuantity} in stock
                        </span>
                      )}
                    </td>

                    {/* Quick Inline Stock Modifier */}
                    <td className="py-3 px-4 text-center">
                      {isAdmin ? (
                        <div className="inline-flex items-center gap-1 bg-stone-100 p-1 rounded-xl border border-stone-200">
                          {/* -1 Button */}
                          <button
                            onClick={() => onAdjustStockDelta(product.id, -1)}
                            disabled={product.stockQuantity <= 0}
                            title="Decrease 1"
                            className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed text-stone-700 flex items-center justify-center transition-colors shadow-2xs font-bold text-xs"
                          >
                            <Minus className="w-3 h-3" />
                          </button>

                          {/* Editable Number Input */}
                          {editingStockId === product.id ? (
                            <div className="flex items-center">
                              <input
                                type="number"
                                min="0"
                                value={stockInputVal}
                                onChange={(e) => setStockInputVal(e.target.value)}
                                onBlur={() => handleSaveStockEdit(product.id)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveStockEdit(product.id)}
                                autoFocus
                                className="w-12 text-center py-0.5 bg-white border border-rose-500 rounded font-mono font-bold text-xs"
                              />
                              <button
                                onClick={() => handleSaveStockEdit(product.id)}
                                className="ml-1 p-0.5 text-emerald-600 hover:text-emerald-700"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleStartStockEdit(product)}
                              title="Click to direct edit stock"
                              className="px-2 py-0.5 font-mono font-bold text-xs hover:bg-white rounded transition-colors text-stone-800"
                            >
                              {product.stockQuantity}
                            </button>
                          )}

                          {/* +1 Button */}
                          <button
                            onClick={() => onAdjustStockDelta(product.id, 1)}
                            title="Add 1"
                            className="w-6 h-6 rounded-lg bg-white hover:bg-stone-200 text-stone-700 flex items-center justify-center transition-colors shadow-2xs font-bold text-xs"
                          >
                            <Plus className="w-3 h-3" />
                          </button>

                          {/* +5 Restock Quick Pill */}
                          <button
                            onClick={() => onAdjustStockDelta(product.id, 5)}
                            title="Restock +5"
                            className="px-1.5 py-0.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] transition-colors"
                          >
                            +5
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono font-semibold text-stone-700">
                          {product.stockQuantity} units
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 sm:px-6 text-right">
                      {isAdmin ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onEditProduct(product)}
                            title="Edit product details"
                            className="p-1.5 rounded-lg hover:bg-stone-200 text-stone-600 hover:text-stone-900 transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingId(product.id)}
                            title="Delete product"
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-stone-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-stone-400 italic">Read-only</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-stone-900 text-base font-display">Delete Gift Product?</h4>
            <p className="text-xs text-stone-500 mt-1">
              Are you sure you want to remove this item from your store catalog? This action cannot be undone.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <button
                onClick={() => setDeletingId(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteProduct(deletingId);
                  setDeletingId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-xs font-bold text-white shadow-md shadow-rose-600/20"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
